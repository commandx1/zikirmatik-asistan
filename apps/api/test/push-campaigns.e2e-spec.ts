import { Types } from 'mongoose';
import fc from 'fast-check';
import request from 'supertest';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import type { SpecialDayDocument } from '../src/modules/special-days/schemas/special-day.schema';
import type { DeviceDocument } from '../src/modules/devices/schemas/device.schema';
import { PushSenderService } from '../src/modules/push/push-sender.service';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import {
  bearer,
  data,
  makePremium,
  seedDhikr,
  signIn,
} from './helpers/fixtures';
import { istanbulDateKey } from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import { atInstant } from './helpers/clock';

const SECRET = 'test-campaign-secret'; // setup-env.ts CAMPAIGN_TRIGGER_SECRET

describe('PushCampaigns (e2e)', () => {
  let t: TestApp;

  // createTestApp PushSenderService'i jest.fn'li bir değerle değiştirir.
  const pushSendMock = () =>
    t.app.get<
      PushSenderService,
      { sendToDevices: jest.MockedFunction<PushSenderService['sendToDevices']> }
    >(PushSenderService).sendToDevices;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await t?.close();
  });

  it('header yok → 401', async () => {
    await request(t.http)
      .post('/internal/campaigns/winback')
      .send({ dryRun: true })
      .expect(401);
  });

  it('yanlış secret → 401', async () => {
    await request(t.http)
      .post('/internal/campaigns/winback')
      .set('x-campaign-secret', 'wrong')
      .send({ dryRun: true })
      .expect(401);
  });

  it('bilinmeyen kampanya → 400', async () => {
    await request(t.http)
      .post('/internal/campaigns/does-not-exist')
      .set('x-campaign-secret', SECRET)
      .send({ dryRun: true })
      .expect(400);
  });

  it('doğru secret + winback dryRun:true → 200 ve sendToDevices çağrılmadı', async () => {
    const pushSender = t.app.get(PushSenderService);
    const sendSpy = jest.spyOn(pushSender, 'sendToDevices');

    const res = await request(t.http)
      .post('/internal/campaigns/winback')
      .set('x-campaign-secret', SECRET)
      .send({ dryRun: true })
      .expect(200);

    const body = data<{ campaign: string; dryRun: boolean; sent: number }>(res);
    expect(body.campaign).toBe('winback');
    expect(body.dryRun).toBe(true);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('sessiz saat (İstanbul 02:00): quietHours sayılır, sent:0', async () => {
    // Yalnız Date'i sabitler; setTimeout/setImmediate vb. gerçek kalır ki
    // Mongo sürücüsü kilitlenmesin (bkz. brief notu).
    const twoAmIstanbul = new Date('2026-09-25T02:00:00+03:00').getTime();

    // Winback [3,4) günlük pasiflik penceresine düşen, token'ı olan bir
    // cihaz — sessiz saat filtresi olmasa aday sayılırdı.
    const deviceModel = t.model<DeviceDocument>('Device');
    await deviceModel.create({
      deviceId: 'device-quiet-hours',
      expoPushToken: 'ExponentPushToken[quiet]',
      platform: 'ios',
      isActive: true,
      lastSeenAt: new Date(twoAmIstanbul - 3.5 * 24 * 60 * 60 * 1000),
    });

    jest.useFakeTimers({
      now: twoAmIstanbul,
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
      ],
    });

    const res = await request(t.http)
      .post('/internal/campaigns/winback')
      .set('x-campaign-secret', SECRET)
      .send({ dryRun: false })
      .expect(200);

    const body = data<{
      candidates: number;
      sent: number;
      skipped: { quietHours: number };
    }>(res);
    expect(body.candidates).toBe(1);
    expect(body.sent).toBe(0);
    expect(body.skipped.quietHours).toBe(1);
  });

  describe('kandil: cihaz yerel gününe göre (A-18, API-PSH-16)', () => {
    // 18:30Z: İstanbul 21:30 (10 Eki, sessiz saat dışı), Kiritimati 08:30 (11 Eki)
    const NOW = new Date('2026-10-10T18:30:00Z').getTime();
    const fakeNow = () =>
      jest.useFakeTimers({
        now: NOW,
        doNotFake: [
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
          'setImmediate',
          'clearImmediate',
          'nextTick',
          'queueMicrotask',
        ],
      });

    async function seed(kandilDate: string) {
      await t.model<SpecialDayDocument>('SpecialDay').create({
        name: { tr: 'Test Kandili', en: 'Test Kandil' },
        type: 'kandil',
        date: kandilDate,
        hijriDate: '1448-01-01',
        priority: 50,
        isActive: true,
      });
      const deviceModel = t.model<DeviceDocument>('Device');
      const base = {
        platform: 'ios' as const,
        isActive: true,
        lastSeenAt: new Date(NOW),
      };
      await deviceModel.create([
        {
          ...base,
          deviceId: 'dev-ist',
          expoPushToken: 'ExponentPushToken[ist]',
          timezone: 'Europe/Istanbul',
        },
        {
          ...base,
          deviceId: 'dev-kir',
          expoPushToken: 'ExponentPushToken[kir]',
          timezone: 'Pacific/Kiritimati',
        },
        {
          ...base,
          deviceId: 'dev-none',
          expoPushToken: 'ExponentPushToken[none]',
        },
      ]);
    }

    async function trigger(campaign: string) {
      const send = pushSendMock();
      send.mockClear();
      fakeNow();
      const res = await request(t.http)
        .post(`/internal/campaigns/${campaign}`)
        .set('x-campaign-secret', SECRET)
        .send({})
        .expect(200);
      jest.useRealTimers();
      const sentTo = send.mock.calls.map(([targets]) => targets[0].deviceId);
      return { sentTo: sentTo.sort(), body: data<{ sent: number }>(res) };
    }

    it('kandil-eve: yerel yarını kandil olan cihazlara gider', async () => {
      await seed('2026-10-12'); // yalnız Kiritimati'nin yarını
      expect((await trigger('kandil-eve')).sentTo).toEqual(['dev-kir']);
    });

    it('kandil-eve: bölgesiz cihaz İstanbul gibi (yarın 11 Eki)', async () => {
      await seed('2026-10-11');
      expect((await trigger('kandil-eve')).sentTo).toEqual([
        'dev-ist',
        'dev-none',
      ]);
    });

    it('kandil-day: yerel bugünü kandil olan cihazlara gider', async () => {
      await seed('2026-10-11'); // Kiritimati bugün
      expect((await trigger('kandil-day')).sentTo).toEqual(['dev-kir']);
    });
  });

  it('Expo bilet hatası dönerse sent sayılmaz, skipped.error artar (B17)', async () => {
    const NOW = new Date('2026-10-10T09:00:00Z').getTime(); // İstanbul 12:00
    await t.model<DeviceDocument>('Device').create({
      deviceId: 'dev-err',
      expoPushToken: 'ExponentPushToken[err]',
      platform: 'ios',
      isActive: true,
      lastSeenAt: new Date(NOW - 3.5 * 24 * 60 * 60 * 1000),
    });
    const send = pushSendMock();
    send.mockResolvedValueOnce({
      sentCount: 0,
      skippedCount: 0,
      ticketErrorCount: 1,
      deactivatedDeviceIds: [],
    });
    jest.useFakeTimers({
      now: NOW,
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
      ],
    });
    const res = await request(t.http)
      .post('/internal/campaigns/winback')
      .set('x-campaign-secret', SECRET)
      .send({})
      .expect(200);
    const body = data<{ sent: number; skipped: { error: number } }>(res);
    expect(body.sent).toBe(0);
    expect(body.skipped.error).toBe(1);
  });

  // ── QA: PSH-01/02/04/05/07/08/09/15/17/19, TZ-13 ─────────────────────────
  describe('kampanya başına yollar, dil, sessiz saat, günlük tavan', () => {
    const ALL = ['winback', 'kandil-eve', 'kandil-day', 'weekly-summary'];
    const trigger = (
      campaign: string,
      at: Date,
      body: Record<string, unknown> = {},
    ) =>
      atInstant(at, async () => {
        const res = await request(t.http)
          .post(`/internal/campaigns/${campaign}`)
          .set('x-campaign-secret', SECRET)
          .send(body)
          .expect(200);
        return data<{
          candidates: number;
          sent: number;
          dryRun: boolean;
          skipped: {
            dedupe: number;
            quietHours: number;
            noToken: number;
            prefs: number;
            error: number;
          };
        }>(res);
      });
    const dispatchCount = () => t.model('PushDispatch').countDocuments({});
    const sentPayloads = () =>
      pushSendMock().mock.calls.map(([targets, msg]) => ({
        deviceId: targets[0].deviceId,
        title: msg.title,
        body: msg.body,
      }));
    const device = (deviceId: string, extra: Record<string, unknown> = {}) =>
      t.model<DeviceDocument>('Device').create({
        deviceId,
        expoPushToken: `ExponentPushToken[${deviceId}]`,
        platform: 'ios',
        isActive: true,
        ...extra,
      });
    const kandil = (date: string) =>
      t.model<SpecialDayDocument>('SpecialDay').create({
        name: { tr: 'Regaib Kandili', en: 'Regaib Night' },
        type: 'kandil',
        date,
        hijriDate: '1448-01-01',
        priority: 50,
        isActive: true,
      });

    // İstanbul 12:00 (sessiz saat dışı)
    const NOON = new Date('2026-10-10T09:00:00Z');

    beforeEach(() => pushSendMock().mockClear());

    it.each(ALL)('PSH-01: %s secret yok/yanlış → 401', async (campaign) => {
      await request(t.http)
        .post(`/internal/campaigns/${campaign}`)
        .send({})
        .expect(401);
      await request(t.http)
        .post(`/internal/campaigns/${campaign}`)
        .set('x-campaign-secret', 'yanlis')
        .send({})
        .expect(401);
    });

    it('PSH-02: bilinmeyen kampanya + yanlış secret → 401 (secret önce), doğru secret → 400', async () => {
      await request(t.http)
        .post('/internal/campaigns/nope')
        .set('x-campaign-secret', 'yanlis')
        .send({})
        .expect(401);
      await request(t.http)
        .post('/internal/campaigns/nope')
        .set('x-campaign-secret', SECRET)
        .send({})
        .expect(400);
    });

    it.each(['kandil-eve', 'kandil-day', 'weekly-summary'])(
      'PSH-04: %s dryRun → sayı döner, gönderim ve rezervasyon yok',
      async (campaign) => {
        await kandil('2026-10-11'); // eve: yarın, day: bugün için ayrı gün
        await kandil('2026-10-10');
        await device('dev-dry-1');
        const res = await trigger(campaign, NOON, { dryRun: true });
        expect(res.dryRun).toBe(true);
        expect(pushSendMock()).not.toHaveBeenCalled();
        expect(await dispatchCount()).toBe(0);
        if (campaign !== 'weekly-summary') expect(res.sent).toBe(1);
      },
    );

    it('PSH-15/19: kandil-eve/day metni cihaz diline göre (en → name.en, locale yok → tr)', async () => {
      await kandil('2026-10-11');
      await kandil('2026-10-10');
      await device('dev-en', { locale: 'en' });
      await device('dev-tr', { locale: 'tr' });
      await device('dev-old'); // locale alanı yok → tr

      await trigger('kandil-eve', NOON);
      const eve = Object.fromEntries(
        sentPayloads().map((p) => [p.deviceId, p]),
      );
      expect(eve['dev-en']).toMatchObject({
        title: 'Regaib Night',
        body: expect.stringContaining('is tomorrow') as string,
      });
      expect(eve['dev-tr'].body).toBe(
        'Yarın Regaib Kandili. Hazırlık için özel gün rehberine göz at.',
      );
      expect(eve['dev-old'].body).toBe(eve['dev-tr'].body);

      pushSendMock().mockClear();
      await t.model('PushDispatch').deleteMany({});
      await trigger('kandil-day', NOON);
      const day = Object.fromEntries(
        sentPayloads().map((p) => [p.deviceId, p]),
      );
      expect(day['dev-en'].body).toContain('is today');
      expect(day['dev-en'].body).not.toMatch(/virtue|reward|blessing/i);
      expect(day['dev-tr'].body).toContain('Bugün Regaib Kandili');
    });

    it('PSH-17/19: weekly-summary geçen İstanbul haftası; premium sayı+gün, ücretsiz yalnız sayı; EN/TR; 0 aktivite atlanır', async () => {
      // 2026-10-12 Pazartesi 12:00 İstanbul → geçen hafta 5–11 Ekim
      const monday = new Date('2026-10-12T09:00:00Z');
      const [premium, free, idle] = await Promise.all(
        ['ws-prem', 'ws-free', 'ws-idle'].map((sub) => signIn(t.http, { sub })),
      );
      await t
        .model('User')
        .updateOne({ _id: premium.userId }, { $set: { isPremium: true } });
      const log = (userId: string, date: string, count: number) =>
        t.model<DhikrLogDocument>('DhikrLog').create({
          userId: new Types.ObjectId(userId),
          customDhikrId: 'c1',
          count,
          targetCount: 33,
          date,
        });
      await log(premium.userId, '2026-10-05', 100); // geçen hafta
      await log(premium.userId, '2026-10-11', 50); // geçen hafta (son gün)
      await log(premium.userId, '2026-10-12', 999); // bu hafta → sayılmaz
      await log(premium.userId, '2026-10-04', 999); // önceki hafta → sayılmaz
      await log(free.userId, '2026-10-07', 1); // tekil
      await device('dev-prem-en', {
        userId: new Types.ObjectId(premium.userId),
        locale: 'en',
      });
      await device('dev-prem-tr', {
        userId: new Types.ObjectId(premium.userId),
      });
      await device('dev-free-en', {
        userId: new Types.ObjectId(free.userId),
        locale: 'en',
      });
      await device('dev-idle', { userId: new Types.ObjectId(idle.userId) });

      const res = await trigger('weekly-summary', monday);
      expect(res.sent).toBe(3);
      const byDevice = Object.fromEntries(
        sentPayloads().map((p) => [p.deviceId, p]),
      );
      expect(Object.keys(byDevice).sort()).toEqual([
        'dev-free-en',
        'dev-prem-en',
        'dev-prem-tr',
      ]);
      expect(byDevice['dev-prem-en'].body).toBe(
        'Last week: 150 dhikrs, 2 active days. Keep it up!',
      );
      expect(byDevice['dev-prem-tr'].body).toBe(
        'Geçen hafta 150 zikir, 2 aktif gün. Böyle devam!',
      );
      // tekil çoğul + ücretsiz: yalnız sayı
      expect(byDevice['dev-free-en'].body).toBe(
        'Last week: 1 dhikr. Your detailed weekly report is in Premium.',
      );
    });

    it('PSH-05/TZ-13: sessiz saat cihazın kendi saat dilimine göre; force yok sayar', async () => {
      // 20:30Z → İstanbul 23:30 (sessiz), Berlin 22:30 (sessiz), New York 16:30,
      // Kiritimati 10:30 (ertesi gün)
      const at = new Date('2026-10-10T20:30:00Z');
      const lastSeen = new Date(at.getTime() - 3.5 * 24 * 3600e3);
      for (const [id, tz] of [
        ['q-ist', 'Europe/Istanbul'],
        ['q-ber', 'Europe/Berlin'],
        ['q-ny', 'America/New_York'],
        ['q-kir', 'Pacific/Kiritimati'],
      ] as const) {
        await device(id, { timezone: tz, lastSeenAt: lastSeen });
      }
      const res = await trigger('winback', at);
      expect(res.candidates).toBe(4);
      expect(res.skipped.quietHours).toBe(2);
      expect(
        sentPayloads()
          .map((p) => p.deviceId)
          .sort(),
      ).toEqual(['q-kir', 'q-ny']);

      // force: sessiz saat yok sayılır; bugün gönderilenler dedupe olur
      const forced = await trigger('winback', at, { force: true });
      expect(forced.skipped.quietHours).toBe(0);
      expect(forced.sent).toBe(2);
      expect(forced.skipped.dedupe).toBe(2);
    });

    it('PSH-05: sınır — yerel 22:00 sessiz, 21:59 değil; 08:00 değil, 07:59 sessiz', async () => {
      const winbackAt = async (iso: string, id: string) => {
        const at = new Date(iso);
        await device(id, {
          timezone: 'America/New_York',
          lastSeenAt: new Date(at.getTime() - 3.5 * 24 * 3600e3),
        });
        return trigger('winback', at);
      };
      // New York Ekim = UTC-4
      expect((await winbackAt('2026-10-11T02:00:00Z', 'b-2200')).sent).toBe(0);
      await t.model('Device').deleteMany({});
      expect((await winbackAt('2026-10-11T01:59:00Z', 'b-2159')).sent).toBe(1);
      await t.model('Device').deleteMany({});
      expect((await winbackAt('2026-10-11T12:00:00Z', 'b-0800')).sent).toBe(1);
      await t.model('Device').deleteMany({});
      expect((await winbackAt('2026-10-11T11:59:00Z', 'b-0759')).sent).toBe(0);
    });

    it('PSH-07: bölgesi yok veya geçersiz cihaz İstanbul saatiyle değerlendirilir', async () => {
      // 20:30Z = İstanbul 23:30 → sessiz
      const at = new Date('2026-10-10T20:30:00Z');
      const lastSeen = new Date(at.getTime() - 3.5 * 24 * 3600e3);
      await device('tz-none', { lastSeenAt: lastSeen });
      await device('tz-bad', {
        timezone: 'Mars/Olympus',
        lastSeenAt: lastSeen,
      });
      const res = await trigger('winback', at);
      expect(res.candidates).toBe(2);
      expect(res.skipped.quietHours).toBe(2);
      expect(res.sent).toBe(0);
    });

    it('PSH-08: cihaz başına günde tek kampanya push’u (kampanyalar arası)', async () => {
      await kandil('2026-10-10');
      await device('cap-1', {
        lastSeenAt: new Date(NOON.getTime() - 3.5 * 24 * 3600e3),
      });
      const first = await trigger('winback', NOON);
      expect(first.sent).toBe(1);
      const second = await trigger('kandil-day', NOON);
      expect(second.sent).toBe(0);
      expect(second.skipped.dedupe).toBe(1);
      expect(await dispatchCount()).toBe(1);
    });

    it('PSH-09: aynı kampanya aynı gün ikinci tetik → 0 gönderim; dryRun dedupe gösterir', async () => {
      await kandil('2026-10-10');
      await device('again-1');
      const a = await trigger('kandil-day', NOON);
      const b = await trigger('kandil-day', NOON);
      expect(a.sent).toBe(1);
      expect(b.sent).toBe(0);
      expect(b.skipped.dedupe).toBe(1);
      expect(pushSendMock()).toHaveBeenCalledTimes(1);
      const dry = await trigger('kandil-day', NOON, { dryRun: true });
      expect(dry.sent).toBe(0);
      expect(dry.skipped.dedupe).toBe(1);
    });

    it('PSH-14: prefs.specialDays:false kandil cihazı atlanır', async () => {
      await kandil('2026-10-10');
      await device('pref-off', { prefs: { specialDays: false } });
      await device('pref-on');
      const res = await trigger('kandil-day', NOON);
      expect(res.sent).toBe(1);
      expect(res.skipped.prefs).toBe(1);
      expect(sentPayloads().map((p) => p.deviceId)).toEqual(['pref-on']);
    });

    it('PSH-06: özellik — rastgele an × bölge (DST dahil): sessiz ⇔ yerel saat ∈ [22,24) ∪ [0,8)', async () => {
      const zones = [
        'Europe/Istanbul',
        'Europe/Berlin',
        'America/New_York',
        'Pacific/Kiritimati',
        'Pacific/Auckland',
      ];
      let n = 0;
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...zones),
          fc.date({
            min: new Date('2025-01-01T00:00:00Z'),
            max: new Date('2026-12-31T00:00:00Z'),
            noInvalidDate: true,
          }),
          async (zone, instant) => {
            const hour =
              Number(
                new Intl.DateTimeFormat('en-GB', {
                  timeZone: zone,
                  hourCycle: 'h23',
                  hour: '2-digit',
                }).format(instant),
              ) % 24;
            const quiet = hour >= 22 || hour < 8;
            await device(`prop-${(n += 1)}`, {
              timezone: zone,
              lastSeenAt: new Date(instant.getTime() - 3.5 * 24 * 3600e3),
            });
            const res = await trigger('winback', instant);
            expect(res.candidates).toBe(1);
            expect(res.skipped.quietHours).toBe(quiet ? 1 : 0);
            expect(res.sent).toBe(quiet ? 0 : 1);
            await t.model('Device').deleteMany({});
            await t.model('PushDispatch').deleteMany({});
          },
        ),
        { numRuns: 25 },
      );
    });
  });

  // API-PSH-22
  it('push_dispatches sentAt üzerinde 30 günlük TTL indeksi var', async () => {
    const indexes = await t.model('PushDispatch').collection.indexes();
    const ttl = indexes.find((i) => i.key.sentAt === 1);
    expect(ttl?.expireAfterSeconds).toBe(30 * 24 * 60 * 60);
  });

  // API-PSH-20
  it('halka katılım push’u kampanya günlük tavanından (push_dispatches) etkilenmez', async () => {
    const creator = await signIn(t.http, { sub: 'psh20-creator' });
    const joiner = await signIn(t.http, { sub: 'psh20-joiner' });
    await makePremium(t.model<UserDocument>('User'), creator.userId);
    await t.model<DeviceDocument>('Device').create({
      deviceId: 'psh20-device',
      expoPushToken: 'ExponentPushToken[psh20]',
      platform: 'ios',
      isActive: true,
      userId: new Types.ObjectId(creator.userId),
    });
    // Aynı cihaz bugün kampanya kotasını zaten doldurmuş.
    await t.model('PushDispatch').create({
      campaignKey: 'winback',
      deviceId: 'psh20-device',
      dayKey: istanbulDateKey(new Date()),
      sentAt: new Date(),
    });
    const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    const created = await request(t.http)
      .post('/v1/circles')
      .set(bearer(creator.accessToken))
      .send({ dhikrId, goalCount: 100 })
      .expect(201);
    pushSendMock().mockClear();

    await request(t.http)
      .post('/v1/circles/join')
      .set(bearer(joiner.accessToken))
      .send({ code: data<{ code: string }>(created).code })
      .expect(201);

    expect(pushSendMock()).toHaveBeenCalledTimes(1);
    expect(await t.model('PushDispatch').countDocuments({})).toBe(1);
  });
});
