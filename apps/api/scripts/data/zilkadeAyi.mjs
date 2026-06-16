import { keyMap } from './keyMap.mjs';

export const zilkadeAyi = {
  key: 'zilkade-ayi-2026',
  label: 'Zilkade Ayı 2026',
  category: 'ibadet',
  description:
    "Dört haram aydan biri olan Zilkade: Hac hazırlığının başladığı, savaşın yasak olduğu mübarek ay. 1 Zilkade 1447, yaklaşık 18 Nisan 2026.",
  dhikrItems: [],
  specialDays: [
    {
      name: 'Zilkade Ayı Girişi',
      type: 'özel gün',
      date: '2026-04-18',
      hijriDate: '1 Zilkade 1447',
      description:
        "Dört haram aydan biri olan Zilkade'nin ilk günü. Hac öncesi manevi hazırlık, tevbe ve istiğfarla girilmesi tavsiye edilen mübarek ay.",
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
