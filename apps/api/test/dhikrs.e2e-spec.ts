import request from 'supertest';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { Binary } from 'mongodb';
import {
  bearer,
  data,
  makePremium,
  seedDhikr,
  signIn,
} from './helpers/fixtures';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import type { Model } from 'mongoose';

describe('Dhikrs (e2e)', () => {
  let t: TestApp;
  let dhikrModel: Model<DhikrDocument>;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    dhikrModel = t.model<DhikrDocument>('Dhikr');
    // OpenAI'a gerçek ağ çağrısı yapmadan önce zaman aşımını kısaltır (yalnız
    // bu spec dosyası içinde; helpers/setup-env.ts'e dokunmaz). API anahtarı
    // sahte olduğu için EmbeddingService.embed() null döner ve create/update
    // akışını bloklamaz — bkz. embedding.service.ts yorumu.
    process.env.OPENAI_TIMEOUT_MS = '2000';
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('GET /v1/dhikrs, /verified-active, /lookup, /:id tokensız 200 döner', async () => {
    const id = await seedDhikr(dhikrModel, {
      isVerified: true,
      transliteration: { tr: 'sübhanallah', en: 'subhanallah' },
    });

    const list = await request(t.http).get('/v1/dhikrs').expect(200);
    expect(Array.isArray(data(list))).toBe(true);

    const verifiedActive = await request(t.http)
      .get('/v1/dhikrs/verified-active')
      .expect(200);
    expect(
      (data<Array<{ _id: string }>>(verifiedActive) ?? []).some(
        (d) => d._id === id,
      ),
    ).toBe(true);

    const lookup = await request(t.http)
      .get('/v1/dhikrs/lookup')
      .query({ transliteration: 'sübhanallah' })
      .expect(200);
    expect(data<{ _id: string }>(lookup)._id).toBe(id);

    const byId = await request(t.http).get(`/v1/dhikrs/${id}`).expect(200);
    expect(data<{ _id: string }>(byId)._id).toBe(id);
  });

  it('GET /v1/dhikrs/lookup boş param 400, geçersiz ObjectId 404 döner', async () => {
    await request(t.http).get('/v1/dhikrs/lookup').expect(400);
    await request(t.http)
      .get('/v1/dhikrs/lookup')
      .query({ transliteration: '   ' })
      .expect(400);

    await request(t.http).get('/v1/dhikrs/not-a-valid-object-id').expect(404);
  });

  it('POST/PATCH/DELETE /v1/dhikrs: x-admin-secret yok/yanlış → 401, doğru → başarı', async () => {
    const localized = { tr: 'test-tr', en: 'test-en' };
    const body = {
      nameArabic: 'سبحان الله',
      name: localized,
      transliteration: localized,
      meaning: localized,
      virtue: localized,
      source: localized,
    };
    const ADMIN = { 'x-admin-secret': 'test-admin-secret' }; // setup-env.ts

    await request(t.http).post('/v1/dhikrs').send(body).expect(401);
    await request(t.http)
      .post('/v1/dhikrs')
      .set('x-admin-secret', 'wrong')
      .send(body)
      .expect(401);

    const createRes = await request(t.http)
      .post('/v1/dhikrs')
      .set(ADMIN)
      .send(body)
      .expect(201);
    const created = data<{ _id: string }>(createRes);
    expect(created._id).toBeTruthy();

    await request(t.http)
      .patch(`/v1/dhikrs/${created._id}`)
      .send({ isActive: false })
      .expect(401);
    await request(t.http).delete(`/v1/dhikrs/${created._id}`).expect(401);

    await request(t.http)
      .patch(`/v1/dhikrs/${created._id}`)
      .set(ADMIN)
      .send({ isActive: false })
      .expect(200);
    await request(t.http)
      .delete(`/v1/dhikrs/${created._id}`)
      .set(ADMIN)
      .expect(200);
  });

  const ADMIN = { 'x-admin-secret': 'test-admin-secret' };

  // API-DHK-02
  it('GET /v1/dhikrs filtresiz: inaktif ve doğrulanmamış zikirler de döner; verified-active süzer', async () => {
    const okId = await seedDhikr(dhikrModel, { isVerified: true });
    const inactiveId = await seedDhikr(dhikrModel, {
      isVerified: true,
      isActive: false,
    });
    const unverifiedId = await seedDhikr(dhikrModel, { isVerified: false });

    const all = await request(t.http).get('/v1/dhikrs').expect(200);
    expect(
      data<Array<{ _id: string }>>(all)
        .map((d) => d._id)
        .sort(),
    ).toEqual([okId, inactiveId, unverifiedId].sort());

    const va = await request(t.http)
      .get('/v1/dhikrs/verified-active')
      .expect(200);
    expect(data<Array<{ _id: string }>>(va).map((d) => d._id)).toEqual([okId]);
  });

  // API-DHK-06
  it('hiçbir okuma yanıtında embedding vektörü dönmez', async () => {
    const id = await seedDhikr(dhikrModel, {
      isVerified: true,
      transliteration: { tr: 'embed-tr', en: 'embed-en' },
      embedding: Binary.fromFloat32Array(Float32Array.from([0.1, 0.2, 0.3])),
    });
    expect(
      await dhikrModel.findById(id).select('+embedding').lean(),
    ).toHaveProperty('embedding');

    const paths = [
      '/v1/dhikrs',
      '/v1/dhikrs/verified-active',
      '/v1/dhikrs/lookup?transliteration=embed-tr',
      `/v1/dhikrs/${id}`,
    ];
    for (const path of paths) {
      const res = await request(t.http).get(path).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('"embedding"');
    }
  });

  // API-DHK-11
  it('PATCH/DELETE bilinmeyen id → 404', async () => {
    const unknown = '64b000000000000000000001';
    await request(t.http)
      .patch(`/v1/dhikrs/${unknown}`)
      .set(ADMIN)
      .send({ isActive: false })
      .expect(404);
    await request(t.http)
      .delete(`/v1/dhikrs/${unknown}`)
      .set(ADMIN)
      .expect(404);
  });

  // API-DHK-12
  it('halkanın zikri silinince halka detayı 500 değil, boş adlı anlık görüntü döner', async () => {
    const me = await signIn(t.http, { sub: 'e2e-dhk12' });
    await makePremium(t.model<UserDocument>('User'), me.userId);
    const dhikrId = await seedDhikr(dhikrModel);
    const created = await request(t.http)
      .post('/v1/circles')
      .set(bearer(me.accessToken))
      .send({ dhikrId, goalCount: 100 })
      .expect(201);
    const circleId = data<{ id: string }>(created).id;
    await dhikrModel.deleteOne({ _id: dhikrId });

    const detail = await request(t.http)
      .get(`/v1/circles/${circleId}`)
      .set(bearer(me.accessToken))
      .expect(200);
    expect(data<{ dhikr: { name: unknown } }>(detail).dhikr.name).toEqual({
      tr: '',
      en: '',
    });
    await request(t.http)
      .get('/v1/circles')
      .set(bearer(me.accessToken))
      .expect(200);
  });
});
