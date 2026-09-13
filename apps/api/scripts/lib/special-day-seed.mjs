/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildEmbeddingFields } from './embedding.mjs';
import {
  HIJRI_MONTH_STARTS,
  monthStart,
  monthLength,
  gregorianForHijri,
  firstWeekdayOnOrAfter,
  lastWeekdayOnOrBefore,
  dayOfMonthFor,
  hijriDateLabel,
} from '../data/hijri-calendar.mjs';

const DEFAULT_NOTIFY_BEFORE_MINUTES = [1440, 60];

export function getKnownHijriYears() {
  return Object.keys(HIJRI_MONTH_STARTS)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Aile (eventFamily) -> hicri yıl -> ZATEN CANLI/mevcut eventKey. Bu harita
 * SADECE geçmişte veri dosyalarında sabit (miladi yıl ekli) eventKey ile
 * seed'lenmiş yıllar için doldurulur — mobil derin link/push kırılmasın.
 * Haritada olmayan (aile, hicriYıl) çiftleri için `<family>-<hicriYıl>`
 * biçimi kullanılır (bkz. resolveEventKey). Bu ikinci biçim hiçbir zaman
 * çakışmaz çünkü hicri yıl tektir; miladi yıl eki bazı ailelerde (örn.
 * mirac-kandili: 1448 ve 1449 ikisi de miladi 2027'ye düşer) çakışabildiği
 * için yalnızca ZATEN CANLI olan yıllarda korunur.
 */
export const EVENT_FAMILY_KEY_OVERRIDES = {
  'mirac-kandili': { 1447: 'mirac-kandili-2026' },
  'berat-kandili': { 1447: 'berat-kandili-2026' },
  'kadir-gecesi': { 1447: 'kadir-gecesi-2026' },
  'mevlid-kandili': { 1448: 'mevlid-kandili-2026' },
  'mevlid-haftasi': { 1448: 'mevlid-haftasi-2026' },
  'ramazan-girisi': { 1447: 'ramazan-girisi-2026' },
  'ramazan-bayrami': { 1447: 'ramazan-bayrami-2026' },
  'ramazan-gunleri': { 1447: 'ramazan-gunleri-2026' },
  'kurban-bayrami': { 1447: 'kurban-bayrami-2026' },
  'zilkade-ayi': { 1447: 'zilkade-ayi-2026' },
  'muharrem-ilk-on': { 1448: 'muharrem-ilk-on-2026' },
  'recep-ayi': { 1447: 'recep-ayi-2025' },
  'saban-ayi': { 1447: 'saban-ayi-2026' },
  'regaib-kandili': { 1447: 'regaib-kandili-2025', 1448: 'regaib-kandili-2026' },
  'uc-aylar-baslangic': { 1447: 'uc-aylar-baslangic-2025', 1448: 'uc-aylar-baslangic-2026' },
  'safer-ayi': { 1448: 'safer-ayi-2026' },
  // zilhicce-ilk-on ve hicri-ay-baslangici-<ay> aileleri zaten hicri-yıl
  // ekli anahtar kullanıyor (zilhicce-ilk-on-1447, hicri-ay-baslangici-
  // rebiulevvel-1448); varsayılan biçimle doğal olarak eşleşir, override
  // gerekmez.
};

export function resolveEventKey(eventFamily, hijriYear) {
  const override = EVENT_FAMILY_KEY_OVERRIDES[eventFamily]?.[hijriYear];
  return override ?? `${eventFamily}-${hijriYear}`;
}

/**
 * Bir özel gün ŞABLONUNU (`hijri` veya `hijriRule` + `eventFamily` taşıyan,
 * `date`/`hijriDate`/`eventKey` taşımayan girdi) verilen hicri yıllar
 * üzerinden açar. Ay başlangıcı bilinmeyen (`null`) yıllar atlanır.
 *
 * Döndürür: { expanded: [...resolved docs], skipped: [...{hijriYear, reason}] }
 */
export function expandSpecialDayTemplate(template, years = getKnownHijriYears()) {
  const { hijri, hijriRule, eventFamily, onlyHijriYears, excludeHijriYears, ...content } = template;

  if (!eventFamily) {
    throw new Error(`specialDay şablonunda eventFamily zorunlu: ${describeTemplate(template)}`);
  }
  if (!hijri && !hijriRule) {
    throw new Error(`specialDay şablonunda hijri veya hijriRule zorunlu: ${describeTemplate(template)}`);
  }

  // onlyHijriYears/excludeHijriYears: bir ailenin İÇERİĞİ yıllar arasında
  // değiştiğinde (örn. bir olayın 2025 metni sade, 2026'da makale+practices
  // ile zenginleştirilmiş) her sürüm kendi şablonu olarak kalır ve hangi
  // hicri yıl(lar)a uygulanacağı burada sınırlanır — içerik ASLA birleştirilip
  // yeniden yazılmaz (bkz. "İslami içerik kullanıcıya ait" kuralı).
  const candidateYears = years.filter((year) => {
    if (Array.isArray(onlyHijriYears)) return onlyHijriYears.includes(year);
    if (Array.isArray(excludeHijriYears)) return !excludeHijriYears.includes(year);
    return true;
  });

  const expanded = [];
  const skipped = [];

  for (const hijriYear of candidateYears) {
    const resolved = resolveOneYear({ hijri, hijriRule, eventFamily, hijriYear });
    if (!resolved) {
      skipped.push({
        hijriYear,
        eventFamily,
        name: nameOf(content),
        reason: `ay başlangıcı bilinmiyor (${(hijri ?? hijriRule).month})`,
      });
      continue;
    }

    const gregorianYear = Number(resolved.date.slice(0, 4));

    expanded.push({
      ...content,
      // name/description İÇİNDEKİ {hijriYear}/{gregorianYear} yer tutucuları
      // bu kaydın gerçek yılıyla doldurulur (bkz. yıl-etiketi düzeltmesi).
      // article/practices'e KASITLI olarak dokunulmaz (kullanıcı içeriği).
      name: fillYearPlaceholders(content.name, { hijriYear, gregorianYear }),
      description: fillYearPlaceholders(content.description, { hijriYear, gregorianYear }),
      date: resolved.date,
      hijriDate: resolved.hijriDate,
      eventKey: resolveEventKey(eventFamily, hijriYear),
      // Raporlama/gruplama için taşınır; DB'ye yazılmadan önce runSpecialDaySeed
      // tarafından ayrıştırılıp atılır (şema bu alanı tanımıyor).
      eventFamily,
    });
  }

  return { expanded, skipped };
}

/**
 * `{hijriYear}` / `{gregorianYear}` yer tutucularını gerçek yıl sayılarıyla
 * doldurur. `value` düz string ya da `{ tr, en }` olabilir; olmayan
 * alanlarda (undefined) hiçbir şey yapılmaz. Yalnız name/description için
 * kullanılır — article/practices'e KASITLI olarak uygulanmaz.
 */
function fillYearPlaceholders(value, { hijriYear, gregorianYear }) {
  if (value === undefined || value === null) return value;

  const fill = (str) =>
    typeof str === 'string'
      ? str.replace(/\{hijriYear\}/g, String(hijriYear)).replace(/\{gregorianYear\}/g, String(gregorianYear))
      : str;

  if (typeof value === 'string') return fill(value);

  const out = { ...value };
  if (typeof out.tr === 'string') out.tr = fill(out.tr);
  if (typeof out.en === 'string') out.en = fill(out.en);
  return out;
}

function resolveOneYear({ hijri, hijriRule, eventFamily, hijriYear }) {
  if (hijri) {
    const { month, day, night = false } = hijri;
    const date = gregorianForHijri({ year: hijriYear, month, day, night });
    if (!date) return null;
    return { date, hijriDate: hijriDateLabel(hijriYear, month, day) };
  }

  const { type, month, weekday } = hijriRule;
  const start = monthStart(hijriYear, month);
  if (!start) return null;

  let date;
  if (type === 'first-weekday-on-or-after') {
    date = firstWeekdayOnOrAfter(start, weekday);
  } else if (type === 'last-weekday-on-or-before-month-end') {
    const length = monthLength(hijriYear, month);
    if (length == null) return null;
    const monthEnd = addDaysIso(start, length - 1);
    date = lastWeekdayOnOrBefore(monthEnd, weekday);
  } else {
    throw new Error(`Bilinmeyen hijriRule.type: ${type} (${eventFamily})`);
  }

  const dayOfMonth = dayOfMonthFor(hijriYear, month, date);
  return { date, hijriDate: hijriDateLabel(hijriYear, month, dayOfMonth) };
}

function addDaysIso(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function nameOf(content) {
  return typeof content.name === 'object' ? content.name?.tr : content.name;
}

function describeTemplate(template) {
  return nameOf(template) ?? template.eventFamily ?? '(bilinmeyen)';
}

/**
 * Şablon dizisini açar. DB upsert filtresi {eventKey, dayIndex} (dayIndex
 * yoksa + name.tr) olduğundan (bkz. buildSpecialDayFilter), farklı isimli
 * iki alt-olay AYNI eventKey+dayIndex'i paylaşabilir (örn. Safer Ayı Girişi
 * / İlk Çarşamba aynı güne denk gelebilir) — bu güvenlidir, iki ayrı kayıt
 * oluşur. Gerçek risk, upsert'in AYIRT EDEMEYECEĞİ durumdur: aynı eventKey +
 * dayIndex + name.tr üçlüsü farklı içerikle (article/practices) iki kez
 * üretilirse ikincisi birincisini sessizce ezer. Bu fonksiyon SADECE o
 * durumu hata olarak fırlatır.
 */
export function expandSpecialDays(templates, years = getKnownHijriYears()) {
  const expanded = [];
  const skipped = [];
  const seen = new Map(); // `${eventKey}|${dayIndex ?? ''}|${name.tr}` -> JSON içerik

  for (const template of templates) {
    const result = expandSpecialDayTemplate(template, years);
    skipped.push(...result.skipped);

    for (const doc of result.expanded) {
      const nameTr = nameOf(doc);
      const dedupeKey = `${doc.eventKey}|${doc.dayIndex ?? ''}|${nameTr ?? ''}`;
      const comparable = { ...doc };
      delete comparable.eventFamily;
      const signature = JSON.stringify(comparable);
      const existingSignature = seen.get(dedupeKey);
      if (existingSignature && existingSignature !== signature) {
        throw new Error(
          `eventKey+dayIndex+isim çakışması: "${dedupeKey}" DAHA ÖNCE farklı içerikle üretildi. ` +
            'Bu iki şablonun hijri tanımı aynı takvim gününe ve aynı ada denk geliyor ama içerik farklı — ' +
            'upsert bunları ayırt edemez, biri diğerini sessizce ezer. onlyHijriYears/excludeHijriYears ile ayrıştırın.',
        );
      }
      seen.set(dedupeKey, signature);
      expanded.push(doc);
    }
  }

  return { expanded, skipped };
}

/**
 * Bu dataset'in şablonlarındaki `eventFamily` değerlerinin kümesi (tekrarsız).
 * Orphan tespiti için kullanılır: `^<family>-\d{4}$` biçimindeki eski
 * eventKey'leri hâlâ YÖNETTİĞİMİZ bir aileye ait olarak tanımak için.
 */
export function getDatasetFamilies(dataset) {
  return uniq(dataset.specialDays.map((item) => item.eventFamily).filter(Boolean));
}

/**
 * Yeni eventKey biçimine (aile başına per-ay bölünme vb.) geçerken, ARTIK
 * hiçbir yeni şablonun üretmediği ama eski seed'lerden DB'de kalan sabit
 * eventKey'ler. Silinmez, `--deactivate-orphans` ile `isActive:false` yapılır.
 * (bkz. eyyami-biyd-2026 → eyyami-biyd-<ay> ailelerine bölünmesi.)
 */
export const LEGACY_EVENT_KEYS = ['eyyami-biyd-2026'];

/**
 * DB'deki aktif kayıtlardan, bu çalışmada ÜRETİLMEYEN ama hâlâ yönettiğimiz
 * bir aileye (`^<family>-\d{4}$`) veya `LEGACY_EVENT_KEYS`'e ait olanları
 * "orphan" (devre dışı bırakılacak) olarak işaretler. SİLME YOKTUR — çağıran
 * bunları `isActive:false` yapmakla sorumludur (bkz. runSpecialDaySeed).
 * `dbDocs`'un her biri en az `{_id, eventKey, isActive}` taşımalı.
 */
export function findOrphanCandidates({ dbDocs, expanded, families, legacyEventKeys = LEGACY_EVENT_KEYS }) {
  const producedKeys = new Set(expanded.map((doc) => doc.eventKey));
  const familyPatterns = families.map((family) => new RegExp(`^${escapeRegExp(family)}-\\d{4}$`));
  const legacySet = new Set(legacyEventKeys);

  return dbDocs.filter((doc) => {
    if (doc.isActive === false) return false; // zaten pasif
    if (!doc.eventKey || producedKeys.has(doc.eventKey)) return false; // bu çalışmada üretildi
    return familyPatterns.some((pattern) => pattern.test(doc.eventKey)) || legacySet.has(doc.eventKey);
  });
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * DB'deki `special_days` tarihçesinin başladığı gün (uc-aylar-baslangic-2025,
 * 1 Recep 1447). Bunun altındaki üretilen kayıtlar (örn. Muharrem/Safer 1447
 * gibi geriye dönük hicri ay olayları) varsayılan olarak seed'lenmez —
 * gereksiz geçmiş veri üretilmez. `--include-history` bunu kapatır. Hicri
 * takvim tablosundaki (hijri-calendar.mjs) erken 1447 ay başlangıçları BU
 * FİLTRENİN DIŞINDADIR; ay uzunluğu hesapları için gereklidir, kaldırılmaz.
 */
export const SPECIAL_DAYS_SEED_MIN_DATE = '2025-12-21';

/**
 * `expanded` listesini `minDate`'e göre böler. `includeHistory: true` ise
 * hiçbir filtre uygulanmaz (tüm kayıtlar `kept`'te döner).
 */
export function filterByMinDate(expanded, { minDate = SPECIAL_DAYS_SEED_MIN_DATE, includeHistory = false } = {}) {
  if (includeHistory) {
    return { kept: expanded, belowMinDate: [] };
  }

  const kept = [];
  const belowMinDate = [];
  for (const doc of expanded) {
    if (doc.date < minDate) {
      belowMinDate.push(doc);
    } else {
      kept.push(doc);
    }
  }
  return { kept, belowMinDate };
}

export async function runSpecialDaySeed(
  dataset,
  { dryRun = false, years, deactivateOrphans = false, includeHistory = false, minDate = SPECIAL_DAYS_SEED_MIN_DATE } = {},
) {
  validateDataset(dataset);

  const { expanded: allExpanded, skipped } = expandSpecialDays(dataset.specialDays, years);
  const { kept: expanded, belowMinDate } = filterByMinDate(allExpanded, { minDate, includeHistory });
  const families = getDatasetFamilies(dataset);

  if (dryRun && !deactivateOrphans) {
    return { dryRun: true, expanded, skipped, belowMinDate, dhikrItems: dataset.dhikrItems, orphans: [] };
  }

  loadEnvFiles(['.env', '.env.local']);

  const { default: mongoose } = await import('mongoose');

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  await mongoose.connect(mongoUri, { autoIndex: false });

  if (dryRun) {
    // --dry-run --deactivate-orphans: SALT-OKUNUR — sadece hangi kayıtların
    // devre dışı bırakılacağını göstermek için DB'ye bağlanır, hiçbir
    // yazma yapmaz.
    try {
      const specialDaysCollection = mongoose.connection.collection('special_days');
      const dbDocs = await specialDaysCollection
        .find({}, { projection: { eventKey: 1, isActive: 1, name: 1, date: 1 } })
        .toArray();
      const orphans = findOrphanCandidates({ dbDocs, expanded, families });
      return { dryRun: true, expanded, skipped, belowMinDate, dhikrItems: dataset.dhikrItems, orphans };
    } finally {
      await mongoose.disconnect();
    }
  }

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

      // Etiketler artık dataset içindeki dhikrItem tanımından (payload)
      // doğrudan gelir; özel günlerden türetme adımı kaldırıldı.
      const tags = uniq(payload.tags ?? []);
      const categories = uniq(payload.categories ?? []);
      const suitableFor = uniq(payload.suitableFor ?? []);

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

    for (const item of expanded) {
      // eventFamily yalnızca raporlama içindir; şema tanımıyor, DB'ye yazılmaz.
      const { dhikrKeys, ...payload } = item;
      delete payload.eventFamily;

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
      // Hedef kaydı önce ID olarak çöz. Upsert anahtarı {eventKey, dayIndex}
      // (date DEĞİL) — böylece bir tarih düzeltmesi (hicri takvim tablosu
      // güncellenince) var olan kaydı YERİNDE günceller, kopya oluşturmaz.
      // dayIndex yoksa (tek günlük olaylar) name.tr ile ayırt edilir (bkz.
      // buildSpecialDayFilter) — bu, aynı eventKey'i paylaşan ama farklı
      // güne denk gelen alt-olaylar için (örn. Safer Ayı Girişi / İlk
      // Çarşamba) mevcut ayırt etme mantığının aynısıdır.
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

    let deactivatedCount = 0;
    let orphans = [];
    if (deactivateOrphans) {
      const dbDocs = await specialDaysCollection
        .find({}, { projection: { eventKey: 1, isActive: 1, name: 1, date: 1 } })
        .toArray();
      orphans = findOrphanCandidates({ dbDocs, expanded, families });
      if (orphans.length > 0) {
        const now = new Date();
        await specialDaysCollection.updateMany(
          { _id: { $in: orphans.map((o) => o._id) } },
          { $set: { isActive: false, updatedAt: now } },
        );
        deactivatedCount = orphans.length;
      }
    }

    console.log(
      `${dataset.label} seed tamamlandı. dhikrs(created=${dhikrCreatedCount}, updated=${dhikrUpdatedCount}, total=${dataset.dhikrItems.length}) special_days(created=${specialDayCreatedCount}, updated=${specialDayUpdatedCount}, total=${expanded.length}, skipped=${skipped.length}, deactivated=${deactivatedCount})`,
    );

    return {
      dryRun: false,
      expanded,
      skipped,
      belowMinDate,
      dhikrCreatedCount,
      dhikrUpdatedCount,
      specialDayCreatedCount,
      specialDayUpdatedCount,
      deactivatedCount,
      orphans,
    };
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

  // Legacy kayıt: eski upsert anahtarı `date` de içeriyordu. Tarih tablosu
  // düzeltmesiyle `date` değişmiş olabileceğinden burada `date` ARANMAZ;
  // eventKey + type + name üzerinden bulunur (dayIndex varsa o da eklenir).
  const legacy = await collection.findOne(
    {
      type: payload.type,
      eventKey: payload.eventKey,
      ...(payload.dayIndex !== undefined ? { dayIndex: payload.dayIndex } : {}),
      name: nameTr,
    },
    { projection: { _id: 1 } },
  );

  return legacy?._id ?? null;
}

/**
 * Upsert filtresi: {eventKey, dayIndex} (date İÇERMEZ — tarih düzeltmeleri
 * var olan kaydı yerinde güncellesin diye). dayIndex tanımlı değilse (tek
 * günlük olaylar; örn. Safer'in 3 alt-günü) `name.tr` ayırt edici olarak
 * eklenir — bu, {eventKey, dayIndex} ikilisinin aile içinde benzersiz
 * olmadığı durumları (aynı eventKey'i paylaşan birden çok isimli alt-olay)
 * güvenle çözer.
 */
function buildSpecialDayFilter(payload) {
  const filter = {
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
