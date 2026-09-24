import request from 'supertest';
import { istanbulDateKey } from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';

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
});
