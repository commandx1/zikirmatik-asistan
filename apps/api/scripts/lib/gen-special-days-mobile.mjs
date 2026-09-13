/**
 * Mobil uygulamanın `special-days-dataset.ts` dosyasını üretmek için saf
 * (yan etkisiz) seçim/pencere/sıralama fonksiyonları. DB bağlantısı YOK,
 * dosya sistemi erişimi YOK — sadece zaten açılmış (expandSpecialDays
 * çıktısı) kayıtlar üzerinde çalışır. Dosya yazma ve CLI mantığı
 * `../gen-special-days-mobile.mjs`'dedir; bu modül `test:scripts`
 * (`scripts/lib/*.test.mjs`) glob'una uyacak şekilde burada tutulur.
 *
 * "Başlık" (mobilde gömülü, bildirim gönderilen) olay ailelerinin allowlist'i:
 * tüm kandiller, ramazan-girisi, ramazan-bayrami/kurban-bayrami'nın bayram
 * başlangıç günleri, ay girişleri (hicri-ay-baslangici-*, zilkade-ayi,
 * uc-aylar-baslangic), muharrem-ilk-on'un yılbaşı/aşure günleri,
 * zilhicce-ilk-on'un 1. günü.
 * Eyyâm-ı Biyd, Mevlid Haftası, Recep/Şaban/Safer fazları (alt-kayıt adları
 * bildirim başlığı olarak uygun değil, örn. "Şaban Ayı Girişi — 1. Faz
 * (Latîf)") ve Ramazan günleri (ramazan-gunleri) kasıtlı olarak HARİÇ (fazla
 * bildirim / gürültü + faz adları başlık niteliğinde değil).
 */

const HICRI_AY_BASLANGICI_PREFIX = "hicri-ay-baslangici-";

const ALWAYS_HEADLINE_FAMILIES = new Set([
  "regaib-kandili",
  "mirac-kandili",
  "berat-kandili",
  "mevlid-kandili",
  "kadir-gecesi",
  "ramazan-girisi",
  "uc-aylar-baslangic",
  "zilkade-ayi"
]);

const DAY_INDEX_HEADLINE_RULES = {
  "ramazan-bayrami": (dayIndex) => dayIndex === 1,
  // Arefe günü dayIndex taşımaz (bkz. kurban-bayrami-2026.mjs) — o yüzden
  // hem "dayIndex yok" hem "dayIndex === 1" başlık sayılır. Not: arefe ve
  // 1. gün AYNI eventKey'i paylaşır (bkz. resolveEventKey/eventFamily) —
  // bu kasıtlı bir "aynı id, farklı tarih" durumudur, dosyanın başındaki
  // yorumda ve testlerde belgelenmiştir.
  "kurban-bayrami": (dayIndex) => dayIndex === undefined || dayIndex === 1,
  "muharrem-ilk-on": (dayIndex) => dayIndex === 1 || dayIndex === 10,
  "zilhicce-ilk-on": (dayIndex) => dayIndex === 1
};

export const MOBILE_HEADLINE_RULES = Object.freeze({
  alwaysFamilies: Object.freeze([...ALWAYS_HEADLINE_FAMILIES]),
  dayIndexFamilies: Object.freeze({ ...DAY_INDEX_HEADLINE_RULES }),
  hicriAyBaslangiciPrefix: HICRI_AY_BASLANGICI_PREFIX
});

/** Açılmış (expandSpecialDays çıktısı) bir kaydın mobil "başlık" bildirimi olup olmadığı. */
export function isMobileHeadlineRecord(record) {
  if (record.eventFamily.startsWith(HICRI_AY_BASLANGICI_PREFIX)) {
    return true;
  }
  if (ALWAYS_HEADLINE_FAMILIES.has(record.eventFamily)) {
    return true;
  }
  const dayIndexRule = DAY_INDEX_HEADLINE_RULES[record.eventFamily];
  return typeof dayIndexRule === "function" ? dayIndexRule(record.dayIndex) : false;
}

export function selectMobileHeadlineRecords(expandedRecords) {
  return expandedRecords.filter(isMobileHeadlineRecord);
}

/** now (UTC Date) -> Europe/Istanbul'daki (UTC+3, DST yok) o günün "YYYY-MM-DD" tarihi. */
export function istanbulTodayIso(now = new Date()) {
  const shifted = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" tarihine takvim ayı ekler (gün taşması Date.UTC tarafından normalize edilir). */
export function addMonthsIso(dateIso, months) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1 + months, day));
  return dt.toISOString().slice(0, 10);
}

/** [fromIso, toIso) yarı-açık pencere (ISO string karşılaştırması — YYYY-MM-DD için güvenli). */
export function filterWithinWindow(records, { fromIso, toIso }) {
  return records.filter((record) => record.date >= fromIso && record.date < toIso);
}

/** Tarihe göre artan sıralar; eşit tarihte eventKey'e göre deterministik ikincil sıralama. */
export function sortByDate(records) {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? -1 : 1;
    }
    if (a.eventKey === b.eventKey) {
      return 0;
    }
    return a.eventKey < b.eventKey ? -1 : 1;
  });
}

/** Açılmış bir kaydı mobil `SpecialDayNotification` şekline indirger. */
export function toMobileNotification(record) {
  return {
    id: record.eventKey,
    date: record.date,
    type: record.type,
    name: { tr: record.name.tr, en: record.name.en }
  };
}

/**
 * Aynı `id` FARKLI tarihlerde tekrar edebilir (örn. Kurban Bayramı arefe
 * günü + 1. günü aynı eventKey'i paylaşır — bkz. DAY_INDEX_HEADLINE_RULES
 * yorumu) — bu kasıtlıdır; tüketici (event-notifications.ts'teki
 * selectUpcomingSpecialDays) tarihe göre gruplar, id'nin dizi genelinde
 * tekil olmasına dayanmaz. Bu fonksiyon SADECE gerçek bir hata biçimini
 * yakalar: aynı id + aynı tarih (gerçek kopya kayıt).
 */
export function findSameIdSameDateDuplicates(notifications) {
  const seen = new Set();
  const duplicates = [];
  for (const notification of notifications) {
    const key = `${notification.id}|${notification.date}`;
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  }
  return duplicates;
}

/**
 * Uçtan uca seçim: başlık filtresi + [now, now+windowMonths) penceresi +
 * tarih sıralaması + mobil şekle indirgeme. `expandedRecords`,
 * `expandSpecialDays(templates).expanded` çıktısıdır (bkz.
 * gen-special-days-mobile.mjs betiği) — bu fonksiyon DB'ye veya dosya
 * sistemine dokunmaz.
 */
export function selectMobileNotifications(expandedRecords, { now = new Date(), windowMonths = 18 } = {}) {
  const fromIso = istanbulTodayIso(now);
  const toIso = addMonthsIso(fromIso, windowMonths);
  const headline = selectMobileHeadlineRecords(expandedRecords);
  const windowed = filterWithinWindow(headline, { fromIso, toIso });
  const sorted = sortByDate(windowed);
  const notifications = sorted.map(toMobileNotification);
  return { notifications, fromIso, toIso };
}
