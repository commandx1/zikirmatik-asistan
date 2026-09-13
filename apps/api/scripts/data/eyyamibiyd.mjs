import { keyMap } from './keyMap.mjs';

export const eyyamibiyd = {
  key: 'eyyami-biyd-2026',
  label: {
    tr: 'Eyyâm-ı Biyd 2026–2027',
    en: 'Ayyam al-Bid (the White Days) 2026–2027',
  },
  category: 'ibadet',
  description: {
    tr: 'Her hicri ayın 13, 14 ve 15. günleri olan dolunay günleri. Oruç tutulması ve gece namazı ile ihya edilmesi tavsiye edilmiştir.',
    en: 'The full-moon days that fall on the 13th, 14th, and 15th of every Hijri month. It is recommended to observe them by fasting and by keeping the night alive with prayer.',
  },
  dhikrItems: [
    {
      key: keyMap.TEVHID_SIRK_UZAKLASMA,
      nameArabic:
        'اَللهُ اَللهُ رَبِّي لَا أُشْرِكُ بِهِ شَيْئاً وَلَا أَتَّخِذُ مِنْ دُونِهِ وَلِيّاً',
      name: {
        tr: 'Tevhid ve Şirkten Uzaklaşma Zikri',
        en: 'Dhikr of Tawhid and Distancing from Shirk',
      },
      transliteration: {
        tr: "Allâhu Allâhu Rabbî lâ uşriku bihî şey'en velâ ettehizü min dûnihî veliyyen.",
        en: "Allahu Allahu Rabbi la ushriku bihi shay'an wa la attakhidhu min dunihi waliyyan.",
      },
      meaning: {
        tr: "Benim Rabbim Allah'tır, Allah'tır! O'na hiçbir şeyi ortak koşmam ve O'ndan başka hiçbir veli (dost ve koruyucu) edinmem.",
        en: 'Allah is my Lord, Allah is my Lord! I associate no partner with Him, and I take no protector besides Him.',
      },
      virtue: {
        tr: 'Ruhun tevhid ekseninde sabitlenmesini sağlar, şirkin açık ve gizli her türlüsünden muhafaza eder. Eyyâm-ı Biyd gecelerinde kılınan 12 rekatlık namazın akabinde dörder kez okunması tavsiye edilir.',
        en: "This dhikr anchors the soul firmly upon tawhid and safeguards it from every form of shirk, both apparent and hidden. It is recommended to recite it four times following the twelve-rak'ah prayer performed on the nights of Eyyâm-ı Biyd.",
      },
      source: {
        tr: 'İmam Cafer-i Sâdık rivayeti; Eyyâm-ı Biyd Zikirleri',
        en: "Narrated from Imam Ja'far al-Sadiq; Remembrances of the Days of Illumination",
      },
      tags: ['eyyam-ı biyd', 'tevhid', 'şirkten korunma', 'gece namazı', 'dolunay', 'özel gün', 'eyyâm-ı biyd'],
      categories: ['zikir', 'tevhid', 'özel gün', 'muharrem', 'eyyam-ı biyd', 'oruç', 'safer', 'recep', 'üç aylar', 'şaban', 'ramazan', 'zilkade', 'zilhicce', 'hac'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 4,
      suitableFor: ['tevhid pekiştirme', 'şirkten korunma', 'gece namazı sonrası', 'eyyam-ı biyd', 'eyyâm-ı biyd'],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Muharrem {hijriYear}',
        en: 'Ayyam al-Bid — Muharram {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'muharrem', day: 13 },
      description: {
        tr: 'Muharrem {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Muharram {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-muharrem',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Safer {hijriYear}',
        en: 'Ayyam al-Bid — Safar {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'safer', day: 13 },
      description: {
        tr: 'Safer {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Safar {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-safer',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: "Eyyâm-ı Biyd — Rebîulevvel {hijriYear}",
        en: "Ayyam al-Bid — Rabi al-Awwal {hijriYear}",
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 13 },
      description: {
        tr: "Rebîulevvel {hijriYear} dolunay günleri (13–15). Peygamber Efendimiz'in doğum ayında dolunay.",
        en: "The full-moon days of Rabi al-Awwal {hijriYear} (13–15). The full moon in the month of the Prophet's birth.",
      },
      eventFamily: 'eyyami-biyd-rebiulevvel',
      dayIndex: 13,
      dayCount: 3,
      priority: 145,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.SALAVAT_SERIF,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
      ],
    },
    {
      name: {
        tr: "Eyyâm-ı Biyd — Rebîulahir {hijriYear}",
        en: "Ayyam al-Bid — Rabi al-Thani {hijriYear}",
      },
      type: 'özel gün',
      hijri: { month: 'rebiulahir', day: 13 },
      description: {
        tr: 'Rebîulahir {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Rabi al-Thani {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-rebiulahir',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Cemaziyelevvel {hijriYear}',
        en: 'Ayyam al-Bid — Jumada al-Awwal {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'cemaziyelevvel', day: 13 },
      description: {
        tr: 'Cemaziyelevvel {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Jumada al-Awwal {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-cemaziyelevvel',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Cemaziyülahir {hijriYear}',
        en: 'Ayyam al-Bid — Jumada al-Thani {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'cemaziyelahir', day: 13 },
      description: {
        tr: 'Cemaziyülahir {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Jumada al-Thani {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-cemaziyelahir',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Recep {hijriYear}',
        en: 'Ayyam al-Bid — Rajab {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'recep', day: 13 },
      description: {
        tr: 'Recep {hijriYear} dolunay günleri (13–15). Üç Aylar içinde; oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Rajab {hijriYear} (13–15). Within the Three Holy Months; observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-recep',
      dayIndex: 13,
      dayCount: 3,
      priority: 145,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Şaban {hijriYear}',
        en: "Ayyam al-Bid — Sha'ban {hijriYear}",
      },
      type: 'özel gün',
      hijri: { month: 'saban', day: 13 },
      description: {
        tr: 'Şaban {hijriYear} dolunay günleri (13–15). Üç Aylar içinde; oruç ve gece namazıyla ihya edilir.',
        en: "The full-moon days of Sha'ban {hijriYear} (13–15). Within the Three Holy Months; observed with fasting and night prayer.",
      },
      eventFamily: 'eyyami-biyd-saban',
      dayIndex: 13,
      dayCount: 3,
      priority: 145,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Ramazan {hijriYear}',
        en: 'Ayyam al-Bid — Ramadan {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'ramazan', day: 13 },
      description: {
        tr: 'Ramazan {hijriYear} dolunay günleri (13–15). Ramazan orucu zaten sürmekte; gece namazı ve tesbih ile değerlendirilir.',
        en: 'The full-moon days of Ramadan {hijriYear} (13–15). The Ramadan fast is already ongoing; the days are honored with night prayer and tesbih.',
      },
      eventFamily: 'eyyami-biyd-ramazan',
      dayIndex: 13,
      dayCount: 3,
      priority: 145,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Şevval {hijriYear}',
        en: 'Ayyam al-Bid — Shawwal {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'sevval', day: 13 },
      description: {
        tr: 'Şevval {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Shawwal {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-sevval',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Zilkade {hijriYear}',
        en: "Ayyam al-Bid — Dhul-Qi'dah {hijriYear}",
      },
      type: 'özel gün',
      hijri: { month: 'zilkade', day: 13 },
      description: {
        tr: 'Zilkade {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: "The full-moon days of Dhul-Qi'dah {hijriYear} (13–15). Observed with fasting and night prayer.",
      },
      eventFamily: 'eyyami-biyd-zilkade',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Eyyâm-ı Biyd — Zilhicce {hijriYear}',
        en: 'Ayyam al-Bid — Dhul-Hijjah {hijriYear}',
      },
      type: 'özel gün',
      hijri: { month: 'zilhicce', day: 13 },
      description: {
        tr: 'Zilhicce {hijriYear} dolunay günleri (13–15). Oruç ve gece namazıyla ihya edilir.',
        en: 'The full-moon days of Dhul-Hijjah {hijriYear} (13–15). Observed with fasting and night prayer.',
      },
      eventFamily: 'eyyami-biyd-zilhicce',
      dayIndex: 13,
      dayCount: 3,
      priority: 140,
      dhikrKeys: [
        keyMap.TEVHID_SIRK_UZAKLASMA,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
        keyMap.SALAVAT_SERIF,
      ],
    },
  ],
};
