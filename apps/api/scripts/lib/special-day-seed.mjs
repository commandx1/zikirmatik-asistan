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

      const tags = uniq(payload.tags ?? []);
      const categories = uniq(payload.categories ?? []);
      const suitableFor = uniq(payload.suitableFor ?? []);

      // Mevcut hash'i oku; kaynak metin değişmediyse yeniden embed etme.
      const existing = await dhikrsCollection.findOne(
        {
          nameTurkish: payload.nameTurkish,
          transliteration: payload.transliteration,
        },
        { projection: { embeddingSourceHash: 1 } },
      );

      const embeddingFields = await buildEmbeddingFields(
        { ...payload, tags, categories, suitableFor },
        existing?.embeddingSourceHash,
      );

      const result = await dhikrsCollection.updateOne(
        {
          nameTurkish: payload.nameTurkish,
          transliteration: payload.transliteration,
        },
        {
          $set: {
            ...payload,
            tags,
            categories,
            suitableFor,
            isVerified: true,
            isActive: true,
            updatedAt: now,
            ...(embeddingFields ?? {}),
          },
          $setOnInsert: {
            createdAt: now,
          },
          $unset: {
            key: 1,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        dhikrCreatedCount += 1;
      } else if (result.modifiedCount > 0) {
        dhikrUpdatedCount += 1;
      }

      const stored = await dhikrsCollection.findOne(
        {
          nameTurkish: payload.nameTurkish,
          transliteration: payload.transliteration,
        },
        { projection: { _id: 1 } },
      );

      if (!stored?._id) {
        throw new Error(`Dhikr bulunamadı: ${payload.nameTurkish}`);
      }

      dhikrIdMap.set(key, stored._id);
    }

    for (const item of dataset.specialDays) {
      const { dhikrKeys, ...payload } = item;

      if (!Array.isArray(dhikrKeys) || dhikrKeys.length === 0) {
        throw new Error(
          `specialDays içinde dhikrKeys boş olamaz: ${payload.name ?? payload.date}`,
        );
      }

      const recommendedDhikrIds = dhikrKeys.map((dhikrKey) => {
        const dhikrId = dhikrIdMap.get(dhikrKey);
        if (!dhikrId) {
          throw new Error(`Dhikr key bulunamadı: ${dhikrKey}`);
        }
        return dhikrId;
      });

      const now = new Date();
      const filter = buildSpecialDayFilter(payload);
      const result = await specialDaysCollection.updateOne(
        filter,
        {
          $set: {
            ...payload,
            recommendedDhikrIds,
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

function buildSpecialDayFilter(payload) {
  const filter = {
    date: payload.date,
    type: payload.type,
    eventKey: payload.eventKey,
  };

  if (payload.dayIndex !== undefined) {
    filter.dayIndex = payload.dayIndex;
  } else if (payload.name) {
    filter.name = payload.name;
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
