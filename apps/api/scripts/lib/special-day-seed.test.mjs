import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  expandSpecialDayTemplate,
  expandSpecialDays,
  resolveEventKey,
  getKnownHijriYears,
  getDatasetFamilies,
  findOrphanCandidates,
  filterByMinDate,
  EVENT_FAMILY_KEY_OVERRIDES,
  LEGACY_EVENT_KEYS,
  SPECIAL_DAYS_SEED_MIN_DATE,
} from './special-day-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: __dirname })
  .toString()
  .trim();

const YEARS = [1447, 1448, 1449, 1450];

function tmpl(overrides) {
  return {
    name: { tr: 'Test Olayı', en: 'Test Event' },
    type: 'özel gün',
    priority: 100,
    dhikrKeys: ['some-key'],
    eventFamily: 'test-family',
    ...overrides,
  };
}

test('resolveEventKey: override haritasındaki yıl için legacy anahtar döner', () => {
  assert.equal(resolveEventKey('mirac-kandili', 1447), 'mirac-kandili-2026');
  assert.equal(resolveEventKey('mevlid-kandili', 1448), 'mevlid-kandili-2026');
});

test('resolveEventKey: override olmayan yıl için <family>-<hicriYıl> döner', () => {
  assert.equal(resolveEventKey('mirac-kandili', 1448), 'mirac-kandili-1448');
  assert.equal(resolveEventKey('mirac-kandili', 1449), 'mirac-kandili-1449');
  assert.equal(resolveEventKey('yeni-aile', 1450), 'yeni-aile-1450');
});

test('resolveEventKey: aynı ailenin farklı hicri yılları asla aynı anahtara çakışmaz (miladi yıl çakışması dahi)', () => {
  // Miraç: 1448 (2027-01-04) ve 1449 (2027-12-24) ikisi de miladi 2027'ye
  // düşer, ama resolveEventKey hicri yılı kullandığı için çakışmaz.
  const key1448 = resolveEventKey('mirac-kandili', 1448);
  const key1449 = resolveEventKey('mirac-kandili', 1449);
  assert.notEqual(key1448, key1449);
});

test('EVENT_FAMILY_KEY_OVERRIDES: her override zaten canlı olan (aile,yıl) çiftleri için', () => {
  assert.ok(EVENT_FAMILY_KEY_OVERRIDES['mirac-kandili'][1447]);
  assert.ok(EVENT_FAMILY_KEY_OVERRIDES['regaib-kandili'][1447]);
  assert.ok(EVENT_FAMILY_KEY_OVERRIDES['regaib-kandili'][1448]);
});

test('getKnownHijriYears: HIJRI_MONTH_STARTS tablosundaki tüm yılları döner, sıralı', () => {
  const years = getKnownHijriYears();
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
  assert.ok(years.includes(1447) && years.includes(1450));
});

test('expandSpecialDayTemplate: basit hijri {month,day} şablonu her yıl için açılır', () => {
  const t = tmpl({ hijri: { month: 'muharrem', day: 1 } });
  const { expanded, skipped } = expandSpecialDayTemplate(t, YEARS);
  assert.equal(expanded.length, 4);
  assert.equal(skipped.length, 0);
  assert.equal(expanded[0].date, '2025-06-26');
  assert.equal(expanded[0].hijriDate, '1 Muharrem 1447');
  assert.equal(expanded[0].eventKey, 'test-family-1447');
  // hijri/hijriRule/eventFamily/onlyHijriYears/excludeHijriYears çıktıya
  // eventFamily hariç sızmaz (DB payload'u temiz kalır).
  assert.equal(expanded[0].hijri, undefined);
  assert.equal(expanded[0].eventFamily, 'test-family');
});

test('expandSpecialDayTemplate: night:true gece formülünü uygular', () => {
  const t = tmpl({ hijri: { month: 'recep', day: 27, night: true } });
  const { expanded } = expandSpecialDayTemplate(t, [1447]);
  assert.equal(expanded[0].date, '2026-01-15');
  assert.equal(expanded[0].hijriDate, '27 Recep 1447');
});

test('expandSpecialDayTemplate: ay başlangıcı null olan yıl atlanır', () => {
  const t = tmpl({ hijri: { month: 'ramazan', day: 1 } });
  const { expanded, skipped } = expandSpecialDayTemplate(t, [1450, 1451]);
  assert.equal(expanded.length, 1); // 1450 var
  assert.equal(skipped.length, 1); // 1451 ramazan null
  assert.equal(skipped[0].hijriYear, 1451);
  assert.equal(skipped[0].eventFamily, 'test-family');
});

