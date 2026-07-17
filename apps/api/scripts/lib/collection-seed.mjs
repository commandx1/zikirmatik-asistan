/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFiles(paths) {
  for (const p of paths) {
    const abs = resolve(p);
    if (!existsSync(abs)) continue;
    const lines = readFileSync(abs, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

export async function runCollectionSeed(datasets) {
  loadEnvFiles(['.env', '.env.local']);

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false });

  try {
    const dhikrsCol = mongoose.connection.collection('dhikrs');
    const collectionsCol = mongoose.connection.collection('dhikr_collections');

    // Dhikr key'leri artık tek doğruluk kaynağı: her dataset kendi
    // dhikrItems'ında stabil `key` taşır, isim/transliterasyon bazlı
    // eşleştirmeye gerek yok.
    const allKeys = uniq(
      datasets.flatMap((dataset) => dataset.dhikrItems.map((item) => item.key)),
    );
    const dhikrDocs = await dhikrsCol
      .find({ key: { $in: allKeys } }, { projection: { _id: 1, key: 1 } })
      .toArray();

    const dhikrIdMap = new Map(dhikrDocs.map((d) => [d.key, d._id]));

    console.log(
      `DB'de ${dhikrIdMap.size} / ${allKeys.length} dhikr key'i eşleşti.`,
    );

    let created = 0;
    let updated = 0;

    for (const dataset of datasets) {
      if (!dataset.category) {
        console.warn(`  [SKIP] ${dataset.key}: category alanı eksik.`);
        continue;
      }

      // Resolve ordered dhikr ObjectIds for this dataset
      const dhikrIds = [];
      const seenIds = new Set();
      for (const item of dataset.dhikrItems) {
        const id = dhikrIdMap.get(item.key);
        if (id && !seenIds.has(id.toString())) {
          dhikrIds.push(id);
          seenIds.add(id.toString());
        }
      }

      const now = new Date();
      const doc = {
        label: dataset.label,
        description: dataset.description ?? '',
        category: dataset.category,
        dhikrIds,
        dhikrCount: dhikrIds.length,
        isActive: true,
        updatedAt: now,
      };

      const existing = await collectionsCol.findOne(
        { key: dataset.key },
        { projection: { _id: 1 } },
      );

      if (existing) {
        await collectionsCol.updateOne({ _id: existing._id }, { $set: doc });
        updated++;
      } else {
        await collectionsCol.insertOne({ key: dataset.key, ...doc, createdAt: now });
        created++;
      }
    }

    const total = await collectionsCol.countDocuments();
    console.log(
      `Collection seed tamamlandı. created=${created}, updated=${updated}, total=${total}`,
    );
  } finally {
    await mongoose.disconnect();
  }
}
