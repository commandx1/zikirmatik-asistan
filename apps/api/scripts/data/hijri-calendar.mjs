/**
 * Tek bir hicri takvim tablosu: her hicri ay başlangıcının miladi karşılığı
 * (Diyanet kuralı: hicri ayın 1. gününün GÜNDÜZÜ). Özel gün veri dosyaları
 * kendi `date`/`hijriDate` alanlarını taşımaz; bunun yerine `hijri: { month,
 * day, night? }` veya `hijriRule: { type, month, weekday }` tanımı taşır ve
 * seed zamanında bu tablo ile "açılır" (bkz. scripts/lib/special-day-seed.mjs).
 *
 * Yıllık bakım: yeni bir hicri yıl geldiğinde SADECE bu dosyaya yeni bir yıl
 * girişi eklenir; veri dosyalarına (mevlidKandili.mjs vb.) dokunulmaz.
 *
 * Diyanet kuralı (gündüz/gece):
 * - Gündüz olayı (bayram, ramazan günü, ay girişi, "özel gün"): date = ayBaşlangıcı + (day - 1).
 * - Gece olayı (kandil): date = ayBaşlangıcı + (day - 2). Örn. Miraç 27 Recep
 *   GECESİ kutlanır; Recep başlangıcı + 25 = Diyanet'in "27 Recep" dediği
 *   miladi gündür.
 * - İSTİSNA — Mevlid Kandili: Diyanet bunu resmi listede "11 Rebiülevvel"
 *   olarak etiketler ve GÜNDÜZ formülüyle (offset = 11 - 1 = 10) hesaplar,
 *   "12 Rebiülevvel gecesi" biçiminde değil. Bu yüzden mevlidKandili.mjs
 *   `hijri: { month: 'rebiulevvel', day: 11, night: false }` kullanır (bkz.
 *   hijri-calendar.test.mjs — repo'nun mevcut '11 Rebiülevvel 1448' / 24
 *   Ağustos 2026 kaydıyla birebir doğrulanmıştır).
 *
 * null değerler resmi kaynağı henüz doğrulanmamış ay başlangıçlarıdır; bu
 * aylara bağlı özel günler seed sırasında atlanır (dry-run raporunda
 * listelenir).
 */

export const HIJRI_MONTHS = [
  'muharrem',
  'safer',
  'rebiulevvel',
  'rebiulahir',
  'cemaziyelevvel',
  'cemaziyelahir',
  'recep',
  'saban',
  'ramazan',
  'sevval',
  'zilkade',
  'zilhicce',
];

// Programatik anahtar (HIJRI_MONTHS) -> Türkçe görünen ay adı. Mevcut
// hijriDate metinlerindeki yazımla eşleşir (bkz. hicriAyBaslangiclari.mjs);
// "Cemaziyülahir" gibi tekil varyantlar standardize edildi (bu alan içerik
// alanı DEĞİL, task kapsamında yeniden üretiliyor).
export const HIJRI_MONTH_DISPLAY_NAMES = {
  muharrem: 'Muharrem',
  safer: 'Safer',
  rebiulevvel: 'Rebiülevvel',
  rebiulahir: 'Rebiülahir',
  cemaziyelevvel: 'Cemaziyelevvel',
  cemaziyelahir: 'Cemaziyelahir',
  recep: 'Recep',
  saban: 'Şaban',
  ramazan: 'Ramazan',
  sevval: 'Şevval',
  zilkade: 'Zilkade',
  zilhicce: 'Zilhicce',
};

export const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Hicri yıl -> ay -> miladi 'YYYY-MM-DD' ay başlangıcı, veya `null`.
 * Kaynak: Diyanet İşleri Başkanlığı resmi "Dini Günler Listesi" yıllık
 * sayfaları (vakithesaplama.diyanet.gov.tr) — 2025: icerik=152, 2026:
 * icerik=153, 2027: icerik=154, 2028: icerik=185, 2029: icerik=186.
 */
