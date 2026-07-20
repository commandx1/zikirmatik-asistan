import { keyMap } from './keyMap.mjs';

export const ramazanGirisi = {
  key: 'ramazan-girisi-2026',
  label: {
    tr: 'Ramazan Girişi 2026',
    en: 'Beginning of Ramadan 2026',
  },
  category: 'ibadet',
  description: {
    tr: 'Ramazan ayının ilk günü: 1 Ramazan 1447, 19 Şubat 2026. Hilal duası, oruç niyeti ve hoşgeldin Ramazan.',
    en: 'The first day of the month of Ramadan: 1 Ramadan 1447, 19 February 2026. Supplication for the crescent moon, intention to fast, and welcome to Ramadan.',
  },
  dhikrItems: [
    {
      key: keyMap.HILAL_DUASI,
      nameArabic:
        'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ رَبِّي وَرَبُّكَ اللَّهُ',
      name: {
        tr: 'Ramazan Hilali Duası',
        en: 'Supplication Upon Seeing the Ramadan Crescent',
      },
      transliteration: {
        tr: "Allâhümme ehillehû aleynâ bi'l-yümni ve'l-îmâni ve's-selâmeti ve'l-İslâm. Rabbî ve rabbükellâh.",
        en: "Allahumma ahillahu 'alayna bil-yumni wal-iman, was-salamati wal-Islam. Rabbi wa rabbuk Allah.",
      },
      meaning: {
        tr: "Allah'ım! Bu hilali bize bereket, iman, selâmet ve İslâm üzere doğur. Benim de Rabbin, senin de Rabbin Allah'tır.",
        en: 'O Allah! Bring this crescent upon us with blessing, faith, safety, and Islam. My Lord and your Lord is Allah.',
      },
      virtue: {
        tr: "Talha ibn Ubeydullah radıyallahu anh rivayet etmiştir: Resûlullah (sas) yeni hilali gördüğünde bu duayı okurdu. Dua, hilali yalnızca takvim başlangıcı olarak görmez; onu iman, selâmet ve İslâm üzere başlayan yeni bir kulluk vaktinin işareti hâline getirir. 'Rabbî ve rabbükellâh' cümlesi, hilalin de kulun da aynı Rabbin hükmü altında olduğunu bildirir; bu yüzden Ramazan hilaline bakan mümin, ayı Allah'ın emriyle gelen bir rahmet mevsimi olarak karşılar.",
        en: "Talhah ibn Ubaydullah (may Allah be pleased with him) narrated that the Messenger of Allah (peace be upon him) would recite this supplication when he saw the new crescent. The supplication does not treat the crescent merely as the start of a calendar period; it turns it into the sign of a new time of servitude beginning with faith, safety, and Islam. The phrase 'My Lord and your Lord is Allah' declares that both the crescent and the servant are under the command of the same Lord. For this reason, when a believer sees the crescent of Ramadan, he receives the month as a season of mercy arriving by Allah's command.",
      },
      source: {
        tr: 'Tirmizî, Deavât, 86 (3451); Ahmed, Müsned, 1/162',
        en: 'At-Tirmidhi, Supplications, 86 (3451); Ahmad, Musnad, 1/162',
      },
      tags: ['ramazan', 'hilal', 'dua', 'ay', 'giriş'],
      categories: ['ibadet', 'oruç'],
      timeOfDay: ['aksam'],
      recommendedCount: 7,
      suitableFor: ['herkes', 'oruç tutanlar'],
    },
    {
      key: keyMap.ORUC_NIYETI,
      nameArabic: 'وَبِصَوْمِ غَدٍ نَوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
      name: {
        tr: 'Ramazan Orucu Niyeti',
        en: 'Intention for the Ramadan Fast',
      },
      transliteration: {
        tr: 'Ve bi-savmi ğadin neveytü min şehri Ramadân.',
        en: "Wa bi-sawmi ghadin nawaytu min shahri Ramadan.",
      },
      meaning: {
        tr: 'Ramazan ayından yarınki oruca niyet ettim.',
        en: 'I intend to fast tomorrow as part of the month of Ramadan.',
      },
      virtue: {
        tr: "Ramazan orucunda niyet, orucu sıradan açlık ve susuzluktan ayıran kulluk yönelişidir. Fıkıhta niyetin asıl yeri kalptir; dil ile söylemek ise kalpteki kastı belirginleştiren ve kişiyi sahurdan itibaren ibadet bilincine hazırlayan müstehap bir uygulama olarak görülür. Bu formül hadis lafzı olarak değil, fıkıh geleneğinde Ramazan orucuna niyeti açıkça ifade eden kısa bir niyet cümlesi olarak kullanılır. Her günün orucu ayrı bir ibadet olduğu için niyetin geceleyin veya sahur vaktinde yenilenmesi, kulun Ramazan günlerini bilinçli ve kasıtlı bir ibadet dizisi olarak yaşamasına yardım eder.",
        en: "In the Ramadan fast, intention is the act of worship that distinguishes fasting from mere hunger and thirst. In Islamic jurisprudence, the true place of intention is the heart; pronouncing it with the tongue is treated as a recommended practice that clarifies the heart's resolve and prepares the person for worship from suhur onward. This wording is not presented as the wording of a hadith; rather, it is a concise formula used in the fiqh tradition to express the intention for the Ramadan fast clearly. Since the fast of each day is a separate act of worship, renewing the intention at night or during suhur helps the servant live the days of Ramadan as a deliberate sequence of worship.",
      },
      source: {
        tr: 'Ramazan orucu niyetiyle ilgili fıkıh metinleri; niyet formülü geleneği',
        en: 'Fiqh texts on the intention for the Ramadan fast; traditional intention formula',
      },
      tags: ['ramazan', 'oruç', 'niyet'],
      categories: ['ibadet', 'oruç'],
      timeOfDay: ['gece', 'sabah'],
      recommendedCount: 7,
      suitableFor: ['oruç tutanlar', 'herkes'],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Ramazan Ayı Girişi',
        en: 'Beginning of the Month of Ramadan',
      },
      type: 'özel gün',
      date: '2026-02-19',
      hijriDate: '1 Ramazan 1447',
      description: {
        tr: "Mübarek Ramazan'ın ilk günü. Hilali görünce dua et, oruç niyetini tazele; ilk sahur ve iftarın coşkusuyla tevhid, salavat ve istiğfar.",
        en: "The first day of blessed Ramadan. When you see the crescent moon, make supplication and renew your intention to fast; with the joy of the first suhoor and iftar, perform tawhid, salawat and istighfar.",
      },
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
