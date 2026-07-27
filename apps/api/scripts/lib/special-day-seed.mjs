/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildEmbeddingFields } from './embedding.mjs';

const DEFAULT_NOTIFY_BEFORE_MINUTES = [1440, 60];

export async function runSpecialDaySeed(dataset) {
  validateDataset(dataset);
  loadEnvFiles(['.env', '.env.local']);

  const { default: mongoose } = await import('mongoose');

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  await mongoose.connect(mongoUri, { autoIndex: false });

  try {
    const dhikrsCollection = mongoose.connection.collection('dhikrs');
    const specialDaysCollection = mongoose.connection.collection('special_days');

    let dhikrCreatedCount = 0;
    let dhikrUpdatedCount = 0;
    let specialDayCreatedCount = 0;
    let specialDayUpdatedCount = 0;

    const dhikrIdMap = new Map();

    for (const item of dataset.dhikrItems) {
      const { key, ...payload } = item;
      const now = new Date();

      if (!key) {
        throw new Error(
          `Dhikr key tanımsız: ${payload.name?.tr}. Upsert için key zorunlu.`,
        );
      }

      // Bağlı olduğu özel günlerden gelen etiketler dataset etiketleriyle
      // birleştirilir; böylece kullanıcı AI Rehber'e "Regaib Kandili için
      // zikir" yazdığında bu zikir retrieval'da yüzeye çıkar.
      const dayTags = dataset.dhikrTagIndex?.get(key);
      const tags = uniq([...(payload.tags ?? []), ...(dayTags?.tags ?? [])]);
      const categories = uniq([
        ...(payload.categories ?? []),
        ...(dayTags?.categories ?? []),
      ]);
      const suitableFor = uniq([
        ...(payload.suitableFor ?? []),
        ...(dayTags?.suitableFor ?? []),
      ]);

      // Mevcut kaydı yalnızca stabil `key` ile bul; legacy isim/transliterasyon
      // eşleşmesine gerek yok (DB tamamen key bazlı seed'lenir).
      const existing = await dhikrsCollection.findOne(
        { key },
        { projection: { _id: 1, embeddingSourceHash: 1 } },
      );

      // Kaynak metin değişmediyse buildEmbeddingFields null döner (yeniden embed yok).
      const embeddingFields = await buildEmbeddingFields(
        { ...payload, tags, categories, suitableFor },
        existing?.embeddingSourceHash,
      );

      const doc = {
        ...payload,
        key,
        tags,
        categories,
        suitableFor,
        isVerified: true,
        isActive: true,
        updatedAt: now,
        ...(embeddingFields ?? {}),
      };

      let storedId;
      if (existing) {
        await dhikrsCollection.updateOne({ _id: existing._id }, { $set: doc });
        dhikrUpdatedCount += 1;
        storedId = existing._id;
      } else {
        const insertResult = await dhikrsCollection.insertOne({
          ...doc,
          createdAt: now,
        });
        dhikrCreatedCount += 1;
        storedId = insertResult.insertedId;
      }

      dhikrIdMap.set(key, storedId);
    }

    for (const item of dataset.specialDays) {
      const { dhikrKeys, ...payload } = item;

      if (!Array.isArray(dhikrKeys) || dhikrKeys.length === 0) {
        throw new Error(
          `specialDays içinde dhikrKeys boş olamaz: ${payload.name?.tr ?? payload.name ?? payload.date}`,
        );
      }

      // dhikrKeys artık öneri listesi değil, etiketleme talimatı (yukarıdaki
      // dhikr döngüsünde uygulandı). Yine de kırık key'i erken yakalamak için
      // doğrulanır.
      for (const dhikrKey of dhikrKeys) {
        if (!dhikrIdMap.has(dhikrKey)) {
          throw new Error(`Dhikr key bulunamadı: ${dhikrKey}`);
        }
      }

      const now = new Date();
      // Hedef kaydı önce ID olarak çöz: `name` alanı bir dönem düz string
      // tutuluyordu ve yalnızca `name.tr` ile eşleşen bir filtre bu kayıtları
      // ıskalayıp her seed'de kopya oluşturuyordu. Modern kayıt yoksa legacy
      // kayıt bulunup yerinde güncellenir (adı çok dilli hâle gelir).
      const existingId = await findExistingSpecialDayId(
        specialDaysCollection,
        payload,
      );
      const filter = existingId
        ? { _id: existingId }
        : buildSpecialDayFilter(payload);
      const result = await specialDaysCollection.updateOne(
        filter,
        {
          $set: {
            ...payload,
            priority: payload.priority ?? resolveDefaultPriority(payload.type),
            hasSpecialFlow: payload.hasSpecialFlow ?? true,
            notifyBeforeMinutes:
              payload.notifyBeforeMinutes ?? DEFAULT_NOTIFY_BEFORE_MINUTES,
            isActive: payload.isActive ?? true,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
          $unset: {
            dhikrKeys: 1,
            // Zikir önerisi AI Rehber'e taşındı; eski kayıtlardan temizlenir.
            recommendedDhikrIds: 1,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        specialDayCreatedCount += 1;
      } else if (result.modifiedCount > 0) {
        specialDayUpdatedCount += 1;
      }
    }

    console.log(
      `${dataset.label} seed tamamlandı. dhikrs(created=${dhikrCreatedCount}, updated=${dhikrUpdatedCount}, total=${dataset.dhikrItems.length}) special_days(created=${specialDayCreatedCount}, updated=${specialDayUpdatedCount}, total=${dataset.specialDays.length})`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Var olan özel gün kaydının _id'sini döndürür. Önce çok dilli (`name.tr`)
 * kayıt aranır; bulunamazsa aynı gün için legacy düz-string `name` kaydı
 * aranır. İkisi de yoksa null döner ve çağıran upsert'e düşer.
 */
async function findExistingSpecialDayId(collection, payload) {
  const modern = await collection.findOne(buildSpecialDayFilter(payload), {
    projection: { _id: 1 },
  });
  if (modern) {
    return modern._id;
  }

  const nameTr = typeof payload.name === 'object' ? payload.name?.tr : payload.name;
  if (!nameTr) {
    return null;
  }

  const legacy = await collection.findOne(
    {
      date: payload.date,
      type: payload.type,
      eventKey: payload.eventKey,
      ...(payload.dayIndex !== undefined ? { dayIndex: payload.dayIndex } : {}),
      name: nameTr,
    },
    { projection: { _id: 1 } },
  );

  return legacy?._id ?? null;
}

function buildSpecialDayFilter(payload) {
  const filter = {
    date: payload.date,
    type: payload.type,
    eventKey: payload.eventKey,
  };

  if (payload.dayIndex !== undefined) {
    filter.dayIndex = payload.dayIndex;
  } else if (payload.name) {
    // name artık { tr, en } nesnesi; eşleşmeyi Türkçe metin üzerinden kur
    // (legacy düz string desteği için fallback bırakıldı).
    const nameTr =
      typeof payload.name === 'object' ? payload.name.tr : payload.name;
    if (nameTr) {
      filter['name.tr'] = nameTr;
    }
  }

  return filter;
}

function validateDataset(dataset) {
  if (!dataset || typeof dataset !== 'object') {
    throw new Error('Geçersiz dataset girdisi.');
  }

  if (!dataset.key || !dataset.label) {
    throw new Error('Dataset key ve label zorunludur.');
  }

  if (!Array.isArray(dataset.dhikrItems) || dataset.dhikrItems.length === 0) {
    throw new Error(`Dataset '${dataset.key}' için dhikrItems boş olamaz.`);
  }

  if (!Array.isArray(dataset.specialDays) || dataset.specialDays.length === 0) {
    throw new Error(`Dataset '${dataset.key}' için specialDays boş olamaz.`);
  }
}

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const content = readFileSync(absolutePath, 'utf8');
    const entries = parseEnv(content);
    for (const [key, value] of Object.entries(entries)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseEnv(content) {
  const parsed = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    parsed[key] = unquote(rawValue);
  }

  return parsed;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function uniq(items) {
  return [...new Set(items)];
}

function resolveDefaultPriority(type) {
  if (type === 'bayram') {
    return 100;
  }
  if (type === 'kandil') {
    return 80;
  }
  if (type === 'ramazan') {
    return 70;
  }
  return 60;
}
