import request from 'supertest';
import { Types } from 'mongoose';
import { atInstant } from './helpers/clock';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';

// Perf: /home içerik alanlarını (article, practices) okumaz. Yanıtın bayt
// bayt aynı kaldığını snapshot ile kilitler (snapshot projection'dan ÖNCE alındı).
describe('SpecialDays home snapshot (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    await clearCollections(t.connection);
    const mk = (
      n: number,
      date: string,
      type: string,
      priority: number,
      extra: Record<string, unknown> = {},
    ) => ({
      _id: new Types.ObjectId(`65000000000000000000000${n}`),
      name: { tr: `Gün ${n}`, en: `Day ${n}` },
      type,
      date,
      hijriDate: `1448-0${n}-01`,
      priority,
      isActive: true,
      createdAt: new Date(`2026-01-0${n}T00:00:00Z`),
      updatedAt: new Date(`2026-01-0${n}T00:00:00Z`),
      article: {
        tr: 'uzun makale '.repeat(200),
        en: 'long article '.repeat(200),
      },
      practices: [
        { title: { tr: 'a', en: 'a' }, description: { tr: 'b', en: 'b' } },
      ],
      ...extra,
    });
    await t.model('SpecialDay').collection.insertMany([
      mk(1, '2026-10-01', 'kandil', 80, {
        description: { tr: 'açıklama', en: 'desc' },
        eventKey: 'mevlid-kandili-2026',
        dayIndex: 1,
        dayCount: 1,
        hasSpecialFlow: true,
      }),
      mk(2, '2026-10-01', 'bayram', 100),
      mk(3, '2026-10-05', 'ramazan', 70, {
        eventKey: 'kurban-bayrami-2026',
        dayIndex: 2,
      }),
      mk(4, '2026-10-20', 'özel gün', 60),
      mk(5, '2026-11-01', 'kandil', 80, { isActive: false }),
    ] as never[]);
  });

  const cases: [string, string, string][] = [
    ['2026-09-30', 'Europe/Istanbul', '2026-09-30T09:00:00Z'],
    ['2026-10-01', 'Europe/Istanbul', '2026-10-01T09:00:00Z'],
    ['2026-10-06', 'Europe/Istanbul', '2026-10-06T09:00:00Z'],
    ['2026-12-31', 'Europe/Istanbul', '2026-12-31T09:00:00Z'],
  ];

  it.each(cases)('home?date=%s (%s) yanıtı değişmez', async (date, tz, now) => {
    const body = await atInstant(new Date(now), async () => {
      const res = await request(t.http)
        .get('/v1/special-days/home')
        .query({ date })
        .set('x-client-timezone', tz)
        .expect(200);
      return JSON.stringify((res.body as { data: unknown }).data);
    });
    expect(body).toMatchSnapshot();
  });

  it('home tarihsiz (Pago_Pago / Kiritimati) yanıtı değişmez', async () => {
    const out: string[] = [];
    await atInstant(new Date('2026-10-01T05:00:00Z'), async () => {
      for (const tz of ['Pacific/Pago_Pago', 'Pacific/Kiritimati']) {
        const res = await request(t.http)
          .get('/v1/special-days/home')
          .set('x-client-timezone', tz)
          .expect(200);
        out.push(JSON.stringify((res.body as { data: unknown }).data));
      }
    });
    expect(out).toMatchSnapshot();
  });
});
