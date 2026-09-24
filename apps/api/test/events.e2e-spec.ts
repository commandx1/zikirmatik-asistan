import request from 'supertest';
import type { Model } from 'mongoose';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data } from './helpers/fixtures';
import type { AppEventDocument } from '../src/modules/events/schemas/app-event.schema';

function makeEvent(name = 'dhikr_completed') {
  return { name, ts: new Date().toISOString() };
}

describe('Events (e2e)', () => {
  let t: TestApp;
  let appEventModel: Model<AppEventDocument>;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    appEventModel = t.model<AppEventDocument>('AppEvent');
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('POST /v1/events: tokensız 50 olay 200 döner ve hepsi yazılır', async () => {
    const events = Array.from({ length: 50 }, () => makeEvent());
    const res = await request(t.http)
      .post('/v1/events')
      .send({ deviceId: 'events-device-1', events })
      .expect(200);
    expect(data<{ accepted: number }>(res).accepted).toBe(50);
    expect(
      await appEventModel.countDocuments({ deviceId: 'events-device-1' }),
    ).toBe(50);
  });

  it('51 olay ArrayMaxSize ile 400 döner', async () => {
    const events = Array.from({ length: 51 }, () => makeEvent());
    await request(t.http)
      .post('/v1/events')
      .send({ deviceId: 'events-device-2', events })
      .expect(400);
  });

  it('karışık geçerli/geçersiz öğe: istek 200 döner, yalnız geçerliler yazılır', async () => {
    // TrackEventsDto.events @ValidateNested KULLANMIYOR (bkz. dto yorumu):
    // her eleman EventsService.toValidDocument içinde ayrı ayrı doğrulanır,
    // bu yüzden global ValidationPipe burada 400 üretmiyor — geçersiz öğe
    // sessizce atlanıyor (mevcut davranış).
    const events = [
      makeEvent('dhikr_completed'),
      { name: 'GEÇERSİZ-İSİM', ts: new Date().toISOString() }, // Matches pattern fail
      { name: 'ai_chat_sent', ts: 'not-an-iso-date' }, // IsISO8601 fail
      makeEvent('streak_saved'),
    ];

    const res = await request(t.http)
      .post('/v1/events')
      .send({ deviceId: 'events-device-3', events })
      .expect(200);
    expect(data<{ accepted: number }>(res).accepted).toBe(2);

    const stored = await appEventModel
      .find({ deviceId: 'events-device-3' })
      .lean()
      .exec();
    expect(stored.map((e) => e.name).sort()).toEqual([
      'dhikr_completed',
      'streak_saved',
    ]);
  });
});
