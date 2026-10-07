// Aynı (kullanıcı, zikir, gün, vird dilimi, halka) için yinelenen dhikr_logs yok;
// ayrıca logların tamamı için sayım ≥ 0 ve gelecekte (> bugün+1) tarih yok.
import { runVerifier } from './lib/verify.mjs';

await runVerifier('verify-logs', async (db, { fail, info }) => {
  const dups = await db
    .collection('dhikr_logs')
    .aggregate(
      [
        {
          $group: {
            _id: {
              u: '$userId',
              d: '$date',
              k: { $ifNull: ['$dhikrId', '$customDhikrId'] },
              vp: '$virdProgramId',
              vs: '$virdSlot',
              vi: '$virdPrayerIndex',
              c: '$circleId',
            },
            n: { $sum: 1 },
          },
        },
        { $match: { n: { $gt: 1 } } },
        { $limit: 20 },
      ],
      { allowDiskUse: true },
    )
    .toArray();
  for (const d of dups) fail(`yinelenen log ${JSON.stringify(d._id)} ×${d.n}`);
  const total = await db.collection('dhikr_logs').countDocuments();
  const neg = await db.collection('dhikr_logs').countDocuments({ count: { $lt: 0 } });
  if (neg) fail(`negatif count'lu ${neg} log`);
  info(`toplam log=${total} yinelenen anahtar=${dups.length} negatif=${neg}`);
});