test('expandSpecialDayTemplate: hijriRule first-weekday-on-or-after', () => {
  const t = tmpl({ hijriRule: { type: 'first-weekday-on-or-after', month: 'recep', weekday: 'thursday' } });
  const { expanded } = expandSpecialDayTemplate(t, [1447, 1448]);
  assert.equal(expanded[0].date, '2025-12-25');
  assert.equal(expanded[0].hijriDate, '5 Recep 1447');
  assert.equal(expanded[1].date, '2026-12-10');
  assert.equal(expanded[1].hijriDate, '1 Recep 1448');
});

test('expandSpecialDayTemplate: hijriRule last-weekday-on-or-before-month-end', () => {
  const t = tmpl({ hijriRule: { type: 'last-weekday-on-or-before-month-end', month: 'safer', weekday: 'wednesday' } });
  const { expanded } = expandSpecialDayTemplate(t, [1448]);
  assert.equal(expanded[0].date, '2026-08-12');
  assert.equal(expanded[0].hijriDate, '29 Safer 1448');
});

test('expandSpecialDayTemplate: eventFamily zorunlu', () => {
  assert.throws(() => expandSpecialDayTemplate({ hijri: { month: 'muharrem', day: 1 } }, [1447]));
});

test('expandSpecialDayTemplate: hijri veya hijriRule zorunlu', () => {
  assert.throws(() => expandSpecialDayTemplate(tmpl({}), [1447]));
});

test('expandSpecialDayTemplate: onlyHijriYears verilen yıllara sınırlar', () => {
  const t = tmpl({ hijri: { month: 'muharrem', day: 1 }, onlyHijriYears: [1447] });
  const { expanded } = expandSpecialDayTemplate(t, YEARS);
  assert.equal(expanded.length, 1);
  assert.equal(expanded[0].eventKey, 'test-family-1447');
});

test('expandSpecialDayTemplate: excludeHijriYears verilen yılları çıkarır', () => {
  const t = tmpl({ hijri: { month: 'muharrem', day: 1 }, excludeHijriYears: [1447] });
  const { expanded } = expandSpecialDayTemplate(t, YEARS);
  assert.equal(expanded.length, 3);
  assert.ok(!expanded.some((e) => e.eventKey === 'test-family-1447'));
});

test('expandSpecialDays: onlyHijriYears + excludeHijriYears ile ikiye bölünmüş aynı aile çakışmaz', () => {
  const sparse = tmpl({ hijri: { month: 'recep', day: 1 }, name: { tr: 'Aynı Ad' }, onlyHijriYears: [1447] });
  const rich = tmpl({ hijri: { month: 'recep', day: 1 }, name: { tr: 'Aynı Ad' }, excludeHijriYears: [1447] });
  const { expanded, skipped } = expandSpecialDays([sparse, rich], YEARS);
  assert.equal(skipped.length, 0);
  assert.equal(expanded.length, 4); // 1447 (sparse) + 1448,1449,1450 (rich)
  const keys = expanded.map((e) => e.eventKey).sort();
  assert.deepEqual(keys, ['test-family-1447', 'test-family-1448', 'test-family-1449', 'test-family-1450']);
});

test('expandSpecialDays: aynı eventKey+dayIndex+ad farklı içerikle üretilirse hata fırlatır', () => {
  const a = tmpl({ hijri: { month: 'muharrem', day: 1 }, name: { tr: 'Çakışan' }, priority: 100 });
  const b = tmpl({ hijri: { month: 'muharrem', day: 1 }, name: { tr: 'Çakışan' }, priority: 999 });
  assert.throws(() => expandSpecialDays([a, b], [1447]), /çakışması/);
});

test('expandSpecialDays: farklı isimli iki alt-olay AYNI eventKey+dayIndex paylaşabilir (name.tr ayırt eder)', () => {
  // Safer Ayı Girişi (day-formula) ile İlk Çarşamba (weekday-rule) bazı
  // yıllarda aynı takvim gününe denk gelir ama isimleri farklıdır — bu
  // GÜVENLİDİR, DB tarafında name.tr ile ayrılırlar (bkz. buildSpecialDayFilter).
  const girisi = tmpl({ hijri: { month: 'safer', day: 1 }, name: { tr: 'Safer Ayı Girişi' }, eventFamily: 'safer-ayi' });
  const ilkCarsamba = tmpl({
    hijriRule: { type: 'first-weekday-on-or-after', month: 'safer', weekday: 'wednesday' },
    name: { tr: 'Safer İlk Çarşamba' },
    eventFamily: 'safer-ayi',
  });
  assert.doesNotThrow(() => expandSpecialDays([girisi, ilkCarsamba], [1448]));
});

