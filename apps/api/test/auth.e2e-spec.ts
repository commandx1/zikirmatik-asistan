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
});
