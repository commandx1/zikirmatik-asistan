import request from 'supertest';
import { Types } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { atInstant } from './helpers/clock';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import {
  bearer,
  data,
  makePremium,
  seedDhikr,
  signIn,
} from './helpers/fixtures';

const today = istanbulDateKey(new Date());

describe('Stats (e2e)', () => {
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

  it('boş kullanıcı için sıfırlar döner', async () => {
    const user = await signIn(t.http, { sub: 'stats-a' });

    const res = await request(t.http)
      .get('/v1/stats/summary')
      .set(bearer(user.accessToken))
      .expect(200);

    const body = data<{
      totals: { allTimeCount: number; totalSessions: number };
      streak: { currentStreak: number };
    }>(res);
    expect(body.totals.allTimeCount).toBe(0);
    expect(body.totals.totalSessions).toBe(0);
    expect(body.streak.currentStreak).toBe(0);
  });

  it('3 log sonrası toplamlar doğru', async () => {
    const user = await signIn(t.http, { sub: 'stats-b' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);

    for (const count of [10, 20, 33]) {
      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .send({
          userId: user.userId,
          dhikrId,
          count,
          targetCount: 33,
          date: today,
          isCompleted: count === 33,
        })
        .expect(201);
    }

    const res = await request(t.http)
      .get('/v1/stats/summary')
      .set(bearer(user.accessToken))
      .expect(200);

    // Aynı gün + aynı dhikr → dhikr_logs upsert edilir (tek belge, son
    // yazılan count=33 kalır); toplam sayı bu yüzden 33'tür.
    const body = data<{
      totals: { allTimeCount: number; totalSessions: number };
    }>(res);
    expect(body.totals.allTimeCount).toBe(33);
    expect(body.totals.totalSessions).toBe(1);
  });

  // A-14: halka ve vird logları toplam/seri/rozet hesabına girer; kaynak
  // dağılımına "circle" kovası eklenir. A-15: rozet uygunluğu düşmez.
  describe('A-14 / A-15', () => {
    async function seed(sub: string) {
      const user = await signIn(t.http, { sub });
      await makePremium(t.model('User'), user.userId);
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const log = t.model<DhikrLogDocument>('DhikrLog');
      const base = {
        userId: new Types.ObjectId(user.userId),
        dhikrId: new Types.ObjectId(dhikrId),
        targetCount: 100,
        isCompleted: false,
        source: 'manual' as const,
      };
      return { user, log, base };
    }

    async function summary(token: string) {
      const res = await request(t.http)
        .get('/v1/stats/summary')
        .set(bearer(token))
        .expect(200);
      return data<{
        totals: { allTimeCount: number; totalSessions: number };
        streak: { currentStreak: number; longestStreak: number };
        sourceBreakdown: Record<string, number>;
        badges: { key: string; achieved: boolean }[];
      }>(res);
    }

    it('halka + vird + sade log toplamda; seri üç kaynaktan; sourceBreakdown.circle', async () => {
      const { user, log, base } = await seed('stats-a14');
      const yesterday = shiftDateKey(today, -1);
      await log.create({ ...base, date: today, count: 10 });
      await log.create({
        ...base,
        date: yesterday,
        count: 20,
        source: 'circle' as const,
        circleId: new Types.ObjectId(),
      });
      // source 'manual' gönderilse de circleId varsa halka kovasına düşer.
      await log.create({
        ...base,
        date: shiftDateKey(today, -2),
        count: 30,
        circleId: new Types.ObjectId(),
      });
      await log.create({
        ...base,
        date: shiftDateKey(today, -3),
        count: 40,
        virdProgramId: new Types.ObjectId(),
        virdSlot: 'morning',
      });

      const body = await summary(user.accessToken);
      expect(body.totals.allTimeCount).toBe(100);
      expect(body.totals.totalSessions).toBe(4);
      expect(body.streak.currentStreak).toBe(4);
      expect(body.sourceBreakdown).toEqual({
        manual: 2,
        ai: 0,
        'special-day': 0,
        notification: 0,
        circle: 2,
      });
    });

    it('rozet: seri-7 sayımlı (tamamlanmamış) günlerden kazanılır ve vird TTL ile silinse de düşmez', async () => {
      const { user, log, base } = await seed('stats-a15');
      for (let ago = 0; ago < 7; ago += 1) {
        await log.create({
          ...base,
          date: shiftDateKey(today, -ago),
          count: 1,
        });
      }
      const streak = (b: Awaited<ReturnType<typeof summary>>) =>
        b.badges.find((x) => x.key === 'streak-7')?.achieved;
      expect(streak(await summary(user.accessToken))).toBe(true);

      // Kazanıldıktan sonra tüm loglar silinse bile rozet geri alınmaz.
      await log.deleteMany({});
      const after = await summary(user.accessToken);
      expect(after.streak.longestStreak).toBe(7);
      expect(streak(after)).toBe(true);
    });
  });

  // ── QA: STA-10 rozet eşikleri (tam eşik ve eşik-1) ─────────────────────────
  describe('STA-10: rozet eşikleri', () => {
    const CASES: [string, 'count' | 'streak' | 'virdStreak', number][] = [
      ['count-100', 'count', 100],
      ['count-1k', 'count', 1000],
      ['count-10k', 'count', 10000],
      ['count-100k', 'count', 100000],
      ['streak-7', 'streak', 7],
      ['streak-30', 'streak', 30],
      ['streak-100', 'streak', 100],
      ['vird-7', 'virdStreak', 7],
      ['vird-30', 'virdStreak', 30],
      ['vird-100', 'virdStreak', 100],
    ];

    async function badgesFor(
      sub: string,
      metric: 'count' | 'streak' | 'virdStreak',
      value: number,
    ) {
      const user = await signIn(t.http, { sub });
      const userId = new Types.ObjectId(user.userId);
      if (metric === 'count') {
        const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
        await t.model<DhikrLogDocument>('DhikrLog').create({
          userId,
          dhikrId: new Types.ObjectId(dhikrId),
          count: value,
          targetCount: 100,
          date: today,
        });
      } else {
        await t.model('Streak').create({
          userId,
          ...(metric === 'streak'
            ? { longestStreak: value }
            : { virdLongestStreak: value }),
        });
      }
      const res = await request(t.http)
        .get('/v1/stats/summary')
        .set(bearer(user.accessToken))
        .expect(200);
      return data<{
        badges: { key: string; achieved: boolean; progress: number }[];
      }>(res).badges;
    }

    it.each(CASES)(
      '%s: eşik−1 kazanılmaz, tam eşik kazanılır',
      async (key, metric, threshold) => {
        const below = await badgesFor(`bdg-${key}-lo`, metric, threshold - 1);
        const lo = below.find((b) => b.key === key)!;
        expect(lo.achieved).toBe(false);
        expect(lo.progress).toBeLessThan(1);
        expect(lo.progress).toBeCloseTo((threshold - 1) / threshold, 5);

        const at = await badgesFor(`bdg-${key}-hi`, metric, threshold);
        const hi = at.find((b) => b.key === key)!;
        expect(hi.achieved).toBe(true);
        expect(hi.progress).toBe(1);
        // yalnız ilgili metriğin eşiğini geçen rozetler kazanılmış olabilir
        expect(
          at
            .filter((b) => b.achieved)
            .every((b) => {
              const def = CASES.find(([k]) => k === b.key)!;
              return def[1] === metric && def[2] <= threshold;
            }),
        ).toBe(true);
      },
    );

    it('10 rozet, sabit sırayla döner', async () => {
      const badges = await badgesFor('bdg-order', 'count', 0);
      expect(badges.map((b) => b.key)).toEqual(CASES.map(([k]) => k));
    });
  });

  // ── QA: STA-06/07, TZ-06 — istek saat dilimi gün anahtarı ───────────────────
  describe('TZ-06: x-client-timezone gün anahtarı ve saat dağılımı', () => {
    // 22:30Z → İstanbul 11 Eki 01:30, New York 10 Eki 18:30, Kiritimati 11 Eki 12:30
    const INSTANT = new Date('2026-10-10T22:30:00Z');

    async function periodsIn(tz?: string) {
      // Token da donmuş saatte alınır (TTL sahte "şimdi"ye göre doğrulanır).
      return atInstant(INSTANT, async () => {
        const user = await signIn(t.http, { sub: `tz06-${tz ?? 'none'}` });
        await makePremium(t.model('User'), user.userId);
        const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
        await t.model<DhikrLogDocument>('DhikrLog').create({
          userId: new Types.ObjectId(user.userId),
          dhikrId: new Types.ObjectId(dhikrId),
          count: 7,
          targetCount: 33,
          date: '2026-10-11', // İstanbul "bugün"ü
        });
        const req = request(t.http)
          .get('/v1/stats/summary')
          .set(bearer(user.accessToken));
        if (tz) req.set('x-client-timezone', tz);
        const res = await req.expect(200);
        const body = data<{
          periods: { today: number; thisWeek: number; thisMonth: number };
          hourDistribution: { key: number; count: number }[];
          dailySeries: { date: string }[];
        }>(res);
        return {
          ...body.periods,
          hour: body.hourDistribution.find((h) => h.count > 0)?.key,
          lastDay: body.dailySeries.at(-1)?.date,
        };
      });
    }

    it('başlık yok / geçersiz → İstanbul günü', async () => {
      for (const tz of [undefined, 'Mars/Olympus']) {
        expect(await periodsIn(tz)).toMatchObject({
          today: 7,
          thisWeek: 7,
          thisMonth: 7,
          hour: 1,
          lastDay: '2026-10-11',
        });
      }
    });

    it('New York: İstanbul’un “bugün”ü henüz gelecek → today/thisWeek 0; saat 18', async () => {
      expect(await periodsIn('America/New_York')).toMatchObject({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        hour: 18,
        lastDay: '2026-10-10',
      });
    });

    it('Kiritimati (UTC+14): bugün 11 Eki, saat 12', async () => {
      expect(await periodsIn('Pacific/Kiritimati')).toMatchObject({
        today: 7,
        hour: 12,
        lastDay: '2026-10-11',
      });
    });
  });
});
