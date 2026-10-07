import request from 'supertest';
import { Types } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
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
});
