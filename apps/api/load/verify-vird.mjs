// Her kullanıcıda en fazla 1 aktif Vird programı (ücretsiz limit; paralel activate yarışı).
import { runVerifier } from './lib/verify.mjs';

await runVerifier('verify-vird', async (db, { fail, info }) => {
  const rows = await db
    .collection('vird_programs')
    .aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$userId', n: { $sum: 1 } } },
    ])
    .toArray();
  const bad = rows.filter((r) => r.n > 1);
  for (const r of bad) fail(`kullanıcı ${r._id} ${r.n} aktif program`);
  const total = await db.collection('vird_programs').countDocuments({ title: { $exists: true } });
  info(`aktif programı olan kullanıcı=${rows.length} toplam program=${total} (>1 aktif: ${bad.length})`);
});
