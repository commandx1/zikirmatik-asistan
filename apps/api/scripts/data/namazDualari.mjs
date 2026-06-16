export const namazDualari = {
  key: 'namaz-dualari',
  label: 'Namaz İçi Dualar ve Zikirler',
  category: 'namaz',
  description: 'Namaz içindeki her makama ait — iftitah, rükû, secde, teşehhüd ve selam duaları.',
  dhikrItems: [
    {
      key: 'namaz-iftitah-subhaneke',
      nameArabic:
        'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَىٰ جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ',
      nameTurkish: 'İftitah Duası — Sübhâneke',
      transliteration:
        "Sübhânekellâhümme ve bi-hamdike ve tebârakesmüke ve te'âlâ ceddüke ve lâ ilâhe ğayrük.",
      meaning:
        "Allahım! Sana hamd ederek seni tüm noksanlıklardan tenzih ederim. İsmin mübârek ve azametin yücedir. Senden başka hak ilah yoktur.",
      virtue:
        "Hz. Âişe ve diğer sahâbîlerden nakledilen bu dua, namazın ilk tekbirinden sonra okunur. İftitah, 'açılış' demektir; namaza besmeleyle değil, Allah'ı tenzih ve tehmid ile başlamak. 'Tebârakesmüke' — 'İsmin mübârektir' — bu cümlede Arapçadaki en derin bereketlendirme fiili olan 'tebareke' kullanılır; yalnızca Allah için özel bir siga. 'Lâ ilâhe ğayrük' — 'Senden başka ilah yoktur' — bu iftitahı tevhid bildirimiyle kapatır; namaz, şirkten arındırılmış bir mekânda başlar.",
      source:
        "Sünen sahipleri (Ebu Dâvûd, Tirmizî, İbn Mâce); sahih — Bkz. Sahih-i Tirmizî (1/77); Sahih-i İbn Mâce (1/135); Hısnu'l-Muslim nr. 28",
      tags: ['namaz', 'iftitah', 'tesbih', 'hamd', 'tevhid', 'başlangıç'],
      categories: ['ibadet', 'namaz', 'farz'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'namazın başında iftitah tekbirinden sonra',
        'her farz ve nafile namazda',
        'namaz öğrenenler için temel pratik',
        'namaza bilinçli giriş için',
      ],
    },
    {
      key: 'namaz-iftitah-veccehtu',
      nameArabic:
        'وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ، إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ لَا شَرِيكَ لَهُ وَبِذَلِكَ أُمِرْتُ وَأَنَا مِنَ الْمُسْلِمِينَ',
      nameTurkish: 'İftitah Duası — Veccehtu (Uzun Form)',
      transliteration:
        "Veccehtu vechiye lillezî fatara's-semâvâti vel-arda hanîfen ve mâ ene minel-müşrikîn. İnne salâtî ve nüsükî ve mahyâye ve memâtî lillâhi Rabbil-âlemîn. Lâ şerîke leh, ve bi-zâlike ümirtü ve ene minel-müslimîn.",
      meaning:
        "Yüzümü, hakka yönelerek gökleri ve yeri yaratana çevirdim; ben O'na ortak koşanlardan değilim. Benim namazım, kurbanım, hayatım ve ölümüm, Âlemlerin Rabbi Allah içindir. O'nun ortağı yoktur. Ben bununla emrolundum ve ben Müslümanlardanım.",
      virtue:
        "Hz. Ali'den rivayet edilen bu iftitah duası, namazın açılışını tam bir din ve hayat bildirimine dönüştürür (Müslim). 'Veccehtu' ile başlayan ilk cümle: yüzü ve kalbi kâinatın Yaratıcısı'na çevirmek — fiziksel kıble ile kalbî yönelimin birleşimi. 'İnne salâtî ve nüsükî' — bu dua Kur'an'daki En'am 162. ayetin aynısıdır; namaz sadece beş vakit bir pratik olmaktan çıkar, tüm hayatın ve ölümün adandığı büyük bir ithafın parçasına dönüşür. Sübhâneke'den daha uzun olduğu için nafile namazlarda veya daha derin bir niyet anında tercih edilir.",
      source:
        "Müslim, Müsâfirîn, nr. 771; Ebu Dâvûd, Salât, nr. 760; Hısnu'l-Muslim nr. 29",
      tags: ['namaz', 'iftitah', 'tevhid', 'teslimiyet', 'En\'am 162', 'gece namazı'],
      categories: ['ibadet', 'namaz', 'nafile'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'gece namazı (teheccüd) iftitahı',
        'nafile namazlarda alternif iftitah',
        'daha uzun ve derin bir açılış duası için',
        'tüm hayatı Allah\'a adama bilinciyle',
      ],
    },
    {
      key: 'namaz-ruku-subhane-rabbiyel-azim',
      nameArabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
      nameTurkish: 'Rükû Duası — Sübhâne Rabbiyel-Azîm',
      transliteration: "Sübhâne Rabbiyal-azîm.",
      meaning: "Çok yüce Rabbimi tüm noksanlıklardan tenzih ederim.",
      virtue:
        "Hz. Peygamber'in rükûda söylediği temel zikir bu tek cümledir; sahih sünen rivayetlerine göre üç kez tekrarlanır. 'Azîm' — 'büyük, yüce' — rükûun fiziksel hareketini bu kelimeyle anlarsınız: bel kırılır, baş aşağı gelir, insan küçülür; Allah büyür. Hısnu'l-Muslim, rükû için en az üç, mümkünse daha fazla söylenmesini nakleder. Bu tek cümle, beş vakitten birinde on rükû varsa, elli defa 'Azîm' demek demektir — büyüklüğü günde elli kez tanımak.",
      source:
        "Sünen sahipleri (Ebu Dâvûd, Tirmizî, Nesâî, İbn Mâce); sahih — Bkz. Sahih-i Tirmizî (1/83); Hısnu'l-Muslim nr. 33",
      tags: ['namaz', 'rükû', 'tesbih', 'tenzih', 'farz'],
      categories: ['ibadet', 'namaz', 'farz'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'rükûda her namazda',
        'namaz öğrenenler için temel',
        'en az üç kez tekrarlama',
        'Allah\'ın büyüklüğünü hissetmek için',
      ],
    },
    {
      key: 'namaz-ruku-subhaneke-rabbena',
      nameArabic: 'سُبْحَانَكَ اللَّهُمَّ رَبَّنَا وَبِحَمْدِكَ اللَّهُمَّ اغْفِرْ لِي',
      nameTurkish: 'Rükû Duası — Tesbih ve İstiğfar',
      transliteration: "Sübhâneke Allâhümme Rabbenâ ve bi-hamdike Allâhümmeğfir lî.",
      meaning:
        "Rabbimiz olan Allahım! Sana hamd ederek seni tüm noksanlıklardan tenzih ederim. Allahım! Beni bağışla.",
      virtue:
        "Hz. Âişe'den rivayet edildiğine göre Hz. Peygamber Nasr suresi inince rükû ve secdelerinde bu duayı çokça okumaya başladı (Buhârî, Müslim). Bu rivayet önemlidir: sure, zaferi bildirdi; ama Peygamber ona büyüklük değil tevbe ile karşılık verdi. Tesbih+hamd+istiğfar — tenzih, şükür ve bağışlanma dileme — üçlüsü, namaz içinde en sık okunan kısa ama eksiksiz bir zikir paketidir.",
      source:
        "Buhârî, Tefsir Suretü'n-Nasr, nr. 4967; Müslim, Salât, nr. 484; Hısnu'l-Muslim nr. 34",
      tags: ['namaz', 'rükû', 'secde', 'tesbih', 'istiğfar', 'tevbe'],
      categories: ['ibadet', 'namaz', 'farz', 'istiğfar'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'rükûda ve secdede',
        'Sübhâne Rabbiyal-Azîm ile dönüşümlü',
        'namaz içi istiğfar pratiği',
        'Hz. Peygamber\'in uyguladığı hadisle sabit form',
      ],
    },
    {
      key: 'namaz-ruku-secde-subbutun-kuddus',
      nameArabic: 'سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ',
      nameTurkish: 'Rükû ve Secdede — Sübbûhün Kuddûsün',
      transliteration: "Sübbûhün kuddûsün Rabbül-melâiketi verrûh.",
      meaning: "Her noksanlıktan tamamıyla münezzeh, her kusurdan tamamen arınmış, mukaddes olan; meleklerin ve Ruh'un Rabbidir.",
      virtue:
        "Hz. Âişe'den rivayet edildiğine göre Hz. Peygamber rükû ve secdelerinde bu zikri okurdu (Müslim, nr. 487). 'Sübbûhün' ve 'kuddûsün' — her ikisi de Allah'ın sıfatlarından; ama 'sübbûh' O'nun kendi kendini her noksanlıktan tenzih etmesini, 'kuddûs' ise O'nun maddiyatın ve yaratılmışların her türlü kirinden mutlak arılığını anlatır. 'Rabbül-melâiketi verrûh' eklemesi melekler ve Cebrail'in Rabbine nispet ederek O'nun egemenliğini evrenin görünmez boyutuna taşır. Tesbihten farklı, daha seçkin ve az okunan bu form; Sübhâne Rabbiyal-Azîm ile dönüşümlü kullanılabilir.",
      source: "Müslim, Salât, nr. 487; El-Ezkar, İmam Nevevi, nr. 134 (Âişe radıyallahu anhâdan)",
      tags: ['namaz', 'rükû', 'secde', 'tesbih', 'tenzih', 'melekler'],
      categories: ['ibadet', 'namaz', 'farz'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'rükûda ve secdede',
        'Sübhâne Rabbiyal-Azîm ile dönüşümlü',
        'daha derin bir tenzih formu olarak',
        'nafile namazlarda uzatmak için',
      ],
    },
    {
      key: 'namaz-ruku-secde-zilceberut',
      nameArabic: 'سُبْحَانَ ذِي الْجَبَرُوتِ وَالْمَلَكُوتِ وَالْكِبْرِيَاءِ وَالْعَظَمَةِ',
      nameTurkish: 'Rükû ve Secdede — Sübhâne Zilceberûti',
      transliteration: "Sübhâne zil-ceberûti vel-melekûti vel-kibriyâi vel-azameh.",
      meaning: "Sonsuz kudretin, uçsuz bucaksız mülkün, büyüklüğün ve azametin sahibi olan Allah'ı tüm noksanlıklardan tenzih ederim.",
      virtue:
        "Avf ibni Mâlik'in rivayetine göre Hz. Peygamber, Bakara-Nisâ-Âl-i İmrân surelerini tek rekâtta okuduğu uzun bir gece namazında rükûunu kıyamı kadar uzatmış ve bu zikri okumuştur; secdede de aynı zikri tekrar etmiştir (Ebu Dâvûd, Nesâî; sahih). 'Ceberût-melekût-kibriyâ-azame' — Allah'ın sonsuz kudreti, görünmez egemenlik âlemi, mutlak büyüklüğü ve azameti. Bu dört sıfatı bir arada zikretmek, kişiyi kendi küçüklüğünün derinliğine götürür. Nafile namazlarda veya teheccüdde uzun rükû-secde yapmak isteyenler için.",
      source: "Ebu Dâvûd, Salât, nr. 873; Nesâî, Tatbîk, nr. 1048; sahih — El-Ezkar, İmam Nevevi, nr. 148",
      tags: ['namaz', 'rükû', 'secde', 'tesbih', 'azamet', 'kudret', 'teheccüd'],
      categories: ['ibadet', 'namaz', 'nafile', 'teheccüd'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'rükûda ve secdede',
        'teheccüd ve nafile namazlarda',
        'uzun rükû-secde formları için',
        'azamet ve kudret zikriyle kıyam uzatmak',
      ],
    },
    {
      key: 'namaz-tasmia-tahmid',
      nameArabic:
        'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ — رَبَّنَا وَلَكَ الْحَمْدُ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
      nameTurkish: 'Tasmia ve Tahmid — Rükûdan Doğrulurken',
      transliteration:
        "Semi'allâhu li-men hamideh — Rabbenâ ve lekel-hamdu hamden kesîren tayyiben mübâreken fîh.",
      meaning:
        "Allah, kendisine hamd edenin hamdini işitip kabul etti — Rabbimiz! Riyâdan uzak, bereketi kesilmeyen çokça hamd, yalnızca sanadır.",
      virtue:
        "İmam rükûdan kalkarken 'Semi'allahu li-men hamideh' der — cemaat ya da tek kişi ise 'Rabbenâ ve lekel-hamd' ile karşılık verir (Buhârî). Tasmia ve tahmid birbirini tamamlar: 'Allah duydu' + 'İşte hamdim'. Uzun tahmid formu ('hamden kesîren tayyiben mübâreken fîh') özellikle teşvik edilmiştir; Hz. Peygamber mescide bu kelimelerle doğrulan bir sahabîyi gördüğünde 'Otuz küsur melek ona ilk ulaşmak için yarıştı, bunu kim söyledi?' diye sormuş ve 'günahları deniz köpüğü gibi bile olsa silinir' müjdesini vermiştir (Buhârî).",
      source:
        "Buhârî, Ezan, nr. 796; Müslim, Salât, nr. 406; Hısnu'l-Muslim nr. 38-39",
      tags: ['namaz', 'rükûdan kalkış', 'tasmia', 'tahmid', 'hamd', 'farz'],
      categories: ['ibadet', 'namaz', 'farz'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'rükûdan doğrulurken',
        'imamın ardından cemaatle',
        'tek başına namaz kılarken',
        'günahları silmek için uzun tahmid',
      ],
    },
    {
      key: 'namaz-secde-subhane-rabbiyel-ala',
      nameArabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ',
      nameTurkish: 'Secde Duası — Sübhâne Rabbiyel-A\'lâ',
      transliteration: "Sübhâne Rabbiyal-a'lâ.",
      meaning: "En Yüce Rabbimi tüm noksanlıklardan tenzih ederim.",
      virtue:
        "Secdenin temel zikri — üç kez tekrarlanır. Rükûda 'Azîm' denilir, secdede 'A'lâ' — fark bilinçlidir: rükûda boyun eğilir, Allah 'büyük'tür; secdede alın yere değer, Allah 'en yüce'dir. Fiziksel alçalmanın zirvesi olan secde, aynı zamanda en yüksek dua makamıdır. Hz. Peygamber 'Kul, Rabbine en yakın olduğu an secdede olduğu andır; dolayısıyla secdelerinizde çok dua edin' buyurmuştur (Müslim). Tesbih biter, dua gelir — 'A'lâ' söylendikten sonra gönül ne dilerse sorar.",
      source:
        "Sünen sahipleri; sahih — Bkz. Sahih-i Tirmizî (1/83); Hısnu'l-Muslim nr. 41",
      tags: ['namaz', 'secde', 'tesbih', 'tenzih', 'farz', 'yakınlık'],
      categories: ['ibadet', 'namaz', 'farz'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'secdede her namazda',
        'en az üç kez tekrarlama',
        'ardından kişisel dua için en münasip an',
        'Allah\'a yakınlık hissetmek için',
      ],
    },
    {
      key: 'namaz-iki-secde-arasi-rabbigfir',
      nameArabic:
        'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاجْبُرْنِي وَاهْدِنِي وَارْزُقْنِي وَارْفَعْنِي',
      nameTurkish: 'İki Secde Arası Duası',
      transliteration:
        "Allâhümmeğfir lî verhamni vec-burnî vehdini verzuknî verfa'nî.",
      meaning:
        "Allahım! Beni bağışla, bana merhamet et, beni ıslah eyle, beni doğru yola ilet, bana rızık ver ve beni yücelt.",
      virtue:
        "İki secde arasındaki kısa oturuşta okunan bu dua, ruhun altı temel ihtiyacını tek seferde Allah'a taşır (sünen sahipleri, sahih). Altı fiil, altı talep: mağfiret — geçmişteki; rahmet — şimdiki; cebr (onarım) — yarılmışlıktan bütünlüğe; hidayet — yol üzerinde kalmak; rızık — günlük geçim; ref' (yükselme) — dünyada da ahirette de. Hz. Peygamber bu dua ile birlikte daha kısa 'Rabbığfir lî' formunu da okumuştur; ikisi de sahihtir.",
      source:
        "Sünen sahipleri (Ebu Dâvûd, Tirmizî, İbn Mâce); sahih — Bkz. Sahih-i Tirmizî (1/83); Hısnu'l-Muslim nr. 49",
      tags: ['namaz', 'iki secde arası', 'dua', 'mağfiret', 'rızık', 'hidayet'],
      categories: ['ibadet', 'namaz', 'farz', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'iki secde arasındaki oturuşta',
        'altı ihtiyacı tek duada sormak için',
        'her rek\'atte sabitleşmiş pratik',
        'kısa ama eksiksiz bir ruhsal talep olarak',
      ],
    },
    {
      key: 'namaz-secde-gunahlarin-bagisilmasi',
      nameArabic:
        'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ وَأَوَّلَهُ وَآخِرَهُ وَعَلَانِيَتَهُ وَسِرَّهُ',
      nameTurkish: 'Secdede Günahların Bağışlanması Duası',
      transliteration:
        "Allâhümmeğfir lî zenbî külleh, diqqahû ve cilleh, ve evvelehû ve âhirahû, ve alâniyetehû ve sirrah.",
      meaning:
        "Allahım! Günahlarımın hepsini; azını ve çoğunu, ilkini ve sonunu, âşikârını ve gizlisini bağışla.",
      virtue:
        "Hz. Ebû Hureyre'nin rivayetine göre Hz. Peygamber bu duayı secdede okurdu (Müslim). Dört karşıt çift: az-çok, ilk-son, açık-gizli — her bir çift bir kategori oluşturur ve hepsini kapatır. 'Diqqahû ve cilleh' — 'azı ve çoğu' — önemsiz sandığın günah ve büyük günah; ikisini de bağışlamasını istemek, hiçbir günahı hafife almama bilincidir. Bu dua secdede okunur — en yakın andır; en büyük talep için en uygun yer.",
      source: "Müslim, Salât, nr. 483; Hısnu'l-Muslim nr. 46",
      tags: ['namaz', 'secde', 'istiğfar', 'mağfiret', 'günahlar', 'tevbe'],
      categories: ['ibadet', 'namaz', 'istiğfar', 'tevbe'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'secdede kapsamlı istiğfar için',
        'Sübhâne Rabbiyal-A\'lâ\'dan sonra',
        'günahlara toptan af dilemek için',
        'secdeyi istiğfar makamı olarak kullanmak',
      ],
    },
    {
      key: 'namaz-teshehud-tahiyyat',
      nameArabic:
        'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
      nameTurkish: 'Teşehhüd (Tahiyyat)',
      transliteration:
        "Et-tahiyyâtu lillâhi ves-salevâtu vet-tayyibât. Es-selâmu aleyke eyyühen-Nebiyyü ve rahmetullâhi ve berekâtüh. Es-selâmu aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.",
      meaning:
        "Bütün tâzimler, ibâdetler ve güzel sözler ancak Allah içindir. Ey Nebi! Allah'ın selâmı, rahmeti ve bereketi senin üzerine olsun. Selâm, bizim ve Allah'ın salih kullarının üzerine olsun. Allah'tan başka hak ilah olmadığına şehâdet ederim; Muhammed'in O'nun kulu ve elçisi olduğuna şehâdet ederim.",
      virtue:
        "İbn Mes'ûd'dan sahih rivayetle: Hz. Peygamber teşehhüdü, tıpkı Kur'an suresi öğretir gibi sahabîlere öğretti (Buhârî, Müslim). Teşehhüdün üç katmanı vardır: tahmid katmanı ('tahiyyâtü lillâh') — tüm saygı ve ibadetin Allah'a ait olduğunu ilan; selamlama katmanı — önce Peygamber'e, sonra tüm salih kullara selam; şehadet katmanı — her namazda yenilenen iman ilanı. 'Abdühû ve rasûlüh' — 'kulu ve elçisi' — bu sıra önemlidir: önce kul, sonra elçi. Hz. Peygamber'i yanlış yükseltmeye karşı namaz içinde yerleştirilen tevhid güvencesi.",
      source:
        "Buhârî, Ezan, nr. 831; Müslim, Salât, nr. 402; Hısnu'l-Muslim nr. 52",
      tags: ['namaz', 'teşehhüd', 'tahiyyat', 'şehadet', 'salavat', 'farz'],
      categories: ['ibadet', 'namaz', 'farz', 'iman'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'namazın her ka\'desinde (oturuşta)',
        'iki ve dört rekâtlı namazlarda',
        'salavattan önce zorunlu',
        'namaz öğrenenler için temel ezber',
      ],
    },
    {
      key: 'namaz-salavat-i-ibrahimiyye',
      nameArabic:
        'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
      nameTurkish: 'Salavât-ı İbrâhimiyye — Teşehhüdden Sonra',
      transliteration:
        "Allâhümme salli alâ Muhammadin ve alâ âli Muhammed, kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm, inneke Hamîdün Mecîd. Allâhümme bârik alâ Muhammadin ve alâ âli Muhammed, kemâ bârakte alâ İbrâhîme ve alâ âli İbrâhîm, inneke Hamîdün Mecîd.",
      meaning:
        "Allahım! İbrahim'i ve İbrahim'in âilesini meleklerinin yanında methettiğin gibi, Muhammed'i ve Muhammed'in âilesini de methet. Şüphesiz sen çok övülensin, şeref sahibisin. Allahım! İbrahim'in âilesini mübârek kıldığın gibi, Muhammed'i ve Muhammed'in âilesini de mübârek kıl. Şüphesiz sen çok övülensin, şeref sahibisin.",
      virtue:
        "Sahabîler Hz. Peygamber'e 'Sana nasıl salavat getirelim?' diye sordu; Peygamber bu formu öğretti (Buhârî). 'İbrâhîm gibi' kıyaslaması küçümseme değil, tanınan bir mükemmellik standardıyla talep etmektir — tıpkı 'İbrâhîm makamını sana nasıl verdiysen, Muhammed'e de ver' demek gibi. Namaz içi salavat, teşehhüdden sonra zorunludur; her namazda, günde en az beş kez Hz. Peygamber adına Allah'a bu talep iletilir.",
      source:
        "Buhârî, Enbiyâ, nr. 3370; Müslim, Salât, nr. 406; Hısnu'l-Muslim nr. 53",
      tags: ['namaz', 'salavat', 'teşehhüd', 'Hz. Peygamber', 'farz', 'şefaat'],
      categories: ['ibadet', 'namaz', 'salavat', 'farz'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'teşehhüdden hemen sonra',
        'son ka\'dede zorunlu',
        'selâm verilmeden önce',
        'namaz içi tam salavat formu',
      ],
    },
    {
      key: 'namaz-selamdan-once-kabir-fitne-istiaze',
      nameArabic:
        'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ جَهَنَّمَ وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
      nameTurkish: 'Selâmdan Önce Dört Şeyden Sığınma Duası',
      transliteration:
        "Allâhümme innî eûzü bike min azâbil-kabri ve min azâbi cehenneme ve min fitnetil-mahyâ vel-memâti ve min şerri fitnetil-Mesihid-Deccâl.",
      meaning:
        "Allahım! Kabir azabından, cehennem azabından, hayat ve ölüm fitnesinden ve Mesih Deccâl fitnesinin şerrinden sana sığınırım.",
      virtue:
        "Hz. Peygamber namazda selâm vermeden önce bu duayı okurdu ve sahabîlere 'Selâmdan önce bu dört şeyden Allah'a sığının' diye emretti (Buhârî, Müslim). Bu emrin veriliş şekli dikkat çekicidir: namaz bitmeden, henüz duanın içindeyken okunan bir 'son savunma'. Dört tehlike: kabir (ölüm sonrası hâl), cehennem (nihai ceza), mahyâ-memât fitnesi (hayatın her günü ve ölüm anının imtihanı), Deccâl (tarihin büyük aldatmacası). Biri ahirete, biri gündelik yaşama, ikisi köprü anlarına aittir.",
      source:
        "Buhârî, Ezan, nr. 832; Müslim, Mesâcid, nr. 588; Hısnu'l-Muslim nr. 55",
      tags: ['namaz', 'selam öncesi', 'istiaze', 'kabir', 'deccal', 'fitne', 'koruma'],
      categories: ['ibadet', 'namaz', 'korunma', 'istiaze'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'namazda selâmdan hemen önce',
        'salavat-ı İbrahimiyye\'den sonra',
        'dört büyük tehlikeden korunmak için',
        'her farz namazda sünnet pratik',
      ],
    },
    {
      key: 'namaz-selamdan-once-inni-zalemtu',
      nameArabic:
        'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
      nameTurkish: 'Selâmdan Önce Mağfiret Duası — İnnî Zalemtü',
      transliteration:
        "Allâhümme innî zalemtü nefsî zulmen kesîren ve lâ yağfiruż-żünûbe illâ ente, feğfir lî mağfireten min indike verhamnî, inneke entel-Ğafûrur-Rahîm.",
      meaning:
        "Allahım! Ben nefsime çok zulmettim. Günahları ancak sen bağışlarsın. Katından bir mağfiretle beni bağışla ve bana merhamet eyle. Şüphesiz sen çok bağışlayansın, çok merhamet edensin.",
      virtue:
        "Ebû Bekr Sıddîk, Hz. Peygamber'e namazda ne okuyacağını sordu; Hz. Peygamber bu duayı öğretti (Buhârî, Müslim). 'Zalemtü nefsî zulmen kesîren' — 'nefsime çok zulmettim' — bu cümle hem itiraf hem de kabullenme; günah inkâr edilmiyor, üstüne bir de 'çok' deniliyor. 'Min indike' — 'katından' — dua sıradan bir af değil, Allah'ın bizzat kendi katından gelen, koşulsuz bir mağfiret talep ediyor. Namaz selâmından önce bunu okumak, namazı kapatmadan önce hesabı temizlemektir.",
      source:
        "Buhârî, Ezan, nr. 834; Müslim, Zikir ve Dua, nr. 2705; Hısnu'l-Muslim nr. 57",
      tags: ['namaz', 'selam öncesi', 'istiğfar', 'mağfiret', 'tevbe', 'günahlar'],
      categories: ['ibadet', 'namaz', 'istiğfar', 'tevbe'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'namazda selâmdan hemen önce',
        'dört şeyden sığınma duasıyla dönüşümlü',
        'namaz bitişinde tevbe niyetiyle',
        'Hz. Ebû Bekr\'in Hz. Peygamber\'den öğrendiği dua',
      ],
    },
    {
      key: 'namaz-selamdan-once-zikredinme-yardim',
      nameArabic: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
      nameTurkish: 'Selâmdan Önce — Zikir, Şükür ve İbadet İçin Yardım',
      transliteration:
        "Allâhümme a'innî alâ zikrike ve şükrike ve husni ibâdetik.",
      meaning: "Allahım! Seni zikretmek, sana şükretmek ve sana güzelce ibâdet etmekte bana yardım et.",
      virtue:
        "Hz. Peygamber, Muâz ibn Cebel'in elini tutarak şöyle dedi: 'Ey Muâz! Seni seviyorum. Her namazın ardından şunu söylemeni tavsiye ediyorum: Allâhümme a'innî alâ zikrike ve şükrike ve husni ibâdetik.' (Ebu Dâvûd; sahih). Üç talep: zikir (seni hatırlama), şükür (nimetini sayma), hüsn-ü ibadet (güzel ibadet). Bu dua, namazın içinde namazın devamı için dua etmektir — bir ibadetin içinde bir sonraki ibadetin tohumunu atmak.",
      source:
        "Ebu Dâvûd, Vitir, nr. 1522; Nesâî, Sehv, nr. 1303; sahih — Bkz. Sahih-i Ebî Dâvûd (1/284); Hısnu'l-Muslim nr. 59",
      tags: ['namaz', 'selam öncesi', 'zikir', 'şükür', 'ibadet', 'yardım dilemek'],
      categories: ['ibadet', 'namaz', 'zikir', 'şükür'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'namazda selâmdan hemen önce',
        'her namazda sabitleşmiş pratik olarak',
        'Hz. Peygamber\'in Muâz\'a özel vasiyeti',
        'zikir ve şükür alışkanlığı kurmak için',
      ],
    },
    {
      key: 'namaz-selamdan-sonra-estagfirullah-entes-selam',
      nameArabic:
        'أَسْتَغْفِرُ اللَّهَ (×3) — اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
      nameTurkish: 'Selâmdan Sonra İlk Zikir — Estağfirullah + Entes-Selâm',
      transliteration:
        "Estağfirullâh (×3) — Allâhümme entes-selâmu ve minkes-selâm, tebârakte yâ zel-celâli vel-ikrâm.",
      meaning:
        "Allah'tan mağfiret dilerim (3 kez) — Allahım! Sen Selâm'sın, selâmet sendendir. Ey azamet ve ikram sahibi! Senin bereketin pek çoktur.",
      virtue:
        "Sevbân'dan gelen rivayette Hz. Peygamber selâm verdikten sonra üç kez istiğfar eder, ardından bu duayı okurdu (Müslim). Selâm verildi — dua değil, önce istiğfar. Namaz bitti; ama namazın ne kadar hakkı ile kılındığı bilinmiyor — bu yüzden hemen 'bağışla' deniyor. Ardından 'Entes-Selâm' — sen selamlama ve selamet verensin, bu namaz selâmı da senden geliyor; anlamıyla selâmı geri kaynaklarına döndürmek. Bu, namazSonrasiZikir'deki 33'lük tesbihten önce okunacak ilk zikirdir.",
      source: "Müslim, Mesâcid, nr. 591; Hısnu'l-Muslim nr. 66",
      tags: ['namaz', 'selam sonrası', 'istiğfar', 'zikir', 'ilk zikir', 'namaz sonrası'],
      categories: ['ibadet', 'namaz', 'istiğfar', 'günlük'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'namazdan selâm verildikten hemen sonra',
        '33 tesbihten önce ilk pratik olarak',
        'her farz namazın hemen ardından',
        'namaz selâmını Allah\'a döndürmek için',
      ],
    },
  ],
};
