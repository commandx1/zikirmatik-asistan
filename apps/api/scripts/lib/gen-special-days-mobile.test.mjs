import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MOBILE_HEADLINE_RULES,
  isMobileHeadlineRecord,
  selectMobileHeadlineRecords,
  istanbulTodayIso,
  addMonthsIso,
  filterWithinWindow,
  sortByDate,
  toMobileNotification,
  findSameIdSameDateDuplicates,
  selectMobileNotifications
} from "./gen-special-days-mobile.mjs";

function record(overrides) {
  return {
    eventKey: "test-2026",
    eventFamily: "test-family",
    type: "özel gün",
    date: "2026-01-01",
    hijriDate: "1 Muharrem 1448",
    name: { tr: "Test", en: "Test" },
    ...overrides
  };
}

// -- isMobileHeadlineRecord / selectMobileHeadlineRecords -------------------

test("isMobileHeadlineRecord: her zaman başlık olan aileler her zaman true döner", () => {
  for (const family of MOBILE_HEADLINE_RULES.alwaysFamilies) {
    assert.equal(isMobileHeadlineRecord(record({ eventFamily: family })), true, family);
  }
});

test("isMobileHeadlineRecord: hicri-ay-baslangici-<ay> öneki her zaman başlık", () => {
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "hicri-ay-baslangici-rebiulevvel" })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "hicri-ay-baslangici-safer" })), true);
});

test("isMobileHeadlineRecord: dayIndex kurallı aileler yalnız belirtilen günlerde true", () => {
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "ramazan-bayrami", dayIndex: 1 })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "ramazan-bayrami", dayIndex: 2 })), false);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "ramazan-bayrami", dayIndex: 3 })), false);

  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "muharrem-ilk-on", dayIndex: 1 })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "muharrem-ilk-on", dayIndex: 10 })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "muharrem-ilk-on", dayIndex: 5 })), false);

  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "zilhicce-ilk-on", dayIndex: 1 })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "zilhicce-ilk-on", dayIndex: 2 })), false);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "zilhicce-ilk-on", dayIndex: 8 })), false);
});

test("isMobileHeadlineRecord: kurban-bayrami arefe (dayIndex yok) ve 1. gün başlık, sonraki günler değil", () => {
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "kurban-bayrami", dayIndex: undefined })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "kurban-bayrami", dayIndex: 1 })), true);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "kurban-bayrami", dayIndex: 2 })), false);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "kurban-bayrami", dayIndex: 3 })), false);
  assert.equal(isMobileHeadlineRecord(record({ eventFamily: "kurban-bayrami", dayIndex: 4 })), false);
});

test("isMobileHeadlineRecord: allowlist dışı aileler (Eyyâm-ı Biyd, Mevlid Haftası, Recep/Şaban/Safer fazları, Ramazan günleri) HARİÇ", () => {
  const excludedFamilies = [
    "eyyami-biyd-muharrem",
    "eyyami-biyd-ramazan",
    "mevlid-haftasi",
    "recep-ayi",
    "saban-ayi",
    "safer-ayi",
    "ramazan-gunleri"
  ];
  for (const family of excludedFamilies) {
    assert.equal(isMobileHeadlineRecord(record({ eventFamily: family, dayIndex: 1 })), false, family);
    assert.equal(isMobileHeadlineRecord(record({ eventFamily: family })), false, family);
  }
});

test("selectMobileHeadlineRecords: sadece allowlist'e uyan kayıtları döner, pencere dışı/aile dışı kayıt yok", () => {
  const records = [
    record({ eventFamily: "mevlid-kandili", eventKey: "mevlid-kandili-2026" }),
    record({ eventFamily: "recep-ayi", dayIndex: 1, eventKey: "recep-ayi-2026" }),
    record({ eventFamily: "ramazan-bayrami", dayIndex: 2, eventKey: "ramazan-bayrami-2026" }),
    record({ eventFamily: "ramazan-bayrami", dayIndex: 1, eventKey: "ramazan-bayrami-2026" })
  ];
  const selected = selectMobileHeadlineRecords(records);
  assert.deepEqual(
    selected.map((r) => r.eventKey),
    ["mevlid-kandili-2026", "ramazan-bayrami-2026"]
  );
});

// -- pencere / sıralama / dönüştürme ----------------------------------------

test("istanbulTodayIso: UTC gece yarısına yakın anları İstanbul (UTC+3) gününe çevirir", () => {
  // 2026-09-13 23:30 UTC -> İstanbul'da 2026-09-14 02:30.
  assert.equal(istanbulTodayIso(new Date("2026-09-13T23:30:00Z")), "2026-09-14");
  // 2026-09-13 06:00 UTC -> İstanbul'da 2026-09-13 09:00.
  assert.equal(istanbulTodayIso(new Date("2026-09-13T06:00:00Z")), "2026-09-13");
});

test("addMonthsIso: takvim ayı ekler, yıl sınırını doğru taşırır", () => {
  assert.equal(addMonthsIso("2026-09-13", 18), "2028-03-13");
  assert.equal(addMonthsIso("2026-12-10", 1), "2027-01-10");
});

