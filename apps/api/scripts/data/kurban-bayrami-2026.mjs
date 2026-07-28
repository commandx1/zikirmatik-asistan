import { keyMap } from './keyMap.mjs'

export const kurbanBayrami = {
  key: 'kurban-bayrami-2026',
  label: {
    tr: 'Kurban Bayramı 2026',
    en: 'Eid al-Adha 2026',
  },
  category: 'ibadet',
  description: {
    tr: 'Kurban Bayramı\'na ait tekbir ve özel dualar.',
    en: 'The takbirs and special supplications of Eid al-Adha.',
  },
  dhikrItems: [
    {
      key: keyMap.TESRIK_TEKBIRI,
      nameArabic:
        'اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ لاَ إِلٰهَ إِلاَّ اللّٰهُ وَاللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ وَلِلّٰهِ الْحَمْدُ',
      name: {
        tr: 'Teşrik Tekbiri',
        en: 'Takbir of the Days of Tashriq',
      },
      transliteration: {
        tr: 'Allâhu ekber Allâhu ekber. Lâ ilâhe illallâhu vallâhu ekber. Allâhu ekber ve lillâhil-hamd.',
        en: 'Allahu akbar, Allahu akbar. La ilaha illallahu wallahu akbar. Allahu akbar wa lillahil-hamd.',
      },
      meaning: {
        tr: "Allah en büyüktür, Allah en büyüktür. Allah'tan başka ilah yoktur. Allah en büyüktür. Hamd Allah'adır.",
        en: 'Allah is the Greatest, Allah is the Greatest. There is no deity but Allah, and Allah is the Greatest. Allah is the Greatest, and to Allah belongs all praise.',
      },
      virtue: {
        tr: "Abdullah b. Mesud, İbn Ömer ve İbn Abbas radıyallahu anhüm gibi sahabilerin Arefe sabahından Teşrik günlerinin sonuna kadar farz namazların ardından bu tekbiri getirdikleri nakledilmiştir. Tekbir getirmek, Kur'an'da geçen 'Allah'ı sayılı günlerde anın' (Bakara 2:203) emrinin bir tatbikidir ve bayram günlerinde Allah'ın büyüklüğünü ilan ederek şükür ve tevhid bilincini canlı tutar.",
        en: "It is reported that Companions such as Abdullah ibn Mas'ud, Ibn Umar, and Ibn Abbas (may Allah be pleased with them) recited this takbir after every obligatory prayer from the morning of Arafah until the end of the Days of Tashriq. Reciting it fulfils the Quranic command to 'remember Allah during the appointed days' (Al-Baqarah 2:203) and keeps the awareness of Allah's greatness and gratitude alive throughout the days of Eid.",
      },
      source: {
        tr: "Buhârî, Îdeyn, 11 (muallak rivayet); İbn Ebî Şeybe, el-Musannef, 2/165",
        en: 'Sahih al-Bukhari, Two Eids, 11 (mu`allaq narration); Ibn Abi Shaybah, Al-Musannaf, 2/165',
      },
      tags: ['kurban bayramı', 'tesrik', 'tekbir', 'gönle huzur', 'kalbe sevinç', 'ilahî şükür', 'bayram', 'eid al-fitr', 'eid al-adha'],
      categories: ['özel gün', 'bayram', 'ramazan', 'oruç'],
      timeOfDay: 'any',
      recommendedCount: 23,
      suitableFor: ['bayram günleri', 'cemaat sonrası zikir', '', 'eid al-fitr', 'eid al-adha', 'kurban bayramı', 'ramazan bayramı'],
    },
    {
      key: keyMap.SUBHANALLAHI_VE_BIHAMDIHI,
      nameArabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ',
      name: {
        tr: 'Tesbih Zikri',
        en: 'Tasbih of Glorification and Praise',
      },
      transliteration: {
        tr: 'Sübhânallâhi ve bi-hamdihî.',
        en: "Subhanallahi wa bihamdihi.",
      },
      meaning: {
        tr: "Allah'ı noksan sıfatlardan tenzih eder, O'na hamd ederim.",
        en: 'Glory be to Allah and praise be to Him.',
      },
      virtue: {
        tr: "Ebû Hüreyre radıyallahu anh, Resûlullah'ın (sas) şöyle buyurduğunu rivayet etmiştir: 'İki kelime vardır ki dile hafif, mizanda ağır, Rahmân'a sevimlidir: Sübhânallâhi ve bi-hamdihî, Sübhânallâhi'l-azîm.' Yine aynı sahabiden nakledilen bir başka hadiste Resûlullah (sas): 'Kim günde yüz kere Sübhânallâhi ve bi-hamdihî derse, günahları deniz köpüğü kadar çok olsa bile bağışlanır' buyurmuştur. Bayram sabahı bu tesbihle Allah'a şükretmek, kalbi arındırır ve nimetin sahibini hatırlatır.",
        en: "Abu Hurairah (may Allah be pleased with him) narrated that the Messenger of Allah (peace be upon him) said: 'There are two phrases that are light on the tongue, heavy on the scale, and beloved to the Most Merciful: Subhanallahi wa bihamdihi, Subhanallahil-azim.' The same Companion also narrated that the Prophet (peace be upon him) said: 'Whoever says Subhanallahi wa bihamdihi one hundred times a day will have his sins forgiven, even if they were as much as the foam of the sea.' Reciting this tasbih on the morning of Eid purifies the heart and recalls the Giver of every blessing.",
      },
      source: {
        tr: "Buhârî, Deavât, 65 (6406) ve 64 (6405); Müslim, Zikr, 30 (2694) ve 28-29 (2691)",
        en: 'Sahih al-Bukhari, Supplications, 65 (6406) and 64 (6405); Sahih Muslim, Dhikr, 30 (2694) and 28-29 (2691)',
      },
      tags: ['kurban bayramı', 'tesbih', 'hastalıktan korunma', 'rızık ve bereket', 'korku ve vesvese tedavisi', 'bayram', 'özel gün', 'eid al-fitr', 'eid al-adha', 'rebiülahir ayı başlangıcı', 'beginning of rabi al-akhir', 'beginning of jumada al-ula', 'cemaziyelevvel ayı başlangıcı'],
      categories: ['özel gün', 'bayram', 'ramazan', 'oruç'],
      timeOfDay: 'morning',
      recommendedCount: 300,
      suitableFor: ['bayram sabahı', 'tesbihat', 'allah sevgisi', 'günahların bağışlanması', 'eid al-fitr', 'eid al-adha', 'kurban bayramı', 'ramazan bayramı', 'rebiülahir ayı başlangıcı', 'beginning of rabi al-akhir', 'beginning of jumada al-ula', 'cemaziyelevvel ayı başlangıcı'],
    },
    {
      key: keyMap.ESTAGFIRULLAH,
      nameArabic: 'أَسْتَغْفِرُ اللّٰهَ',
      name: {
        tr: 'Estağfirullâh',
        en: 'Astaghfirullah',
      },
      transliteration: {
        tr: 'Estağfirullâh.',
        en: 'Astaghfirullah.',
      },
      meaning: {
        tr: "Allah'tan bağışlanma dilerim.",
        en: 'I seek forgiveness from Allah.',
      },
      virtue: {
        tr: "Ebû Hüreyre radıyallahu anh'ten rivayet edildiğine göre Resûlullah (sas): 'Vallahi ben günde yetmiş defadan fazla Allah'a istiğfar eder ve tevbe ederim' buyurmuştur. Yine İbn Ömer radıyallahu anhümâ, bir mecliste Resûlullah'ın (sas) yüz defadan fazla 'Rabbiğfirlî ve tüb aleyye, inneke ente't-tevvâbü'r-rahîm' dediğini saydıklarını nakletmiştir. Bayram günlerinde istiğfar, ibadetlerdeki eksiklikleri telafi eder ve kalpte tevbe bilincini tazeler.",
        en: "It was narrated from Abu Hurairah (may Allah be pleased with him) that the Messenger of Allah (peace be upon him) said: 'By Allah, I seek Allah's forgiveness and turn to Him in repentance more than seventy times a day.' Ibn Umar (may Allah be pleased with him) also reported that they used to count the Prophet (peace be upon him) saying, in a single gathering, more than a hundred times: 'My Lord, forgive me and accept my repentance, for You are the Ever-Relenting, the Most Merciful.' Seeking forgiveness during the days of Eid makes up for shortcomings in worship and renews the heart's awareness of repentance.",
      },
      source: {
        tr: "Buhârî, Deavât, 3 (6307); Ebû Dâvûd, Vitir, 26 (1516); Tirmizî, Deavât, 38 (3434)",
        en: 'Sahih al-Bukhari, Supplications, 3 (6307); Abu Dawood, Witr, 26 (1516); At-Tirmidhi, Supplications, 38 (3434)',
      },
      tags: ['kurban bayramı', 'istiğfar', 'tevbe', 'şaban', 'bayram', "sha'ban", 'ramazan', 'ramadan', 'özel gün', 'eid al-fitr', 'eid al-adha', 'hicri yılbaşı', 'hijri new year', 'zilkade ayı girişi', 'üç ayların başlangıcı', 'rebiülahir ayı başlangıcı', 'rebiülevvel ayı başlangıcı', 'beginning of rabi al-awwal', 'beginning of rabi al-akhir', 'cemaziyelahir ayı başlangıcı', 'beginning of jumada al-akhira', 'the beginning of the three holy months', "beginning of the month of dhu al-qi'dah"],
      categories: ['özel gün', 'bayram', 'recep', 'üç aylar', 'şaban', 'ramazan', 'oruç', 'zilkade', 'muharrem'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['bayram günü', 'tevbe', 'günahların bağışlanması', 'şaban', "sha'ban", 'ramazan', 'ramadan', 'eid al-fitr', 'eid al-adha', 'hicri yılbaşı', 'kurban bayramı', 'hijri new year', 'zilkade ayı girişi', 'üç ayların başlangıcı', 'rebiülahir ayı başlangıcı', 'rebiülevvel ayı başlangıcı', 'beginning of rabi al-awwal', 'beginning of rabi al-akhir', 'cemaziyelahir ayı başlangıcı', 'beginning of jumada al-akhira', 'the beginning of the three holy months', "beginning of the month of dhu al-qi'dah"],
    },
    {
      key: keyMap.KURBAN_SUKRU_DUASI,
      nameArabic:
        'اللّٰهُمَّ لَكَ الْحَمْدُ كُلُّهُ وَلَكَ الشُّكْرُ كُلُّهُ وَإِلَيْكَ يُرْجَعُ الْأَمْرُ كُلُّهُ',
      name: {
        tr: 'Şükür Duası',
        en: 'Supplication of Gratitude',
      },
      transliteration: {
        tr: 'Allâhümme lekel-hamdü küllühû ve lekeş-şükrü küllühû ve ileyke yürceul-emru küllühû.',
        en: "Allahumma lakal-hamdu kulluhu wa lakash-shukru kulluhu wa ilayka yurja'ul-amru kulluhu.",
      },
      meaning: {
        tr: "Allah'ım, hamdin bütünü Sana aittir, şükrün bütünü Sana aittir, bütün işler Sana döner.",
        en: 'O Allah, to You belongs all praise, to You belongs all thanks, and to You all matters return.',
      },
      virtue: {
        tr: "Kurban ibadeti, Hz. İbrahim (a.s.) ile oğlu Hz. İsmail (a.s.)'ın Allah'a teslimiyetinin hatırasıdır. Kesim sonrasında bu şükür duasıyla nimetin ve emrin gerçek sahibinin Allah olduğu tekrar edilir; kurbanın etinden, kanından değil, sahibindeki takvadan Allah'a ulaşacağı (Hac 22:37) hatırlanarak ibadet şükür ve teslimiyet boyutuyla tamamlanır.",
        en: "The sacrifice of Eid al-Adha commemorates the submission of Prophet Ibrahim (peace be upon him) and his son Prophet Isma'il (peace be upon him) to Allah. After the sacrifice, this supplication of gratitude affirms that Allah alone is the true owner of every blessing and every affair; it recalls that it is not the flesh or blood of the sacrifice that reaches Allah, but the piety of the one who offers it (Al-Hajj 22:37), completing the act of worship with gratitude and submission.",
      },
      source: {
        tr: "Kur'an-ı Kerim, Hac 22:37; Kurban ibadeti sonrası şükür duaları geleneği",
        en: 'Quran, Surah Al-Hajj 22:37; traditional supplications of gratitude recited after the sacrifice',
      },
      tags: ['kurban bayramı', 'şükür', 'dua', 'bayram', 'eid al-adha'],
      categories: ['özel gün', 'bayram'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['kurban kesimi sonrası', 'şükür', 'hamd', 'eid al-adha', 'kurban bayramı'],
    },
    {
      key: keyMap.HASBIYE_ZIKRI_100,
      nameArabic: 'حَسْبِيَ اللّٰهُ وَنِعْمَ الْوَكِيلُ',
      name: {
        tr: 'Hasbiye Zikri',
        en: 'Dhikr of Sufficiency',
      },
      transliteration: {
        tr: "Hasbiyallâhu ve ni'mel-vekîl.",
        en: "Hasbiyallahu wa ni'mal-wakil.",
      },
      meaning: {
        tr: 'Allah bana yeter, O ne güzel vekildir.',
        en: 'Allah is sufficient for me, and He is the best Disposer of affairs.',
      },
      virtue: {
        tr: "İbn Abbas radıyallahu anhümâ'dan nakledildiğine göre Resûlullah (sas) şöyle buyurmuştur: 'Hasbunallâhu ve ni'mel-vekîl sözünü İbrahim (a.s.) ateşe atıldığında söylemiştir; Muhammed (sas) de düşmanları kendisine karşı toplandığında bu sözü söylemiştir.' Bu zikir, Kur'an'da Âl-i İmrân 3:173'te de yer alır ve tevekkülün en özlü ifadesidir; zorluk ve endişe anlarında kalbi Allah'a bağlayarak güven ve dinginlik verir.",
        en: "It was narrated from Ibn Abbas (may Allah be pleased with them both) that the Messenger of Allah (peace be upon him) said: 'Ibrahim (peace be upon him) said hasbunallahu wa ni'mal-wakil when he was thrown into the fire, and Muhammad (peace be upon him) said it when his enemies gathered against him.' This dhikr also appears in the Quran, Surah Aal-i-Imran 3:173, and is the most concise expression of trust in Allah; in moments of hardship and anxiety it anchors the heart to Allah, bringing security and calm.",
      },
      source: {
        tr: "Buhârî, Tefsîr, Âl-i İmrân, 13 (4563); Kur'an-ı Kerim, Âl-i İmrân 3:173",
        en: "Sahih al-Bukhari, Tafsir, Aal-i-Imran, 13 (4563); Quran, Surah Aal-i-Imran 3:173",
      },
      tags: ['kurban bayramı', 'tevekkül', 'hasbiye', 'bayram', 'eid al-adha'],
      categories: ['özel gün', 'bayram'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['gün boyu', 'zorlanma anları', 'tevekkül', 'endişe anları', 'eid al-adha', 'kurban bayramı'],
    },
    {
      key: keyMap.HASBIYE,
      nameArabic:
        'حَسْبِيَ اللّٰهُ وَكَفَى سَمِعَ اللّٰهُ لِمَنْ دَعَا لَيْسَ وَرَاءَ اللّٰهِ مُنْتَهَى',
      name: {
        tr: 'Tevekkül ve Hasbiye Zikri',
        en: 'Dhikr of Trust and Sufficiency',
      },
      transliteration: {
        tr: 'Hasbiyallâhu ve kefâ. Semiallâhu limen deâ. Leyse verâ-allâhi müntehâ.',
        en: "Hasbiyallahu wa kafa. Sami'allahu liman da'a. Laysa wara'allahi muntaha.",
      },
      meaning: {
        tr: "Allah bana yeter ve kâfidir. Allah dua edeni işitir. Allah'tan öte varılacak bir son yoktur.",
        en: 'Allah is sufficient for me, and He suffices. Allah hears whoever calls upon Him. There is no destination beyond Allah.',
      },
      virtue: {
        tr: "Bu zikir, dua ve tevekkül mecmûalarında nakledilen, Hasbiye zikrinin genişletilmiş bir şeklidir; hadis lafzı olmaktan çok, önceki âlimlerin tevekkül ve teslimiyeti pekiştirmek için tavsiye ettiği bir virddir. Bayram günlerinde tekrarlanması, kulun her işinde son mercinin Allah olduğunu hatırlatarak kalpte emniyet ve teslimiyet hissini derinleştirir.",
        en: "This dhikr is an expanded form of the sufficiency formula found in supplication and remembrance compendiums; rather than being the exact wording of a marfu' hadith, it is a devotional formula that earlier scholars recommended to reinforce trust and submission to Allah. Repeating it during the days of Eid reminds the servant that Allah is the final refuge in every matter, deepening the heart's sense of security and submission.",
      },
      source: {
        tr: 'Dua ve tevekkül mecmûaları; Hasbiye zikri rivayetleri',
        en: 'Traditional supplication and remembrance compendiums; narrations on the dhikr of sufficiency',
      },
      tags: ['kurban bayramı', 'hasbiye', 'tevekkül', 'dua', 'bayram', 'zilhicce', 'özel gün', 'eid al-adha', 'dhu al-hijjah'],
      categories: ['özel gün', 'bayram', 'dua', 'tevekkül', 'zilhicce', 'hac'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['tevekkül', 'endişe anları', 'rahmet talebi', 'korunma', 'sükunet', 'zilhicce', 'eid al-adha', 'dhu al-hijjah', 'kurban bayramı'],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Kurban Bayramı Arefe Günü',
        en: 'Eid al-Adha Day of Arafah',
      },
      type: 'özel gün',
      date: '2026-05-26',
      hijriDate: '9 Zilhicce 1447',
      description: {
        tr: 'Arefe Günü (Tevbe, Dua ve Tevhid Yoğunluğu)',
        en: 'Day of Arafah (Intensive Repentance, Supplication, and Tawhid)',
      },
      eventKey: 'kurban-bayrami-2026',
      dhikrKeys: [keyMap.IHLAS, keyMap.VAHDEHU_LA, keyMap.ISTIGFAR],
    },
    {
      name: {
        tr: 'Kurban Bayramı',
        en: 'Eid al-Adha',
      },
      type: 'bayram',
      date: '2026-05-27',
      hijriDate: '10 Zilhicce 1447',
      description: {
        tr: 'Kurban Bayramı 1. Gün (Bayram Sabahı ve Teşrik Başlangıcı)',
        en: 'Eid al-Adha Day 1 (Eid Morning and the Start of the Tashriq Days)',
      },
      eventKey: 'kurban-bayrami-2026',
      dayIndex: 1,
      dayCount: 4,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.VAHDEHU_LA,
        keyMap.SUBHANALLAHI_VE_BIHAMDIHI,
        keyMap.ESTAGFIRULLAH,
        keyMap.YA_HAYYU_YA_KAYYUM,
        keyMap.KURBAN_SUKRU_DUASI,
      ],
    },
    {
      name: {
        tr: 'Kurban Bayramı',
        en: 'Eid al-Adha',
      },
      type: 'bayram',
      date: '2026-05-28',
      hijriDate: '11 Zilhicce 1447',
      description: {
        tr: 'Kurban Bayramı 2. Gün (Tevhid, Salavat ve Tevekkül Günü)',
        en: 'Eid al-Adha Day 2 (A Day of Tawhid, Salawat, and Trust in Allah)',
      },
      eventKey: 'kurban-bayrami-2026',
      dayIndex: 2,
      dayCount: 4,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.SALAVAT_SERIF,
        keyMap.HASBIYE_ZIKRI_100,
        keyMap.HASBIYE,
        keyMap.VAHDEHU_LA,
        keyMap.ESTAGFIRULLAH,
        keyMap.YA_HAYYU_YA_KAYYUM,
      ],
    },
    {
      name: {
        tr: 'Kurban Bayramı',
        en: 'Eid al-Adha',
      },
      type: 'bayram',
      date: '2026-05-29',
      hijriDate: '12 Zilhicce 1447',
      description: {
        tr: 'Kurban Bayramı 3. Gün (Sabır, Dua ve Arınma Günü)',
        en: 'Eid al-Adha Day 3 (A Day of Patience, Supplication, and Purification)',
      },
      eventKey: 'kurban-bayrami-2026',
      dayIndex: 3,
      dayCount: 4,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.VAHDEHU_LA,
        keyMap.NUR,
        keyMap.ESTAGFIRULLAH,
        keyMap.SALAVAT_SERIF,
        keyMap.YA_HAYYU_YA_KAYYUM,
      ],
    },
    {
      name: {
        tr: 'Kurban Bayramı',
        en: 'Eid al-Adha',
      },
      type: 'bayram',
      date: '2026-05-30',
      hijriDate: '13 Zilhicce 1447',
      description: {
        tr: 'Kurban Bayramı 4. Gün (Kapanış ve Teşrik Tamamlama Günü)',
        en: 'Eid al-Adha Day 4 (Closing Day and Completion of the Tashriq Days)',
      },
      eventKey: 'kurban-bayrami-2026',
      dayIndex: 4,
      dayCount: 4,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.TEVHID,
        keyMap.HASBIYE_ZIKRI_100,
        keyMap.HASBIYE,
        keyMap.SALAVAT_SERIF,
        keyMap.ESTAGFIRULLAH,
        keyMap.YA_HAYYU_YA_KAYYUM,
      ],
    },
  ],
}
