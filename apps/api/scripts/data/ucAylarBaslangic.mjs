import { keyMap } from './keyMap.mjs';

export const ucAylarBaslangic = {
  key: 'uc-aylar-baslangic-2025',
  label: {
    tr: 'Üç Aylar Başlangıcı 2025',
    en: 'Beginning of the Three Holy Months 2025',
  },
  category: 'ibadet',
  description: {
    tr: "Recep, Şaban ve Ramazan'dan oluşan Üç Aylar'ın başlangıcı: 1 Recep 1447, 21 Aralık 2025.",
    en: "The beginning of the Three Holy Months—comprising Rajab, Sha'ban, and Ramadan: 1 Rajab 1447, 21 December 2025.",
  },
  dhikrItems: [],
  specialDays: [
    {
      name: {
        tr: 'Üç Ayların Başlangıcı (1 Recep)',
        en: 'The Beginning of the Three Holy Months (1 Rajab)',
      },
      type: 'özel gün',
      date: '2025-12-21',
      hijriDate: '1 Recep 1447',
      description: {
        tr: "Allah'ın ayı Recep'in ilk günü ve Üç Aylar'ın kapısı. Peygamber Efendimiz bu günde Recep-Şaban-Ramazan duasını okur, mübarek aylara bereketli bir başlangıç niyetiyle girerdi.",
        en: "The first day of Rajab, the month of Allah, and the gateway to the Three Holy Months. On this day the Prophet (peace be upon him) would recite the supplication of Rajab, Sha'ban, and Ramadan, entering these blessed months with the intention of a bountiful beginning.",
      },
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
