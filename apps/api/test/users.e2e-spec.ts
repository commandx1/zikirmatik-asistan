import request from 'supertest';
import { Types } from 'mongoose';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('Users (e2e)', () => {
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

  it('GET /v1/users/:id: kendi id 200, başkasının id 403', async () => {
    const me = await signIn(t.http, { sub: 'e2e-users-1' });
    const other = await signIn(t.http, { sub: 'e2e-users-2' });

    await request(t.http)
      .get(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);

    await request(t.http)
      .get(`/v1/users/${other.userId}`)
      .set(bearer(me.accessToken))
      .expect(403);
  });

  it('PATCH /v1/users/:id/preferences: geçerli alan güncellenir, enum dışı değer 400', async () => {
    const me = await signIn(t.http, { sub: 'e2e-users-3' });

    const res = await request(t.http)
      .patch(`/v1/users/${me.userId}/preferences`)
      .set(bearer(me.accessToken))
      .send({ hapticsPattern: 'hafif' })
      .expect(200);
    expect(data<{ hapticsPattern: string }>(res).hapticsPattern).toBe('hafif');

    await request(t.http)
      .patch(`/v1/users/${me.userId}/preferences`)
      .set(bearer(me.accessToken))
      .send({ hapticsPattern: 'not-a-real-pattern' })
      .expect(400);
  });

  it('PATCH /v1/users/:id/onboarding: kayıt yazılır', async () => {
    const me = await signIn(t.http, { sub: 'e2e-users-4' });

    const res = await request(t.http)
      .patch(`/v1/users/${me.userId}/onboarding`)
      .set(bearer(me.accessToken))
      .send({ purpose: 'huzur' })
      .expect(200);
    expect(
      data<{ onboarding: { purpose: string } }>(res).onboarding.purpose,
    ).toBe('huzur');
  });

  it('DELETE /v1/users/:id: kullanıcıya ait koleksiyonlar boşalır (kullanıcı silinir)', async () => {
    const me = await signIn(t.http, { sub: 'e2e-users-5' });
    const userObjectId = new Types.ObjectId(me.userId);

    const userDhikrModel = t.model<{
      userId: Types.ObjectId;
      clientId: string;
      name: string;
      target: number;
    }>('UserDhikr');
    const dhikrLogModel = t.model<{
      userId: Types.ObjectId;
      count: number;
      targetCount: number;
      date: string;
    }>('DhikrLog');
    const userModel = t.model<{ _id: Types.ObjectId }>('User');

    await userDhikrModel.create({
      userId: userObjectId,
      clientId: 'e2e-clientid-1',
      name: 'Test',
      target: 33,
    });
    await dhikrLogModel.create({
      userId: userObjectId,
      count: 33,
      targetCount: 33,
      date: '2026-09-24',
    });

    await request(t.http)
      .delete(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);

    expect(await userDhikrModel.countDocuments({ userId: userObjectId })).toBe(
      0,
    );
    expect(await dhikrLogModel.countDocuments({ userId: userObjectId })).toBe(
      0,
    );
    expect(await userModel.countDocuments({ _id: userObjectId })).toBe(0);
  });

  it('DELETE sonrası kullanıcıya bağlı devices kaydı da silinir', async () => {
    // AuthService.verifyProvider yalnız MEVCUT bir Device belgesini
    // günceller (DevicesService.linkUser upsert yapmaz) — önce cihazı
    // register ediyoruz.
    await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'e2e-users-6-device', platform: 'android' })
      .expect(200);

    const me = await signIn(t.http, {
      sub: 'e2e-users-6',
      deviceId: 'e2e-users-6-device',
    });
    const deviceModel = t.model<{ userId: Types.ObjectId | null }>('Device');
    expect(
      String(
        (await deviceModel.findOne({ deviceId: 'e2e-users-6-device' }).lean())
          ?.userId,
      ),
    ).toBe(me.userId);

    await request(t.http)
      .delete(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);

    expect(
      await deviceModel.countDocuments({ deviceId: 'e2e-users-6-device' }),
    ).toBe(0);
  });
});
