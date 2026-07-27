// Sunucudaki special_days koleksiyonundan (isActive) türetilen elle bakımlı liste.
// Yalnızca "başlık" olaylar (kandil, bayram, ay girişi, Kadir, Arefe) gömülür; faz alt-kayıtları hariç.
// Bildirimler tamamen lokal zamanlanır (expo-notifications). Sunucuya/FCM'e bağımlı DEĞİLDİR.
// Kapsam: 2026-08-14 → 2026-12-10. Yeni yıl verisi için bu dosyayı güncelleyin.
// Kandil tarihleri "gece" mantığıyla ARAFE/gece günü olarak saklanır; sabah 09:00 bildirimi o gün gider (ör. Mevlid gecesi 23→24 Ağu → date 2026-08-23).
// `id` alanı sunucudaki `eventKey` ile birebir aynıdır; bildirim tıklaması
// `/special-days/<eventKey>` deep-link'i ile detay ekranını açar.

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
    "id": "hicri-ay-baslangici-rebiulevvel-1448",
    "date": "2026-08-14",
    "type": "özel gün",
    "name": {
      "tr": "Rebiülevvel Ayı Başlangıcı",
      "en": "Beginning of Rabi al-Awwal"
    }
  },
  {
    "id": "mevlid-kandili-2026",
    "date": "2026-08-23",
    "type": "kandil",
    "name": {
      "tr": "Mevlid Kandili",
      "en": "Mawlid al-Nabi"
    }
  },
  {
    "id": "hicri-ay-baslangici-rebiulahir-1448",
    "date": "2026-09-12",
    "type": "özel gün",
    "name": {
      "tr": "Rebiülahir Ayı Başlangıcı",
      "en": "Beginning of Rabi al-Thani"
    }
  },
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
  // 10 Aralık 2026'da iki olay birden var (1 Receb 1448): Üç Aylar'ın
  // başlangıcı ve aynı geceye denk gelen Regaib Kandili. Zamanlayıcı gün
  // başına tek bildirim gönderir ve kandili önceler.
  {
    "id": "uc-aylar-baslangic-2026",
    "date": "2026-12-10",
    "type": "özel gün",
    "name": {
      "tr": "Üç Ayların Başlangıcı",
      "en": "Beginning of the Three Holy Months"
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
  }
] as const;
