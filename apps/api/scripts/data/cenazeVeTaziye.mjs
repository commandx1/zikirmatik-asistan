export const cenazeVeTaziye = {
  key: 'cenaze-ve-taziye',
  label: {
    tr: 'Cenaze ve Taziye Duaları',
    en: 'Funeral and Condolence Supplications',
  },
  category: 'ibadet',
  description: {
    tr: 'Cenaze namazı, defin ve taziyede okunacak dualar.',
    en: 'Supplications to recite during the funeral prayer, burial, and condolences.',
  },
  dhikrItems: [
    {
      key: 'cenaze-namaz-duasi-uzun',
      nameArabic:
        'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ وَأَدْخِلْهُ الْجَنَّةَ وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ',
      name: {
        tr: 'Cenaze Namazı Duası',
        en: 'Funeral Prayer Supplication',
      },
      transliteration: {
        tr: "Allâhümmağfir lehû verhamhû ve âfihî va'fü anh. Ve ekrim nüzülehû ve vessi' müdhalehû. Vağsilhü bil-mâi ve's-selci ve'l-bered. Ve nakkıhî mine'l-hatâyâ kemâ nakkayte's-sevbe'l-ebyada mine'd-denes. Ve ebdilhû dâren hayran min dârihî ve ehlen hayran min ehlihî ve zevcen hayran min zevcihî. Ve edhılhü'l-cennete ve eizhü min azâbi'l-kabri ve min azâbi'n-nâr.",
        en: "Allahummaghfir lahu warhamhu wa 'afihi wa'fu 'anhu. Wa akrim nuzulahu wa wassi' mudkhalahu. Waghsilhu bil-ma'i wath-thalji wal-barad. Wa naqqihi minal-khataya kama naqqaytath-thawbal-abyada minad-danas. Wa abdilhu daran khayran min darihi wa ahlan khayran min ahlihi wa zawjan khayran min zawjihi. Wa adkhilhul-jannah wa a'idhhu min 'adhabil-qabr wa min 'adhabin-nar.",
      },
      meaning: {
        tr: `Allahım! Onu bağışla, ona rahmet eyle, onu azap ve sıkıntılardan koru, kusurlarını affeyle. Cennetten nasibini ihsân eyle, kabrini genişlet. Onu su ile, kar ile ve dolu ile yıka. Beyaz elbiseyi kirden temizler gibi onu günahlarından arındır. Ona kendi evinden daha güzel bir ev, ailesinden daha hayırlı bir aile, eşinden daha hayırlı bir eş ver. Onu cennete koy, kabir ve cehennem azabından koru.`,
        en: 'O Allah! Forgive him, have mercy upon him, protect him from torment and distress, and pardon his faults. Honor his station and expand his grave. Wash him with water, snow, and hail. Cleanse him of his sins as You clean a white garment from filth. Grant him in exchange a home better than his home, a family better than his family, and a spouse better than his spouse. Admit him to Paradise and protect him from the punishment of the grave and the punishment of the Fire.',
      },
      virtue: {
        tr: `Resûlullah (sas) bir cenaze namazı kıldırdı ve bu duayı okudu. Sahâbî Avf ibni Mâlik şöyle dedi: "Bu güzel duayı duyunca 'keşke o ölen ben olsaydım' diye arzu ettim." Dua, sekiz eksenli bir şefaat dilekçesidir: bağışlanma, rahmet, afiyet, af, ikram, genişlik, temizlenme ve cennet. "Su, kar ve dolu ile yıka" ifadesi, günahların hem zahirî hem bâtınî her boyuttan arındırılması dileğini dile getirir. Cenaze namazının üçüncü tekbirinden sonra okunur; ölen erkekse "lehû", kadınsa "lehâ", iki kişi içinse "hümâ" kullanılır.`,
        en: 'The Prophet (peace be upon him) led a funeral prayer and recited this supplication. The Companion Awf ibn Malik said: "When I heard this beautiful supplication, I wished that the deceased were me." The supplication is an eight-fold petition for intercession: forgiveness, mercy, safety, pardon, honor, spaciousness, purification, and Paradise. The phrase "wash him with water, snow, and hail" expresses the desire to purify him from sin in every dimension, both outward and inward. It is recited after the third takbir of the funeral prayer; if the deceased is male, "lahû" is used; if female, "lahâ"; if two, "humâ".',
      },
      source: {
        tr: `Müslim, Cenâiz, 37 (963); Ebû Dâvûd, Cenâiz, 31 (3203)`,
        en: 'Muslim, Book of Funerals, 37 (963); Abu Dawood, Book of Funerals, 31 (3203)',
      },
      tags: ['cenaze', 'dua', 'namaz', 'ölüm', 'rahmet', 'af'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'cenaze namazı',
        'meyyit için dua',
        'üçüncü tekbir sonrası',
        'ölen kişi için dua',
      ],
    },
    {
      key: 'cenaze-namaz-duasi-genel',
      nameArabic:
        'اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَأُنْثَانَا وَشَاهِدِنَا وَغَائِبِنَا، اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ، اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ وَلَا تُضِلَّنَا بَعْدَهُ',
      name: {
        tr: 'Cenaze Namazı Genel Duası',
        en: 'General Funeral Prayer Supplication',
      },
      transliteration: {
        tr: "Allâhümmağfir lihayyinâ ve meyyitinâ ve sağîrinâ ve kebîrinâ ve zekerinâ ve ünsânâ ve şâhidinâ ve gâibinâ. Allâhümme men ahyeytehû minnâ feahyihî ale'l-İslâm. Ve men teveffeytehû minnâ feteveffehû ale'l-îmân. Allâhümme lâ tahrimnâ ecrehû ve lâ tudillanâ ba'deh.",
        en: "Allahummaghfir lihayyina wa mayyitina wa saghirina wa kabirina wa dhakarina wa unthana wa shahidina wa gha'ibina. Allahumma man ahyaytahu minna fa ahyihi 'alal-Islam. Wa man tawaffaytahu minna fatawaffahu 'alal-iman. Allahumma la tahrimna ajrahu wa la tudillana ba'dah.",
      },
      meaning: {
        tr: `Allahım! Dirilerimizi ve ölülerimizi, küçüklerimizi ve büyüklerimizi, erkeklerimizi ve kadınlarımızı, burada bulunanlarımızı ve bulunmayanlarımızı bağışla. Bizden hayatta bırakacaklarını İslâm üzere yaşat, öldüreceklerini îman ile öldür. Bizi bu cenâzede bulunmanın sevâbından mahrûm eyleme ve ondan sonra bizi fitneye düşürme.`,
        en: 'O Allah! Forgive our living and our dead, our young and our old, our males and our females, those present and those absent. O Allah! Those among us whom You grant life, grant them life in Islam, and those among us whom You cause to die, let them die in faith. Do not deprive us of the reward of attending this funeral, and do not lead us into temptation after him.',
      },
      virtue: {
        tr: `Hz. Peygamber (sas) bir cenaze namazında bu duayı okudu. İki bölümden oluşur: birincisi bütün Müslümanları kapsayan genel mağfiret talebi, ikincisi ise cemaat ve meyyit için özel niyazlar. "İslâm üzere yaşat, îman ile öldür" ifadesi, en temel insanî kaygıyı —hem dünya hem ölüm anındaki hâli— Allah'a arz eder. "Bizi fitneye düşürme" cümlesi, kayıptan sonra insanın en kolay düşebileceği tehlikeye karşı bir sigorta gibidir. Özellikle cemaatle kılınan cenaze namazlarında, birden fazla kişi için kılınan namazlarda okunması uygundur.`,
        en: 'The Prophet (peace be upon him) recited this supplication during a funeral prayer. It consists of two parts: the first is a general request for forgiveness encompassing all Muslims, and the second contains specific petitions for the congregation and the deceased. The phrase "grant them life in Islam and let them die in faith" presents the most fundamental human concern — the state of both worldly life and the moment of death — before Allah. The clause "do not lead us into temptation" is like an insurance against the danger to which people are most vulnerable after a loss. It is especially appropriate to recite during communal funeral prayers or when praying for multiple people.',
      },
      source: {
        tr: `Ebû Dâvûd, Cenâiz, 34 (3201); Tirmizî, Cenâiz, 38 (1024); İbn Mâce, Cenâiz, 21 (1498)`,
        en: 'Abu Dawood, Book of Funerals, 34 (3201); At-Tirmidhi, Book of Funerals, 38 (1024); Ibn Majah, Book of Funerals, 21 (1498)',
      },
      tags: ['cenaze', 'dua', 'namaz', 'ölüm', 'af', 'cemaat'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: ['cenaze namazı', 'cemaat için dua', 'tüm Müslümanlar için'],
    },
    {
      key: 'cenaze-musibette-inna-lillah',
      nameArabic:
        'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
      name: {
        tr: 'Musibet Anında Okunacak Dua',
        en: 'Supplication for Times of Calamity',
      },
      transliteration: {
        tr: "İnnâ lillâhi ve innâ ileyhi râciûn. Allâhümme'curnî fî musîbetî ve ahlif lî hayran minhâ.",
        en: "Inna lillahi wa inna ilayhi raji'un. Allahumma'jurni fi musibati wa akhlif li khayran minha.",
      },
      meaning: {
        tr: `Biz Allah'a aidiz ve şüphesiz O'na döneceğiz. Allahım! Beni bu musibetimde ecre nâil eyle ve bana ondan daha hayırlısını nasip eyle.`,
        en: 'Indeed we belong to Allah, and indeed to Him we will return. O Allah! Grant me reward in this calamity and replace it for me with something better.',
      },
      virtue: {
        tr: `Hz. Peygamber (sas) bu duayı musibete uğrayan kimseye öğretti ve "Bir kimse başına bir musibet gelince bu duayı okursa Allah onun ecrini muhakkak verir ve kaybettiğinin yerine daha hayırlısını ihsân eder" buyurdu. Hz. Ümmü Seleme (r.anhâ) şöyle anlattı: Kocası Ebû Seleme vefât ettiğinde bu duayı okudum. Allah bana Ümmü Seleme yerine Resûlullah'ı (sas) verdi — ondan daha hayırlısını. Âyet olan "innâ lillâhi ve innâ ileyhi râciûn" (Bakara 2/156-157) kaybın gerçek boyutunu ortaya koyar: her şey Allah'a aittir, döneceğimiz yer de O'dur. Dua bu ilkeyi bireysel kayıpa uygular.`,
        en: 'The Prophet (peace be upon him) taught this supplication to those afflicted with calamity and said: "If anyone is afflicted with a calamity and recites this supplication, Allah will certainly reward him and replace his loss with something better." Umm Salamah (may Allah be pleased with her) narrated: When my husband Abu Salamah died, I recited this supplication. Allah replaced Abu Salamah with the Messenger of Allah (peace be upon him) for me — something far better. The verse "Indeed we belong to Allah, and indeed to Him we will return" (Quran 2:156-157) reveals the true nature of loss: everything belongs to Allah, and to Him we return. This supplication applies that principle to personal loss.',
      },
      source: {
        tr: `Müslim, Cenâiz, 3 (918); Ebû Dâvûd, Cenâiz, 22 (3119); Tirmizî, Deavât, 19 (3511)`,
        en: 'Muslim, Book of Funerals, 3 (918); Abu Dawood, Book of Funerals, 22 (3119); At-Tirmidhi, Book of Supplications, 19 (3511)',
      },
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
      name: {
        tr: 'Defin Duası',
        en: 'Burial Supplication',
      },
      transliteration: {
        tr: 'Bismillâhi ve alâ sünneti Resûlillâhi sallallahu aleyhi ve sellem.',
        en: "Bismillahi wa 'ala sunnati Rasulillahi sallallahu 'alayhi wa sallam.",
      },
      meaning: {
        tr: `Allah'ın adıyla ve Resûlullah sallallahu aleyhi ve sellemin sünnetiyle (kabre koyuyorum).`,
        en: 'In the name of Allah and in accordance with the Sunnah of the Messenger of Allah (I place this deceased).',
      },
      virtue: {
        tr: `İbn Ömer'den rivâyet edildiğine göre Resûlullah (sas) ölüyü kabre koyduğu zaman bu sözü söylerdi. İki unsuru bir araya getirir: bismillah ile Allah'ın adının anılması, "alâ sünnetihi" ile de bu işlemin Peygamber'in emrettiği şekliyle yapıldığının ikrarı. Bu kısa cümle, cenazenin toprağa bırakılışını sıradan bir gömme eyleminden ilâhî bir teslimiyete dönüştürür. Cenâzeyi mezara bırakırken — lahde yatırılırken ya da üzerine ilk toprak atılırken — söylenir.`,
        en: 'According to a narration from Ibn Umar, the Messenger of Allah (peace be upon him) would recite these words when placing the deceased in the grave. It brings together two elements: invoking Allah\'s name with "In the name of Allah," and affirming with "in accordance with the Sunnah" that this action is being performed in the manner prescribed by the Prophet. This brief statement transforms the act of committing the deceased to the earth from an ordinary burial into an act of divine surrender. It is recited when placing the deceased in the grave — whether lowering them into the grave chamber or casting the first soil upon them.',
      },
      source: {
        tr: `İbn Mâce, Cenâiz, 37 (1550); Ebû Dâvûd, Cenâiz, 37 (3213); Tirmizî, Cenâiz, 27 (1046)`,
        en: 'Ibn Majah, Book of Funerals, 37 (1550); Abu Dawood, Book of Funerals, 37 (3213); At-Tirmidhi, Book of Funerals, 27 (1046)',
      },
      tags: ['cenaze', 'defin', 'dua', 'kabir'],
      categories: ['cenaze', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: ['defin anı', 'kabre koyarken', 'toprağa verirken'],
    },
    {
      key: 'cenaze-kabir-ziyaret-selami',
      nameArabic:
        'السَّلَامُ عَلَى أَهْلِ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ وَيَرْحَمُ اللَّهُ الْمُسْتَقْدِمِينَ مِنَّا وَالْمُسْتَأْخِرِينَ وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَاحِقُونَ',

      name: {
        tr: 'Kabir Ziyareti Selamı',
        en: 'Graveyard Greeting',
      },
      transliteration: {
        tr: "Esselâmü alâ ehli'd-diyâri mine'l-mü'minîne ve'l-müslimîn. Yerhamullâhü'l-müstekdimîne minnâ ve'l-müste'hirîn. Ve innâ inşâallâhu biküm lâhikûn.",
        en: "As-salamu 'ala ahlid-diyari minal-mu'minina wal-muslimin. Yarhamullahu al-mustaqdimina minna wal-musta'khirin. Wa inna in sha' Allahu bikum lahiqun.",
      },
      meaning: {
        tr: `Bu diyârın mü'min ve müslim halkına selâm olsun! Bizden ve sizden önce gidenlere ve geride kalanlara Allah rahmet eylesin. İnşallah biz de yakında aranıza katılacağız.`,
        en: 'Peace be upon the inhabitants of this abode among the believers and Muslims. May Allah have mercy on those of us and you who have passed on, and on those who remain. God willing, we shall soon be among you.',
      },
      virtue: {
        tr: `Hz. Âişe (r.anhâ), Resûlullah'ın (sas) yanında kaldığı gecelerin sonuna doğru Bakî kabristanına giderek bu duayı okuduğunu anlattı. "Biz de size katılacağız" ifadesi, kabristanı ziyaret etmeyi yalnızca geçmişi anma töreni olmaktan çıkarır; kendi ölümü de hatırlatır, tefekkür ve hazırlık için bir zemin oluşturur. Üç iş yapar: ziyaret edilen ruhlara selam, genel Müslüman ölüleri için rahmet talebi ve kişinin kendi fanîliğini ikrar etmesi. Mezarlığa girerken veya kabre yaklaşırken okunur.`,
        en: 'Aisha (may Allah be pleased with her) narrated that the Messenger of Allah (peace be upon him) would visit the Baqi cemetery toward the end of the nights and recite this supplication. The phrase "we shall soon be among you" transforms a cemetery visit from a mere commemoration of the past; it reminds one of one\'s own mortality and creates a foundation for reflection and preparation. It serves three purposes: greeting the spirits of those visited, requesting mercy for the deceased Muslims in general, and the person\'s acknowledgment of their own mortality. It is recited when entering the cemetery or approaching a grave.',
      },
      source: {
        tr: `Müslim, Cenâiz, 104 (974); İbn Mâce, Cenâiz, 36 (1547); Nesâî, Cenâiz, 103`,
        en: "Muslim, Book of Funerals, 104 (974); Ibn Majah, Book of Funerals, 36 (1547); An-Nasa'i, Book of Funerals, 103",
      },
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

      name: {
        tr: 'Taziye Duası',
        en: 'Condolence Supplication',
      },
      transliteration: {
        tr: "İnne lillâhi mâ ehaze ve lehû mâ a'tâ. Ve küllü şey'in indehû bi ecelin müsemmâ. Feltasbir veltahtesib.",
        en: "Inna lillahi ma akhadha wa lahu ma a'ta. Wa kullu shay'in 'indahu bi ajalin musamman. Faltasbir waltahtasib.",
      },
      meaning: {
        tr: `Allah aldığı şeyin zaten sahibiydi. Verdiği de O'nundur. Her şey O katında belirlenmiş bir ecele göre gerçekleşir. Öyleyse sabret ve mükâfatını Allah'tan bekle.`,
        en: 'Indeed, to Allah belongs what He takes, and to Him belongs what He gives. Everything with Him is decreed for a fixed time. So be patient and seek your reward from Allah.',
      },
      virtue: {
        tr: `Resûlullah (sas) bir sahâbînin çocuğu vefât ettiğinde bu sözleri söyleyerek taziyede bulundu. Buhârî rivayetinde Hz. Peygamber bunu ağlayan bir anneye iletmesi için elçi gönderdi. Taziye sözleri üç temel gerçeği öğretir: Allah'ın mülkiyeti (aldığı zaten O'nundur), kader (eceli belirlenmiş), sabır telkini. Kalıp bir teselli cümlesi değil; acı çeken kişiyi gerçekle yüzleştirip ona güç katan bir telkindir. Cenaze sonrası aile ve yakınlara başsağlığı dilerken söylenir.`,
        en: "When the child of a Companion died, the Messenger of Allah (peace be upon him) offered condolences using these very words. In al-Bukhari's narration, the Prophet sent a messenger to relay these words to a grieving mother. The words of condolence teach three fundamental truths: Allah's ownership (what He takes was always His), divine decree (fixed appointed terms), and the exhortation to patience. It is not a mere formulaic comfort; rather, it is a reminder that places the suffering person face-to-face with reality and empowers them. It is recited when extending condolences to the family and loved ones after a funeral.",
      },
      source: {
        tr: `Buhârî, Cenâiz, 32 (1284); Müslim, Cenâiz, 9 (923)`,
        en: 'Al-Bukhari, Book of Funerals, 32 (1284); Muslim, Book of Funerals, 9 (923)',
      },
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
    {
      key: 'cenaze-namaz-duasi-rabbi',
      nameArabic:
        'اللَّهُمَّ أَنْتَ رَبُّهَا وَأَنْتَ خَلَقْتَهَا وَأَنْتَ هَدَيْتَهَا لِلْإِسْلَامِ وَأَنْتَ قَبَضْتَ رُوحَهَا وَأَنْتَ أَعْلَمُ بِسِرِّهَا وَعَلَانِيَتِهَا، جِئْنَاكَ شُفَعَاءَ لَهُ فَاغْفِرْ لَهُ',
      name: {
        tr: 'Cenaze Namazı Duası (Kadın Cenaze İçin)',
        en: 'Funeral Prayer Supplication (For a Female Deceased)',
      },
      transliteration: {
        tr: "Allâhümme ente rabbühâ ve ente halaktehâ ve ente hedeytehâ li'l-İslâm. Ve ente kabadte rûhahâ ve ente a'lemü bisirrihâ ve alâniyetihâ. Ci'nâke şüfeâe lehâ fağfir lehâ.",
        en: "Allahumma anta rabbuha wa anta khalaqtaha wa anta hadaytaha lil-Islam. Wa anta qabadta ruhaha wa anta a'lamu bisirriha wa 'alaniyyatiha. Ji'naka shufa'a laha faghfir laha.",
      },
      meaning: {
        tr: "Allah'ım! Sen onun Rabbisin; onu Sen yarattın, onu İslâm'a Sen hidayet ettin. Ruhunu da Sen aldın. Onun gizli ve açık hâllerini en iyi Sen bilirsin. Sana onun için şefaatçi olarak geldik. Onu bağışla.",
        en: 'O Allah, You are her Lord. You created her, You guided her to Islam, and You have taken her soul. You know best her private and public affairs. We have come before You as intercessors on her behalf, so forgive her.',
      },
      virtue: {
        tr: "Ebû Hüreyre radıyallahu anh rivayet ettiğine göre, Resûlullah (sas) cenaze namazında bu duayı okurdu. Dua, vefat eden kimsenin bütün hâlinin Allah'ın ilmi ve hükmü altında olduğunu ikrar eder; cemaatin ise onun bağışlanması için Allah'a yönelerek şefaat dilemesini ifade eder. Kadın cenaze için okunan bu rivayet, cenaze namazının üçüncü tekbirinden sonra okunur.",
        en: "Abu Hurairah, may Allah be pleased with him, narrated that the Messenger of Allah (peace be upon him) recited this supplication during the funeral prayer. The supplication affirms that every aspect of the deceased's life is under Allah's knowledge and decree, while expressing the congregation's plea to intercede on her behalf by asking Allah to forgive her. This narration is recited after the third takbir of the funeral prayer for a female deceased.",
      },
      source: {
        tr: 'Ebû Dâvûd, Cenâiz, 56 (3200); İbn Mâce, Cenâiz, 23 (1498); İmam Nevevî, el-Ezkâr, nr. 474',
        en: 'Abu Dawood, Funerals, 56 (3200); Ibn Majah, Funerals, 23 (1498); Imam al-Nawawi, Al-Adhkar, no. 474',
      },
      tags: ['cenaze', 'namaz', 'dua', 'şefaat', 'mağfiret'],
      categories: ['cenaze', 'dua', 'ibadet'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'cenaze namazında 3. tekbir sonrası',
        'uzun cenaze duası yerine alternatif',
        'şefaat niyetiyle',
        'cemaatle cenaze namazında',
      ],
    },
    {
      key: 'cenaze-gecerken-zikir',
      nameArabic: 'سُبْحَانَ الْحَيِّ الَّذِي لَا يَمُوتُ',
      name: {
        tr: 'Cenaze Görünce Okunacak Zikir',
        en: 'Dhikr upon Seeing a Funeral',
      },
      transliteration: {
        tr: 'Sübhâne’l-Hayyi’llezî lâ yemût.',
        en: 'Subhanal-Hayyilladhi la yamut.',
      },
      meaning: {
        tr: 'Hiç ölmeyecek olan Diri Allah’ı bütün noksan sıfatlardan tenzih ederim.',
        en: 'Glory be to the Ever-Living, who never dies.',
      },
      virtue: {
        tr: "İmam Nevevî, el-Ezkâr'da cenaze gören kimsenin bu zikri okumasının müstehap olduğunu belirtir. Bu zikir, ölüm gerçeğini hatırlatan cenaze karşısında yalnızca Allah'ın ebedî ve ölümsüz hayatını tefekkür etmeye yöneltir. 'el-Hayy ellezî lâ yemût' ifadesi, gerçek ve sonsuz hayatın yalnızca Allah'a ait olduğunu hatırlatır.",
        en: "Imam al-Nawawi mentions in Al-Adhkar that it is recommended to recite this dhikr upon seeing a funeral. This remembrance turns one's reflection from the reality of death to Allah's eternal and everlasting life. The phrase 'al-Hayy alladhi la yamut' reminds the believer that true and everlasting life belongs to Allah alone.",
      },
      source: {
        tr: 'İmam Nevevî, el-Ezkâr, Cenâiz Bölümü, Bölüm 26',
        en: 'Imam al-Nawawi, Al-Adhkar, Funerals Chapter, Chapter 26',
      },
      tags: ['cenaze', 'ölüm', 'tefekkür', 'zikir', 'tenzih', 'günlük'],
      categories: ['cenaze', 'zikir', 'tefekkür'],
      timeOfDay: 'any',
      recommendedCount: 7,
      specialDays: [],
      suitableFor: [
        'yanından cenaze geçerken',
        'cenaze aracı görünce',
        'ölüm haberi alınca',
        'mezarlıkta gezerken',
        'ölüm tefekkürü için',
      ],
    },
  ],
};
