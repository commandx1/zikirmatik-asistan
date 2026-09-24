import request from 'supertest';
import { Types } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
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
});
