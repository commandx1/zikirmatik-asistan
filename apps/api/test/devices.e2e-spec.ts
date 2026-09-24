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
});
