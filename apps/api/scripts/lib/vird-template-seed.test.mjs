import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCE_DATASETS } from '../data/sourceDataset.mjs';
import { ramazanGunleri } from '../data/ramazanGunleri.mjs';
import { esmaulHusnaTemel } from '../data/esmaulHusnaTemel.mjs';
import {
  buildClassicVirdTemplates,
  buildVirdTemplateFromDataset,
  CLASSIC_VIRD_TEMPLATE_SPECS,
  buildDhikrCatalogIndex,
  resolveSlotForTimeOfDay,
  buildRamazanJourneyTemplate,
  buildEsmaJourneyTemplates,
  buildKandilJourneyTemplates,
  buildPremiumVirdTemplates,
  buildAllVirdTemplates,
  RAMAZAN_JOURNEY_SPEC,
  ESMA_JOURNEY_SPECS,
  KANDIL_JOURNEY_SPECS,
} from './vird-template-seed.mjs';

const sampleDataset = {
  key: 'ornek-koleksiyon',
  label: { tr: 'Ornek Koleksiyon', en: 'Sample Collection' },
  description: { tr: 'Aciklama', en: 'Description' },
  dhikrItems: [
    { key: 'ornek-zikir-1', recommendedCount: 10 },
    { key: 'ornek-zikir-2' },
  ],
};

test('dataset label/description title/description olur, dhikrItems tek fazli bir dilime kopyalanir', () => {
  const doc = buildVirdTemplateFromDataset(sampleDataset, {
    templateKey: 'ornek-sablon',
    slot: 'morning',
  });

  assert.equal(doc.key, 'ornek-sablon');
  assert.equal(doc.kind, 'routine');
  assert.deepEqual(doc.title, sampleDataset.label);
  assert.deepEqual(doc.description, sampleDataset.description);
  assert.equal(doc.isPremium, false);
  assert.equal(doc.isActive, true);
  assert.equal(doc.dayCount, undefined);
  assert.equal(doc.anchorDate, undefined);
  assert.equal(doc.sourceEventKey, undefined);
  assert.deepEqual(doc.phases, [
    {
      fromDay: 1,
      toDay: null,
      slots: {
        morning: [
          { dhikrKey: 'ornek-zikir-1', target: 10 },
          { dhikrKey: 'ornek-zikir-2', target: 33 },
        ],
      },
    },
  ]);
});

test('recommendedCount eksikse item target 33 varsayilanina duser', () => {
  const doc = buildVirdTemplateFromDataset(sampleDataset, {
    templateKey: 'ornek-sablon',
    slot: 'free',
  });
  const items = doc.phases[0].slots.free;
  assert.equal(items[1].target, 33);
});

test('kind/isPremium/dayCount/anchorDate/sourceEventKey spec uzerinden override edilebilir (sonraki gorevin premium/journey sablonlari icin)', () => {
  const doc = buildVirdTemplateFromDataset(sampleDataset, {
    templateKey: 'ozel-sablon',
    slot: 'free',
    kind: 'journey',
    isPremium: true,
    dayCount: 30,
    anchorDate: '2026-03-10',
    sourceEventKey: 'ramazan-girisi-2026',
  });

  assert.equal(doc.kind, 'journey');
  assert.equal(doc.isPremium, true);
  assert.equal(doc.dayCount, 30);
  assert.equal(doc.anchorDate, '2026-03-10');
  assert.equal(doc.sourceEventKey, 'ramazan-girisi-2026');
});

test('dataset verilmezse hata firlatir', () => {
  assert.throws(
    () =>
      buildVirdTemplateFromDataset(null, {
        templateKey: 'x',
        slot: 'morning',
      }),
    /Dataset bulunamadi|Dataset bulunamadı/,
  );
});

test('templateKey veya slot eksikse hata firlatir', () => {
  assert.throws(() =>
    buildVirdTemplateFromDataset(sampleDataset, { slot: 'morning' }),
  );
  assert.throws(() =>
    buildVirdTemplateFromDataset(sampleDataset, { templateKey: 'x' }),
  );
});

test('dhikrItems bos ise hata firlatir', () => {
  assert.throws(() =>
    buildVirdTemplateFromDataset(
      { key: 'bos', label: { tr: 'x', en: 'x' }, dhikrItems: [] },
      { templateKey: 'x', slot: 'morning' },
    ),
  );
});

