// OTOMATIK ÜRETİLDİ — sunucudaki special_days koleksiyonundan (isActive) türetildi.
// Yalnızca "başlık" olaylar (kandil, bayram, ay girişi, Kadir, Arefe) gömülür; faz alt-kayıtları hariç.
// Bildirimler tamamen lokal zamanlanır (expo-notifications). Sunucuya/FCM'e bağımlı DEĞİLDİR.
// Kapsam: 2026-08-23 → 2026-12-10. Yeni yıl verisi için bu dosyayı güncelleyin.
// Kandil tarihleri "gece" mantığıyla ARAFE/gece günü olarak saklanır; sabah 09:00 bildirimi o gün gider (ör. Mevlid gecesi 23→24 Ağu → date 2026-08-23).

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
    "id": "mevlid-kandili-2026",
    "date": "2026-08-23",
    "type": "kandil",
    "name": {
      "tr": "Mevlid Kandili",
      "en": "Mawlid al-Nabi"
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
