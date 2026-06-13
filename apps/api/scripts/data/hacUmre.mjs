export const hacUmre = {
  key: 'hac-umre',
  label: 'Hac ve Umre Zikirleri',
  category: 'ibadet',
  description: 'Hac ve umre ibadetlerinde okunacak dualar.',
  dhikrItems: [
    {
      key: 'hac-telbiye',
      nameArabic:
        'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ',
      nameTurkish: 'Telbiye',
      transliteration:
        `Lebbeyk Allàhümme lebbeyk, lebbeyk lâ şerîke leke lebbeyk, innel hamde venni'mete leke velmülk, lâ şerîke lek.`,
      meaning:
        `Emrine boyun eğdim Allahım, emrine boyun eğdim. Senin eşin ve ortağın yoktur, bütün varlığımla sana yöneldim. Hamd senin, nimet senin, mülk senindir. Senin eşin ve ortağın yoktur.`,
      virtue:
        `Telbiye, ihrâma girişle birlikte hac ve umrenin çağrısına verilen ilk ve en köklü cevaptır. "Lebbeyk" sözcüğü "emrindeyim, hazırım, buyur" anlamında bir teslimiyeti dile getirir; köklü Arapçada bu denli derin bir boyun eğiş ifadesi nadirdir. Resûlullah (sas) ihrâma girerken bu telbiyeyi okudu; sahabîler de onu izledi. Hz. Peygamber, telbiye getiren kimsenin yanındaki her taş, ağaç ve toprağın da onunla birlikte telbiye getirdiğini müjdeledi. Ayrıca telbiye sesini bir an için kesen kişinin o anki faziletten yoksun kaldığını belirtti. İhrâma girdikten sonra her fırsatta — yüksek yere çıkınca, aşağı inince, yeni bir yere gelince, namazlardan sonra — tekrarlanır; Akabe cemresine taş atılıncaya dek (veya umrede Hacerülesved'i selâmlayana dek) devam edilir.`,
      source: `Buhârî, Hac, 26 (1549); Müslim, Hac, 19 (1184)`,
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
      nameTurkish: 'Tavaf Başlangıcı (Hacerülesved Karşısında)',
      transliteration:
        `Bismillâhi vallâhü ekber. Allàhümme îmânen bike, ve tasdîken bikitâbike, ve vefâen biahdike, vettibâen lisünneti nebiyyike Muhammedin sallallahu aleyhi ve sellem.`,
      meaning:
        `Allah'ın ismiyle başlarım. Allah en büyüktür. Allahım! Sana îmân ederek, kitâbını tasdîk ederek, ezelde sana verdiğim sözü tutarak ve peygamberin Hz. Muhammed'in sünnetine uyarak tavaf ediyorum.`,
      virtue:
        `Tavaf yalnızca fiziksel bir hareket değil, dört temel ikrarın cisimleşmiş hâlidir: imân (sana inanıyorum), tasdîk (kitabını doğruluyorum), vefâ (ahdimi tutuyorum), ittibâ (sünnetine uyuyorum). Her adım bu dört değeri yeniler. Hacerülesved'i ilk kez selâmlarken, her şavtın başında ve ortasında söylenmesi müstehaptır. Tavaf edemeyen kişi, izdiham nedeniyle yalnızca bakışla selâm vererek başlangıç zikrini söyleyebilir.`,
      source: `İbn Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 451; Beyhakî, es-Sünenü'l-Kübrâ, 5/79`,
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
      nameTurkish: 'Makbul Hac Duası (Tavafın İlk Üç Şavtında)',
      transliteration:
        `Allâhümmec'alhü haccen mebrûren, ve zenben mağfûren, ve sa'yen meşkûren.`,
      meaning:
        `Allahım! Bu haccı makbûl bir hac eyle, günahımı affeyle, gayretimi boşa çıkarma.`,
      virtue:
        `Bu dua, haccın üç ana amacını özetler: "haccen mebrûren" (Allah katında makbul, günahtan arınmış), "zenben mağfûren" (geçmiş günahlardan temizlenmiş), "sa'yen meşkûren" (emek ve ihlâsın karşılığını bulmuş). Resûlullah (sas): "Mebrûr hac için cennet dışında bir karşılık yoktur" buyurdu. Tavafın remel yapılan ilk üç şavtında okunması İmâm Şâfiî tarafından tavsiye edilmiştir. Son dört şavtta ise "Rabbenâ âtinâ fiddünyâ haseneten" ağırlıklı okunur; bu iki dua birbirini tamamlar.`,
      source: `Şâfiî, el-Üm, 2/174; Beyhakî, es-Sünenü'l-Kübrâ, 5/90`,
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
      key: 'hac-safa-zikri',
      nameArabic:
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ أَنْجَزَ وَعْدَهُ وَنَصَرَ عَبْدَهُ وَهَزَمَ الْأَحْزَابَ وَحْدَهُ',
      nameTurkish: 'Safâ Tepesi Zikri',
      transliteration:
        `Allâhü ekber, Allâhü ekber, Allâhü ekber, ve lillâhil hamdü. Lâilâhe illallàhu vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü yuhyî ve yümît, vehüve alâ külli şey'in kadîr. Lâilâhe illallàhu enceze va'dehû ve nasara abdehû ve hezemel ahzâbe vahdehû. Lâilâhe illallàh, velâ na'büdü illâ iyyâhu, muhlisîne lehüd dîne velev kerihel kâfirûn.`,
      meaning:
        `Allah en büyüktür (x3). Hamd Allah'a mahsustur. Allah'tan başka ilâh yoktur; O tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur. O diriltir ve öldürür; O her şeye kâdirdir. Allah'tan başka ilâh yoktur. O vaadini gerçekleştirdi, kuluna yardım etti, düşman topluluklarını tek başına perîşan etti. Allah'tan başka ilâh yoktur. Biz sadece O'na ibadet ederiz; kâfirler hoşlanmasa da, bütün samimiyetimizle sadece O'na ibadet ederiz.`,
      virtue:
        `Resûlullah (sas) Safâ tepesine çıkınca Kâbe'ye döner, tekbîr getirir ve bu uzun zikri üç kez okudu; ardından da dua etti. Tüm bu süreç üç kez tekrarlandı. Safâ zikrinin özünde zafer ilanı yatar: Mekke'nin fethini hatırlatan "hezemel ahzâbe vahdehû" ifadesi, Allah'ın yardımının insanlık tarihinin en zorlu anlarında bile gerçekleştiğini hatırlatır. "Enceze va'dehû" (vaadini gerçekleştirdi) ise bu imanı her tekbirde yeniler. Safâ'dan Merve'ye her geçişte tekrarlanır (toplam 7 şavt boyunca).`,
      source: `Müslim, Hac, 147 (1218); Nesâî, Menâsik, 173`,
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
      key: 'hac-arefe-zikri',
      nameArabic:
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      nameTurkish: 'Arafât Zikri (Arefe Günü)',
      transliteration:
        `Lâilâhe illallâhu vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü ve hüve alâ külli şey'in kadîr.`,
      meaning:
        `Allah'tan başka ilâh yoktur; yalnız Allah vardır, O tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur. O her şeye kâdirdir.`,
      virtue:
        `Resûlullah (sas) şöyle buyurdu: "En hayırlı duâ, arefe günü yapılan duâdır. Benim ve benden önceki peygamberlerin söylediği en hayırlı söz şudur: Lâilâhe illallâhu vahdehû lâ şerîke leh..." Bu zikir, haccın kalbinde — bütün ümmetin bir arada olduğu Arafât meydanında — dilden dilden dolaşır. Mâlik'in Muvatta'ında, İslâm öncesi dönemde de Arafât'ta bu sözün söylendiği nakledilir. Arefe gününde çok tekrar edilmesi, Arafât'a gidemeyen Müslümanların da o günün havasına ortak olması için tavsiye edilir; zira Hz. Peygamber arefe gününün orucunun önceki yılın günahlarını örteceğini bildirmiştir.`,
      source: `Tirmizî, Deavât, 123 (3585); Mâlik, Muvatta', Hac, 246; İbn Mâce, Menâsik, 56 (3003)`,
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
      key: 'hac-mekke-hareminde',
      nameArabic:
        'اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ فَحَرِّمْنِي عَلَى النَّارِ وَأَمِّنِّي مِنْ عَذَابِكَ يَوْمَ تَبْعَثُ عِبَادَكَ وَاجْعَلْنِي مِنْ أَوْلِيَائِكَ وَأَهْلِ طَاعَتِكَ',
      nameTurkish: 'Mekke Haremîne Varınca Dua',
      transliteration:
        `Allàhümme hâzâ haremüke ve emnüke, feharrimnî alen nâri, ve emminnî min azâbike yevme teb'asü ibâdeke, vec'alnî min evliyâike ve ehli tâatike.`,
      meaning:
        `Allahım! Burası senin harem ve emniyet bölgendir. Beni cehenneme haram kıl, kullarını yeniden dirilteceğin günde beni azabından emniyette eyle. Beni dostlarından ve sana itâat eden kullarından eyle.`,
      virtue:
        `Mekke'nin haremîne girişin ilk anı, tüm hac ve umrenin en beklenen kavuşma anlarından biridir. Bu dua, kişi o eşiği geçerken haremin kudsiyetini ve kişinin neden orada bulunduğunu hatırlatır. Üç dilekte bulunur: cehennemden uzak tutulma, kıyamet günü emân, Allah'ın dostları arasına katılma. Haremin sınırlarına varınca (Mekke girişinde) okunur; ardından kişi dilediği duaya devam eder.`,
      source: `İbn Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 508; Beyhakî, Şuabü'l-İmân, 3/451`,
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
