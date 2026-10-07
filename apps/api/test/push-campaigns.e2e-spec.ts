import request from 'supertest';
import type { SpecialDayDocument } from '../src/modules/special-days/schemas/special-day.schema';
import type { DeviceDocument } from '../src/modules/devices/schemas/device.schema';
import { PushSenderService } from '../src/modules/push/push-sender.service';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data } from './helpers/fixtures';

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
});
