const keyMap = {
  VAHDEHU_LA: 'VAHDEHU_LA',
  TESRIK_TEKBIRI: 'TESRIK_TEKBIRI',
  HASBIYE: 'HASBIYE',
  LEKEL_HAMD: 'LEKEL_HAMD',
  IHLAS: 'IHLAS',
  SALAVAT_SERIF: 'SALAVAT-I ŞERİFE',
  ISTIGFAR: 'ISTIGFAR',
  YA_HAYYU_YA_KAYYUM: 'YA_HAYYU_YA_KAYYUM',
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
        key: 'kelime-i-tevhid-bolca',
        nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
        nameTurkish: 'Kelime-i Tevhid',
        transliteration: 'Lâ ilâhe illallâh.',
        meaning: "Allah'tan başka ilah yoktur.",
        virtue:
          'Arefe günü peygamberlerin en hayırlı sözü olan tevhidi bolca tekrar etmek kalbi tahkim eder.',
        source: 'Arefe günü tevhid rivayetleri',
        tags: ['zilhicce', 'arefe', 'tevhid'],
        categories: ['zilhicce', 'ozel-gun', 'arefe'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['iman', 'tevhid', 'huzur'],
      },
      {
        key: 'nur-duasi',
        nameArabic: 'اللّٰهُمَّ اجْعَلْ فِي قَلْبِي نُورًا',
        nameTurkish: 'Nur Duası',
        transliteration: 'Allâhümmec’al fî kalbî nûran.',
        meaning: "Allah'ım, kalbime nur ver.",
        virtue:
          'Manevi basireti artırır, kalpte içsel aydınlanmayı güçlendirir.',
        source: 'Nur talebi duaları',
        tags: ['zilhicce', 'arefe', 'nur', 'dua'],
        categories: ['zilhicce', 'ozel-gun', 'arefe'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['basiret', 'huzur', 'farkindalik'],
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
      {
        key: 'nur-duasi',
        nameArabic: 'اللّٰهُمَّ اجْعَلْ فِي قَلْبِي نُورًا',
        nameTurkish: 'Nur Duası',
        transliteration: 'Allâhümmec’al fî kalbî nûran.',
        meaning: "Allah'ım, kalbime nur ver.",
        virtue:
          'Manevi farkındalığı artırır, zihinsel dağınıklığı azaltıp iç huzuru destekler.',
        source: 'Nur talebi duaları',
        tags: ['kurban-bayrami', 'dua', 'nur'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'night',
        recommendedCount: 33,
        suitableFor: ['akşam', 'tefekkür'],
      },
      {
        key: 'kelime-i-tevhid-100',
        nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
        nameTurkish: 'Kelime-i Tevhid',
        transliteration: 'Lâ ilâhe illallâh.',
        meaning: "Allah'tan başka ilah yoktur.",
        virtue:
          'Tevhid inancını sürekli tazeler, kalbi birliğe ve kulluk bilincine yöneltir.',
        source: 'Tevhid zikirleri',
        tags: ['kurban-bayrami', 'tevhid'],
        categories: ['özel gün', 'bayram'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['gün boyu', 'namaz sonrası'],
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
          'nur-duasi',
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
          'kelime-i-tevhid-100',
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
        key: 'mevlid-tevhid-100',
        nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
        nameTurkish: 'Mevlid Tevhid Zikri',
        transliteration: 'Lâ ilâhe illallâh.',
        meaning: "Allah'tan başka ilah yoktur.",
        virtue:
          'Tevhid şuurunu kuvvetlendirir, ibadetleri ihlasla yapmaya yardımcı olur.',
        source: 'Tevhid zikirleri',
        tags: ['mevlid-kandili', 'tevhid'],
        categories: ['kandil', 'özel gün', 'tevhid'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['iman tazeleme', 'kandil gecesi', 'tefekkür'],
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
          'Kalbi vesvese ve dağınıklıktan korumaya yardımcı olur; zikri huzurla sürdürmek için manevi korunma bilinci kazandırır.',
        source: 'Müminun 97-98',
        tags: ['mevlid-kandili', 'dua', 'korunma', 'siginma'],
        categories: ['kandil', 'özel gün', 'dua'],
        timeOfDay: 'any',
        recommendedCount: 33,
        suitableFor: ['vesveseden korunma', 'manevi korunma', 'gece ibadeti'],
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
        key: 'mevlid-la-ilahe-illa-ente-100',
        nameArabic:
          'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
        nameTurkish: "Hz. Yunus'un Duası",
        transliteration:
          'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn.',
        meaning:
          'Senden başka ilah yoktur, Seni tenzih ederim. Şüphesiz ben zalimlerden oldum.',
        virtue:
          'Tevbe, teslimiyet ve kurtuluş ümidi bilincini güçlendirir; darlık anlarında kalbe sığınma şuuru verir.',
        source: 'Enbiya 87',
        tags: ['mevlid-kandili', 'dua', 'tevbe', 'tevhid'],
        categories: ['kandil', 'özel gün', 'dua', 'tevhid'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['darlık anları', 'tevbe', 'manevi sığınma'],
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
          'mevlid-tevhid-100',
          keyMap.ISTIGFAR,
          'mevlid-la-havle-100',
          'mevlid-duha-suresi-50',
          'mevlid-seytandan-siginma-33',
          'mevlid-sabir-ve-sebat-ayeti',
          'mevlid-salavat-emri-ayeti',
          'mevlid-salavat-sellim-barik-100',
          'mevlid-rabbena-zalemna-100',
          'mevlid-rabbi-inni-messeni-100',
          'mevlid-la-ilahe-illa-ente-100',
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
        key: 'muharrem-kelime-i-tevhid-risalet-100',
        nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ',
        nameTurkish: 'Kelime-i Tevhid ve Risalet',
        transliteration: 'Lâ ilâhe illallâh Muhammedür Rasûlullâh.',
        meaning: 'Allahtan başka ilah yoktur; Muhammed Allahın Resulüdür.',
        virtue:
          'Kimlik ve aidiyet bilincini tazeler; Nebevi rehberliğe bağlılığı güçlendirir.',
        source: 'Kelime-i tevhid geleneği',
        tags: ['muharrem', 'tevhid', 'risalet', 'aidiyet'],
        categories: ['özel gün', 'muharrem', 'tevhid'],
        timeOfDay: 'any',
        recommendedCount: 100,
        suitableFor: ['iman tazeleme', 'muharrem ilk 10', 'aidiyet'],
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
        dhikrKeys: ['muharrem-kelime-i-tevhid-risalet-100'],
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
