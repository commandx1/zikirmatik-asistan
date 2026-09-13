import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HIJRI_MONTHS,
  HIJRI_MONTH_STARTS,
  OFFICIAL_DIYANET_DATES,
  monthStart,
  monthLength,
  gregorianForHijri,
  firstWeekdayOnOrAfter,
  lastWeekdayOnOrBefore,
  dayOfMonthFor,
  hijriDateLabel,
} from '../data/hijri-calendar.mjs';

test('monthStart: bilinen ay için tarih, bilinmeyen yıl/ay için null', () => {
  assert.equal(monthStart(1448, 'muharrem'), '2026-06-16');
  assert.equal(monthStart(1447, 'safer'), '2025-07-26');
  assert.equal(monthStart(1451, 'ramazan'), null);
  assert.equal(monthStart(9999, 'muharrem'), null);
});

test('monthLength: ardışık ay başlangıcından hesaplanır, sınırda yıl atlar', () => {
  assert.equal(monthLength(1448, 'safer'), 30); // safer 07-15 -> rebiulevvel 08-14
  assert.equal(monthLength(1447, 'zilkade'), 30); // zilkade 04-18 -> zilhicce 05-18
  // zilhicce -> ertesi hicri yılın muharremi (yıl sınırı geçişi)
  assert.equal(monthLength(1447, 'zilhicce'), diffDays('2026-05-18', '2026-06-16'));
});

test('monthLength: bilinmeyen ay başlangıcı varsa null', () => {
  assert.equal(monthLength(1451, 'saban'), null); // ramazan 1451 (sonraki ay) null
  assert.equal(monthLength(1451, 'zilhicce'), null); // hem zilhicce 1451 hem muharrem 1452 null
});

test('monthLength: hicri yıl sınırını geçen ay uzunluğu da hesaplanır', () => {
  // zilhicce 1450 -> muharrem 1451 (ertesi hicri yıl) tanımlı, null DEĞİL.
  assert.equal(monthLength(1450, 'zilhicce'), diffDays('2029-04-15', '2029-05-14'));
});

test('gregorianForHijri: gündüz formülü (start + day - 1)', () => {
  assert.equal(
    gregorianForHijri({ year: 1447, month: 'ramazan', day: 1, night: false }),
    '2026-02-19',
  );
  assert.equal(
    gregorianForHijri({ year: 1447, month: 'zilhicce', day: 9, night: false }),
    '2026-05-26',
  );
});

test('gregorianForHijri: gece formülü (start + day - 2, kandil)', () => {
  assert.equal(
    gregorianForHijri({ year: 1447, month: 'recep', day: 27, night: true }),
    '2026-01-15',
  ); // Miraç 1447
  assert.equal(
    gregorianForHijri({ year: 1447, month: 'saban', day: 15, night: true }),
    '2026-02-02',
  ); // Berat 1447
  assert.equal(
    gregorianForHijri({ year: 1447, month: 'ramazan', day: 27, night: true }),
    '2026-03-16',
  ); // Kadir 1447
});

test('gregorianForHijri: ay başlangıcı bilinmiyorsa null', () => {
  assert.equal(gregorianForHijri({ year: 1451, month: 'ramazan', day: 1 }), null);
});

test('firstWeekdayOnOrAfter: başlangıç zaten o gün ise kendisi döner', () => {
  // Recep 1448 başlangıcı (2026-12-10) zaten Perşembe -> Regaib o gün.
  assert.equal(firstWeekdayOnOrAfter('2026-12-10', 'thursday'), '2026-12-10');
});

test('firstWeekdayOnOrAfter: ileri sarar (Regaib 1447)', () => {
  // Recep 1447 başlangıcı 2025-12-21 (Pazar) -> ilk Perşembe 2025-12-25.
  assert.equal(firstWeekdayOnOrAfter('2025-12-21', 'thursday'), '2025-12-25');
});

