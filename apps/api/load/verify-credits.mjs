// AI kredi doğruluğu: bakiye ≥ 0, bakiye = hibeler − başarılı borçlar (ledger toplamı),
// tekrarlanan flowId bir kez ücretlendi, her başarılı öneri tam bir borç.
import { runVerifier, k6UserIds } from './lib/verify.mjs';

await runVerifier('verify-credits', async (db, { fail, info }) => {
  const ids = await k6UserIds(db);
  const wallets = await db.collection('ai_credit_wallets').find({ userId: { $in: ids } }).toArray();
  const ledger = await db.collection('ai_credit_ledger').find({ userId: { $in: ids } }).toArray();
  const byUser = new Map();
  for (const l of ledger) {
    const u = byUser.get(String(l.userId)) ?? { sum: 0, grants: 0, debits: 0, debitRows: 0, flows: new Map() };
    u.sum += l.delta;
    if (l.delta > 0) u.grants += l.delta;
    if (/_DEBIT$/.test(l.reason)) {
      u.debits += -l.delta;
      u.debitRows += l.reason === 'RECOMMENDATION_DEBIT' ? 1 : 0;
      const key = `${l.reason}:${l.flowId}`;
      u.flows.set(key, (u.flows.get(key) ?? 0) + 1);
    }
    byUser.set(String(l.userId), u);
  }
  const recs = await db
    .collection('ai_recommendations')
    .aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', n: { $sum: 1 } } }])
    .toArray();
  const recBy = new Map(recs.map((r) => [String(r._id), r.n]));

  let negative = 0, mismatch = 0, dupFlow = 0, recMismatch = 0, withDebits = 0;
  for (const w of wallets) {
    const u = byUser.get(String(w.userId)) ?? { sum: 0, grants: 0, debits: 0, debitRows: 0, flows: new Map() };
    if (w.balance < 0 || w.grantCredits < 0 || w.topupCredits < 0) {
      negative += 1;
      fail(`negatif bakiye user=${w.userId} balance=${w.balance}`);
    }
    if (w.balance !== u.grants - u.debits || w.balance !== u.sum) {
      mismatch += 1;
      fail(`bakiye≠hibe−borç user=${w.userId} balance=${w.balance} hibe=${u.grants} borç=${u.debits} Σdelta=${u.sum}`);
    }
    for (const [k, n] of u.flows) {
      if (n > 1) {
        dupFlow += 1;
        fail(`flowId birden çok kez ücretlendi user=${w.userId} ${k} ×${n}`);
      }
    }
    if (u.debitRows > 0) withDebits += 1;
    if (u.debitRows !== (recBy.get(String(w.userId)) ?? 0)) {
      recMismatch += 1;
      fail(`öneri sayısı≠borç user=${w.userId} öneri=${recBy.get(String(w.userId)) ?? 0} borç=${u.debitRows}`);
    }
  }
  info(`cüzdan=${wallets.length} ledger=${ledger.length} borçlu kullanıcı=${withDebits} negatif=${negative} bakiye uyumsuz=${mismatch} çift flowId=${dupFlow} öneri/borç uyumsuz=${recMismatch}`);
});
