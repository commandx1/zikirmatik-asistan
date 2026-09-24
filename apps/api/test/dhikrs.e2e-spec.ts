import request from 'supertest';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data, seedDhikr } from './helpers/fixtures';
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

  // TODO(security): guard eklenince bu test 401 bekleyecek
  it('BULGU: POST/PATCH/DELETE /v1/dhikrs tokensız çalışır (guard yok) — mevcut davranış belgelenir', async () => {
    const localized = { tr: 'test-tr', en: 'test-en' };
    const createRes = await request(t.http)
      .post('/v1/dhikrs')
      .send({
        nameArabic: 'سبحان الله',
        name: localized,
        transliteration: localized,
        meaning: localized,
        virtue: localized,
        source: localized,
      })
      .expect(201);
    const created = data<{ _id: string }>(createRes);
    expect(created._id).toBeTruthy();

    await request(t.http)
      .patch(`/v1/dhikrs/${created._id}`)
      .send({ isActive: false })
      .expect(200);

    await request(t.http).delete(`/v1/dhikrs/${created._id}`).expect(200);
  });
});
