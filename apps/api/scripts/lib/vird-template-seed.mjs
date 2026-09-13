/**
 * apps/api/scripts/data/sourceDataset.mjs içindeki dataset'lerden (dhikrItems[])
 * vird_templates seed dokümanları üretir. Saf (DB'siz) fonksiyonlar — bkz.
 * vird-template-seed.test.mjs. Gerçek Mongo upsert'i scripts/seed-vird-
 * templates.mjs'de yapılır (bu dosya sadece doküman şekli üretir).
 *
 * İki katman:
 * 1) KLASİK (routine, ücretsiz, tek fazlı/tek dilimli, anchorDate'siz) — bkz.
 *    CLASSIC_VIRD_TEMPLATE_SPECS / buildClassicVirdTemplates.
 * 2) PREMİUM/ÇOK FAZLI (journey) — Ramazan yolculuğu, Esma-ül Hüsna
 *    yolculukları ve kandil gecesi programları; bkz.
 *    buildPremiumVirdTemplates / buildAllVirdTemplates. Bu şablonların
 *    title/description alanları HER ZAMAN mevcut dataset label/description
 *    ya da specialDay name/description alanlarından gelir — yeni dini metin
 *    yazılmaz (bkz. proje belleği: "İslami içerik kullanıcıya ait").
 */

import { normalizeTimeOfDay } from './time-of-day.mjs';
import {
  REGAIB_KANDILI_ANCHOR,
  MIRAC_KANDILI_ANCHOR,
  BERAT_KANDILI_ANCHOR,
  RAMAZAN_1448_START,
  KADIR_GECESI_ANCHOR,
  MEVLID_KANDILI_ANCHOR,
} from '../data/special-days-1448.mjs';

/**
 * Bir dataset'ten (bkz. scripts/data/sourceDataset.mjs) tek fazlı/tek
 * dilimli bir vird şablonu seed dokümanı üretir.
 *
 * @param {{
 *   key: string,
 *   label: {tr: string, en: string},
 *   description?: {tr: string, en: string},
 *   dhikrItems: Array<{key: string, recommendedCount?: number}>,
 * }} dataset - sourceDataset.mjs SOURCE_DATASETS elemanı.
 * @param {{
 *   templateKey: string,
 *   slot: 'morning' | 'prayer' | 'evening' | 'night' | 'free',
 *   kind?: 'routine' | 'journey',
 *   isPremium?: boolean,
 *   dayCount?: number,
 *   anchorDate?: string,
 *   sourceEventKey?: string,
 * }} spec
 * @returns {object} vird_templates şemasıyla uyumlu bir doküman (key/kind/
 *   title/description/isPremium/phases/isActive, opsiyonel dayCount/
 *   anchorDate/sourceEventKey).
 */
export function buildVirdTemplateFromDataset(dataset, spec) {
  if (!dataset) {
    throw new Error(
      `Dataset bulunamadı (templateKey='${spec?.templateKey ?? '?'}').`,
    );
  }
  if (!spec?.templateKey) {
    throw new Error(`spec.templateKey zorunludur (dataset='${dataset.key}').`);
  }
  if (!spec.slot) {
    throw new Error(`spec.slot zorunludur (templateKey='${spec.templateKey}').`);
  }
  if (!Array.isArray(dataset.dhikrItems) || dataset.dhikrItems.length === 0) {
    throw new Error(
      `Dataset '${dataset.key}': dhikrItems boş/eksik, şablon üretilemez.`,
    );
  }

  const items = dataset.dhikrItems.map((item) => ({
    dhikrKey: item.key,
    target: item.recommendedCount ?? 33,
  }));

  /** @type {Record<string, unknown>} */
  const doc = {
    key: spec.templateKey,
    kind: spec.kind ?? 'routine',
    // İçerik alanları mevcut koleksiyon verisinden gelir — YENİ dini metin
    // yazılmaz (bkz. proje belleği: "İslami içerik kullanıcıya ait").
    title: dataset.label,
    description: dataset.description,
    isPremium: spec.isPremium ?? false,
    phases: [
      {
        fromDay: 1,
        toDay: null,
        slots: { [spec.slot]: items },
      },
    ],
    isActive: true,
  };

  if (typeof spec.dayCount === 'number') {
    doc.dayCount = spec.dayCount;
  }
  if (spec.anchorDate) {
    doc.anchorDate = spec.anchorDate;
  }
  if (spec.sourceEventKey) {
    doc.sourceEventKey = spec.sourceEventKey;
  }

  return doc;
}

