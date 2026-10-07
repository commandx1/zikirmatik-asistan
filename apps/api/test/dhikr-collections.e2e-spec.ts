import request from 'supertest';
import type { Model } from 'mongoose';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import type { DhikrCollectionDocument } from '../src/modules/dhikr-collections/schemas/dhikr-collection.schema';

describe('DhikrCollections (e2e)', () => {
  let t: TestApp;
  let dhikrModel: Model<DhikrDocument>;
  let collectionModel: Model<DhikrCollectionDocument>;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    dhikrModel = t.model<DhikrDocument>('Dhikr');
    collectionModel = t.model<DhikrCollectionDocument>('DhikrCollection');
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('GET /v1/dhikr-collections: yalnız isActive:true koleksiyonları listeler', async () => {
    const dhikrId = await seedDhikr(dhikrModel);
    await collectionModel.create({
      key: 'sabah-koleksiyonu',
      label: { tr: 'Sabah', en: 'Morning' },
      category: 'gunluk',
      dhikrIds: [dhikrId],
      dhikrCount: 1,
      isActive: true,
    });
    await collectionModel.create({
      key: 'pasif-koleksiyon',
      label: { tr: 'Pasif', en: 'Inactive' },
      category: 'gunluk',
      dhikrIds: [],
      dhikrCount: 0,
      isActive: false,
    });

    const res = await request(t.http).get('/v1/dhikr-collections').expect(200);
    const keys = data<Array<{ key: string }>>(res).map((c) => c.key);
    expect(keys).toContain('sabah-koleksiyonu');
    expect(keys).not.toContain('pasif-koleksiyon');
  });

  it('GET /v1/dhikr-collections/:key: detay döner, bilinmeyen key 404 döner', async () => {
    const dhikrId = await seedDhikr(dhikrModel);
    await collectionModel.create({
      key: 'aksam-koleksiyonu',
      label: { tr: 'Akşam', en: 'Evening' },
      category: 'gunluk',
      dhikrIds: [dhikrId],
      dhikrCount: 1,
      isActive: true,
    });

    const res = await request(t.http)
      .get('/v1/dhikr-collections/aksam-koleksiyonu')
      .expect(200);
    const body = data<{ key: string; dhikrs: Array<{ _id: string }> }>(res);
    expect(body.key).toBe('aksam-koleksiyonu');
    expect(body.dhikrs).toHaveLength(1);
    expect(body.dhikrs[0]._id).toBe(dhikrId);

    await request(t.http)
      .get('/v1/dhikr-collections/bilinmeyen-key')
      .expect(404);
  });

  // API-COL-05
  it('detay inaktif/doğrulanmamış zikirleri de döndürür', async () => {
    const inactive = await seedDhikr(dhikrModel, { isActive: false });
    const unverified = await seedDhikr(dhikrModel, { isVerified: false });
    await collectionModel.create({
      key: 'karisik',
      label: { tr: 'Karışık', en: 'Mixed' },
      category: 'gunluk',
      dhikrIds: [inactive, unverified],
      dhikrCount: 2,
      isActive: true,
    });

    const res = await request(t.http)
      .get('/v1/dhikr-collections/karisik')
      .expect(200);
    expect(
      data<{ dhikrs: Array<{ _id: string }> }>(res).dhikrs.map((d) => d._id),
    ).toEqual([inactive, unverified]);
  });

  // API-COL-06
  it('hiçbir koleksiyonda premium kilidi yok (tokensız ve ücretsiz kullanıcı 200)', async () => {
    const dhikrId = await seedDhikr(dhikrModel);
    for (const key of ['k-gunluk', 'k-namaz', 'k-ozel']) {
      await collectionModel.create({
        key,
        label: { tr: key, en: key },
        category: key === 'k-namaz' ? 'namaz' : 'gunluk',
        dhikrIds: [dhikrId],
        dhikrCount: 1,
        isActive: true,
      });
    }
    const me = await signIn(t.http, { sub: 'e2e-col06' });

    for (const key of ['k-gunluk', 'k-namaz', 'k-ozel']) {
      for (const headers of [{}, bearer(me.accessToken)]) {
        const res = await request(t.http)
          .get(`/v1/dhikr-collections/${key}`)
          .set(headers)
          .expect(200);
        expect(JSON.stringify(res.body)).not.toMatch(/premium|locked/i);
      }
    }
  });
});
