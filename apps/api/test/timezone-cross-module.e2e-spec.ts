/**
 * Saat dilimi (katalog bölüm 27) — modüller arası tutarlılık. Her bölge ve
 * her yerel gece yarısı sınırı (DST geçiş günleri dahil) için "bugün" şu
 * dört yerde aynı gün anahtarına çözülür: dhikr-log yazımı → seri okuma,
 * stats özeti, vird /today, halka expiresAt. Date dondurulur (yalnız Date).
 * Beklenen gün anahtarı sunucu yardımcılarından bağımsız, Intl ile hesaplanır.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import fc from 'fast-check';
import { Types } from 'mongoose';
import request from 'supertest';
import { shiftDateKey, startOfDayInZone } from '../src/common/utils/date-keys';
import { CIRCLE_ERROR_CODE } from '../src/modules/circles/circles.constants';
import { atInstant } from './helpers/clock';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';

const ZONES = [
  'Europe/Istanbul',
  'Europe/Berlin',
  'America/New_York',
  'Pacific/Kiritimati',
] as const;

// Bağımsız beklenti: yerel takvim günü (sunucu yardımcılarını kullanmaz).
const localDay = (instant: Date, zone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);

// Gün başlangıçları: normal gün + Berlin (30 Mar / 26 Eki) ve New York
// (9 Mar / 2 Kas) DST geçiş günleri ile ertesi gün başlangıçları. 2025:
// tümü gerçek "şimdi"den önce, JWT'ler geçerli kalır.
const BOUNDARY_DAYS = [
  '2025-06-15',
  '2025-03-09',
  '2025-03-10',
  '2025-03-30',
  '2025-03-31',
  '2025-10-26',
  '2025-10-27',
  '2025-11-02',
  '2025-11-03',
];

describe('Saat dilimi — modüller arası (e2e)', () => {
  let t: TestApp;
  let dhikrId: string;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
  });

  afterAll(async () => {
    await t?.close();
  });

  const MINUTE = 60_000;

  /**
   * `instant`'ta, `zone` başlığıyla taze bir kullanıcı için bugünü dört
   * modülden okur; hepsi `expected` ile uyuşmalı.
   */
  async function assertTodayEverywhere(
    zone: string,
    instant: Date,
    expected: string,
  ) {
    const user = await signIn(t.http, { sub: `tzx-${randomUUID()}` });
    const auth = { ...bearer(user.accessToken), 'x-client-timezone': zone };
    const get = (path: string) =>
      request(t.http).get(path).set(auth).expect(200);

    await atInstant(instant, async () => {
      // 1. dhikr-log yazımı (gün anahtarı istemciden) → seri/stats "bugün"
      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(auth)
        .send({
          userId: user.userId,
          dhikrId,
          count: 9,
          targetCount: 33,
          date: expected,
        })
        .expect(201);

      // 2. seri okuma: bugün yazılmış → currentStreak 1
      const streak = data<{ currentStreak: number }>(
        await get(`/v1/streaks/${user.userId}`),
      );
      expect(streak.currentStreak).toBe(1);

      // 3. stats: aynı log "bugün" kovasında, son günlük nokta = bugün
      const stats = data<{
        periods: { today: number };
        streak: { currentStreak: number };
        dailySeries: { date: string }[];
      }>(await get('/v1/stats/summary'));
      expect(stats.periods.today).toBe(9);
      expect(stats.streak.currentStreak).toBe(1);
      expect(stats.dailySeries.at(-1)?.date).toBe(expected);

      // 4. vird /today: startDate = bugün olan program bugün 1. gün
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(auth)
        .send({
          title: { tr: 'TZ', en: 'TZ' },
          kind: 'routine',
          startDate: expected,
          phases: [
            {
              fromDay: 1,
              toDay: null,
              slots: { morning: [{ dhikrId, target: 3 }] },
            },
          ],
        })
        .expect(201);
      const programId = data<{ _id: string }>(created)._id;
      await request(t.http)
        .post(`/v1/vird/programs/${programId}/activate`)
        .set(auth)
        .expect(201);
      const today = data<{ dayIndex: number; program: { _id: string } }>(
        await get('/v1/vird/today'),
      );
      expect(today.program._id).toBe(programId);
      expect(today.dayIndex).toBe(1);

      // 4b. vird history: varsayılan aralık bugünde biter
      const history = data<{ items: { date: string }[] }>(
        await get('/v1/vird/history'),
      );
      expect(history.items.at(-1)?.date).toBe(expected);

      // 5. halka: endDate = bugün kabul; expiresAt = ERTESİ yerel gün başı
      const circle = await request(t.http)
        .post('/v1/circles')
        .set(auth)
        .send({ dhikrId, goalCount: 100, endDate: expected })
        .expect(201);
      const { expiresAt } = data<{ expiresAt: string }>(circle);
      const exp = new Date(expiresAt);
      expect(localDay(exp, zone)).toBe(shiftDateKey(expected, 1));
      expect(localDay(new Date(exp.getTime() - 1), zone)).toBe(expected);

      // dünkü endDate geçmiş sayılır (ücretsiz limit sırası karışmasın diye
      // halkası olmayan ikinci kullanıcı)
      const other = await signIn(t.http, { sub: `tzx-${randomUUID()}` });
      const past = await request(t.http)
        .post('/v1/circles')
        .set({ ...bearer(other.accessToken), 'x-client-timezone': zone })
        .send({
          dhikrId,
          goalCount: 100,
          endDate: shiftDateKey(expected, -1),
        });
      expect(past.status).toBe(400);
      expect(
        (past.body as { code?: string; message?: { code?: string } }).code ??
          (past.body as { message?: { code?: string } }).message?.code,
      ).toBe(CIRCLE_ERROR_CODE.END_DATE_PAST);
    });
  }

  describe.each(ZONES)('%s', (zone) => {
    it('yerel gece yarısı öncesi/sonrası (DST günleri dahil): bugün tüm modüllerde aynı', async () => {
      for (const day of BOUNDARY_DAYS) {
        const midnight = startOfDayInZone(day, zone);
        const before = new Date(midnight.getTime() - MINUTE);
        const after = new Date(midnight.getTime() + MINUTE);
        // Sınırın iki yanı farklı yerel gün (DST 23/25 saatlik günlerde de)
        expect(localDay(before, zone)).toBe(shiftDateKey(day, -1));
        expect(localDay(after, zone)).toBe(day);

        await assertTodayEverywhere(zone, before, shiftDateKey(day, -1));
        await assertTodayEverywhere(zone, after, day);
        await clearCollections(t.connection);
        dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      }
    });
  });

  it('özellik: rastgele an × bölge → bağımsız Intl günü, seri ve stats ile aynı', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ZONES),
        fc.date({
          min: new Date('2025-01-01T00:00:00Z'),
          max: new Date('2026-09-30T00:00:00Z'),
          noInvalidDate: true,
        }),
        async (zone, instant) => {
          const expected = localDay(instant, zone);
          const user = await signIn(t.http, { sub: `tzp-${randomUUID()}` });
          const auth = {
            ...bearer(user.accessToken),
            'x-client-timezone': zone,
          };
          await atInstant(instant, async () => {
            await request(t.http)
              .post('/v1/dhikr-logs')
              .set(auth)
              .send({
                userId: user.userId,
                dhikrId,
                count: 4,
                targetCount: 33,
                date: expected,
              })
              .expect(201);
            const stats = data<{
              periods: { today: number };
              streak: { currentStreak: number };
            }>(await request(t.http).get('/v1/stats/summary').set(auth));
            expect(stats.periods.today).toBe(4);
            expect(stats.streak.currentStreak).toBe(1);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('başlık yok → İstanbul günü (yerel gece yarısı İstanbul’da 21:00Z)', async () => {
    const user = await signIn(t.http, { sub: `tzx-${randomUUID()}` });
    const auth = bearer(user.accessToken);
    // 21:30Z = İstanbul ertesi gün 00:30, New York hâlâ aynı gün 17:30
    const instant = new Date('2025-06-15T21:30:00Z');
    await atInstant(instant, async () => {
      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(auth)
        .send({
          userId: user.userId,
          dhikrId,
          count: 2,
          targetCount: 33,
          date: '2025-06-16',
        })
        .expect(201);
      const stats = data<{ periods: { today: number } }>(
        await request(t.http).get('/v1/stats/summary').set(auth),
      );
      expect(stats.periods.today).toBe(2);
      const ny = data<{ periods: { today: number } }>(
        await request(t.http)
          .get('/v1/stats/summary')
          .set(auth)
          .set('x-client-timezone', 'America/New_York'),
      );
      expect(ny.periods.today).toBe(0);
    });
  });

  it('log gün anahtarı istemciden gelir: 23:59:59 ve 00:00:00 farklı günlere yazılır (TZ-11)', async () => {
    const user = await signIn(t.http, { sub: `tzx-${randomUUID()}` });
    const auth = {
      ...bearer(user.accessToken),
      'x-client-timezone': 'Europe/Istanbul',
    };
    const midnight = startOfDayInZone('2025-06-16', 'Europe/Istanbul');
    const write = (instant: Date, date: string) =>
      atInstant(instant, () =>
        request(t.http)
          .post('/v1/dhikr-logs')
          .set(auth)
          .send({
            userId: user.userId,
            dhikrId,
            count: 1,
            targetCount: 33,
            date,
          })
          .expect(201),
      );
    await write(new Date(midnight.getTime() - 1000), '2025-06-15');
    await write(midnight, '2025-06-16');
    const days = await t
      .model('DhikrLog')
      .find({ userId: new Types.ObjectId(user.userId) })
      .distinct('date');
    expect(days.sort()).toEqual(['2025-06-15', '2025-06-16']);
  });

  it('TZ-08: journey otomatik tamamlama istek saat dilimine göre (New York erken, İstanbul geç)', async () => {
    // 22:30Z: İstanbul 16 Haz 01:30, New York 15 Haz 18:30
    const instant = new Date('2025-06-15T22:30:00Z');
    const user = await signIn(t.http, { sub: `tzx-${randomUUID()}` });
    const ny = {
      ...bearer(user.accessToken),
      'x-client-timezone': 'America/New_York',
    };
    const ist = {
      ...bearer(user.accessToken),
      'x-client-timezone': 'Europe/Istanbul',
    };
    await atInstant(instant, async () => {
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(ny)
        .send({
          title: { tr: 'Yolculuk', en: 'Journey' },
          kind: 'journey',
          startDate: '2025-06-13',
          phases: [
            {
              fromDay: 1,
              toDay: 3,
              slots: { morning: [{ dhikrId, target: 1 }] },
            },
          ],
        })
        .expect(201);
      const programId = data<{ _id: string }>(created)._id;
      await request(t.http)
        .post(`/v1/vird/programs/${programId}/activate`)
        .set(ny)
        .expect(201);
      const status = async () =>
        (
          await t
            .model('VirdProgram')
            .findById(programId)
            .lean<{ status: string; endDate: string }>()
            .exec()
        )?.status;
      expect(
        (
          await t
            .model('VirdProgram')
            .findById(programId)
            .lean<{ endDate: string }>()
        )?.endDate,
      ).toBe('2025-06-15');

      // New York'ta bugün 15 Haz = endDate → hâlâ aktif
      await request(t.http).get('/v1/vird/today').set(ny).expect(200);
      expect(await status()).toBe('active');
      // İstanbul'da bugün 16 Haz > endDate → tamamlanır
      await request(t.http).get('/v1/vird/today').set(ist).expect(200);
      expect(await status()).toBe('completed');
    });
  });
});