test('lastWeekdayOnOrBefore: ay sonuna kadar geriye sarar (Safer son Çarşamba)', () => {
  // Safer 1448: başlangıç 2026-07-15 (Çarşamba), 30 gün -> ay sonu 2026-08-13
  // (Perşembe). Son Çarşamba bu yüzden ay sonundan bir gün önce, 2026-08-12
  // (mevcut saferAyi.mjs verisiyle birebir aynı).
  const start = monthStart(1448, 'safer');
  const length = monthLength(1448, 'safer');
  assert.equal(length, 30);
  const monthEnd = addDays(start, length - 1);
  assert.equal(monthEnd, '2026-08-13');
  assert.equal(lastWeekdayOnOrBefore(monthEnd, 'wednesday'), '2026-08-12');
});

test('dayOfMonthFor: miladi tarihten hicri gün numarasını geri hesaplar', () => {
  assert.equal(dayOfMonthFor(1447, 'recep', '2025-12-21'), 1);
  assert.equal(dayOfMonthFor(1447, 'recep', '2026-01-15'), 26); // Miraç gecesi miladi karşılığı
});

test('hijriDateLabel: mevcut hijriDate yazımıyla aynı biçim', () => {
  assert.equal(hijriDateLabel(1447, 'recep', 27), '27 Recep 1447');
  assert.equal(hijriDateLabel(1448, 'rebiulevvel', 11), '11 Rebiülevvel 1448');
  assert.equal(hijriDateLabel(1447, 'zilhicce', 9), '9 Zilhicce 1447');
});

test('hijriDateLabel: bilinmeyen ay anahtarı hata fırlatır', () => {
  assert.throws(() => hijriDateLabel(1447, 'nisan', 1));
});

// ---- OFFICIAL_DIYANET_DATES ile birebir doğrulama (Diyanet resmi listeleri) ----

test('OFFICIAL_DIYANET_DATES 2025 (hicri 1447 başlangıç olayları)', () => {
  assert.equal(gregorianForHijri({ year: 1447, month: 'muharrem', day: 1 }), '2025-06-26');
  assert.equal(gregorianForHijri({ year: 1447, month: 'muharrem', day: 10 }), '2025-07-05');
  assert.equal(
    gregorianForHijri({ year: 1447, month: 'rebiulevvel', day: 11, night: false }),
    '2025-09-03',
  );
  assert.equal(gregorianForHijri({ year: 1447, month: 'recep', day: 1 }), '2025-12-21');
  assert.equal(firstWeekdayOnOrAfter(monthStart(1447, 'recep'), 'thursday'), '2025-12-25');
});

test('OFFICIAL_DIYANET_DATES 2026/2027 (hicri 1447/1448 kandil + bayram)', () => {
  assert.equal(gregorianForHijri({ year: 1447, month: 'recep', day: 27, night: true }), '2026-01-15');
  assert.equal(gregorianForHijri({ year: 1447, month: 'saban', day: 15, night: true }), '2026-02-02');
  assert.equal(gregorianForHijri({ year: 1447, month: 'ramazan', day: 1 }), '2026-02-19');
  assert.equal(gregorianForHijri({ year: 1447, month: 'ramazan', day: 27, night: true }), '2026-03-16');
  assert.equal(gregorianForHijri({ year: 1447, month: 'sevval', day: 1 }), '2026-03-20');
  assert.equal(gregorianForHijri({ year: 1447, month: 'sevval', day: 3 }), '2026-03-22');
  assert.equal(gregorianForHijri({ year: 1447, month: 'zilhicce', day: 9 }), '2026-05-26');
  assert.equal(gregorianForHijri({ year: 1447, month: 'zilhicce', day: 13 }), '2026-05-30');
  assert.equal(gregorianForHijri({ year: 1448, month: 'muharrem', day: 1 }), '2026-06-16');
  assert.equal(gregorianForHijri({ year: 1448, month: 'muharrem', day: 10 }), '2026-06-25');
  assert.equal(
    gregorianForHijri({ year: 1448, month: 'rebiulevvel', day: 11, night: false }),
    '2026-08-24',
  ); // Mevlid — Diyanet istisnası, gündüz formülü
  assert.equal(gregorianForHijri({ year: 1448, month: 'recep', day: 1 }), '2026-12-10');
  assert.equal(firstWeekdayOnOrAfter(monthStart(1448, 'recep'), 'thursday'), '2026-12-10');
});

