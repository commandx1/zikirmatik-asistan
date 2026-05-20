const keyMap = {
  VAHDEHU_LA: 'VAHDEHU_LA',
  TESRIK_TEKBIRI: 'TESRIK_TEKBIRI',
  HASBIYE: 'HASBIYE',
  LEKEL_HAMD: 'LEKEL_HAMD',
  IHLAS: 'IHLAS',
  SALAVAT_SERIF: 'SALAVAT-I ŞERİFE',
  ISTIGFAR: 'ISTIGFAR',
  YA_HAYYU_YA_KAYYUM: 'YA_HAYYU_YA_KAYYUM',
  TEVHID: 'TEVHID',
  NUR: 'NUR',
  HZYUSUF: 'HZYUSUF',
  RIZIK_EBU_UMAME: 'RIZIK_EBU_UMAME',
};

const SOURCE_DATASETS = [
  {
    key: 'zilhicce-ilk-10',
    label: 'Zilhicce İlk 10 Gün 2026',
    dhikrItems: [
      {
        key: keyMap.VAHDEHU_LA,
        nameArabic:
          'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        nameTurkish: 'Lâ ilâhe illallâhu vahdehû lâ...',
        transliteration:
          'Lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül mülkü ve lehül hamdü yuhyî ve yumîtü biyedihil hayr. Ve hüve alâ külli şey’in kadîr.',
        meaning:
          "Allah'tan başka ilah yoktur, O tektir, ortağı yoktur. Mülk O'nundur, hamd O'nadır. Diriltir ve öldürür; hayır O'nun elindedir.",
        virtue:
          'Tevhid şuurunu güçlendirir, kurban ve teslimiyet bilincini derinleştirir.',
        source: 'Zilhicce fazileti rivayetleri',
        tags: ['zilhicce', 'tevhid', 'bes-hediye'],
        categories: ['zilhicce', 'ozel-gun'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'iman',
          'teslimiyet',
          'huzur',
          'tevekkül',
          'mağfiret',
          'farkındalık',
        ],
      },
      {
        key: keyMap.LEKEL_HAMD,
        nameArabic:
          'اللّٰهُمَّ لَكَ الْحَمْدُ كَالَّذِي نَقُولُ وَخَيْرًا مِمَّا نَقُولُ اللّٰهُمَّ لَكَ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي وَإِلَيْكَ مَآبِي وَلَكَ رَبِّ تُرَاثِي اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ وَوَسْوَسَةِ الصَّدْرِ وَشَتَاتِ الْأَمْرِ اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ مَا تَجِيءُ بِهِ الرِّيحُ',
        nameTurkish: 'Allâhümme lekel hamdü Duası',
        transliteration:
          'Allahümme lekel hamdü kellezî nekûlü ve hayran mimmâ nekûl. Allahümme leke salâtî ve nüsükî ve mahyâye ve memâtî ve ileyke meâbî ve leke rabbî türâsî. Allahümme innî eûzü bike min azâbi’l-kabri ve vesveseti’s-sadri ve şetâti’l-emri. Allahümme innî eûzü bike min şerri mâ tecîü bihi’r-rîhu.',
        meaning:
          "Allah'ım! Senin buyurduğun gibi ve bizim söylediğimizden daha hayırlı biçimde sana hamdolsun. Allah'ım namazım, tüm ibadetlerim, hayatım ve ölümüm senin içindir. Dönüşüm sanadır. Her türlü varlığım (mirasım) sana kalacaktır. Allah'ım kabir azabından, kalbimin vesvesesinden ve işlerimin dağınıklığından sana sığınırım. Allah'ım rüzgarın getireceği afetlerin şerrinden sana sığınırım.",
        virtue:
          '“Allahümme lekel hamd” zikri, insanın kendi sınırlılığını fark ederek tüm övgünün Allah’a ait olduğunu kabul etmesini öğretir. Bu dua, hayatın merkezini dağınık arzular yerine ilahi bir hedef etrafında toplamayı amaçlar. Kişiye, namazının, emeğinin, hayatının ve hatta ölümünün bile anlamlı bir bütünün parçası olduğunu hatırlatır. Vesvese, iç sıkışması ve zihinsel karmaşa karşısında manevi bir sığınak görevi görür. Dünya nimetlerinin geçici olduğunu hatırlatarak aşırı hırs ve kontrol arzusunu yumuşatır. İnsanı şikâyet yerine hamde, korku yerine teslimiyete yönlendirir. “Şetâtü’l-emr” yani işlerin dağılması hâlinden Allah’a sığınmak, zihinsel odak ve iç düzen arayışını ifade eder. Bu zikir, kulun kendi gücüne değil Allah’ın rahmetine dayanmayı öğrenmesidir. Düzenli okunduğunda kişide sükûnet, tevazu ve manevi denge hissi oluşturabilir. Özünde bu dua, insanı dağınıklıktan bütünlüğe ve geçicilikten hakikat bilincine taşıyan bir teslimiyet duasıdır.',
        source: 'Zilhicce fazileti rivayetleri',
        tags: ['zilhicce', 'dua', 'teslimiyet', 'hamd'],
        categories: ['zilhicce', 'ozel-gun'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: [
          'dua',
          'teslimiyet',
          'huzur',
          'adanmışlık',
          'sığınma',
          'hayat düzeni',
          'vesveseden kurtulma',
          'mal kaygısı',
        ],
      },
      {
        key: keyMap.IHLAS,
        nameArabic:
          'قُلْ هُوَ اللّٰهُ أَحَدٌ اَللّٰهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
        nameTurkish: 'İhlas Suresi',
        transliteration:
          'Kul hüvellâhu ehad. Allâhüssamed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
        meaning:
          'De ki: O Allah tektir. Allah Samed’dir. Doğurmamış ve doğurulmamıştır. Hiçbir şey O’na denk değildir.',
        virtue:
          'İhlâs Suresi, tevhidin en saf ve özlü ifadelerinden biri olarak insanın kalbini yalnızca Allah’a yöneltmeyi öğretir. Bu sure, Allah’ın birliğini, benzersizliğini ve hiçbir şeye muhtaç olmadığını güçlü bir şekilde ilan eder. Düzenli okunması, kişinin iç dünyasında sadeleşme ve manevi berraklık hissi oluşturabilir. İnsanı sahte dayanaklardan uzaklaştırıp gerçek güvenin yalnızca Allah’ta olduğunu hatırlatır. Kısa olmasına rağmen taşıdığı anlam derinliği nedeniyle Kur’an’ın özünü yansıtan surelerden biri kabul edilmiştir. Kalpteki korku, bağımlılık ve aşırı dünyevî bağları yumuşatarak teslimiyet duygusunu güçlendirebilir. Zihni dağınıklıktan çıkarıp tek hakikate odaklanmaya yardımcı olur. Manevi gelenekte, samimiyetle okunmasının kalbi arındırdığı ve kişinin iman şuurunu kuvvetlendirdiği ifade edilmiştir. İhlâs Suresi, insanı yalnızca Allah’ın huzurunda değer aramaya çağıran güçlü bir tevhid manifestosu gibidir. Özünde bu sure, kulun kalbini çokluktan birliğe ve geçici bağlardan ebedi hakikate yöneltir.',
        source: 'Arefe günü fazilet rivayetleri',
        tags: ['zilhicce', 'arefe', 'ihlas'],
        categories: ['zilhicce', 'ozel-gun'],
        timeOfDay: 'any',
        recommendedCount: 1000,
        suitableFor: [
          'dua-kabulu',
          'magfiret',
          'tevhid',
          'iman-tazeleme',
          'allah-sevgisi',
          'iman-guclendirme',
          'manevi-huzur',
        ],
      },
      {
        key: keyMap.ISTIGFAR,
        nameArabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
        nameTurkish: 'İstiğfar ve Tövbe',
        transliteration: 'Estağfirullâhel azîme ve etûbü ileyh.',
        meaning: "Azim olan Allah'tan mağfiret dilerim ve O'na tövbe ederim.",
        virtue:
          'Kulun Allah’a yönelişini ve samimi tevbesini ifade eden güçlü bir istiğfardır. Bu zikri düzenli okumak, kalbin manevi yüklerden arınmasına ve huzur bulmasına vesile olur. Günahların bağışlanmasını istemekle birlikte, kişiyi daha dikkatli ve bilinçli bir hayata yönlendirir. İstiğfar, insanın iç dünyasında tevazu, teslimiyet ve kulluk bilincini güçlendirir. Rivayetlerde istiğfarın rızkın artmasına, sıkıntıların hafiflemesine ve gönül ferahlığına vesile olduğu bildirilmiştir. Bu zikir, kalbi gafletten uyandırarak Allah’ı daha çok hatırlamaya yardımcı olur. Düzenli istiğfar eden kişi, manevi olarak kendini yenilenmiş ve umut dolu hissedebilir. Aynı zamanda sabrı, şükrü ve iç huzuru destekleyen manevi bir alışkanlık oluşturur. Tevbe ile birlikte okunduğunda, kişinin geçmiş hatalarından ders almasına ve daha güzel bir ahlaka yönelmesine katkı sağlar. Bu istiğfar, Allah’ın rahmetine sığınmanın ve O’na yakınlaşma arzusunun özlü bir ifadesidir.',
        source: 'Tirmizi, Deavat',
        tags: ['zilhicce', 'istigfar', 'tevbe', 'arefe'],
        categories: ['zilhicce', 'ozel-gun'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'magfiret',
          'tevbe',
          'gunahlarin-bagislanmasi',
          'manevi-arınma',
          'kalp-huzuru',
          'gonul-ferahligi',
          'pismanlik',
          'nefis-terbiyesi',
          'allah-a-yaklasma',
          'gafletten-uyanış',
          'rahmet-talebi',
          'dua-kabulu',
          'umut',
          'sikintidan-kurtulus',
        ],
      },
      {
        key: keyMap.YA_HAYYU_YA_KAYYUM,
        nameArabic:
          'يَا حَيُّ يَا قَيُّومُ يَا بَدِيعَ السَّمَاوَاتِ وَالْأَرْضِ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        nameTurkish: 'Yâ Hayyû yâ Kayyûm...',
        transliteration:
          "Yâ Hayyû yâ Kayyûm, yâ bedî'as-semâvâti ve'l-ardı, yâ ze'l-celâli ve'l-ikrâm.",
        meaning:
          'Ey Hayy ve Kayyûm olan Allahım, ey gökleri ve yeri örneksiz yaratan, ey celal ve ikram sahibi.',
        virtue:
          'Kalbi gafletten korumaya, manevi diriliği canlı tutmaya ve bayram günlerinde iç huzuru güçlendirmeye vesile olur.',
        source: 'Bayram günleri kalp diriliği duaları',
        tags: ['zilhicce', 'bayram', 'dua', 'hayy', 'kayyum'],
        categories: ['zilhicce', 'ozel-gun', 'bayram', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['kalp-huzuru', 'gafletten-korunma', 'bayram-gunleri'],
      },
      {
        key: keyMap.NUR,
        nameArabic:
          'اللّٰهُمَّ اجْعَلْ فِي قَلْبِي نُورًا وَفِي بَصَرِي نُورًا وَفِي سَمْعِي نُورًا وَعَنْ يَمِينِي نُورًا وَعَنْ يَسَارِي نُورًا وَفَوْقِي نُورًا وَتَحْتِي نُورًا وَأَمَامِي نُورًا وَخَلْفِي نُورًا وَاجْعَلْ لِي نُورًا',
        nameTurkish: 'Nur Duası',
        transliteration:
          'Allâhümmec’al fî kalbî nûrâ ve fî basarî nûrâ, ve fî sem’î nûrâ ve ‘an yemînî nûrâ ve ‘an yesârî nûrâ ve fevkî nûrâ ve tahtî nûrâ ve emâmî nûrâ ve halfî nûrâ, vec’allî nûrâ.',
        meaning:
          'Allah’ım! Kalbime büyük bir nûr ver; gözüme bir nûr, kulağıma bir nûr ver; sağıma bir nûr, soluma bir nûr ver; üstüme bir nûr, altıma bir nûr ver; önüme bir nûr, arkama bir nûr ver; bana büyük bir nûr ihsân eyle!',
        virtue:
          'Kalbi, zihni ve duyuları ilahi nur bilinciyle kuşatma duasıdır. İçsel karanlık, gaflet ve yön kaybı yaşayan dönemlerde ruhu toparlamaya yardımcı olur. Basireti güçlendirir, doğruyu seçme ve olayları hikmetle değerlendirme kabiliyetini artırır. Günlük zikirde devam edildiğinde manevi odak, iç huzur ve teslimiyet duygusunu derinleştirir.',
        source: 'Buhârî, Deavât, 9; Müslim, Müsâfirîn, 181',
        tags: ['zilhicce', 'arefe', 'nur', 'dua', 'basiret', 'hidayet', 'kalp'],
        categories: ['zilhicce', 'ozel-gun', 'arefe', 'dua', 'manevi-gelisim'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'basiret',
          'huzur',
          'farkindalik',
          'gafletten-uyanis',
          'zihinsel-berraklik',
          'manevi-aydınlanma',
          'içsel-yön-bulma',
        ],
      },
    ],
    specialDays: [
      {
        name: '1 Zilhicce',
        type: 'özel gün',
        date: '2026-05-18',
        hijriDate: '1 Zilhicce 1447',
        description: 'Niyet ve tevhid günü. Zikre güçlü bir başlangıç.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 1,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.VAHDEHU_LA, keyMap.TEKBIR, keyMap.SALAVAT_SERIF],
      },
      {
        name: '2 Zilhicce',
        type: 'özel gün',
        date: '2026-05-19',
        hijriDate: '2 Zilhicce 1447',
        description: 'Samediyet ve teslimiyetin tefekkürü.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 2,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.VAHDEHU_LA, keyMap.TEKBIR, keyMap.ISTIGFAR],
      },
      {
        name: '3 Zilhicce',
        type: 'özel gün',
        date: '2026-05-20',
        hijriDate: '3 Zilhicce 1447',
        description: 'Hayy olan Rabbe yöneliş ve tevekkül pratiği.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 3,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.VAHDEHU_LA, keyMap.TEKBIR, keyMap.SALAVAT_SERIF],
      },
      {
        name: '4 Zilhicce',
        type: 'özel gün',
        date: '2026-05-21',
        hijriDate: '4 Zilhicce 1447',
        description: 'Hasbiye ile kalbi dünyalık endişeden arındırma.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 4,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.HASBIYE, keyMap.ISTIGFAR, keyMap.TEKBIR],
      },
      {
        name: '5 Zilhicce',
        type: 'özel gün',
        date: '2026-05-22',
        hijriDate: '5 Zilhicce 1447',
        description: 'Kapsamlı teslimiyet duası ve şükür bilinci.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 5,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.LEKEL_HAMD, keyMap.SALAVAT_SERIF, keyMap.TEKBIR],
      },
      {
        name: '6 Zilhicce',
        type: 'özel gün',
        date: '2026-05-23',
        hijriDate: '6 Zilhicce 1447',
        description: 'Tevhid tekrarları ile kalpte sebat oluşturma.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 6,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.VAHDEHU_LA, keyMap.ISTIGFAR],
      },
      {
        name: '7 Zilhicce',
        type: 'özel gün',
        date: '2026-05-24',
        hijriDate: '7 Zilhicce 1447',
        description: 'Tehlil ve hasbiye ile iç huzuru güçlendirme.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 7,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.VAHDEHU_LA, keyMap.HASBIYE, keyMap.SALAVAT_SERIF],
      },
      {
        name: '8 Zilhicce',
        type: 'özel gün',
        date: '2026-05-25',
        hijriDate: '8 Zilhicce 1447',
        description: 'Arefe hazırlığı: istiğfar, tekbir ve niyet tazeleme.',
        eventKey: 'zilhicce-ilk-on-1447',
        dayIndex: 8,
        dayCount: 10,
        priority: 140,
        dhikrKeys: [keyMap.ISTIGFAR, keyMap.TEKBIR, keyMap.VAHDEHU_LA],
      },
    ],
  },
  {
    key: 'kurban-bayrami-2026',
    label: 'Kurban Bayramı 2026',
    dhikrItems: [
      {
        key: keyMap.TESRIK_TEKBIRI,
        nameArabic:
          'اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ لاَ إِلٰهَ إِلاَّ اللّٰهُ وَاللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ وَلِلّٰهِ الْحَمْدُ',
        nameTurkish: 'Teşrik Tekbiri',
        transliteration:
          'Allâhu ekber Allâhu ekber. Lâ ilâhe illallâhu vallâhu ekber. Allâhu ekber ve lillâhil-hamd.',
        meaning:
          "Allah en büyüktür. Allah en büyüktür. Allah'tan başka ilah yoktur. Allah en büyüktür. Hamd Allah'adır.",
        virtue:
          'Teşrik günlerinde farz namazların ardından tekbir getirmek bayram şuurunu canlı tutar.',
        source: 'Teşrik tekbirleri geleneği',
        tags: [
          'kurban-bayrami',
          'tesrik',
          'tekbir',
          'gönle huzur',
          'kalbe sevinç',
          'ilahî şükür',
        ],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 23,
        suitableFor: ['bayram günleri', 'cemaat sonrası zikir', ''],
      },
      {
        key: 'bayram-tesbih-300',
        nameArabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ',
        nameTurkish: 'Tesbih Zikri',
        transliteration: 'Sübhânallâhi ve bi-hamdihî.',
        meaning: "Allah'ı noksan sıfatlardan tenzih eder ve O'na hamd ederim.",
        virtue:
          'Kalbi arındırır, şükür duygusunu artırır ve bayram günlerinde manevi dengeyi destekler. Bayram günü 300 kere okunup ölmüşlerin ruhuna bağışlandığında her müminin kabrine bin nur girer, okuyan kişi vefat ettiğinde de kabrine bin nur verilir.',
        source: 'Bayram sabahı tavsiye tesbihat',
        tags: [
          'kurban-bayrami',
          'tesbih',
          'hastalıktan korunma',
          'rızık ve bereket',
          'korku ve vesvese tedavisi',
        ],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'morning',
        recommendedCount: 300,
        suitableFor: ['bayram sabahı', 'tesbihat'],
      },
      {
        key: 'bayram-istigfar-100',
        nameArabic: 'أَسْتَغْفِرُ اللّٰهَ',
        nameTurkish: 'Estağfirullâh',
        transliteration: 'Estağfirullâh.',
        meaning: "Allah'tan bağışlanma dilerim.",
        virtue:
          'İbadetlerdeki eksiklikler için tevbe bilincini güçlendirir ve kalpte arınma sağlar.',
        source: 'Bayram günü istiğfar tavsiyesi',
        tags: ['kurban-bayrami', 'istigfar', 'tevbe'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['bayram günü', 'tevbe'],
      },
      {
        key: 'kurban-sukru-duasi',
        nameArabic:
          'اللّٰهُمَّ لَكَ الْحَمْدُ كُلُّهُ وَلَكَ الشُّكْرُ كُلُّهُ وَإِلَيْكَ يُرْجَعُ الْأَمْرُ كُلُّهُ',
        nameTurkish: 'Şükür Duası',
        transliteration:
          'Allâhümme lekel-hamdü küllühû ve lekeş-şükrü küllühû ve ileyke yürceul-emru küllühû.',
        meaning:
          "Allah'ım, hamdin bütünü Sana aittir, şükrün bütünü Sana aittir, bütün işler Sana döner.",
        virtue:
          'Kurban ibadetini şükür ve teslimiyet boyutuyla tamamlar, nimetin sahibini hatırlatır.',
        source: 'Kurban ibadeti sonrası şükür duaları',
        tags: ['kurban-bayrami', 'şükür', 'dua'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['kurban kesimi sonrası', 'şükür', 'hamd'],
      },
      {
        key: keyMap.SALAVAT_SERIF,
        nameArabic: 'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ',
        nameTurkish: 'Salavat-ı Şerife',
        transliteration: 'Allâhümme salli alâ seyyidinâ Muhammed.',
        meaning: "Allah'ım, Efendimiz Muhammed'e salat eyle.",
        virtue:
          'Salavat-ı Şerife, kalbi Resûlullah sevgisiyle dirilten en bereketli zikirlerdendir. Kişiye manevi huzur, gönül ferahlığı ve iç sükûnet kazandırır. Peygamber Efendimiz’e yapılan her salavatın rahmet kapılarını açtığı rivayet edilmiştir. Salavat, duaların kabulüne vesile olan kıymetli ameller arasında görülür. Sürekli salavat getiren kimsenin kalbi yumuşar, dili güzelleşir ve manevi bağı kuvvetlenir. Sıkıntı anlarında salavat okumak, kalbe teselli ve umut verir. Günahlara kefaret ve derecelerin yükselmesine vesile olduğu bildirilmiştir. Salavat, kişinin hayatına bereket ve nur katan bir ibadet olarak kabul edilir. Meleklerin salavat ehline dua ettiği ve rahmetle yaklaştığı rivayet edilir. Resûlullah’a sevgiyle getirilen her salavat, müminin kalbini Allah’a daha yakın hâle getirir.',
        source: 'Salavat fazileti rivayetleri',
        tags: ['kurban-bayrami', 'salavat'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'gün boyu',
          'namaz sonrası',
          'peygamber sevgisi',
          'manevi huzur',
          'dua öncesi',
          'dua kabulü',
          'kalp huzuru',
          'bereket',
          'rahmet',
          'şefaat ümidi',
          'manevi yakınlık',
          'iç ferahlığı',
          'cuma günü',
          'salih amel',
          'sünnete bağlılık',
          'manevi güçlenme',
        ],
      },
      {
        key: 'hasbiye-zikri-100',
        nameArabic: 'حَسْبِيَ اللّٰهُ وَنِعْمَ الْوَكِيلُ',
        nameTurkish: 'Hasbiye Zikri',
        transliteration: "Hasbiyallâhu ve ni'mel-vekîl.",
        meaning: 'Allah bana yeter, O ne güzel vekildir.',
        virtue:
          'Tevekkül bilincini artırır, endişe ve dağınıklık halinde kalbi dengelemeye yardımcı olur.',
        source: 'Tevekkül zikirleri',
        tags: ['kurban-bayrami', 'tevekkül', 'hasbiye'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['gün boyu', 'zorlanma anları'],
      },
      {
        key: keyMap.HASBIYE,
        nameArabic:
          'حَسْبِيَ اللّٰهُ وَكَفَى سَمِعَ اللّٰهُ لِمَنْ دَعَا لَيْسَ وَرَاءَ اللّٰهِ مُنْتَهَى',
        nameTurkish: 'Tevekkül ve Hasbiye Zikri',
        transliteration:
          'Hasbiyallâhu ve kefâ. Semiallâhu limen deâ. Leyse verâ-allâhi müntehâ.',
        meaning:
          "Allah bana yeter ve kâfidir. Allah dua edeni işitir. Allah'tan öte varılacak bir son yoktur.",
        virtue:
          "Tevekkül bilincini derinleştirir; kalpte emniyet ve teslimiyet hissini artırır. Rivayette Cebrâil'in Hz. Îsâ'ya öğrettiği zikirlerdendir.",
        source: "Hasbiye rivayetleri (Cebrâil'in Hz. Îsâ'ya öğrettiği zikir)",
        tags: ['kurban-bayrami', 'hasbiye', 'tevekkül', 'dua'],
        categories: ['özel gün', 'bayram', 'dua', 'tevekkül'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'tevekkül',
          'endişe anları',
          'rahmet talebi',
          'korunma',
          'sükunet',
        ],
      },
      {
        key: 'rabbi-inni-messeni-100',
        nameArabic:
          'رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
        nameTurkish: 'Hz. Eyyub Duası',
        transliteration: 'Rabbi innî messeniyed-durru ve ente erhamur-râhimîn.',
        meaning:
          'Rabbim, bana dert dokundu; Sen merhametlilerin en merhametlisisin.',
        virtue:
          'Sabır, sığınma ve rahmet talebini güçlendirir; sıkıntılı dönemlerde umut ve teslimiyet verir.',
        source: 'Enbiya Suresi 83',
        tags: ['kurban-bayrami', 'dua', 'sabır'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['zorluk anları', 'dua vakitleri'],
      },
    ],
    specialDays: [
      {
        name: 'Kurban Bayramı Arefe Günü',
        type: 'özel gün',
        date: '2026-05-26',
        hijriDate: '9 Zilhicce 1447',
        description: 'Arefe Günü (Tevbe, Dua ve Tevhid Yoğunluğu)',
        eventKey: 'kurban-bayrami-2026',
        dhikrKeys: [keyMap.IHLAS, keyMap.VAHDEHU_LA, keyMap.ISTIGFAR],
      },
      {
        name: 'Kurban Bayramı',
        type: 'bayram',
        date: '2026-05-27',
        hijriDate: '10 Zilhicce 1447',
        description:
          'Kurban Bayramı 1. Gün (Bayram Sabahı ve Teşrik Başlangıcı)',
        eventKey: 'kurban-bayrami-2026',
        dayIndex: 1,
        dayCount: 4,
        dhikrKeys: [
          keyMap.TESRIK_TEKBIRI,
          keyMap.VAHDEHU_LA,
          'bayram-tesbih-300',
          'bayram-istigfar-100',
          keyMap.YA_HAYYU_YA_KAYYUM,
          'kurban-sukru-duasi',
        ],
      },
      {
        name: 'Kurban Bayramı',
        type: 'bayram',
        date: '2026-05-28',
        hijriDate: '11 Zilhicce 1447',
        description: 'Kurban Bayramı 2. Gün (Tevhid, Salavat ve Tevekkül Günü)',
        eventKey: 'kurban-bayrami-2026',
        dayIndex: 2,
        dayCount: 4,
        dhikrKeys: [
          keyMap.TESRIK_TEKBIRI,
          keyMap.SALAVAT_SERIF,
          'hasbiye-zikri-100',
          keyMap.HASBIYE,
          keyMap.VAHDEHU_LA,
          'bayram-istigfar-100',
          keyMap.YA_HAYYU_YA_KAYYUM,
        ],
      },
      {
        name: 'Kurban Bayramı',
        type: 'bayram',
        date: '2026-05-29',
        hijriDate: '12 Zilhicce 1447',
        description: 'Kurban Bayramı 3. Gün (Sabır, Dua ve Arınma Günü)',
        eventKey: 'kurban-bayrami-2026',
        dayIndex: 3,
        dayCount: 4,
        dhikrKeys: [
          keyMap.TESRIK_TEKBIRI,
          keyMap.VAHDEHU_LA,
          keyMap.NUR,
          'bayram-istigfar-100',
          keyMap.SALAVAT_SERIF,
          keyMap.YA_HAYYU_YA_KAYYUM,
        ],
      },
      {
        name: 'Kurban Bayramı',
        type: 'bayram',
        date: '2026-05-30',
        hijriDate: '13 Zilhicce 1447',
        description: 'Kurban Bayramı 4. Gün (Kapanış ve Teşrik Tamamlama Günü)',
        eventKey: 'kurban-bayrami-2026',
        dayIndex: 4,
        dayCount: 4,
        dhikrKeys: [
          keyMap.TESRIK_TEKBIRI,
          keyMap.TEVHID,
          'hasbiye-zikri-100',
          keyMap.HASBIYE,
          keyMap.SALAVAT_SERIF,
          'bayram-istigfar-100',
          keyMap.YA_HAYYU_YA_KAYYUM,
        ],
      },
    ],
  },
  {
    key: 'mevlid-kandili-2026',
    label: 'Mevlid Kandili 2026',
    dhikrItems: [
      {
        key: 'mevlid-salavat-1000',
        nameArabic:
          'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
        nameTurkish: 'Mevlid Salavatı',
        transliteration:
          'Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
        meaning: "Allah'ım, Efendimiz Muhammed'e ve O'nun aline salat eyle.",
        virtue:
          'Peygamber sevgisini güçlendirir, kalpte muhabbet ve bağlılığı artırır.',
        source: 'Salavat fazileti rivayetleri',
        tags: ['mevlid-kandili', 'salavat', 'peygamber-sevgisi'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 1000,
        suitableFor: ['kandil gecesi', 'mevlid programı', 'peygamber sevgisi'],
      },
      {
        key: 'mevlid-la-havle-100',
        nameArabic:
          'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
        nameTurkish: 'Lâ Havle Zikri',
        transliteration: 'Lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm.',
        meaning:
          'Güç ve kuvvet yalnızca yüce ve büyük olan Allahın yardımıyladır.',
        virtue:
          'Kulun acziyetini kabul ederek mutlak güç ve kudreti Allaha havale etmesini sağlar; tevekkül ve teslimiyet bilincini güçlendirir.',
        source: 'Havkale fazileti rivayetleri',
        tags: ['mevlid-kandili', 'havkale', 'tevekkül', 'teslimiyet'],
        categories: ['kandil', 'özel gün', 'tevekkül'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['acziyet bilinci', 'tevekkül', 'zorlanma anları'],
      },
      {
        key: 'mevlid-duha-suresi-50',
        nameArabic:
          'وَالضُّحَى وَاللَّيْلِ إِذَا سَجَى مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَى',
        nameTurkish: 'Duha Suresi',
        transliteration:
          'Ved-duhâ. Velleyli izâ secâ. Mâ veddeake rabbüke ve mâ kalâ.',
        meaning:
          'Kuşluk vaktine ve sükun bulmuş geceye andolsun. Rabbin seni terk etmedi ve sana darılmadı.',
        virtue:
          'Ümit, teselli ve rahmet vurgusunu güçlendirir; kalbe ferahlık ve teslimiyet kazandırır.',
        source: 'Duha Suresi',
        tags: ['mevlid-kandili', 'kuran', 'sure', 'teselli'],
        categories: ['kandil', 'özel gün', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 50,
        suitableFor: ['manevi ferahlık', 'tefekkür', 'kandil gecesi'],
      },
      {
        key: 'mevlid-seytandan-siginma-33',
        nameArabic:
          'أَعُوذُ بِاللّٰهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ رَبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَعُوذُ بِكَ رَبِّ أَنْ يَحْضُرُونِ',
        nameTurkish: 'Şeytanın Şerrinden Sığınma Duası',
        transliteration:
          'Eûzu billâhis-semîil-alîmi mineş-şeytânir-racîm. Rabbi eûzu bike min hemezâtiş-şeyâtîn. Ve eûzu bike rabbi en yahdurûn.',
        meaning:
          'İşiten ve bilen Allah’a kovulmuş şeytandan sığınırım. Rabbim, şeytanların vesveselerinden Sana sığınırım ve onların yanımda bulunmalarından da Sana sığınırım.',
        virtue:
          'Kalbi vesvese ve dağınıklıktan korumaya yardımcı olur; zikri huzurla sürdürmek için manevi korunma bilinci kazandırır. Obsesif kompulsif eğilimler, panik anındaki kontrol kaybı kaygısı ve zihne musallat olan tekrarlayıcı olumsuz düşüncelere (vesveselere) karşı zihnel bir kalkan işlevi görür.',
        source: 'Müminun 97-98',
        tags: ['mevlid-kandili', 'dua', 'korunma', 'siginma'],
        categories: ['kandil', 'özel gün', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: [
          'vesveseden korunma',
          'manevi korunma',
          'gece ibadeti',
          'panik',
        ],
      },
      {
        key: 'mevlid-sabir-ve-sebat-ayeti',
        nameArabic:
          'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا وَاتَّقُوا اللّٰهَ لَعَلَّكُمْ تُفْلِحُونَ صَدَقَ اللّٰهُ الْعَظِيمُ',
        nameTurkish: 'Sabır ve Sebat Ayeti',
        transliteration:
          'Bismillâhir-rahmânir-rahîm. Yâ eyyühellezîne âmenûsbirû ve sâbirû ve râbitû vettekullâhe lealleküm tüflihûn. Sadekallâhül-azîm.',
        meaning:
          'Ey iman edenler, sabredin, sabırda yarışın, hazırlıklı ve uyanık olun, Allahtan sakının ki kurtuluşa eresiniz.',
        virtue:
          'Sabır, sebat ve takva bilincini güçlendirir; kandil gecesinde nefis muhasebesine ve manevi diriliğe destek olur.',
        source: 'Âl-i İmran 200',
        tags: ['mevlid-kandili', 'kuran', 'ayet', 'sabir', 'takva'],
        categories: ['kandil', 'özel gün', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['sabır', 'sebat', 'manevi disiplin'],
      },
      {
        key: 'mevlid-salavat-emri-ayeti',
        nameArabic:
          'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ إِنَّ اللّٰهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا صَدَقَ اللّٰهُ الْعَظِيمُ',
        nameTurkish: 'Salavat Emri Ayeti',
        transliteration:
          'Bismillâhir-rahmânir-rahîm. İnnallâhe ve melâiketehû yüsallûne alen-nebiyy. Yâ eyyühellezîne âmenû sallû aleyhi ve sellimû teslîmâ. Sadekallâhül-azîm.',
        meaning:
          'Şüphesiz Allah ve melekleri Peygambere salat ederler. Ey iman edenler, siz de ona salat edin ve tam bir teslimiyetle selam verin.',
        virtue:
          'Peygambere salavat bilincini kuvvetlendirir; Mevlid Kandili gecesinde sünnete bağlılık ve muhabbeti artırır.',
        source: 'Ahzab 56',
        tags: [
          'mevlid-kandili',
          'kuran',
          'ayet',
          'salavat',
          'peygamber-sevgisi',
        ],
        categories: ['kandil', 'özel gün', 'kuran', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['salavat bilinci', 'peygamber sevgisi', 'kandil gecesi'],
      },
      {
        key: 'mevlid-salavat-sellim-barik-100',
        nameArabic:
          'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
        nameTurkish: 'Salavat-ı Şerife (Salli Sellim Barik)',
        transliteration:
          'Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
        meaning:
          "Allah'ım, Efendimiz Muhammed'e ve O'nun aline salat, selam ve bereket ihsan eyle.",
        virtue:
          'Peygamber sevgisini artırır, sünnete bağlılığı güçlendirir ve kalpte rahmet-bereket bilincini canlı tutar.',
        source: 'Salavat fazileti rivayetleri',
        tags: ['mevlid-kandili', 'salavat', 'bereket', 'peygamber-sevgisi'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['salavat', 'peygamber sevgisi', 'manevi bereket'],
      },
      {
        key: 'mevlid-rabbena-zalemna-100',
        nameArabic:
          'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
        nameTurkish: "Hz. Adem'in Duası",
        transliteration:
          'Rabbenâ zalemnâ enfüsenâ ve in lem tağfir lenâ ve terhamnâ le nekûnenne minel-hâsirîn.',
        meaning:
          'Rabbimiz, biz kendimize zulmettik. Eğer bizi bağışlamaz ve bize merhamet etmezsen mutlaka ziyan edenlerden oluruz.',
        virtue:
          'Tevbe, pişmanlık ve ilahi merhamet talebini derinleştirir; nefis muhasebesini güçlendirir.',
        source: 'Araf 23',
        tags: ['mevlid-kandili', 'dua', 'tevbe', 'merhamet'],
        categories: ['kandil', 'özel gün', 'dua', 'istigfar'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['tevbe', 'pişmanlık', 'merhamet talebi'],
      },
      {
        key: 'mevlid-rabbi-inni-messeni-100',
        nameArabic:
          'رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
        nameTurkish: "Hz. Eyyûb'un Duası",
        transliteration: 'Rabbi innî messeniyed-durru ve ente erhamür-râhimîn.',
        meaning:
          'Rabbim, şüphesiz bana bir zarar dokundu; Sen merhametlilerin en merhametlisisin.',
        virtue:
          'Sabrı, sığınmayı ve rahmet ümidini güçlendirir; sıkıntı anlarında kalbi teslimiyete yöneltir.',
        source: 'Enbiya 83',
        tags: ['mevlid-kandili', 'dua', 'sabir', 'rahmet'],
        categories: ['kandil', 'özel gün', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['sıkıntı anları', 'sabır', 'rahmet talebi'],
      },
      {
        key: 'mevlid-kema-lillahi-salavat-100',
        nameArabic:
          'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ عَدَدَ كَمَالِ اللّٰهِ وَكَمَا يَلِيقُ بِكَمَالِهِ',
        nameTurkish: 'Kema Lillahi Salavatı',
        transliteration:
          'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedin ve alâ âlihi adede kema-lillahi ve kema yeligu bikemâlih.',
        meaning:
          "Allah'ım, Efendimiz Muhammed'e ve aline Senin kemaline yaraşır şekilde salat, selam ve bereket ihsan eyle.",
        virtue:
          'Tek bir okunuşta yetmiş bin salavatın manevi sevabına eşdeğer kabul edilen salavat tertibidir.',
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'kemal', 'bereket'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['salavat hatmi', 'manevi bereket', 'peygamber sevgisi'],
      },
      {
        key: 'mevlid-delail-hayrat-dengi-100',
        nameArabic:
          'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ صَلَاةً تُعَادِلُ جَمِيعَ صَلَوَاتِ أَهْلِ مَحَبَّتِكَ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ سَلَامًا يُعَادِلُ سَلَامَهُمْ',
        nameTurkish: "Delailü'l-Hayrat Dengi Salavat",
        transliteration:
          "Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âlihi salâten te'dilü cemî'a salevâti ehli mehabbetike ve sellim alâ seyyidinâ Muhammedin ve alâ âlihi selâmen ya'dilü selâmehüm.",
        meaning:
          'Allahım, Efendimiz Muhammede ve aline, muhabbet ehlinin tüm salavatlarına denk bir salat; onların selamlarına denk bir selam eyle.',
        virtue:
          "Üç kez okunduğunda tüm muhabbet ehlinin salavatlarının toplamına ve Delailü'l-Hayrat okumaya denk sayılan bir salavat tertibidir.",
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'delail', 'muhabbet'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'muhabbet ehli niyeti',
          'salavat programı',
          'kandil gecesi',
        ],
      },
      {
        key: 'mevlid-nur-u-zatiyye-100',
        nameArabic:
          'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ النُّورِ الذَّاتِيِّ وَالسِّرِّ السَّارِي فِي سَائِرِ الْأَسْمَاءِ وَالصِّفَاتِ',
        nameTurkish: 'Nur-u Zatiyye Salavatı',
        transliteration:
          'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedin in-nûriz-zâtiyyi ves sirris-sârî fî sâiril esmâi ves sıfât.',
        meaning:
          "Allah'ım, zatî nur ve ilahi isim-sıfatlarda tecelli eden sır sahibi Efendimiz Muhammed'e salat, selam ve bereket eyle.",
        virtue:
          'Nur-u Zatiyye salavatı olarak bilinir; yüz bin salavat kuvvetinde zihni aydınlattığı kabul edilir.',
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'nur', 'tefekkür'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['zihinsel berraklık', 'manevi nur talebi', 'tefekkür'],
      },
      {
        key: 'mevlid-salavat-i-fatih-100',
        nameArabic:
          'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ وَالْخَاتِمِ لِمَا سَبَقَ',
        nameTurkish: 'Salavat-ı Fatih',
        transliteration:
          'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedinil fâtihi limâ uğlika vel hâtimi limâ sebeka...',
        meaning:
          'Allahım, kapalı olanı açan ve önceki hakikatleri tamamlayan Efendimiz Muhammede salat, selam ve bereket eyle.',
        virtue:
          'Kapalı kapıları açan, hakka yardım eden ve hidayet yolunu gösteren en kuvvetli salavatlardan kabul edilir.',
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'feth', 'hidayet'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'hidayet talebi',
          'zor işlerin açılması',
          'manevi destek',
        ],
      },
      {
        key: 'mevlid-hz-fatima-salavati-100',
        nameArabic:
          'اللّٰهُمَّ صَلِّ عَلَى مَنْ رُوحُهُ مِحْرَابُ الْأَرْوَاحِ وَالْمَلَائِكَةِ وَالْكَوْنِ اللّٰهُمَّ صَلِّ عَلَى مَنْ هُوَ إِمَامُ الْأَنْبِيَاءِ',
        nameTurkish: "Hz. Fatıma'nın Salavatı",
        transliteration:
          'Allâhümme salli alâ men rûhuhu mihrâbül ervâhı vel melâiketi vel kevn. Allâhümme salli alâ men hüve imâmül enbiyâi...',
        meaning:
          'Allahım, ruhu varlık ve melekut âleminin kıblesi olan zata ve peygamberlerin imamına salat eyle.',
        virtue:
          'Denizler mürekkep, ağaçlar kalem olsa sevabının yazılamayacağı nakledilen yüce bir salavat tertibidir.',
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'ehlibeyt', 'muhabbet'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['ehlibeyt muhabbeti', 'derin salavat', 'kandil gecesi'],
      },
      {
        key: 'mevlid-ruyada-gorme-salavati-70',
        nameArabic:
          'اللّٰهُمَّ صَلِّ عَلَى رُوحِ سَيِّدِنَا مُحَمَّدٍ فِي الْأَرْوَاحِ اللّٰهُمَّ صَلِّ عَلَى جَسَدِ سَيِّدِنَا مُحَمَّدٍ فِي الْأَجْسَادِ',
        nameTurkish: 'Rüyada Görme Salavatı',
        transliteration:
          'Allâhümme salli alâ rûhi seyyidinâ Muhammedin fil ervâh. Allâhümme salli alâ cesedi seyyidinâ Muhammedin fil ecsâd...',
        meaning:
          'Allahım, Efendimiz Muhammedin ruhuna ruhlar aleminde ve bedenine bedenler aleminde salat eyle.',
        virtue:
          "Yatmadan önce açıktan yetmiş kez okunduğunda Peygamber'i rüyada görmeye vesile kılındığı nakledilir.",
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'ruya', 'gece-ibadeti'],
        categories: ['kandil', 'özel gün', 'salavat'],
        timeOfDay: 'night',
        recommendedCount: 70,
        suitableFor: ['yatmadan önce', 'rüya niyeti', 'gece zikri'],
      },
      {
        key: 'mevlid-salavat-i-tefriciyye-41',
        nameArabic:
          'اللّٰهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ',
        nameTurkish: 'Salavat-ı Tefriciyye',
        transliteration:
          'Allâhümme salli salâten kâmileten ve sellim selâmen tâmmen alâ seyyidinâ Muhammedinillezî tenhallü bihil ugad...',
        meaning:
          "Allah'ım, düğümlerin çözüldüğü Efendimiz Muhammede eksiksiz salat ve tam selam eyle.",
        virtue:
          'Günde en az 41 kez okunduğunda düğümleri çözen, kederleri gideren ve hastalara şifa vesilesi olan salavat olarak aktarılır.',
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'ferahlik', 'sifa'],
        categories: ['kandil', 'özel gün', 'salavat', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['sıkıntıların giderilmesi', 'şifa niyeti', 'hacet duası'],
      },
      {
        key: 'mevlid-salat-i-tuncina-41',
        nameArabic:
          'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ',
        nameTurkish: 'Salât-ı Tüncîna (Salât-ı Münciye)',
        transliteration:
          "Allâhümme salli 'alâ seyyidinâ Muhammedin... Salâten tüncînâ bihâ min cemî'ı'l-ehvâli ve'l-âfât...",
        meaning:
          'Allahım, Efendimiz Muhammede öyle bir salat eyle ki onunla bizi bütün korku, bela ve afetlerden kurtarasın.',
        virtue:
          'Korku, bela, deprem ve afetlerden korunmaya vesile bir kalkan duası olarak aktarılır.',
        source: 'Salavat mecmuaları',
        tags: ['mevlid-kandili', 'salavat', 'korunma', 'munciye'],
        categories: ['kandil', 'özel gün', 'salavat', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['afetlerden korunma', 'korku anları', 'emniyet duası'],
      },
      {
        key: 'mevlid-hamd-tesbih-100',
        nameArabic:
          'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ',
        nameTurkish: 'Mevlid Hamd ve Tesbih Zikri',
        transliteration:
          'Sübhânallâh, vel-hamdü lillâh, ve lâ ilâhe illallâh, vallâhu ekber.',
        meaning:
          "Allah'ı tesbih ederim, hamd Allah'adır, Allah'tan başka ilah yoktur, Allah en büyüktür.",
        virtue:
          'Dil, kalp ve şükür boyutunu birlikte canlandırır; geceyi zikirle ihyaya destek olur.',
        source: 'Tesbih ve tahmid zikirleri',
        tags: ['mevlid-kandili', 'tesbih', 'tahmid'],
        categories: ['kandil', 'özel gün', 'tesbih'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['şükür', 'zikir meclisi', 'kandil gecesi'],
      },
      {
        key: 'mevlid-rahmet-duasi-100',
        nameArabic:
          'اللّٰهُمَّ إِنِّي أَسْأَلُكَ حُبَّكَ وَحُبَّ مَنْ يُحِبُّكَ وَالْعَمَلَ الَّذِي يُبَلِّغُنِي حُبَّكَ',
        nameTurkish: 'Mevlid Muhabbet Duası',
        transliteration:
          'Allâhümme innî es’elüke hubbeke ve hubbe men yuhibbüke vel-amel-ellezî yubelliğunî hubbek.',
        meaning:
          'Allah’ım, Senden Senin sevgini, Seni sevenlerin sevgisini ve beni Senin sevgine ulaştıracak ameli isterim.',
        virtue:
          'Peygamber ahlakına yönelmeyi, Allah sevgisini ve salih amel niyetini güçlendirir.',
        source: 'Tirmizi, Deavat',
        tags: ['mevlid-kandili', 'dua', 'muhabbet'],
        categories: ['kandil', 'özel gün', 'dua'],
        timeOfDay: 'night',
        recommendedCount: 100,
        suitableFor: ['muhabbet', 'ahlak niyeti', 'gece duası'],
      },
    ],
    specialDays: [
      {
        name: 'Mevlid Kandili',
        type: 'kandil',
        date: '2026-08-24',
        hijriDate: '11 Rebiülevvel 1448',
        description:
          'Peygamber Efendimizin doğumunu salavat, tevhid, istiğfar ve dua ile ihya etme gecesi.',
        eventKey: 'mevlid-kandili-2026',
        priority: 180,
        dhikrKeys: [
          'mevlid-salavat-1000',
          keyMap.TEVHID,
          keyMap.ISTIGFAR,
          'mevlid-la-havle-100',
          'mevlid-duha-suresi-50',
          'mevlid-seytandan-siginma-33',
          'mevlid-sabir-ve-sebat-ayeti',
          'mevlid-salavat-emri-ayeti',
          'mevlid-salavat-sellim-barik-100',
          'mevlid-rabbena-zalemna-100',
          'mevlid-rabbi-inni-messeni-100',
          keyMap.HZYUSUF,
          'mevlid-kema-lillahi-salavat-100',
          'mevlid-delail-hayrat-dengi-100',
          'mevlid-nur-u-zatiyye-100',
          'mevlid-salavat-i-fatih-100',
          'mevlid-hz-fatima-salavati-100',
          'mevlid-ruyada-gorme-salavati-70',
          'mevlid-salavat-i-tefriciyye-41',
          'mevlid-salat-i-tuncina-41',
          'mevlid-hamd-tesbih-100',
          'mevlid-rahmet-duasi-100',
        ],
      },
    ],
  },
  {
    key: 'muharrem-ilk-on-2026',
    label: 'Muharrem İlk 10 Gün 2026',
    dhikrItems: [
      {
        key: 'muharrem-ayetel-kursi-360',
        nameArabic:
          'اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        nameTurkish: 'Âyetel Kürsî',
        transliteration:
          "Allâhu lâ ilâhe illâ hüvel hayyül kayyûm. Lâ te'huzuhû sinetün ve lâ nevm. Lehû mâ fis-semâvâti ve mâ fil-ard. Men zellezî yeşfeu indehû illâ bi-iznih. Ya'lemu mâ beyne eydîhim ve mâ halfehüm. Ve lâ yuhîtûne bi şey'in min ilmihî illâ bimâ şâ'. Vesia kürsiyyühüs-semâvâti vel-ard. Ve lâ yeûdühû hifzuhümâ. Ve hüvel aliyyül azîm.",
        meaning:
          "Allah, kendisinden başka ilah olmayandır; diridir, kayyumdur. O'nu ne uyuklama ne uyku tutar. Göklerde ve yerde ne varsa O'nundur. İzni olmadan katında kim şefaat edebilir? Kulların önlerindekini ve arkalarındakini bilir. O'nun dilediği kadarının dışında ilminden hiçbir şeyi kuşatamazlar. Kürsüsü gökleri ve yeri kaplamıştır; onları koruyup gözetmek O'na ağır gelmez. O yücedir, büyüktür.",
        virtue:
          'Yıl boyunca maddi ve manevi belalardan korunma niyetiyle ilahi himayeye sığınma bilincini güçlendirir.',
        source: 'Bakara 255',
        tags: ['muharrem', 'hicri-yilbasi', 'korunma', 'güven', 'ayetel-kursi'],
        categories: ['özel gün', 'muharrem', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 360,
        suitableFor: ['korunma', 'güven', 'hicri yılbaşı', 'muharrem ilk 10'],
      },
      {
        key: 'muharrem-bakiyat-salihat-100',
        nameArabic: 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَاللّٰهُ أَكْبَرُ',
        nameTurkish: 'Bakıyat-ı Salihat Zikri',
        transliteration: 'Sübhanellahi velhamdü lillahi vallahü ekber.',
        meaning: 'Allahı tenzih ederim, hamd Allahadır, Allah en büyüktür.',
        virtue:
          'Şükür, tesbih ve tekbir bilincini birlikte pekiştirir; varoluşsal şükranı canlı tutar.',
        source: 'Bakiyat-ı Salihat rivayetleri',
        tags: ['muharrem', 'tesbih', 'hamd', 'tekbir'],
        categories: ['özel gün', 'muharrem', 'tesbih'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['şükür', 'muharrem ilk 10', 'manevi denge'],
      },
      {
        key: 'muharrem-ya-selam-313',
        nameArabic: 'يَا سَلَامُ',
        nameTurkish: 'Ya Selam (c.c.)',
        transliteration: 'Yâ Selâm.',
        meaning: 'Esenlik ve selametin kaynağı olan Allah.',
        virtue:
          'Bedensel ve ruhsal esenlik niyetini güçlendirir; barış ve sükun talebini diri tutar.',
        source: 'Esma-i Hüsna',
        tags: ['muharrem', 'esma', 'selamet', 'baris'],
        categories: ['özel gün', 'muharrem', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 313,
        suitableFor: ['huzur', 'muharrem ilk 10', 'barış niyeti'],
      },
      {
        key: 'muharrem-ya-rahman-ya-rahim-100',
        nameArabic: 'يَا رَحْمٰنُ يَا رَحِيمُ',
        nameTurkish: 'Ya Rahman Ya Rahim',
        transliteration: 'Yâ Rahmân, Yâ Rahîm.',
        meaning: 'Rahman ve Rahim olan Allahın merhametine sığınma zikri.',
        virtue:
          'Merhamet, şefkat ve empati bilincini artırır; kalbi yumuşatır.',
        source: 'Esma-i Hüsna',
        tags: ['muharrem', 'esma', 'rahmet', 'merhamet'],
        categories: ['özel gün', 'muharrem', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['merhamet', 'muharrem ilk 10', 'kalp yumuşaması'],
      },
      {
        key: keyMap.TEVHID,
        nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ',
        nameTurkish: 'Kelime-i Tevhid ve Risalet',
        transliteration: 'Lâ ilâhe illallâh Muhammedür Rasûlullâh.',
        meaning: 'Allahtan başka ilah yoktur; Muhammed Allahın Resulüdür.',
        virtue:
          'Kimlik ve aidiyet bilincini tazeler; Nebevi rehberliğe bağlılığı güçlendirir.',
        source: 'Kelime-i tevhid geleneği',
        tags: ['muharrem', 'tevhid', 'risalet', 'aidiyet'],
        categories: ['özel gün', 'tevhid'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'iman tazeleme',
          'aidiyet',
          'kandil gecesi',
          'tefekkür',
          'özel gün',
        ],
      },
      {
        key: 'muharrem-selamun-kavlen-41',
        nameArabic: 'سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ',
        nameTurkish: 'Selamün Kavlen Mirrabbirrahim',
        transliteration: 'Selâmün kavlen mir rabbir rahîm.',
        meaning: 'Merhametli Rabden sözlü bir selam vardır.',
        virtue:
          'Selamet, umut ve güven duygusunu besler; kalbe rahmet iklimi kazandırır.',
        source: 'Yasin 58',
        tags: ['muharrem', 'kuran', 'selamet', 'umut'],
        categories: ['özel gün', 'muharrem', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['umut', 'muharrem ilk 10', 'manevi teselli'],
      },
      {
        key: 'muharrem-kelime-i-sehadet-33',
        nameArabic:
          'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللّٰهِ',
        nameTurkish: 'Kelime-i Şehadet',
        transliteration:
          'Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
        meaning:
          'Şahitlik ederim ki Allahtan başka ilah yoktur ve Muhammed onun kulu ve resulüdür.',
        virtue:
          'İman ikrarını yeniler; Aşure gününde tevhid ve teslimiyet şuurunu pekiştirir.',
        source: 'Kelime-i şehadet geleneği',
        tags: ['muharrem', 'asure', 'iman', 'sehadet'],
        categories: ['özel gün', 'muharrem', 'tevhid'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['aşure günü', 'iman tazeleme', 'muharrem ilk 10'],
      },
    ],
    specialDays: [
      {
        name: 'Hicri Yılbaşı',
        type: 'özel gün',
        date: '2026-06-16',
        hijriDate: '1 Muharrem 1448',
        description:
          'Yeni hicri yıla tevbe, tevhid ve korunma niyetiyle giriş.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 1,
        dayCount: 10,
        priority: 170,
        dhikrKeys: [
          'bayram-istigfar-100',
          keyMap.IHLAS,
          'muharrem-ayetel-kursi-360',
        ],
      },
      {
        name: '2 Muharrem',
        type: 'özel gün',
        date: '2026-06-17',
        hijriDate: '2 Muharrem 1448',
        description: 'Şükür ve tesbih bilincini güçlendirme günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 2,
        dayCount: 10,
        priority: 160,
        dhikrKeys: ['muharrem-bakiyat-salihat-100'],
      },
      {
        name: '3 Muharrem',
        type: 'özel gün',
        date: '2026-06-18',
        hijriDate: '3 Muharrem 1448',
        description: 'Selamet ve şifa niyetini güçlendirme günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 3,
        dayCount: 10,
        priority: 160,
        dhikrKeys: ['muharrem-ya-selam-313'],
      },
      {
        name: '4 Muharrem',
        type: 'özel gün',
        date: '2026-06-19',
        hijriDate: '4 Muharrem 1448',
        description: 'Tevhid ile ego kırma ve teslimiyet günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 4,
        dayCount: 10,
        priority: 160,
        dhikrKeys: [keyMap.VAHDEHU_LA],
      },
      {
        name: '5 Muharrem',
        type: 'özel gün',
        date: '2026-06-20',
        hijriDate: '5 Muharrem 1448',
        description: 'Rahmet ve merhamet iklimini diri tutma günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 5,
        dayCount: 10,
        priority: 160,
        dhikrKeys: ['muharrem-ya-rahman-ya-rahim-100'],
      },
      {
        name: '6 Muharrem',
        type: 'özel gün',
        date: '2026-06-21',
        hijriDate: '6 Muharrem 1448',
        description: 'Acziyet, tevekkül ve dayanıklılık günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 6,
        dayCount: 10,
        priority: 160,
        dhikrKeys: ['mevlid-la-havle-100'],
      },
      {
        name: '7 Muharrem',
        type: 'özel gün',
        date: '2026-06-22',
        hijriDate: '7 Muharrem 1448',
        description: 'İhlas ve tevhidde sebat günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 7,
        dayCount: 10,
        priority: 160,
        dhikrKeys: [keyMap.IHLAS],
      },
      {
        name: '8 Muharrem',
        type: 'özel gün',
        date: '2026-06-23',
        hijriDate: '8 Muharrem 1448',
        description: 'Kelime-i tevhid ve risalet bilincini tazeleme günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 8,
        dayCount: 10,
        priority: 160,
        dhikrKeys: [keyMap.TEVHID],
      },
      {
        name: '9 Muharrem',
        type: 'özel gün',
        date: '2026-06-24',
        hijriDate: '9 Muharrem 1448',
        description: 'Selamet ve ilahi hitap ümidiyle okunacak zikir günü.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 9,
        dayCount: 10,
        priority: 160,
        dhikrKeys: ['muharrem-selamun-kavlen-41'],
      },
      {
        name: '10 Muharrem (Aşure)',
        type: 'özel gün',
        date: '2026-06-25',
        hijriDate: '10 Muharrem 1448',
        description: 'Aşure gününde iman ikrarı ve ihlasla mühürleme.',
        eventKey: 'muharrem-ilk-on-2026',
        dayIndex: 10,
        dayCount: 10,
        priority: 170,
        dhikrKeys: ['muharrem-kelime-i-sehadet-33', keyMap.IHLAS],
      },
    ],
  },
  {
    key: 'sinav-ve-yazili-zikirleri',
    label: 'Sınav ve Yazılı Süreçleri Zikirleri',
    dhikrItems: [
      {
        key: 'sinav-rabbi-edhilni',
        nameArabic:
          'رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَلْ لِي مِنْ لَدُنْكَ سُلْطَانًا نَصِيرًا',
        nameTurkish: 'Sınav Başlangıç Duası',
        transliteration:
          "Rabbi edhılnî mudhale sıdkın ve ahricnî muhrece sıdkın vec'al lî min ledunke sultânen nasîrâ.",
        meaning:
          'Rabbim, gireceğim yere doğrulukla girmemi ve çıkacağım yerden doğrulukla çıkmamı nasip eyle; katından bana yardımcı bir güç ver.',
        virtue:
          'Sınav salonuna girerken veya sıraya oturunca okunması tavsiye edilir; iç huzur ve ilahi destek hissini güçlendirir.',
        source: 'İsrâ Suresi, 80. Ayet',
        tags: ['sinav', 'yazili', 'basari', 'dua'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 10,
        suitableFor: ['sınav öncesi', 'mülakat öncesi', 'heyecan yönetimi'],
      },
      {
        key: 'sinav-rabbisrahli-sadri',
        nameArabic:
          'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي',
        nameTurkish: "Hz. Musa'nın Duası",
        transliteration:
          'Rabbişrah lî sadrî. Ve yessir lî emrî. Vahlul ukdeten min lisânî. Yefkahû kavlî.',
        meaning:
          'Rabbim, göğsüme genişlik ver; işimi kolaylaştır; dilimdeki düğümü çöz ki sözüm anlaşılsın.',
        virtue:
          'Zihinsel tıkanıklık, ifade zorluğu ve sınav kaygısına karşı okunur; odaklanmayı destekler. Toplantı, sunum, mülakat ve önemli görüşmeler öncesinde heyecanı yatıştırmak, hitabet gücünü artırmak ve zihni açmak için okunur.',
        source: 'Tâ-Hâ Suresi, 25-28. Ayetler',
        tags: ['sinav', 'yazili', 'odak', 'ifade'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['sınav anı', 'sözlü sınav', 'sunum öncesi'],
      },
      {
        key: 'sinav-rabbi-yessir',
        nameArabic: "Rabbi yessir velâ tuassir, Rabbi temmim bi'l-hayr.",
        nameTurkish: 'Kolaylık Duası',
        transliteration: "Rabbi yessir velâ tuassir, Rabbi temmim bi'l-hayr.",
        meaning: 'Rabbim, kolaylaştır zorlaştırma; işimi hayırla tamamla.',
        virtue:
          'Ders çalışmaya veya sınava başlarken okunur; işin kolay ve hayırlı tamamlanmasına niyet eder.',
        source: 'İslâmî Dua ve Münacat Geleneği',
        tags: ['sinav', 'yazili', 'kolaylik', 'dua'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['ders başlangıcı', 'sınav öncesi', 'zor konu çalışması'],
      },
      {
        key: 'sinav-sekine-fetih',
        nameArabic:
          "Bismillâhirrahmânirrahîm. Ferdün, Hayyün, Kayyûmun, Hakemun, Adlün, Kuddûsün. İyyâke na'büdü ve iyyâkenesta'în. İnnâ fetahnâ leke fethan mubînâ.",
        nameTurkish: 'Sekine ve Feth Duası Terkibi',
        transliteration:
          "Bismillâhirrahmânirrahîm. Ferdün, Hayyün, Kayyûmun, Hakemun, Adlün, Kuddûsün. İyyâke na'büdü ve iyyâkenesta'în. İnnâ fetahnâ leke fethan mubînâ.",
        meaning:
          "Rahman ve Rahim olan Allah'ın adıyla; yalnız Sana ibadet eder, yalnız Senden yardım dileriz. Şüphesiz biz sana apaçık bir fetih verdik.",
        virtue:
          'Unutkanlığa karşı ve zihinsel açıklık niyetiyle sınavdan önce veya ders başında okunur.',
        source:
          "Mecmuatü'l-Ahzab (Hz. Ali'den nakledilen Sekine duası tertibi)",
        tags: ['sinav', 'yazili', 'sekine', 'feth'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 19,
        suitableFor: ['hafıza güçlendirme', 'odaklanma', 'sınav hazırlığı'],
      },
      {
        key: 'sinav-ya-hayyu-ya-kayyum',
        nameArabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
        nameTurkish: 'Ya Hayyu Ya Kayyum İstiğase',
        transliteration:
          "Yâ Hayyü, yâ Gayyûm! Bi rahmetike esteğîsü fe eslıh lî şe'nî küllehü ve lâ tekilnî ilâ nefsî tarfete aynin",
        meaning:
          "Ey Hayy ve Kayyum olan Allah'ım! Ancak senin rahmetine sığınırım. Benim bütün işlerimi düzelt ve beni göz açıp kapayıncaya kadar (da olsa) asla nefsime (kendi başıma) bırakma.",
        virtue:
          'Sınav başlarken okunması tavsiye edilir; panik anlarında zihinsel berraklık sağlar. İşlerin ters gittiği, kriz anlarında veya karar mekanizmalarında tıkanıklık yaşandığında tüm süreçlerin düzene girmesi ve ilahi yardıma nail olmak için okunur.',
        source: "Tirmizî, De'avât, 90",
        tags: ['sinav', 'yazili', 'yardim', 'sukunet'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 10,
        suitableFor: ['sınav anı', 'panik kontrolü', 'zihinsel berraklık'],
      },
      {
        key: 'sinav-allahumme-la-sehle',
        nameArabic:
          'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
        nameTurkish: 'Zorluğu Kolaylaştırma Duası',
        transliteration:
          "Allâhümme lâ sehle illâ mâ cealtehû sehlen ve ente tec'alü'l-hazne izâ şi'te sehlen.",
        meaning:
          "Allah'ım, Senin kolay kıldığından başka kolay yoktur; dilediğinde zoru kolay kılarsın.",
        virtue:
          'Zor soru veya karmaşık problemle karşılaşıldığında okunur; zihinsel kilidi çözmeye yardımcı olur.',
        source:
          "İbn Hibbân, Sahih, no: 2427; İbnü's-Sünnî, Amelü'l-Yevm, no: 351",
        tags: ['sinav', 'yazili', 'zor-soru', 'kolaylik'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['zor sorular', 'problem çözme', 'sınav stresi'],
      },
      {
        key: 'sinav-estevdiuke-ilim',
        nameArabic:
          'Allâhümme innî estevdiuke cemîa mâ estefîduhû min hazâsseyyidi ev fî hazal meclisi hattâ teruddehu aleyye fî vaktihtiyâcî ileyhi.',
        nameTurkish: 'İlmi Emanet Duası',
        transliteration:
          'Allâhümme innî estevdiuke cemîa mâ estefîduhû min hazâsseyyidi ev fî hazal meclisi hattâ teruddehu aleyye fî vaktihtiyâcî ileyhi.',
        meaning:
          "Allah'ım, öğrendiğim faydalı bilgileri ihtiyaç anında geri vermen için Sana emanet ediyorum.",
        virtue:
          'Ders bitiminde veya sınav öncesinde okunur; öğrenilen bilginin hatırlanmasına niyet eder.',
        source: "ed-Dürretü'l-harîde, 1/53",
        tags: ['sinav', 'yazili', 'hafiza', 'dua'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 3,
        suitableFor: ['unutkanlık', 'ders sonrası', 'bilgi hatırlama'],
      },
      {
        key: 'sinav-rabbi-zidni-ilmen',
        nameArabic: 'رَبِّ زِدْنِي عِلْمًا',
        nameTurkish: 'Rabbi Zidnî İlmen',
        transliteration: 'Rabbi zidnî ilmen.',
        meaning: 'Rabbim, ilmimi artır.',
        virtue:
          'Öğrenme, anlama ve kavrama gücünün artması amacıyla sıkça zikredilir.',
        source: 'Tâ-Hâ Suresi, 114. Ayet',
        tags: ['sinav', 'yazili', 'ilim', 'gelisim'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['ders çalışma', 'öğrenme isteği', 'kavrama gücü'],
      },
      {
        key: 'sinav-senukriuke-fela-tensa',
        nameArabic: 'سَنُقْرِئُكَ فَلَا تَنْسَىٰ',
        nameTurkish: 'Senukriuke Felâ Tensâ',
        transliteration: 'Senukriuke felâ tensâ.',
        meaning: 'Sana okutacağız; artık unutmayacaksın.',
        virtue:
          'Zihin açıklığı ve ezberlenen bilgiyi muhafaza etme niyetiyle düzenli okunur.',
        source: "A'lâ Suresi, 6. Ayet",
        tags: ['sinav', 'yazili', 'hafiza', 'ezber'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['ezber', 'unutkanlık', 'sınav hazırlığı'],
      },
      {
        key: 'sinav-bismillahi-ve-subhanellahi',
        nameArabic:
          'Bismillâhi ve sübhânellâhi velhamdülillâhi velâ ilâhe illellâhü vallâhü ekber velâ havle velâ kuvvete illâ billâhil aliyyil azîm.',
        nameTurkish: 'Tesbih ve Havkale Terkibi',
        transliteration:
          'Bismillâhi ve sübhânellâhi velhamdülillâhi velâ ilâhe illellâhü vallâhü ekber velâ havle velâ kuvvete illâ billâhil aliyyil azîm.',
        meaning:
          "Allah'ın adıyla; Allah'ı tesbih ederim, hamd Allah'adır, O'ndan başka ilah yoktur, Allah en büyüktür; güç ve kuvvet ancak Allah'tandır.",
        virtue:
          'Okuma-yazma sürecinde zihni diri tutmaya, manevi motivasyonu ve dikkat sürekliliğini artırmaya niyet edilir.',
        source: "ed-Dürretü'l-harîde, 1/53",
        tags: ['sinav', 'yazili', 'tesbih', 'havkale'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 11,
        suitableFor: ['yazılı sınav', 'odaklanma', 'zihinsel canlılık'],
      },
      {
        key: 'sinav-allahumme-hirli',
        nameArabic: 'Allâhümme hır lî vehter lî. Velâ teknînî alâ ihtiyârî.',
        nameTurkish: 'Doğru Tercih Duası',
        transliteration:
          'Allâhümme hır lî vehter lî. Velâ teknînî alâ ihtiyârî.',
        meaning:
          'Allahım, bu işte benim için hayırlı olanı seç ve beni nefsimin seçimine bırakma.',
        virtue:
          'Şıklı sorularda ve karar gerektiren anlarda doğru tercihe yönelmek için okunur.',
        source: "Tirmizî, De'avât, 90",
        tags: ['sinav', 'yazili', 'tercih', 'dua'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 11,
        suitableFor: ['çoktan seçmeli sınav', 'kararsızlık', 'isabetli tercih'],
      },
      {
        key: 'sinav-nun-vel-kalemi',
        nameArabic: 'ن ۚ وَالْقَلَمِ وَمَا يَسْطُرُونَ',
        nameTurkish: 'Nûn Vel-Kalemi',
        transliteration: 'Nûn. Vel-kalemi vemâ yesturûn.',
        meaning: 'Nun. Kaleme ve satır satır yazdıklarına yemin olsun.',
        virtue:
          'Yazılı sınavlarda düşünceleri kağıda dökme, analitik kurguyu doğru kurma ve ifadeyi berraklaştırma niyetiyle okunur.',
        source: 'Kalem Suresi, 1. Ayet',
        tags: ['sinav', 'yazili', 'kalem', 'ifade', 'yazim-berrakligi'],
        categories: ['genel', 'egitim', 'sinav'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'yazılı sınav',
          'ifade becerisi',
          'sınav öncesi',
          '3-5-7 tekrar tertibi',
          'analitik kurgu',
        ],
      },
    ],
    specialDays: [],
  },
  {
    key: 'esma-rizik-ve-bereket-zikirleri',
    label: 'Esma-ül Hüsna Rızık ve Bereket Zikirleri',
    dhikrItems: [
      {
        key: 'esma-ya-melik',
        nameArabic: 'يَا مَلِكُ',
        nameTurkish: 'Ya Melik',
        transliteration: 'Yâ Melik',
        meaning: 'Ey mutlak mülkün sahibi olan Allahım.',
        virtue:
          'Fakirlikten kurtuluş, maddi güç ve sahip olunan imkanları doğru yönetme niyetiyle okunur.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'rizik', 'bereket', 'maddi-guc'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 91,
        suitableFor: [
          'maddi darlık',
          'rızık talebi',
          'bereket arzusu',
          'alternatif 121',
        ],
      },
      {
        key: 'esma-ya-vehhab',
        nameArabic: 'يَا وَهَّابُ',
        nameTurkish: 'Ya Vehhâb',
        transliteration: 'Yâ Vehhâb',
        meaning: 'Ey karşılıksız nimetler veren Allahım.',
        virtue:
          'Karşılıksız nimet, borç yükünün hafiflemesi ve rızık artışı niyetiyle zikredilir.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'rizik', 'nimet', 'borc'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 196,
        suitableFor: ['borçlardan kurtulma', 'nimet artışı', 'maddi rahatlama'],
      },
      {
        key: 'esma-ya-rezzak',
        nameArabic: 'يَا رَزَّاقُ',
        nameTurkish: 'Ya Rezzâk',
        transliteration: 'Yâ Rezzâk',
        meaning: 'Ey bütün mahlukatın rızkını veren Allahım.',
        virtue:
          'Bol rızık, darlıkların sona ermesi ve geçim genişliği niyetiyle okunur.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'rizik', 'gecim', 'bolluk'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 308,
        suitableFor: ['geçim darlığı', 'iş arayışı', 'rızık bereketi'],
      },
      {
        key: 'esma-ya-fettah',
        nameArabic: 'يَا فَتَّاحُ',
        nameTurkish: 'Ya Fettâh',
        transliteration: 'Yâ Fettâh',
        meaning: 'Ey hayır kapılarını açan Allahım.',
        virtue:
          'Kapalı kapıların açılması, iş ve rızık yollarının genişlemesi niyetiyle okunur.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'feth', 'is-kapisi', 'rizik'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 489,
        suitableFor: [
          'iş kapılarının açılması',
          'darlığın bitmesi',
          'fırsat arayışı',
        ],
      },
      {
        key: 'esma-ya-gani',
        nameArabic: 'يَا غَنِيُّ',
        nameTurkish: 'Ya Ganî',
        transliteration: 'Yâ Ganî',
        meaning: 'Ey hiçbir şeye muhtaç olmayan, mutlak zengin Allahım.',
        virtue:
          'Kimseye muhtaç olmama, iç ve dış zenginlik bilinci ile maddi ferahlık niyetiyle zikredilir.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'zenginlik', 'istiğna', 'bereket'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 1060,
        suitableFor: ['maddi bağımsızlık', 'rızık bereketi', 'alternatif 160'],
      },
      {
        key: 'esma-ya-mugni',
        nameArabic: 'يَا مُغْنِي',
        nameTurkish: 'Ya Muğnî',
        transliteration: 'Yâ Muğnî',
        meaning: 'Ey dilediğini zengin kılan Allahım.',
        virtue:
          'Maddi refah, bolluk ve kişinin ihtiyaçlarının karşılanması niyetiyle okunur.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'zenginlik', 'refah', 'rizik'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 1100,
        suitableFor: ['maddi refah', 'gelir artışı', 'alternatif 1337'],
      },
      {
        key: 'esma-ya-basit',
        nameArabic: 'يَا بَاسِطُ',
        nameTurkish: 'Ya Bâsıt',
        transliteration: 'Yâ Bâsıt',
        meaning: 'Ey darlığı açıp genişlik veren Allahım.',
        virtue:
          'İşlerin büyümesi, mal ve paranın bereketlenmesi niyetiyle zikredilir.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'genislik', 'islerin-acilmasi', 'bereket'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 72,
        suitableFor: ['iş genişlemesi', 'bereket artışı', 'maddi rahatlama'],
      },
      {
        key: 'esma-ya-kerim',
        nameArabic: 'يَا كَرِيمُ',
        nameTurkish: 'Ya Kerîm',
        transliteration: 'Yâ Kerîm',
        meaning: 'Ey ikramı bol ve cömert olan Allahım.',
        virtue:
          'Kolay rızık, cömertçe verilen nimetler ve hayırlı ikramlar niyetiyle okunur.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'ikram', 'rizik', 'cömertlik'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 270,
        suitableFor: ['kolay rızık', 'nimet artışı', 'bereket'],
      },
      {
        key: 'esma-ya-malikel-mulk',
        nameArabic: 'يَا مَالِكَ الْمُلْكِ',
        nameTurkish: 'Ya Mâlikül Mülk',
        transliteration: 'Yâ Mâlikel Mülk',
        meaning: 'Ey mülkün gerçek sahibi ve hükümranı olan Allahım.',
        virtue:
          'Ev, arsa gibi taşınmaz mülk edinme ve mevcut mülkün korunması niyetiyle zikredilir.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'mulk', 'ev-arsa', 'korunma'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 212,
        suitableFor: ['ev alma', 'mülk edinme', 'mülk korunması'],
      },
      {
        key: 'esma-ya-mutekebbir',
        nameArabic: 'يَا مُتَكَبِّرُ',
        nameTurkish: 'Ya Mütekebbir',
        transliteration: 'Yâ Mütekebbir',
        meaning: 'Ey azamet ve büyüklük sahibi olan Allahım.',
        virtue:
          'İzzet, refah ve bereket artışı ile sözün tesirinin güçlenmesi niyetiyle okunur.',
        source: 'Esma-ül Hüsna ebced uygulama geleneği',
        tags: ['esma', 'izzet', 'refah', 'bereket'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 662,
        suitableFor: ['itibar', 'maddi bereket', 'söz etkisi'],
      },
    ],
    specialDays: [],
  },
  {
    key: 'rizik-ve-mulk-tertipleri',
    label: 'Rızık ve Mülk Tertipleri',
    dhikrItems: [
      {
        key: 'rizik-kombinasyon-ya-gani-ya-mugni',
        nameArabic: 'يَا غَنِيُّ يَا مُغْنِي',
        nameTurkish: 'Ya Gani Ya Muğnî',
        transliteration: 'Yâ Ganî, Yâ Muğnî',
        meaning: 'Ey mutlak zengin olan ve dilediğini zengin kılan Allahım.',
        virtue:
          'Rızık ve zenginlik niyeti için güçlü kombinasyon olarak zikredilir; fakirlik kapılarını kapatma niyeti taşır.',
        source: 'Havas ve esma kombinasyon geleneği',
        tags: ['rizik', 'zenginlik', 'esma-kombinasyon', 'bereket'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 2160,
        suitableFor: ['fakirlikten kurtuluş', 'gelir artışı', 'maddi refah'],
      },
      {
        key: 'rizik-kombinasyon-ya-fettah-ya-malikel-mulk',
        nameArabic: 'يَا فَتَّاحُ يَا مَالِكَ الْمُلْكِ',
        nameTurkish: "Ya Fettâh Ya Mâlikü'l-Mülk",
        transliteration: "Yâ Fettâh, Yâ Mâlikü'l-Mülk",
        meaning: 'Ey kapıları açan ve mülkün sahibi olan Allahım.',
        virtue:
          'İş, rızık ve mülk kapılarının açılması niyetiyle okunan tertiplerdendir.',
        source: 'Havas ve esma kombinasyon geleneği',
        tags: ['rizik', 'mulk', 'is-kapisi', 'esma-kombinasyon'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 2000,
        suitableFor: [
          'mülk edinme',
          'iş kapılarının açılması',
          'darlığın bitmesi',
        ],
      },
      {
        key: 'rizik-vakia-suresi-gece',
        nameArabic: 'سُورَةُ الْوَاقِعَةِ',
        nameTurkish: 'Vâkıa Suresi (Gecelik Vird)',
        transliteration: "Sûretü'l-Vâkıa",
        meaning: 'Vâkıa suresinin her gece düzenli okunması.',
        virtue:
          "İslam literatüründe 'zenginlik suresi' olarak anılır; fakirlik korkusuna karşı manevi destek kabul edilir.",
        source: "Abdullah b. Mes'ud rivayeti ve geleneksel vird uygulamaları",
        tags: ['rizik', 'vakia', 'sure', 'bereket'],
        categories: ['genel', 'sure', 'rizik-bereket'],
        timeOfDay: 'night',
        recommendedCount: 1,
        suitableFor: ['gece virdi', 'geçim bereketi', 'fakirlik korkusu'],
      },
      {
        key: 'rizik-vakia-suresi-41-gun',
        nameArabic: 'سُورَةُ الْوَاقِعَةِ',
        nameTurkish: 'Vâkıa Suresi (41 Günlük Tertip)',
        transliteration: "Sûretü'l-Vâkıa",
        meaning:
          'Vâkıa suresinin 40 gün boyunca günlük 40/41 tekrar okunması tertibi.',
        virtue:
          'Düzenli okuma ile yorulmadan helal rızık ve geçim genişliği niyeti taşır.',
        source: 'Geleneksel vird tertipleri',
        tags: ['rizik', 'vakia', '40-gun', 'vird'],
        categories: ['genel', 'sure', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['40 günlük tertip', 'helal rızık', 'bereket artışı'],
      },
      {
        key: 'rizik-fatiha-seher-41',
        nameArabic: 'سُورَةُ الْفَاتِحَةِ',
        nameTurkish: 'Fâtiha Suresi (Seher Tertibi)',
        transliteration: "Sûretü'l-Fâtiha",
        meaning: 'Fâtiha suresinin seher vaktinde 40/41 defa okunması.',
        virtue:
          'Maddi ve manevi bereket kapılarının açılması niyetiyle seherde uygulanan tertiplerdendir.',
        source: 'Tasavvufi vird ve tecrübe geleneği',
        tags: ['rizik', 'fatiha', 'seher', 'bereket'],
        categories: ['genel', 'sure', 'rizik-bereket'],
        timeOfDay: 'morning',
        recommendedCount: 41,
        suitableFor: ['seher vakti', 'rızık bereketi', 'hane bereketi'],
      },
      {
        key: 'rizik-kadr-suresi',
        nameArabic: 'سُورَةُ الْقَدْرِ',
        nameTurkish: 'Kadr Suresi',
        transliteration: "Sûretü'l-Kadr",
        meaning:
          'Kadr suresinin malın korunması ve bereket niyetiyle okunması.',
        virtue:
          'Malın zayi olmaması, bereketin artması ve borçların ödenmesine manevi destek niyetiyle okunur.',
        source: 'Geleneksel rızık ve korunma uygulamaları',
        tags: ['rizik', 'kadr', 'mal-koruma', 'bereket'],
        categories: ['genel', 'sure', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['mal korunması', 'borç ödemesi', 'bereket niyeti'],
      },
      {
        key: 'rizik-fatir-29-30',
        nameArabic:
          'إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنْفَقُوا مِمَّا رَزَقْنَاهُمْ سِرًّا وَعَلَانِيَةً يَرْجُونَ تِجَارَةً لَنْ تَبُورَ',
        nameTurkish: 'Fâtır 29-30 Ticaret Ayetleri',
        transliteration:
          'İnnellezîne yetlûne kitâbellâhi ve ekâmus-salâte ve enfekû mimmâ razaknâhum sirran ve alâniyeten yercûne ticâreten len tebûr.',
        meaning:
          "Allah'ın kitabını okuyan, namazı dosdoğru kılan ve infak edenlerin bitip tükenmeyecek bir ticaret ummaları.",
        virtue:
          "Ticarette kesadın önlenmesi ve 'ticaraten len tebûr' sırrına erişme niyetiyle okunur.",
        source: 'Fâtır Suresi 29-30',
        tags: ['rizik', 'ticaret', 'fatir', 'helal-kazanc'],
        categories: ['genel', 'ayet', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['ticari bereket', 'helal kazanç', 'iş sürekliliği'],
      },
      {
        key: keyMap.RIZIK_EBU_UMAME,
        nameArabic:
          'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
        nameTurkish: 'Ebu Ümâme Duası',
        transliteration:
          'Allâhümme innî eûzü bike minel hemmi vel-hazen, ve eûzü bike minel aczi vel-kesel, ve eûzü bike minel-cübnî vel-buhl, ve eûzü bike min galebetid-deyni ve kahri’r-ricâl.',
        meaning:
          'Allahım, kederden, acizlikten, tembellikten, cimrilikten, borcun baskısından ve insanların kahrından sana sığınırım.',
        virtue:
          'Sabah-akşam okunarak borç ve kaygı yükünü hafifletmeye, psikolojik direnci artırmaya niyet edilir.',
        source: 'Nebevi dua rivayetleri (Ebu Ümâme hadisi)',
        tags: ['rizik', 'borc', 'kaygi', 'sabir'],
        categories: ['genel', 'dua', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 2,
        suitableFor: ['sabah-akşam virdi', 'borç baskısı', 'psikolojik direnç'],
      },
      {
        key: 'rizik-hz-muaz-borc-duasi',
        nameArabic:
          'اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَنْ تَشَاءُ وَتَنْزِعُ الْمُلْكَ مِمَّنْ تَشَاءُ... تَرْحَمُ مَنْ تَشَاءُ وَأَنْتَ الرَّحْمٰنُ الرَّحِيمُ ارْزُقْنِي رَحْمَةً تُغْنِينِي بِهَا عَمَّنْ سِوَاكَ',
        nameTurkish: "Hz. Muâz'a Öğretilen Borç Duası",
        transliteration:
          'Allâhümme mâlikel-mülki tü’til-mülke men teşâ’ ve tenziul-mülke mimmen teşâ’... terhamü men teşâ’ ve ente’r-Rahmânü’r-Rahîm, ürzüknî rahmeten tuğnînî bihâ ammen sivâk.',
        meaning:
          'Ey mülkün sahibi Allahım, mülkü dilediğine verirsin... beni senden başkasına muhtaç etmeyecek bir rahmetle rızıklandır.',
        virtue:
          'Ağır borç yükünün hafiflemesi ve geniş rızka vesile olması niyetiyle öğretilen dualardandır.',
        source: "Hz. Muâz'a talim edilen borç duası rivayetleri",
        tags: ['rizik', 'borc', 'mulk', 'rahmet'],
        categories: ['genel', 'dua', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'yüksek borç',
          'muhtaçlıktan kurtulma',
          'rızık genişliği',
        ],
      },
      {
        key: 'rizik-la-havle-100',
        nameArabic:
          'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
        nameTurkish: 'Lâ Havle velâ Kuvvete illâ Billâh',
        transliteration: 'Lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm.',
        meaning: 'Güç ve kuvvet ancak Allahın yardımıyladır.',
        virtue:
          'Arşın altındaki hazinelerden kabul edilen zikirlerdendir; fakirlikten korunma ve iç kuvvet niyetiyle okunur.',
        source: 'Nebevi rivayetler',
        tags: ['rizik', 'havkale', 'tevekkul', 'dayaniklilik'],
        categories: ['genel', 'dua', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['fakirlikten korunma', 'manevi güç', 'darlık anları'],
      },
      {
        key: 'rizik-la-ilahe-illallahul-melikul-hakkul-mubin',
        nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ الْمَلِكُ الْحَقُّ الْمُبِينُ',
        nameTurkish: "Lâ ilâhe illallâhu'l Melikü'l Hakkul Mübin",
        transliteration: "Lâ ilâhe illallâhu'l Melikü'l Hakkul Mübin.",
        meaning: 'Allah’tan başka ilah yoktur; O Melik, Hak ve apaçık olandır.',
        virtue:
          'Fakirlikten korunma ve kazancın bereketlenmesi niyetiyle günlük vird olarak okunur.',
        source: 'Geleneksel temcid zikirleri',
        tags: ['rizik', 'temcid', 'tevhid', 'bereket'],
        categories: ['genel', 'dua', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['fakirlik korkusu', 'gelir bereketi', 'günlük vird'],
      },
      {
        key: 'rizik-hz-suleyman-mulk-duasi',
        nameArabic:
          'رَبِّ اغْفِرْ لِي وَهَبْ لِي مُلْكًا لَا يَنْبَغِي لِأَحَدٍ مِنْ بَعْدِي إِنَّكَ أَنْتَ الْوَهَّابُ',
        nameTurkish: "Hz. Süleyman'ın Mülk Duası",
        transliteration:
          'Rabbiğfir lî ve heb lî mülken lâ yenbeğî li-ehadin min ba’dî inneke entel-Vehhâb.',
        meaning:
          'Rabbim, beni bağışla ve bana benden sonra kimseye nasip olmayacak bir mülk ver. Şüphesiz sen çok bağışta bulunansın.',
        virtue:
          'Hayırlı bir yuva, mülk edinme ve maddi imkanların helal yoldan artması niyetiyle okunur.',
        source: 'Sâd Suresi, 35. Ayet',
        tags: ['rizik', 'mulk', 'ev', 'vehhab'],
        categories: ['genel', 'ayet', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['ev sahibi olma', 'mülk edinme', 'hayırlı yuva'],
      },
      {
        key: 'rizik-ya-zul-celali-vel-ikram',
        nameArabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        nameTurkish: 'Ya Zül Celâli vel İkrâm',
        transliteration: 'Yâ Zül-Celâli vel-İkrâm',
        meaning: 'Ey celal ve ikram sahibi olan Allahım.',
        virtue:
          'Refah, bereket ve dünyevi işlerde kolaylık niyetiyle tertiplerde zikredilir.',
        source: 'Esma ve vird geleneği',
        tags: ['esma', 'bereket', 'ikram', 'refah'],
        categories: ['genel', 'esma', 'rizik-bereket'],
        timeOfDay: 'any',
        recommendedCount: 1100,
        suitableFor: ['iş kolaylığı', 'bereket artışı', 'itibar'],
      },
    ],
    specialDays: [],
  },
  {
    key: 'hayirli-evlat-zikirleri',
    label: 'Hayırlı Evlat Zikirleri',
    dhikrItems: [
      {
        key: 'evlat-rabbi-la-tezerni',
        nameArabic: 'رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنْتَ خَيْرُ الْوَارِثِينَ',
        nameTurkish: 'Hz. Zekeriya Duası',
        transliteration: "Rabbi lâ tezernî ferden ve ente hayru'l-vârisîn.",
        meaning: 'Rabbim, beni yalnız bırakma; Sen varislerin en hayırlısısın.',
        virtue:
          'Evlat isteyenlerin en sık okuduğu Kurani dualardandır; günde en az 7 defa okunması tavsiye edilir.',
        source: 'Enbiyâ Suresi, 21/89',
        tags: ['evlat', 'hayirli-evlat', 'dua', 'zekeriya'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'çocuk sahibi olma niyeti',
          'manevi odaklanma',
          'aile duası',
        ],
      },
      {
        key: 'evlat-rabbi-heb-li-min-ledunke',
        nameArabic:
          'رَبِّ هَبْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ',
        nameTurkish: 'Temiz Nesil Duası',
        transliteration:
          "Rabbi heb lî min ledunke zürriyyeten tayyibeten inneke semî'u'd-duâ.",
        meaning:
          'Rabbim, bana katından tertemiz bir nesil ihsan eyle; şüphesiz Sen duayı işitensin.',
        virtue:
          'Neslin ahlaklı, temiz ve salih olması niyetiyle okunan güçlü ayet dualarındandır.',
        source: 'Âl-i İmrân Suresi, 3/38',
        tags: ['evlat', 'hayirli-evlat', 'dua', 'nesil'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['hayırlı nesil', 'dua kabulü', 'aile saadeti'],
      },
      {
        key: 'evlat-rabbi-heb-li-mine-salihin',
        nameArabic: 'رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ',
        nameTurkish: "Hz. İbrahim'in Evlat Duası",
        transliteration: "Rabbi heb lî mine's-sâlihîn.",
        meaning: 'Rabbim, bana salihlerden bir evlat bağışla.',
        virtue:
          'Doğacak çocuğun dindar, hayırlı ve ana-babasına itaatkar olması niyetiyle okunur.',
        source: 'Sâffât Suresi, 37/100',
        tags: ['evlat', 'hayirli-evlat', 'salih-nesil', 'dua'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: ['salih evlat', 'dindar nesil', 'aile duası'],
      },
      {
        key: 'evlat-rabbena-heb-lena-min-ezvacina',
        nameArabic:
          'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
        nameTurkish: 'Aile ve Zürriyet Duası',
        transliteration:
          "Rabbenâ heb lenâ min ezvâcinâ ve zürriyyâtinâ kurrate a'yunin vec'alnâ lil-müttakîne imâmâ.",
        meaning:
          'Rabbimiz, eşlerimizden ve neslimizden göz aydınlığı ihsan et; bizi takva sahiplerine önder kıl.',
        virtue:
          'Aile içi sevgi ve manevi bağı güçlendirmek, göz aydınlığı olacak hayırlı evlatlar için okunur.',
        source: 'Furkân Suresi, 25/74',
        tags: ['evlat', 'aile', 'zürriyet', 'dua'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'aile huzuru',
          'hayırlı zürriyet',
          'eşler arası muhabbet',
        ],
      },
      {
        key: 'evlat-rabbi-inni-nezertu',
        nameArabic:
          'رَبِّ إِنِّي نَذَرْتُ لَكَ مَا فِي بَطْنِي مُحَرَّرًا فَتَقَبَّلْ مِنِّي',
        nameTurkish: "Hz. Meryem'in Annesinin Duası",
        transliteration:
          'Rabbi innî nezertu leke mâ fî batnî muharreren fe tekabbel minnî.',
        meaning: 'Rabbim, karnımdakini yalnız sana adadım; benden kabul buyur.',
        virtue:
          'Bebeğin hayırlı ve ahlaklı yetişmesi, hamilelik sürecinin kolay geçmesi niyetiyle okunur.',
        source: 'Âl-i İmrân Suresi, 3/35',
        tags: ['evlat', 'hamilelik', 'dua', 'adanmislik'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['hamilelik duası', 'hayırlı evlat', 'manevi korunma'],
      },
      {
        key: 'evlat-inne-rabbeke-huvel-hallakul-alim',
        nameArabic: 'إِنَّ رَبَّكَ هُوَ الْخَلَّاقُ الْعَلِيمُ',
        nameTurkish: 'Hâllâk ve Alîm Esması Ayeti',
        transliteration: "İnne rabbeke huve'l-hallâku'l-alîm.",
        meaning: 'Muhakkak Rabbin, her türlü yaratmayı hakkıyla bilendir.',
        virtue:
          'Yaratılış sürecinde ilahi ilme sığınma niyetiyle; 3 ay geceleri 1267 tekrar tertibi aktarılmıştır.',
        source: 'Hicr Suresi, 15/86',
        tags: ['evlat', 'yaratilis', 'hamilelik', 'ayet'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'night',
        recommendedCount: 1267,
        suitableFor: ['hamilelik süreci', '3 aylık tertip', 'manevi teselli'],
      },
      {
        key: 'evlat-fallahu-huvel-veliyyu-ve-huve-yuhyi',
        nameArabic: 'فَاللّٰهُ هُوَ الْوَلِيُّ وَهُوَ يُحْيِي',
        nameTurkish: 'Veliyy ve Muhyî Ayeti',
        transliteration: "Fallâhu huve'l-veliyyu ve huve yuhyî.",
        meaning: "Şüphesiz Allah tek dosttur; hayat veren ve dirilten O'dur.",
        virtue:
          'Eşlerin çocuk sahibi olmaya manevi hazırlığı için birliktelik öncesi okunması tavsiye edilir.',
        source: 'Şûrâ Suresi, 42/9',
        tags: ['evlat', 'aile', 'birliktelik', 'ayet'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 289,
        suitableFor: ['evlat niyeti', 'eş duası', 'birliktelik öncesi'],
      },
      {
        key: 'evlat-huvel-lahul-haliqul-bariu',
        nameArabic: 'هُوَ اللّٰهُ الْخَالِقُ الْبَارِئُ',
        nameTurkish: 'Hâlık-Bârî Esma Ayeti',
        transliteration: "Huve'l-lâhu'l-hâliku'l-bâriü.",
        meaning: 'O, yaratan ve yoktan var edendir.',
        virtue:
          'Maddi-manevi engellerin aşılması ve yaratılış mucizesinin tecellisi niyetiyle okunur.',
        source: 'Haşr Suresi, 59/24',
        tags: ['evlat', 'esma', 'halik', 'bari'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 1054,
        suitableFor: [
          'hamilelikte kolaylık',
          'engellerin kalkması',
          'hayırlı evlat',
        ],
      },
      {
        key: 'evlat-estagfirullah-el-azim-el-lezi',
        nameArabic:
          'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        nameTurkish: 'Hayy Kayyum İstiğfarı',
        transliteration:
          "Estağfirullah el-azîm el-lezî lâ ilâhe illâ huve'l-hayye'l-kayyûme ve etûbü ileyh.",
        meaning:
          'Hayy ve Kayyum olan Allah’tan bağışlanma diler, günahlarıma tövbe ederim.',
        virtue:
          'Tövbe ve istiğfarın, ilahi rızık ve evlat nimetinin kapılarını açan anahtarlardan olduğu aktarılır.',
        source: 'Nûh Suresi 71/10-12; hadis rivayetleri',
        tags: ['evlat', 'istigfar', 'tevbe', 'dua'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['günlük istiğfar', 'alternatif 700', 'manevi arınma'],
      },
      {
        key: 'evlat-bismillah-allahumme-cennibnes-seytan',
        nameArabic:
          'بِسْمِ اللّٰهِ اللّٰهُمَّ جَنِّبْنَا الشَّيْطَانَ وَجَنِّبِ الشَّيْطَانَ مَا رَزَقْتَنَا',
        nameTurkish: 'Birliktelik Öncesi Korunma Duası',
        transliteration:
          "Bismillâh. Allâhümme cennibne'ş-şeytâne ve cennibi'ş-şeytâne mâ razaktenâ.",
        meaning:
          "Allah'ım, şeytanı bizden ve bize ihsan edeceğin evlattan uzaklaştır.",
        virtue:
          'Birliktelik öncesinde okunduğunda, doğacak çocuğun şeytanın zararından korunacağı müjdelenmiştir.',
        source: 'Sahih-i Müslim, Nikâh, 11',
        tags: ['evlat', 'korunma', 'aile', 'dua'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['birliktelik öncesi', 'evlat korunması', 'aile duası'],
      },
      {
        key: 'evlat-allahummecalni-zurriyyeten-tayyibeten',
        nameArabic:
          'اللّٰهُمَّ اجْعَلْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً مُطِيعَةً',
        nameTurkish: 'Temiz ve İtaatkâr Nesil Duası',
        transliteration:
          "Allâhümmec'alnî min ledünke zürriyyeten tayyibeten mutîaten.",
        meaning:
          'Allahım, bana katından temiz, saygılı ve itaatkar bir nesil ihsan eyle.',
        virtue:
          'Eşlerin birliktelik öncesinde besmele ve 3 İhlas sonrası yaptığı dua tertiplerindendir.',
        source: 'Bilal Eren, Açıklamalı Büyük Dua Hazinesi',
        tags: ['evlat', 'dua', 'nesil', 'ihlas-tertibi'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['3 ihlas sonrası', 'evlat niyeti', 'aile duası'],
      },
      {
        key: 'evlat-ya-musavvir',
        nameArabic: 'يَا مُصَوِّرُ',
        nameTurkish: 'Yâ Musavvir',
        transliteration: 'Yâ Musavvir',
        meaning: 'Her şeye şekil, suret ve hususiyet veren Allah.',
        virtue:
          'Çocuğun ahlaken ve fıtraten güzel olması, fiziksel gelişiminin sağlıklı olması için zikredilir.',
        source: 'Esma-i Hüsna; Haşr Suresi 59/24',
        tags: ['evlat', 'esma', 'musavvir', 'hamilelik'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 336,
        suitableFor: ['sağlıklı gelişim', 'hayırlı nesil', 'hamilelik süreci'],
      },
      {
        key: 'evlat-ya-bari',
        nameArabic: 'يَا بَارِئُ',
        nameTurkish: 'Yâ Bâri’',
        transliteration: 'Yâ Bâri’',
        meaning: 'Her şeyi kusursuz ve uyumlu yaratan Allah.',
        virtue:
          'Embriyonun gelişim sürecinde fiziksel bozukluklardan korunma ve selamet niyetiyle zikredilir.',
        source: 'Esma-i Hüsna; Haşr Suresi 59/24',
        tags: ['evlat', 'esma', 'bari', 'hamilelik'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 214,
        suitableFor: ['hamilelikte selamet', 'fiziksel gelişim', 'korunma'],
      },
      {
        key: 'evlat-ya-mubdi',
        nameArabic: 'يَا مُبْدِئُ',
        nameTurkish: 'Yâ Mübdi’',
        transliteration: 'Yâ Mübdi’',
        meaning: 'Maddesiz ve örneksiz olarak ilk kez yaratan Allah.',
        virtue:
          'Düşük riskini önleme ve hamileliğin vaktinde tamamlanması niyetiyle seherde okunur.',
        source: 'Esma-i Hüsna Sırları',
        tags: ['evlat', 'esma', 'mubdi', 'seher'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'morning',
        recommendedCount: 99,
        suitableFor: [
          'seher virdi',
          'hamilelikte korunma',
          'düşük riskine karşı dua',
        ],
      },
      {
        key: 'evlat-es-samed',
        nameArabic: 'الصَّمَدُ',
        nameTurkish: 'Es-Samed',
        transliteration: 'Es-Samed',
        meaning:
          'Hiçbir şeye muhtaç olmayan, her şeyin kendisine muhtaç olduğu yaratıcı.',
        virtue:
          'Evlat isteyenlerin sabah ve gece düzenli zikriyle hayırlı nesle vesile olacağı aktarılır.',
        source: 'Esma-i Hüsna Tecellileri',
        tags: ['evlat', 'esma', 'samed', 'zikir'],
        categories: ['genel', 'aile', 'evlat'],
        timeOfDay: 'any',
        recommendedCount: 1000,
        suitableFor: [
          'evlat sahibi olma niyeti',
          'sabah-gece virdi',
          'hayırlı nesil',
        ],
      },
    ],
    specialDays: [],
  },
  {
    key: 'koruyucu-zikirler',
    label: 'Büyü, Nazar ve Vesveseye Karşı Koruyucu Zikirler',
    dhikrItems: [
      {
        key: 'korunma-muavvizeteyn-felak-nas',
        nameArabic:
          'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلٰهِ النَّاسِ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الْجِنَّةِ وَالنَّاسِ',
        nameTurkish: 'Muavvizeteyn (Felak ve Nâs Sureleri)',
        transliteration:
          "Kul eûzü bi-rabbi'l-felak. Min şerri mâ halak. Ve min şerri ğâsikın izâ vekab. Ve min şerri'n-neffâsâti fi'l-ukad. Ve min şerri hâsidin izâ hased. Kul eûzü bi-rabbi'n-nâs. Meliki'n-nâs. İlâhi'n-nâs. Min şerri'l-vesvâsi'l-hannâs. Ellezî yüvesvisü fî sudûri'n-nâs. Mine'l-cinneti ve'n-nâs.",
        meaning:
          'Felak: Yaratılmışların, gecenin, düğümlere üfleyenlerin ve hasetçinin şerrinden Allaha sığınırım. Nâs: Vesvese verenin şerrinden insanların Rabbine, Melikine ve İlahına sığınırım.',
        virtue:
          'Peygamber Efendimizin büyü, nazar, sihir ve vesveseye karşı en çok okuduğu korunma sureleridir.',
        source:
          "Buhârî, Ehâdîsü'l-Enbiyâ 10; Tirmizî, Tıb 16; Nesâî, İstiâze 37; Ebû Dâvûd",
        tags: ['korunma', 'nazar', 'buyu', 'vesvese', 'felak', 'nas'],
        categories: ['genel', 'korunma', 'nazar'],
        timeOfDay: 'any',
        recommendedCount: 3,
        suitableFor: [
          'sabah-akşam korunma',
          'nazar',
          'vesvese',
          'manevi sığınma',
        ],
      },
      {
        key: 'korunma-ayetel-kursi-tam',
        nameArabic:
          'اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        nameTurkish: 'Âyetel Kürsî (Tam)',
        transliteration:
          "Allâhu lâ ilâhe illâ hüvel hayyül kayyûm. Lâ te'huzuhû sinetün ve lâ nevm. Lehû mâ fis-semâvâti ve mâ fil-ard. Men zellezî yeşfeu indehû illâ bi-iznih. Ya'lemu mâ beyne eydîhim ve mâ halfehüm. Ve lâ yuhîtûne bi şey'in min ilmihî illâ bimâ şâ'. Vesia kürsiyyühüs-semâvâti vel-ard. Ve lâ yeûdühû hifzuhümâ. Ve hüvel aliyyül azîm.",
        meaning:
          "Allah, kendisinden başka ilah olmayandır; diridir, kayyumdur. O'nu ne uyuklama ne uyku tutar... O yücedir, büyüktür.",
        virtue:
          'Şeytan, cin, nazar ve manevi baskılara karşı en güçlü korunma ayetlerinden biri kabul edilir.',
        source: 'Bakara Suresi, 2/255',
        tags: ['korunma', 'ayetel-kursi', 'nazar', 'buyu', 'vesvese'],
        categories: ['genel', 'korunma', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 3,
        suitableFor: ['sabah-akşam virdi', 'ev korunması', 'nazar ve vesvese'],
      },
      {
        key: 'korunma-bismillahillezi',
        nameArabic:
          'بِسْمِ اللّٰهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        nameTurkish: 'Bismillâhillezî Duası',
        transliteration:
          "Bismillâhillezî lâ yedurru me'asmihî şey'ün fil erdi ve lâ fis-semâi ve hüves-semî'ul alîm.",
        meaning:
          "Allah'ın adıyla; O'nun ismiyle yerde ve gökte hiçbir şey zarar veremez. O her şeyi işitendir, bilendir.",
        virtue:
          'Sabah-akşam üçer defa okunmasıyla ani bela, musibet, nazar ve manevi zararlara karşı korunma niyeti taşır.',
        source: 'İbn Mâce, Dua 11; Ebû Dâvûd, Edeb 102-103; Tirmizî, Daavât 40',
        tags: ['korunma', 'nazar', 'bela', 'dua'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 3,
        suitableFor: ['sabah-akşam', 'ani belalara karşı', 'nazar korunması'],
      },
      {
        key: 'korunma-kelimatillahit-tamme',
        nameArabic:
          'أُعِيذُ بِكَلِمَاتِ اللّٰهِ التَّامَّةِ مِنْ شَرِّ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ شَرِّ كُلِّ عَيْنٍ لَامَّةٍ',
        nameTurkish: 'Kelimâtillâhit-tâmme Duası',
        transliteration:
          "Eûzü bi-kelimâtillâhi't-tâmmeti min şerri külli şeytânin ve hâmmetin ve min şerri külli aynin lâmmetin.",
        meaning:
          "Allah'ın eksiksiz kelimelerine; her şeytanın, her zararlı canlının ve her kem gözün şerrinden sığınırım.",
        virtue:
          'Nazar, cin etkisi ve görünmeyen ruhani olumsuzluklara karşı güçlü bir korunma duası olarak okunur.',
        source:
          "Buhârî, Ehâdîsü'l-Enbiyâ 10; Müslim, Zikir 54; Tirmizî, Daavât 40",
        tags: ['korunma', 'nazar', 'cin', 'dua'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['çocuk korunması', 'kem göz', 'manevi sığınma'],
      },
      {
        key: 'korunma-hasbunallahu-ve-nimel-vekil',
        nameArabic: 'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ',
        nameTurkish: "Hasbünallâhu ve Ni'mel Vekîl",
        transliteration: "Hasbünallâhu ve ni'mel vekîl.",
        meaning: 'Allah bize yeter; O ne güzel vekildir.',
        virtue:
          'Haksız beddua, düşman korkusu ve ruhani darlıklarda müminin sığınacağı en büyük tevekkül zikirlerindendir.',
        source: 'Âl-i İmrân 3/173; Buhârî, Tefsir 13',
        tags: ['korunma', 'tevekkul', 'beddua', 'korku'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['korku anları', 'haksızlık', 'ruhani daralma'],
      },
      {
        key: 'korunma-kalem-sonu-51-52',
        nameArabic:
          'وَإِنْ يَكَادُ الَّذِينَ كَفَرُوا لَيُزْلِقُونَكَ بِأَبْصَارِهِمْ لَمَّا سَمِعُوا الذِّكْرَ وَيَقُولُونَ إِنَّهُ لَمَجْنُونٌ وَمَا هُوَ إِلَّا ذِكْرٌ لِلْعَالَمِينَ',
        nameTurkish: 'Kalem Suresi Sonu (Nazar Ayeti)',
        transliteration:
          'Ve in yekâdüllezîne keferû leyüzlikûneke bi-ebsârihim lemmâ semiûz-zikra ve yekûlûne innehu lemecnûn. Ve mâ huve illâ zikrun lil âlemîn.',
        meaning:
          'İnkarcılar zikri işitince neredeyse seni gözleriyle devireceklerdi... Oysa bu, alemler için bir öğüttür.',
        virtue:
          'Nazarın yıkıcı etkilerine karşı günlük korunma tertiplerinde sıkça okunur.',
        source: 'Kalem Suresi, 68/51-52',
        tags: ['korunma', 'nazar', 'kalem', 'ayet'],
        categories: ['genel', 'korunma', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['nazar korunması', 'ruhani baskı', 'günlük vird'],
      },
      {
        key: 'korunma-la-havle',
        nameArabic:
          'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
        nameTurkish: 'Lâ Havle Zikri (Korunma)',
        transliteration: 'Lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm.',
        meaning: "Güç ve kuvvet yalnızca yüce Allah'ın yardımıyladır.",
        virtue:
          'Ağır manevi baskı, vesvese ve ruhani daralmalara karşı iç kuvvet ve korunma niyetiyle okunur.',
        source: 'İmam-ı Rabbani, Mektubat; alimlerin tavsiyeleri',
        tags: ['korunma', 'vesvese', 'havkale', 'manevi-guc'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 500,
        suitableFor: ['vesvese', 'ruhani daralma', 'manevi direnç'],
      },
      {
        key: keyMap.HZYUSUF,
        nameArabic:
          'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
        nameTurkish: "Hz. Yunus'un Duası",
        transliteration:
          'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn.',
        meaning:
          'Senden başka hiçbir ilâh yoktur. Seni bütün noksan sıfatlardan tenzih ederim. Gerçekten ben zâlimlerden (kendi nefsine haksızlık edenlerden) oldum.',
        virtue:
          'Ağır manevi hava, içsel tıkanıklık ve beddua etkisi korkusunda sığınılacak güçlü bir yakarıştır. Ağır travmalar, kederler, çaresizlikler ve her türlü psikolojik darlıktan kurtulmaya vesile olur. Kişinin kendi sınırlarını kabul edip mutlak güce sığınmasını sağlayarak bilişsel yükü hafifletir.',
        source: 'Enbiyâ Suresi, 87. Ayet / Tirmizî; İbn Sünnî ',
        tags: ['korunma', 'yunus-duasi', 'vesvese', 'sıkıntı'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 41,
        suitableFor: [
          'ruhani sıkıntı',
          'vesvese',
          'manevi arınma',
          'darlık anları',
        ],
      },
      {
        key: 'korunma-suyuti-vesvese-duasi',
        nameArabic:
          'يَا اللّٰهُ الرَّقِيبُ الْحَفِيظُ الرَّحِيمُ يَا اللّٰهُ الْحَيُّ الْحَلِيمُ الْعَظِيمُ الرَّؤُوفُ الْكَرِيمُ',
        nameTurkish: "Süyuti'nin Vesvese ve Korunma Duası",
        transliteration:
          'Yâ Allahür-rakîbül-hafîzür-rahîm. Yâ Allahür-hayyül-halîmül-azîmür-raûfül-kerîm...',
        meaning:
          'Ey gözeten, koruyan, merhamet eden Allahım; benimle şeytan arasına set çek.',
        virtue:
          'İçsel vesvese, ani korkular ve ruhî bunalımlara karşı günlük korunma virdi olarak okunur.',
        source: 'Celaleddin-i Süyuti; İmam-ı Gazali',
        tags: ['korunma', 'vesvese', 'zikir', 'sukunet'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['vesvese kontrolü', 'ani korku', 'ruhi denge'],
      },
      {
        key: 'korunma-dua-i-sifa',
        nameArabic:
          'اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ كُلِّ ضُرٍّ وَأَدْرِ عَنِّي مَا يَضُرُّنِي',
        nameTurkish: 'Dua-i Şifa',
        transliteration:
          'Allâhümme innî eûzü bike min külli durrin ve edurrî men lem yedurruh.',
        meaning:
          "Allah'ım, zarardan sana sığınırım; bana zarar verecek şeyleri benden uzaklaştır.",
        virtue:
          'Nazar, haset ve haksız bedduaların ruhani ağırlığına karşı arınma niyetiyle okunur.',
        source: 'Manevi şifa kaynakları ve dua mecmuaları',
        tags: ['korunma', 'sifa', 'nazar', 'haset'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['nazar etkisi', 'haset', 'ruhani temizlik'],
      },
      {
        key: 'korunma-iman-ikrari-zikri',
        nameArabic: 'آمَنْتُ بِاللّٰهِ وَرُسُلِهِ',
        nameTurkish: 'İman İkrarı Zikri',
        transliteration: 'Âmentü billâhi ve rusulih.',
        meaning: "Allah'a ve O'nun gönderdiği elçilere iman ettim.",
        virtue:
          'Şeytanın inançla ilgili vesveselerini kesmek için tavsiye edilen iman tazeleme zikridir.',
        source: "Buhârî, Bed'ü'l-Halk 11; Müslim, Îmân 212",
        tags: ['korunma', 'iman', 'vesvese', 'zikir'],
        categories: ['genel', 'korunma', 'iman'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['itikadi vesvese', 'iman tazeleme', 'zihinsel netlik'],
      },
      {
        key: 'korunma-estagfirullah-min-kulli-ma-kerihallah',
        nameArabic: 'أَسْتَغْفِرُ اللّٰهَ مِنْ كُلِّ مَا كَرِهَ اللّٰهُ',
        nameTurkish: 'Estağfirullah min külli mâ kerihallah',
        transliteration: 'Estağfirullah min külli mâ kerihallah.',
        meaning:
          "Allah'ın razı olmadığı her şey için O'ndan bağışlanma dilerim.",
        virtue:
          'Maddi-manevi sıkıntılar, nazar ve beddua etkilerinden arınmaya yönelik istiğfar tertibidir.',
        source: 'İmam-ı Rabbani, Mektubat',
        tags: ['korunma', 'istigfar', 'arinma', 'beddua'],
        categories: ['genel', 'korunma', 'istigfar'],
        timeOfDay: 'any',
        recommendedCount: 70,
        suitableFor: ['günlük istiğfar', 'beddua korkusu', 'manevi temizlik'],
      },
      {
        key: 'korunma-suhreverdi-tehlikeyi-onleme',
        nameArabic:
          'بِسْمِ اللّٰهِ مَا شَاءَ اللّٰهُ لَا قُوَّةَ إِلَّا بِاللّٰهِ',
        nameTurkish: "Sühreverdi'nin Tehlikeyi Önleme Duası",
        transliteration: 'Bismillâhi mâ şâallâh lâ kuvvete illâ billâh...',
        meaning:
          "Allah'ın adıyla; Allah ne dilerse o olur, güç ve kuvvet ancak O'nundur.",
        virtue:
          'Sabah okunması halinde ani tehlikeler, kötü düşünceler ve ruhani musibetlerden korunma niyeti taşır.',
        source: "Şeyh Sihâbüddin Sühreverdi, Avarifü'l-Maarif",
        tags: ['korunma', 'tehlike', 'sabah-virdi', 'dua'],
        categories: ['genel', 'korunma', 'dua'],
        timeOfDay: 'morning',
        recommendedCount: 3,
        suitableFor: [
          'tehlike korkusu',
          'kötü düşünceler',
          'gün başlangıcı korunma',
        ],
      },
      {
        key: 'korunma-bakara-ilk-ve-son-ayetler',
        nameArabic:
          'الم ذٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنْفِقُونَ وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنْزِلَ إِلَيْكَ وَمَا أُنْزِلَ مِنْ قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ أُولٰئِكَ عَلٰى هُدًى مِنْ رَبِّهِمْ وَأُولٰئِكَ هُمُ الْمُفْلِحُونَ ۝ آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
        nameTurkish: 'Bakara Suresi İlk ve Son Ayetler Tertibi',
        transliteration:
          "Elif-lâm-mîm... Ülâike alâ hüden min rabbihim ve ülâike hümül-müflihûn. Âmener-rasûlü bimâ ünzile ileyhi min rabbihî vel-mü'minûn... fensurnâ alel-kavmil-kâfirîn.",
        meaning:
          'Bakara suresinin ilk ayetlerindeki hidayet ve son ayetlerdeki iman-teslimiyet dualarını birlikte ihtiva eden tertip.',
        virtue:
          'Sabah-akşam ruhani baskı altındaki kimselere okunarak manevi arınma ve korunma niyetiyle uygulanır.',
        source: 'İbn Mâce, Tirmizî, Darimî; geleneksel koruma tertipleri',
        tags: ['korunma', 'bakara', 'amenerrasulu', 'hidayet'],
        categories: ['genel', 'korunma', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['sabah-akşam tilavet', 'ruhani arınma', 'ev korunması'],
      },
      {
        key: 'korunma-nisa-100-ayet-tertibi',
        nameArabic:
          'وَمَنْ يَخْرُجْ مِنْ بَيْتِهِ مُهَاجِرًا إِلَى اللّٰهِ وَرَسُولِهِ ثُمَّ يُدْرِكْهُ الْمَوْتُ فَقَدْ وَقَعَ أَجْرُهُ عَلَى اللّٰهِ',
        nameTurkish: 'Nisa Suresi 100. Ayet Tertibi',
        transliteration:
          'Ve men yahruc min beytihî muhâciran ilallâhi ve rasûlihî sümme yüdrikhhul mevtü fekad vekaa ecruhû alallâh.',
        meaning:
          "Kim Allah ve Resulü uğrunda hicret ederek evinden çıkar da sonra ölüm yetişirse, mükafatı Allah'a aittir.",
        virtue:
          'Geleneksel havass uygulamalarında güçlü manevi blokajları çözmek için okunan tertipler arasında zikredilir.',
        source: 'Nisâ Suresi, 4/100',
        tags: ['korunma', 'nisa', 'ayet', 'buyu'],
        categories: ['genel', 'korunma', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['manevi blokaj', 'ruhani baskı', 'korunma niyeti'],
      },
    ],
    specialDays: [],
  },
  {
    key: 'dogal-afetlerden-korunma-zikirleri',
    label: 'Doğal Afetlerden Korunma Zikirleri',
    dhikrItems: [
      {
        key: 'afet-allahumme-hfazni-min-beyni-yedeyye',
        nameArabic:
          'اللّٰهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
        nameTurkish: 'Altı Yönden Korunma Duası',
        transliteration:
          'Allâhümmahfaznî min beyni yedeyye ve min halfî ve an yemînî ve an şimâlî ve min fevkî ve eûzü bi-azametike en uğtâle min tahtî.',
        meaning:
          "Allah'ım, beni önümden, arkamdan, sağımdan, solumdan ve üstümden koru; altımdan gelecek helakten azametine sığınırım.",
        virtue:
          'Deprem, toprak kayması, çöküntü ve ani fiziksel felaketlere karşı kapsamlı sığınma duası olarak okunur.',
        source:
          'Ebû Dâvûd (Edeb, 110); Nesâî (İstiaze, 60); İbn Mâce (Dua, 14)',
        tags: ['afet', 'deprem', 'korunma', 'dua'],
        categories: ['genel', 'afet', 'korunma'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['deprem korkusu', 'yer sarsıntıları', 'günlük korunma'],
      },
      {
        key: 'afet-euzu-bi-kelimatillahit-tammati-min-serri-ma-halak',
        nameArabic:
          'أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        nameTurkish: 'Kelimatullah ile Sığınma Duası',
        transliteration: "Eûzü bi-kelimâtillâhi't-tâmmâti min şerri mâ halak.",
        meaning:
          "Yarattığı her şeyin şerrinden Allah'ın eksiksiz kelimelerine sığınırım.",
        virtue:
          'Konaklama, seyahat ve afet riski bulunan ortamlarda her türlü zararlı etkiye karşı okunur.',
        source: 'Sahih-i Müslim (Zikir, 54); Tirmizî (Deavât, 40)',
        tags: ['afet', 'seyahat', 'korunma', 'dua'],
        categories: ['genel', 'afet', 'korunma'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['seyahat', 'konaklama', 'afet riski'],
      },
      {
        key: 'afet-ebud-derda-duasi-tam',
        nameArabic:
          'اللّٰهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ عَلَيْكَ تَوَكَّلْتُ وَأَنْتَ رَبُّ الْعَرْشِ الْعَظِيمِ مَا شَاءَ اللّٰهُ كَانَ وَمَا لَمْ يَشَأْ لَمْ يَكُنْ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ أَعْلَمُ أَنَّ اللّٰهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ وَأَنَّ اللّٰهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا وَأَحْصَى كُلَّ شَيْءٍ عَدَدًا اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا إِنَّ رَبِّي عَلَى صِرَاطٍ مُسْتَقِيمٍ',
        nameTurkish: "Ebu'd-Derdâ Afet Korunma Duası",
        transliteration:
          "Allâhümme ente rabbî lâ ilâhe illâ ente aleyke tevekkeltü ve ente rabbü'l-arşi'l-azîm. Mâ şâallâhu kâne ve mâ lem yeşe' lem yekün. Lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm. A'lemu ennallâhe alâ külli şey'in kadîr ve ennallâhe kad ehâta bi-külli şey'in ilmen ve ahsâ külle şey'in adedâ. Allâhümme innî eûzü bike min şerri nefsî ve min şerri külli dâbbetin ente âhizün bi-nâsiyetihâ. İnne rabbî alâ sırâtın müstakîm.",
        meaning:
          "Allah'ım! Sen benim Rabbimsin... Nefsimin ve tüm canlıların şerrinden sana sığınırım.",
        virtue:
          'Sabah-akşam okunduğunda okuyanı, ailesini ve malını ani felaket, yangın, sel ve musibetlerden korumaya yönelik güçlü tevekkül duasıdır.',
        source: "Kenzü'l-Ummâl (Hadis No: 3432); İbnü's-Sünnî (Amelü'l-Yevm)",
        tags: ['afet', 'tevekkul', 'yangin', 'sel', 'korunma'],
        categories: ['genel', 'afet', 'korunma'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: [
          'sabah-akşam',
          'aile korunması',
          'ani felaketlerden sığınma',
        ],
      },
      {
        key: 'afet-subhanallahi-yusebbihur-rad',
        nameArabic:
          'سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ وَالْمَلَائِكَةُ مِنْ خِيفَتِهِ',
        nameTurkish: 'Gök Gürültüsü Zikri',
        transliteration:
          "Sübhânallezî yüsebbihur-ra'dü bihamdihî vel-melâiketü min hîfetihî.",
        meaning:
          "Gök gürültüsünün ve meleklerin O'nu tesbih ettiği Allah'ı noksan sıfatlardan tenzih ederim.",
        virtue:
          'Şiddetli gök gürültüsü, fırtına ve yıldırım anlarında atmosferik afetlere karşı okunur.',
        source: "İmam Mâlik (Muvatta, Sefer, 40); Ra'd Suresi 13. ayet tefsiri",
        tags: ['afet', 'firtina', 'yildirim', 'tesbih'],
        categories: ['genel', 'afet', 'korunma'],
        timeOfDay: 'any',
        recommendedCount: 3,
        suitableFor: ['fırtına', 'yıldırım', 'gök gürültüsü'],
      },
      {
        key: 'afet-bismillahi-ma-saallah-la-kuvvete',
        nameArabic:
          'بِسْمِ اللّٰهِ مَا شَاءَ اللّٰهُ لَا قُوَّةَ إِلَّا بِاللّٰهِ',
        nameTurkish: 'Bismillâhi Mâ Şâallah Tertibi',
        transliteration:
          'Bismillâhi mâ şâallah lâ kuvvete illâ billâh. Bismillâhi mâ şâallah lâ yesûkul hayre illallah. Bismillâhi mâ şâallah lâ yekşifüssûe illallah...',
        meaning:
          "Allah'ın adıyla; Allah ne dilerse o olur. Güç yalnız O'ndandır. Hayrı yalnız O sevk eder, kötülüğü yalnız O giderir.",
        virtue:
          'Her sabah üç defa okunması halinde yangın, boğulma, ani ölüm ve beklenmedik afetlere karşı korunma niyeti taşır.',
        source: 'Şeyh Şihâbüddin Sühreverdi hazretlerinin evradı',
        tags: ['afet', 'sabah-virdi', 'yangin', 'korunma'],
        categories: ['genel', 'afet', 'korunma'],
        timeOfDay: 'morning',
        recommendedCount: 3,
        suitableFor: ['sabah korunma', 'ani afetler', 'tehlikeden sakınma'],
      },
      {
        key: 'afet-allahumme-inni-eseluke-bi-enne-lekel-hamd',
        nameArabic:
          'اللّٰهُمَّ إِنِّي أَسْأَلُكَ بِأَنَّ لَكَ الْحَمْدَ لَا إِلٰهَ إِلَّا أَنْتَ يَا حَنَّانُ يَا مَنَّانُ يَا بَدِيعَ السَّمَاوَاتِ وَالْأَرْضِ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ يَا حَيُّ يَا قَيُّومُ',
        nameTurkish: 'İsm-i A’zam Tertibi Duası',
        transliteration:
          "Allâhümme innî es'elüke bi-enne lekel-hamd. Lâ ilâhe illâ ente, yâ Hannânü yâ Mennânü, yâ Bedî'as-semâvâti ve'l-ard, yâ Zelcelâli ve'l-ikrâm, yâ Hayyü yâ Kayyûm.",
        meaning:
          "Allah'ım! Hamd sanadır. Senden başka ilah yoktur. Ey Hannân, ey Mennân... ey Hayy ve Kayyûm!",
        virtue:
          "İçinde İsm-i A'zamı barındırdığı rivayet edilen yakarış olarak, afet ve büyük tehlike anlarında duanın süratle kabulü niyetiyle okunur.",
        source: 'Tirmizî (Deavât, 82); Ebû Dâvûd (Salât, 368)',
        tags: ['afet', 'dua', 'ismi-azam', 'korunma'],
        categories: ['genel', 'afet', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['büyük tehlike', 'afet anı', 'acil sığınma'],
      },
      {
        key: 'afet-allahumme-la-tektulna-bi-gadabik',
        nameArabic:
          'اللّٰهُمَّ لَا تَقْتُلْنَا بِغَضَبِكَ وَلَا تُهْلِكْنَا بِعَذَابِكَ وَعَافِنَا قَبْلَ ذٰلِكَ',
        nameTurkish: 'Gazaptan Sığınma Duası',
        transliteration:
          'Allâhümme lâ tektulnâ bi-gadabike velâ tuhliknâ bi-azâbike ve âfinâ kable zâlik.',
        meaning:
          "Allah'ım! Bizi gazabınla öldürme, azabınla helak etme; bunlardan önce bize afiyet ver.",
        virtue:
          'Deprem, semavi afetler ve şiddetli doğa olaylarında ilahi rahmete sığınma niyetiyle okunur.',
        source: 'Tirmizî (Deavât, 48); Ahmed b. Hanbel (Müsned, II, 116)',
        tags: ['afet', 'rahmet', 'siginma', 'dua'],
        categories: ['genel', 'afet', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 3,
        suitableFor: ['deprem', 'fırtına', 'afet korkusu'],
      },
      {
        key: 'afet-allahumme-inni-eseluke-hayraha',
        nameArabic:
          'اللّٰهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَخَيْرَ مَا فِيهَا وَخَيْرَ مَا أُرْسِلَتْ بِهِ وَأَعُوذُ بِكَ مِنْ شَرِّهَا وَشَرِّ مَا فِيهَا وَشَرِّ مَا أُرْسِلَتْ بِهِ',
        nameTurkish: 'Rüzgar ve Fırtına Duası',
        transliteration:
          "Allâhümme innî es'elüke hayrahâ ve hayra mâ fîhâ ve hayra mâ ürsilet bihî ve eûzü bike min şerrihâ ve şerri mâ fîhâ ve şerri mâ ürsilet bihî.",
        meaning:
          "Allah'ım! Bu rüzgarın hayrını ve gönderildiği hayrı dilerim; şerrinden sana sığınırım.",
        virtue:
          'Kasırga, hortum ve şiddetli rüzgarların yıkıcı afete dönüşmemesi için okunan Nebevi duadır.',
        source: 'Sahih-i Müslim (İstiskâ, 15)',
        tags: ['afet', 'ruzgar', 'firtina', 'dua'],
        categories: ['genel', 'afet', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 1,
        suitableFor: ['fırtına anı', 'şiddetli rüzgar', 'kasırga korkusu'],
      },
      {
        key: 'afet-bismillahi-ala-nefsi-ve-ehli-ve-mali',
        nameArabic: 'بِسْمِ اللّٰهِ عَلَى نَفْسِي وَأَهْلِي وَمَالِي',
        nameTurkish: 'Can, Aile ve Malı Allaha Havale Duası',
        transliteration: 'Bismillâhi alâ nefsî ve ehlî ve mâlî.',
        meaning:
          "Allah'ın adıyla kendimi, ailemi ve malımı Allah'ın himayesine bırakıyorum.",
        virtue:
          'Sabahları okunduğunda can, aile ve malın dış tehlikelere karşı korunmasına niyet edilir.',
        source: "Nesâî (Amelü'l-Yevm); İbnü's-Sünnî",
        tags: ['afet', 'aile', 'mal', 'korunma'],
        categories: ['genel', 'afet', 'dua'],
        timeOfDay: 'morning',
        recommendedCount: 1,
        suitableFor: ['aile korunması', 'mal emniyeti', 'gün başlangıcı'],
      },
      {
        key: 'afet-rabbi-kullu-seyin-hadimuke',
        nameArabic:
          'رَبِّ كُلُّ شَيْءٍ هَادِمُكَ رَبِّ فَاحْفَظْنَا وَانْصُرْنَا وَارْحَمْنَا',
        nameTurkish: 'Kozmik Korunma ve Nusret Duası',
        transliteration:
          "Rabbî küllü şey'in hâdimüke, rabbî fe'hfaznâ ve'nsurnâ ve'rhamnâ.",
        meaning:
          'Ey Rabbim! Her şey senin emrindedir; bizi koru, bize yardım et, bize merhamet et.',
        virtue:
          'Mahlukatın ve doğa olaylarının şerrine karşı ilahi koruma ve nusret talebi için okunur.',
        source: "Taberânî (el-Mu'cemü'l-Kebîr); Ebû Dâvûd",
        tags: ['afet', 'nusret', 'korunma', 'dua'],
        categories: ['genel', 'afet', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: ['afet korkusu', 'genel korunma', 'yardım talebi'],
      },
      {
        key: 'afet-kureys-suresi',
        nameArabic:
          'لِإِيلَافِ قُرَيْشٍ إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ فَلْيَعْبُدُوا رَبَّ هٰذَا الْبَيْتِ الَّذِي أَطْعَمَهُمْ مِنْ جُوعٍ وَآمَنَهُمْ مِنْ خَوْفٍ',
        nameTurkish: 'Kureyş Suresi',
        transliteration:
          "Li-îlâfi kureyş. Îlâfihim rıhlete'ş-şitâi ve's-sayf. Felya'budû rabbe hâzel-beyt. Ellezî at'amehüm min cûin ve âmenehüm min havf.",
        meaning:
          'Kureyşe kolaylaştırılan yolculuk nimetini hatırlatarak, açlık ve korkudan emin kılan Rabbe kulluğu emreder.',
        virtue:
          'Korkulu ve tehlikeli bölgelerde emniyet, sakinlik ve korunma niyetiyle okunan surelerdendir.',
        source: 'Kureyş Suresi (106); klasik tefsir kaynakları',
        tags: ['afet', 'emniyet', 'korku', 'sure'],
        categories: ['genel', 'afet', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 11,
        suitableFor: ['tehlikeli yolculuk', 'emniyet talebi', 'korku anları'],
      },
    ],
    specialDays: [],
  },
  {
    key: 'sikinti-kaygi-kriz-zikirleri',
    label: 'Sıkıntı, Kaygı ve Kriz Anı Zikirleri',
    dhikrItems: [
      {
        key: 'sikinti-insirah-suresi',
        nameArabic:
          'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ وَوَضَعْنَا عَنْكَ وِزْرَكَ الَّذِي أَنْقَضَ ظَهْرَكَ وَرَفَعْنَا لَكَ ذِكْرَكَ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا إِنَّ مَعَ الْعُسْرِ يُسْرًا فَإِذَا فَرَغْتَ فَانْصَبْ وَإِلَىٰ رَبِّكَ فَارْغَبْ',
        nameTurkish: 'İnşirah Suresi',
        transliteration:
          "Elem neşrah leke sadrek. Ve vada'nâ anke vizrek. Ellezî enkada zahrek. Ve refa'nâ leke zikrek. Feinne me'al'usri yüsren. İnne me'al'usri yüsren. Feizâ ferağte fensab. Ve ilâ Rabbike ferğab.",
        meaning:
          'Senin için bağrını açmadık mı? İndirmedik mi senden o yükünü? O sırtında gıcırdamakta olan yükünü? Senin şanını yüceltmedik mi? Demek ki zorlukla beraber bir kolaylık var. Evet, zorlukla beraber bir kolaylık var! O halde boş kaldığında yine kalk yorul ve ancak Rabbine yönel.',
        virtue:
          'Stres, endişe, iç daralması ve panik nöbeti anlarında kalbe manevi genişlik ve dinginlik verir. Kriz anında 3 veya 7 kere okunması; sağ el göğüs üzerine konularak 7 tekrar edilmesi, kalpteki darlığın hafiflemesine niyet edilen uygulamalardandır.',
        source: "İnşirah Suresi (Kur'an-ı Kerim, 94. Sure)",
        tags: ['sikinti', 'kaygi', 'kriz', 'insirah', 'panik', 'dua'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'kriz anı',
          'kaygı artışı',
          'iç daralması',
          'panik nöbeti',
          'stres yönetimi',
          '3-7 tekrar tertibi',
        ],
      },
      {
        key: 'sikinti-la-ilahe-illallahul-azimul-halim',
        nameArabic:
          'لَا إِلٰهَ إِلَّا اللّٰهُ الْعَظِيمُ الْحَلِيمُ لَا إِلٰهَ إِلَّا اللّٰهُ رَبُّ الْعَرْشِ الْعَظِيمِ لَا إِلٰهَ إِلَّا اللّٰهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
        nameTurkish: 'Kriz ve Keder Anı Tevhid Zikri',
        transliteration:
          'Lâ ilâhe illâllahül-azîmül-halîm. Lâ ilâhe illâllahu Rabbül-arşil-azîm. Lâ ilâhe illâllahu Rabbüs-semâvâti ve Rabbül-ardı ve Rabbül-arşil-kerîm.',
        meaning:
          "Azamet ve vakar sahibi Allah'tan başka ibadete layık ilah yoktur. Arş-ı Azam sahibi Allah'tan başka ibadete layık ilah yoktur. Göklerin, yerin ve Arş-ı Kerim'in sahibi Allah'tan başka ibadete layık ilah yoktur.",
        virtue:
          'Peygamber Efendimizin en ağır kriz, felaket, çaresizlik ve derin keder anlarında okuduğu sığınma zikridir. Yoğun kaygı ve panik anında zihni toparlayıp emniyet hissini güçlendirmeye vesile olur.',
        source: 'Buhârî (Tecrîd-i Sarîh: 2150); Müslim',
        tags: ['sikinti', 'kaygi', 'kriz', 'panik', 'tevhid', 'siginma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'kriz anı',
          'derin keder',
          'yoğun anksiyete',
          'panik hali',
          'çaresizlik hissi',
          'manevi emniyet',
        ],
      },
      {
        key: 'sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi',
        nameArabic:
          'أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ غَضَبِهِ وَشَرِّ عِبَادِهِ وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ',
        nameTurkish: 'Gece Panik ve Vesvese Sığınma Duası',
        transliteration:
          "Eûzü bi-kelimâtillâhi't-tâmmâti min gadabihî ve şerri ibâdihî ve min hemezâtiş-şeyâtîni ve en yehdurûn.",
        meaning:
          "Allah'ın gazabından, kullarının kötülüklerinden, şeytanların vesveselerinden ve onların yanımda bulunmalarından Allah'ın mükemmel kelimelerine sığınırım.",
        virtue:
          'Uykuda ani uyanmalar, gece panikleri, yalnızlık korkusu, dehşet halleri ve yüksek anksiyete semptomlarını hafifletmede etkili bir sığınma duasıdır; kalbe emniyet hissi aşılar.',
        source: 'Tirmizî (Daavât, 94)',
        tags: ['sikinti', 'kaygi', 'gece-panigi', 'vesvese', 'siginma', 'dua'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'dua'],
        timeOfDay: 'night',
        recommendedCount: 7,
        suitableFor: [
          'gece anksiyetesi',
          'ani uyanma',
          'panik hali',
          'yalnızlık korkusu',
          'vesvese',
          'manevi emniyet',
        ],
      },
      {
        key: 'sikinti-inna-lillahi-ve-inna-ileyhi-raciun',
        nameArabic:
          'إِنَّا لِلّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللّٰهُمَّ عِنْدَكَ أَحْتَسِبُ مُصِيبَتِي فَأْجِرْنِي فِيهَا وَأَبْدِلْ لِي بِهَا خَيْرًا مِنْهَا',
        nameTurkish: 'Musibet ve Teslimiyet Duası',
        transliteration:
          'İnnâ lillâhi ve innâ ileyhi râciûn. Allahümme ındeke ahtesibü musîbetî feecirnî fîhâ ve ebdil lî bihâ hayran minhâ.',
        meaning:
          "Şüphesiz biz Allah'ın mülküyüz ve O'na döneceğiz. Allah'ım, bu musibetin ecrini Senin katından dilerim; bunda bana ecir ver ve yerine daha hayırlısını lütfet.",
        virtue:
          'Beklenmedik şoklar, kayıplar ve travmatik olaylar karşısında zihinsel dağılmayı azaltır; isyan dürtüsünü teslimiyet ve kabul düzeyine çekerek kalbi teskin eder.',
        source: 'Bakara Suresi, 2/156; Ebû Dâvud (Cenâiz: 3119); Müslim',
        tags: ['sikinti', 'musibet', 'kayip', 'travma', 'teslimiyet', 'dua'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'ani kayıp',
          'şok anı',
          'travmatik olaylar',
          'yas süreci',
          'kalbi teskin',
          'teslimiyet',
        ],
      },
      {
        key: 'sikinti-ya-uddeti-inde-siddeti',
        nameArabic:
          'يَا عُدَّتِي عِنْدَ شِدَّتِي وَيَا غَوْثِي عِنْدَ كُرْبَتِي أُحْرُسْنِي بِعَيْنِكَ الَّتِي لَا تَنَامُ وَاكْفِنِي بِرُكْنِكَ الَّذِي لَا يُرَامُ',
        nameTurkish: 'Şiddet ve Kurbette İmdad Duası',
        transliteration:
          "Yâ uddetî ınde şiddetî ve yâ gâvsî ınde kürbetî! Ührüsnî bi-aynikelletî lâ tenâmü vekfînî birüknike'llezî lâ yürâmü.",
        meaning:
          'Güçlükte desteğim, sıkıntıda imdadıma yetişen Rabbim! Beni hiç uyumayan gözünle muhafaza et; sarsılmaz kudretinle bana kafi gel ve yardım eyle.',
        virtue:
          'Yoğun çaresizlik, ağır kriz ve umutsuzluk anlarında kalbe emniyet ve dayanma gücü veren özel bir sığınma duası olarak okunur.',
        source: 'İmam Cafer-i Sadık Sıkıntı Duası',
        tags: ['sikinti', 'kriz', 'caresizlik', 'siginma', 'dua'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'ağır kriz',
          'çaresizlik hissi',
          'umutsuzluk anı',
          'manevi dayanma gücü',
          'kalbi emniyet',
        ],
      },
      {
        key: 'sikinti-allahu-allahu-rabbi',
        nameArabic: 'اللّٰهُ اللّٰهُ رَبِّي لَا أُشْرِكُ بِهِ شَيْئًا',
        nameTurkish: 'Tevhid ile Panik Yatıştırma Zikri',
        transliteration: "Allâhu Allâhu Rabbî lâ üşrikü bihî şey'en.",
        meaning: "Rabbim Allah'tır, Allah! Ben O'na hiçbir şeyi ortak koşmam.",
        virtue:
          'Panik atak dalgası veya yoğun korku hissedildiğinde 7 defa peş peşe söylendiğinde zihinsel odağı toparlayıp akut semptomları yatıştırmaya yardımcı olur.',
        source: 'Ebû Dâvud; Nesâî',
        tags: ['sikinti', 'kaygi', 'panik', 'tevhid', 'dua'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'panik atak dalgası',
          'ani korku',
          'akut kaygı',
          'zihinsel odaklanma',
          'tevhidle sakinleşme',
        ],
      },
      {
        key: 'sikinti-ya-muahhir',
        nameArabic: 'يَا مُؤَخِّرُ',
        nameTurkish: "Yâ Mu'ahhir",
        transliteration: "Yâ Mu'ahhir",
        meaning:
          'Dilediğini geriye bırakan, sakinleştiren, dinginleştiren ve erteleyen.',
        virtue:
          'Akut kaygı ve panik atak nöbetleri esnasında zihni sakinleştirir, kalp ritmini dengelemeye ve iç dinginliği artırmaya destek olur. Günlük 847 tekrar manevi denge niyetiyle uygulanır.',
        source: 'Esmâ-i Hüsnâ / Şifa Ekolü',
        tags: ['sikinti', 'kaygi', 'panik', 'esma', 'sukunet'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 847,
        suitableFor: [
          'akut anksiyete',
          'panik atak',
          'kalp çarpıntısı',
          'zihinsel sakinleşme',
          'manevi denge',
        ],
      },
      {
        key: 'sikinti-ya-muksit',
        nameArabic: 'يَا مُقْسِطُ',
        nameTurkish: 'Yâ Muksit',
        transliteration: 'Yâ Muksit',
        meaning:
          'Adaletle hükmeden, her şeyi yerli yerine koyan ve uyum sağlayan.',
        virtue:
          'İçsel öfke, hiddet, tahammülsüzlük ve yoğun iç sıkıntılarında sabah zikri olarak önerilir; duygusal dalgalanmaları yatıştırmaya yardımcı olur.',
        source: 'Esmâ-i Hüsnâ',
        tags: ['sikinti', 'kaygi', 'ofke', 'duygusal-denge', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'morning',
        recommendedCount: 209,
        suitableFor: [
          'içsel öfke',
          'hiddet hali',
          'tahammülsüzlük',
          'duygusal dalgalanma',
          'sabah tesbihi',
        ],
      },
      {
        key: 'sikinti-ya-zulcelali-vel-ikram',
        nameArabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        nameTurkish: "Yâ Zülcelâli Ve'l-İkrâm",
        transliteration: "Yâ Zülcelâli Ve'l-İkrâm",
        meaning: 'Sonsuz azamet (celal) ve ikram (lütuf) sahibi olan.',
        virtue:
          'Zihne musallat olan obsesif düşünce, takıntı, kuruntu ve inançla ilgili vesveselerden kurtulmak için sabah zikri olarak tavsiye edilir.',
        source: 'Esmâ-i Hüsnâ / Cevşen-ül Kebir',
        tags: ['sikinti', 'vesvese', 'obsesif-dusunce', 'takinti', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'morning',
        recommendedCount: 1155,
        suitableFor: [
          'obsesif düşünceler',
          'takıntılar',
          'kuruntular',
          'itikadi vesvese',
          'sabah tesbihi',
        ],
      },
      {
        key: 'sikinti-ya-rauf',
        nameArabic: 'يَا رَؤُوفُ',
        nameTurkish: 'Yâ Rauf',
        transliteration: 'Yâ Rauf',
        meaning: 'Çok şefkatli, merhametli ve son derece yumuşaklık gösteren.',
        virtue:
          'Öfke kontrolü zorlanan ve ani parlamalar yaşayan kişilerde sakinleşmeyi, kalpte şefkat ve merhamet hissinin yerleşmesini desteklemek için zikredilir.',
        source: 'Esmâ-i Hüsnâ / Şifa Ekolü',
        tags: ['sikinti', 'ofke-kontrolu', 'sakinlesme', 'sefkat', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 287,
        suitableFor: [
          'öfke kontrolü',
          'ani parlama',
          'duygusal yumuşama',
          'şefkat hissi',
          'sabah-ikindi zikri',
        ],
      },
      {
        key: 'sikinti-ya-mumin',
        nameArabic: 'يَا مُؤْمِنُ',
        nameTurkish: "Yâ Mü'min",
        transliteration: "Yâ Mü'min",
        meaning: 'Emniyet ve güven veren, gönüllere huzur ve iman bağışlayan.',
        virtue:
          'Gelecek kaygısı, ölüm korkusu ve hastalığa yakalanma endişesini yatıştırmak için sabah ve ikindi sonrası düzenli zikredilir.',
        source: 'Esmâ-i Hüsnâ',
        tags: ['sikinti', 'kaygi', 'korku', 'emniyet', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 136,
        suitableFor: [
          'gelecek kaygısı',
          'ölüm korkusu',
          'hastalık endişesi',
          'iç huzur',
          'sabah-ikindi zikri',
        ],
      },
      {
        key: 'sikinti-ya-muheymin',
        nameArabic: 'يَا مُهَيْمِنُ',
        nameTurkish: 'Yâ Müheymin',
        transliteration: 'Yâ Müheymin',
        meaning: 'Gözetip koruyan, her şeyin mutlak emniyetini sağlayan.',
        virtue:
          'Sosyal kaygı, paranoya ve başkalarının kötülüğünden korkma durumlarında korunma hissini güçlendirmek ve sezgiyi berraklaştırmak için zikredilir.',
        source: 'Esmâ-i Hüsnâ',
        tags: ['sikinti', 'sosyal-anksiyete', 'paranoya', 'korunma', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 145,
        suitableFor: [
          'sosyal anksiyete',
          'paranoya',
          'kötülük korkusu',
          'sezgi güçlendirme',
          'manevi emniyet',
        ],
      },
      {
        key: 'sikinti-ya-halik',
        nameArabic: 'يَا خَالِقُ',
        nameTurkish: 'Yâ Hâlık',
        transliteration: 'Yâ Hâlık',
        meaning: 'Yoktan var eden, her şeyi ölçülü ve düzenli yaratan.',
        virtue:
          'Çözülmesi güç düğümlenmiş işlerin açılması, hayal kırıklığı ve derin üzüntü/sıkıntı hallerinde manevi toparlanma için sabah ve ikindi vakitlerinde zikredilir.',
        source: 'Esmâ-i Hüsnâ',
        tags: [
          'sikinti',
          'uzuntu',
          'dugumlenmis-isler',
          'manevi-toparlanma',
          'esma',
        ],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 731,
        suitableFor: [
          'derin üzüntü',
          'hayal kırıklığı',
          'çözümü zor sorunlar',
          'işlerin açılması',
          'sabah-ikindi zikri',
        ],
      },
      {
        key: 'sikinti-ya-muizz',
        nameArabic: 'يَا مُعِزُّ',
        nameTurkish: 'Yâ Muizz',
        transliteration: 'Yâ Muizz',
        meaning: 'İzzet ve şeref veren, koruyup yücelten.',
        virtue:
          'Sosyal ortamlarda aşağılanma, yetersizlik hissi ve genel fobiler karşısında özgüveni ve manevi dayanıklılığı desteklemek için zikredilir.',
        source: 'Esmâ-i Hüsnâ',
        tags: ['sikinti', 'ozguven', 'sosyal-kaygi', 'fobi', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 117,
        suitableFor: [
          'aşağılanma korkusu',
          'yetersizlik hissi',
          'sosyal fobiler',
          'özgüven artışı',
          'manevi güç',
        ],
      },
      {
        key: 'sikinti-ya-metin',
        nameArabic: 'يَا مَتِينُ',
        nameTurkish: 'Yâ Metîn',
        transliteration: 'Yâ Metîn',
        meaning: 'Sarsılmaz derecede güçlü, metanet ve kudret sahibi.',
        virtue:
          'Tahammülsüzlük, açgözlülük, hırs ve olumsuz ahlaki eğilimlerden arınarak ruhsal dayanıklılık ve psikolojik metaneti güçlendirmeye destek olur.',
        source: 'Esmâ-i Hüsnâ',
        tags: ['sikinti', 'metanet', 'dayaniklilik', 'hirs-kontrolu', 'esma'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'morning',
        recommendedCount: 500,
        suitableFor: [
          'tahammülsüzlük',
          'hırs ve açgözlülük',
          'psikolojik metanet',
          'ruhsal dayanıklılık',
          'sabah zikri',
        ],
      },
      {
        key: 'sikinti-ya-selam-ya-latif-ya-vedud',
        nameArabic: 'يَا سَلَامُ يَا لَطِيفُ يَا وَدُودُ',
        nameTurkish: 'Yâ Selâm, Yâ Latîf, Yâ Vedûd',
        transliteration: 'Yâ Selâm, Yâ Latîf, Yâ Vedûd',
        meaning:
          'Esenlik veren, lütfeden ve sonsuz sevgiyle sarmalayan ilahi isimlerin terkibi.',
        virtue:
          'Kalbe derin bir sükunet ve sevgi iklimi kazandırmak, kaygı anında kalp sıkışmasını hafifletmek için ritmik şekilde zikredilir.',
        source: 'Esmâ-i Hüsnâ Terkibi',
        tags: ['sikinti', 'kaygi', 'kalp-sukuneti', 'sevgi', 'esma-terkibi'],
        categories: ['genel', 'kaygi-yonetimi', 'manevi-destek', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 99,
        suitableFor: [
          'anksiyete anı',
          'kalp sıkışması',
          'iç huzur',
          'duygusal yumuşama',
          'her biri 99 tekrar',
        ],
      },
    ],
    specialDays: [],
  },
  {
    key: 'is-hayati-zikirleri',
    label: 'İş Hayatı ve Kariyer Zikirleri',
    dhikrItems: [
      {
        key: 'is-allahumme-inni-eselukes-sebate',
        nameArabic:
          'اللّٰهُمَّ إِنِّي أَسْأَلُكَ الثَّبَاتَ فِي الْأَمْرِ وَأَسْأَلُكَ عَزِيمَةَ الرُّشْدِ وَأَسْأَلُكَ شُكْرَ نِعْمَتِكَ وَحُسْنَ عِبَادَتِكَ وَأَسْأَلُكَ لِسَانًا صَادِقًا وَقَلْبًا سَلِيمًا وَأَعُوذُ بِكَ مِنْ شَرِّ مَا تَعْلَمُ وَأَسْأَلُكَ مِنْ خَيْرِ مَا تَعْلَمُ وَأَسْتَغْفِرُكَ مِمَّا تَعْلَمُ إِنَّكَ أَنْتَ عَلَّامُ الْغُيُوبِ',
        nameTurkish: 'İşte Sebat ve Rüşd Duası',
        transliteration:
          "Allâhümme innî es'elüke's-sebâte fi'l-emri ve es'elüke 'azîmete'r-ruşdi. Ve es'elüke şükra ni'metike ve husne 'ıbâdetike. Ve es'elüke lisânen sâdikan ve kalben selîmen. Ve e'ûzü bike min şerri mâ ta'lemü. Ve es'elüke min hayri mâ ta'lemü. Ve estağfiruke mimmâ ta'lemü. İnneke ente 'allâmü'l-ğuyûb.",
        meaning:
          "Allah'ım! Senden dinde sebat etmeyi ve doğruluğa azmetmeyi istiyorum. Nimetine şükretmeyi ve sana güzel bir şekilde ibadet edebilmeyi istiyorum. Doğruyu konuşan bir dil ve eğriliklerden uzak bir kalp diliyorum. Bildiğin her çeşit şerden sana sığınıyorum. Bildiğin bütün hayırları senden istiyorum. Bildiğin günahlarımdan dolayı senden bağış diliyorum. Şüphesiz Sen gaybı bilensin.",
        virtue:
          'Yeni başlayan görev veya projelerde istikrarı korumak, zorluklar karşısında yılmamak, kurumsal dürüstlük ve profesyonel itibarı güçlendirmek için okunur.',
        source: "Tirmizî, De'avât, 23; Diyanet Haber Kayıtları",
        tags: ['is-hayati', 'kariyer', 'sebat', 'durustluk', 'dua'],
        categories: ['genel', 'is-hayati', 'kariyer', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'yeni görev başlangıcı',
          'proje yönetimi',
          'profesyonel itibar',
          'işte istikrar',
          'zorluklara karşı metanet',
        ],
      },
      {
        key: 'is-allahumme-ikfini-bi-helalike',
        nameArabic:
          'اللّٰهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
        nameTurkish: 'Helal Rızık ve İstiğna Duası',
        transliteration:
          "Allâhümme ikfînî bi helâlike an harâmike, veğninî bi fadlike ammen sivâke.",
        meaning:
          "Allah'ım! Bana helal rızık nasip et, beni haramdan koru; lütfunla beni kendinden başkasına muhtaç etme.",
        virtue:
          'Borç yükünden ve maddi sıkıntıdan kurtulmak, iş hayatında helal ve bereketli kazanç elde etmek, bağımsız ve kimseye muhtaç olmayan bir duruş kazanmak için tavsiye edilir.',
        source: "Hz. Ali'den rivayet; Tirmizî, Daavât, 121",
        tags: ['is-hayati', 'helal-rizik', 'borc', 'bereket', 'dua'],
        categories: ['genel', 'is-hayati', 'kariyer', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 70,
        suitableFor: [
          'borç yükü',
          'maddi sıkıntı',
          'helal kazanç',
          'bereketli gelir',
          'kimseye muhtaç olmama',
        ],
      },
      {
        key: 'is-allahumme-ya-ganiyyu-ya-hamidu',
        nameArabic:
          'اللّٰهُمَّ يَا غَنِيُّ يَا حَمِيدُ يَا مُبْدِئُ يَا مُعِيدُ يَا رَحِيمُ يَا وَدُودُ أَغْنِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَبِطَاعَتِكَ عَنْ مَعْصِيَتِكَ وَبِفَضْلِكَ عَمَّنْ سِوَاكَ',
        nameTurkish: "İmam-ı Azam'dan Bereket ve Helal Rızık Duası",
        transliteration:
          "Allahümme Ya Ğaniyyü, Ya Hamidü, Ya Mübdiü, Ya Mu'idü, Ya Rahimü, Ya Vedud. Eğisni bi helalike an haramike ve bi taatike an ma'siyetike ve bi fadlike ammen sivake.",
        meaning:
          "Allah'ım! Ey Zengin, Ey Övülen, Ey ilk baştan yaratan, Ey yeniden dirilten, Ey Merhametli, Ey Sevgi Dolu! Rızkımı haramdan helaline, isyanımdan itaatine ve başkalarından Senin lütfuna çevir.",
        virtue:
          'Ticari başarı, iş hayatında kalıcı bolluk ve bereket, maddi darboğazlardan çıkış ve helal kazanç bilincini güçlendirmek için sıklıkla okunması tavsiye edilir.',
        source: "İmam-ı Azam Ebû Hanife'nin Bereket Duası",
        tags: [
          'is-hayati',
          'ticari-basari',
          'bereket',
          'bolluk',
          'helal-rizik',
          'esma',
          'dua',
        ],
        categories: ['genel', 'is-hayati', 'kariyer', 'rizik', 'esma', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: [
          'ticari bereket',
          'işte bolluk',
          'maddi darboğazdan çıkış',
          'helal kazanç hassasiyeti',
          'sürekli vird',
        ],
      },
      {
        key: 'is-yusuf-54-56-kariyer-tertibi',
        nameArabic:
          'وَقَالَ الْمَلِكُ ائْتُونِي بِهِ أَسْتَخْلِصْهُ لِنَفْسِي فَلَمَّا كَلَّمَهُ قَالَ إِنَّكَ الْيَوْمَ لَدَيْنَا مَكِينٌ أَمِينٌ قَالَ اجْعَلْنِي عَلَى خَزَائِنِ الْأَرْضِ إِنِّي حَفِيظٌ عَلِيمٌ وَكَذَٰلِكَ مَكَّنَّا لِيُوسُفَ فِي الْأَرْضِ يَتَبَوَّأُ مِنْهَا حَيْثُ يَشَاءُ',
        nameTurkish: 'Yusuf 54-56 Kariyer ve Makam Ayetleri',
        transliteration:
          "Ve kâlel meliku'tûnî bihî estahlishu li nefsî, fe lemmâ kellemehû kâle innekel yevme ledeynâ mekînun emîn. Kâlec'alnî alâ hazâinil ard, innî hafîzun alîm. Ve kezâlike mekkennâ li yûsufe fîl ard...",
        meaning:
          "Kral dedi ki: 'Onu bana getirin, onu kendime özel danışman edineyim.' Onunla konuşunca da: 'Bugün sen bizim yanımızda yüksek makam sahibi, güvenilir birisin' dedi. Yusuf: 'Beni ülkenin hazinelerinin başına getir. Çünkü ben onları çok iyi korurum ve bu işi bilirim' dedi. Böylece Yusuf'u o ülkede güçlü bir konuma getirdik.",
        virtue:
          'İş arayanların hayırlı bir iş bulması, çalışanların kariyer basamaklarında yükselmesi, yönetim kademelerinde güven ve itibar kazanması niyetiyle namazlardan sonra okunur.',
        source: 'Yusuf Suresi, 12/54-56',
        tags: ['is-hayati', 'kariyer', 'terfi', 'yonetim', 'itibar', 'kuran'],
        categories: ['genel', 'is-hayati', 'kariyer', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'iş bulma',
          'kariyer yükselişi',
          'yönetim pozisyonu',
          'kurumsal güven',
          'namaz sonrası tilavet',
        ],
      },
      {
        key: 'is-ibrahim-7-sukur-bereket',
        nameArabic:
          'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ وَلَئِنْ كَفَرْتُمْ إِنَّ عَذَابِي لَشَدِيدٌ',
        nameTurkish: 'İbrahim 7 Şükür ve Artış Ayeti',
        transliteration:
          "Ve iz te'ezzenâ rabbukum le'in şekertum le'eziydennakum ve le'in keferetum inne azâbî leşedîd.",
        meaning:
          "Hani Rabbiniz şöyle bildirmişti: 'Andolsun, eğer şükrederseniz elbette size (nimetimi) artırırım. Ve andolsun, eğer nankörlük ederseniz şüphesiz benim azabım çok şiddetlidir.'",
        virtue:
          'Mevcut başarıların ve kariyer kazanımlarının korunması, işteki refah ve bereketin süreklilik kazanması için şükür bilinciyle okunur.',
        source: 'İbrahim Suresi, 14/7',
        tags: ['is-hayati', 'sukur', 'bereket', 'nimet-artisi', 'kuran'],
        categories: ['genel', 'is-hayati', 'kariyer', 'rizik', 'kuran'],
        timeOfDay: 'any',
        recommendedCount: 7,
        suitableFor: [
          'işte kazanımı koruma',
          'nimet artışı niyeti',
          'refahın sürekliliği',
          'şükür disiplini',
          'namaz sonrası okuma',
        ],
      },
      {
        key: 'is-ya-rafi-kariyer-yukselis',
        nameArabic: 'يَا رَافِعُ',
        nameTurkish: "Yâ Râfi'",
        transliteration: "Yâ Râfi'",
        meaning: 'Yukarı kaldıran, dereceleri yükselten.',
        virtue:
          'Günde 351 defa zikredildiğinde çalışanların insanlar ve iş arkadaşları arasında saygınlığının artmasına, rızkının genişlemesine ve makamının yükselmesine vesile olması niyetiyle okunur.',
        source: 'Esmâ-ül Hüsnâ',
        tags: [
          'is-hayati',
          'kariyer',
          'terfi',
          'itibar',
          'sayginlik',
          'rizik',
          'esma',
        ],
        categories: ['genel', 'is-hayati', 'kariyer', 'rizik', 'esma'],
        timeOfDay: 'any',
        recommendedCount: 351,
        suitableFor: [
          'işte saygınlık',
          'kariyer yükselişi',
          'makam artışı',
          'rızkın genişlemesi',
          'çalışma hayatında itibar',
        ],
      },
    ],
    specialDays: [],
  },
];

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function mergeDhikr(base, next) {
  return {
    ...base,
    ...next,
    transliteration:
      (next.transliteration?.length ?? 0) > (base.transliteration?.length ?? 0)
        ? next.transliteration
        : base.transliteration,
    nameArabic:
      (next.nameArabic?.length ?? 0) > (base.nameArabic?.length ?? 0)
        ? next.nameArabic
        : base.nameArabic,
    meaning:
      (next.meaning?.length ?? 0) > (base.meaning?.length ?? 0)
        ? next.meaning
        : base.meaning,
    virtue:
      (next.virtue?.length ?? 0) > (base.virtue?.length ?? 0)
        ? next.virtue
        : base.virtue,
    source:
      (next.source?.length ?? 0) > (base.source?.length ?? 0)
        ? next.source
        : base.source,
    recommendedCount: Math.max(
      base.recommendedCount ?? 0,
      next.recommendedCount ?? 0,
    ),
    tags: uniq([...(base.tags ?? []), ...(next.tags ?? [])]),
    categories: uniq([...(base.categories ?? []), ...(next.categories ?? [])]),
    suitableFor: uniq([
      ...(base.suitableFor ?? []),
      ...(next.suitableFor ?? []),
    ]),
  };
}

const canonicalByKey = new Map();
const canonicalBySignature = new Map();
const keyRemap = new Map();

for (const dataset of SOURCE_DATASETS) {
  for (const item of dataset.dhikrItems) {
    const canonicalSignature =
      normalize(item.nameTurkish) + '|' + normalize(item.transliteration);

    const existingKey = canonicalBySignature.get(canonicalSignature);
    if (existingKey) {
      const merged = mergeDhikr(canonicalByKey.get(existingKey), item);
      canonicalByKey.set(existingKey, { ...merged, key: existingKey });
      keyRemap.set(item.key, existingKey);
      continue;
    }

    canonicalByKey.set(item.key, { ...item });
    canonicalBySignature.set(canonicalSignature, item.key);
    keyRemap.set(item.key, item.key);
  }
}

const dhikrItems = Array.from(canonicalByKey.values());
const specialDayByComposite = new Map();

for (const dataset of SOURCE_DATASETS) {
  for (const item of dataset.specialDays) {
    const remappedDhikrKeys = uniq(
      (item.dhikrKeys ?? []).map((key) => keyRemap.get(key) ?? key),
    );
    const specialDay = { ...item, dhikrKeys: remappedDhikrKeys };
    const compositeKey = [
      item.eventKey,
      item.date,
      item.dayIndex ?? '',
      item.name ?? '',
    ].join('|');
    const existing = specialDayByComposite.get(compositeKey);

    if (!existing) {
      specialDayByComposite.set(compositeKey, specialDay);
      continue;
    }

    if (
      (specialDay.dhikrKeys?.length ?? 0) > (existing.dhikrKeys?.length ?? 0)
    ) {
      specialDayByComposite.set(compositeKey, specialDay);
    }
  }
}

const specialDays = Array.from(specialDayByComposite.values()).sort((a, b) => {
  if (a.date === b.date) {
    return (a.dayIndex ?? 0) - (b.dayIndex ?? 0);
  }
  return a.date.localeCompare(b.date);
});

export const SPECIAL_DAY_DATASET = {
  key: 'special-days-master-2026',
  label: 'Special Days Master 2026',
  dhikrItems,
  specialDays,
};

export function getAvailableEventKeys() {
  return uniq(specialDays.map((item) => item.eventKey));
}

export function buildEventDataset(eventKey) {
  const filtered = specialDays.filter((item) => item.eventKey === eventKey);
  if (filtered.length === 0) {
    return null;
  }

  const usedDhikrKeySet = new Set(
    filtered.flatMap((item) => item.dhikrKeys ?? []),
  );
  const filteredDhikrs = dhikrItems.filter((item) =>
    usedDhikrKeySet.has(item.key),
  );

  return {
    key: eventKey,
    label: 'Special Days ' + eventKey,
    dhikrItems: filteredDhikrs,
    specialDays: filtered,
  };
}
