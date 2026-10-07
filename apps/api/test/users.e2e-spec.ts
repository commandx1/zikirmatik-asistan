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

  it('DELETE: AI, kredi, halka üyeliği ve cihaz verisi temizlenir; halka kalır', async () => {
    await request(t.http)
      .post('/v1/devices/register')
      .send({ deviceId: 'e2e-users-7-device', platform: 'ios' })
      .expect(200);
    const me = await signIn(t.http, {
      sub: 'e2e-users-7',
      deviceId: 'e2e-users-7-device',
    });
    const other = new Types.ObjectId();
    const uid = new Types.ObjectId(me.userId);

    const conversationModel = t.model<{ userId: Types.ObjectId }>(
      'AiConversation',
    );
    const walletModel = t.model<{ userId: Types.ObjectId }>('AiCreditWallet');
    const pushModel = t.model<{ deviceId: string }>('PushDispatch');
    const circleModel = t.model<{
      memberIds: Types.ObjectId[];
      creatorId: Types.ObjectId;
    }>('Circle');

    await conversationModel.collection.insertOne({ userId: uid });
    await walletModel.collection.insertOne({ userId: uid });
    await pushModel.collection.insertOne({
      campaignKey: 'winback',
      deviceId: 'e2e-users-7-device',
      dayKey: '2026-09-24',
      sentAt: new Date(),
    });
    const circleId = (
      await circleModel.collection.insertOne({
        creatorId: other,
        memberIds: [other, uid],
      })
    ).insertedId;

    await request(t.http)
      .delete(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);

    expect(await conversationModel.countDocuments({ userId: uid })).toBe(0);
    expect(await walletModel.countDocuments({ userId: uid })).toBe(0);
    expect(
      await pushModel.countDocuments({ deviceId: 'e2e-users-7-device' }),
    ).toBe(0);
    const circle = await circleModel.findById(circleId).lean();
    expect(circle?.memberIds.map(String)).toEqual([String(other)]);
  });

  it('DELETE: A-04 kurucu hesabını silince kuruculuk en eski aktif üyeye geçer; üyesiz halka kapanır', async () => {
    const me = await signIn(t.http, { sub: 'e2e-users-8' });
    const uid = new Types.ObjectId(me.userId);
    const first = new Types.ObjectId();
    const second = new Types.ObjectId();
    const circleModel = t.model<{
      memberIds: Types.ObjectId[];
      creatorId: Types.ObjectId;
      status: string;
    }>('Circle');
    const base = {
      goalCount: 10,
      dhikrId: new Types.ObjectId(),
      status: 'active',
    };
    const withMembers = (
      await circleModel.collection.insertOne({
        ...base,
        code: 'AAAAAAA2',
        creatorId: uid,
        memberIds: [uid, first, second],
      })
    ).insertedId;
    const alone = (
      await circleModel.collection.insertOne({
        ...base,
        code: 'AAAAAAA3',
        creatorId: uid,
        memberIds: [uid],
      })
    ).insertedId;

    await request(t.http)
      .delete(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);

    const transferred = await circleModel.findById(withMembers).lean();
    expect(String(transferred?.creatorId)).toBe(String(first));
    expect(transferred?.status).toBe('active');
    expect(transferred?.memberIds.map(String)).toEqual([
      String(first),
      String(second),
    ]);
    expect((await circleModel.findById(alone).lean())?.status).toBe('closed');
  });

  it('API-USR-10: aynı token ile ikinci DELETE hata vermez (idempotent)', async () => {
    const me = await signIn(t.http, { sub: 'e2e-usr-10' });
    for (let i = 0; i < 2; i++) {
      await request(t.http)
        .delete(`/v1/users/${me.userId}`)
        .set(bearer(me.accessToken))
        .expect(200);
    }
  });

  it('API-USR-11: silme sonrası aynı hesapla giriş → yeni kullanıcı, eski veri yok', async () => {
    const me = await signIn(t.http, { sub: 'e2e-usr-11', email: 'u11@x.com' });
    await t.model('UserDhikr').create({
      userId: new Types.ObjectId(me.userId),
      clientId: 'c-11',
      name: 'Eski',
      target: 33,
    });
    await request(t.http)
      .delete(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);

    const again = await signIn(t.http, {
      sub: 'e2e-usr-11',
      email: 'u11@x.com',
    });
    expect(again.isNewUser).toBe(true);
    expect(again.userId).not.toBe(me.userId);
    expect(
      await t
        .model('UserDhikr')
        .countDocuments({ userId: new Types.ObjectId(again.userId) }),
    ).toBe(0);
  });

  it('API-USR-12: koleksiyon hatasında kullanıcı belgesi kalır, tekrar deneme tamamlar', async () => {
    const me = await signIn(t.http, { sub: 'e2e-usr-12' });
    const oid = new Types.ObjectId(me.userId);
    await t.model('UserDhikr').create({
      userId: oid,
      clientId: 'c-12',
      name: 'X',
      target: 1,
    });
    const streakModel = t.model('Streak');
    const spy = jest
      .spyOn(streakModel, 'deleteMany')
      .mockImplementationOnce(() => Promise.reject(new Error('boom')) as never);
    try {
      await request(t.http)
        .delete(`/v1/users/${me.userId}`)
        .set(bearer(me.accessToken))
        .expect(500);
      expect(await t.model('User').countDocuments({ _id: oid })).toBe(1);
    } finally {
      spy.mockRestore();
    }

    await request(t.http)
      .delete(`/v1/users/${me.userId}`)
      .set(bearer(me.accessToken))
      .expect(200);
    expect(await t.model('User').countDocuments({ _id: oid })).toBe(0);
    expect(await t.model('UserDhikr').countDocuments({ userId: oid })).toBe(0);
  });
});
