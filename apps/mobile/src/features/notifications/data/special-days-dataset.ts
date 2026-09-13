// ÜRETİLMİŞ DOSYA — elle düzenlemeyin.
// `pnpm --filter api gen:special-days-mobile` ile yeniden üretin
// (kaynak: apps/api/scripts/gen-special-days-mobile.mjs + SOURCE_DATASETS).
// Tarihler sunucudaki `date` alanıyla BİREBİR aynıdır (Diyanet kuralı: akşamı
// geceyi başlatan gün — kandiller "gece" ilkesiyle hesaplanır; ör. Mevlid
// Kandili 1448 → 2026-08-24).
// Kapsam: 2026-10-12 → 2028-02-26 (üretim penceresi 2026-09-13 → 2028-03-13, 18 ay).
// Üretim tarihi: 2026-09-13.
// `id` alanı sunucudaki `eventKey` ile birebir aynıdır; bildirim tıklaması
// `/special-days/<eventKey>` deep-link'i ile detay ekranını açar. Not: Kurban
// Bayramı arefe günü ve 1. günü AYNI eventKey'i paylaşır (aynı sunucu olayına
// bağlıdır) — bu kasıtlıdır: tüketici (event-notifications.ts) tarihe göre
// gruplar, id'nin dizi genelinde tekil olmasına dayanmaz (bkz.
// scripts/lib/gen-special-days-mobile.test.mjs).

export type LocalizedName = { tr: string; en: string };

export type SpecialDayNotification = {
  /** Kararlı benzersiz anahtar (eventKey). */
  id: string;
  /** ISO tarih "YYYY-MM-DD" (yerel gün). */
  date: string;
  type: "kandil" | "ramazan" | "bayram" | "özel gün";
  name: LocalizedName;
};

