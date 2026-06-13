export const cenazeVeTaziye = {
  key: 'cenaze-ve-taziye',
  label: 'Cenaze ve Taziye Duaları',
  category: 'ibadet',
  description: 'Cenaze namazı, defin ve taziyede okunacak dualar.',
  dhikrItems: [
    {
      key: 'cenaze-namaz-duasi-uzun',
      nameArabic:
        'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ وَأَدْخِلْهُ الْجَنَّةَ وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ',
      nameTurkish: 'Cenaze Namazı Duası (Üçüncü Tekbir Sonrası)',
      transliteration:
        `Allâhümmağfir lehû verhamhü ve âfihî va'fü anhü, ve ekrim nüzülehû, ve vessi' müdhalehû, vağsil bilmâi vesselci velberedi, ve nakkıhî minel hatâyâ kemâ nakkaytes sevbel ebyada mined denesi, ve ebdilhü dâren hayran min dârihî, ve ehlen hayran min ehlihî, ve zevcen hayran min zevcihî, ve edhılhül cennete, ve eızhü min azâbil kabri ve min azâbin nâr.`,
      meaning:
        `Allahım! Onu bağışla, ona rahmet eyle, onu azap ve sıkıntılardan koru, kusurlarını affeyle. Cennetten nasibini ihsân eyle, kabrini genişlet. Onu su ile, kar ile ve dolu ile yıka. Beyaz elbiseyi kirden temizler gibi onu günahlarından arındır. Ona kendi evinden daha güzel bir ev, ailesinden daha hayırlı bir aile, eşinden daha hayırlı bir eş ver. Onu cennete koy, kabir ve cehennem azabından koru.`,
      virtue:
        `Resûlullah (sas) bir cenaze namazı kıldırdı ve bu duayı okudu. Sahâbî Avf ibni Mâlik şöyle dedi: "Bu güzel duayı duyunca 'keşke o ölen ben olsaydım' diye arzu ettim." Dua, sekiz eksenli bir şefaat dilekçesidir: bağışlanma, rahmet, afiyet, af, ikram, genişlik, temizlenme ve cennet. "Su, kar ve dolu ile yıka" ifadesi, günahların hem zahirî hem bâtınî her boyuttan arındırılması dileğini dile getirir. Cenaze namazının üçüncü tekbirinden sonra okunur; ölen erkekse "lehû", kadınsa "lehâ", iki kişi içinse "hümâ" kullanılır.`,
      source: `Müslim, Cenâiz, 37 (963); Ebû Dâvûd, Cenâiz, 31 (3203)`,
      tags: ['cenaze', 'dua', 'namaz', 'ölüm', 'rahmet', 'af'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'cenaze namazı',
        'meyyit için dua',
        'üçüncü tekbir sonrası',
      ],
    },
    {
      key: 'cenaze-namaz-duasi-genel',
      nameArabic:
        'اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَأُنْثَانَا وَشَاهِدِنَا وَغَائِبِنَا اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ وَلَا تُضِلَّنَا بَعْدَهُ',
      nameTurkish: 'Cenaze Namazı Genel Duası',
      transliteration:
        `Allâhümmağfir lihayyinâ ve meyyitinâ, ve sağîrinâ ve kebîrinâ, ve zekerinâ ve ünsânâ, ve şâhidinâ ve gàibinâ. Allâhümme men ahyeytehû minnâ feahyihî alel İslâmi, ve men teveffeytehû minnâ fetevvehû alel îmâni. Allâhümme lâ tahrimnâ ecrehû velâ teftinnâ ba'dehû.`,
      meaning:
        `Allahım! Dirilerimizi ve ölülerimizi, küçüklerimizi ve büyüklerimizi, erkeklerimizi ve kadınlarımızı, burada bulunanlarımızı ve bulunmayanlarımızı bağışla. Bizden hayatta bırakacaklarını İslâm üzere yaşat, öldüreceklerini îman ile öldür. Bizi bu cenâzede bulunmanın sevâbından mahrûm eyleme ve ondan sonra bizi fitneye düşürme.`,
      virtue:
        `Hz. Peygamber (sas) bir cenaze namazında bu duayı okudu. İki bölümden oluşur: birincisi bütün Müslümanları kapsayan genel mağfiret talebi, ikincisi ise cemaat ve meyyit için özel niyazlar. "İslâm üzere yaşat, îman ile öldür" ifadesi, en temel insanî kaygıyı —hem dünya hem ölüm anındaki hâli— Allah'a arz eder. "Bizi fitneye düşürme" cümlesi, kayıptan sonra insanın en kolay düşebileceği tehlikeye karşı bir sigorta gibidir. Özellikle cemaatle kılınan cenaze namazlarında, birden fazla kişi için kılınan namazlarda okunması uygundur.`,
      source: `Ebû Dâvûd, Cenâiz, 34 (3201); Tirmizî, Cenâiz, 38 (1024); İbn Mâce, Cenâiz, 21 (1498)`,
      tags: ['cenaze', 'dua', 'namaz', 'ölüm', 'af', 'cemaat'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'cenaze namazı',
        'cemaat için dua',
        'tüm Müslümanlar için',
      ],
    },
    {
      key: 'cenaze-musibette-inna-lillah',
      nameArabic:
        'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
      nameTurkish: 'Musibette ve Kayıpta Okunacak Dua',
      transliteration:
        `İnnâ lillâhi ve innâ ileyhi râciûn. Allâhümme'curnî fî musîbetî ve ahlif lî hayran minhâ.`,
      meaning:
        `Biz Allah'a aidiz ve şüphesiz O'na döneceğiz. Allahım! Beni bu musibetimde ecre nâil eyle ve bana ondan daha hayırlısını nasip eyle.`,
      virtue:
        `Hz. Peygamber (sas) bu duayı musibete uğrayan kimseye öğretti ve "Bir kimse başına bir musibet gelince bu duayı okursa Allah onun ecrini muhakkak verir ve kaybettiğinin yerine daha hayırlısını ihsân eder" buyurdu. Hz. Ümmü Seleme (r.anhâ) şöyle anlattı: Kocası Ebû Seleme vefât ettiğinde bu duayı okudum. Allah bana Ümmü Seleme yerine Resûlullah'ı (sas) verdi — ondan daha hayırlısını. Âyet olan "innâ lillâhi ve innâ ileyhi râciûn" (Bakara 2/156-157) kaybın gerçek boyutunu ortaya koyar: her şey Allah'a aittir, döneceğimiz yer de O'dur. Dua bu ilkeyi bireysel kayıba uygular.`,
      source: `Müslim, Cenâiz, 3 (918); Ebû Dâvûd, Cenâiz, 22 (3119); Tirmizî, Deavât, 19 (3511)`,
      tags: ['cenaze', 'musibet', 'kayıp', 'sabır', 'dua', 'inna lillah'],
      categories: ['cenaze', 'dua', 'sabır'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'yakın kayıptan sonra',
        'ölüm haberi alınca',
        'taziye anında',
        'sabır için',
      ],
    },
    {
      key: 'cenaze-defin-duasi',
      nameArabic:
        'بِسْمِ اللَّهِ وَعَلَى سُنَّةِ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
      nameTurkish: 'Defne Koyarken Dua',
      transliteration:
        `Bismillâhi ve alâ sünneti Resûlillâhi sallallahu aleyhi ve sellem.`,
      meaning:
        `Allah'ın adıyla ve Resûlullah sallallahu aleyhi ve sellemin sünnetiyle (kabre koyuyorum).`,
      virtue:
        `İbn Ömer'den rivâyet edildiğine göre Resûlullah (sas) ölüyü kabre koyduğu zaman bu sözü söylerdi. İki unsuru bir araya getirir: bismillah ile Allah'ın adının anılması, "alâ sünnetihi" ile de bu işlemin Peygamber'in emrettiği şekliyle yapıldığının ikrarı. Bu kısa cümle, cenazenin toprağa bırakılışını sıradan bir gömme eyleminden ilâhî bir teslimiyete dönüştürür. Cenâzeyi mezara bırakırken — lahde yatırılırken ya da üzerine ilk toprak atılırken — söylenir.`,
      source: `İbn Mâce, Cenâiz, 37 (1550); Ebû Dâvûd, Cenâiz, 37 (3213); Tirmizî, Cenâiz, 27 (1046)`,
      tags: ['cenaze', 'defin', 'dua', 'kabir'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'defin anı',
        'kabre koyarken',
        'toprağa verirken',
      ],
    },
    {
      key: 'cenaze-kabir-ziyaret-selami',
      nameArabic:
        'السَّلَامُ عَلَى أَهْلِ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ وَيَرْحَمُ اللَّهُ الْمُسْتَقْدِمِينَ مِنَّا وَالْمُسْتَأْخِرِينَ وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَاحِقُونَ',
      nameTurkish: 'Kabir Ziyareti Selamı',
      transliteration:
        `Esselâmü alâ ehliddiyâri minel mü'minîne vel müslimîn, yerhamullâhül müstakdimîne minnâ vel müste'hirîn, ve innâ inşâallâhu bikum lâhikŪn.`,
      meaning:
        `Bu diyârın mü'min ve müslim halkına selâm olsun! Bizden ve sizden önce gidenlere ve geride kalanlara Allah rahmet eylesin. İnşallah biz de yakında aranıza katılacağız.`,
      virtue:
        `Hz. Âişe (r.anhâ), Resûlullah'ın (sas) yanında kaldığı gecelerin sonuna doğru Bakî kabristanına giderek bu duayı okuduğunu anlattı. "Biz de size katılacağız" ifadesi, kabristanı ziyaret etmeyi yalnızca geçmişi anma töreni olmaktan çıkarır; kendi ölümü de hatırlatır, tefekkür ve hazırlık için bir zemin oluşturur. Üç iş yapar: ziyaret edilen ruhlara selam, genel Müslüman ölüleri için rahmet talebi ve kişinin kendi fanîliğini ikrar etmesi. Mezarlığa girerken veya kabre yaklaşırken okunur.`,
      source: `Müslim, Cenâiz, 104 (974); İbn Mâce, Cenâiz, 36 (1547); Nesâî, Cenâiz, 103`,
      tags: ['cenaze', 'kabir', 'ziyaret', 'dua', 'ölüm', 'tefekkür'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'kabir ziyareti',
        'mezarlık girişi',
        'yakın kabirde dua',
        'ölüm tefekkürü',
      ],
    },
    {
      key: 'cenaze-taziye-duasi',
      nameArabic:
        'إِنَّ لِلَّهِ مَا أَخَذَ وَلَهُ مَا أَعْطَى وَكُلُّ شَيْءٍ عِنْدَهُ بِأَجَلٍ مُسَمًّى فَلْتَصْبِرْ وَلْتَحْتَسِبْ',
      nameTurkish: 'Taziye (Başsağlığı) Duası',
      transliteration:
        `İnne lillâhi mâ ehaze, ve lehû mâ a'tâ, ve küllü şey'in indehû bi ecelinil müsemmâ, feltasbir veltahtesib.`,
      meaning:
        `Allah aldığı şeyin zaten sahibiydi. Verdiği de O'nundur. Her şey O katında belirlenmiş bir ecele göre gerçekleşir. Öyleyse sabret ve mükâfatını Allah'tan bekle.`,
      virtue:
        `Resûlullah (sas) bir sahâbînin çocuğu vefât ettiğinde bu sözleri söyleyerek taziyede bulundu. Buhârî rivayetinde Hz. Peygamber bunu ağlayan bir anneye iletmesi için elçi gönderdi. Taziye sözleri üç temel gerçeği öğretir: Allah'ın mülkiyeti (aldığı zaten O'nundur), kader (eceli belirlenmiş), sabır telkini. Kalıp bir teselli cümlesi değil; acı çeken kişiyi gerçekle yüzleştirip ona güç katan bir telkindir. Cenaze sonrası aile ve yakınlara başsağlığı dilerken söylenir.`,
      source: `Buhârî, Cenâiz, 32 (1284); Müslim, Cenâiz, 9 (923)`,
      tags: ['cenaze', 'taziye', 'başsağlığı', 'sabır', 'kayıp', 'dua'],
      categories: ['cenaze', 'dua', 'sabır'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'taziye ziyareti',
        'başsağlığı dilemek',
        'yakınını kaybedene destek',
        'acı paylaşımı',
      ],
    },
  ],
};
