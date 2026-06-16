import { keyMap } from './keyMap.mjs';

export const sabanAyi = {
  key: 'saban-ayi-2026',
  label: 'Şaban Ayı 2026',
  category: 'ibadet',
  description:
    "Peygamber Efendimiz'in 'Benim ayım' dediği Şaban: üç onar günlük faz (Latîf→Rezzâk→Azîz esması), Berat Gecesi hazırlığı ve Ramazan'a köprü.",
  dhikrItems: [
    {
      key: keyMap.YA_LATIF,
      nameArabic: 'سُبْحَانَ اللَّهِ اللَّطِيفِ جَلَّ شَأْنُهُ',
      nameTurkish: "Subhânallâhi'l-Latîf — Şaban 1-10. Günler Zikirı",
      transliteration: "Subhânallâhi'l-Latîf Celle şanüh (veya: Yâ Latîf)",
      meaning:
        "Kullarına karşı sonsuz lütufkâr olan Allah'ı noksan sıfatlardan tenzih ederim. O'nun şanı yücedir.",
      virtue:
        "Şaban ayının 1-10. günleri arası her gün 100 defa çekilir. Kalbi yumuşatır, ruhu huzura kavuşturur ve ilahi rahmete yakınlaştırır.",
      source: 'Şaban-ı Şerif Risalesi; Lalegül Dergisi',
      tags: ['şaban', 'esma', 'zikir', 'latif', 'lütuf'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.YA_REZZAK,
      nameArabic: 'سُبْحَانَ اللَّهِ الرَّزَّاقِ جَلَّ شَأْنُهُ',
      nameTurkish: "Subhânallâhi'r-Razzâk — Şaban 11-20. Günler Zikirı",
      transliteration: "Subhânallâhi'r-Razzâk Celle şanüh (veya: Yâ Rezzâk)",
      meaning:
        "Bütün canlılara bolca maddi ve manevi rızık ihsan eden Allah'ı noksan sıfatlardan tenzih ederim.",
      virtue:
        "Şaban ayının 11-20. günleri arası her gün 100 defa çekilir. Maddi-manevi rızık kapılarını açar ve marifetullahı kalpte besler.",
      source: 'Şaban-ı Şerif Risalesi; İDDEF Tesbihatı',
      tags: ['şaban', 'esma', 'zikir', 'rezzak', 'rızık'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.YA_AZIZ,
      nameArabic: 'سُبْحَانَ اللَّهِ الْعَزِيزِ جَلَّ شَأْنُهُ',
      nameTurkish: "Subhânallâhi'l-Azîz — Şaban 21-30. Günler Zikirı",
      transliteration: "Subhânallâhi'l-Azîz Celle şanüh (veya: Yâ Azîz)",
      meaning:
        "Hiçbir zaman mağlup edilemeyen, yegâne güç sahibi olan Allah'ı noksan sıfatlardan tenzih ederim.",
      virtue:
        "Şaban ayının 21-30. günleri arası her gün 100 defa çekilir. Manevi gücü artırır, nefis mücadelesinde ilahi desteği celbeder.",
      source: 'Şaban-ı Şerif Risalesi; Lalegül Dergisi',
      tags: ['şaban', 'esma', 'zikir', 'aziz', 'güç'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.KAMIL_LUTF,
      nameArabic:
        'اللَّهُمَّ يَا كَامِلَ اللُّطْفِ يَا خَفِيَّ الدَّفْعِ تَدَارَكْنِي بِلُطْفِكَ الْخَفِيِّ وَارْحَمْنِي وَأَهْلِي وَالْمُؤْمِنِينَ تَحْتَ سُرَادِقَاتِ عِزِّكَ',
      nameTurkish: 'Allâhümme Yâ Kâmilel Lutf — Şaban Esma Sonrası Münacaat',
      transliteration:
        "Allâhümme yâ kâmilel lutf! Yâ Hafiyyel-dâf! Tedâraknî bi lutfikel hafiyyi verhamnî ve ehlî vel mü'minîne tehte surâdigâti izzîke",
      meaning:
        "Ey lütfu tam olan Allah'ım! Ey gizli belalary defeden! Gizli lütfunla beni tamamla; beni, ailemi ve müminleri izzetinin perdeleri altında esirge.",
      virtue:
        "Şaban ayındaki on günlük zikirlerin (Latif, Rezzak, Aziz) her 100 tekrarının sonunda 1 kez okunması halinde hacetlerin kabulüne vesile olur.",
      source: 'Şaban-ı Şerif Risalesi',
      tags: ['şaban', 'münacaat', 'dua', 'lütuf'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 1,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.SABAN_SALAVATI,
      nameArabic:
        'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ فِي الْأَرْوَاحِ وَصَلِّ عَلَى جَسَدِ مُحَمَّدٍ فِي الْأَجْسَادِ وَصَلِّ عَلَى قَبْرِ مُحَمَّدٍ فِي الْقُبُورِ',
      nameTurkish: 'Şaban Salavat-ı Şerifi — Ruh, Ceset ve Kabir Salavat',
      transliteration:
        'Allahümme salli alâ Muhammedin fil-ervâh. Ve salli alâ cesedi Muhammedin fil-ecsâd. Ve salli alâ kabri Muhammedin fil-kubûr.',
      meaning:
        "Allah'ım! Ruhlar arasında Hz. Muhammed'in ruhuna, bedenler arasında O'nun bedenine, kabirler arasında O'nun kabrine salat eyle.",
      virtue:
        "Şaban ayının 27. gecesi kılınan iki rekatlık namazın ardından 100 defa okunur. Nebevi şefaate doğrudan ulaştırdığı belirtilen hususi salavattır.",
      source: 'Şaban-ı Şerif Risalesi',
      tags: ['şaban', 'salavat', '27. gece', 'şefaat'],
      categories: ['salavat', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
  ],
  specialDays: [
    {
      name: 'Şaban Ayı Girişi — 1. Faz (Latîf)',
      type: 'özel gün',
      date: '2026-01-20',
      hijriDate: '1 Şaban 1447',
      description:
        "Peygamber Efendimiz'in 'Şaban benim ayımdır' buyurduğu mübarek ayın başlangıcı. İlk on günde Yâ Latîf esmasıyla kalbi yumuşat, üç aylar duasını çok oku.",
      eventKey: 'saban-ayi-2026',
      dayIndex: 1,
      dayCount: 30,
      priority: 150,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.YA_LATIF,
        keyMap.KAMIL_LUTF,
        keyMap.SALAVAT_SERIF,
        keyMap.ISTIGFAR,
      ],
    },
    {
      name: 'Şaban 11. Gün — 2. Faz (Rezzâk)',
      type: 'özel gün',
      date: '2026-01-30',
      hijriDate: '11 Şaban 1447',
      description:
        "Şaban'ın ikinci on günlük faz başlangıcı. Nefis mücadelesi ve kararlılık dönemi. Yâ Rezzâk ile maddi-manevi rızık kapılarını aç.",
      eventKey: 'saban-ayi-2026',
      dayIndex: 11,
      dayCount: 30,
      priority: 148,
      dhikrKeys: [
        keyMap.YA_REZZAK,
        keyMap.KAMIL_LUTF,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.ESTAGFIRULLAH,
      ],
    },
    {
      name: 'Şaban 21. Gün — 3. Faz (Azîz)',
      type: 'özel gün',
      date: '2026-02-09',
      hijriDate: '21 Şaban 1447',
      description:
        "Şaban'ın son on günü: doğrudan Ramazan'ın eşiği. Yâ Azîz ile manevi gücü pekiştir; 27. gece özel salavat oku, Berat Gecesi'nde kazanılanı tamamla.",
      eventKey: 'saban-ayi-2026',
      dayIndex: 21,
      dayCount: 30,
      priority: 155,
      dhikrKeys: [
        keyMap.YA_AZIZ,
        keyMap.SABAN_SALAVATI,
        keyMap.KAMIL_LUTF,
        keyMap.KADIR_DUASI,
        keyMap.ISTIGFAR,
      ],
    },
  ],
};
