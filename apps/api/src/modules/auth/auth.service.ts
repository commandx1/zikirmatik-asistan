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
  createHmac,
  createPublicKey,
  createVerify,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { type Model, Types } from 'mongoose';
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

@Injectable()
export class AuthService {
  private readonly sessionByRefreshToken = new Map<
    string,
    {
      userId: string;
      displayName?: string;
    }
  >();

  private appleKeyCache?: { expiresAt: number; keys: AppleJwk[] };

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectModel(AuthIdentity.name)
    private readonly authIdentityModel: Model<AuthIdentityDocument>,
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
    const refreshToken = this.createRefreshToken(user.id);

    this.sessionByRefreshToken.set(refreshToken, {
      userId: user.id,
      displayName: user.displayName,
    });

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

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    if (!refreshToken) {
      throw new BadRequestException('refreshToken zorunludur.');
    }

    const existing = this.sessionByRefreshToken.get(refreshToken);
    if (existing) {
      this.sessionByRefreshToken.delete(refreshToken);

      const nextRefreshToken = this.createRefreshToken(existing.userId);
      const accessToken = this.createAccessToken(existing.userId);
      this.sessionByRefreshToken.set(nextRefreshToken, existing);

      return {
        userId: existing.userId,
        accessToken,
        refreshToken: nextRefreshToken,
        displayName: existing.displayName,
      };
    }

    const userId = this.parseRefreshTokenUserId(refreshToken);
    if (!userId) {
      throw new UnauthorizedException(
        'Oturum yenilenemedi. Tekrar giriş yapmalısın.',
      );
    }

    const user = await this.usersService.touchAuthUser(userId);
    const accessToken = this.createAccessToken(user.id);
    const nextRefreshToken = this.createRefreshToken(user.id);
    this.sessionByRefreshToken.set(nextRefreshToken, {
      userId: user.id,
      displayName: user.displayName,
    });

    return {
      userId: user.id,
      accessToken,
      refreshToken: nextRefreshToken,
      displayName: user.displayName,
    };
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
        { provider, providerUserId: claims.sub },
        {
          $set: {
            userId: created._id,
            email: claims.email,
            verifiedAt: new Date(),
          },
          $setOnInsert: {
            provider,
            providerUserId: claims.sub,
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
    return (
      this.configService.get<string>('AUTH_ALLOW_INSECURE_TEST_TOKENS') === '1'
    );
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
      (platform === 'ios' && provider !== 'apple') ||
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

  private parseRefreshTokenUserId(refreshToken: string) {
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

    return userId;
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

function signRefreshPayload(payloadSegment: string, secret: string) {
  return createHmac('sha256', secret)
    .update(payloadSegment)
    .digest('base64url');
}
