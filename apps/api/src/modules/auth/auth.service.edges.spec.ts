import { createHash, createHmac } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';

type Row = Record<string, unknown>;
const USER = new Types.ObjectId().toString();

describe('AuthService uç durumlar', () => {
  const env: Record<string, string> = {
    NODE_ENV: 'test',
    GOOGLE_CLIENT_IDS: 'g-aud',
    APPLE_AUDIENCES: 'app.good',
  };
  const config = { get: (k: string) => env[k] ?? '' };
  const usersService = {
    findOrCreateFromAuth: jest.fn(),
    touchAuthUser: jest.fn(),
  };
  const devicesService = { linkUser: jest.fn() };
  const identityModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };

  let rows: Row[] = [];
  const matches = (row: Row, filter: Row) =>
    Object.entries(filter).every(([k, v]) =>
      v === null ? row[k] == null : `${row[k] as string}` === `${v as string}`,
    );
  const q = <T>(value: T) => ({
    lean: () => ({ exec: () => value }),
    exec: () => value,
  });
  const tokenModel = {
    create: jest.fn((doc: Row) => {
      if (rows.some((r) => r.tokenHash === doc.tokenHash)) {
        throw Object.assign(new Error('E11000'), { code: 11000 });
      }
      const row = { usedAt: null, revokedAt: null, ...doc };
      rows.push(row);
      return { ...row, toObject: () => ({ ...row }) };
    }),
    exists: jest.fn((f: Row) =>
      Promise.resolve(rows.some((r) => matches(r, f)) ? { _id: 'x' } : null),
    ),
    findOne: jest.fn((f: Row) => q(rows.find((r) => matches(r, f)) ?? null)),
    findOneAndUpdate: jest.fn((f: Row, u: { $set: Row }) => {
      const row = rows.find((r) => matches(r, f));
      if (row) Object.assign(row, u.$set);
      return q(row ? { ...row } : null);
    }),
    updateOne: jest.fn(
      (
        f: Row,
        u: { $set?: Row; $setOnInsert?: Row },
        o?: { upsert?: boolean },
      ) => {
        const row = rows.find((r) => matches(r, f));
        if (row && u.$set) Object.assign(row, u.$set);
        if (!row && o?.upsert) rows.push({ ...f, ...u.$setOnInsert });
        return q(null);
      },
    ),
    updateMany: jest.fn((f: Row, u: { $set: Row }) => {
      rows
        .filter((r) => matches(r, f))
        .forEach((r) => Object.assign(r, u.$set));
      return q(null);
    }),
  };

  let svc: AuthService;
  const priv = () =>
    svc as unknown as {
      createRefreshToken: (u: string) => string;
      verifyProviderToken: (p: string, t: string) => Promise<unknown>;
      issueRefreshToken: (u: string, f: string) => Promise<string>;
    };
  const signedToken = (payload: string) => {
    const seg = Buffer.from(payload).toString('base64url');
    const sig = createHmac('sha256', 'local-dev-refresh-secret')
      .update(seg)
      .digest('base64url');
    return `rt.${seg}.${sig}`;
  };

  const seedRow = (t: string, familyId: string) =>
    rows.push({
      tokenHash: createHash('sha256').update(t).digest('hex'),
      userId: new Types.ObjectId(USER),
      familyId,
      usedAt: null,
      revokedAt: null,
    });

  beforeEach(() => {
    rows = [];
    tokenModel.create.mockClear();
    jest.clearAllMocks();
    Object.assign(env, {
      NODE_ENV: 'test',
      GOOGLE_CLIENT_IDS: 'g-aud',
      APPLE_AUDIENCES: 'app.good',
    });
    usersService.touchAuthUser.mockResolvedValue({
      id: USER,
      displayName: 'U',
    });
    devicesService.linkUser.mockResolvedValue(null);
    identityModel.findOne.mockReturnValue(q(null));
    identityModel.findOneAndUpdate.mockReturnValue(q(null));
    identityModel.updateOne.mockReturnValue(q(null));
    usersService.findOrCreateFromAuth.mockResolvedValue({
      _id: new Types.ObjectId(USER),
      displayName: 'U',
      email: 'u@x.co',
    });
    svc = new AuthService(
      usersService as never,
      config as never,
      devicesService as never,
      identityModel as never,
      tokenModel as never,
    );
  });

  const login = (
    over: Record<string, unknown> = {},
    claims: Row = { sub: 's1' },
  ) =>
    svc.verifyProvider({
      provider: 'google',
      platform: 'android',
      idToken: JSON.stringify(claims),
      ...over,
    } as never);

  describe('verifyProvider', () => {
    it('boş idToken 400, bozuk JSON 400, sub değeri olmayan token 401', async () => {
      await expect(login({ idToken: '  ' })).rejects.toMatchObject({
        status: 400,
      });
      await expect(login({ idToken: '{bozuk' })).rejects.toMatchObject({
        status: 400,
      });
      await expect(login({}, { email: 'a@b.co' })).rejects.toMatchObject({
        status: 401,
      });
    });

    it('platform/provider uyumsuzluğu (android+apple) 400; ios+apple geçer', async () => {
      await expect(login({ provider: 'apple' })).rejects.toMatchObject({
        status: 400,
      });
      await expect(
        login({ provider: 'apple', platform: 'ios' }),
      ).resolves.toMatchObject({ isNewUser: true });
    });

    it('cihaz bağlama hatası girişi engellemez; boş deviceId bağlama denemez', async () => {
      devicesService.linkUser.mockRejectedValueOnce(new Error('db'));
      await expect(login({ deviceId: ' dev-1 ' })).resolves.toMatchObject({
        userId: USER,
      });
      expect(devicesService.linkUser).toHaveBeenCalledWith('dev-1', USER);
      devicesService.linkUser.mockClear();
      await login({ deviceId: '   ' });
      expect(devicesService.linkUser).not.toHaveBeenCalled();
    });

    it('bağlı kimlik: isNewUser false ve kimlik e-postası/doğrulama zamanı güncellenir', async () => {
      identityModel.findOne.mockReturnValue(
        q({ _id: 'i1', userId: new Types.ObjectId(USER) }),
      );
      const res = await login({}, { sub: 's1', email: 'new@x.co' });
      expect(res.isNewUser).toBe(false);
      const [, upd] = identityModel.updateOne.mock.calls[0] as [
        unknown,
        { $set: { email: string } },
      ];
      expect(upd.$set.email).toBe('new@x.co');
    });

    it('bağlı kullanıcı çözümlemesinde NotFound dışı hata yutulmaz', async () => {
      identityModel.findOne.mockReturnValue(
        q({ _id: 'i1', userId: new Types.ObjectId(USER) }),
      );
      usersService.touchAuthUser.mockRejectedValueOnce(new Error('db down'));
      await expect(login()).rejects.toThrow('db down');
    });

    it('apple girişinde profil fotoğrafı iletilmez', async () => {
      await login(
        { provider: 'apple', platform: 'ios' },
        { sub: 'a', picture: 'p' },
      );
      expect(usersService.findOrCreateFromAuth).toHaveBeenCalledWith(
        expect.objectContaining({ profileImageUrl: undefined }),
      );
    });
  });

  describe('refresh / logout', () => {
    it('boş token refresh ve logout için 400', async () => {
      await expect(svc.refresh('')).rejects.toMatchObject({ status: 400 });
      await expect(svc.logout('')).rejects.toMatchObject({ status: 400 });
    });

    it('imzalı ama süresi dolmuş / geçersiz kullanıcı kimlikli / bozuk payload token 401', async () => {
      for (const t of [
        signedToken(`${USER}.${Date.now() - 1000}.n`),
        signedToken(`not-an-id.${Date.now() + 100000}.n`),
        signedToken(`${USER}.abc.n`),
        'rt..',
        'x.y.z',
      ]) {
        await expect(svc.refresh(t)).rejects.toMatchObject({ status: 401 });
      }
    });

    it('kullanıcı silinmişse 401 ve aile iptal edilir; başka hata aynen fırlar', async () => {
      const t = priv().createRefreshToken(USER);
      seedRow(t, 'fam');
      usersService.touchAuthUser.mockRejectedValueOnce(new NotFoundException());
      await expect(svc.refresh(t)).rejects.toMatchObject({ status: 401 });
      expect(
        rows.filter((r) => r.familyId === 'fam')[0].revokedAt,
      ).toBeInstanceOf(Date);
      const t2 = priv().createRefreshToken(USER);
      usersService.touchAuthUser.mockRejectedValueOnce(new Error('boom'));
      await expect(svc.refresh(t2)).rejects.toThrow('boom');
    });

    it('göç: kayıtsız eski token kabul edilir; çocuk kullanıldıktan sonra tekrarı 401', async () => {
      const t = signedToken(`${USER}.${Date.now() + 100000}.n`);
      const first = await svc.refresh(t);
      expect(first.refreshToken.startsWith('rt.')).toBe(true);
      await svc.refresh(first.refreshToken);
      await expect(svc.refresh(t)).rejects.toMatchObject({ status: 401 });
    });

    it('göç yarışı (E11000) kaybedeni 401; başka veritabanı hatası fırlar', async () => {
      const t = signedToken(`${USER}.${Date.now() + 100000}.n`);
      tokenModel.create.mockImplementationOnce(() => {
        throw Object.assign(new Error('dup'), { code: 11000 });
      });
      await expect(svc.refresh(t)).rejects.toMatchObject({ status: 401 });
      const t2 = signedToken(`${USER}.${Date.now() + 100000}.m`);
      tokenModel.create.mockImplementationOnce(() => {
        throw new Error('io');
      });
      await expect(svc.refresh(t2)).rejects.toThrow('io');
    });

    describe('kayıp yanıt tekrarı (A-20)', () => {
      const rotate = async () => {
        const t = priv().createRefreshToken(USER);
        seedRow(t, 'fam2');
        const first = await svc.refresh(t);
        return { used: t, first };
      };

      it('çocuk kullanılmadıysa tekrar kabul edilir ve çocuk iptal olur', async () => {
        const { used, first } = await rotate();
        const again = await svc.refresh(used);
        expect(again.refreshToken).not.toBe(first.refreshToken);
        // eski çocuk artık geçersiz
        await expect(svc.refresh(first.refreshToken)).rejects.toMatchObject({
          status: 401,
        });
      });

      it('pencere dışı (60 sn+) tekrar → aile iptal + 401', async () => {
        const { used } = await rotate();
        rows
          .filter((r) => r.familyId === 'fam2')
          .forEach((r) => {
            r.usedAt = new Date(Date.now() - 120_000);
          });
        await expect(svc.refresh(used)).rejects.toMatchObject({ status: 401 });
        expect(
          rows
            .filter((r) => r.familyId === 'fam2')
            .every((r) => r.revokedAt != null),
        ).toBe(true);
      });

      it('çocuk zaten kullanılmışsa (çalıntı) → 401', async () => {
        const { used, first } = await rotate();
        await svc.refresh(first.refreshToken);
        await expect(svc.refresh(used)).rejects.toMatchObject({ status: 401 });
      });
    });

    it('logout: kayıtlı token ailesini iptal eder; sonradan refresh 401', async () => {
      const t = priv().createRefreshToken(USER);
      seedRow(t, 'f1');
      await svc.logout(t);
      expect(rows[0].revokedAt).toBeInstanceOf(Date);
      await expect(svc.refresh(t)).rejects.toMatchObject({ status: 401 });
    });

    it('logout: kayıtsız imzalı eski token iptal kaydı bırakır (göçle geri gelemez); çöp token sessiz', async () => {
      const t = signedToken(`${USER}.${Date.now() + 100000}.n`);
      await svc.logout(t);
      expect(rows).toHaveLength(1);
      expect(rows[0].revokedAt).toBeInstanceOf(Date);
      await expect(svc.refresh(t)).rejects.toMatchObject({ status: 401 });
      await expect(svc.logout('çöp')).resolves.toBeUndefined();
      expect(rows).toHaveLength(1);
    });
  });

  describe('sağlayıcı token doğrulama uçları', () => {
    const realFetch = global.fetch;
    const fetchMock = jest.fn();
    beforeEach(() => {
      fetchMock.mockReset();
      global.fetch = fetchMock as never;
      env.NODE_ENV = 'production';
    });
    afterAll(() => {
      global.fetch = realFetch;
    });
    const b64 = (o: unknown) =>
      Buffer.from(JSON.stringify(o)).toString('base64url');
    const reply = (body: unknown, ok = true) =>
      fetchMock.mockResolvedValue({ ok, json: () => Promise.resolve(body) });
    const exp = () => Math.floor(Date.now() / 1000) + 600;

    it('Google: eksik alanlar → 401; exp sayı olarak da kabul edilir; geçersiz exp metni → 401', async () => {
      reply({ sub: 's', aud: 'g-aud' });
      await expect(
        priv().verifyProviderToken('google', 'x'),
      ).rejects.toMatchObject({ status: 401 });
      reply({ sub: 's', aud: 'g-aud', iss: 'accounts.google.com', exp: exp() });
      await expect(
        priv().verifyProviderToken('google', 'x'),
      ).resolves.toMatchObject({ sub: 's' });
      reply({
        sub: 's',
        aud: 'g-aud',
        iss: 'accounts.google.com',
        exp: 'yarın',
      });
      await expect(
        priv().verifyProviderToken('google', 'x'),
      ).rejects.toMatchObject({ status: 401 });
      reply({ sub: 's', aud: 'g-aud', iss: 'accounts.google.com', exp: {} });
      await expect(
        priv().verifyProviderToken('google', 'x'),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('prod: JSON test token kabul edilmez (Google uç noktasına gider)', async () => {
      reply({}, false);
      await expect(
        priv().verifyProviderToken('google', '{"sub":"x"}'),
      ).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalled();
    });

    it('AUTH_ALLOW_INSECURE_TEST_TOKENS=1 prod’da bile JSON kabul eder', async () => {
      env.AUTH_ALLOW_INSECURE_TEST_TOKENS = '1';
      try {
        await expect(
          priv().verifyProviderToken('google', '{"sub":"x"}'),
        ).resolves.toEqual({ sub: 'x' });
      } finally {
        delete env.AUTH_ALLOW_INSECURE_TEST_TOKENS;
      }
    });

    it('Apple: APPLE_AUDIENCES yok → 500; segment sayısı hatalı → 401; bozuk başlık → 400; alg/kid hatalı → 401', async () => {
      env.APPLE_AUDIENCES = '';
      await expect(
        priv().verifyProviderToken('apple', 'a.b.c'),
      ).rejects.toMatchObject({ status: 500 });
      env.APPLE_AUDIENCES = 'app.good';
      await expect(
        priv().verifyProviderToken('apple', 'a.b'),
      ).rejects.toMatchObject({ status: 401 });
      const p = b64({ sub: 'a' });
      await expect(
        priv().verifyProviderToken(
          'apple',
          `${Buffer.from('xx').toString('base64url')}.${p}.s`,
        ),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        priv().verifyProviderToken('apple', `${b64([1])}.${p}.s`),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        priv().verifyProviderToken(
          'apple',
          `${b64({ alg: 'HS256', kid: 'k' })}.${p}.s`,
        ),
      ).rejects.toMatchObject({ status: 401 });
      await expect(
        priv().verifyProviderToken('apple', `${b64({ alg: 'RS256' })}.${p}.s`),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('Apple: JWKS alınamazsa 401, anahtar listesi bozuksa anahtar bulunamadı 401', async () => {
      const t = `${b64({ alg: 'RS256', kid: 'k' })}.${b64({ sub: 'a' })}.s`;
      reply({}, false);
      await expect(
        priv().verifyProviderToken('apple', t),
      ).rejects.toMatchObject({ status: 401 });
      reply({ keys: 'yok' });
      await expect(
        priv().verifyProviderToken('apple', t),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('yapılandırma', () => {
    it('erişim token süresi ve gizli anahtar yapılandırmadan okunur; geçersiz değer varsayılana düşer', () => {
      const p = svc as unknown as {
        getAccessTokenTtlSeconds: () => number;
        getAccessTokenSecret: () => string;
        getRefreshTokenTtlMs: () => number;
      };
      expect(p.getAccessTokenTtlSeconds()).toBe(900);
      expect(p.getRefreshTokenTtlMs()).toBe(30 * 86400_000);
      env.AUTH_ACCESS_TOKEN_TTL_MINUTES = '5';
      env.AUTH_REFRESH_TOKEN_TTL_DAYS = '7';
      env.AUTH_ACCESS_TOKEN_SECRET = ' s3 ';
      expect(p.getAccessTokenTtlSeconds()).toBe(300);
      expect(p.getRefreshTokenTtlMs()).toBe(7 * 86400_000);
      expect(p.getAccessTokenSecret()).toBe('s3');
      env.AUTH_ACCESS_TOKEN_TTL_MINUTES = '-3';
      expect(p.getAccessTokenTtlSeconds()).toBe(900);
      for (const k of [
        'AUTH_ACCESS_TOKEN_TTL_MINUTES',
        'AUTH_REFRESH_TOKEN_TTL_DAYS',
        'AUTH_ACCESS_TOKEN_SECRET',
      ])
        delete env[k];
    });
  });
});
