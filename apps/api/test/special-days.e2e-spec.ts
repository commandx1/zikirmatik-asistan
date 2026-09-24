import request from 'supertest';
import type { SpecialDayDocument } from '../src/modules/special-days/schemas/special-day.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('SpecialDays (e2e)', () => {
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

  function seedSpecialDay(
    overrides: Partial<{
      name: { tr: string; en: string };
      type: 'kandil' | 'ramazan' | 'bayram';
      date: string;
      hijriDate: string;
      priority: number;
      isActive: boolean;
    }> = {},
  ) {
    const model = t.model<SpecialDayDocument>('SpecialDay');
    return model.create({
      name: overrides.name ?? { tr: 'Test Günü', en: 'Test Day' },
      type: overrides.type ?? 'kandil',
      date: overrides.date ?? '2026-10-01',
      hijriDate: overrides.hijriDate ?? '1448-04-01',
      priority: overrides.priority ?? 50,
      isActive: overrides.isActive ?? true,
    });
  }

  const ADMIN = { 'x-admin-secret': 'test-admin-secret' }; // setup-env.ts

  async function authHeader() {
    const user = await signIn(t.http, { sub: 'sd-user' });
    return bearer(user.accessToken);
  }

  it('GET list, home?date, :id/detail, :id ve CRUD rotaları çalışır', async () => {
    const auth = await authHeader();
    const doc = await seedSpecialDay();
    const id = doc._id.toString();

    await request(t.http).get('/v1/special-days').set(auth).expect(200);
    await request(t.http)
      .get(`/v1/special-days/${id}/detail`)
      .set(auth)
      .expect(200);
    await request(t.http).get(`/v1/special-days/${id}`).set(auth).expect(200);

    const updateRes = await request(t.http)
      .patch(`/v1/special-days/${id}`)
      .set(ADMIN)
      .send({ priority: 90 })
      .expect(200);
    expect(data<{ priority: number }>(updateRes).priority).toBe(90);

    await request(t.http)
      .delete(`/v1/special-days/${id}`)
      .set(ADMIN)
      .expect(200);
    await request(t.http).get(`/v1/special-days/${id}`).set(auth).expect(404);
  });

  it('home?date=2026-10-01: today tam eşleşen, upcoming priority sırasıyla, geçmiş yok', async () => {
    const auth = await authHeader();
    await seedSpecialDay({ date: '2026-10-01', priority: 100 }); // today
    await seedSpecialDay({ date: '2026-10-05', priority: 90 }); // upcoming #1
    await seedSpecialDay({ date: '2026-10-10', priority: 10 }); // upcoming #2
    await seedSpecialDay({ date: '2026-09-01', priority: 100 }); // geçmiş, hariç

    const res = await request(t.http)
      .get('/v1/special-days/home')
      .query({ date: '2026-10-01' })
      .set(auth)
      .expect(200);

    const body = data<{
      hero: { date: string } | null;
      upcoming: { date: string }[];
    }>(res);
    expect(body.hero?.date).toBe('2026-10-01');
    expect(body.upcoming.map((u) => u.date)).toEqual([
      '2026-10-05',
      '2026-10-10',
    ]);
  });

  it('dateFrom/dateTo filtresi', async () => {
    const auth = await authHeader();
    await seedSpecialDay({ date: '2026-09-01' });
    await seedSpecialDay({ date: '2026-10-01' });
    await seedSpecialDay({ date: '2026-11-01' });

    const res = await request(t.http)
      .get('/v1/special-days')
      .query({ dateFrom: '2026-09-15', dateTo: '2026-10-15' })
      .set(auth)
      .expect(200);

    const items = data<{ date: string }[]>(res);
    expect(items.map((i) => i.date)).toEqual(['2026-10-01']);
  });

  it('date regex dışı → 400', async () => {
    const auth = await authHeader();

    await request(t.http)
      .get('/v1/special-days/home')
      .query({ date: '01-10-2026' })
      .set(auth)
      .expect(400);
  });

  it("yazma rotaları yalnız x-admin-secret ile; kullanıcı token'ı yetmez", async () => {
    const auth = await authHeader();
    const body = {
      name: { tr: 'Sahte Gün', en: 'Fake Day' },
      type: 'kandil',
      date: '2026-12-01',
      hijriDate: '1448-06-01',
    };

    await request(t.http)
      .post('/v1/special-days')
      .set(auth)
      .send(body)
      .expect(401);
    await request(t.http)
      .post('/v1/special-days')
      .set('x-admin-secret', 'wrong')
      .send(body)
      .expect(401);

    const res = await request(t.http)
      .post('/v1/special-days')
      .set(ADMIN)
      .send(body)
      .expect(201);
    const id = data<{ _id: string }>(res)._id;

    await request(t.http)
      .patch(`/v1/special-days/${id}`)
      .set(auth)
      .send({ hijriDate: '1448-06-02' })
      .expect(401);
    await request(t.http)
      .delete(`/v1/special-days/${id}`)
      .set(auth)
      .expect(401);
    await request(t.http)
      .patch(`/v1/special-days/${id}`)
      .set(ADMIN)
      .send({ hijriDate: '1448-06-02' })
      .expect(200);
    await request(t.http)
      .delete(`/v1/special-days/${id}`)
      .set(ADMIN)
      .expect(200);

    // GET'ler hâlâ kullanıcı oturumu ister.
    await request(t.http).get('/v1/special-days').expect(401);
  });
});
