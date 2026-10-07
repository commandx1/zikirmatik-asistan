import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('Auth (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('ilk giriş isNewUser:true, aynı sub ile ikinci giriş isNewUser:false + aynı userId döner', async () => {
    const first = await signIn(t.http, { sub: 'e2e-auth-1', name: 'Test 1' });
    expect(first.isNewUser).toBe(true);

    const second = await signIn(t.http, { sub: 'e2e-auth-1' });
    expect(second.isNewUser).toBe(false);
    expect(second.userId).toBe(first.userId);
  });

  it('android + apple eşleşmesi validatePlatformProviderPair ile 400 döner', async () => {
    const res = await request(t.http)
      .post('/v1/auth/provider/verify')
      .send({
        provider: 'apple',
        platform: 'android',
        idToken: JSON.stringify({ sub: 'e2e-auth-2' }),
        deviceId: 'e2e-device-2',
      })
      .expect(400);
    expect((res.body as { message: string }).message).toMatch(
      /Platform\/provider/,
    );
  });

  it('deviceId eksikse ValidationPipe 400 döner', async () => {
    await request(t.http)
      .post('/v1/auth/provider/verify')
      .send({
        provider: 'google',
        platform: 'android',
        idToken: JSON.stringify({ sub: 'e2e-auth-3' }),
      })
      .expect(400);
  });

  it('bozuk JSON idToken (`{` ile başlar ama parse edilemez) 400 döner', async () => {
    const res = await request(t.http)
      .post('/v1/auth/provider/verify')
      .send({
        provider: 'google',
        platform: 'android',
        idToken: '{not-valid-json',
        deviceId: 'e2e-device-4',
      })
      .expect(400);
    expect((res.body as { message: string }).message).toMatch(
      /token formatı geçersiz/,
    );
  });

  it('POST /v1/auth/refresh: geçerli refresh yeni çift döner, uydurma 401, boş 400', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-5' });

    const refreshed = await request(t.http)
      .post('/v1/auth/refresh')
      .send({ refreshToken: signed.refreshToken })
      .expect(200);
    const body = data<{
      userId: string;
      accessToken: string;
      refreshToken: string;
    }>(refreshed);
    expect(body.userId).toBe(signed.userId);
    // accessToken createAccessToken içinde `iat` saniye çözünürlüklüdür;
    // aynı saniyede üretilen iki token bayt bayt aynı olabilir. refreshToken
    // ise her zaman rastgele bir nonce taşır (createRefreshToken), bu yüzden
    // farklılığı orada doğruluyoruz.
    expect(body.refreshToken).not.toBe(signed.refreshToken);

    await request(t.http)
      .post('/v1/auth/refresh')
      .send({ refreshToken: 'rt.uydurma.deadbeef' })
      .expect(401);

    await request(t.http).post('/v1/auth/refresh').send({}).expect(400);
  });

  it('access token ile korumalı rota: geçerli 200, `Basic xyz` 401, süresi geçmiş token 401', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-6' });
    const path = `/v1/users/${signed.userId}`;

    await request(t.http).get(path).set(bearer(signed.accessToken)).expect(200);

    await request(t.http)
      .get(path)
      .set('Authorization', 'Basic xyz')
      .expect(401);

    // AUTH_ACCESS_TOKEN_TTL_MINUTES=60 (test/setup-env.ts); guard
    // verifyAccessToken içinde `payload.exp <= Math.floor(Date.now()/1000)`
    // kontrolü yapar — saati 61 dakika ileri alarak süre dolmasını simüle
    // ediyoruz.
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 61 * 60 * 1000);
    try {
      await request(t.http)
        .get(path)
        .set(bearer(signed.accessToken))
        .expect(401);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('deviceId verilen girişte Device koleksiyonuna userId bağlanır', async () => {
    // AuthService.verifyProvider yalnız MEVCUT bir Device belgesini
    // günceller (DevicesService.linkUser upsert YAPMAZ) — önce cihazı
    // /v1/devices/register ile oluşturuyoruz, aksi halde bağlama sessizce
    // hiçbir şey yapmaz.
    await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'e2e-auth-7-device', platform: 'android' })
      .expect(200);

    const signed = await signIn(t.http, {
      sub: 'e2e-auth-7',
      deviceId: 'e2e-auth-7-device',
    });

    const deviceModel = t.model<{ userId: unknown; deviceId: string }>(
      'Device',
    );
    const device = await deviceModel
      .findOne({ deviceId: 'e2e-auth-7-device' })
      .lean()
      .exec();
    expect(device).not.toBeNull();
    expect(String(device?.userId)).toBe(signed.userId);
  });
  // ── A-20: refresh rotation + iptal, eski (DB'siz) token göçü, B14 ────────
  const refresh = (refreshToken: string) =>
    request(t.http).post('/v1/auth/refresh').send({ refreshToken });
  const next = async (refreshToken: string) =>
    data<{ refreshToken: string }>(await refresh(refreshToken).expect(200))
      .refreshToken;
  // Bu sürümden önce verilmiş, sunucuda kaydı olmayan imzalı token (setup-env
  // AUTH_REFRESH_TOKEN_SECRET=e2e-refresh) — auth.service createRefreshToken biçimi.
  const legacyToken = (userId: string) => {
    const payload = Buffer.from(
      `${userId}.${Date.now() + 86_400_000}.${randomUUID()}`,
      'utf-8',
    ).toString('base64url');
    const sig = createHmac('sha256', 'e2e-refresh')
      .update(payload)
      .digest('base64url');
    return `rt.${payload}.${sig}`;
  };

  it('A-20/AUTH-16: refresh tek kullanımlık; kullanılmış token tekrar → 401 ve aile iptal', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-rot' });
    const t1 = await next(signed.refreshToken);
    const t2 = await next(t1); // t1 kullanıldı → t0'ın çocuğu kullanılmış

    await refresh(signed.refreshToken).expect(401); // hırsızlık tespiti
    await refresh(t2).expect(401); // aile iptal edildi
  });

  it('A-20: yanıtı kaybolan refresh (çocuk hiç kullanılmadı) tekrar denenebilir', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-lost' });
    await next(signed.refreshToken); // yanıt istemciye ulaşmadı varsay
    const t2 = await next(signed.refreshToken);
    await next(t2);
  });

  it('A-20: kayıp-yanıt tekrarı yalnız kısa pencerede; pencere dışında tekrar → 401 ve aile iptal', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-lost-late' });
    const t1 = await next(signed.refreshToken); // t0 kullanıldı, t1 hiç kullanılmadı
    // t0 iki dakika önce kullanılmış gibi: sızan eski token geç tekrar ediliyor.
    await t
      .model('RefreshToken')
      .updateMany(
        { usedAt: { $ne: null } },
        { $set: { usedAt: new Date(Date.now() - 120_000) } },
      )
      .exec();

    await refresh(signed.refreshToken).expect(401);
    await refresh(t1).expect(401); // aile iptal: saldırgan da meşru istemci de dışarıda
  });

  it('A-20: POST /v1/auth/logout token ailesini iptal eder, idempotent 204', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-logout' });
    const t1 = await next(signed.refreshToken);

    await request(t.http)
      .post('/v1/auth/logout')
      .send({ refreshToken: t1 })
      .expect(204);
    await refresh(t1).expect(401);
    await request(t.http)
      .post('/v1/auth/logout')
      .send({ refreshToken: t1 })
      .expect(204);
    await request(t.http)
      .post('/v1/auth/logout')
      .send({ refreshToken: 'rt.uydurma.deadbeef' })
      .expect(204);
    await request(t.http).post('/v1/auth/logout').send({}).expect(400);
  });

  it('A-20 göç: kayıtsız eski token bir kez kabul edilip aileye döner; tekrar → 401; çıkışta iptal', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-legacy' });
    const legacy = legacyToken(signed.userId);
    const t1 = await next(legacy);
    const t2 = await next(t1);
    await refresh(legacy).expect(401);
    await refresh(t2).expect(401);

    const legacy2 = legacyToken(signed.userId);
    await request(t.http)
      .post('/v1/auth/logout')
      .send({ refreshToken: legacy2 })
      .expect(204);
    await refresh(legacy2).expect(401);
  });

  it("AUTH-17/B14: hesabı silinmiş kullanıcının refresh'i 401 (404 değil)", async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-deleted' });
    await t.model('User').deleteOne({ _id: signed.userId });
    await refresh(signed.refreshToken).expect(401);
    await refresh(legacyToken(signed.userId)).expect(401);
  });

  it('AUTH-15: süresi geçmiş refresh → 401', async () => {
    const signed = await signIn(t.http, { sub: 'e2e-auth-expired' });
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 31 * 24 * 60 * 60 * 1000);
    try {
      await refresh(signed.refreshToken).expect(401);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('API-AUTH-05: idToken boş veya yalnız boşluk → 400', async () => {
    for (const idToken of ['', '   ']) {
      await request(t.http)
        .post('/v1/auth/provider/verify')
        .send({
          provider: 'google',
          platform: 'android',
          idToken,
          deviceId: 'e2e-device-a5',
        })
        .expect(400);
    }
  });

  it('API-AUTH-10: e-postası aynı Google ve Apple girişi aynı kullanıcıya bağlanır', async () => {
    const g = await signIn(t.http, {
      sub: 'g-same-mail',
      email: 'Same@Example.com',
    });
    const a = await signIn(t.http, {
      sub: 'a-same-mail',
      email: 'same@example.com',
      provider: 'apple',
      platform: 'ios',
    });
    expect(a.userId).toBe(g.userId);
    expect(await t.model('User').countDocuments({})).toBe(1);
    expect(await t.model('AuthIdentity').countDocuments({})).toBe(2);
  });

  it('API-AUTH-22: kayıtsız deviceId ile giriş başarılı, cihaz oluşturulmaz', async () => {
    const signed = await signIn(t.http, {
      sub: 'e2e-auth-nodev',
      deviceId: 'never-registered-device',
    });
    expect(signed.userId).toBeTruthy();
    expect(await t.model('Device').countDocuments({})).toBe(0);
  });
});