test('expandSpecialDays: idempotent — aynı şablon listesi iki kez açılınca aynı sonucu verir', () => {
  const t = tmpl({ hijri: { month: 'zilkade', day: 1 } });
  const first = expandSpecialDays([t], [1447]);
  const second = expandSpecialDays([t], [1447]);
  assert.deepEqual(first.expanded, second.expanded);
});

test('expandSpecialDays: bilinmeyen hijriRule.type hata fırlatır', () => {
  const t = tmpl({ hijriRule: { type: 'gecersiz-kural', month: 'safer', weekday: 'wednesday' } });
  assert.throws(() => expandSpecialDays([t], [1448]), /Bilinmeyen hijriRule/);
});

// ---- Yıl-etiketi placeholder mekanizması (name/description) ----

test('expandSpecialDayTemplate: name/description içindeki {hijriYear}/{gregorianYear} doldurulur', () => {
  const t = tmpl({
    hijri: { month: 'muharrem', day: 13 },
    name: { tr: 'Test — Muharrem {hijriYear}', en: 'Test — Muharram {hijriYear}' },
    description: { tr: '{hijriYear} yılı, miladi {gregorianYear}.', en: 'Year {hijriYear}, gregorian {gregorianYear}.' },
  });
  const { expanded } = expandSpecialDayTemplate(t, [1448]);
  assert.equal(expanded[0].name.tr, 'Test — Muharrem 1448');
  assert.equal(expanded[0].name.en, 'Test — Muharram 1448');
  assert.match(expanded[0].description.tr, /1448 yılı, miladi 2026\./);
  assert.match(expanded[0].description.en, /Year 1448, gregorian 2026\./);
});

test('expandSpecialDayTemplate: placeholder yoksa name/description değişmeden kalır', () => {
  const t = tmpl({ hijri: { month: 'muharrem', day: 1 } });
  const { expanded } = expandSpecialDayTemplate(t, [1447]);
  assert.deepEqual(expanded[0].name, { tr: 'Test Olayı', en: 'Test Event' });
});

test('expandSpecialDayTemplate: article/practices placeholder ile değişmez (kasıtlı olarak dokunulmaz)', () => {
  const t = tmpl({
    hijri: { month: 'muharrem', day: 1 },
    article: { tr: '{hijriYear} burada doldurulmaz.', en: '{hijriYear} not filled here.' },
  });
  const { expanded } = expandSpecialDayTemplate(t, [1447]);
  assert.equal(expanded[0].article.tr, '{hijriYear} burada doldurulmaz.');
});

// ---- Gerçek eyyamibiyd.mjs / saferAyi.mjs üzerinde yıl-etiketi doğrulaması ----
// eyyamibiyd.mjs ve saferAyi.mjs, koordinatör talebiyle name/description
// içindeki sabit "1448" hicri yılını `{hijriYear}` yer tutucusuna çevirdi
// (bkz. proje notu). Bu testler: (1) başka bir hicri yıl için doğru
// doldurulduğunu, (2) ORİJİNAL yılı (1448) için doldurulunca git HEAD'deki
// orijinal metinle BİREBİR aynı sonucu verdiğini (içerik hiçbir şekilde
// değişmedi, sadece "1448" -> "{hijriYear}" -> "1448" round-trip'i) kanıtlar.

test('eyyamibiyd.mjs: 1449 için açılınca name/description "1449" içerir, "1448" veya "{hijriYear}" İÇERMEZ', async () => {
  const { eyyamibiyd } = await import('../data/eyyamibiyd.mjs');
  const { expanded } = expandSpecialDays(eyyamibiyd.specialDays, [1449]);
  assert.ok(expanded.length > 0);
  for (const doc of expanded) {
    for (const lang of ['tr', 'en']) {
      assert.ok(doc.name[lang].includes('1449'), `name.${lang} 1449 içermeli: ${doc.name[lang]}`);
      assert.ok(!doc.name[lang].includes('{hijriYear}'), `name.${lang} yer tutucu barındırmamalı: ${doc.name[lang]}`);
      assert.ok(!doc.name[lang].includes('1448'), `name.${lang} eski yılı barındırmamalı: ${doc.name[lang]}`);
      assert.ok(doc.description[lang].includes('1449'));
      assert.ok(!doc.description[lang].includes('{hijriYear}'));
    }
  }
});

