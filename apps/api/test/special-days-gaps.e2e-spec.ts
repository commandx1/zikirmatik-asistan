import request from 'supertest';
import type { SpecialDayDocument } from '../src/modules/special-days/schemas/special-day.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data } from './helpers/fixtures';

describe('SpecialDays boşlukları (e2e)', () => {
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

  // API-SPD-10
  it('isActive:false kayıt home hero ve upcoming içinde görünmez', async () => {
    const model = t.model<SpecialDayDocument>('SpecialDay');
    const base = {
      type: 'kandil',
      hijriDate: '1448-04-01',
      priority: 50,
    } as const;
    await model.create({
      ...base,
      name: { tr: 'Pasif bugün', en: 'Inactive today' },
      date: '2026-10-01',
      priority: 100,
      isActive: false,
    });
    await model.create({
      ...base,
      name: { tr: 'Pasif yakın', en: 'Inactive soon' },
      date: '2026-10-03',
      isActive: false,
    });
    await model.create({
      ...base,
      name: { tr: 'Aktif', en: 'Active' },
      date: '2026-10-05',
      isActive: true,
    });

    const res = await request(t.http)
      .get('/v1/special-days/home')
      .query({ date: '2026-10-01' })
      .expect(200);
    const body = data<{
      hero: { date: string } | null;
      upcoming: { date: string }[];
    }>(res);
    expect(body.hero?.date).toBe('2026-10-05');
    expect(body.upcoming.map((u) => u.date)).toEqual(['2026-10-05']);
  });
});
