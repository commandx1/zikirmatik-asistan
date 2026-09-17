/* global process, console */
/**
 * dhikr_logs duplicate temizliği (uniq_log_key öncesi veri onarımı).
 *
 * dhikr_logs upsert anahtarını karşılayan bir UNIQUE index yoktu; MongoDB'de
 * upsert yalnız böyle bir index varsa atomiktir. Aynı anahtara giden iki
 * eşzamanlı yazım da "bulamadım" deyip İKİSİ DE insert etti — aynı gün aynı
 * zikir için birden fazla belge oluştu. Sonuç: zikir halkası toplamı
 * (CirclesService.applyProgress tüm belgeleri toplar) gerçeğin üstüne çıktı,
 * istatistikler çift saydı.
 *
 * Şemaya `uniq_log_key` unique index'i eklendi (bkz.
 * modules/dhikr-logs/schemas/dhikr-log.schema.ts). Var olan duplicate'ler
 * temizlenmeden o index OLUŞMAZ — bu betik önce onları tekilleştirir.
 *
 * Grup anahtarı buildLogFilter / uniq_log_key ile birebir aynı 8 alandır;
 * eksik alanlar $ifNull ile null'a normalize edilir (Mongo unique index'te de
 * eksik alan null sayılır, yani gruplama index'le aynı şeyi görür).
 *
 * Her grupta KALAN belge: en yüksek `count`; eşitlikte `isCompleted:true`
 * olan, o da eşitse en yeni `createdAt`. Kalan belgenin `isCompleted` alanı,
 * grubun herhangi bir belgesinde true ise true yapılır (o gün seri
 * kazanılmıştı, silinen belgeyle birlikte kaybolmamalı). Diğerleri silinir.
 *
 * Varsayılan KURU çalışmadır (DB'ye yazmaz). Yazmak için `--apply`; bu
 * durumda silinecek TÜM belgeler önce
 * scripts/.backups/dhikr-logs-dedupe-<zaman>.json dosyasına yedeklenir.
 * İdempotent: ikinci çalıştırmada 0 grup bulunur.
 *
 * `--apply` sonrası index OLUŞTURULMAZ: Mongoose autoIndex:true ile API
 * açılışında kurar (bkz. app.module.ts). Betik yalnız kalan duplicate grup
 * sayısının 0 olduğunu doğrular.
 *
 * Kullanım (apps/api dizininden):
 *   node scripts/dedupe-dhikr-logs.mjs          # kuru çalışma, plan
 *   node scripts/dedupe-dhikr-logs.mjs --apply  # yedek + temizlik
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI tanımlı değil (apps/api/.env).');
  process.exit(1);
}

// uniq_log_key ile BİREBİR aynı alan kümesi.
const KEY_FIELDS = [
  'userId',
  'date',
  'dhikrId',
  'customDhikrId',
  'virdProgramId',
  'virdSlot',
  'virdPrayerIndex',
  'circleId',
];

const groupId = Object.fromEntries(
  KEY_FIELDS.map((field) => [field, { $ifNull: [`$${field}`, null] }]),
);

/** count DESC, isCompleted DESC, createdAt DESC → ilk eleman kalacak olandır. */
function pickKeeper(docs) {
  return [...docs].sort(
    (a, b) =>
      (b.count ?? 0) - (a.count ?? 0) ||
      Number(b.isCompleted === true) - Number(a.isCompleted === true) ||
      new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
  )[0];
}

async function findDuplicateGroups(collection) {
  return collection
    .aggregate(
      [
        {
          $group: {
            _id: groupId,
            docs: {
              $push: {
                _id: '$_id',
                count: '$count',
                isCompleted: '$isCompleted',
                createdAt: '$createdAt',
              },
            },
            total: { $sum: 1 },
          },
        },
        { $match: { total: { $gt: 1 } } },
      ],
      { allowDiskUse: true },
    )
    .toArray();
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const collection = client.db().collection('dhikr_logs');
  const totalDocs = await collection.countDocuments({});
  const groups = await findDuplicateGroups(collection);

  const doomedIds = [];
  const completionFixIds = [];
  for (const group of groups) {
    const keeper = pickKeeper(group.docs);
    const anyCompleted = group.docs.some((doc) => doc.isCompleted === true);
    if (anyCompleted && keeper.isCompleted !== true) {
      completionFixIds.push(keeper._id);
    }
    for (const doc of group.docs) {
      if (!doc._id.equals(keeper._id)) {
        doomedIds.push(doc._id);
      }
    }
  }

  console.log(
    `DB: ${client.db().databaseName} · dhikr_logs belge: ${totalDocs} · ` +
      `duplicate grup: ${groups.length} · silinecek: ${doomedIds.length} · ` +
      `isCompleted düzeltilecek: ${completionFixIds.length}`,
  );

  for (const group of groups.slice(0, 5)) {
    const keeper = pickKeeper(group.docs);
    const key = KEY_FIELDS.map((field) => `${field}=${String(group._id[field])}`)
      .join(' ');
    console.log(`  ${group.total} belge  ${key}`);
    for (const doc of group.docs) {
      const mark = doc._id.equals(keeper._id) ? 'KALIR ' : 'silinir';
      console.log(
        `    ${mark} _id=${String(doc._id)} count=${doc.count} isCompleted=${doc.isCompleted}`,
      );
    }
  }
  if (groups.length > 5) {
    console.log(`  … ve ${groups.length - 5} grup daha`);
  }

  if (!apply) {
    console.log(
      '\nKuru çalışma: DB değişmedi. Uygulamak için: node scripts/dedupe-dhikr-logs.mjs --apply',
    );
  } else if (doomedIds.length === 0 && completionFixIds.length === 0) {
    console.log('\nTemizlenecek kayıt yok.');
  } else {
    const backupDocs = await collection
      .find({ _id: { $in: doomedIds } })
      .toArray();
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const backupDir = join(scriptDir, '.backups');
    mkdirSync(backupDir, { recursive: true });
    const backupPath = join(
      backupDir,
      `dhikr-logs-dedupe-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    );
    writeFileSync(backupPath, JSON.stringify(backupDocs, null, 1));
    console.log(`\nYedek (${backupDocs.length} belge): ${backupPath}`);

    if (completionFixIds.length > 0) {
      const fixed = await collection.updateMany(
        { _id: { $in: completionFixIds } },
        { $set: { isCompleted: true } },
      );
      console.log(`isCompleted taşındı: ${fixed.modifiedCount}`);
    }
    const deleted = await collection.deleteMany({ _id: { $in: doomedIds } });
    console.log(`Silinen: ${deleted.deletedCount}`);
  }

  const remaining = await findDuplicateGroups(collection);
  console.log(`Durum: kalan duplicate grup=${remaining.length}`);
  if (apply && remaining.length > 0) {
    console.error(
      'Kalan duplicate var — uniq_log_key oluşmaz. Betiği tekrar çalıştır.',
    );
    process.exitCode = 1;
  }
} finally {
  await client.close();
}
