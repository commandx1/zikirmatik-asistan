import fc from 'fast-check';
import { Types } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { DhikrLogsService } from '../src/modules/dhikr-logs/dhikr-logs.service';
import { StreaksService } from '../src/modules/streaks/streaks.service';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { seedDhikr, signIn } from './helpers/fixtures';

const today = istanbulDateKey(new Date());

// Perf: seri yalnız günün ilk count>0 logunda / sayım düşüşünde yeniden
// hesaplanır. Atlanan yazımlar sonrası saklı seri, sıfırdan hesapla aynı olmalı.
describe('Seri yeniden hesabı atlama (e2e)', () => {
  let t: TestApp;
  let dhikrIds: string[];

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });
  beforeEach(async () => {
    await clearCollections(t.connection);
    await seedBoth();
  });
  afterAll(async () => {
    await t?.close();
  });

  const seedBoth = async () => {
    const model = t.model<DhikrDocument>('Dhikr');
    dhikrIds = [await seedDhikr(model), await seedDhikr(model)];
  };

  const streakDoc = async (userId: string) =>
    t
      .model('Streak')
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('-_id -__v -createdAt -updatedAt')
      .lean();

  const opTotal = async () => {
    const s = await t.connection.db!.admin().serverStatus();
    const o = s.opcounters as Record<string, number>;
    return o.insert + o.query + o.update + o.delete + o.getmore + o.command;
  };

  it('özellik: rastgele yaz/güncelle/sil dizisi → saklı seri = sıfırdan hesap', async () => {
    const logs = t.app.get(DhikrLogsService);
    const streaks = t.app.get(StreaksService);
    type Op =
      | { k: 'w'; ago: number; d: number; count: number }
      | { k: 'del'; d: number };
    const op: fc.Arbitrary<Op> = fc.oneof(
      fc.record({
        k: fc.constant('w' as const),
        ago: fc.integer({ min: 0, max: 6 }),
        d: fc.integer({ min: 0, max: 1 }),
        count: fc.constantFrom(0, 0, 1, 7, 33),
      }),
      fc.record({
        k: fc.constant('del' as const),
        d: fc.integer({ min: 0, max: 1 }),
      }),
    );
    let n = 0;
    await fc.assert(
      fc.asyncProperty(
        fc.array(op, { minLength: 1, maxLength: 14 }),
        async (ops) => {
          await clearCollections(t.connection);
          await seedBoth();
          const user = await signIn(t.http, { sub: `skip-prop-${(n += 1)}` });
          for (const o of ops) {
            if (o.k === 'w') {
              await logs.create({
                userId: user.userId,
                dhikrId: dhikrIds[o.d],
                count: o.count,
                targetCount: 33,
                date: shiftDateKey(today, -o.ago),
              });
            } else {
              await logs.removeByDhikr(user.userId, {
                dhikrId: dhikrIds[o.d],
              });
            }
          }
          const stored = await streakDoc(user.userId);
          await streaks.recalculateForUser(user.userId);
          const scratch = await streakDoc(user.userId);
          // Hiç yazım yapılmadıysa (yalnız silmeler) belge henüz yok olabilir.
          if (stored) expect(stored).toEqual(scratch);
        },
      ),
      { numRuns: 40 },
    );
  });

  it('aynı gün sonraki yazımlar seriyi hesaplamaz; kayıt başına Mongo işlemi ölçülür', async () => {
    const logs = t.app.get(DhikrLogsService);
    const spy = jest.spyOn(StreaksService.prototype, 'recalculateForUser');
    const user = await signIn(t.http, { sub: 'skip-ops' });
    const save = (count: number) =>
      logs.create({
        userId: user.userId,
        dhikrId: dhikrIds[0],
        count,
        targetCount: 33,
        date: today,
      });
    spy.mockClear();
    await save(1);
    const before = await opTotal();
    const runs = 20;
    for (let i = 2; i < runs + 2; i += 1) await save(i);
    const perSave = ((await opTotal()) - before) / runs;
    console.log(`Mongo ops / sonraki kayıt: ${perSave}`);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
