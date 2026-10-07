import request from 'supertest';
import { Types } from 'mongoose';
import {
  dateKeyInZone,
  istanbulDateKey,
  shiftDateKey,
} from '../src/common/utils/date-keys';
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

// Kullanıcı kararları A-02, A-12, A-13, M-04 (sunucu), bulk hataları (B10).
describe('DhikrLogs — ürün kararları (e2e)', () => {
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

  async function setup(sub = 'log-decisions') {
    const user = await signIn(t.http, { sub });
    const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    return { user, dhikrId };
  }

  // DTO userId ister; controller token sahibiyle ezer.
  const PLACEHOLDER_ID = '000000000000000000000000';

  const post = (
    token: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) =>
    request(t.http)
      .post('/v1/dhikr-logs')
      .set({ ...bearer(token), ...headers })
      .send({ userId: PLACEHOLDER_ID, ...body });

  const postBulk = (token: string, items: Record<string, unknown>[]) =>
    request(t.http)
      .post('/v1/dhikr-logs/bulk')
      .set(bearer(token))
      .send({
        items: items.map((item) => ({ userId: PLACEHOLDER_ID, ...item })),
      });

  // API-LOG: A-02
  it('A-02: tek kayıtta count 100000 geçerli, 100001 → 400 (tekil ve bulk)', async () => {
    const { user, dhikrId } = await setup();
    const base = { dhikrId, targetCount: 100, date: today };

    await post(user.accessToken, { ...base, count: 100000 }).expect(201);
    await post(user.accessToken, { ...base, count: 100001 }).expect(400);
    await postBulk(user.accessToken, [{ ...base, count: 100001 }]).expect(400);
  });

  // API-LOG: A-12
  it('A-12: tarih bugün+1 geçerli, bugün+2 → 400; imkânsız takvim günü → 400', async () => {
    const { user, dhikrId } = await setup('log-date');
    const base = { dhikrId, count: 1, targetCount: 33 };

    await post(user.accessToken, {
      ...base,
      date: shiftDateKey(today, 1),
    }).expect(201);
    await post(user.accessToken, {
      ...base,
      date: shiftDateKey(today, 2),
    }).expect(400);
    await post(user.accessToken, { ...base, date: '2026-02-30' }).expect(400);
    await post(user.accessToken, { ...base, date: '2025-13-01' }).expect(400);
    await postBulk(user.accessToken, [
      { ...base, date: shiftDateKey(today, 2) },
    ]).expect(400);
    await postBulk(user.accessToken, [{ ...base, date: '2026-02-30' }]).expect(
      400,
    );
  });

  it('A-12: "bugün" x-client-timezone ile belirlenir', async () => {
    const { user, dhikrId } = await setup('log-date-tz');
    // Kiritimati (UTC+14) bugünü, Niue'ninkinden (UTC-11) ≥ 1 gün ileri.
    const kiri = dateKeyInZone(new Date(), 'Pacific/Kiritimati');
    const niue = dateKeyInZone(new Date(), 'Pacific/Niue');
    const body = {
      dhikrId,
      count: 1,
      targetCount: 33,
      date: shiftDateKey(kiri, 1),
    };
    await post(user.accessToken, body, {
      'x-client-timezone': 'Pacific/Kiritimati',
    }).expect(201);
    await post(
      user.accessToken,
      { ...body, date: shiftDateKey(niue, 2) },
      { 'x-client-timezone': 'Pacific/Niue' },
    ).expect(400);
  });

  // API-LOG: A-13
  it('A-13: completed = count ≥ targetCount; hedef altında istemci bayrağı yok sayılır', async () => {
    const { user, dhikrId } = await setup('log-complete');
    const base = { dhikrId, targetCount: 33, date: today };

    const below = await post(user.accessToken, {
      ...base,
      count: 10,
      isCompleted: true,
    }).expect(201);
    expect(data<{ isCompleted: boolean }>(below).isCompleted).toBe(false);

    const hit = await post(user.accessToken, {
      ...base,
      dhikrId: await seedDhikr(t.model<DhikrDocument>('Dhikr')),
      count: 33,
      isCompleted: false,
    }).expect(201);
    expect(data<{ isCompleted: boolean }>(hit).isCompleted).toBe(true);
  });

  it('A-13: targetCount 0 (hedefsiz) → istemci bayrağı korunur', async () => {
    const { user, dhikrId } = await setup('log-complete-free');
    const res = await post(user.accessToken, {
      dhikrId,
      count: 5,
      targetCount: 0,
      date: today,
      isCompleted: true,
    }).expect(201);
    expect(data<{ isCompleted: boolean }>(res).isCompleted).toBe(true);
  });

  // API-LOG: M-04 (sunucu yarısı)
  it('M-04: count 0 yazımı bugünün tamamlanmış logunu ezmez (200, değişmez)', async () => {
    const { user, dhikrId } = await setup('log-zero');
    const base = { dhikrId, targetCount: 33, date: today };
    await post(user.accessToken, { ...base, count: 33 }).expect(201);

    const res = await post(user.accessToken, { ...base, count: 0 }).expect(201);
    expect(data<{ count: number; isCompleted: boolean }>(res)).toMatchObject({
      count: 33,
      isCompleted: true,
    });
    const logs = await t.model<DhikrLogDocument>('DhikrLog').find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ count: 33, isCompleted: true });
  });

  it('M-04: count 0 tamamlanmamış logu yine günceller', async () => {
    const { user, dhikrId } = await setup('log-zero-open');
    const base = { dhikrId, targetCount: 33, date: today };
    await post(user.accessToken, { ...base, count: 5 }).expect(201);
    await post(user.accessToken, { ...base, count: 0 }).expect(201);
    const log = await t.model<DhikrLogDocument>('DhikrLog').findOne().lean();
    expect(log?.count).toBe(0);
  });

  // B10: bulk
  it('B10: bulk tamamlanmış logun isCompleted bayrağını korur', async () => {
    const { user, dhikrId } = await setup('log-bulk-keep');
    const base = { dhikrId, targetCount: 33, date: today };
    await post(user.accessToken, { ...base, count: 33 }).expect(201);
    await postBulk(user.accessToken, [{ ...base, count: 5 }]).expect(201);
    const log = await t.model<DhikrLogDocument>('DhikrLog').findOne().lean();
    expect(log).toMatchObject({ count: 5, isCompleted: true });
  });

  it('B10: bulk vird alanlı item 500 vermez; vird alanları yazılır', async () => {
    const { user, dhikrId } = await setup('log-bulk-vird');
    const virdProgramId = '65f000000000000000000001';
    const res = await postBulk(user.accessToken, [
      {
        dhikrId,
        count: 5,
        targetCount: 33,
        date: today,
        virdProgramId,
        virdSlot: 'morning',
      },
    ]);
    expect(res.status).toBe(201);
    const log = await t.model<DhikrLogDocument>('DhikrLog').findOne().lean();
    expect(String(log?.virdProgramId)).toBe(virdProgramId);
    expect(log?.virdSlot).toBe('morning');
  });

  it('bulk: count 0 tamamlanmış logu ezmez; bulk isCompleted sunucuda hesaplanır', async () => {
    const { user, dhikrId } = await setup('log-bulk-zero');
    const base = { dhikrId, targetCount: 33, date: today };
    await post(user.accessToken, { ...base, count: 33 }).expect(201);
    await postBulk(user.accessToken, [{ ...base, count: 0 }]).expect(201);
    expect(
      await t.model<DhikrLogDocument>('DhikrLog').findOne().lean(),
    ).toMatchObject({ count: 33, isCompleted: true });

    const other = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    await postBulk(user.accessToken, [
      { ...base, dhikrId: other, count: 3, isCompleted: true },
    ]).expect(201);
    expect(
      await t
        .model<DhikrLogDocument>('DhikrLog')
        .findOne({ dhikrId: new Types.ObjectId(other) })
        .lean(),
    ).toMatchObject({ isCompleted: false });
  });
});
