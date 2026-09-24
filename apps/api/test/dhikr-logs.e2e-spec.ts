import request from 'supertest';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';

const today = istanbulDateKey(new Date());

describe('DhikrLogs (e2e)', () => {
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

  async function setup() {
    const user = await signIn(t.http, { sub: 'log-user-1' });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);
    return { user, dhikrId };
  }

  it('POST — gövdedeki userId yok sayılır, token sahibi kullanılır', async () => {
    const { user, dhikrId } = await setup();
    const other = await signIn(t.http, { sub: 'log-user-other' });

    const res = await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: other.userId, // yok sayılmalı
        dhikrId,
        count: 5,
        targetCount: 33,
        date: today,
      })
      .expect(201);

    const body = data<{ userId: string }>(res);
    expect(body.userId).toBe(user.userId);
  });

  it('bilinmeyen alan whitelist ile sessizce elenir (400 değil)', async () => {
    const { user, dhikrId } = await setup();

    const res = await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        dhikrId,
        count: 1,
        targetCount: 33,
        date: today,
        unknownField: 'nope',
      })
      .expect(201);

    expect(data<Record<string, unknown>>(res)).not.toHaveProperty(
      'unknownField',
    );
  });

  it('dedupe: aynı {dhikrId,date} için ikinci POST tek belge üretir (son yazan kazanır)', async () => {
    const { user, dhikrId } = await setup();
    const dhikrLogModel = t.model<DhikrLogDocument>('DhikrLog');

    await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: today,
      })
      .expect(201);

    await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        dhikrId,
        count: 33,
        targetCount: 33,
        date: today,
      })
      .expect(201);

    const docs = await dhikrLogModel.find({}).lean().exec();
    expect(docs).toHaveLength(1);
    expect(docs[0].count).toBe(33);
  });

  it('circleId + virdProgramId birlikte → 400', async () => {
    const { user, dhikrId } = await setup();

    await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        dhikrId,
        count: 1,
        targetCount: 33,
        date: today,
        circleId: '507f1f77bcf86cd799439011',
        virdProgramId: '507f1f77bcf86cd799439012',
        virdSlot: 'morning',
      })
      .expect(400);
  });

  it('bulk: 3 kayıt + 1 tekrar → doğru insertedCount ve items sayısı', async () => {
    const { user, dhikrId } = await setup();
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId2 = await seedDhikr(dhikrModel);
    const dhikrId3 = await seedDhikr(dhikrModel);

    const res = await request(t.http)
      .post('/v1/dhikr-logs/bulk')
      .set(bearer(user.accessToken))
      .send({
        items: [
          {
            userId: user.userId,
            dhikrId,
            count: 1,
            targetCount: 33,
            date: today,
          },
          {
            userId: user.userId,
            dhikrId: dhikrId2,
            count: 1,
            targetCount: 33,
            date: today,
          },
          {
            userId: user.userId,
            dhikrId: dhikrId3,
            count: 1,
            targetCount: 33,
            date: today,
          },
          // tekrar: aynı dhikrId + date
          {
            userId: user.userId,
            dhikrId,
            count: 2,
            targetCount: 33,
            date: today,
          },
        ],
      })
      .expect(201);

    const body = data<{ insertedCount: number; items: unknown[] }>(res);
    expect(body.items).toHaveLength(3);
    expect(body.insertedCount).toBe(3);
  });

  it('bulk içinde circleId → 400', async () => {
    const { user, dhikrId } = await setup();

    await request(t.http)
      .post('/v1/dhikr-logs/bulk')
      .set(bearer(user.accessToken))
      .send({
        items: [
          {
            userId: user.userId,
            dhikrId,
            count: 1,
            targetCount: 33,
            date: today,
            circleId: '507f1f77bcf86cd799439011',
          },
        ],
      })
      .expect(400);
  });

  it('GET dateFrom/dateTo filtresi', async () => {
    const { user, dhikrId } = await setup();
    const yesterday = shiftDateKey(today, -1);
    const twoDaysAgo = shiftDateKey(today, -2);

    for (const date of [today, yesterday, twoDaysAgo]) {
      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .send({ userId: user.userId, dhikrId, count: 1, targetCount: 33, date })
        .expect(201);
    }

    const res = await request(t.http)
      .get('/v1/dhikr-logs')
      .query({ dateFrom: yesterday, dateTo: today })
      .set(bearer(user.accessToken))
      .expect(200);

    const items = data<{ date: string }[]>(res);
    expect(items.map((i) => i.date).sort()).toEqual([yesterday, today].sort());
  });

  it('isCompleted:true log sonrası GET /v1/streaks/:userId currentStreak:1', async () => {
    const { user, dhikrId } = await setup();

    await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        dhikrId,
        count: 33,
        targetCount: 33,
        date: today,
        isCompleted: true,
      })
      .expect(201);

    const res = await request(t.http)
      .get(`/v1/streaks/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    expect(data<{ currentStreak: number }>(res).currentStreak).toBe(1);
  });
});
