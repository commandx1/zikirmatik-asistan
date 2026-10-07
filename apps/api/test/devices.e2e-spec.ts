import request from 'supertest';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data, signIn } from './helpers/fixtures';

describe('Devices (e2e)', () => {
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

  it('POST /v1/devices/register: tokensız 200 ve userId null döner', async () => {
    const res = await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'guest-device-1', platform: 'android' })
      .expect(200);
    expect(data<{ userId: unknown }>(res).userId).toBeNull();
  });

  it('POST /v1/devices/register: geçerli token ile userId bağlanır', async () => {
    const me = await signIn(t.http, { sub: 'e2e-devices-1' });

    const res = await request(t.http)
      .post('/v1/devices/register')
      .set('Authorization', `Bearer ${me.accessToken}`)
      .send({ deviceId: 'linked-device-1', platform: 'android' })
      .expect(200);
    expect(String(data<{ userId: unknown }>(res).userId)).toBe(me.userId);
  });

  it('aynı deviceId ikinci register: tek belge, expoPushToken güncel', async () => {
    await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'repeat-device-1', platform: 'android' })
      .expect(200);

    const second = await request(t.http)
      .post('/v1/devices/register')
      .send({
        deviceId: 'repeat-device-1',
        platform: 'android',
        expoPushToken: 'ExponentPushToken[updated]',
      })
      .expect(200);
    expect(data<{ expoPushToken: string }>(second).expoPushToken).toBe(
      'ExponentPushToken[updated]',
    );

    const deviceModel = t.model('Device');
    expect(
      await deviceModel.countDocuments({ deviceId: 'repeat-device-1' }),
    ).toBe(1);
  });

  it('kısa deviceId (<8 karakter) 400, platform:web 400 döner', async () => {
    await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'short', platform: 'android' })
      .expect(400);

    await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'long-enough-id', platform: 'web' })
      .expect(400);
  });

  it('POST /v1/devices/unlink: userId null olur', async () => {
    const me = await signIn(t.http, { sub: 'e2e-devices-2' });
    await request(t.http)
      .post('/v1/devices/register')
      .set('Authorization', `Bearer ${me.accessToken}`)
      .send({ deviceId: 'unlink-device-1', platform: 'android' })
      .expect(200);

    const res = await request(t.http)
      .post('/v1/devices/unlink')
      .send({ deviceId: 'unlink-device-1' })
      .expect(200);
    expect(data<{ userId: unknown }>(res).userId).toBeNull();
  });

  it('geçersiz token ile register yine 200 döner (optional guard reddetmez)', async () => {
    const res = await request(t.http)
      .post('/v1/devices/register')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ deviceId: 'invalid-token-device', platform: 'android' })
      .expect(200);
    expect(data<{ userId: unknown }>(res).userId).toBeNull();
  });

  // ── QA: DEV-07/08/09/10/11, dil + saat dilimi ────────────────────────────
  type DeviceBody = {
    userId: unknown;
    locale?: string;
    timezone?: string;
    expoPushToken?: string;
    prefs?: Record<string, boolean>;
  };
  const register = (body: Record<string, unknown>, token?: string) => {
    const req = request(t.http).post('/v1/devices/register');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send({ deviceId: 'tz-device-1', platform: 'ios', ...body });
  };

  it('DEV-08: geçerli locale + IANA timezone kaydedilir', async () => {
    const res = await register({
      locale: 'en',
      timezone: 'America/Los_Angeles',
    }).expect(200);
    expect(data<DeviceBody>(res)).toMatchObject({
      locale: 'en',
      timezone: 'America/Los_Angeles',
    });
  });

  it.each([
    ['locale de', { locale: 'de' }],
    ['locale büyük harf', { locale: 'TR' }],
    ['locale sayı', { locale: 1 }],
    ['timezone IANA dışı', { timezone: 'Mars/Olympus' }],
    ['timezone boş olmayan saçma', { timezone: 'istanbul saati' }],
    ['timezone > 64', { timezone: `Europe/${'A'.repeat(70)}` }],
    ['timezone sayı', { timezone: 3 }],
  ])('DEV-08: %s → 400 ve cihaz yazılmaz', async (_name, body) => {
    await register(body).expect(400);
    expect(await t.model('Device').countDocuments({})).toBe(0);
  });

  it('DEV-08: locale/timezone yoksa 200; alanlar boş kalır (okuyan taraf tr/İstanbul varsayar)', async () => {
    const res = await register({}).expect(200);
    const body = data<DeviceBody>(res);
    expect(body.locale).toBeUndefined();
    expect(body.timezone).toBeUndefined();
  });

  it('DEV-08/09: ikinci register locale/timezone günceller; göndermeyen sürüm değeri silmez', async () => {
    await register({ locale: 'tr', timezone: 'Europe/Istanbul' }).expect(200);
    const updated = await register({
      locale: 'en',
      timezone: 'Pacific/Kiritimati',
    }).expect(200);
    expect(data<DeviceBody>(updated)).toMatchObject({
      locale: 'en',
      timezone: 'Pacific/Kiritimati',
    });

    const legacy = await register({ expoPushToken: 'ExponentPushToken[abcd]' });
    expect(data<DeviceBody>(legacy)).toMatchObject({
      locale: 'en',
      timezone: 'Pacific/Kiritimati',
      expoPushToken: 'ExponentPushToken[abcd]',
    });
    expect(await t.model('Device').countDocuments({})).toBe(1);
  });

  it('DEV-10: prefs — verilenler yazılır, verilmeyenler ilk kayıtta true; sonraki register ezmez', async () => {
    const first = await register({ prefs: { friday: false } }).expect(200);
    expect(data<DeviceBody>(first).prefs).toEqual({
      specialDays: true,
      friday: false,
      streak: true,
      badges: true,
    });
    const second = await register({ prefs: { streak: false } }).expect(200);
    expect(data<DeviceBody>(second).prefs).toEqual({
      specialDays: true,
      friday: false,
      streak: false,
      badges: true,
    });
    await register({ prefs: { friday: 'yes' } }).expect(400);
  });

  it('DEV-07: misafir register bağlı cihazın userId’sini silmez', async () => {
    const me = await signIn(t.http, { sub: 'e2e-devices-guest' });
    await register({}, me.accessToken).expect(200);
    const guest = await register({ locale: 'en' }).expect(200);
    expect(String(data<DeviceBody>(guest).userId)).toBe(me.userId);
  });

  it('unlink: userId null olur, cihaz ve locale/timezone silinmez', async () => {
    const me = await signIn(t.http, { sub: 'e2e-devices-unlink' });
    await register(
      { locale: 'en', timezone: 'Europe/Berlin' },
      me.accessToken,
    ).expect(200);
    const res = await request(t.http)
      .post('/v1/devices/unlink')
      .send({ deviceId: 'tz-device-1' })
      .expect(200);
    expect(data<DeviceBody>(res)).toMatchObject({
      userId: null,
      locale: 'en',
      timezone: 'Europe/Berlin',
    });
    expect(await t.model('Device').countDocuments({})).toBe(1);
  });

  it('DEV-11: bilinmeyen deviceId unlink → 200, data null; kısa deviceId → 400', async () => {
    const res = await request(t.http)
      .post('/v1/devices/unlink')
      .send({ deviceId: 'never-registered-1' })
      .expect(200);
    expect(data(res)).toBeNull();
    expect(await t.model('Device').countDocuments({})).toBe(0);
    await request(t.http)
      .post('/v1/devices/unlink')
      .send({ deviceId: 'short' })
      .expect(400);
  });
});