test("filterWithinWindow: [fromIso, toIso) yarı-açık aralık dışındaki kayıtları eler", () => {
  const records = [
    record({ date: "2026-09-12" }), // pencereden önce
    record({ date: "2026-09-13" }), // dahil (from)
    record({ date: "2027-06-01" }),
    record({ date: "2028-03-13" }), // dahil DEĞİL (to hariç)
    record({ date: "2028-03-12" })
  ];
  const windowed = filterWithinWindow(records, { fromIso: "2026-09-13", toIso: "2028-03-13" });
  assert.deepEqual(
    windowed.map((r) => r.date),
    ["2026-09-13", "2027-06-01", "2028-03-12"]
  );
});

test("sortByDate: tarihe göre artan sıralar, eşit tarihte eventKey'e göre deterministik", () => {
  const records = [
    record({ date: "2026-12-10", eventKey: "b" }),
    record({ date: "2026-01-01", eventKey: "z" }),
    record({ date: "2026-12-10", eventKey: "a" })
  ];
  const sorted = sortByDate(records);
  assert.deepEqual(
    sorted.map((r) => [r.date, r.eventKey]),
    [
      ["2026-01-01", "z"],
      ["2026-12-10", "a"],
      ["2026-12-10", "b"]
    ]
  );
  // Girdi dizisi mutasyona uğramadı.
  assert.equal(records[0].eventKey, "b");
});

test("toMobileNotification: id=eventKey, sadece id/date/type/name alanları", () => {
  const notification = toMobileNotification(
    record({ eventKey: "mevlid-kandili-2026", date: "2026-08-24", type: "kandil", name: { tr: "Mevlid Kandili", en: "Mawlid al-Nabi" } })
  );
  assert.deepEqual(notification, {
    id: "mevlid-kandili-2026",
    date: "2026-08-24",
    type: "kandil",
    name: { tr: "Mevlid Kandili", en: "Mawlid al-Nabi" }
  });
});

// -- id çakışması: kurban-bayrami arefe + 1. gün AYNI eventKey, FARKLI tarih --

test("findSameIdSameDateDuplicates: aynı id farklı tarihte SORUN DEĞİL (kurban arefe + 1. gün senaryosu)", () => {
  const notifications = [
    { id: "kurban-bayrami-2027", date: "2027-05-15" },
    { id: "kurban-bayrami-2027", date: "2027-05-16" }
  ];
  assert.deepEqual(findSameIdSameDateDuplicates(notifications), []);
});

test("findSameIdSameDateDuplicates: aynı id + AYNI tarih gerçek kopya olarak yakalanır", () => {
  const notifications = [
    { id: "x-2026", date: "2026-01-01" },
    { id: "x-2026", date: "2026-01-01" }
  ];
  assert.deepEqual(findSameIdSameDateDuplicates(notifications), ["x-2026|2026-01-01"]);
});

// -- uçtan uca ----------------------------------------------------------------

test("selectMobileNotifications: allowlist + pencere + sıralama + dönüştürmeyi birlikte uygular", () => {
  const now = new Date("2026-09-13T06:00:00Z");
  const expandedRecords = [
    record({ eventFamily: "mevlid-kandili", eventKey: "mevlid-kandili-2026", date: "2026-08-24" }), // geçmiş -> pencere dışı
    record({ eventFamily: "regaib-kandili", eventKey: "regaib-kandili-2026", date: "2026-12-10", type: "kandil", name: { tr: "Regaib Kandili", en: "Laylat al-Ragha'ib" } }),
    record({ eventFamily: "mirac-kandili", eventKey: "mirac-kandili-1448", date: "2027-01-04", type: "kandil", name: { tr: "Miraç Kandili", en: "Laylat al-Mi'raj" } }),
    record({ eventFamily: "ramazan-gunleri", eventKey: "ramazan-gunleri-2027", dayIndex: 1, date: "2027-02-09" }), // aile allowlist dışı
    record({ eventFamily: "kurban-bayrami", eventKey: "kurban-bayrami-1448", date: "2027-05-15" }), // arefe
    record({ eventFamily: "kurban-bayrami", eventKey: "kurban-bayrami-1448", dayIndex: 1, date: "2027-05-16" }) // 1. gün, aynı eventKey
  ];

  const { notifications, fromIso, toIso } = selectMobileNotifications(expandedRecords, { now, windowMonths: 18 });

  assert.equal(fromIso, "2026-09-13");
  assert.equal(toIso, "2028-03-13");
  assert.deepEqual(
    notifications.map((n) => n.id),
    ["regaib-kandili-2026", "mirac-kandili-1448", "kurban-bayrami-1448", "kurban-bayrami-1448"]
  );
  assert.deepEqual(
    notifications.map((n) => n.date),
    ["2026-12-10", "2027-01-04", "2027-05-15", "2027-05-16"]
  );
  // Bilinçli "aynı id, farklı tarih" durumu: gerçek kopya değil.
  assert.deepEqual(findSameIdSameDateDuplicates(notifications), []);
});
