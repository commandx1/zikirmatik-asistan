import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  createHash,
  createHmac,
  createPublicKey,
  createVerify,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { type Model, Types } from 'mongoose';
import { DevicesService } from '../devices/devices.service';
import { UsersService } from '../users/users.service';
import type {
  AuthProviderVerifyResponse,
  ClientPlatform,
  RefreshTokenResponse,
} from './auth.types';
import { ProviderVerifyDto } from './dto/provider-verify.dto';
import {
  AuthIdentity,
  type AuthIdentityDocument,
} from './schemas/auth-identity.schema';
import {
  RefreshToken,
  type RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { createAccessToken } from '../../common/auth/access-token';

type ProviderClaims = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  exp?: number;
};

type AppleJwk = {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
};

/** A-20: kullanılmış token'ın kayıp-yanıt tekrarı için izin verilen süre. */
const LOST_ROTATION_GRACE_MS = 60_000;

@Injectable()
export class AuthService {
  private appleKeyCache?: { expiresAt: number; keys: AppleJwk[] };

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly devicesService: DevicesService,
    @InjectModel(AuthIdentity.name)
    private readonly authIdentityModel: Model<AuthIdentityDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async verifyProvider(
    payload: ProviderVerifyDto,
  ): Promise<AuthProviderVerifyResponse> {
    this.validatePlatformProviderPair(payload.platform, payload.provider);

    const claims = await this.verifyProviderToken(
      payload.provider,
      payload.idToken,
    );
    if (!claims.sub) {
      throw new UnauthorizedException(
        'Sağlayıcı kimlik doğrulaması başarısız oldu.',
      );
    }

    const identity = await this.authIdentityModel
      .findOne({ provider: payload.provider, providerUserId: claims.sub })
      .lean()
      .exec();

    const verifiedClaims = claims as ProviderClaims & { sub: string };
    const user = identity
      ? await this.resolveIdentityUser(
          payload.provider,
          verifiedClaims,
          identity,
        )
      : await this.createUserAndLinkIdentity(payload.provider, verifiedClaims);

    if (identity) {
      await this.authIdentityModel
        .updateOne(
          { _id: identity._id },
          { $set: { email: verifiedClaims.email, verifiedAt: new Date() } },
        )
        .exec();
    }

    const accessToken = this.createAccessToken(user.id);
    const refreshToken = await this.issueRefreshToken(user.id, randomUUID());

    // Best effort only: a device linking failure should never block sign-in.
    if (payload.deviceId?.trim()) {
      await this.devicesService
        .linkUser(payload.deviceId.trim(), user.id)
        .catch(() => undefined);
    }

    return {
      userId: user.id,
      accessToken,
      refreshToken,
      displayName: user.displayName,
      isNewUser: !identity,
    };
  }

  private async resolveIdentityUser(
    provider: 'apple' | 'google',
    claims: ProviderClaims & { sub: string },
    identity: Pick<AuthIdentity, 'userId'>,
  ) {
    try {
      return await this.usersService.touchAuthUser(identity.userId.toString(), {
        displayName: claims.name,
        profileImageUrl: provider === 'google' ? claims.picture : undefined,
      });
    } catch (error) {
      // If the linked user document was deleted manually, recover by recreating
      // and relinking the provider identity instead of breaking login.
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      return this.createUserAndLinkIdentity(provider, claims);
    }
  }