test('buildClassicVirdTemplates: bilinmeyen datasetKey diger sablonlarin uretimini engellemez, errors listesine duser', () => {
  const { templates, errors } = buildClassicVirdTemplates(
    [sampleDataset],
    [
      {
        templateKey: 'ornek-sablon',
        datasetKey: 'ornek-koleksiyon',
        slot: 'morning',
      },
      { templateKey: 'yok-sablon', datasetKey: 'yok-dataset', slot: 'evening' },
    ],
  );

  assert.equal(templates.length, 1);
  assert.equal(templates[0].key, 'ornek-sablon');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /yok-dataset/);
});

test('CLASSIC_VIRD_TEMPLATE_SPECS + gercek SOURCE_DATASETS: 4 klasik sablonun tumu hatasiz uretilir', () => {
  const { templates, errors } = buildClassicVirdTemplates(SOURCE_DATASETS);

  assert.deepEqual(errors, []);
  assert.equal(templates.length, CLASSIC_VIRD_TEMPLATE_SPECS.length);

  const byKey = new Map(templates.map((template) => [template.key, template]));
  assert.equal(byKey.get('klasik-sabah').phases[0].slots.morning.length, 22);
  assert.equal(byKey.get('klasik-aksam').phases[0].slots.evening.length, 7);
  assert.equal(
    byKey.get('klasik-namaz-sonrasi').phases[0].slots.prayer.length,
    3,
  );
  assert.equal(
    byKey.get('klasik-gunluk-tesbih').phases[0].slots.free.length,
    3,
  );

  for (const template of templates) {
    assert.equal(template.isPremium, false);
    assert.equal(template.kind, 'routine');
    assert.equal(template.isActive, true);
    assert.ok(template.title && template.title.tr && template.title.en);
  }
});

test('CLASSIC_VIRD_TEMPLATE_SPECS: her item bir dhikrKey (string) ve pozitif target tasir', () => {
  const { templates } = buildClassicVirdTemplates(SOURCE_DATASETS);

  for (const template of templates) {
    const slots = template.phases[0].slots;
    const items = Object.values(slots).flat();
    assert.ok(items.length > 0, `${template.key}: hic item yok`);
    for (const item of items) {
      assert.equal(typeof item.dhikrKey, 'string');
      assert.ok(item.dhikrKey.length > 0);
      assert.ok(Number.isInteger(item.target) && item.target > 0);
    }
  }
});

test('CLASSIC_VIRD_TEMPLATE_SPECS: sablon key leri gorev metninde sabitlenen degerlerle birebir eslesir', () => {
  const keys = CLASSIC_VIRD_TEMPLATE_SPECS.map((spec) => spec.templateKey).sort();
  assert.deepEqual(keys, [
    'klasik-aksam',
    'klasik-gunluk-tesbih',
    'klasik-namaz-sonrasi',
    'klasik-sabah',
  ]);
});

// ─────────────────────────────────────────────────────────────────────────
// PREMİUM / ÇOK FAZLI (journey) ŞABLONLAR
// ─────────────────────────────────────────────────────────────────────────

test('buildDhikrCatalogIndex: SOURCE_DATASETS icindeki tum dhikrItems tek haritada toplanir, cakisma yok', () => {
  const index = buildDhikrCatalogIndex(SOURCE_DATASETS);
  const totalItems = SOURCE_DATASETS.reduce(
    (sum, dataset) => sum + dataset.dhikrItems.length,
    0,
  );
  // Cakisma olmadigi icin (repo'da dogrulanmistir) harita boyutu toplam
  // item sayisiyla birebir eslesmelidir.
  assert.equal(index.size, totalItems);
  assert.equal(index.get('KADIR_DUASI')?.recommendedCount, 1000);
});

test('resolveSlotForTimeOfDay: tek bir morning/evening/night dogrudan dilime, digerleri (any/coklu/bos) free dilimine eslenir', () => {
  assert.equal(resolveSlotForTimeOfDay(['sabah']), 'morning');
  assert.equal(resolveSlotForTimeOfDay(['aksam']), 'evening');
  assert.equal(resolveSlotForTimeOfDay('night'), 'night');
  assert.equal(resolveSlotForTimeOfDay(['gece', 'yatsi']), 'night');
  assert.equal(resolveSlotForTimeOfDay('any'), 'free');
  assert.equal(resolveSlotForTimeOfDay(undefined), 'free');
  assert.equal(resolveSlotForTimeOfDay(['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']), 'free');
});

