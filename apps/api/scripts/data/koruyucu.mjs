import { keyMap } from './keyMap.mjs'

export const koruyucu = {
  key: 'koruyucu-zikirler',
  label: 'Büyü, Nazar ve Vesveseye Karşı Koruyucu Zikirler',
  category: 'koruma',
  description: 'Şeytandan, nazardan ve kötülüklerden korunmak için okunan dualar.',
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
      tags: ['korunma', 'nazar', 'büyü', 'vesvese', 'felak', 'nas'],
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
      key: 'korunma-bismillahillezi',
      nameArabic:
        'بِسْمِ اللّٰهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      nameTurkish: 'Bismillâhillezî Duası',
      transliteration:
        "Bismillâhillezî lâ yedurru me'asmihî şey'ün fil erdi ve lâ fis-semâi ve hüves-semî'ul alîm.",
      meaning:
        "Allah'ın adıyla; O'nun ismiyle yerde ve gökte hiçbir şey zarar veremez. O her şeyi işitendir, bilendir.",
      virtue:
        `Sabah-akşam üçer defa okuyan kişinin, o gün ya da gece ansızın gelebilecek kaza, bela, zehirlenme ve ani rahatsızlıklara karşı Allah'ın koruması altına girdiği bildirilmiştir. "Lâ yedurru" ifadesi mutlak bir olumsuzlama taşır; yerde ve gökte var olan hiçbir tehlikenin Allah'ın ismi yanında etki edemeyeceğini bildiren bu kesinlik, duayı hem manevi hem psikolojik bir zırha dönüştürür. "Ma'asmihî" (O'nun ismiyle birlikte olan) kaydı, duanın yalnızca telaffuz değil, kalbi hazır bir niyetle okunmasını şart koştuğunu ima eder. Sabah vakti okunması günü, akşam vakti okunması geceyi kapsar; böylece gün boyunca bedenî ve manevi hasara karşı sürekli bir kalkan oluşur. Ani hastalık, kaza veya zehirlenme endişesi taşıyan kişilerin günlük rutinine kolayca yerleştirilebilecek sade ama kapsamlı bir koruma duasıdır.`,
      source:
        'Ebû Dâvûd, Edeb, 110; İbn Mâce, Duâ, 16; Tirmizî, Deavât, 13',
      tags: ['korunma', 'nazar', 'bela', 'dua', 'şifa', 'ani rahatsızlık', 'kaza'],
      categories: ['genel', 'korunma', 'dua', 'hastalık'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'sabah akşam',
        'ani belalara karşı',
        'nazar korunması',
        'ani rahatsızlık ve kaza',
        'zehirlenme korunması',
      ],
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
      tags: ['korunma', 'tevekkül', 'beddua', 'korku'],
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
      key: keyMap.HZYUSUF,
      nameArabic:
        'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
      nameTurkish: "Hz. Yunus'un Duası",
      transliteration: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn.',
      meaning:
        'Senden başka hiçbir ilâh yoktur. Seni bütün noksan sıfatlardan tenzih ederim. Gerçekten ben zâlimlerden (kendi nefsine haksızlık edenlerden) oldum.',
      virtue:
        'Ağır manevi hava, içsel tıkanıklık ve beddua etkisi korkusunda sığınılacak güçlü bir yakarıştır. Ağır travmalar, kederler, çaresizlikler ve her türlü psikolojik darlıktan kurtulmaya vesile olur. Kişinin kendi sınırlarını kabul edip mutlak güce sığınmasını sağlayarak bilişsel yükü hafifletir. Öfke ve hiddet anlarında "innî küntü minez-zâlimîn" (ben kendine zulmedenlerdenim) ifadesi, kişiyi öfkenin sahibi olmaktan çıkarıp kendi hatasını fark eden bir konuma taşır; bu dönüşüm gazabın yoğunluğunu kırar.',
      source: 'Enbiyâ Suresi, 87. Ayet; Tirmizî; İbn Sünni',
      tags: ['korunma', 'yunus duası', 'vesvese', 'sıkıntı', 'öfke', 'sakinleşme', 'darlık'],
      categories: ['genel', 'korunma', 'nefis terbiyesi', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: [
        'ruhani sıkıntı',
        'vesvese',
        'manevi arınma',
        'darlık anları',
        'öfke ve hiddet',
        'çaresizlik ve tıkanıklık',
        'travma ve keder',
      ],
    },
    {
      key: 'korunma-suyuti-vesvese-duasi',
      nameArabic:
        'يَا اللّٰهُ الرَّقِيبُ الْحَفِيظُ الرَّحِيمُ، يَا اللّٰهُ الْحَيُّ الْحَلِيمُ الْعَظِيمُ الرَّؤُوفُ الْكَرِيمُ، يَا اللّٰهُ الْحَيُّ الْقَيُّومُ الْقَائِمُ عَلَى كُلِّ نَفْسٍ بِمَا كَسَبَتْ، حُلْ بَيْنِي وَبَيْنَ عَدُوِّي',
      nameTurkish: "Süyuti'nin Vesvese ve Korunma Duası",
      transliteration:
        'Yâ Allah-ür-rakîb-ül-hafîz-ür-rahîm. Yâ Allah-ül-hayy-ül-halîm-ül-azîm-ür-raûf-ül-kerîm. Yâ Allah-ül-hayy-ül-kayyûm-ül-kâimü alâ külli nefsin bimâ kesebet, hul beyni ve beyne adüvvî!',
      meaning:
        'Ey gözeten, koruyan ve merhamet eden Allah’ım! Ey hayat sahibi, halîm, azametli, çok şefkatli ve cömert olan Allah’ım! Ey diri, her şeyi ayakta tutan ve her nefsin kazandığı şeyleri bilen (Kayyûm) Allah’ım! Benimle düşmanımın arasına engel ol!',
      virtue:
        'İçsel vesvese, ani korkular ve ruhî bunalımlara karşı günlük korunma virdi olarak okunur.',
      source: 'Celaleddin-i Süyuti; İmam-ı Gazali',
      tags: ['korunma', 'vesvese', 'zikir', 'sükûnet'],
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
      tags: ['korunma', 'şifa', 'nazar', 'haset'],
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
      meaning: "Allah'ın razı olmadığı her şey için O'ndan bağışlanma dilerim.",
      virtue:
        'Maddi-manevi sıkıntılar, nazar ve beddua etkilerinden arınmaya yönelik istiğfar tertibidir.',
      source: 'İmam-ı Rabbani, Mektubat',
      tags: ['korunma', 'istiğfar', 'arınma', 'beddua'],
      categories: ['genel', 'korunma', 'istiğfar'],
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
      tags: ['korunma', 'tehlike', 'sabah virdi', 'dua'],
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
      recommendedCount: 10,
      suitableFor: ['sabah akşam tilavet', 'ruhani arınma', 'ev korunması'],
    },
    {
      key: 'korunma-ve-ufevvidu-emri-ilallah',
      nameArabic:
        'وَأُفَوِّضُ أَمْرِي إِلَى اللّٰهِ إِنَّ اللّٰهَ بَصِيرٌ بِالْعِبَادِ',
      nameTurkish: 'Ve Üfevvidü Emrî İlallâh',
      transliteration:
        'Ve üfevvidü emrî ilallâh, innallâhe basîrun bil-ıbâd.',
      meaning:
        "Ben işimi Allah'a havale ediyorum. Şüphesiz Allah, kullarını hakkıyla görendir.",
      virtue:
        "İnsanların hilelerinden, tuzaklarından ve her türlü haksızlıktan korunmak, tam bir teslimiyetle iç huzuru ve emniyeti bulmak için vird edinilir. Bu ayet, Hz. Mûsâ'nın kavminden bir müminin Firavun'un baskısına karşı söylediği ve Allah'a tam teslimiyetle sığındığı andaki duasıdır; haksızlığa uğrayan, kandırılmak ya da ezilmek korkusu taşıyan kişiler için güçlü bir manevî kalkan ve iç sükûnet kaynağıdır.",
      source: "Mü'min (Gâfir) Sûresi, 40/44",
      tags: ['korunma', 'tevekkül', 'haksızlık', 'teslimiyet', 'dua'],
      categories: ['genel', 'korunma', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 40,
      suitableFor: ['haksızlık', 'insan hilesi', 'tevekkül', 'iç huzur', 'koruma'],
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
      tags: ['korunma', 'nisa', 'ayet', 'büyü'],
      categories: ['genel', 'korunma', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['manevi blokaj', 'ruhani baskı', 'korunma niyeti'],
    },
  ],
  specialDays: [],
};
