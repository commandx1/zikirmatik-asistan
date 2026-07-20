import { keyMap } from './keyMap.mjs';

export const zilkadeAyi = {
  key: 'zilkade-ayi-2026',
  label: {
    tr: 'Zilkade Ayı 2026',
    en: "Month of Dhu al-Qi'dah 2026",
  },
  category: 'ibadet',
  description: {
    tr: "Dört haram aydan biri olan Zilkade: Hac hazırlığının başladığı, savaşın yasak olduğu mübarek ay. 1 Zilkade 1447, yaklaşık 18 Nisan 2026.",
    en: "Dhu al-Qi'dah, one of the four sacred months: a blessed month in which the preparation for Hajj begins and warfare is forbidden. 1 Dhu al-Qi'dah 1447, approximately 18 April 2026.",
  },
  dhikrItems: [],
  specialDays: [
    {
      name: {
        tr: 'Zilkade Ayı Girişi',
        en: "Beginning of the Month of Dhu al-Qi'dah",
      },
      type: 'özel gün',
      date: '2026-04-18',
      hijriDate: '1 Zilkade 1447',
      description: {
        tr: "Dört haram aydan biri olan Zilkade'nin ilk günü. Hac öncesi manevi hazırlık, tevbe ve istiğfarla girilmesi tavsiye edilen mübarek ay.",
        en: "The first day of Dhu al-Qi'dah, one of the four sacred months. A blessed month recommended to be entered with spiritual preparation before Hajj, repentance, and seeking forgiveness (istighfar).",
      },
      eventKey: 'zilkade-ayi-2026',
      priority: 145,
      dhikrKeys: [
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
        keyMap.TEVHID,
        keyMap.ESTAGFIRULLAH,
      ],
    },
  ],
};
