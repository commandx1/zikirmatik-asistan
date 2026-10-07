/**
 * Katalog boşlukları: API-LOG-23, API-LOG-32, API-STR-18.
 * Önkoşul: pnpm db:test
 */
import request from 'supertest';
import { istanbulDateKey } from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';

const today = istanbulDateKey(new Date());

describe('Log / seri boşlukları (e2e)', () => {
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

  it("API-LOG-23: bulk içinde dhikrId'siz (özel zikir) öğe → 400", async () => {
    const user = await signIn(t.http, { sub: 'gap-log-23' });
    await request(t.http)
      .post('/v1/dhikr-logs/bulk')
      .set(bearer(user.accessToken))
      .send({
        items: [
          {
            customDhikrId: 'custom-1',
            customDhikrName: 'Özel',
            count: 1,
            targetCount: 33,
            date: today,
          },
        ],
      })
      .expect(400);
  });

  it("API-LOG-32: silinmiş kullanıcının geçerli token'ıyla POST → 404, yetim log yok", async () => {
    const user = await signIn(t.http, { sub: 'gap-log-32' });
    const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    await request(t.http)
      .delete(`/v1/users/${user.userId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    await request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({ dhikrId, count: 1, targetCount: 33, date: today })
      .expect(404);
    expect(await t.model('DhikrLog').countDocuments({})).toBe(0);
  });

  it('API-STR-18: vird günü daha düşük sayıyla tamamlanmamışa dönerse virdCurrentStreak düşer', async () => {
    const user = await signIn(t.http, { sub: 'gap-str-18' });
    const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    const created = await request(t.http)
      .post('/v1/vird/programs')
      .set(bearer(user.accessToken))
      .send({
        title: { tr: 'Seri', en: 'Streak' },
        kind: 'routine',
        startDate: today,
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: { morning: [{ dhikrId, target: 5 }] },
          },
        ],
      });
    expect([200, 201]).toContain(created.status);
    const programId = data<{ _id: string }>(created)._id;
    await request(t.http)
      .post(`/v1/vird/programs/${programId}/activate`)
      .set(bearer(user.accessToken))
      .expect(201);

    const log = (count: number) =>
      request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .send({
          dhikrId,
          count,
          targetCount: 5,
          date: today,
          virdProgramId: programId,
          virdSlot: 'morning',
          virdDayIndex: 1,
        })
        .expect(201);
    const streak = async () =>
      data<{ virdCurrentStreak: number }>(
        await request(t.http)
          .get(`/v1/streaks/${user.userId}`)
          .set(bearer(user.accessToken))
          .expect(200),
      ).virdCurrentStreak;

    await log(5);
    expect(await streak()).toBe(1);
    await log(2); // son yazan kazanır → gün tamamlanmamış
    expect(await streak()).toBe(0);
  });
});