export const HIJRI_MONTH_STARTS = {
  1447: {
    muharrem: '2025-06-26',
    safer: '2025-07-26',
    rebiulevvel: '2025-08-24',
    rebiulahir: '2025-09-23',
    cemaziyelevvel: '2025-10-23',
    cemaziyelahir: '2025-11-21',
    recep: '2025-12-21',
    saban: '2026-01-20',
    ramazan: '2026-02-19',
    sevval: '2026-03-20',
    zilkade: '2026-04-18',
    zilhicce: '2026-05-18',
    sources: 'Diyanet resmi hicri takvim (icerik=152/153); repo verisiyle (mevcut özel gün dosyaları) tam doğrulandı.',
  },
  1448: {
    muharrem: '2026-06-16',
    safer: '2026-07-15',
    rebiulevvel: '2026-08-14',
    rebiulahir: '2026-09-12',
    cemaziyelevvel: '2026-10-12',
    cemaziyelahir: '2026-11-10',
    recep: '2026-12-10',
    saban: '2027-01-09',
    ramazan: '2027-02-08',
    sevval: '2027-03-09',
    zilkade: '2027-04-08',
    zilhicce: '2027-05-07',
    sources: 'Diyanet resmi hicri takvim (icerik=153/154); repo verisiyle tam doğrulandı.',
  },
  1449: {
    muharrem: '2027-06-06',
    safer: '2027-07-05',
    rebiulevvel: '2027-08-03',
    rebiulahir: '2027-09-02',
    cemaziyelevvel: '2027-10-01',
    cemaziyelahir: '2027-10-31',
    recep: '2027-11-29',
    saban: '2027-12-29',
    ramazan: '2028-01-28',
    sevval: '2028-02-26',
    zilkade: '2028-03-27',
    zilhicce: '2028-04-26',
    sources: 'Diyanet resmi hicri takvim (icerik=154/185).',
  },
  1450: {
    muharrem: '2028-05-25',
    safer: '2028-06-24',
    rebiulevvel: '2028-07-23',
    rebiulahir: '2028-08-21',
    cemaziyelevvel: '2028-09-20',
    cemaziyelahir: '2028-10-19',
    recep: '2028-11-18',
    saban: '2028-12-17',
    ramazan: '2029-01-16',
    sevval: '2029-02-14',
    zilkade: '2029-03-16',
    zilhicce: '2029-04-15',
    sources: 'Diyanet resmi hicri takvim (icerik=185/186).',
  },
  1451: {
    muharrem: '2029-05-14',
    safer: '2029-06-13',
    rebiulevvel: '2029-07-13',
    rebiulahir: '2029-08-11',
    cemaziyelevvel: '2029-09-09',
    cemaziyelahir: '2029-10-09',
    recep: '2029-11-07',
    saban: '2029-12-07',
    ramazan: null,
    sevval: null,
    zilkade: null,
    zilhicce: null,
    sources: 'Diyanet resmi hicri takvim (icerik=186); 2030 listesi henüz yayınlanmadığı için Ramazan 1451 ve sonrası null.',
  },
};

/**
 * Yalnız doğrulama için: Diyanet'in yayınladığı resmi miladi tarihler.
 * hijri-calendar.test.mjs bu tabloyla türetilen tarihleri karşılaştırır.
 */
export const OFFICIAL_DIYANET_DATES = {
  2025: {
    hicriYilbasi1447: '2025-06-26',
    asure1447: '2025-07-05',
    mevlid1447: '2025-09-03',
    ucAylar1447: '2025-12-21',
    regaib1447: '2025-12-25',
  },
  2026: {
    mirac1447: '2026-01-15',
    berat1447: '2026-02-02',
    ramazanBaslangic1447: '2026-02-19',
    kadir1447: '2026-03-16',
    ramazanBayrami1447: ['2026-03-20', '2026-03-21', '2026-03-22'],
    kurbanArefesi1447: '2026-05-26',
    kurbanBayrami1447: ['2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'],
    hicriYilbasi1448: '2026-06-16',
    asure1448: '2026-06-25',
    mevlid1448: '2026-08-24',
    ucAylar1448: '2026-12-10',
    regaib1448: '2026-12-10',
  },
  2027: {
    mirac1448: '2027-01-04',
    berat1448: '2027-01-22',
    ramazanBaslangic1448: '2027-02-08',
    kadir1448: '2027-03-05',
    ramazanArefesi1448: '2027-03-08',
    ramazanBayrami1448: ['2027-03-09', '2027-03-10', '2027-03-11'],
    kurbanArefesi1448: '2027-05-15',
    kurbanBayrami1448: ['2027-05-16', '2027-05-17', '2027-05-18', '2027-05-19'],
    hicriYilbasi1449: '2027-06-06',
    asure1449: '2027-06-15',
    mevlid1449: '2027-08-13',
    ucAylar1449: '2027-11-29',
    regaib1449: '2027-12-02',
    mirac1449: '2027-12-24',
  },
  2028: {
    berat1449: '2028-01-11',
    ramazanBaslangic1449: '2028-01-28',
    kadir1449: '2028-02-22',
    ramazanArefesi1449: '2028-02-25',
    ramazanBayrami1449: ['2028-02-26', '2028-02-27', '2028-02-28'],
    kurbanArefesi1449: '2028-05-04',
    kurbanBayrami1449: ['2028-05-05', '2028-05-06', '2028-05-07', '2028-05-08'],
    hicriYilbasi1450: '2028-05-25',
    asure1450: '2028-06-03',
    mevlid1450: '2028-08-02',
    ucAylar1450: '2028-11-18',
    regaib1450: '2028-11-23',
    mirac1450: '2028-12-13',
    berat1450: '2028-12-30',
  },
  2029: {
    ramazanBaslangic1450: '2029-01-16',
    kadir1450: '2029-02-10',
    ramazanArefesi1450: '2029-02-13',
    ramazanBayrami1450: ['2029-02-14', '2029-02-15', '2029-02-16'],
    kurbanArefesi1450: '2029-04-23',
    kurbanBayrami1450: ['2029-04-24', '2029-04-25', '2029-04-26', '2029-04-27'],
    hicriYilbasi1451: '2029-05-14',
    asure1451: '2029-05-23',
    mevlid1451: '2029-07-23',
    ucAylar1451: '2029-11-07',
    regaib1451: '2029-11-08',
    mirac1451: '2029-12-02',
    berat1451: '2029-12-20',
  },
};