// Şablon key'leri görev metninde sabitlenmiştir: klasik-sabah, klasik-aksam,
// klasik-namaz-sonrasi, klasik-gunluk-tesbih. datasetKey'ler mevcut
// dhikr_collections seed'iyle (scripts/lib/collection-seed.mjs) aynı
// dataset.key alanlarıdır.
export const CLASSIC_VIRD_TEMPLATE_SPECS = [
  { templateKey: 'klasik-sabah', datasetKey: 'sabah-zikirleri', slot: 'morning' },
  { templateKey: 'klasik-aksam', datasetKey: 'aksam-zikirleri', slot: 'evening' },
  {
    templateKey: 'klasik-namaz-sonrasi',
    datasetKey: 'namaz-sonrasi-zikir',
    slot: 'prayer',
  },
  {
    templateKey: 'klasik-gunluk-tesbih',
    datasetKey: 'gunluk-tesbih',
    slot: 'free',
  },
];

/**
 * SOURCE_DATASETS içinden, verilen spec listesine (varsayılan: 4 klasik
 * şablon) göre vird_templates seed dokümanlarını üretir. Bir spec'in
 * datasetKey'i datasets içinde bulunamazsa (ya da dataset boşsa) o şablon
 * atlanır ve nedeni `errors`'a eklenir — diğer şablonların üretimini
 * engellemez.
 *
 * @param {object[]} datasets - SOURCE_DATASETS (ya da bir alt kümesi/testte
 *   sahte bir liste).
 * @param {{templateKey:string,datasetKey:string,slot:string}[]} specs
 * @returns {{templates: object[], errors: string[]}}
 */