test('OFFICIAL_DIYANET_DATES 2027/2028 (hicri 1448/1449)', () => {
  assert.equal(gregorianForHijri({ year: 1448, month: 'recep', day: 27, night: true }), '2027-01-04');
  assert.equal(gregorianForHijri({ year: 1448, month: 'saban', day: 15, night: true }), '2027-01-22');
  assert.equal(gregorianForHijri({ year: 1448, month: 'ramazan', day: 1 }), '2027-02-08');
  assert.equal(gregorianForHijri({ year: 1448, month: 'ramazan', day: 27, night: true }), '2027-03-05');
  assert.equal(gregorianForHijri({ year: 1448, month: 'ramazan', day: 29 }), '2027-03-08');
  assert.equal(gregorianForHijri({ year: 1448, month: 'sevval', day: 1 }), '2027-03-09');
  assert.equal(gregorianForHijri({ year: 1448, month: 'zilhicce', day: 9 }), '2027-05-15');
  assert.equal(gregorianForHijri({ year: 1448, month: 'zilhicce', day: 13 }), '2027-05-19');
  assert.equal(gregorianForHijri({ year: 1449, month: 'muharrem', day: 1 }), '2027-06-06');
  assert.equal(gregorianForHijri({ year: 1449, month: 'muharrem', day: 10 }), '2027-06-15');
  assert.equal(
    gregorianForHijri({ year: 1449, month: 'rebiulevvel', day: 11, night: false }),
    '2027-08-13',
  );
  assert.equal(gregorianForHijri({ year: 1449, month: 'recep', day: 1 }), '2027-11-29');
  assert.equal(firstWeekdayOnOrAfter(monthStart(1449, 'recep'), 'thursday'), '2027-12-02');
  assert.equal(gregorianForHijri({ year: 1449, month: 'recep', day: 27, night: true }), '2027-12-24');
});

test('OFFICIAL_DIYANET_DATES 2028/2029 (hicri 1449/1450)', () => {
  assert.equal(gregorianForHijri({ year: 1449, month: 'saban', day: 15, night: true }), '2028-01-11');
  assert.equal(gregorianForHijri({ year: 1449, month: 'ramazan', day: 1 }), '2028-01-28');
  assert.equal(gregorianForHijri({ year: 1449, month: 'ramazan', day: 27, night: true }), '2028-02-22');
  assert.equal(gregorianForHijri({ year: 1449, month: 'ramazan', day: 29 }), '2028-02-25');
  assert.equal(gregorianForHijri({ year: 1449, month: 'sevval', day: 1 }), '2028-02-26');
  assert.equal(gregorianForHijri({ year: 1449, month: 'zilhicce', day: 9 }), '2028-05-04');
  assert.equal(gregorianForHijri({ year: 1449, month: 'zilhicce', day: 13 }), '2028-05-08');
  assert.equal(gregorianForHijri({ year: 1450, month: 'muharrem', day: 1 }), '2028-05-25');
  assert.equal(gregorianForHijri({ year: 1450, month: 'muharrem', day: 10 }), '2028-06-03');
  assert.equal(
    gregorianForHijri({ year: 1450, month: 'rebiulevvel', day: 11, night: false }),
    '2028-08-02',
  );
  assert.equal(gregorianForHijri({ year: 1450, month: 'recep', day: 1 }), '2028-11-18');
  assert.equal(firstWeekdayOnOrAfter(monthStart(1450, 'recep'), 'thursday'), '2028-11-23');
  assert.equal(gregorianForHijri({ year: 1450, month: 'recep', day: 27, night: true }), '2028-12-13');
  assert.equal(gregorianForHijri({ year: 1450, month: 'saban', day: 15, night: true }), '2028-12-30');
});

