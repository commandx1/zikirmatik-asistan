import request from 'supertest';
import type { DeviceDocument } from '../src/modules/devices/schemas/device.schema';
import { PushSenderService } from '../src/modules/push/push-sender.service';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data } from './helpers/fixtures';

const SECRET = 'test-campaign-secret'; // setup-env.ts CAMPAIGN_TRIGGER_SECRET

describe('PushCampaigns (e2e)', () => {
  let t: TestApp;

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
});