export const SPECIAL_DAY_NOTIFICATIONS: readonly SpecialDayNotification[] = [
  {
    "id": "hicri-ay-baslangici-cemaziyelevvel-1448",
    "date": "2026-10-12",
    "type": "özel gün",
    "name": {
      "tr": "Cemaziyelevvel Ayı Başlangıcı",
      "en": "Beginning of Jumada al-Ula"
    }
  },
  {
    "id": "hicri-ay-baslangici-cemaziyelahir-1448",
    "date": "2026-11-10",
    "type": "özel gün",
    "name": {
      "tr": "Cemaziyelahir Ayı Başlangıcı",
      "en": "Beginning of Jumada al-Akhira"
    }
  },
  {
    "id": "regaib-kandili-2026",
    "date": "2026-12-10",
    "type": "kandil",
    "name": {
      "tr": "Regaib Kandili",
      "en": "Laylat al-Ragha'ib"
    }
  },
  {
    "id": "uc-aylar-baslangic-2026",
    "date": "2026-12-10",
    "type": "özel gün",
    "name": {
      "tr": "Üç Ayların Başlangıcı (1 Recep)",
      "en": "The Beginning of the Three Holy Months (1 Rajab)"
    }
  },
  {
    "id": "mirac-kandili-1448",
    "date": "2027-01-04",
    "type": "kandil",
    "name": {
      "tr": "Miraç Kandili",
      "en": "Laylat al-Mi'raj"
    }
  },
  {
    "id": "berat-kandili-1448",
    "date": "2027-01-22",
    "type": "kandil",
    "name": {
      "tr": "Berat Kandili",
      "en": "Laylat al-Bara'ah"
    }
  },
  {
    "id": "ramazan-girisi-1448",
    "date": "2027-02-08",
    "type": "özel gün",
    "name": {
      "tr": "Ramazan Ayı Girişi",
      "en": "Beginning of the Month of Ramadan"
    }
  },
  {
    "id": "kadir-gecesi-1448",
    "date": "2027-03-05",
    "type": "kandil",
    "name": {
      "tr": "Kadir Gecesi",
      "en": "Laylat al-Qadr"
    }
  },
  {
    "id": "ramazan-bayrami-1448",
    "date": "2027-03-09",
    "type": "bayram",
    "name": {
      "tr": "Ramazan Bayramı 1. Gün",
      "en": "Eid al-Fitr Day 1"
    }
  },
  {
    "id": "zilkade-ayi-1448",
    "date": "2027-04-08",
    "type": "özel gün",
    "name": {
      "tr": "Zilkade Ayı Girişi",
      "en": "Beginning of the Month of Dhu al-Qi'dah"
    }
  },
  {
    "id": "zilhicce-ilk-on-1448",
    "date": "2027-05-07",
    "type": "özel gün",
    "name": {
      "tr": "1 Zilhicce",
      "en": "1 Dhu al-Hijjah"
    }
  },
  {
    "id": "kurban-bayrami-1448",
    "date": "2027-05-15",
    "type": "özel gün",
    "name": {
      "tr": "Kurban Bayramı Arefe Günü",
      "en": "Eid al-Adha Day of Arafah"
    }
  },
  {
    "id": "kurban-bayrami-1448",
    "date": "2027-05-16",
    "type": "bayram",
    "name": {
      "tr": "Kurban Bayramı",
      "en": "Eid al-Adha"
    }
  },
  {
    "id": "muharrem-ilk-on-1449",
    "date": "2027-06-06",
    "type": "özel gün",
    "name": {
      "tr": "Hicri Yılbaşı",
      "en": "Hijri New Year"
    }
  },
  {
    "id": "muharrem-ilk-on-1449",
    "date": "2027-06-15",
    "type": "özel gün",
    "name": {
      "tr": "10 Muharrem (Aşure)",
      "en": "10 Muharram (Ashura)"
    }
  },
  {
    "id": "hicri-ay-baslangici-rebiulevvel-1449",
    "date": "2027-08-03",
    "type": "özel gün",
    "name": {
      "tr": "Rebiülevvel Ayı Başlangıcı",
      "en": "Beginning of Rabi al-Awwal"
    }
  },
  {
    "id": "mevlid-kandili-1449",
    "date": "2027-08-13",
    "type": "kandil",
    "name": {
      "tr": "Mevlid Kandili",
      "en": "Mawlid al-Nabi"
    }
  },
  {
    "id": "hicri-ay-baslangici-rebiulahir-1449",
    "date": "2027-09-02",
    "type": "özel gün",
    "name": {
      "tr": "Rebiülahir Ayı Başlangıcı",
      "en": "Beginning of Rabi al-Akhir"
    }
  },
  {
    "id": "hicri-ay-baslangici-cemaziyelevvel-1449",
    "date": "2027-10-01",
    "type": "özel gün",
    "name": {
      "tr": "Cemaziyelevvel Ayı Başlangıcı",
      "en": "Beginning of Jumada al-Ula"
    }
  },
  {
    "id": "hicri-ay-baslangici-cemaziyelahir-1449",
    "date": "2027-10-31",
    "type": "özel gün",
    "name": {
      "tr": "Cemaziyelahir Ayı Başlangıcı",
      "en": "Beginning of Jumada al-Akhira"
    }
  },
  {
    "id": "uc-aylar-baslangic-1449",
    "date": "2027-11-29",
    "type": "özel gün",
    "name": {
      "tr": "Üç Ayların Başlangıcı (1 Recep)",
      "en": "The Beginning of the Three Holy Months (1 Rajab)"
    }
  },
  {
    "id": "regaib-kandili-1449",
    "date": "2027-12-02",
    "type": "kandil",
    "name": {
      "tr": "Regaib Kandili",
      "en": "Laylat al-Ragha'ib"
    }
  },
  {
    "id": "mirac-kandili-1449",
    "date": "2027-12-24",
    "type": "kandil",
    "name": {
      "tr": "Miraç Kandili",
      "en": "Laylat al-Mi'raj"
    }
  },
  {
    "id": "berat-kandili-1449",
    "date": "2028-01-11",
    "type": "kandil",
    "name": {
      "tr": "Berat Kandili",
      "en": "Laylat al-Bara'ah"
    }
  },
  {
    "id": "ramazan-girisi-1449",
    "date": "2028-01-28",
    "type": "özel gün",
    "name": {
      "tr": "Ramazan Ayı Girişi",
      "en": "Beginning of the Month of Ramadan"
    }
  },
  {
    "id": "kadir-gecesi-1449",
    "date": "2028-02-22",
    "type": "kandil",
    "name": {
      "tr": "Kadir Gecesi",
      "en": "Laylat al-Qadr"
    }
  },
  {
    "id": "ramazan-bayrami-1449",
    "date": "2028-02-26",
    "type": "bayram",
    "name": {
      "tr": "Ramazan Bayramı 1. Gün",
      "en": "Eid al-Fitr Day 1"
    }
  }
] as const;
