import { keyMap } from './keyMap.mjs';

export const ucAylarBaslangic = {
  key: 'uc-aylar-baslangic-2025',
  label: 'Üç Aylar Başlangıcı 2025',
  category: 'ibadet',
  description:
    "Recep, Şaban ve Ramazan'dan oluşan Üç Aylar'ın başlangıcı: 1 Recep 1447, 21 Aralık 2025.",
  dhikrItems: [],
  specialDays: [
    {
      name: 'Üç Ayların Başlangıcı (1 Recep)',
      type: 'özel gün',
      date: '2025-12-21',
      hijriDate: '1 Recep 1447',
      description:
        "Allah'ın ayı Recep'in ilk günü ve Üç Aylar'ın kapısı. Peygamber Efendimiz bu günde Recep-Şaban-Ramazan duasını okur, mübarek aylara bereketli bir başlangıç niyetiyle girerdi.",
      eventKey: 'uc-aylar-baslangic-2025',
      priority: 155,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
        keyMap.ESTAGFIRULLAH,
      ],
    },
  ],
};