test('eyyamibiyd.mjs: 1448 için açılınca git HEAD\'deki orijinal name/description ile BİREBİR aynı (round-trip)', async () => {
  const { eyyamibiyd } = await import('../data/eyyamibiyd.mjs');
  const { expanded } = expandSpecialDays(eyyamibiyd.specialDays, [1448]);

  const oldSource = execFileSync('git', ['show', 'HEAD:apps/api/scripts/data/eyyamibiyd.mjs'], { cwd: REPO_ROOT }).toString();
  const oldPath = resolve(REPO_ROOT, 'apps/api/scripts/data/.eyyamibiyd.head-snapshot.mjs');
  writeFileSync(oldPath, oldSource);
  try {
    const { eyyamibiyd: oldDs } = await import(oldPath);
    assert.equal(expanded.length, oldDs.specialDays.length);
    for (let i = 0; i < expanded.length; i += 1) {
      assert.deepEqual(expanded[i].name, oldDs.specialDays[i].name, `entry[${i}] name`);
      assert.deepEqual(expanded[i].description, oldDs.specialDays[i].description, `entry[${i}] description`);
    }
  } finally {
    unlinkSync(oldPath);
  }
});

test('saferAyi.mjs: 1448 için açılınca "Safer İlk Çarşamba" description git HEAD ile birebir aynı (round-trip)', async () => {
  const { saferAyi } = await import('../data/saferAyi.mjs');
  const { expanded } = expandSpecialDays(saferAyi.specialDays, [1448]);
  const ilkCarsamba = expanded.find((d) => d.name.tr === 'Safer İlk Çarşamba Gecesi');
  assert.ok(ilkCarsamba, 'Safer İlk Çarşamba Gecesi 1448 için üretilmeli');

  const oldSource = execFileSync('git', ['show', 'HEAD:apps/api/scripts/data/saferAyi.mjs'], { cwd: REPO_ROOT }).toString();
  const oldPath = resolve(REPO_ROOT, 'apps/api/scripts/data/.saferAyi.head-snapshot.mjs');
  writeFileSync(oldPath, oldSource);
  try {
    const { saferAyi: oldDs } = await import(oldPath);
    const oldIlkCarsamba = oldDs.specialDays.find((d) => d.name.tr === 'Safer İlk Çarşamba Gecesi');
    assert.deepEqual(ilkCarsamba.description, oldIlkCarsamba.description);
  } finally {
    unlinkSync(oldPath);
  }
});

// ---- getDatasetFamilies ----

test('getDatasetFamilies: dataset şablonlarındaki eventFamily kümesini tekrarsız döner', () => {
  const dataset = {
    specialDays: [
      tmpl({ hijri: { month: 'muharrem', day: 1 }, eventFamily: 'fam-a' }),
      tmpl({ hijri: { month: 'safer', day: 1 }, eventFamily: 'fam-a' }),
      tmpl({ hijri: { month: 'recep', day: 1 }, eventFamily: 'fam-b' }),
    ],
  };
  assert.deepEqual(getDatasetFamilies(dataset).sort(), ['fam-a', 'fam-b']);
});

// ---- findOrphanCandidates (--deactivate-orphans) ----

test('findOrphanCandidates: ^<family>-\\d{4}$ desenine uyan ama bu çalışmada üretilmeyen aktif kayıt orphan sayılır', () => {
  const dbDocs = [
    { _id: 1, eventKey: 'mirac-kandili-2019', isActive: true }, // eski/artık üretilmeyen yıl
    { _id: 2, eventKey: 'mirac-kandili-2026', isActive: true }, // bu çalışmada üretildi
  ];
  const expanded = [{ eventKey: 'mirac-kandili-2026' }];
  const orphans = findOrphanCandidates({ dbDocs, expanded, families: ['mirac-kandili'] });
  assert.deepEqual(orphans.map((o) => o._id), [1]);
});

test('findOrphanCandidates: LEGACY_EVENT_KEYS listesindeki anahtar da orphan sayılır', () => {
  const dbDocs = [{ _id: 1, eventKey: 'eyyami-biyd-2026', isActive: true }];
  const orphans = findOrphanCandidates({ dbDocs, expanded: [], families: ['eyyami-biyd-muharrem'] });
  assert.deepEqual(orphans.map((o) => o._id), [1]);
  assert.ok(LEGACY_EVENT_KEYS.includes('eyyami-biyd-2026'));
});

