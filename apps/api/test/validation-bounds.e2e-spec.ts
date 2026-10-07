/**
 * Doğrulama sınırları e2e — docs/qa/davranis-katalogu.md Bölüm 1 / 26.
 * Genel kural: whitelist:true, forbidNonWhitelisted YOK → bilinmeyen alan 400
 * değil sessizce elenir (mevcut ürün kararı). Kötü girdi ASLA 500 vermez.
 * Etiketler: [BOUND] sınır değeri, [CHAR] mevcut davranışı sabitler,
 * [BUG:Bnn] katalog bulgu adayı düzeltmesi. Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  dateKeyInZone,
  istanbulDateKey,
  shiftDateKey,
} from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import {
  User,
  type UserDocument,
} from '../src/modules/users/schemas/user.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import {
  bearer,
  data,
  makePremium,
  seedDhikr,
  signIn,
  type SignInResult,
} from './helpers/fixtures';

const today = istanbulDateKey(new Date());
const ADMIN = { 'x-admin-secret': 'test-admin-secret' };
const OID = '507f1f77bcf86cd799439011';

describe('Doğrulama sınırları (e2e)', () => {
  let t: TestApp;
  let user: SignInResult;
  let dhikrId: string;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });
  beforeEach(async () => {
    await clearCollections(t.connection);
    user = await signIn(t.http, { sub: `e2e-vb-${randomUUID()}` });
    dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
  });
  afterAll(async () => {
    await t?.close();
  });

  const get = (path: string, u: SignInResult | null = user) => {
    const r = request(t.http).get(path);
    return u ? r.set(bearer(u.accessToken)) : r;
  };
  const send = (
    method: 'post' | 'patch' | 'delete',
    path: string,
    body?: unknown,
    u: SignInResult | null = user,
  ) => {
    const r = request(t.http)[method](path);
    return (u ? r.set(bearer(u.accessToken)) : r).send(body as object);
  };
  const logBody = (o: Record<string, unknown> = {}) => ({
    userId: user.userId,
    dhikrId,
    count: 1,
    targetCount: 33,
    date: today,
    ...o,
  });
  const postLog = (o: Record<string, unknown> = {}) =>
    send('post', '/v1/dhikr-logs', logBody(o));

  // ===================================================================
  describe('genel kural', () => {
    it('[CHAR] bilinmeyen alan sessizce elenir (400 değil), kayıtta yer almaz', async () => {
      const res = await postLog({ hacker: 'x', isAdmin: true }).expect(201);
      expect(data(res)).not.toHaveProperty('hacker');
      expect(data(res)).not.toHaveProperty('isAdmin');
      await send('patch', `/v1/users/${user.userId}/preferences`, {
        theme: 'dark',
        isPremium: true,
      }).expect(200);
      const doc = await t
        .model<{ isPremium?: boolean }>('User')
        .findById(user.userId)
        .lean();
      expect(doc?.isPremium).toBeFalsy();
    });

    it('gövdede userId OPSİYONEL ve yok sayılır (token sahibi kullanılır); bozuksa yine 400', async () => {
      await postLog({ userId: undefined }).expect(201);
      const other = await signIn(t.http, { sub: `e2e-vb-o-${randomUUID()}` });
      const res = await postLog({ userId: other.userId }).expect(201);
      expect(data<{ userId: string }>(res).userId).toBe(user.userId);
      await postLog({ userId: 'xyz' }).expect(400);
    });

    it('bozuk JSON / dizi gövde / boş gövde → 400 (500 değil)', async () => {
      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .set('Content-Type', 'application/json')
        .send('{bad')
        .expect(400);
      await send('post', '/v1/dhikr-logs', [1]).expect(400);
      await send('post', '/v1/dhikr-logs').expect(400);
      await send('post', '/v1/vird/programs', {}).expect(400);
    });
  });

  // ===================================================================
  describe('tarih anahtarları (B19)', () => {
    const BAD = [
      '2026-9-1',
      '26-09-01',
      '2026/09/01',
      '2026-09-01T00:00:00Z',
      ' 2026-09-01',
      '2026-02-30',
      '2026-13-01',
      '2026-00-10',
      '2026-04-31',
      '2025-02-29', // artık yıl değil
      '0000-01-01',
      '10000-01-01',
    ];
    const GOOD = ['2024-02-29', '2026-12-31'];

    const dateRoutes: [string, (d: string) => request.Test][] = [
      [
        'GET dhikr-logs?dateFrom',
        (d) => get('/v1/dhikr-logs').query({ dateFrom: d }),
      ],
      [
        'GET dhikr-logs?dateTo',
        (d) => get('/v1/dhikr-logs').query({ dateTo: d }),
      ],
      ['GET vird/today?date', (d) => get('/v1/vird/today').query({ date: d })],
      [
        'GET vird/history?from',
        (d) => get('/v1/vird/history').query({ from: d }),
      ],
      ['GET vird/history?to', (d) => get('/v1/vird/history').query({ to: d })],
      [
        'GET special-days?dateFrom',
        (d) => get('/v1/special-days').query({ dateFrom: d }),
      ],
      [
        'GET special-days?dateTo',
        (d) => get('/v1/special-days').query({ dateTo: d }),
      ],
      [
        'GET special-days/home?date',
        (d) => get('/v1/special-days/home').query({ date: d }),
      ],
      [
        'GET circles/:id?date',
        (d) => get(`/v1/circles/${OID}`).query({ date: d }),
      ],
    ];

    describe.each(dateRoutes)('%s', (_name, run) => {
      it.each(BAD)('geçersiz %s → 400', async (d) => {
        await run(d).expect(400);
      });
      it.each(GOOD)('geçerli %s → 400/5xx değil', async (d) => {
        const res = await run(d);
        // circles/:id var olmayan halka için 404; diğerleri 200.
        expect([200, 404]).toContain(res.status);
      });
    });

    it('POST dhikr-logs date: geçersiz takvim günleri 400 (A-12), 2024-02-29 geçerli', async () => {
      for (const d of BAD) {
        await postLog({ date: d }).expect(400);
      }
      await postLog({ date: '2024-02-29' }).expect(201);
    });

    it('POST vird/programs startDate ve circles endDate: geçersiz takvim günü → 400', async () => {
      const program = (startDate: string) => ({
        title: { tr: 'P', en: 'P' },
        kind: 'routine',
        startDate,
        phases: [{ fromDay: 1, slots: { morning: [{ dhikrId, target: 1 }] } }],
      });
      await send('post', '/v1/vird/programs', program('2026-02-30')).expect(
        400,
      );
      await send('post', '/v1/vird/programs', program('2026-13-01')).expect(
        400,
      );
      await send('post', '/v1/vird/programs', program('2026-9-1')).expect(400);
      for (const endDate of ['2026-02-30', '2099-13-01', '2099-9-1']) {
        await send('post', '/v1/circles', {
          dhikrId,
          goalCount: 10,
          endDate,
        }).expect(400);
      }
    });

    it('POST special-days (admin) date: geçersiz takvim günü → 400', async () => {
      const body = (date: string) => ({
        name: { tr: 'G', en: 'D' },
        type: 'kandil',
        date,
        hijriDate: '1448-06-01',
      });
      for (const d of ['2026-02-30', '2026-13-01', '2026-9-1']) {
        await request(t.http)
          .post('/v1/special-days')
          .set(ADMIN)
          .send(body(d))
          .expect(400);
      }
      await request(t.http)
        .post('/v1/special-days')
        .set(ADMIN)
        .send(body('2026-12-01'))
        .expect(201);
    });

    it('[BUG] vird/history: çok geniş aralık (…→9999-12-31) 500 değil, en çok 400 gün döner', async () => {
      const res = await get('/v1/vird/history')
        .query({ from: '1900-01-01', to: '9999-12-31' })
        .expect(200);
      const items = data<{ items: { date: string }[] }>(res).items;
      expect(items.length).toBeLessThanOrEqual(401);
      expect(items.at(-1)?.date).toBe('9999-12-31');
    });

    it('[CHAR] vird/history: from > to → 200 boş liste', async () => {
      const res = await get('/v1/vird/history')
        .query({ from: '2026-02-01', to: '2026-01-01' })
        .expect(200);
      expect(data(res)).toEqual({ items: [] });
    });
  });

  // ===================================================================
  describe('dhikr-logs sayılar', () => {
    it.each([-1, 1.5, '5', null, 'abc', 100_001, 2 ** 31, 1e12])(
      '[BOUND] count=%p → 400',
      async (count) => {
        await postLog({ count }).expect(400);
      },
    );
    it.each([0, 1, 100_000])('[BOUND] count=%p → 201', async (count) => {
      await postLog({ count }).expect(201);
    });

    it.each([-1, 1.5, '5', 'abc'])(
      '[BOUND] targetCount=%p → 400',
      async (targetCount) => {
        await postLog({ targetCount }).expect(400);
      },
    );
    it.each([0, 1, 2 ** 31, 1e12])(
      '[CHAR] targetCount=%p → 201 (üst sınır YOK, ❓ S2)',
      async (targetCount) => {
        await postLog({ targetCount }).expect(201);
      },
    );

    it.each([-1, 1.5])(
      '[BOUND] sessionDuration=%p → 400',
      async (sessionDuration) => {
        await postLog({ sessionDuration }).expect(400);
      },
    );
    it.each([0, 3600, 2 ** 31])(
      '[CHAR] sessionDuration=%p → 201 (üst sınır YOK, ❓ S2)',
      async (sessionDuration) => {
        await postLog({ sessionDuration }).expect(201);
      },
    );

    it('[BOUND] virdDayIndex 0 → 400, virdPrayerIndex 0 ve 6 → 400', async () => {
      await postLog({ virdDayIndex: 0 }).expect(400);
      await postLog({ virdPrayerIndex: 0 }).expect(400);
      await postLog({ virdPrayerIndex: 6 }).expect(400);
    });

    it('[BOUND] virdPrayerIndex 1 ve 5, virdDayIndex 1 geçerli program ile 201', async () => {
      const program = data<{ _id: string }>(
        await send('post', '/v1/vird/programs', {
          title: { tr: 'P', en: 'P' },
          kind: 'routine',
          startDate: today,
          phases: [{ fromDay: 1, slots: { prayer: [{ dhikrId, target: 1 }] } }],
        }).expect(201),
      );
      for (const virdPrayerIndex of [1, 5]) {
        await postLog({
          virdProgramId: program._id,
          virdSlot: 'prayer',
          virdPrayerIndex,
          virdDayIndex: 1,
        }).expect(201);
      }
    });

    it('[BOUND] ObjectId alanları: bozuk dhikrId/virdProgramId/circleId/aiRecommendationId → 400; var olmayan dhikr → 404', async () => {
      await postLog({ dhikrId: 'xyz' }).expect(400);
      await postLog({ virdProgramId: 'xyz', virdSlot: 'morning' }).expect(400);
      await postLog({ circleId: 'xyz' }).expect(400);
      await postLog({ aiRecommendationId: 'xyz' }).expect(400);
      await postLog({ source: 'bogus' }).expect(400);
      await postLog({ virdSlot: 'bogus' }).expect(400);
      await postLog({ dhikrId: OID }).expect(404);
    });

    it('[BOUND] ne dhikrId ne customDhikrId → 400; boş customDhikrId → 400', async () => {
      await postLog({ dhikrId: undefined }).expect(400);
      await postLog({ dhikrId: undefined, customDhikrId: '' }).expect(400);
    });
  });

  describe('dhikr-logs/bulk.items', () => {
    const bulk = (items: unknown) =>
      send('post', '/v1/dhikr-logs/bulk', { items });
    const item = (daysAgo: number) =>
      logBody({ date: shiftDateKey(today, -daysAgo) });

    it('[BOUND] 0 eleman → 400; items dizi değil → 400; bozuk eleman → 400 (hiçbiri yazılmaz)', async () => {
      await bulk([]).expect(400);
      await bulk('x').expect(400);
      await bulk(undefined).expect(400);
      await bulk([item(1), logBody({ count: -1 })]).expect(400);
      expect(await t.model('DhikrLog').countDocuments({})).toBe(0);
    });

    it('[BOUND] 1 eleman 201', async () => {
      await bulk([item(0)]).expect(201);
    });

    it('[CHAR] 200 eleman 201 (eleman üst sınırı YOK)', async () => {
      const items = Array.from({ length: 200 }, (_, i) => item(i));
      await bulk(items).expect(201);
      expect(await t.model('DhikrLog').countDocuments({})).toBe(200);
    });

    it('[CHAR] 1000 eleman → 413 (kod sınırı yok ama Express JSON gövde sınırı ~100 KB devreye girer; 500 değil)', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => item(i));
      await bulk(items).expect(413);
      expect(await t.model('DhikrLog').countDocuments({})).toBe(0);
    });
  });

  // ===================================================================
  describe('circles', () => {
    let premium: SignInResult;
    beforeEach(async () => {
      premium = await signIn(t.http, { sub: `e2e-vb-prem-${randomUUID()}` });
      await makePremium(t.model<UserDocument>(User.name), premium.userId);
    });
    const create = (body: Record<string, unknown>) =>
      send('post', '/v1/circles', { dhikrId, goalCount: 10, ...body }, premium);

    it.each([0, -1, 1.5, '10', 10_000_001])(
      '[BOUND] goalCount=%p → 400',
      async (goalCount) => {
        await create({ goalCount }).expect(400);
      },
    );
    it.each([1, 10_000_000])(
      '[BOUND] goalCount=%p → 201',
      async (goalCount) => {
        await create({ goalCount }).expect(201);
      },
    );

    it.each(['a', 'a'.repeat(61), ''])(
      '[BOUND] name uzunluğu %# (%p) → 400',
      async (name) => {
        await create({ name }).expect(400);
      },
    );
    it.each(['ab', 'a'.repeat(60)])('[BOUND] name=%p → 201', async (name) => {
      await create({ name }).expect(201);
    });
    it('name yalnız boşluk → 201 ama kırpılır; ad hiç yazılmaz (A-21)', async () => {
      const res = await create({ name: '   ' }).expect(201);
      const id = data<{ id: string }>(res).id;
      expect(id).toBeTruthy();
      const doc = await t
        .model('Circle')
        .findById(id)
        .lean<{ name?: string }>();
      expect(doc?.name).toBeUndefined();
      const named = await create({ name: '  ab  ' }).expect(201);
      const doc2 = await t
        .model('Circle')
        .findById(data<{ id: string }>(named).id)
        .lean<{ name?: string }>();
      expect(doc2?.name).toBe('ab');
    });

    it('geçmiş endDate: limit/premium kontrolünden ÖNCE 400 (ücretsiz + zaten 1 aktif halka olsa da)', async () => {
      await send('post', '/v1/circles', { dhikrId, goalCount: 10 }).expect(201);
      const res = await send('post', '/v1/circles', {
        dhikrId,
        goalCount: 10,
        endDate: shiftDateKey(today, -1),
      }).expect(400);
      expect(JSON.stringify(res.body)).toContain('END_DATE_PAST');
    });

    it('[BOUND] dhikrId bozuk → 400; var olmayan → 404', async () => {
      await create({ dhikrId: 'xyz' }).expect(400);
      await create({ dhikrId: OID }).expect(404);
    });

    it('join.code: 7 → 400, 17 → 400, 8 (bilinmeyen) → 404, boş → 400, sayı → 400', async () => {
      const join = (code: unknown) =>
        send('post', '/v1/circles/join', { code }, premium);
      await join('ABCDEFG').expect(400);
      await join('A'.repeat(17)).expect(400);
      await join('').expect(400);
      await join(12345678).expect(400);
      await join('ABCDEFGH').expect(404);
      await join('abcd-efgh').expect(404);
    });

    it('join.code: küçük harf + ayraçlı kod normalize edilip katılır', async () => {
      const created = data<{ code: string }>(await create({}).expect(201));
      const joiner = await signIn(t.http, { sub: `e2e-vb-j-${randomUUID()}` });
      const dashed =
        `${created.code.slice(0, 4)}-${created.code.slice(4)}`.toLowerCase();
      await send('post', '/v1/circles/join', { code: dashed }, joiner).expect(
        201,
      );
    });
  });

  // ===================================================================
  describe('ai', () => {
    const rec = (body: Record<string, unknown>) =>
      send('post', '/v1/ai/recommendations', {
        userId: user.userId,
        freeText: 'huzur',
        flowId: randomUUID(),
        ...body,
      });
    beforeEach(async () => {
      for (let i = 0; i < 3; i++)
        await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    });

    it.each([0, 6, -1, 1.5, '3'])(
      '[BOUND] maxRecommendations=%p → 400',
      async (maxRecommendations) => {
        await rec({ maxRecommendations }).expect(400);
      },
    );
    it.each([1, 5])(
      '[BOUND] maxRecommendations=%p → 201',
      async (maxRecommendations) => {
        await rec({ maxRecommendations }).expect(201);
      },
    );

    it.each([
      ['v1 UUID', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
      ['boş', ''],
      ['rastgele', 'not-a-uuid'],
      ['sayı', 123],
    ])('[BOUND] flowId %s → 400', async (_n, flowId) => {
      await rec({ flowId }).expect(400);
    });

    it('[CHAR] freeText 10.000 karakter → 201 (üst sınır yok; maliyet riski)', async () => {
      await rec({ freeText: 'a'.repeat(10_000) }).expect(201);
    });

    it('[BOUND] ai/vird-programs durationDays 0, 8 → 400; slots boş / bozuk → 400; flowId v1 → 400', async () => {
      const vird = (o: Record<string, unknown>) =>
        send('post', '/v1/ai/vird-programs', {
          flowId: randomUUID(),
          durationDays: 7,
          slots: ['morning'],
          ...o,
        });
      await vird({ durationDays: 0 }).expect(400);
      await vird({ durationDays: 8 }).expect(400);
      await vird({ slots: [] }).expect(400);
      await vird({ slots: ['bogus'] }).expect(400);
      await vird({ prayerSelection: [6] }).expect(400);
      await vird({ locale: 'de' }).expect(400);
      await vird({ flowId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }).expect(
        400,
      );
    });

    describe('[BUG:B12] timeContext', () => {
      const tc = (o: Record<string, unknown> = {}) => ({
        hour: 5,
        dayOfWeek: 1,
        isSpecialDay: false,
        ...o,
      });
      it.each([
        ['hour 99', { hour: 99 }],
        ['hour -1', { hour: -1 }],
        ['hour 1.5', { hour: 1.5 }],
        ['dayOfWeek 7', { dayOfWeek: 7 }],
        ['isSpecialDay metin', { isSpecialDay: 'yes' }],
        ['hour eksik', { hour: undefined }],
        ['dayOfWeek eksik', { dayOfWeek: undefined }],
      ])('iç alan geçersiz (%s) → 400', async (_n, o) => {
        await rec({ timeContext: tc(o) }).expect(400);
      });
      it('timeContext obje değil → 400', async () => {
        await rec({ timeContext: 'now' }).expect(400);
        await rec({ timeContext: 5 }).expect(400);
      });
      it('geçerli timeContext aynen saklanır', async () => {
        const res = await rec({
          timeContext: tc({ hour: 23, dayOfWeek: 6 }),
        }).expect(201);
        const stored = await t
          .model<{
            timeContext: { hour: number; dayOfWeek: number };
          }>('AiRecommendation')
          .findById(data<{ recommendationId: string }>(res).recommendationId)
          .lean();
        expect(stored?.timeContext).toMatchObject({ hour: 23, dayOfWeek: 6 });
      });
      it.each(['Pacific/Kiritimati', 'Pacific/Niue', 'America/Los_Angeles'])(
        'timeContext yoksa istek saat dilimi (%s) kullanılır, sunucu yerel saati değil',
        async (zone) => {
          const res = await rec({}).set('x-client-timezone', zone).expect(201);
          const before = new Date();
          const stored = await t
            .model<{
              timeContext: { hour: number; dayOfWeek: number };
            }>('AiRecommendation')
            .findById(data<{ recommendationId: string }>(res).recommendationId)
            .lean();
          const hourIn = (d: Date) =>
            Number(
              new Intl.DateTimeFormat('en-GB', {
                timeZone: zone,
                hour: '2-digit',
                hourCycle: 'h23',
              }).format(d),
            );
          const dowIn = (d: Date) =>
            new Date(`${dateKeyInZone(d, zone)}T00:00:00Z`).getUTCDay();
          // İstek ile okuma arasında saat dönebilir: iki kabul edilebilir değer.
          const hours = [hourIn(before), (hourIn(before) + 23) % 24];
          expect(hours).toContain(stored?.timeContext.hour);
          expect([dowIn(before), (dowIn(before) + 6) % 7]).toContain(
            stored?.timeContext.dayOfWeek,
          );
        },
      );
    });
  });

  describe('ai chat', () => {
    const conv = (firstMessage: unknown) =>
      send('post', '/v1/ai/chat/conversations', { firstMessage });
    it.each([
      ['boş', ''],
      ['yalnız boşluk', '   '],
      ['2001', 'a'.repeat(2001)],
      ['sayı', 5],
    ])('[BOUND] firstMessage %s → 400', async (_n, v) => {
      await conv(v).expect(400);
    });
    it('[BOUND] firstMessage 2000 karakter → 201', async () => {
      await conv('a'.repeat(2000)).expect(201);
    });
    it.each([
      ['0', '0'],
      ['51', '51'],
      ['abc', 'abc'],
      ['-1', '-1'],
      ['1.5', '1.5'],
    ])('[BOUND] page/limit sayfalama (%s) → 400', async (_n, v) => {
      await get('/v1/ai/chat/conversations')
        .query({ page: v })
        .expect(
          v === '0' || v === 'abc' || v === '-1' || v === '1.5' ? 400 : 200,
        );
      await get('/v1/ai/chat/conversations').query({ limit: v }).expect(400);
    });
    it('[BOUND] limit 50 ve page 1 → 200', async () => {
      await get('/v1/ai/chat/conversations')
        .query({ page: 1, limit: 50 })
        .expect(200);
    });
  });

  // ===================================================================
  describe('devices / events / users', () => {
    const reg = (o: Record<string, unknown>) =>
      send(
        'post',
        '/v1/devices/register',
        { deviceId: 'device-12345', platform: 'ios', ...o },
        null,
      );

    it.each([
      ['7', 'abcdefg', 400],
      ['8', 'abcdefgh', 200],
    ])('[BOUND] deviceId uzunluğu %s', async (_n, deviceId, status) => {
      await reg({ deviceId }).expect(status);
    });
    it.each([
      ['de', 'locale'],
      ['', 'locale'],
    ])('[BOUND] locale=%p → 400', async (v) => {
      await reg({ locale: v }).expect(400);
    });
    it.each(['Mars/Base', 'A'.repeat(65), '', 'UTC+3', 5])(
      '[BOUND] timezone=%p → 400',
      async (timezone) => {
        await reg({ timezone }).expect(400);
      },
    );
    it.each([['tr'], ['en']])('locale=%s 200', async (locale) => {
      await reg({ locale }).expect(200);
    });
    it('timezone Europe/Istanbul ve America/Los_Angeles → 200; platform bozuk → 400', async () => {
      await reg({ timezone: 'Europe/Istanbul' }).expect(200);
      await reg({ timezone: 'America/Los_Angeles' }).expect(200);
      await reg({ platform: 'windows' }).expect(400);
    });

    const events = (n: number, extra: unknown[] = []) =>
      send(
        'post',
        '/v1/events',
        {
          deviceId: 'device-12345',
          events: [
            ...Array.from({ length: n }, () => ({
              name: 'app_open',
              ts: new Date().toISOString(),
            })),
            ...extra,
          ],
        },
        null,
      );
    it('[BOUND] events: 0 → 400, 1 → 200, 50 → 200, 51 → 400', async () => {
      await events(0).expect(400);
      await events(1).expect(200);
      await events(50).expect(200);
      await events(51).expect(400);
    });
    it('[CHAR] bozuk tek olay isteği reddetmez (null, sayı, kötü ts/ad atlanır) → 200', async () => {
      await events(1, [
        null,
        5,
        'x',
        { name: 'AB', ts: 'bad' },
        { name: 'ab', ts: 'bad' },
      ]).expect(200);
    });

    it.each([
      ['00:00', 200],
      ['23:59', 200],
      ['08:30', 200],
      ['24:00', 400],
      ['8:00', 400],
      ['23:60', 400],
      ['', 400],
      ['12:5', 400],
      ['aa:bb', 400],
    ])('[BOUND] reminderTime=%p → %i', async (reminderTime, status) => {
      await send('patch', `/v1/users/${user.userId}/preferences`, {
        reminderTime,
      }).expect(status);
    });
    it('[BOUND] preferences enum/tip hataları 400, onboarding purpose tip hatası 400', async () => {
      const prefs = (b: unknown) =>
        send('patch', `/v1/users/${user.userId}/preferences`, b);
      await prefs({ hapticsPattern: 'bogus' }).expect(400);
      await prefs({ fontFamily: 'comic-sans' }).expect(400);
      await prefs({ hapticsEnabled: 'yes' }).expect(400);
      await prefs({ dailyReminder: 1 }).expect(400);
      await send('patch', `/v1/users/${user.userId}/onboarding`, {
        purpose: 5,
      }).expect(400);
    });
  });

  // ===================================================================
  describe('x-client-timezone', () => {
    const edge = (zoneHeader: string | null, offsetDays: number) => {
      const r = send(
        'post',
        '/v1/dhikr-logs',
        logBody({ date: shiftDateKey(today, offsetDays) }),
      );
      return zoneHeader === null ? r : r.set('x-client-timezone', zoneHeader);
    };
    it.each(['X/Y', 'A'.repeat(65), '', 'Mars/Base'])(
      'geçersiz başlık (%p) → İstanbul kuralı: bugün+1 201, bugün+2 400 (500 değil)',
      async (zone) => {
        await edge(zone, 1).expect(201);
        await edge(zone, 2).expect(400);
      },
    );
    it('küçük harfli geçerli ad (america/new_york) kanonikleşir, 500 vermez', async () => {
      const res = await edge('america/new_york', 0);
      expect(res.status).toBe(201);
    });
  });

  // ===================================================================
  describe('user-dhikrs metin sınırları (120/240/240/500, clientId 120)', () => {
    const ud = (body: Record<string, unknown>) =>
      send('post', '/v1/user-dhikrs', {
        clientId: `c-${randomUUID()}`,
        ...body,
      });
    it.each([
      ['name', 120],
      ['transliteration', 240],
      ['arabic', 240],
      ['meaning', 500],
      ['clientId', 120],
    ])('[BOUND] %s: %i karakter 201, +1 → 400', async (field, max) => {
      await ud({ [field]: 'ş'.repeat(max) }).expect(201);
      await ud({ [field]: 'ş'.repeat(max + 1) }).expect(400);
    });
    it('[BOUND] PATCH aynı sınırlar', async () => {
      await ud({ clientId: 'patch-me', name: 'x' }).expect(201);
      for (const [field, max] of [
        ['name', 120],
        ['transliteration', 240],
        ['arabic', 240],
        ['meaning', 500],
      ] as const) {
        await send('patch', '/v1/user-dhikrs/patch-me', {
          [field]: 'ş'.repeat(max),
        }).expect(200);
        await send('patch', '/v1/user-dhikrs/patch-me', {
          [field]: 'ş'.repeat(max + 1),
        }).expect(400);
      }
    });
    it('[BOUND] target: -1, 1.5, "5" → 400; 0 → 201; isFavorite metin → 400; alan tipi sayı → 400', async () => {
      await ud({ target: -1 }).expect(400);
      await ud({ target: 1.5 }).expect(400);
      await ud({ target: '5' }).expect(400);
      await ud({ isFavorite: 'x' }).expect(400);
      await ud({ name: 5 }).expect(400);
    });
    it('boş gövde 201 (hiçbir alan zorunlu değil; clientId üretilir — bilinçli, istemci taslak kaydı bunu kullanır)', async () => {
      await send('post', '/v1/user-dhikrs', {}).expect(201);
    });
    it('[BOUND] target: 0 (hedef yok — mobil boş hedefi 0 gönderir), 1 ve 100000 → 201; 100001, 2^31, 1e300 → 400 (A-02 tavanı); PATCH aynı', async () => {
      await ud({ target: 0 }).expect(201);
      await ud({ target: 1 }).expect(201);
      await ud({ clientId: 'tgt', target: 100_000 }).expect(201);
      for (const target of [100_001, 2 ** 31, 1e300]) {
        await ud({ target }).expect(400);
        await send('patch', '/v1/user-dhikrs/tgt', { target }).expect(400);
      }
      await send('patch', '/v1/user-dhikrs/tgt', { target: 5 }).expect(200);
    });
  });

  // ===================================================================
  describe('vird.phases', () => {
    const program = (phases: unknown, o: Record<string, unknown> = {}) =>
      send('post', '/v1/vird/programs', {
        title: { tr: 'P', en: 'P' },
        kind: 'routine',
        startDate: today,
        phases,
        ...o,
      });
    const phase = (o: Record<string, unknown> = {}) => ({
      fromDay: 1,
      slots: { morning: [{ dhikrId, target: 1 }] },
      ...o,
    });

    it('[BOUND] 61 faz → 400; fromDay 0 → 400; toDay 0 → 400; target 0 / 1.5 → 400', async () => {
      await program(
        Array.from({ length: 61 }, (_, i) => phase({ fromDay: i + 1 })),
      ).expect(400);
      await program([phase({ fromDay: 0 })]).expect(400);
      await program([phase({ toDay: 0 })]).expect(400);
      await program([
        phase({ slots: { morning: [{ dhikrId, target: 0 }] } }),
      ]).expect(400);
      await program([
        phase({ slots: { morning: [{ dhikrId, target: 1.5 }] } }),
      ]).expect(400);
    });
    it('[BOUND] kind/prayerSelection/title/source geçersiz → 400', async () => {
      await program([phase()], { kind: 'bogus' }).expect(400);
      await program([phase()], { prayerSelection: [0] }).expect(400);
      await program([phase()], { prayerSelection: [6] }).expect(400);
      await program([phase()], { title: { tr: 'x' } }).expect(400);
      await program([phase()], { title: 'x' }).expect(400);
      await program([phase()], { source: 'bogus' }).expect(400);
    });
    it('[BOUND] manuel program: phases eksik / dizi değil → 400', async () => {
      await program(undefined).expect(400);
      await program('x').expect(400);
    });
    it('katalogda olmayan dhikrId ile program → 400 Türkçe mesaj; customDhikrId kontrol edilmez', async () => {
      const res = await program([
        phase({ slots: { morning: [{ dhikrId: OID, target: 1 }] } }),
      ]).expect(400);
      expect(JSON.stringify(res.body)).toContain('katalogda');
      await program([
        phase({ slots: { morning: [{ customDhikrId: 'c-1', target: 1 }] } }),
      ]).expect(201);
      await program([phase()]).expect(201);
    });
    it('PATCH ile de olmayan dhikrId → 400', async () => {
      const ok = await program([phase()]).expect(201);
      const id = data<{ _id: string }>(ok)._id;
      await send('patch', `/v1/vird/programs/${id}`, {
        phases: [phase({ slots: { morning: [{ dhikrId: OID, target: 1 }] } })],
      }).expect(400);
    });
    it('[CHAR] toDay < fromDay tek başına (routine) 500 vermez (❓ S24: ürün kuralı belirsiz)', async () => {
      const res = await program([phase({ fromDay: 5, toDay: 2 })]);
      expect(res.status).toBeLessThan(500);
    });
    it('[BOUND] 60 faz sınırı: journey, bitişik 60 faz → 5xx değil', async () => {
      const res = await program(
        Array.from({ length: 60 }, (_, i) =>
          phase({ fromDay: i + 1, toDay: i + 1 }),
        ),
        { kind: 'journey' },
      );
      expect(res.status).toBeLessThan(500);
    });
  });

  // ===================================================================
  // ===================================================================
  describe('zorunlu iç içe alanlar eksikse 400 (500 değil)', () => {
    const program = (o: Record<string, unknown>) =>
      send('post', '/v1/vird/programs', {
        title: { tr: 'P', en: 'P' },
        kind: 'routine',
        startDate: today,
        phases: [{ fromDay: 1, slots: { morning: [{ dhikrId, target: 1 }] } }],
        ...o,
      });
    it('vird: title yok / title.en yok / faz slots yok / reminders.slots yok → 400', async () => {
      await program({ title: undefined }).expect(400);
      await program({ title: { tr: 'x' } }).expect(400);
      await program({ phases: [{ fromDay: 1 }] }).expect(400);
      await program({ reminders: { enabled: false } }).expect(400);
      await program({
        reminders: { enabled: false, slots: { morning: true } },
      }).expect(400);
    });
    it('vird PATCH: title.en yok / faz slots yok → 400', async () => {
      const created = data<{ _id: string }>(await program({}).expect(201));
      await send('patch', `/v1/vird/programs/${created._id}`, {
        title: { tr: 'x' },
      }).expect(400);
      await send('patch', `/v1/vird/programs/${created._id}`, {
        phases: [{ fromDay: 1 }],
      }).expect(400);
    });
    it('vird title ve special-days name boş metin / yalnız boşluk → 400 (şema required → eskiden 500)', async () => {
      await program({ title: { tr: '', en: '' } }).expect(400);
      await program({ title: { tr: 'x', en: '   ' } }).expect(400);
      const created = data<{ _id: string }>(await program({}).expect(201));
      await send('patch', `/v1/vird/programs/${created._id}`, {
        title: { tr: '', en: 'x' },
      }).expect(400);
      const sd = (name: unknown) =>
        request(t.http).post('/v1/special-days').set(ADMIN).send({
          name,
          type: 'kandil',
          date: '2026-12-01',
          hijriDate: '1448-06-01',
        });
      await sd({ tr: '', en: '' }).expect(400);
      await sd({ tr: 'G', en: ' ' }).expect(400);
    });
    it('special-days (admin): practices elemanında title/description yok → 400', async () => {
      await request(t.http)
        .post('/v1/special-days')
        .set(ADMIN)
        .send({
          name: { tr: 'G', en: 'D' },
          type: 'kandil',
          date: '2026-12-01',
          hijriDate: '1448-06-01',
          practices: [{}],
        })
        .expect(400);
    });
    it('special-days (admin): name yok / name.en yok → 400', async () => {
      const base = {
        type: 'kandil',
        date: '2026-12-01',
        hijriDate: '1448-06-01',
      };
      await request(t.http)
        .post('/v1/special-days')
        .set(ADMIN)
        .send(base)
        .expect(400);
      await request(t.http)
        .post('/v1/special-days')
        .set(ADMIN)
        .send({ ...base, name: { tr: 'x' } })
        .expect(400);
    });
  });

  describe('dhikrs (admin): fazilet + diğer yerelleştirilmiş alanlar boş olamaz', () => {
    const L = (v = 'a') => ({ tr: v, en: v });
    const body = (o: Record<string, unknown> = {}) => ({
      nameArabic: 'سبحان الله',
      name: L('ad'),
      transliteration: L('tr'),
      meaning: L('anlam'),
      virtue: L('fazilet'),
      source: L('kaynak'),
      ...o,
    });
    const create = (o: Record<string, unknown> = {}) =>
      request(t.http).post('/v1/dhikrs').set(ADMIN).send(body(o));

    it('[BUG:B15] boş / yalnız boşluk virtue (tr veya en) → 400 (500 değil); dolu virtue → 201', async () => {
      await create({ virtue: L('') }).expect(400);
      await create({ virtue: L('   ') }).expect(400);
      await create({ virtue: { tr: 'dolu', en: '' } }).expect(400);
      await create({ virtue: { tr: '', en: 'full' } }).expect(400);
      await create({ virtue: { tr: 'dolu' } }).expect(400);
      await create().expect(201);
    });

    it.each(['name', 'transliteration', 'meaning', 'virtue', 'source'])(
      '[BUG:B15] %s hiç gönderilmezse → 400 (500 değil)',
      async (field) => {
        await create({ [field]: undefined }).expect(400);
      },
    );

    it.each(['name', 'transliteration', 'meaning', 'source'])(
      '[BUG:B15] boş %s → 400 (500 değil)',
      async (field) => {
        await create({ [field]: L('') }).expect(400);
        await create({ [field]: L('  ') }).expect(400);
      },
    );
    it('[BUG:B15] boş nameArabic → 400', async () => {
      await create({ nameArabic: '' }).expect(400);
      await create({ nameArabic: '   ' }).expect(400);
    });

    it('[BUG:B15] PATCH: virtue boş → 400, fazilet doluyken güncellenebilir; kayıt bozulmaz', async () => {
      const created = data<{ _id: string }>(await create().expect(201));
      const patch = (b: Record<string, unknown>) =>
        request(t.http).patch(`/v1/dhikrs/${created._id}`).set(ADMIN).send(b);
      await patch({ virtue: L('') }).expect(400);
      await patch({ virtue: L('  ') }).expect(400);
      await patch({ virtue: L('yeni fazilet') }).expect(200);
      const stored = await t
        .model<{ virtue: { tr: string } }>('Dhikr')
        .findById(created._id)
        .lean();
      expect(stored?.virtue.tr).toBe('yeni fazilet');
    });

    it('[BOUND] recommendedCount 0 → 400; timeOfDay bozuk → 400; tags dizi değil → 400; isVerified metin → 400', async () => {
      await create({ recommendedCount: 0 }).expect(400);
      await create({ recommendedCount: 1.5 }).expect(400);
      await create({ timeOfDay: ['bogus'] }).expect(400);
      await create({ tags: 'x' }).expect(400);
      await create({ isVerified: 'yes' }).expect(400);
      await create({
        recommendedCount: 33,
        timeOfDay: ['sabah'],
        tags: ['a'],
      }).expect(201);
    });

    it('[BOUND] GET /v1/dhikrs sorgu filtreleri: timeOfDay/isVerified/isActive bozuk → 400; regex özel karakterli tag/category → 200', async () => {
      await get('/v1/dhikrs', null).query({ timeOfDay: 'bogus' }).expect(400);
      await get('/v1/dhikrs', null).query({ isVerified: 'maybe' }).expect(400);
      await get('/v1/dhikrs', null).query({ isActive: 'maybe' }).expect(400);
      await get('/v1/dhikrs', null)
        .query({ tag: '[(', category: '\\' })
        .expect(200);
      await get('/v1/dhikrs/lookup', null).expect(400);
    });
  });

  // ===================================================================
  describe('ObjectId biçimleri: bozuk id asla 500 vermez', () => {
    // Yol parametresi: kaynak var olamaz → 404 (ya da sahiplik 403). Sorgu/gövde: 400.
    const pathCases: [
      string,
      string,
      'get' | 'post' | 'patch' | 'delete',
      unknown?,
    ][] = [
      ['dhikr-logs/:id', '/v1/dhikr-logs/xyz', 'get'],
      ['vird program GET', '/v1/vird/programs/xyz', 'get'],
      ['vird program PATCH', '/v1/vird/programs/xyz', 'patch', {}],
      ['vird program DELETE', '/v1/vird/programs/xyz', 'delete'],
      ['vird program activate', '/v1/vird/programs/xyz/activate', 'post'],
      ['circles/:id', '/v1/circles/xyz', 'get'],
      ['circles leave', '/v1/circles/xyz/leave', 'post'],
      ['circles close', '/v1/circles/xyz/close', 'post'],
      ['subscriptions/:id', '/v1/subscriptions/xyz', 'get'],
      [
        'ai select',
        '/v1/ai/recommendations/xyz/select',
        'patch',
        { selectedDhikrId: OID },
      ],
      ['chat messages GET', '/v1/ai/chat/conversations/xyz/messages', 'get'],
      [
        'chat messages POST',
        '/v1/ai/chat/conversations/xyz/messages',
        'post',
        { message: 'x' },
      ],
      ['users/:id', '/v1/users/xyz', 'get'],
      ['streaks/:userId', '/v1/streaks/xyz', 'get'],
      ['streaks recalc', '/v1/streaks/xyz/recalculate', 'post'],
      ['sync-user', '/v1/subscriptions/sync-user/xyz', 'post', {}],
    ];
    // jest: satır uzunluğu < fonksiyon parametresi ise 4. argüman `done` sanılır → body her satırda var.
    it.each(pathCases.map(([n, p, m, b]) => [n, p, m, b ?? null] as const))(
      'JWT yol: %s → 400/403/404',
      async (_n, path, method, body) => {
        const r =
          method === 'get' ? await get(path) : await send(method, path, body);
        expect([400, 403, 404]).toContain(r.status);
      },
    );

    it.each([
      ['dhikrs/:id GET', 'get', '/v1/dhikrs/xyz'],
      ['dhikrs/:id PATCH', 'patch', '/v1/dhikrs/xyz'],
      ['dhikrs/:id DELETE', 'delete', '/v1/dhikrs/xyz'],
      ['special-days/:id', 'get', '/v1/special-days/xyz'],
      ['special-days/:id/detail', 'get', '/v1/special-days/xyz/detail'],
      ['special-days PATCH', 'patch', '/v1/special-days/xyz'],
      ['special-days DELETE', 'delete', '/v1/special-days/xyz'],
      ['dhikr-collections/:key', 'get', '/v1/dhikr-collections/xyz'],
      ['vird templates/:key', 'get', '/v1/vird/templates/xyz'],
      ['circles preview', 'get', '/v1/circles/preview/xyz'],
    ] as const)('açık/admin yol: %s → 400/404', async (_n, method, path) => {
      const r =
        method === 'get'
          ? await get(path, null)
          : await send(method, path, {}, null).set(ADMIN);
      expect([400, 404]).toContain(r.status);
    });

    it('sorgu/gövde id: bozuk → 400', async () => {
      await get('/v1/dhikr-logs').query({ dhikrId: 'xyz' }).expect(400);
      await get('/v1/dhikr-logs').query({ userId: 'xyz' }).expect(400);
      await get('/v1/vird/today').query({ programId: 'xyz' }).expect(400);
      await send('delete', '/v1/dhikr-logs/by-dhikr?dhikrId=xyz').expect(400);
      await send('patch', '/v1/dhikr-logs/favorite/by-dhikr', {
        dhikrId: 'xyz',
        isFavorite: true,
      }).expect(400);
      await send('post', '/v1/circles', {
        dhikrId: 'xyz',
        goalCount: 1,
      }).expect(400);
      await send('post', '/v1/vird/programs', {
        title: { tr: 'P', en: 'P' },
        kind: 'routine',
        startDate: today,
        phases: [
          { fromDay: 1, slots: { morning: [{ dhikrId: 'xyz', target: 1 }] } },
        ],
      }).expect(400);
      await send('patch', `/v1/ai/recommendations/${OID}/select`, {
        selectedDhikrId: 'xyz',
      }).expect(400);
    });

    it('12 karakterlik metin (eski mongoose 12-byte ObjectId tuzağı) ObjectId sayılmaz, 500 vermez', async () => {
      const twelve = 'abcdefghijkl'; // 12 byte: eski sürümlerde ObjectId.isValid → true
      await get('/v1/dhikr-logs').query({ dhikrId: twelve }).expect(400);
      const r = await get(`/v1/dhikr-logs/${twelve}`);
      expect(r.status).toBeLessThan(500);
      const d = await get(`/v1/dhikrs/${twelve}`, null);
      expect(d.status).toBeLessThan(500);
    });
  });
});
