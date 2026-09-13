/* global console, process */
/**
 * DB'deki mevcut `special_days` kayıtlarıyla yeni hicri-takvim tabanlı
 * açılımı karşılaştırır. SALT-OKUNUR — hiçbir yazma işlemi yapmaz (bkz.
 * proje kısıtı: DB'ye YAZMA yalnızca --dry-run ve salt-okunur karşılaştırma
 * ile sınırlı).
 *
 * Kullanım:
 *   node scripts/report-special-days-diff.mjs
 *
 * Eşleştirme, seed'in upsert filtresiyle AYNI mantığı kullanır (bkz.
 * scripts/lib/special-day-seed.mjs: buildSpecialDayFilter/findExistingSpecialDayId):
 * {type, eventKey, dayIndex} varsa dayIndex ile, yoksa name.tr ile.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  expandSpecialDays,
  filterByMinDate,
  findOrphanCandidates,
  getDatasetFamilies,
  SPECIAL_DAYS_SEED_MIN_DATE,
} from './lib/special-day-seed.mjs';
import { SPECIAL_DAY_DATASET } from './seed-special-days-master-2026.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function nameOf(doc) {
  return typeof doc?.name === 'object' ? doc.name?.tr : doc?.name;
}

function matchKey(doc) {
  return doc.dayIndex !== undefined
    ? `${doc.type}|${doc.eventKey}|dayIndex:${doc.dayIndex}`
    : `${doc.type}|${doc.eventKey}|name:${nameOf(doc)}`;
}

const CONTENT_FIELDS = ['description', 'article', 'practices'];

function diffContentFields(oldDoc, newDoc) {
  const diffs = [];
  for (const field of CONTENT_FIELDS) {
    const oldVal = JSON.stringify(oldDoc[field] ?? null);
    const newVal = JSON.stringify(newDoc[field] ?? null);
    if (oldVal !== newVal) diffs.push(field);
  }
  return diffs;
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    console.error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
    process.exitCode = 1;
    return;
  }

  const { expanded: allNewDocs, skipped } = expandSpecialDays(SPECIAL_DAY_DATASET.specialDays);
  const { kept: newDocs, belowMinDate } = filterByMinDate(allNewDocs);
  const families = getDatasetFamilies(SPECIAL_DAY_DATASET);

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false });

  try {
    const collection = mongoose.connection.collection('special_days');
    const dbDocs = await collection
      .find({}, { projection: { name: 1, type: 1, eventKey: 1, dayIndex: 1, date: 1, hijriDate: 1, description: 1, article: 1, practices: 1, isActive: 1 } })
      .toArray();

    const dbByKey = new Map();
    for (const doc of dbDocs) {
      dbByKey.set(matchKey(doc), doc);
    }

    const matched = [];
    const dateChanged = [];
    const contentChanged = [];
    const newlyCreated = [];
    const usedDbKeys = new Set();

    for (const newDoc of newDocs) {
      const key = matchKey(newDoc);
      const dbDoc = dbByKey.get(key);
      if (!dbDoc) {
        newlyCreated.push(newDoc);
        continue;
      }
      usedDbKeys.add(key);

      const dateDiff = dbDoc.date !== newDoc.date || dbDoc.hijriDate !== newDoc.hijriDate;
      const contentDiffFields = diffContentFields(dbDoc, newDoc);

      if (dateDiff) {
        dateChanged.push({ key, name: nameOf(newDoc), oldDate: dbDoc.date, newDate: newDoc.date, oldHijriDate: dbDoc.hijriDate, newHijriDate: newDoc.hijriDate });
      }
      if (contentDiffFields.length > 0) {
        contentChanged.push({ key, name: nameOf(newDoc), fields: contentDiffFields });
      }
      if (!dateDiff && contentDiffFields.length === 0) {
        matched.push(key);
      }
    }

    const orphanedInDb = dbDocs.filter((doc) => !usedDbKeys.has(matchKey(doc)));
    const deactivationCandidates = findOrphanCandidates({ dbDocs, expanded: newDocs, families });

    console.log('=== ÖZEL GÜN KARŞILAŞTIRMA RAPORU (SALT-OKUNUR, DB DEĞİŞMEDİ) ===');
    console.log(`DB'deki mevcut special_days kaydı: ${dbDocs.length}`);
    console.log(`Yeni açılımda üretilen kayıt: ${newDocs.length}`);
    console.log(`Ay başlangıcı bilinmediği için atlanan: ${skipped.length}`);
    console.log(`Min tarih altı (${SPECIAL_DAYS_SEED_MIN_DATE} öncesi, atlanan): ${belowMinDate.length}`);
    console.log(`Birebir eşleşen (tarih VE içerik aynı): ${matched.length}`);
    console.log(`Tarih farkı olan: ${dateChanged.length}`);
    console.log(`İçerik farkı olan (description/article/practices): ${contentChanged.length}`);
    console.log(`DB'de var, yeni açılımda YOK (eventKey/dayIndex değişti veya aile yeniden adlandırıldı): ${orphanedInDb.length}`);
    console.log(`  → bunlardan --deactivate-orphans ile isActive:false yapılacak (yönetilen aile/legacy anahtar): ${deactivationCandidates.length}`);
    console.log(`Yeni açılımda var, DB'de YOK (ilk kez seed'lenecek): ${newlyCreated.length}`);
    console.log('');

    if (dateChanged.length > 0) {
      console.log('--- TARİH FARKLARI (eski -> yeni) ---');
      for (const d of dateChanged) {
        console.log(`  [${d.key}] ${d.name}: ${d.oldDate} (${d.oldHijriDate})  ->  ${d.newDate} (${d.newHijriDate})`);
      }
      console.log('');
    }

    if (contentChanged.length > 0) {
      console.log('--- İÇERİK FARKLARI (beklenmez — varsa incele) ---');
      for (const c of contentChanged) {
        console.log(`  [${c.key}] ${c.name}: ${c.fields.join(', ')}`);
      }
      console.log('');
    }

    if (orphanedInDb.length > 0) {
      console.log('--- DB\'DE VAR, YENİ AÇILIMDA YOK ---');
      for (const doc of orphanedInDb) {
        console.log(`  ${matchKey(doc)}  (${doc.date}, ${nameOf(doc)})`);
      }
      console.log('');
    }

    if (deactivationCandidates.length > 0) {
      console.log('--- DEVRE DIŞI BIRAKILACAK (--deactivate-orphans ile isActive:false, SİLİNMEZ) ---');
      for (const doc of deactivationCandidates) {
        console.log(`  ${doc.eventKey}  (${doc.date}, ${nameOf(doc)})`);
      }
      console.log('');
    }

    if (newlyCreated.length > 0) {
      console.log(`--- YENİ AÇILIMDA VAR, DB'DE YOK (ilk ${Math.min(30, newlyCreated.length)}/${newlyCreated.length}) ---`);
      for (const doc of newlyCreated.slice(0, 30)) {
        console.log(`  ${matchKey(doc)}  ${doc.date}  ${nameOf(doc)}`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
