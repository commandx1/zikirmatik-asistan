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

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

    // Build keyRemap from dedup logic (same as master seed)
    const canonicalBySignature = new Map();
    const keyRemap = new Map();

    for (const dataset of datasets) {
      for (const item of dataset.dhikrItems) {
        const sig =
          normalize(item.nameTurkish) + '|' + normalize(item.transliteration);
        const existingKey = canonicalBySignature.get(sig);
        if (existingKey) {
          keyRemap.set(item.key, existingKey);
        } else {
          canonicalBySignature.set(sig, item.key);
          keyRemap.set(item.key, item.key);
        }
      }
    }

    // Fetch all dhikr IDs from DB by canonical keys in one query
    const allCanonicalKeys = uniq([...keyRemap.values()]);
    const dhikrDocs = await dhikrsCol
      .find({ key: { $in: allCanonicalKeys } }, { projection: { _id: 1, key: 1 } })
      .toArray();

    const dhikrIdMap = new Map(dhikrDocs.map((d) => [d.key, d._id]));

    console.log(
      `DB'de ${dhikrIdMap.size} / ${allCanonicalKeys.length} dhikr key'i eşleşti.`,
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
        const canonicalKey = keyRemap.get(item.key) ?? item.key;
        const id = dhikrIdMap.get(canonicalKey);
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