export function buildClassicVirdTemplates(
  datasets,
  specs = CLASSIC_VIRD_TEMPLATE_SPECS,
) {
  const datasetByKey = new Map(datasets.map((dataset) => [dataset.key, dataset]));
  const templates = [];
  const errors = [];

  for (const spec of specs) {
    const dataset = datasetByKey.get(spec.datasetKey);
    if (!dataset) {
      errors.push(
        `Dataset '${spec.datasetKey}' bulunamadı (templateKey='${spec.templateKey}').`,
      );
      continue;
    }
    try {
      templates.push(buildVirdTemplateFromDataset(dataset, spec));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { templates, errors };
}

// ─────────────────────────────────────────────────────────────────────────
// PREMİUM / ÇOK FAZLI (journey) ŞABLONLAR
//
// Ramazan günleri ve kandil gecelerinin `specialDays[].dhikrKeys` alanları,
// çoğunlukla KENDİ dataset'lerinin dışındaki (ör. ISTIGFAR, SALAVAT-I ŞERİFE,
// KADIR_DUASI) key'lere atıfta bulunur — bu "çapraz" key'ler yalnızca TÜM
// SOURCE_DATASETS taranarak (bkz. buildDhikrCatalogIndex) çözülebilir.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Verilen dataset listesindeki TÜM dhikrItems'ları tek bir `key -> item`
 * haritasında toplar (bkz. dosya başı yorumu — specialDays[].dhikrKeys çapraz
 * referansları için). Aynı key birden fazla dataset'te tanımlıysa İLK
 * görülen kazanır (repo'da şu an hiç çakışma yok — bkz. vird-template-seed.test.mjs).
 *
 * @param {object[]} datasets - SOURCE_DATASETS (ya da bir alt kümesi).
 * @returns {Map<string, {key: string, recommendedCount?: number, timeOfDay?: unknown}>}
 */
export function buildDhikrCatalogIndex(datasets) {
  const index = new Map();
  for (const dataset of datasets) {
    for (const item of dataset.dhikrItems ?? []) {
      if (!item?.key || index.has(item.key)) {
        continue;
      }
      index.set(item.key, item);
    }
  }
  return index;
}

const DIRECT_TEMPLATE_SLOTS = new Set(['morning', 'evening', 'night']);

/**
 * Bir zikrin ham `timeOfDay` alanını vird şablonu dilimine indirger:
 * normalizeTimeOfDay tek bir morning/evening/night döndürüyorsa doğrudan o
 * dilim kullanılır; diğer her durumda (any, çoklu dilim, afternoon, ya da
 * boş) 'free' dilimine düşer.
 *
 * @param {unknown} rawTimeOfDay
 * @returns {'morning' | 'evening' | 'night' | 'free'}
 */
export function resolveSlotForTimeOfDay(rawTimeOfDay) {
  const normalized = normalizeTimeOfDay(rawTimeOfDay);
  if (normalized.length === 1 && DIRECT_TEMPLATE_SLOTS.has(normalized[0])) {
    return normalized[0];
  }
  return 'free';
}

/**
 * `dhikrKeys` dizisindeki her key'i `dhikrIndex` üzerinden çözer.
 * Çözülemeyen key'ler `missing`'e eklenir ve item listesine dahil edilmez
 * (seed'i durdurmaz — bkz. görev talimatı: "çözülemeyen key raporlanır ve
 * atlanır").
 *
 * @param {string[]} dhikrKeys
 * @param {Map<string, {recommendedCount?: number}>} dhikrIndex
 * @param {number} [defaultTarget]
 * @returns {{items: {dhikrKey: string, target: number}[], missing: string[]}}
 */
function resolveDhikrKeysToItems(dhikrKeys, dhikrIndex, defaultTarget = 33) {
  const items = [];
  const missing = [];
  for (const key of dhikrKeys ?? []) {
    const entry = dhikrIndex.get(key);
    if (!entry) {
      missing.push(key);
      continue;
    }
    items.push({ dhikrKey: key, target: entry.recommendedCount ?? defaultTarget });
  }
  return { items, missing };
}

// datasetKey: apps/api/scripts/data/ramazanGunleri.mjs → ramazanGunleri.key.
// anchorDate/sourceEventKey 1448 (bir sonraki Ramazan) içindir — dataset
// içeriği (dhikirler) hicri yıldan bağımsız, genel bir Ramazan vird'idir;
// bkz. apps/api/scripts/data/special-days-1448.mjs (DOĞRULA notları).
export const RAMAZAN_JOURNEY_SPEC = {
  templateKey: 'ramazan-1448',
  datasetKey: 'ramazan-gunleri-2026',
  anchorDate: RAMAZAN_1448_START,
  sourceEventKey: 'ramazan-gunleri-1448',
};

/**
 * Ramazan yolculuğu (`kind:'journey'`) şablonunu üretir: dataset'in
 * `specialDays[]`'inden GÜN BAŞINA bir faz (`fromDay = toDay = dayIndex`);
 * her günün `dhikrKeys`'i global katalogdan (buildDhikrCatalogIndex)
 * çözülür ve item'ın kendi `timeOfDay`'ine göre dilime (morning/evening/
 * night/free) yerleştirilir.
 *
 * @param {object[]} datasets - SOURCE_DATASETS (çapraz key çözümü için de kullanılır).
 * @param {typeof RAMAZAN_JOURNEY_SPEC} spec
 * @returns {{template: object | null, errors: string[], unresolvedKeys: string[]}}
 */
export function buildRamazanJourneyTemplate(datasets, spec = RAMAZAN_JOURNEY_SPEC) {
  const dataset = datasets.find((d) => d.key === spec.datasetKey);
  if (!dataset) {
    return {
      template: null,
      errors: [`Dataset '${spec.datasetKey}' bulunamadı (templateKey='${spec.templateKey}').`],
      unresolvedKeys: [],
    };
  }
  if (!Array.isArray(dataset.specialDays) || dataset.specialDays.length === 0) {
    return {
      template: null,
      errors: [`Dataset '${spec.datasetKey}': specialDays boş/eksik (templateKey='${spec.templateKey}').`],
      unresolvedKeys: [],
    };
  }

  const dhikrIndex = buildDhikrCatalogIndex(datasets);
  const unresolved = new Set();
  const sortedDays = [...dataset.specialDays].sort((a, b) => a.dayIndex - b.dayIndex);

  const phases = sortedDays.map((day) => {
    const slots = {};
    const { items, missing } = resolveDhikrKeysToItems(day.dhikrKeys, dhikrIndex);
    missing.forEach((key) => unresolved.add(key));
    for (const item of items) {
      const dhikr = dhikrIndex.get(item.dhikrKey);
      const slot = resolveSlotForTimeOfDay(dhikr?.timeOfDay);
      if (!slots[slot]) {
        slots[slot] = [];
      }
      slots[slot].push(item);
    }
    return { fromDay: day.dayIndex, toDay: day.dayIndex, slots };
  });

  const template = {
    key: spec.templateKey,
    kind: 'journey',
    // Mevcut koleksiyon label/description'ı aynen kullanılır — YENİ dini
    // metin yazılmaz (metin 1447/2026'dan söz etse de içerik hicri yıldan
    // bağımsızdır; bkz. dosya başı görev notu).
    title: dataset.label,
    description: dataset.description,
    isPremium: true,
    dayCount: spec.dayCount ?? sortedDays.length,
    anchorDate: spec.anchorDate,
    phases,
    sourceEventKey: spec.sourceEventKey,
    isActive: true,
  };

  return { template, errors: [], unresolvedKeys: [...unresolved] };
}

const ESMA_DATASET_KEY = 'esmaul-husna-temel-liste';

// Esma yolculukları anchorDate taşımaz (belirli bir güne bağlı değildir).
export const ESMA_JOURNEY_SPECS = [
  { templateKey: 'esma-33-gun', itemsPerDay: 3 },
  { templateKey: 'esma-99-gun', itemsPerDay: 1 },
];

/**
 * Esma-ül Hüsna yolculuk şablonlarını üretir: `esmaulHusnaTemel.dhikrItems`
 * sırasıyla `itemsPerDay`'e göre gün fazlarına bölünür (33 gün × 3 isim,
 * 99 gün × 1 isim); her item 'free' dilimine yerleşir. Başlığa yalnızca gün
 * sayısı eklenir (mevcut-metin-temelli, YENİ cümle yazılmaz); description
 * dataset'ten aynen gelir.
 *
 * @param {object[]} datasets - SOURCE_DATASETS.
 * @param {typeof ESMA_JOURNEY_SPECS} specs
 * @returns {{templates: object[], errors: string[]}}
 */
export function buildEsmaJourneyTemplates(datasets, specs = ESMA_JOURNEY_SPECS) {
  const dataset = datasets.find((d) => d.key === ESMA_DATASET_KEY);
  if (!dataset) {
    return { templates: [], errors: [`Dataset '${ESMA_DATASET_KEY}' bulunamadı.`] };
  }
  if (!Array.isArray(dataset.dhikrItems) || dataset.dhikrItems.length === 0) {
    return { templates: [], errors: [`Dataset '${ESMA_DATASET_KEY}': dhikrItems boş.`] };
  }

  const templates = specs.map((spec) => {
    const chunks = chunkArray(dataset.dhikrItems, spec.itemsPerDay);
    const phases = chunks.map((chunkItems, index) => ({
      fromDay: index + 1,
      toDay: index + 1,
      slots: {
        free: chunkItems.map((item) => ({
          dhikrKey: item.key,
          target: item.recommendedCount ?? 100,
        })),
      },
    }));

    return {
      key: spec.templateKey,
      kind: 'journey',
      title: {
        tr: `${dataset.label.tr} — ${phases.length} gün`,
        en: `${dataset.label.en} — ${phases.length} days`,
      },
      description: dataset.description,
      isPremium: true,
      dayCount: phases.length,
      phases,
      isActive: true,
    };
  });

  return { templates, errors: [] };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// Kandil gecesi programları: dataset'in TEK specialDay'i (`specialDays[0]`)
// tek fazlı/tek gecelik (dayCount:1, slot:'night') bir journey'e dönüşür.
// anchorDate'ler bugünden (2026-09-12) sonraki en yakın tekrara aittir — bkz.
// apps/api/scripts/data/special-days-1448.mjs (kaynak: repo verisi ya da
// DOĞRULA gerektiren tahmin).
export const KANDIL_JOURNEY_SPECS = [
  {
    templateKey: 'kandil-regaib',
    datasetKey: 'regaib-kandili-2025',
    anchorDate: REGAIB_KANDILI_ANCHOR,
    sourceEventKey: 'regaib-kandili-1448',
  },
  {
    templateKey: 'kandil-mirac',
    datasetKey: 'mirac-kandili-2026',
    anchorDate: MIRAC_KANDILI_ANCHOR,
    sourceEventKey: 'mirac-kandili-1448',
  },
  {
    templateKey: 'kandil-berat',
    datasetKey: 'berat-kandili-2026',
    anchorDate: BERAT_KANDILI_ANCHOR,
    sourceEventKey: 'berat-kandili-1448',
  },
  {
    templateKey: 'kandil-kadir',
    datasetKey: 'kadir-gecesi-2026',
    anchorDate: KADIR_GECESI_ANCHOR,
    sourceEventKey: 'kadir-gecesi-1448',
  },
  {
    templateKey: 'kandil-mevlid',
    datasetKey: 'mevlid-kandili-2026',
    anchorDate: MEVLID_KANDILI_ANCHOR,
    // 1448'in Mevlid'i (2026-08-23/24) zaten geçti; bir sonraki tekrar 1449'a
    // aittir (bkz. special-days-1448.mjs).
    sourceEventKey: 'mevlid-kandili-1449',
  },
];

/**
 * 5 kandil gecesi journey şablonunu üretir. Her şablon `specialDays[0]`'in
 * `dhikrKeys`'ini global katalogdan (buildDhikrCatalogIndex) çözer ve TEK
 * fazlı/TEK dilimli ('night') bir doküman üretir — kandil gecesi tek bir
 * ihya vaktidir, item'ın kendi timeOfDay'i (Ramazan'ın aksine) ayrıştırılmaz.
 *
 * @param {object[]} datasets - SOURCE_DATASETS.
 * @param {typeof KANDIL_JOURNEY_SPECS} specs
 * @returns {{templates: object[], errors: string[], unresolvedKeys: string[]}}
 */
export function buildKandilJourneyTemplates(datasets, specs = KANDIL_JOURNEY_SPECS) {
  const datasetByKey = new Map(datasets.map((dataset) => [dataset.key, dataset]));
  const dhikrIndex = buildDhikrCatalogIndex(datasets);
  const templates = [];
  const errors = [];
  const unresolved = new Set();

  for (const spec of specs) {
    const dataset = datasetByKey.get(spec.datasetKey);
    if (!dataset) {
      errors.push(`Dataset '${spec.datasetKey}' bulunamadı (templateKey='${spec.templateKey}').`);
      continue;
    }
    const specialDay = dataset.specialDays?.[0];
    if (!specialDay) {
      errors.push(`Dataset '${spec.datasetKey}': specialDays[0] yok (templateKey='${spec.templateKey}').`);
      continue;
    }

    const { items, missing } = resolveDhikrKeysToItems(specialDay.dhikrKeys, dhikrIndex);
    missing.forEach((key) => unresolved.add(key));
    if (items.length === 0) {
      errors.push(`Şablon '${spec.templateKey}': specialDays[0].dhikrKeys içindeki hiçbir key çözülemedi.`);
      continue;
    }

    templates.push({
      key: spec.templateKey,
      kind: 'journey',
      title: specialDay.name,
      description: specialDay.description,
      isPremium: true,
      dayCount: 1,
      anchorDate: spec.anchorDate,
      phases: [{ fromDay: 1, toDay: 1, slots: { night: items } }],
      sourceEventKey: spec.sourceEventKey,
      isActive: true,
    });
  }

  return { templates, errors, unresolvedKeys: [...unresolved] };
}

/**
 * Ramazan + Esma + Kandil şablonlarının tamamını üretir (bkz. yukarıdaki üç
 * builder). Bir ailedeki hata diğerlerinin üretimini engellemez.
 *
 * @param {object[]} datasets - SOURCE_DATASETS.
 * @returns {{templates: object[], errors: string[], unresolvedKeys: string[]}}
 */
export function buildPremiumVirdTemplates(datasets) {
  const templates = [];
  const errors = [];
  const unresolvedKeys = new Set();

  const ramazan = buildRamazanJourneyTemplate(datasets);
  errors.push(...ramazan.errors);
  ramazan.unresolvedKeys.forEach((key) => unresolvedKeys.add(key));
  if (ramazan.template) {
    templates.push(ramazan.template);
  }

  const esma = buildEsmaJourneyTemplates(datasets);
  errors.push(...esma.errors);
  templates.push(...esma.templates);

  const kandil = buildKandilJourneyTemplates(datasets);
  errors.push(...kandil.errors);
  kandil.unresolvedKeys.forEach((key) => unresolvedKeys.add(key));
  templates.push(...kandil.templates);

  return { templates, errors, unresolvedKeys: [...unresolvedKeys] };
}

/**
 * Klasik (routine) + premium (journey) şablonların tamamı — seed script'inin
 * (scripts/seed-vird-templates.mjs) kullandığı tek giriş noktası.
 *
 * @param {object[]} datasets - SOURCE_DATASETS.
 * @returns {{templates: object[], errors: string[], unresolvedKeys: string[]}}
 */
export function buildAllVirdTemplates(datasets) {
  const classic = buildClassicVirdTemplates(datasets);
  const premium = buildPremiumVirdTemplates(datasets);

  return {
    templates: [...classic.templates, ...premium.templates],
    errors: [...classic.errors, ...premium.errors],
    unresolvedKeys: premium.unresolvedKeys,
  };
}
