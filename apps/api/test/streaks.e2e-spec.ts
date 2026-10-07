import fc from 'fast-check';
import request from 'supertest';
import { Types } from 'mongoose';
import { als } from '../src/common/logging/request-context';
import {
  dateKeyInZone,
  istanbulDateKey,
  shiftDateKey,
  startOfDayInZone,
} from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import type { VirdDayProgressDocument } from '../src/modules/vird/schemas/vird-day-progress.schema';
import { StreaksService } from '../src/modules/streaks/streaks.service';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';

const today = istanbulDateKey(new Date());
const yesterday = shiftDateKey(today, -1);
const twoDaysAgo = shiftDateKey(today, -2);

describe('Streaks (e2e)', () => {
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

  async function insertLog(overrides: Record<string, unknown>) {
    const dhikrLogModel = t.model<DhikrLogDocument>('DhikrLog');
    return dhikrLogModel.create({
      count: 33,
      targetCount: 33,
      sessionDuration: 0,
      source: 'manual',
      isCompleted: true,
      isFavorite: false,
      ...overrides,
    });
  }

  it('başkasının seri kaydına erişim 403', async () => {
    const user = await signIn(t.http, { sub: 'streak-a' });
    const other = await signIn(t.http, { sub: 'streak-b' });

    await request(t.http)
      .get(`/v1/streaks/${other.userId}`)
      .set(bearer(user.accessToken))
      .expect(403);
  });

  it('recalculate-all dış istemciler için 403', async () => {
    const user = await signIn(t.http, { sub: 'streak-c' });

    await request(t.http)
      .post('/v1/streaks/recalculate-all')
      .set(bearer(user.accessToken))
      .expect(403);
  });

  it('bugün + dün tamamlanmış → currentStreak:2', async () => {
    const user = await signIn(t.http, { sub: 'streak-d' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);
    const userObjectId = new Types.ObjectId(user.userId);
    const dhikrObjectId = new Types.ObjectId(dhikrId);

    await insertLog({
      userId: userObjectId,
      dhikrId: dhikrObjectId,
      date: today,
    });
    await insertLog({
      userId: userObjectId,
      dhikrId: dhikrObjectId,
      date: yesterday,
    });

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    expect(data<{ currentStreak: number }>(res).currentStreak).toBe(2);
  });

  it('yalnız dün tamamlanmış (grace) → currentStreak:1', async () => {
    const user = await signIn(t.http, { sub: 'streak-e' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);

    await insertLog({
      userId: new Types.ObjectId(user.userId),
      dhikrId: new Types.ObjectId(dhikrId),
      date: yesterday,
    });

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    expect(data<{ currentStreak: number }>(res).currentStreak).toBe(1);
  });

  it('yalnız 2 gün önce tamamlanmış → currentStreak:0', async () => {
    const user = await signIn(t.http, { sub: 'streak-f' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);

    await insertLog({
      userId: new Types.ObjectId(user.userId),
      dhikrId: new Types.ObjectId(dhikrId),
      date: twoDaysAgo,
    });

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    expect(data<{ currentStreak: number }>(res).currentStreak).toBe(0);
  });

  it('boşluklu 5 gün → longestStreak doğru hesaplanır', async () => {
    const user = await signIn(t.http, { sub: 'streak-g' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);
    const userObjectId = new Types.ObjectId(user.userId);
    const dhikrObjectId = new Types.ObjectId(dhikrId);

    // 3 ardışık gün (uzak geçmiş) + bugün+dün (current run 2)
    const farRun = [
      shiftDateKey(today, -30),
      shiftDateKey(today, -29),
      shiftDateKey(today, -28),
    ];
    for (const date of [...farRun, yesterday, today]) {
      await insertLog({ userId: userObjectId, dhikrId: dhikrObjectId, date });
    }

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    const body = data<{ longestStreak: number; currentStreak: number }>(res);
    expect(body.longestStreak).toBe(3);
    expect(body.currentStreak).toBe(2);
  });

  it('logu olan ama streak belgesi olmayan kullanıcı → GET lazy backfill', async () => {
    const user = await signIn(t.http, { sub: 'streak-h' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);

    await insertLog({
      userId: new Types.ObjectId(user.userId),
      dhikrId: new Types.ObjectId(dhikrId),
      date: today,
    });

    const streakModel = t.model('Streak');
    const userObjectId = new Types.ObjectId(user.userId);
    expect(
      await streakModel.findOne({ userId: userObjectId }).lean().exec(),
    ).toBeNull();

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    expect(data<{ currentStreak: number }>(res).currentStreak).toBe(1);
    expect(
      await streakModel.findOne({ userId: userObjectId }).lean().exec(),
    ).not.toBeNull();
  });

  it('vird serisi: vird_day_progress isDayComplete:true → virdCurrentStreak alanı', async () => {
    const user = await signIn(t.http, { sub: 'streak-i' });
    const virdDayProgressModel =
      t.model<VirdDayProgressDocument>('VirdDayProgress');
    const userObjectId = new Types.ObjectId(user.userId);

    await virdDayProgressModel.create({
      userId: userObjectId,
      programId: new Types.ObjectId(),
      date: today,
      dayIndex: 1,
      completedItemKeys: ['morning:1'],
      completedSlots: ['morning'],
      isDayComplete: true,
    });

    // vird serisi yalnız VirdProgressService.applyLogWrite tarafından
    // (gerçek bir vird programı akışı üzerinden) türetilir; HTTP'den
    // tetiklenecek bir uç yok. Burada servis doğrudan çağrılarak
    // recalculateVirdForUser'ın vird_day_progress'i doğru okuduğu ve
    // GET /v1/streaks'in bu alanı döndürdüğü doğrulanıyor.
    await t.app.get(StreaksService).recalculateVirdForUser(user.userId);

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    expect(data<{ virdCurrentStreak: number }>(res).virdCurrentStreak).toBe(1);
  });

  // M-21: seri kuralı herkes için tek — o gün sayımı > 0 olan kayıt varsa
  // gün sayılır; hedef tamamlama şartı yok.
  describe('M-21: seri = sayımı > 0 olan gün', () => {
    async function seedDays(
      userId: string,
      days: { date: string; count: number; isCompleted: boolean }[],
    ) {
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      for (const day of days) {
        await insertLog({
          userId: new Types.ObjectId(userId),
          dhikrId: new Types.ObjectId(dhikrId),
          targetCount: 33,
          ...day,
        });
      }
    }

    async function readStreak(user: { userId: string; accessToken: string }) {
      const res = await request(t.http)
        .get(`/v1/streaks/${user.userId}`)
        .set(bearer(user.accessToken))
        .expect(200);
      return data<{
        currentStreak: number;
        longestStreak: number;
        totalDaysActive: number;
      }>(res);
    }

    it('tamamlanmamış ama sayımı > 0 günler seriyi sürdürür', async () => {
      const user = await signIn(t.http, { sub: 'm21-a' });
      await seedDays(user.userId, [
        { date: today, count: 5, isCompleted: false },
        { date: yesterday, count: 1, isCompleted: false },
        { date: twoDaysAgo, count: 33, isCompleted: true },
      ]);
      expect((await readStreak(user)).currentStreak).toBe(3);
    });

    it('sayımı 0 olan gün seriyi sürdürmez', async () => {
      const user = await signIn(t.http, { sub: 'm21-b' });
      await seedDays(user.userId, [
        { date: today, count: 5, isCompleted: false },
        { date: yesterday, count: 0, isCompleted: false },
        { date: twoDaysAgo, count: 33, isCompleted: true },
      ]);
      const streak = await readStreak(user);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
    });

    it('tek bir sayımı-0 kayıt (bugün) dün sayımlı olsa da grace ile seri 1', async () => {
      const user = await signIn(t.http, { sub: 'm21-c' });
      await seedDays(user.userId, [
        { date: today, count: 0, isCompleted: false },
        { date: yesterday, count: 2, isCompleted: false },
      ]);
      expect((await readStreak(user)).currentStreak).toBe(1);
    });

    it('okuma anı: dün sayımlı (tamamlanmamış) yazılmış seri bayatlamaz (lastCompletedDate = son sayımlı gün)', async () => {
      const user = await signIn(t.http, { sub: 'm21-d' });
      await seedDays(user.userId, [
        { date: yesterday, count: 4, isCompleted: false },
        { date: twoDaysAgo, count: 4, isCompleted: false },
      ]);
      await t.app.get(StreaksService).recalculateForUser(user.userId);
      const doc = await t
        .model('Streak')
        .findOne({ userId: new Types.ObjectId(user.userId) })
        .lean<{ lastCompletedDate?: string }>();
      expect(doc?.lastCompletedDate).toBe(yesterday);
      expect((await readStreak(user)).currentStreak).toBe(2);
    });

    it('eski kural belgesi (tamamlanma tabanlı) ilk okumada bir kez yeniden hesaplanır', async () => {
      const user = await signIn(t.http, { sub: 'm21-e' });
      await seedDays(user.userId, [
        { date: today, count: 4, isCompleted: false },
        { date: yesterday, count: 4, isCompleted: false },
        { date: twoDaysAgo, count: 33, isCompleted: true },
      ]);
      // Eski kuralla yazılmış: yalnız 2 gün önceki tamamlanan günde bitiyor.
      await t.model('Streak').create({
        userId: new Types.ObjectId(user.userId),
        currentStreak: 1,
        longestStreak: 1,
        totalDaysActive: 3,
        lastCompletedDate: twoDaysAgo,
      });
      expect((await readStreak(user)).currentStreak).toBe(3);
    });

    it('özellik: rastgele gün kümesi + tamamlanma/sayım karışımı → seri yalnız count>0 günlerden', async () => {
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      let n = 0;
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              ago: fc.integer({ min: 0, max: 12 }),
              count: fc.constantFrom(0, 1, 5, 33),
              done: fc.boolean(),
            }),
            { maxLength: 10 },
          ),
          async (rows) => {
            await clearCollections(t.connection);
            const user = await signIn(t.http, { sub: `m21-prop-${(n += 1)}` });
            const uniq = new Map<number, (typeof rows)[number]>();
            rows.forEach((r) => uniq.set(r.ago, r)); // gün başına tek log
            for (const r of uniq.values()) {
              await insertLog({
                userId: new Types.ObjectId(user.userId),
                dhikrId: new Types.ObjectId(dhikrId),
                date: shiftDateKey(today, -r.ago),
                count: r.count,
                isCompleted: r.done,
              });
            }
            const active = new Set(
              [...uniq.values()].filter((r) => r.count > 0).map((r) => r.ago),
            );
            let expected = 0;
            for (let ago = active.has(0) ? 0 : 1; active.has(ago); ago += 1) {
              expected += 1;
            }
            expect((await readStreak(user)).currentStreak).toBe(expected);
          },
        ),
        { numRuns: 15 },
      );
    });
  });

  // A-15: rozetler asla geri alınmaz — kazanılan en uzun seri düşmez.
  describe('A-15: longest değerleri asla düşmez', () => {
    it('genel: logları silinse / seri kısalsa bile longestStreak düşmez', async () => {
      const user = await signIn(t.http, { sub: 'a15-a' });
      const userObjectId = new Types.ObjectId(user.userId);
      await t.model('Streak').create({
        userId: userObjectId,
        currentStreak: 0,
        longestStreak: 50,
        totalDaysActive: 50,
      });
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      await insertLog({
        userId: userObjectId,
        dhikrId: new Types.ObjectId(dhikrId),
        date: today,
      });
      const res = await t.app
        .get(StreaksService)
        .recalculateForUser(user.userId);
      expect(res.longestStreak).toBe(50);
      expect(res.currentStreak).toBe(1);
    });

    it('vird: vird_day_progress belgeleri (TTL) silinse de virdLongestStreak düşmez', async () => {
      const user = await signIn(t.http, { sub: 'a15-b' });
      const userObjectId = new Types.ObjectId(user.userId);
      await t.model('Streak').create({
        userId: userObjectId,
        virdCurrentStreak: 0,
        virdLongestStreak: 40,
      });
      // Hiç vird_day_progress yok (TTL ile silinmiş gibi).
      const res = await t.app
        .get(StreaksService)
        .recalculateVirdForUser(user.userId);
      expect(res.virdLongestStreak).toBe(40);
    });
  });

  // API-STR-10 / API-STA-13: saklı seri belgesi okuma anında "bugün"e göre
  // değerlendirilir; yazım yokken seri bayat kalmaz.
  describe('bayat seri (okuma anında değerlendirme)', () => {
    // Yalnız Date'i dondur; Mongo sürücüsünün zamanlayıcıları gerçek kalsın.
    async function atInstant<T>(when: Date, fn: () => Promise<T>) {
      jest.useFakeTimers({
        now: when,
        doNotFake: [
          'hrtime',
          'nextTick',
          'performance',
          'queueMicrotask',
          'requestAnimationFrame',
          'cancelAnimationFrame',
          'requestIdleCallback',
          'cancelIdleCallback',
          'setImmediate',
          'clearImmediate',
          'setInterval',
          'clearInterval',
          'setTimeout',
          'clearTimeout',
        ],
      });
      try {
        return await fn();
      } finally {
        jest.useRealTimers();
      }
    }

    function inZone<T>(tz: string, fn: () => Promise<T>) {
      return als.run(
        {
          requestId: 'e2e',
          req: { headers: { 'x-client-timezone': tz } } as never,
        },
        fn,
      );
    }

    /** `lastDay` ile biten 3 ardışık tamamlanmış gün logu. */
    async function seedRun(userId: string, lastDay: string) {
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      for (const delta of [-2, -1, 0]) {
        await insertLog({
          userId: new Types.ObjectId(userId),
          dhikrId: new Types.ObjectId(dhikrId),
          date: shiftDateKey(lastDay, delta),
        });
      }
    }

    /** Seriyi gerçek yazım yoluyla, `lastDay` İstanbul'da "bugün"ken yazar. */
    async function writeStreakOn(userId: string, lastDay: string) {
      const noon = new Date(
        startOfDayInZone(lastDay, 'Europe/Istanbul').getTime() + 12 * 3600e3,
      );
      await atInstant(noon, () =>
        t.app.get(StreaksService).recalculateForUser(userId),
      );
    }

    type StreakBody = {
      currentStreak: number;
      longestStreak: number;
      virdCurrentStreak: number;
      virdLongestStreak: number;
    };

    async function readBoth(
      user: { userId: string; accessToken: string },
      tz?: string,
    ) {
      const headers: Record<string, string> = bearer(user.accessToken);
      if (tz) headers['x-client-timezone'] = tz;
      const streakRes = await request(t.http)
        .get(`/v1/streaks/${user.userId}`)
        .set(headers)
        .expect(200);
      const statsRes = await request(t.http)
        .get('/v1/stats/summary')
        .set(headers)
        .expect(200);
      return {
        streaks: data<StreakBody>(streakRes),
        stats: data<{ streak: StreakBody }>(statsRes).streak,
      };
    }

    it.each([
      [0, 3], // bugün yazılmış
      [1, 3], // dün yazılmış: grace sınırı
      [2, 0], // grace'in bir gün ötesi
      [5, 0],
    ])(
      'son tamamlanan gün %i gün önce → currentStreak %i, longest 3',
      async (daysAgo, expected) => {
        const user = await signIn(t.http, { sub: `stale-${daysAgo}` });
        const lastDay = shiftDateKey(today, -daysAgo);
        await seedRun(user.userId, lastDay);
        await writeStreakOn(user.userId, lastDay);

        const { streaks, stats } = await readBoth(user);
        expect(streaks.currentStreak).toBe(expected);
        expect(streaks.longestStreak).toBe(3);
        expect(stats.currentStreak).toBe(expected);
        expect(stats.longestStreak).toBe(3);
      },
    );

    it('"bugün" x-client-timezone ile belirlenir (Niue vs Kiritimati)', async () => {
      // UTC-11 ile UTC+14 arası 25 saat: Kiritimati'nin bugünü daima
      // Niue'nunkinden en az bir gün ileridedir.
      const user = await signIn(t.http, { sub: 'stale-tz' });
      const niueToday = dateKeyInZone(new Date(), 'Pacific/Niue');
      const lastDay = shiftDateKey(niueToday, -1);
      await seedRun(user.userId, lastDay);
      await inZone('Pacific/Niue', () =>
        t.app.get(StreaksService).recalculateForUser(user.userId),
      );

      const niue = await readBoth(user, 'Pacific/Niue');
      expect(niue.streaks.currentStreak).toBe(3);
      expect(niue.stats.currentStreak).toBe(3);

      const kiritimati = await readBoth(user, 'Pacific/Kiritimati');
      expect(kiritimati.streaks.currentStreak).toBe(0);
      expect(kiritimati.stats.currentStreak).toBe(0);
      expect(kiritimati.streaks.longestStreak).toBe(3);
    });

    it('vird serisi zikir serisinden bağımsız bayatlar', async () => {
      const user = await signIn(t.http, { sub: 'stale-vird' });
      const virdLast = shiftDateKey(today, -4);
      const virdModel = t.model<VirdDayProgressDocument>('VirdDayProgress');
      for (const [i, delta] of [-2, -1, 0].entries()) {
        await virdModel.create({
          userId: new Types.ObjectId(user.userId),
          programId: new Types.ObjectId(),
          date: shiftDateKey(virdLast, delta),
          dayIndex: i + 1,
          completedItemKeys: ['morning:1'],
          completedSlots: ['morning'],
          isDayComplete: true,
        });
      }
      const noon = new Date(
        startOfDayInZone(virdLast, 'Europe/Istanbul').getTime() + 12 * 3600e3,
      );
      await atInstant(noon, () =>
        t.app.get(StreaksService).recalculateVirdForUser(user.userId),
      );
      await seedRun(user.userId, yesterday);
      await writeStreakOn(user.userId, yesterday);

      const { streaks, stats } = await readBoth(user);
      expect(streaks.currentStreak).toBe(3);
      expect(streaks.virdCurrentStreak).toBe(0);
      expect(streaks.virdLongestStreak).toBe(3);
      expect(stats.currentStreak).toBe(3);
      expect(stats.virdCurrentStreak).toBe(0);
    });
  });
});