export function monthStart(year, month) {
  const yearTable = HIJRI_MONTH_STARTS[year];
  if (!yearTable) return null;
  return yearTable[month] ?? null;
}

/**
 * Ayın gün sayısı: bir sonraki ayın başlangıcından hesaplanır. İki uçtan
 * biri bilinmiyorsa null döner.
 */
export function monthLength(year, month) {
  const start = monthStart(year, month);
  if (!start) return null;

  const monthIndex = HIJRI_MONTHS.indexOf(month);
  if (monthIndex === -1) return null;

  const isLastMonth = monthIndex === HIJRI_MONTHS.length - 1;
  const nextMonth = isLastMonth ? HIJRI_MONTHS[0] : HIJRI_MONTHS[monthIndex + 1];
  const nextYear = isLastMonth ? year + 1 : year;
  const nextStart = monthStart(nextYear, nextMonth);
  if (!nextStart) return null;

  return diffInDays(start, nextStart);
}

/**
 * Hicri {year, month, day} -> miladi 'YYYY-MM-DD'. `night: true` ise Diyanet
 * kandil kuralı uygulanır (start + day - 2); aksi halde gündüz kuralı
 * (start + day - 1). Ay başlangıcı bilinmiyorsa null döner.
 */
export function gregorianForHijri({ year, month, day, night = false }) {
  const start = monthStart(year, month);
  if (!start) return null;

  const offset = night ? day - 2 : day - 1;
  return addDays(start, offset);
}

/** `date`'den itibaren (dahil) verilen haftanın gününe rastlayan ilk tarih. */
export function firstWeekdayOnOrAfter(date, weekday) {
  const target = typeof weekday === 'string' ? WEEKDAYS[weekday] : weekday;
  const current = weekdayOf(date);
  const delta = (target - current + 7) % 7;
  return addDays(date, delta);
}

/** `date`'e kadar (dahil) verilen haftanın gününe rastlayan son tarih. */
export function lastWeekdayOnOrBefore(date, weekday) {
  const target = typeof weekday === 'string' ? WEEKDAYS[weekday] : weekday;
  const current = weekdayOf(date);
  const delta = (current - target + 7) % 7;
  return addDays(date, -delta);
}

/** Bir miladi tarihin, verilen hicri ay içindeki gün numarası (1-based). */
export function dayOfMonthFor(year, month, dateStr) {
  const start = monthStart(year, month);
  if (!start) return null;
  return diffInDays(start, dateStr) + 1;
}

/** '27 Recep 1448' biçiminde etiket (mevcut hijriDate yazımıyla aynı). */
export function hijriDateLabel(year, month, day) {
  const displayName = HIJRI_MONTH_DISPLAY_NAMES[month];
  if (!displayName) {
    throw new Error(`Bilinmeyen hicri ay: ${month}`);
  }
  return `${day} ${displayName} ${year}`;
}

// ---- internal date helpers (UTC-safe, no external deps) ----

function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatISODate(timestamp) {
  const date = new Date(timestamp);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, days) {
  const ms = parseISODate(dateStr) + days * 86_400_000;
  return formatISODate(ms);
}

function diffInDays(fromStr, toStr) {
  return Math.round((parseISODate(toStr) - parseISODate(fromStr)) / 86_400_000);
}

function weekdayOf(dateStr) {
  return new Date(parseISODate(dateStr)).getUTCDay();
}