  /**
   * A-20: refresh token tek kullanımlık (rotation). Akış:
   * 1. İmza + süre (durumsuz) — geçersiz → 401.
   * 2. Kayıt kullanılmamış/iptal edilmemişse atomik "kullanıldı" işaretlenir,
   *    aynı ailede yeni token verilir.
   * 3. Kayıt yoksa: bu sürümden önce verilmiş (DB'siz) eski token — bir kez
   *    kabul edilip yeni aileye alınır (kurulu uygulamalar oturumdan düşmesin;
   *    eski token'lar en geç TTL'de, 30 günde biter).
   * 4. Kullanılmış token tekrar gelirse: çocuğu HİÇ kullanılmadıysa yanıt
   *    istemciye ulaşmamış sayılır (ağ kopması) → çocuk iptal, yeni çocuk
   *    verilir. Çocuk kullanılmışsa iki taraf aynı aileyi kullanıyor → çalıntı:
   *    aile iptal + 401.
   * Kullanıcı silinmişse 401 + aile iptal (B14).
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    if (!refreshToken) {
      throw new BadRequestException('refreshToken zorunludur.');
    }

    const parsed = this.parseRefreshToken(refreshToken);
    if (!parsed) {
      throw this.sessionExpired();
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const now = new Date();
    let record = await this.refreshTokenModel
      .findOneAndUpdate(
        { tokenHash, usedAt: null, revokedAt: null },
        { $set: { usedAt: now } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!record) {
      record = await this.claimLegacyToken(tokenHash, parsed, now);
    }
    if (!record) {
      record = await this.retryLostRotation(tokenHash, now);
    }
    if (!record) {
      throw this.sessionExpired();
    }

    let user: { id: string; displayName?: string };
    try {
      user = await this.usersService.touchAuthUser(record.userId.toString());
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      await this.revokeFamily(record.familyId);
      throw this.sessionExpired();
    }

    const nextRefreshToken = await this.issueRefreshToken(
      user.id,
      record.familyId,
    );
    await this.refreshTokenModel
      .updateOne(
        { tokenHash },
        { $set: { replacedByHash: hashRefreshToken(nextRefreshToken) } },
      )
      .exec();

    return {
      userId: user.id,
      accessToken: this.createAccessToken(user.id),
      refreshToken: nextRefreshToken,
      displayName: user.displayName,
    };
  }

  /** A-20 çıkış: token'ın ailesini iptal eder. Bilinmeyen/geçersiz token sessizce yok sayılır. */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new BadRequestException('refreshToken zorunludur.');
    }
    const tokenHash = hashRefreshToken(refreshToken);
    const record = await this.refreshTokenModel
      .findOne({ tokenHash })
      .lean()
      .exec();
    if (record) {
      await this.revokeFamily(record.familyId);
      return;
    }

    // Kayıtsız eski token: sonradan göç yolundan kabul edilmesin diye iptal kaydı yaz.
    const parsed = this.parseRefreshToken(refreshToken);
    if (!parsed) return;
    await this.refreshTokenModel
      .updateOne(
        { tokenHash },
        {
          $setOnInsert: {
            userId: new Types.ObjectId(parsed.userId),
            familyId: randomUUID(),
            expiresAt: new Date(parsed.expiresAt),
            revokedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();
  }

  private async issueRefreshToken(userId: string, familyId: string) {
    const refreshToken = this.createRefreshToken(userId);
    const parsed = this.parseRefreshToken(refreshToken);
    await this.refreshTokenModel.create({
      tokenHash: hashRefreshToken(refreshToken),
      userId: new Types.ObjectId(userId),
      familyId,
      expiresAt: new Date(parsed?.expiresAt ?? Date.now()),
    });
    return refreshToken;
  }

  /** Göç: DB'de hiç kaydı olmayan imzalı token tek seferlik kabul edilir (unique tokenHash yarışı tekler). */
  private async claimLegacyToken(
    tokenHash: string,
    parsed: { userId: string; expiresAt: number },
    now: Date,
  ) {
    if (await this.refreshTokenModel.exists({ tokenHash })) return null;
    try {
      const created = await this.refreshTokenModel.create({
        tokenHash,
        userId: new Types.ObjectId(parsed.userId),
        familyId: randomUUID(),
        expiresAt: new Date(parsed.expiresAt),
        usedAt: now,
      });
      return created.toObject();
    } catch (error) {
      if ((error as { code?: unknown }).code === 11000) return null;
      throw error;
    }
  }

  private async retryLostRotation(tokenHash: string, now: Date) {
    const record = await this.refreshTokenModel
      .findOne({ tokenHash })
      .lean()
      .exec();
    if (!record) return null;

    // Kayıp yanıt tekrarı yalnız kısa pencerede: sızan eski bir token'ın günler
    // sonra meşru istemcinin çocuğunu iptal edip oturumu ele geçirmesini önler.
    const withinGrace =
      record.usedAt !== null &&
      record.usedAt !== undefined &&
      now.getTime() - new Date(record.usedAt).getTime() <=
        LOST_ROTATION_GRACE_MS;
    if (!record.revokedAt && withinGrace && record.replacedByHash) {
      const child = await this.refreshTokenModel
        .findOneAndUpdate(
          { tokenHash: record.replacedByHash, usedAt: null, revokedAt: null },
          { $set: { revokedAt: now } },
        )
        .lean()
        .exec();
      if (child) return record;
    }

    await this.revokeFamily(record.familyId);
    return null;
  }

  private async revokeFamily(familyId: string) {
    await this.refreshTokenModel
      .updateMany(
        { familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }

  private sessionExpired() {
    return new UnauthorizedException(
      'Oturum yenilenemedi. Tekrar giriş yapmalısın.',
    );
  }

  private async createUserAndLinkIdentity(
    provider: 'apple' | 'google',
    claims: ProviderClaims & { sub: string },
  ) {
    const created = await this.usersService.findOrCreateFromAuth({
      provider,
      email: claims.email,
      displayName: claims.name,
      profileImageUrl: provider === 'google' ? claims.picture : undefined,
    });

    await this.authIdentityModel
      .findOneAndUpdate(
        { userId: created._id, provider },
        {
          $set: {
            providerUserId: claims.sub,
            email: claims.email,
            verifiedAt: new Date(),
          },
          $setOnInsert: {
            userId: created._id,
            provider,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    return {
      id: created._id.toString(),
      displayName: created.displayName,
      email: created.email,
    };
  }

  private async verifyProviderToken(
    provider: 'apple' | 'google',
    idToken: string,
  ): Promise<ProviderClaims> {
    if (!idToken?.trim()) {
      throw new BadRequestException('Sağlayıcı token alanı boş olamaz.');
    }

    if (this.allowInsecureLocalTokens() && idToken.trim().startsWith('{')) {
      return this.parseJsonClaims(idToken);
    }

    if (provider === 'google') {
      return this.verifyGoogleIdToken(idToken);
    }

    return this.verifyAppleIdToken(idToken);
  }

  private allowInsecureLocalTokens() {
    if (
      this.configService.get<string>('AUTH_ALLOW_INSECURE_TEST_TOKENS') === '1'
    ) {
      return true;
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV');
    return nodeEnv === 'development' || nodeEnv === 'test';
  }

  private parseJsonClaims(rawToken: string): ProviderClaims {
    try {
      return JSON.parse(rawToken) as ProviderClaims;
    } catch {
      throw new BadRequestException('Sağlayıcı token formatı geçersiz.');
    }
  }

  private async verifyGoogleIdToken(idToken: string): Promise<ProviderClaims> {
    const clientIds = this.parseCommaSeparatedEnv('GOOGLE_CLIENT_IDS');
    if (clientIds.length === 0) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_IDS ayarı eksik. API ortam değişkenlerini kontrol et.',
      );
    }

    const endpoint = new URL('https://oauth2.googleapis.com/tokeninfo');
    endpoint.searchParams.set('id_token', idToken);

    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new UnauthorizedException(
        'Google kimlik doğrulaması başarısız oldu.',
      );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const claims: ProviderClaims = {
      sub: asString(payload.sub),
      email: asString(payload.email),
      name: asString(payload.name),
      picture: asString(payload.picture),
      aud: asString(payload.aud),
      iss: asString(payload.iss),
      exp: asEpochNumber(payload.exp),
    };

    if (!claims.sub || !claims.aud || !claims.iss || !claims.exp) {
      throw new UnauthorizedException('Google token içeriği geçersiz.');
    }

    if (!clientIds.includes(claims.aud)) {
      throw new UnauthorizedException('Google token audience geçersiz.');
    }

    if (
      claims.iss !== 'https://accounts.google.com' &&
      claims.iss !== 'accounts.google.com'
    ) {
      throw new UnauthorizedException('Google token issuer geçersiz.');
    }

    if (claims.exp * 1000 <= Date.now()) {
      throw new UnauthorizedException('Google token süresi dolmuş.');
    }

    return claims;
  }

  private async verifyAppleIdToken(idToken: string): Promise<ProviderClaims> {
    const audiences = this.parseCommaSeparatedEnv('APPLE_AUDIENCES');
    if (audiences.length === 0) {
      throw new InternalServerErrorException(
        'APPLE_AUDIENCES ayarı eksik. API ortam değişkenlerini kontrol et.',
      );
    }

    const { headerSegment, payloadSegment, signatureSegment } =
      this.splitJwtSegments(idToken);
    const header = this.parseJsonRecord(this.decodeBase64Url(headerSegment));
    const claims = this.parseJsonClaims(this.decodeBase64Url(payloadSegment));

    const keyId = asString(header.kid);
    const algorithm = asString(header.alg);
    if (!keyId || algorithm !== 'RS256') {
      throw new UnauthorizedException('Apple token başlığı geçersiz.');
    }

    const jwk = await this.findAppleJwkByKid(keyId);
    if (!jwk) {
      throw new UnauthorizedException('Apple doğrulama anahtarı bulunamadı.');
    }

    const signedData = `${headerSegment}.${payloadSegment}`;
    const signature = Buffer.from(signatureSegment, 'base64url');
    const verifier = createVerify('RSA-SHA256');
    verifier.update(signedData);
    verifier.end();

    const isValid = verifier.verify(
      createPublicKey({ key: jwk, format: 'jwk' }),
      signature,
    );
    if (!isValid) {
      throw new UnauthorizedException('Apple token imzası geçersiz.');
    }

    if (!claims.sub || !claims.aud || !claims.iss || !claims.exp) {
      throw new UnauthorizedException('Apple token içeriği geçersiz.');
    }

    if (claims.iss !== 'https://appleid.apple.com') {
      throw new UnauthorizedException('Apple token issuer geçersiz.');
    }

    if (!audiences.includes(claims.aud)) {
      throw new UnauthorizedException('Apple token audience geçersiz.');
    }

    if (claims.exp * 1000 <= Date.now()) {
      throw new UnauthorizedException('Apple token süresi dolmuş.');
    }

    return claims;
  }

  private splitJwtSegments(token: string) {
    const segments = token.split('.');
    if (segments.length !== 3) {
      throw new UnauthorizedException('Sağlayıcı token formatı geçersiz.');
    }

    return {
      headerSegment: segments[0],
      payloadSegment: segments[1],
      signatureSegment: segments[2],
    };
  }

  private decodeBase64Url(value: string) {
    return Buffer.from(value, 'base64url').toString('utf-8');
  }

  private async findAppleJwkByKid(kid: string): Promise<AppleJwk | undefined> {
    const keys = await this.getAppleJwks();
    return keys.find((key) => key.kid === kid);
  }

  private async getAppleJwks(): Promise<AppleJwk[]> {
    const cached = this.appleKeyCache;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.keys;
    }

    const response = await fetch('https://appleid.apple.com/auth/keys');
    if (!response.ok) {
      throw new UnauthorizedException('Apple doğrulama anahtarları alınamadı.');
    }

    const payload = (await response.json()) as { keys?: AppleJwk[] };
    const keys = Array.isArray(payload.keys) ? payload.keys : [];

    this.appleKeyCache = {
      keys,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    return keys;
  }

  private parseCommaSeparatedEnv(key: string) {
    const raw = this.configService.get<string>(key) ?? '';
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private validatePlatformProviderPair(
    platform: ClientPlatform,
    provider: 'apple' | 'google',
  ) {
    if (
      (platform === 'ios' && provider !== 'apple' && provider !== 'google') ||
      (platform === 'android' && provider !== 'google')
    ) {
      throw new BadRequestException('Platform/provider eşleşmesi geçersiz.');
    }
  }

  private createAccessToken(userId: string) {
    return createAccessToken({
      userId,
      secret: this.getAccessTokenSecret(),
      ttlSeconds: this.getAccessTokenTtlSeconds(),
    });
  }

  private createRefreshToken(userId: string) {
    const expiresAtMs = Date.now() + this.getRefreshTokenTtlMs();
    const nonce = randomBytes(12).toString('base64url');
    const payload = `${userId}.${expiresAtMs}.${nonce}`;
    const payloadEncoded = Buffer.from(payload, 'utf-8').toString('base64url');
    const signature = this.signRefreshPayload(payloadEncoded);
    return `rt.${payloadEncoded}.${signature}`;
  }

  private getAccessTokenSecret() {
    const configured = this.configService
      .get<string>('AUTH_ACCESS_TOKEN_SECRET')
      ?.trim();
    if (configured) {
      return configured;
    }

    // Local/dev fallback. Production should provide AUTH_ACCESS_TOKEN_SECRET.
    return 'local-dev-access-secret';
  }

  private getAccessTokenTtlSeconds() {
    const raw = this.configService.get<string>('AUTH_ACCESS_TOKEN_TTL_MINUTES');
    const parsed = Number.parseInt(raw ?? '', 10);
    const ttlMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
    return ttlMinutes * 60;
  }

  private parseRefreshToken(
    refreshToken: string,
  ): { userId: string; expiresAt: number } | null {
    const segments = refreshToken.split('.');
    if (segments.length !== 3 || segments[0] !== 'rt') {
      return null;
    }

    const payloadSegment = segments[1];
    const signatureSegment = segments[2];
    if (!payloadSegment || !signatureSegment) {
      return null;
    }

    const expectedSignature = this.signRefreshPayload(payloadSegment);
    const isValidSignature = safeTimingEqual(
      signatureSegment,
      expectedSignature,
    );
    if (!isValidSignature) {
      return null;
    }

    let payload = '';
    try {
      payload = Buffer.from(payloadSegment, 'base64url').toString('utf-8');
    } catch {
      return null;
    }

    const [rawUserId, rawExpiresAt] = payload.split('.');
    const userId = rawUserId?.trim();
    const expiresAt = Number.parseInt(rawExpiresAt ?? '', 10);

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return null;
    }

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return null;
    }

    return { userId, expiresAt };
  }

  private getRefreshTokenSecret() {
    const configured = this.configService
      .get<string>('AUTH_REFRESH_TOKEN_SECRET')
      ?.trim();
    if (configured) {
      return configured;
    }

    // Local/dev fallback. Production should provide AUTH_REFRESH_TOKEN_SECRET.
    return 'local-dev-refresh-secret';
  }

  private getRefreshTokenTtlMs() {
    const raw = this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_DAYS');
    const parsed = Number.parseInt(raw ?? '', 10);
    const ttlDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    return ttlDays * 24 * 60 * 60 * 1000;
  }

  private signRefreshPayload(payloadSegment: string) {
    return signRefreshPayload(payloadSegment, this.getRefreshTokenSecret());
  }

  private parseJsonRecord(raw: string) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error();
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Sağlayıcı token formatı geçersiz.');
    }
  }
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

function asEpochNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function safeTimingEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function hashRefreshToken(refreshToken: string) {
  return createHash('sha256').update(refreshToken).digest('hex');
}

function signRefreshPayload(payloadSegment: string, secret: string) {
  return createHmac('sha256', secret)
    .update(payloadSegment)
    .digest('base64url');
}