test('OFFICIAL_DIYANET_DATES 2029 (hicri 1450/1451)', () => {
  assert.equal(gregorianForHijri({ year: 1450, month: 'ramazan', day: 1 }), '2029-01-16');
  assert.equal(gregorianForHijri({ year: 1450, month: 'ramazan', day: 27, night: true }), '2029-02-10');
  assert.equal(gregorianForHijri({ year: 1450, month: 'ramazan', day: 29 }), '2029-02-13');
  assert.equal(gregorianForHijri({ year: 1450, month: 'sevval', day: 1 }), '2029-02-14');
  assert.equal(gregorianForHijri({ year: 1450, month: 'zilhicce', day: 9 }), '2029-04-23');
  assert.equal(gregorianForHijri({ year: 1450, month: 'zilhicce', day: 13 }), '2029-04-27');
  assert.equal(gregorianForHijri({ year: 1451, month: 'muharrem', day: 1 }), '2029-05-14');
  assert.equal(gregorianForHijri({ year: 1451, month: 'muharrem', day: 10 }), '2029-05-23');
  assert.equal(
    gregorianForHijri({ year: 1451, month: 'rebiulevvel', day: 11, night: false }),
    '2029-07-23',
  );
  assert.equal(gregorianForHijri({ year: 1451, month: 'recep', day: 1 }), '2029-11-07');
  assert.equal(firstWeekdayOnOrAfter(monthStart(1451, 'recep'), 'thursday'), '2029-11-08');
  assert.equal(gregorianForHijri({ year: 1451, month: 'recep', day: 27, night: true }), '2029-12-02');
  assert.equal(gregorianForHijri({ year: 1451, month: 'saban', day: 15, night: true }), '2029-12-20');
});

test('OFFICIAL_DIYANET_DATES tablosu ile HIJRI_MONTHS/HIJRI_MONTH_STARTS iç bütünlüğü', () => {
  // Her tanımlı yılın her ayı, HIJRI_MONTHS listesindeki 12 anahtardan biri olmalı.
  for (const [, months] of Object.entries(HIJRI_MONTH_STARTS)) {
    for (const key of Object.keys(months)) {
      if (key === 'sources') continue;
      assert.ok(HIJRI_MONTHS.includes(key), `bilinmeyen ay anahtarı: ${key}`);
    }
  }
  assert.ok(Object.keys(OFFICIAL_DIYANET_DATES).length >= 5);
});

// ---- Kapsama testi: takvim tablosu her zaman en az 180 gün ileriye bakmalı ----

test('kapsama: en son bilinen ay başlangıcı bugünden en az 180 gün ileride olmalı', () => {
  const todayIstanbul = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  // 'en-CA' -> 'YYYY-MM-DD'

  let latest = null;
  for (const months of Object.values(HIJRI_MONTH_STARTS)) {
    for (const [month, value] of Object.entries(months)) {
      if (month === 'sources' || !value) continue;
      if (!latest || value > latest) latest = value;
    }
  }

  assert.ok(latest, 'HIJRI_MONTH_STARTS tablosunda hiç tarih yok');

  const daysAhead = diffDays(todayIstanbul, latest);
  assert.ok(
    daysAhead >= 180,
    `hijri-calendar.mjs'e yeni hicri yıl ekleyin (Diyanet listesi: bkz. dosya başı kaynak notu). ` +
      `En son bilinen ay başlangıcı (${latest}) bugünden (${todayIstanbul}) yalnızca ${daysAhead} gün ileride (gerekli: >=180).`,
  );
});

// ---- helpers (test-only, mirrors internal date math for setup convenience) ----

function diffDays(fromStr, toStr) {
  const from = Date.parse(`${fromStr}T00:00:00Z`);
  const to = Date.parse(`${toStr}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

function addDays(dateStr, days) {
  const ms = Date.parse(`${dateStr}T00:00:00Z`) + days * 86_400_000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
