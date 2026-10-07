// Seri belgeleri log günleriyle tutarlı (kural: o gün count>0 log varsa gün sayılır).
// Beklenen değerler API'nin kendi hesaplayıcısıyla (dist/…/streak-calculator.js) üretilir.
import { createRequire } from 'node:module';
import { runVerifier, k6UserIds } from './lib/verify.mjs';

const require = createRequire(import.meta.url);
const { calculateCompletionStreak } = require('../dist/modules/streaks/utils/streak-calculator.js');
const dayKey = (o) => new Date(Date.now() + o * 86_400_000).toISOString().slice(0, 10);

await runVerifier('verify-streaks', async (db, { fail, info }) => {
  const ids = await k6UserIds(db);
  const streaks = new Map(
    (await db.collection('streaks').find({ userId: { $in: ids } }).toArray()).map((s) => [String(s.userId), s]),
  );
  const logs = await db
    .collection('dhikr_logs')
    .aggregate([
      { $match: { userId: { $in: ids } } },
      { $group: { _id: '$userId', all: { $addToSet: '$date' }, active: { $addToSet: { $cond: [{ $gt: ['$count', 0] }, '$date', '$$REMOVE'] } } } },
    ])
    .toArray();
  let checked = 0, missing = 0, bad = 0;
  for (const u of logs) {
    const s = streaks.get(String(u._id));
    if (!s) {
      missing += 1;
      continue;
    }
    checked += 1;
    const all = u.all.slice().sort();
    const active = u.active.slice().sort();
    const errs = [];
    if (s.totalDaysActive !== all.length) errs.push(`totalDaysActive ${s.totalDaysActive}≠${all.length}`);
    if (s.lastActiveDate !== all.at(-1)) errs.push(`lastActiveDate ${s.lastActiveDate}≠${all.at(-1)}`);
    if (s.lastCompletedDate !== active.at(-1)) errs.push(`lastCompletedDate ${s.lastCompletedDate}≠${active.at(-1)}`);
    // "bugün" istek saat dilimine göre ±1 gün kayabilir → üç aday.
    const cands = [-1, 0, 1].map((o) => calculateCompletionStreak(active, dayKey(o)));
    if (!cands.some((c) => c.currentStreak === s.currentStreak)) errs.push(`currentStreak ${s.currentStreak} adaylar ${cands.map((c) => c.currentStreak)}`);
    if (!(s.longestStreak >= Math.max(...cands.map((c) => c.longestStreak)) - 0)) errs.push(`longestStreak ${s.longestStreak} < ${cands.map((c) => c.longestStreak)}`);
    if (errs.length) {
      bad += 1;
      fail(`user=${u._id}: ${errs.join('; ')}`);
    }
  }
  info(`log'u olan kullanıcı=${logs.length} seri belgesi kontrol=${checked} seri belgesi yok=${missing} tutarsız=${bad}`);
  if (missing > 0) fail(`${missing} kullanıcının logu var ama seri belgesi yok`);
});
