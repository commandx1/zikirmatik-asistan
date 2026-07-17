export const hacUmre = {
  key: 'hac-umre',
  label: 'Hac ve Umre Zikirleri',
  category: 'ibadet',
  description: 'Hac ve umre ibadetlerinde okunacak dualar.',
  dhikrItems: [
    {
      key: 'hac-yolculuk-binit-duasi',
      nameArabic:
        'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
      name: {
        tr: 'Yolculuğa (Binite) Binerken Duası',
        en: 'Supplication When Mounting a Vehicle (for a Journey)',
      },
      transliteration: {
        tr: `Sübhânellezî sahhara lenâ hâzâ vemâ künnâ lehû mukrinîn. Ve innâ ilâ rabbinâ le münkâlibûn.`,
        en: 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun.',
      },
      meaning: {
        tr: `Bunu bizim hizmetimize veren Yüce Allah'ı tesbih ve tenzih ederiz. Yoksa biz buna güç yetiremezdik. Şüphesiz biz Rabbimize döneceğiz.`,
        en: 'Glory be to Him who has subjected this to us, for we could never have done it ourselves. Indeed, to our Lord we will surely return.',
      },
      virtue: {
        tr: `Resûlullah (sas) yolculuğa çıkarken bineğine binince bu âyetleri okur, ardından dua ederdi. Kulun kendi gücüne değil Allah'ın takdirine dayandığını hatırlatır; can, mal ve âile emniyetini O'na emânet ederek kaza ve meşakkate karşı ilâhî himâyeye sığındırır.`,
        en: 'When the Messenger of Allah, peace be upon him, set out on a journey and mounted his ride, he would recite these verses and then supplicate. This reminds the servant that he relies not on his own strength but on Allah\'s decree; by entrusting his life, property, and family\'s safety to Him, he takes refuge in divine protection against accident and hardship.',
      },
      source: {
        tr: `Kur'an-ı Kerim, Zuhruf Sûresi 43/13-14; Sahih-i Müslim, Kitâbu'l-Hac, 425`,
        en: "Quran, Surah Az-Zukhruf 43:13-14; Sahih Muslim, Book of Hajj, 425",
      },
      tags: ['yolculuk', 'seyahat', 'binit', 'dua', 'hac', 'umre'],
      categories: ['dua', 'yolculuk'],
      timeOfDay: 'any',
      recommendedCount: 1,
      specialDays: ['zilhicce'],
      suitableFor: [
        'yolculuğa çıkarken',
        'vasıtaya/binite binerken',
        'hac veya umre yoluna çıkarken',
        'seyahat öncesi',
      ],
    },
    {
      key: 'hac-ihlas-duasi',
      nameArabic:
        'اللَّهُمَّ حَجَّةً لَا رِيَاءَ فِيهَا وَلَا سُمْعَةَ',
      name: {
        tr: 'İhlas Duası (Riyâdan Uzak Hac Duası)',
        en: 'Supplication for Sincerity (Hajj Free from Ostentation)',
      },
      transliteration: {
        tr: `Allâhümme hacceten lâ riyâe fîhâ velâ sum'ate.`,
        en: "Allahumma hajjatan la riya'a fiha wa la sum'ah.",
      },
      meaning: {
        tr: `Allah'ım! Bu haccımı gösteriş ve şöhretten uzak bir hac eyle!`,
        en: 'O Allah, make this Hajj of mine free from showing off and seeking renown.',
      },
      virtue: {
        tr: `Resûlullah'ın haccına başlarken okuduğu bu dua, niyeti riyâ ve şöhretten arındırarak ihlâsı korur; mebrûr -yani Allah katında kabul görmüş- bir haccın kapısını ancak samimi niyet aralar.`,
        en: 'This supplication, which the Messenger of Allah, peace be upon him, recited at the start of his Hajj, protects sincerity by purifying the intention from ostentation and seeking renown; only a sincere intention can open the door to a mabrur — that is, an accepted — Hajj.',
      },
      source: {
        tr: `Sünen-i İbn Mâce, Kitâbu'l-Menâsik, 4; Elbânî, Menâsikü'l-Hac, 16`,
        en: 'Sunan Ibn Majah, Book of Rites (Manasik), 4; Al-Albani, Rites of Hajj, 16',
      },
      tags: ['hac', 'ihlas', 'niyet', 'riya', 'dua'],
      categories: ['hac', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 1,
      specialDays: ['zilhicce'],
      suitableFor: [
        'hacca niyet ederken',
        'ihrâma girerken',
        'hac başlangıcında',
      ],
    },
    {
      key: 'hac-telbiye',
      nameArabic:
        'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ',
      name: {
        tr: 'Telbiye',
        en: 'Talbiyah',
      },
      transliteration: {
        tr: `Lebbeyk Allàhümme lebbeyk, lebbeyk lâ şerîke leke lebbeyk, innel hamde venni'mete leke velmülk, lâ şerîke lek.`,
        en: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak.",
      },
      meaning: {
        tr: `Emrine boyun eğdim Allahım, emrine boyun eğdim. Senin eşin ve ortağın yoktur, bütün varlığımla sana yöneldim. Hamd senin, nimet senin, mülk senindir. Senin eşin ve ortağın yoktur.`,
        en: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Indeed all praise, grace, and sovereignty belong to You. You have no partner.',
      },
      virtue: {
        tr: `Telbiye, ihrâma girişle birlikte hac ve umrenin çağrısına verilen ilk ve en köklü cevaptır. "Lebbeyk" sözcüğü "emrindeyim, hazırım, buyur" anlamında bir teslimiyeti dile getirir; köklü Arapçada bu denli derin bir boyun eğiş ifadesi nadirdir. Resûlullah (sas) ihrâma girerken bu telbiyeyi okudu; sahabîler de onu izledi. Hz. Peygamber, telbiye getiren kimsenin yanındaki her taş, ağaç ve toprağın da onunla birlikte telbiye getirdiğini müjdeledi. Ayrıca telbiye sesini bir an için kesen kişinin o anki faziletten yoksun kaldığını belirtti. İhrâma girdikten sonra her fırsatta — yüksek yere çıkınca, aşağı inince, yeni bir yere gelince, namazlardan sonra — tekrarlanır; Akabe cemresine taş atılıncaya dek (veya umrede Hacerülesved'i selâmlayana dek) devam edilir.`,
        en: "The Talbiyah is the first and most fundamental response given to the call of Hajj and Umrah upon entering the state of ihram. The word 'labbayk' expresses a submission that means 'I am at Your command, I am ready, here I am'; such a profound expression of surrender is rare even within the depth of the Arabic language. The Messenger of Allah, peace be upon him, recited this Talbiyah upon entering ihram, and the Companions followed him in it. The Prophet, peace be upon him, gave the glad tidings that every stone, tree, and patch of earth beside a person who recites the Talbiyah recites it along with him. He also stated that whoever interrupts the sound of the Talbiyah even for a moment is deprived of that moment's merit. After entering ihram, it is repeated at every opportunity — when ascending a height, descending, arriving at a new place, and after prayers — and continues until the stoning of the Jamrat al-Aqabah (or, in Umrah, until greeting the Black Stone).",
      },
      source: {
        tr: `Sahih-i Buhârî, Kitâbu'l-Hac, 26 (1549); Sahih-i Müslim, Kitâbu'l-Hac, 19 (1184)`,
        en: 'Sahih al-Bukhari, Book of Hajj, 26 (1549); Sahih Muslim, Book of Hajj, 19 (1184)',
      },
      tags: ['hac', 'umre', 'ihrâm', 'telbiye', 'zikir'],
      categories: ['hac', 'zikir'],
      timeOfDay: 'any',
      recommendedCount: 3,
      specialDays: ['zilhicce'],
      suitableFor: [
        'ihrâm süresince',
        'yüksek yere çıkınca',
        'aşağı inince',
        'namazlardan sonra',
        'yolculukta',
      ],
    },
    {
      key: 'hac-tavaf-baslangic',
      nameArabic:
        'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
      name: {
        tr: 'Tavaf Başlangıcı (Hacerülesved Karşısında)',
        en: 'Beginning of Tawaf (Facing the Black Stone)',
      },
      transliteration: {
        tr: `Bismillâhi vallâhü ekber. Allàhümme îmânen bike, ve tasdîken bikitâbike, ve vefâen biahdike, vettibâen lisünneti nebiyyike Muhammedin sallallahu aleyhi ve sellem.`,
        en: "Bismillahi wallahu akbar. Allahumma imanan bika, wa tasdiqan bikitabika, wa wafa'an bi'ahdika, wattiba'an lisunnati nabiyyika Muhammadin sallallahu 'alayhi wa sallam.",
      },
      meaning: {
        tr: `Allah'ın ismiyle başlarım. Allah en büyüktür. Allahım! Sana îmân ederek, kitâbını tasdîk ederek, ezelde sana verdiğim sözü tutarak ve peygamberin Hz. Muhammed'in sünnetine uyarak tavaf ediyorum.`,
        en: 'I begin in the name of Allah, and Allah is the Greatest. O Allah, I circle this House believing in You, affirming Your Book, fulfilling my covenant with You, and following the practice of Your Prophet Muhammad, peace and blessings be upon him.',
      },
      virtue: {
        tr: `Tavaf yalnızca fiziksel bir hareket değil, dört temel ikrarın cisimleşmiş hâlidir: imân (sana inanıyorum), tasdîk (kitabını doğruluyorum), vefâ (ahdimi tutuyorum), ittibâ (sünnetine uyuyorum). Her adım bu dört değeri yeniler. Hacerülesved'i ilk kez selâmlarken, her şavtın başında ve ortasında söylenmesi müstehaptır. Tavaf edemeyen kişi, izdiham nedeniyle yalnızca bakışla selâm vererek başlangıç zikrini söyleyebilir.`,
        en: "Tawaf is not merely a physical movement but the embodiment of four fundamental affirmations: iman (I believe in You), tasdiq (I affirm Your Book), wafa' (I keep my covenant), and ittiba' (I follow Your Prophet's Sunnah). Every step renews these four values. It is recommended to recite this at the first greeting of the Black Stone, and at the beginning and midpoint of each circuit. A person who is unable to physically approach the Black Stone due to crowding may greet it merely with a glance and still recite this opening dhikr.",
      },
      source: {
        tr: `İbn Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 451; Beyhakî, es-Sünenü'l-Kübrâ, 5/79`,
        en: "Ibn as-Sunni, 'Amal al-Yawm wa al-Laylah, no. 451; Al-Bayhaqi, As-Sunan al-Kubra, 5/79",
      },
      tags: ['hac', 'umre', 'tavaf', 'kabe', 'zikir'],
      categories: ['hac', 'zikir'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: ['zilhicce'],
      suitableFor: [
        'tavaf başlangıcı',
        'hacerülesved karşısında',
        'her şavt başında',
      ],
    },
    {
      key: 'hac-tavaf-kabul-duasi',
      nameArabic:
        'اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَذَنْبًا مَغْفُورًا وَسَعْيًا مَشْكُورًا',
      name: {
        tr: 'Makbul Hac Duası (Tavafın İlk Üç Şavtında)',
        en: 'Supplication for an Accepted Hajj (During the First Three Circuits of Tawaf)',
      },
      transliteration: {
        tr: `Allâhümmec'alhü haccen mebrûren, ve zenben mağfûren, ve sa'yen meşkûren.`,
        en: "Allahummaj'alhu hajjan mabrooran, wa dhanban maghfooran, wa sa'yan mashkooran.",
      },
      meaning: {
        tr: `Allahım! Bu haccı makbûl bir hac eyle, günahımı affeyle, gayretimi boşa çıkarma.`,
        en: 'O Allah, make this an accepted Hajj, forgive my sins, and make my effort one that is rewarded.',
      },
      virtue: {
        tr: `Bu dua, haccın üç ana amacını özetler: "haccen mebrûren" (Allah katında makbul, günahtan arınmış), "zenben mağfûren" (geçmiş günahlardan temizlenmiş), "sa'yen meşkûren" (emek ve ihlâsın karşılığını bulmuş). Resûlullah (sas): "Mebrûr hac için cennet dışında bir karşılık yoktur" buyurdu. Tavafın remel yapılan ilk üç şavtında okunması İmâm Şâfiî tarafından tavsiye edilmiştir. Son dört şavtta ise "Rabbenâ âtinâ fiddünyâ haseneten" ağırlıklı okunur; bu iki dua birbirini tamamlar.`,
        en: "This supplication summarizes the three main goals of Hajj: 'hajjan mabrooran' (a Hajj accepted by Allah and purified from sin), 'dhanban maghfooran' (past sins forgiven), and 'sa'yan mashkooran' (effort and sincerity duly rewarded). The Messenger of Allah, peace be upon him, said: 'There is no reward for an accepted Hajj except Paradise.' Reciting this during the first three circuits of Tawaf, in which ramal (brisk walking) is performed, was recommended by Imam ash-Shafi'i. In the last four circuits, the supplication 'Rabbana atina fid-dunya hasanatan' is emphasized instead; the two supplications complement one another.",
      },
      source: {
        tr: `İmam Şâfiî, el-Üm, 2/174; Beyhakî, es-Sünenü'l-Kübrâ, 5/90`,
        en: "Imam ash-Shafi'i, Al-Umm, 2/174; Al-Bayhaqi, As-Sunan al-Kubra, 5/90",
      },
      tags: ['hac', 'umre', 'tavaf', 'dua', 'kabul'],
      categories: ['hac', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: ['zilhicce'],
      suitableFor: [
        'tavaf sırasında',
        'ilk üç şavt',
        'hac kabulü için',
        'umre duası',
      ],
    },
    {
      key: 'hac-safa-merve-ayeti',
      nameArabic:
        'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَنْ يَطَّوَّفَ بِهِمَا وَمَنْ تَطَوَّعَ خَيْرًا فَإِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ',
      name: {
        tr: `Sa'y Başlangıç Âyeti (Safâ-Merve)`,
        en: "Verse for the Beginning of Sa'i (Safa and Marwah)",
      },
      transliteration: {
        tr: `İnne's-safâ ve'l-mervete min şeâirillâh. Fe men hacce'l-beyte evi'temera felâ cünâha aleyhi en yettavvefe bihimâ. Ve men tetavvea hayran fe innallâhe şâkirun alîm.`,
        en: "Innas-Safa wal-Marwata min sha'a'irillah, faman hajjal-bayta awi'tamara fala junaha 'alayhi an yattawwafa bihima, wa man tatawwa'a khayran fa innallaha shakirun 'alim.",
      },
      meaning: {
        tr: `Şüphesiz Safâ ile Merve Allah'ın nişânelerindendir. Kim hac veya umre yaparak Beytullah'ı ziyaret ederse, bu iki yeri tavaf (sa'y) etmesinde bir günah yoktur. Kim gönüllü bir iyilik yaparsa bilsin ki Allah karşılığını veren ve her şeyi bilendir.`,
        en: 'Indeed, Safa and Marwah are among the symbols of Allah. So whoever performs Hajj to the House or performs Umrah, there is no blame upon him for going between them. And whoever volunteers good, then indeed, Allah is Appreciative and Knowing.',
      },
      virtue: {
        tr: `Resûlullah (sas) sa'ye başlarken Safâ'ya çıkıp bu âyeti okurdu; Safâ ile Merve'nin Allah'ın nişâneleri olduğunu hatırlatarak sa'yin ilk şavtına nebevî bir sünnet ve bereket vesilesi olarak başlanır.`,
        en: "When beginning the sa'i, the Messenger of Allah, peace be upon him, would climb Safa and recite this verse; by recalling that Safa and Marwah are among the symbols of Allah, the first circuit of sa'i is thereby begun as a prophetic Sunnah and a source of blessing.",
      },
      source: {
        tr: `Kur'an-ı Kerim, Bakara Sûresi 2/158; Sahih-i Buhârî, Kitâbu'l-Hac, 50; Sahih-i Müslim, Kitâbu'l-Hac, 259`,
        en: 'Quran, Surah Al-Baqarah 2:158; Sahih al-Bukhari, Book of Hajj, 50; Sahih Muslim, Book of Hajj, 259',
      },
      tags: ['hac', 'umre', 'say', 'safa', 'merve', 'ayet'],
      categories: ['hac', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 1,
      specialDays: ['zilhicce'],
      suitableFor: [
        `sa'y başlangıcında`,
        'Safâ tepesinde ilk şavt',
        `hac veya umre sa'yi`,
      ],
    },
    {
      key: 'hac-safa-zikri',
      nameArabic:
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ أَنْجَزَ وَعْدَهُ وَنَصَرَ عَبْدَهُ وَهَزَمَ الْأَحْزَابَ وَحْدَهُ',
      name: {
        tr: 'Safâ Tepesi Zikri',
        en: 'Dhikr at the Hill of Safa',
      },
      transliteration: {
        tr: `Allâhü ekber, Allâhü ekber, Allâhü ekber, ve lillâhil hamdü. Lâilâhe illallàhu vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü yuhyî ve yümît, vehüve alâ külli şey'in kadîr. Lâilâhe illallàhu enceze va'dehû ve nasara abdehû ve hezemel ahzâbe vahdehû. Lâilâhe illallàh, velâ na'büdü illâ iyyâhu, muhlisîne lehüd dîne velev kerihel kâfirûn.`,
        en: "Allahu akbar, Allahu akbar, Allahu akbar, wa lillahil-hamd. La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu yuhyi wa yumit, wa Huwa 'ala kulli shay'in qadir. La ilaha illallahu anjaza wa'dahu wa nasara 'abdahu wa hazamal-ahzaba wahdah. La ilaha illallah, wa la na'budu illa iyyahu, mukhlisina lahud-dina wa law karihal-kafirun.",
      },
      meaning: {
        tr: `Allah en büyüktür (x3). Hamd Allah'a mahsustur. Allah'tan başka ilâh yoktur; O tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur. O diriltir ve öldürür; O her şeye kâdirdir. Allah'tan başka ilâh yoktur. O vaadini gerçekleştirdi, kuluna yardım etti, düşman topluluklarını tek başına perîşan etti. Allah'tan başka ilâh yoktur. Biz sadece O'na ibadet ederiz; kâfirler hoşlanmasa da, bütün samimiyetimizle sadece O'na ibadet ederiz.`,
        en: 'Allah is the Greatest (x3), and all praise belongs to Allah. There is no god but Allah alone, He has no partner. Sovereignty is His and praise is His, He gives life and causes death, and He is capable of all things. There is no god but Allah alone, who fulfilled His promise, aided His servant, and defeated the confederates alone. There is no god but Allah; we worship none but Him, sincere in devotion to Him though the disbelievers dislike it.',
      },
      virtue: {
        tr: `Resûlullah (sas) Safâ tepesine çıkınca Kâbe'ye döner, tekbîr getirir ve bu uzun zikri üç kez okudu; ardından da dua etti. Tüm bu süreç üç kez tekrarlandı. Safâ zikrinin özünde zafer ilanı yatar: Mekke'nin fethini hatırlatan "hezemel ahzâbe vahdehû" ifadesi, Allah'ın yardımının insanlık tarihinin en zorlu anlarında bile gerçekleştiğini hatırlatır. "Enceze va'dehû" (vaadini gerçekleştirdi) ise bu imanı her tekbirde yeniler. Safâ'dan Merve'ye her geçişte tekrarlanır (toplam 7 şavt boyunca).`,
        en: "When the Messenger of Allah, peace be upon him, climbed the hill of Safa, he would face the Ka'bah, say the takbir, and recite this lengthy dhikr three times, then supplicate; this entire sequence was repeated three times. At the heart of the Safa dhikr lies a proclamation of victory: the phrase 'hazamal-ahzaba wahdah' (He alone defeated the confederates), recalling the conquest of Mecca, reminds the believer that Allah's aid arrived even at the most difficult moments of human history. 'Anjaza wa'dahu' (He fulfilled His promise) renews this faith with every takbir. It is repeated with every passage between Safa and Marwah, throughout all seven circuits.",
      },
      source: {
        tr: `Sahih-i Müslim, Kitâbu'l-Hac, 147 (1218); Sünen-i Nesâî, Kitâbu'l-Menâsik, 173`,
        en: "Sahih Muslim, Book of Hajj, 147 (1218); Sunan an-Nasa'i, Book of Rites (Manasik), 173",
      },
      tags: ['hac', 'umre', 'say', 'safa', 'merve', 'zikir', 'tekbir'],
      categories: ['hac', 'zikir'],
      timeOfDay: 'any',
      recommendedCount: 3,
      specialDays: ['zilhicce'],
      suitableFor: [
        'Safâ tepesinde',
        'Merve tepesinde',
        'sa\'y sırasında',
        'her şavt başı',
      ],
    },
    {
      key: 'hac-say-hervele-duasi',
      nameArabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ',
      name: {
        tr: 'Hervele (Yeşil Direkler Arası) Duası',
        en: 'Supplication During Harwalah (Between the Green Markers)',
      },
      transliteration: {
        tr: `Rabbiğfir verham ve ente hayrur rahimin.`,
        en: 'Rabbighfir warham wa anta khayrur-rahimin.',
      },
      meaning: {
        tr: `Rabbim bağışla ve merhamet et, şüphesiz sen merhamet edenlerin en hayırlısısın.`,
        en: 'My Lord, forgive and have mercy, for You are the best of those who show mercy.',
      },
      virtue: {
        tr: `Sa'y sırasında hervele (hızlı yürüyüş) esnasında, yeşil ışıklı iki direk arasında okunan bu dua, günahların affı ve Allah'ın sonsuz merhametine sığınmayı dile getirir; tevazu içinde tekrarlanan kısa fakat samimi bir istiğfardır.`,
        en: "Recited during the harwalah (brisk walking) portion of the sa'i, between the two green markers, this supplication expresses the forgiveness of sins and taking refuge in Allah's boundless mercy; it is a short yet sincere plea for forgiveness, repeated in humility.",
      },
      source: {
        tr: `İbn Ebî Şeybe, Musannef; Diyanet Umre Rehberi`,
        en: 'Ibn Abi Shaybah, Al-Musannaf; Turkish Presidency of Religious Affairs (Diyanet), Umrah Guide',
      },
      tags: ['hac', 'umre', 'say', 'hervele', 'dua', 'istigfar'],
      categories: ['hac', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 3,
      specialDays: ['zilhicce'],
      suitableFor: [
        `sa'y sırasında hervele`,
        'yeşil ışıklı direkler arasında',
        'her şavtta hervele',
      ],
    },
    {
      key: 'hac-arefe-zikri',
      nameArabic:
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      name: {
        tr: 'Arafât Zikri (Arefe Günü)',
        en: 'Dhikr of Arafat (Day of Arafah)',
      },
      transliteration: {
        tr: `Lâilâhe illallâhu vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü ve hüve alâ külli şey'in kadîr.`,
        en: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa Huwa 'ala kulli shay'in qadir.",
      },
      meaning: {
        tr: `Allah'tan başka ilâh yoktur; yalnız Allah vardır, O tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur. O her şeye kâdirdir.`,
        en: 'There is no god but Allah alone; He has no partner. Sovereignty is His, and praise is His, and He is capable of all things.',
      },
      virtue: {
        tr: `Resûlullah (sas) şöyle buyurdu: "En hayırlı duâ, arefe günü yapılan duâdır. Benim ve benden önceki peygamberlerin söylediği en hayırlı söz şudur: Lâilâhe illallâhu vahdehû lâ şerîke leh..." Bu zikir, haccın kalbinde — bütün ümmetin bir arada olduğu Arafât meydanında — dilden dilden dolaşır. Mâlik'in Muvatta'ında, İslâm öncesi dönemde de Arafât'ta bu sözün söylendiği nakledilir. Arefe gününde çok tekrar edilmesi, Arafât'a gidemeyen Müslümanların da o günün havasına ortak olması için tavsiye edilir; zira Hz. Peygamber arefe gününün orucunun önceki yılın günahlarını örteceğini bildirmiştir.`,
        en: "The Messenger of Allah, peace be upon him, said: 'The best supplication is the supplication made on the Day of Arafah, and the best thing that I and the prophets before me have said is: La ilaha illallahu wahdahu la sharika lah...' This dhikr passes from tongue to tongue at the heart of Hajj — on the plain of Arafat, where the whole ummah gathers as one. In Imam Malik's Muwatta, it is related that this phrase was also uttered at Arafat even before Islam. Reciting it often on the Day of Arafah is recommended so that Muslims who cannot be present at Arafat may still share in the spiritual atmosphere of that day, for the Prophet, peace be upon him, informed us that fasting on the Day of Arafah expiates the sins of the preceding year.",
      },
      source: {
        tr: `Sünen-i Tirmizî, Kitâbu'd-Deavât, 123 (3585); İmam Mâlik, Muvatta', Kitâbu'l-Hac, 246; Sünen-i İbn Mâce, Kitâbu'l-Menâsik, 56 (3003)`,
        en: "Sunan at-Tirmidhi, Book of Supplications, 123 (3585); Imam Malik, Al-Muwatta, Book of Hajj, 246; Sunan Ibn Majah, Book of Rites (Manasik), 56 (3003)",
      },
      tags: ['hac', 'arefe', 'zikir', 'tehlil', 'zilhicce'],
      categories: ['hac', 'zikir'],
      timeOfDay: 'any',
      recommendedCount: 100,
      specialDays: ['zilhicce', 'arefe'],
      suitableFor: [
        'Arafât vakfesi',
        'arefe günü',
        'hac sırasında',
        'zilhicce ayında',
      ],
    },
    {
      key: 'hac-arefe-gecesi-tesbihi',
      nameArabic:
        'سُبْحَانَ الَّذِي فِي السَّمَاءِ عَرْشُهُ سُبْحَانَ الَّذِي فِي الْأَرْضِ مَوْطِئُهُ سُبْحَانَ الَّذِي فِي الْبَحْرِ سَبِيلُهُ سُبْحَانَ الَّذِي فِي النَّارِ سُلْطَانُهُ سُبْحَانَ الَّذِي لَا مَنْجَا وَلَا مَلْجَأَ مِنْهُ إِلَّا إِلَيْهِ',
      name: {
        tr: 'Arefe Gecesi Tesbihi (Sığınma Duası)',
        en: 'Tasbih of the Night of Arafah (Supplication of Refuge)',
      },
      transliteration: {
        tr: `Subhânallâhillezî fi's-semâi arşuh. Subhânallâhillezî fi'l-ardı mevtıuh. Subhânallâhillezî fi'l-bahri sebîluh. Subhânallâhillezî fi'n-nâri sültânuh. Subhânallâhillezî lâ mencâ velâ melcee minhu illâ ileyh.`,
        en: "Subhanallahilladhi fis-sama'i 'arshuh, subhanallahilladhi fil-ardi mawti'uh, subhanallahilladhi fil-bahri sabiluh, subhanallahilladhi fin-nari sultanuh, subhanallahilladhi la manja wa la malja'a minhu illa ilayh.",
      },
      meaning: {
        tr: `Arşı semada olan Allah'ı tesbih ederim. Hükmü yerde olan Allah'ı tesbih ederim. Yolu denizde olan Allah'ı tesbih ederim. Saltanatı ateşte olan Allah'ı tesbih ederim. Kendisinden kaçıp sığınılacak yer ancak kendisi olan Allah'ı tesbih ederim.`,
        en: 'Glory be to Him whose throne is in the heaven. Glory be to Him whose dominion is on the earth. Glory be to Him whose path is in the sea. Glory be to Him whose authority is in the fire. Glory be to Him from whom there is no escape and no refuge except unto Him.',
      },
      virtue: {
        tr: `Abdullah İbn Mes'ûd radıyallahu anh'tan rivayet edilen bu tesbih, Arefe gecesi samimiyetle okunduğunda kulun dileklerinin ilâhî lütufla karşılanacağını ve günahlarının bağışlanacağını müjdeler; Allah'ın kudretini gökte, yerde, denizde ve ateşte anarak O'na sığınmayı ifade eder.`,
        en: "Narrated on the authority of Abdullah ibn Mas'ud, may Allah be pleased with him, this tasbih promises that when recited sincerely on the night of Arafah, the servant's requests will be met with divine favor and his sins forgiven; it expresses taking refuge in Allah by recalling His power over the heaven, the earth, the sea, and the fire.",
      },
      source: {
        tr: `Abdullah İbn Mes'ûd radıyallahu anh Hadisi; İbn Ebî Şeybe, Musannef`,
        en: "Hadith of Abdullah ibn Mas'ud, may Allah be pleased with him; Ibn Abi Shaybah, Al-Musannaf",
      },
      tags: ['hac', 'arefe', 'tesbih', 'dua', 'zilhicce', 'sığınma'],
      categories: ['hac', 'dua'],
      timeOfDay: 'night',
      recommendedCount: 1,
      specialDays: ['zilhicce', 'arefe'],
      suitableFor: [
        'arefe gecesi',
        'gece duası',
        'zilhicce ayında',
      ],
    },
    {
      key: 'hac-zemzem-duasi',
      nameArabic:
        'اللَّهُمَّ إِنَّهُ بَلَغَنِي أَنَّ رَسُولَكَ قَالَ مَاءُ زَمْزَمَ لِمَا شُرِبَ لَهُ اللَّهُمَّ إِنِّي أَشْرَبُهُ لِتَغْفِرَ لِي فَاغْفِرْ لِي',
      name: {
        tr: 'Zemzem İçerken Dua',
        en: 'Supplication While Drinking Zamzam',
      },
      transliteration: {
        tr: "Allâhümme innehû beleganî enne resûleke sallallahu aleyhi ve sellem kàle: 'Mâüz zemzeme limâ şuribe leh.' Allâhümme ve innî eşrabuhû litağfira lî — ve burada niyet edilir — fağfirlî vef'al.",
        en: "Allahumma innahu balaghani anna Rasulaka sallallahu 'alayhi wa sallam qala: 'Ma'u Zamzama lima shuriba lah.' Allahumma wa inni ashrabuhu litaghfira li — faghfir li waf'al.",
      },
      meaning: {
        tr: "Allahım! Resûlünün 'Zemzem suyu ne niyetle içilirse o faydayı sağlar' buyurduğunu öğrendim. Allahım! Ben bunu —beni bağışlaman için içiyorum— bağışla beni ve dilediğimi ver.",
        en: "O Allah, it has reached me that Your Messenger, peace and blessings be upon him, said: 'Zamzam water serves the purpose for which it is drunk.' O Allah, I am drinking it so that You may forgive me — so forgive me and grant [what I intend].",
      },
      virtue: {
        tr: "Resûlullah (sas) 'Zemzem suyu ne niyetle içilirse o faydayı sağlar' buyurdu; İmam Nevevi bu niyeti açıkça dile getirmenin müstehap olduğunu belirtti (El-Ezkar nr. 563). 'Limâ şuribe leh' — içildiği niyet neyse o — ilkesi, zemzemi içerken kalbin yönelişini bilinçli kılmanın önemini vurgular. Günahların affı, şifa, ilim, rızık gibi ihtiyaçlar için içilir; bu niyetler açıkça Allah'a arz edilir.",
        en: "The Messenger of Allah, peace be upon him, said: 'Zamzam water serves the purpose for which it is drunk.' Imam an-Nawawi noted that it is recommended to voice this intention explicitly (Al-Adhkar, no. 563). The principle of 'lima shuriba lah' — whatever the intention behind drinking it — emphasizes the importance of consciously directing the heart while drinking Zamzam. It is drunk with intentions such as forgiveness of sins, healing, knowledge, or sustenance; these intentions are openly presented to Allah.",
      },
      source: {
        tr: `Sünen-i İbn Mâce, Kitâbu'l-Menâsik, 78 (3062); Beyhakî, es-Sünenü'l-Kübrâ, 5/202; İmam Nevevî, El-Ezkâr, nr. 563`,
        en: 'Sunan Ibn Majah, Book of Rites (Manasik), 78 (3062); Al-Bayhaqi, As-Sunan al-Kubra, 5/202; Imam an-Nawawi, Al-Adhkar, no. 563',
      },
      tags: ['hac', 'umre', 'zemzem', 'su', 'dua', 'niyet'],
      categories: ['hac', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: ['zilhicce'],
      suitableFor: ['zemzem içerken', 'hac veya umre sırasında', 'Mekke ziyareti'],
    },
    {
      key: 'hac-medine-veda-duasi',
      nameArabic:
        'اللَّهُمَّ لَا تَجْعَلْ هَذَا آخِرَ الْعَهْدِ بِحَرَمِ رَسُولِكَ وَيَسِّرْ لِيَ الْعَوْدَ إِلَى الْحَرَمَيْنِ سَبِيلًا سَهْلًا',
      name: {
        tr: 'Medine\'den Ayrılırken Vedâ Duası',
        en: 'Farewell Supplication When Leaving Medina',
      },
      transliteration: {
        tr: "Allâhümme lâ tec'al hâzâ âhiral ahdi biharami Resûlike, ve yessir liyal avde ilel harameyni sebîlen sehleten bimennike ve fazlike, verzuknil afve vel âfiyete fiddîni veddünyâ vel âhirati, ve ruddenâ sâlimîne gânimîne ilâ evtâninâ âminîn.",
        en: "Allahumma la taj'al hadha akhiral-'ahdi biharami Rasulika, wa yassir liyal-'awda ilal-haramayni sabilan sahlatan bimannika wa fadlika, warzuqnil-'afwa wal-'afiyata fid-dini wad-dunya wal-akhirati, wa ruddana salimina ghanimina ila awtanina aminin.",
      },
      meaning: {
        tr: "Allahım! Bu ziyâretimi Resûlünün harem-i şerîfine son ziyâretim yapma. Lütuf ve keremınle bana Mekke ve Medîne'ye kolay bir şekilde tekrar gelmeyi nasîp eyle. Din, dünya ve ahirette af ve afiyet ver. Bizi yurtlarımıza sağ salim, kazançlı ve güven içinde geri çevir.",
        en: 'O Allah, do not make this the last of my visits to the sanctuary of Your Messenger, and by Your favor and grace, make my return to the two sanctuaries easy for me. Grant me pardon and well-being in religion, in this world, and in the Hereafter, and return us safe, blessed with reward, to our homelands in security.',
      },
      virtue: {
        tr: "Medîne'den ayrılan hacı veya ziyaretçinin Mescid-i Nebevî'ye vedâ namazını kılıp bu duayı okuması sünnettir (El-Ezkar nr. 564). 'Lâ tec'al hâzâ âhiral ahdi' — bunu son kez yapma — cümlesi, kutsal mekânla ayrılığın acısını ve tekrar kavuşma özlemini Allah'a teslim eder. 'Sâlimîne gânimîne' (sağ ve kazançlı dönme) ifadesi hacın yalnızca bedensel değil manevi bir kazanç yolculuğu olduğunu özetler.",
        en: "It is Sunnah for a pilgrim or visitor departing from Medina to perform the farewell prayer at the Prophet's Mosque and recite this supplication (Al-Adhkar, no. 564). The phrase 'la taj'al hadha akhiral-'ahd' — do not make this the last time — entrusts to Allah the sorrow of parting from the sacred place and the longing to return once more. The phrase 'salimina ghanimina' (returning safe and gaining reward) summarizes that Hajj is a journey of spiritual, not merely physical, gain.",
      },
      source: {
        tr: `Hâkim, el-Müstedrek, 1/485; İbn Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 527; İmam Nevevî, El-Ezkâr, nr. 564`,
        en: "Al-Hakim, Al-Mustadrak, 1/485; Ibn as-Sunni, 'Amal al-Yawm wa al-Laylah, no. 527; Imam an-Nawawi, Al-Adhkar, no. 564",
      },
      tags: ['hac', 'medine', 'mescid-i nebi', 'veda', 'dua', 'seyahat'],
      categories: ['hac', 'dua', 'yolculuk'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: ['zilhicce'],
      suitableFor: ['Medine\'den ayrılırken', 'hac sonrası vedâ', 'Mescid-i Nebi vedası'],
    },
    {
      key: 'hac-mekke-hareminde',
      nameArabic:
        'اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ فَحَرِّمْنِي عَلَى النَّارِ وَأَمِّنِّي مِنْ عَذَابِكَ يَوْمَ تَبْعَثُ عِبَادَكَ وَاجْعَلْنِي مِنْ أَوْلِيَائِكَ وَأَهْلِ طَاعَتِكَ',
      name: {
        tr: 'Mekke Haremîne Varınca Dua',
        en: 'Supplication Upon Arriving at the Sacred Precinct of Mecca',
      },
      transliteration: {
        tr: `Allàhümme hâzâ haremüke ve emnüke, feharrimnî alen nâri, ve emminnî min azâbike yevme teb'asü ibâdeke, vec'alnî min evliyâike ve ehli tâatike.`,
        en: "Allahumma hadha haramuka wa amnuka, faharrimni 'alan-nar, wa amminni min 'adhabika yawma tab'athu 'ibadaka, waj'alni min awliya'ika wa ahli ta'atik.",
      },
      meaning: {
        tr: `Allahım! Burası senin harem ve emniyet bölgendir. Beni cehenneme haram kıl, kullarını yeniden dirilteceğin günde beni azabından emniyette eyle. Beni dostlarından ve sana itâat eden kullarından eyle.`,
        en: 'O Allah, this is Your sanctuary and Your place of safety, so make me forbidden to the Fire, and grant me safety from Your punishment on the Day You resurrect Your servants, and make me among Your close friends and among the people of obedience to You.',
      },
      virtue: {
        tr: `Mekke'nin haremîne girişin ilk anı, tüm hac ve umrenin en beklenen kavuşma anlarından biridir. Bu dua, kişi o eşiği geçerken haremin kudsiyetini ve kişinin neden orada bulunduğunu hatırlatır. Üç dilekte bulunur: cehennemden uzak tutulma, kıyamet günü emân, Allah'ın dostları arasına katılma. Haremin sınırlarına varınca (Mekke girişinde) okunur; ardından kişi dilediği duaya devam eder.`,
        en: "The first moment of entering the sacred precinct of Mecca is one of the most eagerly awaited moments of reunion in the entire Hajj or Umrah. This supplication, recited as one crosses that threshold, recalls the sanctity of the Haram and the very reason for one's presence there. It contains three requests: to be kept far from Hellfire, to be granted safety on the Day of Resurrection, and to be counted among Allah's close friends. It is recited upon reaching the boundaries of the Haram (upon entering Mecca), after which the pilgrim continues with whatever supplication he wishes.",
      },
      source: {
        tr: `İbn Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 508; Beyhakî, Şuabü'l-İmân, 3/451`,
        en: "Ibn as-Sunni, 'Amal al-Yawm wa al-Laylah, no. 508; Al-Bayhaqi, Shu'ab al-Iman, 3/451",
      },
      tags: ['hac', 'umre', 'mekke', 'harem', 'dua'],
      categories: ['hac', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: ['zilhicce'],
      suitableFor: [
        'Mekke haremîne girişte',
        'Mescid-i Haram girişi',
        'hac veya umre başında',
      ],
    },
  ],
};
