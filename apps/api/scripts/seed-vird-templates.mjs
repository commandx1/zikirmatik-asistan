/* global console, process */
/**
 * `vird_templates` koleksiyonunu apps/api/scripts/lib/vird-template-seed.mjs
 * (buildAllVirdTemplates: klasik + premium/journey — SOURCE_DATASETS)
 * üzerinden `key` bazlı upsert eder — bkz. seed-dhikrs.mjs (aynı
 * env/bağlantı/--dry-run deseni).
 *
 * dhikrKey'ler burada ÇÖZÜLMEZ: vird_templates.phases[].slots[].dhikrKey her
 * zaman string olarak saklanır (ObjectId'e çözümleme VirdTemplatesService'te
 * okuma anında, 10 dk cache'li olarak yapılır — bkz. vird-templates.service.ts).
 * Bu betik dhikrs koleksiyonuna hiç YAZMAZ; yalnız bilgi amaçlı kaç dhikrKey'in
 * katalogda halihazırda eşleştiğini raporlar (eşleşmeyenler hata DEĞİLDİR —
 * dhikrs seed'i vird-templates seed'inden önce ya da sonra çalışabilir;
 * eşleşmeyen key'ler okuma anında sessizce atlanır ve loglanır).
 *
 * Premium (journey) şablonların specialDays[].dhikrKeys çapraz referansları
 * SOURCE_DATASETS'in tamamı taranarak çözülür (bkz. buildDhikrCatalogIndex);
 * çözülemeyen bir key ilgili şablonu DURDURMAZ, yalnızca atlanır ve
 * `unresolvedKeys` altında raporlanır (bkz. printUnresolvedKeys).
 *
 * Kullanım:
 *   node scripts/seed-vird-templates.mjs --dry-run   # hiçbir yazma yapmadan özet basar
 *   node scripts/seed-vird-templates.mjs             # gerçek upsert
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOURCE_DATASETS } from './data/sourceDataset.mjs';
import { buildAllVirdTemplates } from './lib/vird-template-seed.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) {
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function collectDhikrKeys(templates) {
  const keys = new Set();
  for (const template of templates) {
    for (const phase of template.phases) {
      for (const items of Object.values(phase.slots ?? {})) {
        for (const item of items ?? []) {
          keys.add(item.dhikrKey);
        }
      }
    }
  }
  return [...keys];
}

function itemCountOf(template) {
  return template.phases.reduce(
    (total, phase) => total + Object.values(phase.slots ?? {}).flat().length,
    0,
  );
}

function printTemplateSummary(templates) {
  console.log('\n── Üretilen şablonlar ──');
  for (const template of templates) {
    const dayCount = template.dayCount ?? '-';
    const anchorDate = template.anchorDate ?? '-';
    console.log(
      `  ${template.key} (kind=${template.kind}, isPremium=${template.isPremium}, dayCount=${dayCount}, anchorDate=${anchorDate}) — ${itemCountOf(template)} zikir`,
    );
  }
}

function printUnresolvedKeys(unresolvedKeys) {
  if (!unresolvedKeys || unresolvedKeys.length === 0) {
    console.log('\n── Çözülemeyen dhikrKey (kaynak veri içi çapraz referans) ── yok');
    return;
  }
  console.log(
    `\n── Çözülemeyen dhikrKey (kaynak veri içi çapraz referans, SOURCE_DATASETS'te bulunamadı — ilgili şablonda atlandı) ──`,
  );
  for (const key of unresolvedKeys) {
    console.warn(`  ! ${key}`);
  }
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const dryRun = process.argv.includes('--dry-run');

  const { templates, errors, unresolvedKeys } = buildAllVirdTemplates(SOURCE_DATASETS);

  if (errors.length > 0) {
    console.error(`\n${errors.length} şablon üretilemedi, seed durduruldu:`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');

  let connected = false;
  try {
    await mongoose.connect(mongoUri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 8000,
    });
    connected = true;
  } catch (error) {
    console.error(
      `MongoDB'ye bağlanılamadı: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error('Hiçbir yazma/okuma yapılmadı.');
    process.exitCode = 1;
    return;
  }

  try {
    const templatesCol = mongoose.connection.collection('vird_templates');
    const dhikrsCol = mongoose.connection.collection('dhikrs');

    const templateKeys = templates.map((template) => template.key);
    const existingDocs = await templatesCol
      .find({ key: { $in: templateKeys } }, { projection: { _id: 1, key: 1 } })
      .toArray();
    const existingKeySet = new Set(existingDocs.map((doc) => doc.key));

    const dhikrKeys = collectDhikrKeys(templates);
    const matchedDhikrDocs = await dhikrsCol
      .find({ key: { $in: dhikrKeys } }, { projection: { _id: 1, key: 1 } })
      .toArray();
    console.log(
      `DB'de ${matchedDhikrDocs.length} / ${dhikrKeys.length} dhikr key'i eşleşti (bilgi amaçlı — eşleşmeyenler okuma anında atlanır, seed'i durdurmaz).`,
    );
    if (matchedDhikrDocs.length < dhikrKeys.length) {
      const matchedKeySet = new Set(matchedDhikrDocs.map((doc) => doc.key));
      const missing = dhikrKeys.filter((key) => !matchedKeySet.has(key));
      console.warn(
        `  Eşleşmeyen dhikrKey'ler (dhikrs seed'i henüz çalışmamış olabilir): ${missing.join(', ')}`,
      );
    }

    const wouldInsert = templateKeys.filter(
      (key) => !existingKeySet.has(key),
    ).length;
    const wouldUpdate = templateKeys.filter((key) =>
      existingKeySet.has(key),
    ).length;

    if (dryRun) {
      printTemplateSummary(templates);
      printUnresolvedKeys(unresolvedKeys);
      console.log(`\n── Yazma önizlemesi (--dry-run, hiçbir şey yazılmadı) ──`);
      console.log(`  Eklenecek (insert): ${wouldInsert}`);
      console.log(`  Güncellenecek (update): ${wouldUpdate}`);
      console.log(
        `\nGerçek seed için: node scripts/seed-vird-templates.mjs  (veya: pnpm --filter api seed:vird-templates)`,
      );
      return;
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const template of templates) {
      try {
        const now = new Date();
        const result = await templatesCol.updateOne(
          { key: template.key },
          {
            $set: { ...template, updatedAt: now },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true },
        );
        if (result.upsertedCount > 0) {
          created += 1;
        } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
          updated += 1;
        }
      } catch (error) {
        failed += 1;
        console.warn(
          `  ! key=${template.key} upsert başarısız: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    printTemplateSummary(templates);
    printUnresolvedKeys(unresolvedKeys);
    console.log(
      `\nSeed tamamlandı. created=${created}, updated=${updated}, failed=${failed}, toplam_deneme=${templates.length}`,
    );
  } finally {
    if (connected) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