test('buildRamazanJourneyTemplate: 29 faz, fromDay/toDay 1..29 boslulsuz, her fazda >=1 item, capraz key (KADIR_DUASI) cozulur', () => {
  const { template, errors, unresolvedKeys } = buildRamazanJourneyTemplate(SOURCE_DATASETS);

  assert.deepEqual(errors, []);
  assert.deepEqual(unresolvedKeys, []);
  assert.equal(template.key, 'ramazan-1448');
  assert.equal(template.kind, 'journey');
  assert.equal(template.isPremium, true);
  assert.equal(template.isActive, true);
  assert.equal(template.dayCount, ramazanGunleri.specialDays.length);
  // anchorDate artik seed'de sabitlenmez — VirdTemplatesService okuma
  // aninda special_days'ten dinamik cozer (bkz. sourceEventKey).
  assert.equal(template.anchorDate, undefined);
  assert.equal(template.sourceEventKey, 'ramazan-gunleri');
  assert.equal(template.sourceEventKey, RAMAZAN_JOURNEY_SPEC.sourceEventKey);
  // Dini metin YAZILMADI: title/description dogrudan mevcut dataset'ten.
  assert.deepEqual(template.title, ramazanGunleri.label);
  assert.deepEqual(template.description, ramazanGunleri.description);

  assert.equal(template.phases.length, ramazanGunleri.specialDays.length);
  template.phases.forEach((phase, index) => {
    assert.equal(phase.fromDay, index + 1);
    assert.equal(phase.toDay, index + 1);
    const itemCount = Object.values(phase.slots).flat().length;
    assert.ok(itemCount >= 1, `gun ${index + 1}: hic item yok`);
  });

  // Son gun (29): KADIR_DUASI kendi dataset'inde degil, kadirGecesi
  // dataset'inde tanimli — capraz cozum dogrulanir ve night dilimine duser
  // (kadirGecesi'ndeki timeOfDay='night').
  const lastPhase = template.phases[template.phases.length - 1];
  assert.ok(lastPhase.slots.night?.some((item) => item.dhikrKey === 'KADIR_DUASI'));
});

test('buildRamazanJourneyTemplate: bilinmeyen dhikrKey unresolvedKeys listesine duser, fazi durdurmaz', () => {
  const sahteDataset = {
    key: 'sahte-ramazan',
    label: { tr: 'Sahte', en: 'Fake' },
    description: { tr: 'd', en: 'd' },
    dhikrItems: [{ key: 'BILINEN', recommendedCount: 5, timeOfDay: 'sabah' }],
    specialDays: [
      { dayIndex: 1, dhikrKeys: ['BILINEN', 'YOK-KEY'] },
    ],
  };

  const { template, unresolvedKeys } = buildRamazanJourneyTemplate([sahteDataset], {
    templateKey: 'sahte-ramazan-sablon',
    datasetKey: 'sahte-ramazan',
    sourceEventKey: 'sahte',
  });

  assert.deepEqual(unresolvedKeys, ['YOK-KEY']);
  assert.equal(template.phases[0].slots.morning.length, 1);
  assert.equal(template.phases[0].slots.morning[0].dhikrKey, 'BILINEN');
});

test('buildEsmaJourneyTemplates: esma-33-gun 33 faz x 3 item, esma-99-gun 99 faz x 1 item, dini metin yazilmadi', () => {
  const { templates, errors } = buildEsmaJourneyTemplates(SOURCE_DATASETS);
  assert.deepEqual(errors, []);
  assert.equal(templates.length, ESMA_JOURNEY_SPECS.length);

  const byKey = new Map(templates.map((template) => [template.key, template]));

  const esma33 = byKey.get('esma-33-gun');
  assert.equal(esma33.phases.length, 33);
  assert.equal(esma33.dayCount, 33);
  esma33.phases.forEach((phase, index) => {
    assert.equal(phase.fromDay, index + 1);
    assert.equal(phase.toDay, index + 1);
    assert.equal(phase.slots.free.length, 3);
  });
  // Baslik mevcut label metnine dayanir, yalnizca gun sayisi eklenmistir.
  assert.equal(esma33.title.tr, `${esmaulHusnaTemel.label.tr} — 33 gün`);
  assert.deepEqual(esma33.description, esmaulHusnaTemel.description);

  const esma99 = byKey.get('esma-99-gun');
  assert.equal(esma99.phases.length, 99);
  assert.equal(esma99.dayCount, 99);
  esma99.phases.forEach((phase) => {
    assert.equal(phase.slots.free.length, 1);
  });

  // Sirali kullanim: tum 99 esma, 33-gun sablonunda da 99-gun sablonunda da
  // orijinal dataset sirasiyla kullanilir.
  const allKeysFrom33 = esma33.phases.flatMap((phase) => phase.slots.free.map((i) => i.dhikrKey));
  const allKeysFrom99 = esma99.phases.flatMap((phase) => phase.slots.free.map((i) => i.dhikrKey));
  const datasetKeys = esmaulHusnaTemel.dhikrItems.map((item) => item.key);
  assert.deepEqual(allKeysFrom33, datasetKeys);
  assert.deepEqual(allKeysFrom99, datasetKeys);
});