test('findOrphanCandidates: zaten isActive:false olan kayıt tekrar orphan sayılmaz', () => {
  const dbDocs = [{ _id: 1, eventKey: 'mirac-kandili-2019', isActive: false }];
  const orphans = findOrphanCandidates({ dbDocs, expanded: [], families: ['mirac-kandili'] });
  assert.equal(orphans.length, 0);
});

test('findOrphanCandidates: yönetilmeyen bir aileye/desene uymayan kayıt DOKUNULMAZ (SİLİNMEZ/DEVRE DIŞI BIRAKILMAZ)', () => {
  const dbDocs = [{ _id: 1, eventKey: 'baska-bir-modulun-ozel-gunu', isActive: true }];
  const orphans = findOrphanCandidates({ dbDocs, expanded: [], families: ['mirac-kandili'] });
  assert.equal(orphans.length, 0);
});

test('findOrphanCandidates: bu çalışmada üretilen eventKey asla orphan sayılmaz', () => {
  const dbDocs = [{ _id: 1, eventKey: 'mirac-kandili-2026', isActive: true }];
  const orphans = findOrphanCandidates({ dbDocs, expanded: [{ eventKey: 'mirac-kandili-2026' }], families: ['mirac-kandili'] });
  assert.equal(orphans.length, 0);
});

// ---- filterByMinDate (SPECIAL_DAYS_SEED_MIN_DATE / --include-history) ----

test('filterByMinDate: min tarih altındaki kayıtlar varsayılan olarak atlanır', () => {
  const docs = [
    { eventKey: 'a', date: '2025-06-26' }, // < SPECIAL_DAYS_SEED_MIN_DATE
    { eventKey: 'b', date: SPECIAL_DAYS_SEED_MIN_DATE }, // sınırda, dahil
    { eventKey: 'c', date: '2026-01-01' },
  ];
  const { kept, belowMinDate } = filterByMinDate(docs);
  assert.deepEqual(kept.map((d) => d.eventKey), ['b', 'c']);
  assert.deepEqual(belowMinDate.map((d) => d.eventKey), ['a']);
});

test('filterByMinDate: includeHistory:true hiçbir şeyi atlamaz', () => {
  const docs = [{ eventKey: 'a', date: '2020-01-01' }];
  const { kept, belowMinDate } = filterByMinDate(docs, { includeHistory: true });
  assert.equal(kept.length, 1);
  assert.equal(belowMinDate.length, 0);
});

test('filterByMinDate: özel minDate parametresi kullanılabilir', () => {
  const docs = [{ eventKey: 'a', date: '2026-06-01' }, { eventKey: 'b', date: '2026-07-01' }];
  const { kept, belowMinDate } = filterByMinDate(docs, { minDate: '2026-06-15' });
  assert.deepEqual(kept.map((d) => d.eventKey), ['b']);
  assert.deepEqual(belowMinDate.map((d) => d.eventKey), ['a']);
});

test('SPECIAL_DAYS_SEED_MIN_DATE: uc-aylar-baslangic-2025 gününe eşit (DB tarihçesinin başlangıcı)', () => {
  assert.equal(SPECIAL_DAYS_SEED_MIN_DATE, '2025-12-21');
});

test('runSpecialDaySeed (dryRun): gerçek MASTER dataset min tarih altındaki kayıtları (Muharrem/Safer 1447 vb.) atlar', async () => {
  const { SPECIAL_DAY_DATASET } = await import('../seed-special-days-master-2026.mjs');
  const { runSpecialDaySeed } = await import('./special-day-seed.mjs');
  const result = await runSpecialDaySeed(SPECIAL_DAY_DATASET, { dryRun: true });
  assert.ok(result.belowMinDate.length > 0, 'gerçek datasette min-tarih-altı örnek olmalı (örn. muharrem-ilk-on-1447)');
  for (const doc of result.expanded) {
    assert.ok(doc.date >= SPECIAL_DAYS_SEED_MIN_DATE, `${doc.eventKey} min tarihin altında kalmamalı: ${doc.date}`);
  }
  for (const doc of result.belowMinDate) {
    assert.ok(doc.date < SPECIAL_DAYS_SEED_MIN_DATE);
  }
});
