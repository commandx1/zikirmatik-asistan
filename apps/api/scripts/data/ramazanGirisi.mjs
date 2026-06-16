import { keyMap } from './keyMap.mjs';

export const ramazanGirisi = {
  key: 'ramazan-girisi-2026',
  label: 'Ramazan Girişi 2026',
  category: 'ibadet',
  description:
    'Ramazan ayının ilk günü: 1 Ramazan 1447, 19 Şubat 2026. Hilal duası, oruç niyeti ve hoşgeldin Ramazan.',
  dhikrItems: [
    {
      key: keyMap.HILAL_DUASI,
      nameArabic:
        'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ رَبِّي وَرَبُّكَ اللَّهُ',
      nameTurkish: 'Ramazan Hilali Duası',
      transliteration:
        "Allahümme ehillehû aleynâ bi'l-yümni ve'l-îmân ve's-selâmeti ve'l-islâm. Rabbî ve Rabbükallâh.",
      meaning:
        "Allah'ım! Bu hilali bize uğur, iman, selamet ve İslam üzere doğur. Ey hilal! Benim de Rabbim, senin de Rabbin Allah'tır.",
      virtue:
        "Peygamber Efendimiz (s.a.v.) yeni ayı gördüğünde bu duayı okurdu. Ramazan hilalini görünce okunması hadisle sabit olup manevi güvenlik, sarsılmaz iman ve ruhsal selamet için okunur.",
      source: 'Tirmizî, Deavât, 50; İbn Hanbel, Müsned, 1/162',
      tags: ['ramazan', 'hilal', 'dua', 'ay', 'giriş'],
      categories: ['ibadet', 'oruç'],
      timeOfDay: ['aksam'],
      recommendedCount: 7,
      suitableFor: ['herkes', 'oruç tutanlar'],
    },
    {
      key: keyMap.ORUC_NIYETI,
      nameArabic: 'وَبِصَوْمِ غَدٍ نَوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
      nameTurkish: 'Ramazan Orucu Niyeti',
      transliteration: 'Ve bisavmi ğadin neveytü min şehri ramazân',
      meaning: "Ramazan ayının yarınki orucuna niyetlendim.",
      virtue:
        "Orucun sahih olması için niyet şarttır. Her Ramazan günü sahur vaktinde veya bir önceki gece yatmadan önce okunur. Niyetin kalple yapılması farz, dil ile söylenmesi müstehaptır.",
      source: 'İslam fıkhı niyet formülü; Yeni Şafak fıkıh nakilleri',
      tags: ['ramazan', 'oruç', 'niyet'],
      categories: ['ibadet', 'oruç'],
      timeOfDay: ['gece', 'sabah'],
      recommendedCount: 7,
      suitableFor: ['oruç tutanlar', 'herkes'],
    },
  ],
  specialDays: [
    {
      name: 'Ramazan Ayı Girişi',
      type: 'özel gün',
      date: '2026-02-19',
      hijriDate: '1 Ramazan 1447',
      description:
        "Mübarek Ramazan'ın ilk günü. Hilali görünce dua et, oruç niyetini tazele; ilk sahur ve iftarın coşkusuyla tevhid, salavat ve istiğfar.",
      eventKey: 'ramazan-girisi-2026',
      priority: 175,
      dhikrKeys: [
        keyMap.HILAL_DUASI,
        keyMap.ORUC_NIYETI,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
      ],
    },
  ],
};