test('buildKandilJourneyTemplates: 5 sablon, her biri tek faz x night dilimi, capraz key (KADIR_DUASI/SALAVAT-I ŞERİFE) cozulur', () => {
  const { templates, errors, unresolvedKeys } = buildKandilJourneyTemplates(SOURCE_DATASETS);

  assert.deepEqual(errors, []);
  assert.deepEqual(unresolvedKeys, []);
  assert.equal(templates.length, KANDIL_JOURNEY_SPECS.length);

  const expectedKeys = [
    'kandil-regaib',
    'kandil-mirac',
    'kandil-berat',
    'kandil-kadir',
    'kandil-mevlid',
  ].sort();
  assert.deepEqual(templates.map((t) => t.key).sort(), expectedKeys);

  // sourceEventKey artik yil eki TASIMAYAN bir "aile" anahtaridir; anchorDate
  // seed'de hic yazilmaz — VirdTemplatesService okuma aninda special_days'ten
  // dinamik cozer (bkz. resolveAnchorDate).
  const expectedFamilyByKey = {
    'kandil-regaib': 'regaib-kandili',
    'kandil-mirac': 'mirac-kandili',
    'kandil-berat': 'berat-kandili',
    'kandil-kadir': 'kadir-gecesi',
    'kandil-mevlid': 'mevlid-kandili',
  };

  for (const template of templates) {
    assert.equal(template.kind, 'journey');
    assert.equal(template.isPremium, true);
    assert.equal(template.dayCount, 1);
    assert.equal(template.isActive, true);
    assert.equal(template.anchorDate, undefined);
    assert.equal(template.sourceEventKey, expectedFamilyByKey[template.key]);
    assert.equal(template.phases.length, 1);
    assert.equal(template.phases[0].fromDay, 1);
    assert.equal(template.phases[0].toDay, 1);
    assert.deepEqual(Object.keys(template.phases[0].slots), ['night']);
    assert.ok(template.phases[0].slots.night.length >= 1);
    assert.ok(template.title?.tr && template.title?.en);
  }

  const kadir = templates.find((t) => t.key === 'kandil-kadir');
  assert.ok(kadir.phases[0].slots.night.some((item) => item.dhikrKey === 'KADIR_DUASI'));
  assert.ok(kadir.phases[0].slots.night.some((item) => item.dhikrKey === 'SALAVAT-I ŞERİFE'));
});

test('buildPremiumVirdTemplates + buildAllVirdTemplates: gercek SOURCE_DATASETS ile 4 klasik + 1 ramazan + 2 esma + 5 kandil = 12 sablon, hic cozulemeyen key yok', () => {
  const premium = buildPremiumVirdTemplates(SOURCE_DATASETS);
  assert.deepEqual(premium.errors, []);
  assert.deepEqual(premium.unresolvedKeys, []);
  assert.equal(premium.templates.length, 8);

  const all = buildAllVirdTemplates(SOURCE_DATASETS);
  assert.deepEqual(all.errors, []);
  assert.deepEqual(all.unresolvedKeys, []);
  assert.equal(all.templates.length, 12);

  const keys = all.templates.map((t) => t.key).sort();
  assert.deepEqual(keys, [
    'esma-33-gun',
    'esma-99-gun',
    'kandil-berat',
    'kandil-kadir',
    'kandil-mevlid',
    'kandil-mirac',
    'kandil-regaib',
    'klasik-aksam',
    'klasik-gunluk-tesbih',
    'klasik-namaz-sonrasi',
    'klasik-sabah',
    'ramazan-1448',
  ]);

  // Her sablonun key alani benzersiz (upsert anahtari cakismasi olmamali).
  assert.equal(new Set(keys).size, keys.length);
});
