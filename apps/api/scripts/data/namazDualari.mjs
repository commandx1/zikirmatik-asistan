export const namazDualari = {
  key: 'namaz-dualari',
  label: {
    tr: 'Namaz İçi Dualar ve Zikirler',
    en: 'Supplications and Dhikrs During Prayer',
  },
  category: 'namaz',
  description: {
    tr: 'Namaz içindeki her makama ait — iftitah, rükû, secde, teşehhüd ve selam duaları.',
    en: 'Supplications for every station within the prayer — the opening (iftitah), bowing (ruku), prostration (sujud), tashahhud and the salam.',
  },
  dhikrItems: [
    {
      key: 'namaz-iftitah-subhaneke',
      nameArabic:
        'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَىٰ جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ',
      name: {
        tr: 'İftitah Duası — Sübhâneke',
        en: 'Opening Supplication — Subhanaka',
      },
      transliteration: {
        tr: "Sübhânekellâhümme ve bi-hamdike ve tebârakesmüke ve te'âlâ ceddüke ve lâ ilâhe ğayrük.",
        en: "Subhanaka Allahumma wa bihamdika wa tabaraka ismuka wa ta'ala judduka wa la ilaha ghayruk.",
      },
      meaning: {
        tr: "Allahım! Sana hamd ederek seni tüm noksanlıklardan tenzih ederim. İsmin mübârek ve azametin yücedir. Senden başka hak ilah yoktur.",
        en: "O Allah! I glorify You and praise You. Blessed is Your name, and exalted is Your majesty. There is no god worthy of worship besides You.",
      },
      virtue: {
        tr: "Hz. Âişe radıyallahu anhâ ve diğer sahâbîlerden nakledilen bu dua, namazın ilk tekbirinden sonra okunur. İftitah, 'açılış' demektir; namaza besmeleyle değil, Allah'ı tenzih ve tehmid ile başlamak. 'Tebârakesmüke' — 'İsmin mübârektir' — bu cümlede Arapçadaki en derin bereketlendirme fiili olan 'tebareke' kullanılır; yalnızca Allah için özel bir siga. 'Lâ ilâhe ğayrük' — 'Senden başka ilah yoktur' — bu iftitahı tevhid bildirimiyle kapatır; namaz, şirkten arındırılmış bir mekânda başlar.",
        en: "This supplication, narrated from Aisha, may Allah be pleased with her, and other Companions, is recited after the opening takbir of the prayer. 'Iftitah' means 'opening' — the prayer does not begin with the basmalah, but with declaring Allah's transcendence and praising Him. 'Tabarakasmuka' — 'blessed is Your name' — employs the verb 'tabaraka,' the deepest form of blessing in the Arabic language, a verbal form reserved exclusively for Allah. 'La ilaha ghayruk' — 'there is no god besides You' — closes this opening with a declaration of pure monotheism (tawhid); the prayer thus begins in a space cleared of any association with anything besides Allah.",
      },
      source: {
        tr: "Sünen sahipleri (Ebu Dâvûd, Tirmizî, İbn Mâce); sahih — Bkz. Sahih-i Tirmizî (1/77); Sahih-i İbn Mâce (1/135); Hısnu'l-Muslim nr. 28",
        en: "Sunan collections (Abu Dawood, At-Tirmidhi, Ibn Majah); authentic (sahih) — see Sahih at-Tirmidhi (1/77); Sahih Ibn Majah (1/135); Hisn al-Muslim no. 28",
      },
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
      name: {
        tr: 'İftitah Duası — Veccehtu (Uzun Form)',
        en: 'Opening Supplication — Wajjahtu (Extended Form)',
      },
      transliteration: {
        tr: "Veccehtu vechiye lillezî fatara's-semâvâti vel-arda hanîfen ve mâ ene minel-müşrikîn. İnne salâtî ve nüsükî ve mahyâye ve memâtî lillâhi Rabbil-âlemîn. Lâ şerîke leh, ve bi-zâlike ümirtü ve ene minel-müslimîn.",
        en: "Wajjahtu wajhiya lilladhi fataras-samawati wal-arda hanifan wa ma ana minal-mushrikin. Inna salati wa nusuki wa mahyaya wa mamati lillahi Rabbil-'alamin. La sharika lah, wa bidhalika umirtu wa ana minal-muslimin.",
      },
      meaning: {
        tr: "Yüzümü, hakka yönelerek gökleri ve yeri yaratana çevirdim; ben O'na ortak koşanlardan değilim. Benim namazım, kurbanım, hayatım ve ölümüm, Âlemlerin Rabbi Allah içindir. O'nun ortağı yoktur. Ben bununla emrolundum ve ben Müslümanlardanım.",
        en: "I have turned my face toward Him Who created the heavens and the earth, inclining toward truth, and I am not of those who associate partners with Him. Indeed, my prayer, my sacrifice, my life, and my death are for Allah, Lord of the worlds. He has no partner. This I have been commanded, and I am of the Muslims.",
      },
      virtue: {
        tr: "Hz. Ali radıyallahu anh'ten rivayet edilen bu iftitah duası, namazın açılışını tam bir din ve hayat bildirimine dönüştürür (Müslim). 'Veccehtu' ile başlayan ilk cümle: yüzü ve kalbi kâinatın Yaratıcısı'na çevirmek — fiziksel kıble ile kalbî yönelimin birleşimi. 'İnne salâtî ve nüsükî' — bu dua Kur'an'daki En'am 162. ayetin aynısıdır; namaz sadece beş vakit bir pratik olmaktan çıkar, tüm hayatın ve ölümün adandığı büyük bir ithafın parçasına dönüşür. Sübhâneke'den daha uzun olduğu için nafile namazlarda veya daha derin bir niyet anında tercih edilir.",
        en: "Narrated from Ali, may Allah be pleased with him, this opening supplication turns the start of the prayer into a complete declaration of faith and life (Muslim). The opening clause, 'Wajjahtu' — 'I have turned my face' — is the union of turning one's body toward the qiblah with turning one's heart toward the Creator of the universe. 'Inna salati wa nusuki' is identical in wording to verse 162 of Surah Al-An'am; through it, prayer ceases to be merely a five-times-daily practice and becomes part of a grand dedication in which the whole of life and death is offered. Being longer than Subhanaka, it is preferred in voluntary (nafilah) prayers or at moments requiring a deeper intention.",
      },
      source: {
        tr: "Müslim, Müsâfirîn, nr. 771; Ebu Dâvûd, Salât, nr. 760; Hısnu'l-Muslim nr. 29",
        en: "Sahih Muslim, Travelers' Prayer (Musafirin), no. 771; Abu Dawood, Prayer, no. 760; Hisn al-Muslim no. 29",
      },
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
      name: {
        tr: 'Rükû Duası — Sübhâne Rabbiyel-Azîm',
        en: 'Ruku Supplication — Subhana Rabbiyal-Azim',
      },
      transliteration: {
        tr: "Sübhâne Rabbiyal-azîm.",
        en: "Subhana Rabbiyal-'Azim.",
      },
      meaning: {
        tr: "Çok yüce Rabbimi tüm noksanlıklardan tenzih ederim.",
        en: "Glory be to my Lord, the Most Great.",
      },
      virtue: {
        tr: "Hz. Peygamber'in rükûda söylediği temel zikir bu tek cümledir; sahih sünen rivayetlerine göre üç kez tekrarlanır. 'Azîm' — 'büyük, yüce' — rükûun fiziksel hareketini bu kelimeyle anlarsınız: bel kırılır, baş aşağı gelir, insan küçülür; Allah büyür. Hısnu'l-Muslim, rükû için en az üç, mümkünse daha fazla söylenmesini nakleder. Bu tek cümle, beş vakitten birinde on rükû varsa, elli defa 'Azîm' demek demektir — büyüklüğü günde elli kez tanımak.",
        en: "This single sentence is the fundamental remembrance the Messenger of Allah, peace be upon him, uttered in ruku; according to the authentic sunan narrations, it is repeated three times. 'Azim' — 'great, most high' — connects directly to the physical posture of ruku: the back bends, the head lowers, the person becomes small, while Allah becomes great. Hisn al-Muslim reports that it should be said at least three times, more if possible. Said fifty times across the ten instances of ruku in the five daily prayers, this single sentence means recognizing Allah's greatness fifty times a day.",
      },
      source: {
        tr: "Sünen sahipleri (Ebu Dâvûd, Tirmizî, Nesâî, İbn Mâce); sahih — Bkz. Sahih-i Tirmizî (1/83); Hısnu'l-Muslim nr. 33",
        en: "Sunan collections (Abu Dawood, At-Tirmidhi, An-Nasa'i, Ibn Majah); authentic (sahih) — see Sahih at-Tirmidhi (1/83); Hisn al-Muslim no. 33",
      },
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
      name: {
        tr: 'Rükû Duası — Tesbih ve İstiğfar',
        en: 'Ruku Supplication — Glorification and Seeking Forgiveness',
      },
      transliteration: {
        tr: "Sübhâneke Allâhümme Rabbenâ ve bi-hamdike Allâhümmeğfir lî.",
        en: "Subhanaka Allahumma Rabbana wa bihamdika Allahummaghfir li.",
      },
      meaning: {
        tr: "Rabbimiz olan Allahım! Sana hamd ederek seni tüm noksanlıklardan tenzih ederim. Allahım! Beni bağışla.",
        en: "Glory be to You, O Allah, our Lord, and praise be to You. O Allah, forgive me.",
      },
      virtue: {
        tr: "Hz. Âişe radıyallahu anhâ'dan rivayet edildiğine göre Hz. Peygamber Nasr suresi inince rükû ve secdelerinde bu duayı çokça okumaya başladı (Buhârî, Müslim). Bu rivayet önemlidir: sure, zaferi bildirdi; ama Peygamber ona büyüklük değil tevbe ile karşılık verdi. Tesbih+hamd+istiğfar — tenzih, şükür ve bağışlanma dileme — üçlüsü, namaz içinde en sık okunan kısa ama eksiksiz bir zikir paketidir.",
        en: "It is narrated by Aisha, may Allah be pleased with her, that when Surah An-Nasr was revealed, the Messenger of Allah, peace be upon him, began reciting this supplication frequently in his ruku and prostrations (Al-Bukhari, Muslim). This narration is significant: the surah announced victory, yet the Prophet responded to it not with pride but with repentance. Glorification, praise, and seeking forgiveness — tanzih, gratitude, and repentance combined — form a short but complete package of remembrance most frequently recited within the prayer.",
      },
      source: {
        tr: "Buhârî, Tefsir Suretü'n-Nasr, nr. 4967; Müslim, Salât, nr. 484; Hısnu'l-Muslim nr. 34",
        en: "Sahih al-Bukhari, Tafsir of Surah An-Nasr, no. 4967; Sahih Muslim, Prayer, no. 484; Hisn al-Muslim no. 34",
      },
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
      name: {
        tr: 'Rükû ve Secdede — Sübbûhün Kuddûsün',
        en: 'In Ruku and Sujud — Subbuhun Quddusun',
      },
      transliteration: {
        tr: "Sübbûhün kuddûsün Rabbül-melâiketi verrûh.",
        en: "Subbuhun Quddusun Rabbul-mala'ikati war-ruh.",
      },
      meaning: {
        tr: "Her noksanlıktan tamamıyla münezzeh, her kusurdan tamamen arınmış, mukaddes olan; meleklerin ve Ruh'un Rabbidir.",
        en: "Utterly free of every imperfection, wholly pure of every flaw, and sanctified is He — Lord of the angels and the Spirit.",
      },
      virtue: {
        tr: "Hz. Âişe radıyallahu anhâ'dan rivayet edildiğine göre Hz. Peygamber rükû ve secdelerinde bu zikri okurdu (Müslim, nr. 487). 'Sübbûhün' ve 'kuddûsün' — her ikisi de Allah'ın sıfatlarından; ama 'sübbûh' O'nun kendi kendini her noksanlıktan tenzih etmesini, 'kuddûs' ise O'nun maddiyatın ve yaratılmışların her türlü kirinden mutlak arılığını anlatır. 'Rabbül-melâiketi verrûh' eklemesi melekler ve Cebrail'in Rabbine nispet ederek O'nun egemenliğini evrenin görünmez boyutuna taşır. Tesbihten farklı, daha seçkin ve az okunan bu form; Sübhâne Rabbiyal-Azîm ile dönüşümlü kullanılabilir.",
        en: "It is narrated by Aisha, may Allah be pleased with her, that the Messenger of Allah, peace be upon him, recited this remembrance in his ruku and prostrations (Muslim, no. 487). Both 'Subbuh' and 'Quddus' are among Allah's attributes; yet 'Subbuh' describes His own perpetual transcendence above every imperfection, while 'Quddus' expresses His absolute purity from all the impurities of matter and creation. The addition 'Rabbul-mala'ikati war-ruh' — 'Lord of the angels and the Spirit' — extends His sovereignty to the unseen dimension of the universe, referring to the angels and Jibril. Less common and more distinguished than the standard tasbih, this form may be recited alternately with Subhana Rabbiyal-Azim.",
      },
      source: {
        tr: "Müslim, Salât, nr. 487; El-Ezkar, İmam Nevevi, nr. 134 (Âişe radıyallahu anhâdan)",
        en: "Sahih Muslim, Prayer, no. 487; Al-Adhkar, Imam An-Nawawi, no. 134 (narrated from Aisha, may Allah be pleased with her)",
      },
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
      name: {
        tr: 'Rükû ve Secdede — Sübhâne Zilceberûti',
        en: 'In Ruku and Sujud — Subhana Dhil-Jabarut',
      },
      transliteration: {
        tr: "Sübhâne zil-ceberûti vel-melekûti vel-kibriyâi vel-azameh.",
        en: "Subhana Dhil-jabaruti wal-malakuti wal-kibriya'i wal-'azamah.",
      },
      meaning: {
        tr: "Sonsuz kudretin, uçsuz bucaksız mülkün, büyüklüğün ve azametin sahibi olan Allah'ı tüm noksanlıklardan tenzih ederim.",
        en: "Glory be to the Possessor of absolute power, of the unseen dominion, of majesty, and of greatness.",
      },
      virtue: {
        tr: "Avf ibni Mâlik radıyallahu anh'ın rivayetine göre Hz. Peygamber, Bakara-Nisâ-Âl-i İmrân surelerini tek rekâtta okuduğu uzun bir gece namazında rükûunu kıyamı kadar uzatmış ve bu zikri okumuştur; secdede de aynı zikri tekrar etmiştir (Ebu Dâvûd, Nesâî; sahih). 'Ceberût-melekût-kibriyâ-azame' — Allah'ın sonsuz kudreti, görünmez egemenlik âlemi, mutlak büyüklüğü ve azameti. Bu dört sıfatı bir arada zikretmek, kişiyi kendi küçüklüğünün derinliğine götürür. Nafile namazlarda veya teheccüdde uzun rükû-secde yapmak isteyenler için.",
        en: "According to the narration of Awf ibn Malik, may Allah be pleased with him, the Messenger of Allah, peace be upon him, once prolonged his ruku, in a long night prayer during which he recited Surahs Al-Baqarah, An-Nisa, and Aal-i Imran in a single rak'ah, to a length equal to his standing (qiyam), reciting this remembrance; he repeated the same in prostration (Abu Dawood, An-Nasa'i; authentic). 'Jabarut, malakut, kibriya, azamah' — Allah's absolute power, His unseen dominion, His absolute majesty, and His greatness — combining these four attributes in a single remembrance carries a person into the depth of their own smallness. Suited for those who wish to prolong ruku and prostration in voluntary prayers or tahajjud.",
      },
      source: {
        tr: "Ebu Dâvûd, Salât, nr. 873; Nesâî, Tatbîk, nr. 1048; sahih — El-Ezkar, İmam Nevevi, nr. 148",
        en: "Abu Dawood, Prayer, no. 873; An-Nasa'i, Tatbiq, no. 1048; authentic (sahih) — Al-Adhkar, Imam An-Nawawi, no. 148",
      },
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
      name: {
        tr: 'Tasmia ve Tahmid — Rükûdan Doğrulurken',
        en: "Tasmi' and Tahmid — Rising from Ruku",
      },
      transliteration: {
        tr: "Semi'allâhu li-men hamideh — Rabbenâ ve lekel-hamdu hamden kesîren tayyiben mübâreken fîh.",
        en: "Sami'allahu liman hamidah — Rabbana wa lakal-hamdu hamdan kathiran tayyiban mubarakan fih.",
      },
      meaning: {
        tr: "Allah, kendisine hamd edenin hamdini işitip kabul etti — Rabbimiz! Riyâdan uzak, bereketi kesilmeyen çokça hamd, yalnızca sanadır.",
        en: "Allah has heard the one who praises Him — Our Lord, to You belongs praise, abundant, goodly, and blessed praise.",
      },
      virtue: {
        tr: "İmam rükûdan kalkarken 'Semi'allahu li-men hamideh' der — cemaat ya da tek kişi ise 'Rabbenâ ve lekel-hamd' ile karşılık verir (Buhârî). Tasmia ve tahmid birbirini tamamlar: 'Allah duydu' + 'İşte hamdim'. Uzun tahmid formu ('hamden kesîren tayyiben mübâreken fîh') özellikle teşvik edilmiştir; Hz. Peygamber mescide bu kelimelerle doğrulan bir sahabîyi gördüğünde 'Otuz küsur melek ona ilk ulaşmak için yarıştı, bunu kim söyledi?' diye sormuş ve 'günahları deniz köpüğü gibi bile olsa silinir' müjdesini vermiştir (Buhârî).",
        en: "As the imam rises from ruku he says, 'Sami'allahu liman hamidah,' and the congregation, or a person praying alone, responds with 'Rabbana wa lakal-hamd' (Al-Bukhari). Tasmi' and tahmid complete one another: 'Allah has heard' and 'here is my praise.' The extended form of tahmid — 'hamdan kathiran tayyiban mubarakan fih' — is especially encouraged; the Messenger of Allah, peace be upon him, once saw a man in the mosque rise while saying these words and asked, 'Who said this? More than thirty angels rushed to be the first to record it,' giving the glad tiding that sins, even if as abundant as the foam of the sea, are erased by it (Al-Bukhari).",
      },
      source: {
        tr: "Buhârî, Ezan, nr. 796; Müslim, Salât, nr. 406; Hısnu'l-Muslim nr. 38-39",
        en: "Sahih al-Bukhari, Adhan, no. 796; Sahih Muslim, Prayer, no. 406; Hisn al-Muslim no. 38-39",
      },
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
      name: {
        tr: 'Secde Duası — Sübhâne Rabbiyel-A\'lâ',
        en: "Prostration Supplication — Subhana Rabbiyal-A'la",
      },
      transliteration: {
        tr: "Sübhâne Rabbiyal-a'lâ.",
        en: "Subhana Rabbiyal-A'la.",
      },
      meaning: {
        tr: "En Yüce Rabbimi tüm noksanlıklardan tenzih ederim.",
        en: "Glory be to my Lord, the Most High.",
      },
      virtue: {
        tr: "Secdenin temel zikri — üç kez tekrarlanır. Rükûda 'Azîm' denilir, secdede 'A'lâ' — fark bilinçlidir: rükûda boyun eğilir, Allah 'büyük'tür; secdede alın yere değer, Allah 'en yüce'dir. Fiziksel alçalmanın zirvesi olan secde, aynı zamanda en yüksek dua makamıdır. Hz. Peygamber 'Kul, Rabbine en yakın olduğu an secdede olduğu andır; dolayısıyla secdelerinizde çok dua edin' buyurmuştur (Müslim). Tesbih biter, dua gelir — 'A'lâ' söylendikten sonra gönül ne dilerse sorar.",
        en: "This is the fundamental remembrance of prostration, repeated three times. In ruku one says 'Azim,' in sujud one says 'A'la' — the distinction is deliberate: in ruku the neck bends and Allah is 'great'; in sujud the forehead touches the ground and Allah is 'most high.' Sujud, the peak of physical lowering, is at the same time the highest station of supplication. The Messenger of Allah, peace be upon him, said, 'The servant is nearest to his Lord when he is in prostration, so supplicate much therein' (Muslim). The glorification ends and supplication begins — once 'A'la' has been said, the heart may ask for whatever it wishes.",
      },
      source: {
        tr: "Sünen sahipleri; sahih — Bkz. Sahih-i Tirmizî (1/83); Hısnu'l-Muslim nr. 41",
        en: "Sunan collections; authentic (sahih) — see Sahih at-Tirmidhi (1/83); Hisn al-Muslim no. 41",
      },
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
      name: {
        tr: 'İki Secde Arası Duası',
        en: 'Supplication Between the Two Prostrations',
      },
      transliteration: {
        tr: "Allâhümmeğfir lî verhamni vec-burnî vehdini verzuknî verfa'nî.",
        en: "Allahummaghfir li warhamni wajburni wahdini warzuqni warfa'ni.",
      },
      meaning: {
        tr: "Allahım! Beni bağışla, bana merhamet et, beni ıslah eyle, beni doğru yola ilet, bana rızık ver ve beni yücelt.",
        en: "O Allah, forgive me, have mercy on me, make good my deficiencies, guide me, provide for me, and raise me in rank.",
      },
      virtue: {
        tr: "İki secde arasındaki kısa oturuşta okunan bu dua, ruhun altı temel ihtiyacını tek seferde Allah'a taşır (sünen sahipleri, sahih). Altı fiil, altı talep: mağfiret — geçmişteki; rahmet — şimdiki; cebr (onarım) — yarılmışlıktan bütünlüğe; hidayet — yol üzerinde kalmak; rızık — günlük geçim; ref' (yükselme) — dünyada da ahirette de. Hz. Peygamber bu dua ile birlikte daha kısa 'Rabbığfir lî' formunu da okumuştur; ikisi de sahihtir.",
        en: "Recited during the brief sitting between the two prostrations, this supplication carries the six fundamental needs of the soul before Allah in a single moment (sunan collections; authentic). Six verbs, six requests: maghfirah — forgiveness for the past; rahmah — mercy for the present; jabr — repair, from brokenness to wholeness; hidayah — remaining upon the right path; rizq — daily sustenance; raf' — being raised, both in this world and the next. The Messenger of Allah, peace be upon him, also recited the shorter form, 'Rabbighfir li,' alongside this one; both are authentically established.",
      },
      source: {
        tr: "Sünen sahipleri (Ebu Dâvûd, Tirmizî, İbn Mâce); sahih — Bkz. Sahih-i Tirmizî (1/83); Hısnu'l-Muslim nr. 49",
        en: "Sunan collections (Abu Dawood, At-Tirmidhi, Ibn Majah); authentic (sahih) — see Sahih at-Tirmidhi (1/83); Hisn al-Muslim no. 49",
      },
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
      name: {
        tr: 'Secdede Günahların Bağışlanması Duası',
        en: 'Prostration Supplication for the Forgiveness of Sins',
      },
      transliteration: {
        tr: "Allâhümmeğfir lî zenbî külleh, diqqahû ve cilleh, ve evvelehû ve âhirahû, ve alâniyetehû ve sirrah.",
        en: "Allahummaghfir li dhanbi kullah, diqqahu wa jillah, wa awwalahu wa akhirahu, wa 'alaniyatahu wa sirrah.",
      },
      meaning: {
        tr: "Allahım! Günahlarımın hepsini; azını ve çoğunu, ilkini ve sonunu, âşikârını ve gizlisini bağışla.",
        en: "O Allah, forgive me all my sins, the small and the great of them, the first and the last of them, the open and the hidden of them.",
      },
      virtue: {
        tr: "Hz. Ebû Hureyre radıyallahu anh'ın rivayetine göre Hz. Peygamber bu duayı secdede okurdu (Müslim). Dört karşıt çift: az-çok, ilk-son, açık-gizli — her bir çift bir kategori oluşturur ve hepsini kapatır. 'Diqqahû ve cilleh' — 'azı ve çoğu' — önemsiz sandığın günah ve büyük günah; ikisini de bağışlamasını istemek, hiçbir günahı hafife almama bilincidir. Bu dua secdede okunur — en yakın andır; en büyük talep için en uygun yer.",
        en: "It is narrated by Abu Hurairah, may Allah be pleased with him, that the Messenger of Allah, peace be upon him, used to recite this supplication in prostration (Muslim). Four opposing pairs — small and great, first and last, open and hidden — each pair forms a category, and together they cover everything. 'Diqqahu wa jillah' — 'its small and its great' — asking forgiveness for both the sin one deems trivial and the sin one deems grave is a consciousness of never taking any sin lightly. This supplication is recited in prostration, the nearest moment; the most appropriate place for the greatest request.",
      },
      source: {
        tr: "Müslim, Salât, nr. 483; Hısnu'l-Muslim nr. 46",
        en: "Sahih Muslim, Prayer, no. 483; Hisn al-Muslim no. 46",
      },
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
      name: {
        tr: 'Teşehhüd (Tahiyyat)',
        en: 'Tashahhud (Tahiyyat)',
      },
      transliteration: {
        tr: "Et-tahiyyâtu lillâhi ves-salevâtu vet-tayyibât. Es-selâmu aleyke eyyühen-Nebiyyü ve rahmetullâhi ve berekâtüh. Es-selâmu aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.",
        en: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-Nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu an la ilaha illallah wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
      },
      meaning: {
        tr: "Bütün tâzimler, ibâdetler ve güzel sözler ancak Allah içindir. Ey Nebi! Allah'ın selâmı, rahmeti ve bereketi senin üzerine olsun. Selâm, bizim ve Allah'ın salih kullarının üzerine olsun. Allah'tan başka hak ilah olmadığına şehâdet ederim; Muhammed'in O'nun kulu ve elçisi olduğuna şehâdet ederim.",
        en: "All greetings, acts of worship, and good words are for Allah alone. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god worthy of worship except Allah, and I bear witness that Muhammad is His servant and Messenger.",
      },
      virtue: {
        tr: "Abdullah ibn Mes'ûd radıyallahu anh'tan sahih rivayetle: Hz. Peygamber teşehhüdü, tıpkı Kur'an suresi öğretir gibi sahabîlere öğretti (Buhârî, Müslim). Teşehhüdün üç katmanı vardır: tahmid katmanı ('tahiyyâtü lillâh') — tüm saygı ve ibadetin Allah'a ait olduğunu ilan; selamlama katmanı — önce Peygamber'e, sonra tüm salih kullara selam; şehadet katmanı — her namazda yenilenen iman ilanı. 'Abdühû ve rasûlüh' — 'kulu ve elçisi' — bu sıra önemlidir: önce kul, sonra elçi. Hz. Peygamber'i yanlış yükseltmeye karşı namaz içinde yerleştirilen tevhid güvencesi.",
        en: "By an authentic narration from Abdullah ibn Mas'ud, may Allah be pleased with him, the Messenger of Allah, peace be upon him, taught the tashahhud to the Companions just as he would teach a surah of the Qur'an (Al-Bukhari, Muslim). The tashahhud has three layers: a layer of praise ('at-tahiyyatu lillah') — declaring that all reverence and worship belong to Allah; a layer of greeting — first to the Prophet, then to all righteous servants; and a layer of testimony — a renewed declaration of faith in every prayer. 'Abduhu wa rasuluh' — 'His servant and Messenger' — the order here matters: servant first, then messenger. This is the safeguard of tawhid placed within the prayer against elevating the Prophet, peace be upon him, beyond his proper station.",
      },
      source: {
        tr: "Buhârî, Ezan, nr. 831; Müslim, Salât, nr. 402; Hısnu'l-Muslim nr. 52",
        en: "Sahih al-Bukhari, Adhan, no. 831; Sahih Muslim, Prayer, no. 402; Hisn al-Muslim no. 52",
      },
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
      key: 'namaz-selamdan-once-kabir-fitne-istiaze',
      nameArabic:
        'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ جَهَنَّمَ وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
      name: {
        tr: 'Selâmdan Önce Dört Şeyden Sığınma Duası',
        en: 'Before the Salam — Seeking Refuge from Four Trials',
      },
      transliteration: {
        tr: "Allâhümme innî eûzü bike min azâbil-kabri ve min azâbi cehenneme ve min fitnetil-mahyâ vel-memâti ve min şerri fitnetil-Mesihid-Deccâl.",
        en: "Allahumma inni a'udhu bika min 'adhabil-qabri wa min 'adhabi jahannama wa min fitnatil-mahya wal-mamati wa min sharri fitnatil-Masihid-Dajjal.",
      },
      meaning: {
        tr: "Allahım! Kabir azabından, cehennem azabından, hayat ve ölüm fitnesinden ve Mesih Deccâl fitnesinin şerrinden sana sığınırım.",
        en: "O Allah, I seek refuge in You from the punishment of the grave, from the punishment of Hell, from the trial of life and death, and from the evil of the trial of the False Messiah (the Dajjal).",
      },
      virtue: {
        tr: "Hz. Peygamber namazda selâm vermeden önce bu duayı okurdu ve sahabîlere 'Selâmdan önce bu dört şeyden Allah'a sığının' diye emretti (Buhârî, Müslim). Bu emrin veriliş şekli dikkat çekicidir: namaz bitmeden, henüz duanın içindeyken okunan bir 'son savunma'. Dört tehlike: kabir (ölüm sonrası hâl), cehennem (nihai ceza), mahyâ-memât fitnesi (hayatın her günü ve ölüm anının imtihanı), Deccâl (tarihin büyük aldatmacası). Biri ahirete, biri gündelik yaşama, ikisi köprü anlarına aittir.",
        en: "The Messenger of Allah, peace be upon him, would recite this supplication before the salam of the prayer, and commanded the Companions, 'Seek refuge in Allah from these four things before the salam' (Al-Bukhari, Muslim). The manner in which this command was given is notable: it is a final line of defense recited before the prayer even ends, while one is still within supplication. Four dangers: the grave (the state after death), Hellfire (the ultimate punishment), the trial of life and death (the test of every day of life and of the moment of death), and the Dajjal (history's greatest deception). One belongs to the hereafter, one to daily life, and two to the bridging moments between them.",
      },
      source: {
        tr: "Buhârî, Ezan, nr. 832; Müslim, Mesâcid, nr. 588; Hısnu'l-Muslim nr. 55",
        en: "Sahih al-Bukhari, Adhan, no. 832; Sahih Muslim, Mosques, no. 588; Hisn al-Muslim no. 55",
      },
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
      key: 'namaz-selamdan-once-kesel-magram-istiaze',
      nameArabic:
        'اللَّهُمَّ فَإِنِّي أَعُوذُ بِكَ مِنَ الْكَسَلِ وَالْهَرَمِ وَالْمَأْثَمِ وَالْمَغْرَمِ',
      name: {
        tr: 'Selâmdan Önce — Tembellik, Yaşlılık, Günah ve Borçtan Sığınma',
        en: 'Before the Salam — Seeking Refuge from Laziness, Old Age, Sin, and Debt',
      },
      transliteration: {
        tr: `Allâhümme fe-innî eûzü bike mine'l-keseli ve'l-heremi ve'l-me'semi ve'l-mağrami.`,
        en: `Allahumma fa-inni a'udhu bika minal-kasali wal-harami wal-ma'thami wal-maghram.`,
      },
      meaning: {
        tr: `Allah'ım! Tembellikten, ihtiyarlıktan, günahtan ve borçlanmaktan sana sığınırım.`,
        en: `O Allah, I seek refuge in You from laziness, from old age, from sin, and from being in debt.`,
      },
      virtue: {
        tr: `Hz. Âişe radıyallahu anhâ'dan rivayet edilen bu dua, namazda tahiyyattan sonra selâm öncesi okunur; tembelliğin sürükleyeceği günah kirinden ve insanı alçaltan borç yükünden Allah'a sığınmayı öğretir.`,
        en: `Narrated from Aisha, may Allah be pleased with her, this supplication is recited after the tashahhud and before the salam of the prayer; it teaches seeking refuge in Allah from the sin that laziness leads to and from the burden of debt that lowers a person.`,
      },
      source: {
        tr: `Sahih-i Müslim, İstiâze, 589/4877`,
        en: `Sahih Muslim, Seeking Refuge, 589/4877`,
      },
      tags: ['namaz', 'selam öncesi', 'istiaze', 'borç', 'tembellik', 'günah'],
      categories: ['ibadet', 'namaz', 'istiaze', 'korunma'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'namazda selâmdan hemen önce',
        'borç ve günahtan korunma',
        'tembellik ve yaşlılıktan sığınma',
        'Hz. Âişe rivayeti',
      ],
    },
    {
      key: 'namaz-selamdan-once-inni-zalemtu',
      nameArabic:
        'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
      name: {
        tr: 'Selâmdan Önce Mağfiret Duası — İnnî Zalemtü',
        en: 'Before the Salam — Supplication of Forgiveness (Innee Zalamtu)',
      },
      transliteration: {
        tr: "Allâhümme innî zalemtü nefsî zulmen kesîren ve lâ yağfiruż-żünûbe illâ ente, feğfir lî mağfireten min indike verhamnî, inneke entel-Ğafûrur-Rahîm.",
        en: "Allahumma inni zalamtu nafsi zulman kathiran wa la yaghfirudh-dhunuba illa anta, faghfir li maghfiratan min 'indika warhamni, innaka antal-Ghafurur-Rahim.",
      },
      meaning: {
        tr: "Allahım! Ben nefsime çok zulmettim. Günahları ancak sen bağışlarsın. Katından bir mağfiretle beni bağışla ve bana merhamet eyle. Şüphesiz sen çok bağışlayansın, çok merhamet edensin.",
        en: "O Allah, I have wronged myself greatly, and none forgives sins but You. So grant me forgiveness from Yourself and have mercy on me. Indeed, You are the Most Forgiving, the Most Merciful.",
      },
      virtue: {
        tr: "Ebû Bekr es-Sıddîk radıyallahu anh, Hz. Peygamber'e namazda ne okuyacağını sordu; Hz. Peygamber bu duayı öğretti (Buhârî, Müslim). 'Zalemtü nefsî zulmen kesîren' — 'nefsime çok zulmettim' — bu cümle hem itiraf hem de kabullenme; günah inkâr edilmiyor, üstüne bir de 'çok' deniliyor. 'Min indike' — 'katından' — dua sıradan bir af değil, Allah'ın bizzat kendi katından gelen, koşulsuz bir mağfiret talep ediyor. Namaz selâmından önce bunu okumak, namazı kapatmadan önce hesabı temizlemektir.",
        en: "Abu Bakr as-Siddiq, may Allah be pleased with him, asked the Messenger of Allah, peace be upon him, what to say in his prayer; the Prophet taught him this supplication (Al-Bukhari, Muslim). 'Zalamtu nafsi zulman kathiran' — 'I have wronged myself greatly' — is at once a confession and an acceptance; the sin is not denied, and 'greatly' is added on top of it. 'Min 'indika' — 'from Yourself' — the supplication does not ask for an ordinary pardon, but for an unconditional forgiveness coming directly from Allah's own presence. Reciting this before the salam of the prayer clears the account before the prayer is closed.",
      },
      source: {
        tr: "Buhârî, Ezan, nr. 834; Müslim, Zikir ve Dua, nr. 2705; Hısnu'l-Muslim nr. 57",
        en: "Sahih al-Bukhari, Adhan, no. 834; Sahih Muslim, Remembrance and Supplication, no. 2705; Hisn al-Muslim no. 57",
      },
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
      name: {
        tr: 'Selâmdan Önce — Zikir, Şükür ve İbadet İçin Yardım',
        en: 'Before the Salam — Seeking Help for Remembrance, Gratitude, and Worship',
      },
      transliteration: {
        tr: "Allâhümme a'innî alâ zikrike ve şükrike ve husni ibâdetik.",
        en: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik.",
      },
      meaning: {
        tr: "Allahım! Seni zikretmek, sana şükretmek ve sana güzelce ibâdet etmekte bana yardım et.",
        en: "O Allah, help me to remember You, to give You thanks, and to worship You well.",
      },
      virtue: {
        tr: "Hz. Peygamber, Muâz ibn Cebel radıyallahu anh'ın elini tutarak şöyle dedi: 'Ey Muâz! Seni seviyorum. Her namazın ardından şunu söylemeni tavsiye ediyorum: Allâhümme a'innî alâ zikrike ve şükrike ve husni ibâdetik.' (Ebu Dâvûd; sahih). Üç talep: zikir (seni hatırlama), şükür (nimetini sayma), hüsn-ü ibadet (güzel ibadet). Bu dua, namazın içinde namazın devamı için dua etmektir — bir ibadetin içinde bir sonraki ibadetin tohumunu atmak.",
        en: "The Messenger of Allah, peace be upon him, took the hand of Mu'adh ibn Jabal, may Allah be pleased with him, and said, 'O Mu'adh, I love you. I advise you to say this after every prayer: Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik' (Abu Dawood; authentic). Three requests: dhikr — remembering Him, shukr — counting His blessings, and husn al-'ibadah — worshipping Him well. This supplication is a prayer for the continuation of prayer, recited within the prayer itself — planting the seed of the next act of worship inside the current one.",
      },
      source: {
        tr: "Ebu Dâvûd, Vitir, nr. 1522; Nesâî, Sehv, nr. 1303; sahih — Bkz. Sahih-i Ebî Dâvûd (1/284); Hısnu'l-Muslim nr. 59",
        en: "Abu Dawood, Witr, no. 1522; An-Nasa'i, Forgetfulness (Sahw), no. 1303; authentic (sahih) — see Sahih Abi Dawood (1/284); Hisn al-Muslim no. 59",
      },
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
      name: {
        tr: 'Selâmdan Sonra İlk Zikir — Estağfirullah + Entes-Selâm',
        en: 'First Remembrance After the Salam — Astaghfirullah and Antas-Salam',
      },
      transliteration: {
        tr: "Estağfirullâh (×3) — Allâhümme entes-selâmu ve minkes-selâm, tebârakte yâ zel-celâli vel-ikrâm.",
        en: "Astaghfirullah (x3) — Allahumma Antas-Salamu wa minkas-salam, tabarakta ya Dhal-jalali wal-ikram.",
      },
      meaning: {
        tr: "Allah'tan mağfiret dilerim (3 kez) — Allahım! Sen Selâm'sın, selâmet sendendir. Ey azamet ve ikram sahibi! Senin bereketin pek çoktur.",
        en: "I seek Allah's forgiveness (x3) — O Allah, You are Peace, and from You comes peace. Blessed are You, O Possessor of majesty and honor.",
      },
      virtue: {
        tr: "Sevbân radıyallahu anh'tan gelen rivayette Hz. Peygamber selâm verdikten sonra üç kez istiğfar eder, ardından bu duayı okurdu (Müslim). Selâm verildi — dua değil, önce istiğfar. Namaz bitti; ama namazın ne kadar hakkı ile kılındığı bilinmiyor — bu yüzden hemen 'bağışla' deniyor. Ardından 'Entes-Selâm' — sen selamlama ve selamet verensin, bu namaz selâmı da senden geliyor; anlamıyla selâmı geri kaynaklarına döndürmek. Bu, namazSonrasiZikir'deki 33'lük tesbihten önce okunacak ilk zikirdir.",
        en: "In the narration from Thawban, may Allah be pleased with him, the Messenger of Allah, peace be upon him, would say istighfar three times after the salam, then recite this supplication (Muslim). The salam has been given — yet what follows is not a request but first an act of seeking forgiveness. The prayer has ended, but one does not know how fully its due has been fulfilled — hence the immediate plea, 'forgive.' Then comes 'Antas-Salam' — You are peace and the giver of peace — meaning that even the peace-greeting of this prayer returns to its true source in Him. This is the first remembrance to be recited before the thirty-three-fold tasbih that follows the prayer.",
      },
      source: {
        tr: "Müslim, Mesâcid, nr. 591; Hısnu'l-Muslim nr. 66",
        en: "Sahih Muslim, Mosques, no. 591; Hisn al-Muslim no. 66",
      },
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
