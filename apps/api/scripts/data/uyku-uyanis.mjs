export const uyku_uyanis = {
  key: 'uyku uyanış',
  label: {
    tr: 'Uyku ve Uyanış Zikirleri',
    en: 'Sleep and Waking Dhikrs',
  },
  category: 'gunluk',
  description: {
    tr: 'Uyku öncesi ve uyanış anına ait Hz. Peygamber\'den gelen dualar.',
    en: 'Supplications from the Prophet (peace be upon him) for before sleep and upon waking.',
  },
  dhikrItems: [
    // ─── UYKUDAN UYANINCA ──────────────────────────────────────────────────────

    {
      key: 'uyanis-bismike-ahya-hamd',
      nameArabic:
        'بِسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ — اَلْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
      name: {
        tr: 'Uyku ve Uyanış İkiz Duası',
        en: 'Twin Supplication for Sleep and Waking',
      },
      transliteration: {
        tr: `Yatarken: Bismikellàhümme ahyâ ve emût. — Uyanınca: Elhamdülillâhillezî ahyânâ ba'de mâ emâtenâ ve ileyhinnüşûr.`,
        en: `At sleep: Bismikallāhumma ahyā wa amūt. — Upon waking: Al-ḥamdulillāhilladhī aḥyānā ba'da mā amātanā wa ilayhin-nushūr.`,
      },
      meaning: {
        tr: `Yatarken: Allahım! Senin adınla ölür, senin adınla dirilirim. — Uyanınca: Bizi öldürdükten sonra dirilten Allah'a hamd olsun. Yeniden diriltip huzurunda toplayacak olan da O'dur.`,
        en: `At sleep: O Allah, with Your name I die and with Your name I live. — Upon waking: All praise is due to Allah who gave us life after He caused us to die, and to Him is the resurrection.`,
      },
      virtue: {
        tr: `Huzeyfe ibni'l-Yemân radıyallahu anh ve Ebû Zer el-Gıfârî radıyallahu anh, Resûlullah'ın (sas) gece yatağına girince "Bismikellàhümme ahyâ ve emût" dediğini ve uykudan uyandığında "Elhamdülillâhillezî ahyânâ ba'de mâ emâtenâ ve ileyhinnüşûr" dediğini rivâyet ettiler. Uyku küçük ölümdür; bu yüzden Resûlullah (sas) yatarken hem ölümü hem de dirilişi Allah'a bağlardı. Uyanınca hamd etmek ise gece boyunca devam eden solunumu, kalp atışını ve nefes alıp vermeyi fark etmek; bunların tek kaynağını tanımak ve O'nun adıyla bir gün daha başlamaktır. Bu iki dua birbirini tamamlar: biri günü kapatır, diğeri açar. Yatıp kalkmayı bir ölüm-diriliş döngüsü olarak gören bu uygulama, gece ile gündüz arasındaki bilinç kesintisini Allah'a bağlayarak kapatır. İmâm Nevevî, bu iki duanın birlikte okunmasının Hz. Peygamber'in sürekli uyguladığı sünnet olduğunu ve her ikisinin de sahîh isnadlarla sâbit olduğunu vurgular.`,
        en: `Hudhayfah ibn al-Yamān (may Allah be pleased with him) and Abū Dharr al-Ghifārī (may Allah be pleased with him) both narrated that the Messenger of Allah (peace be upon him) would say "Bismikallāhumma ahyā wa amūt" upon entering his bed, and upon waking would say "Al-ḥamdulillāhilladhī aḥyānā ba'da mā amātanā." Sleep is a minor death; hence the Prophet (peace be upon him) entrusted both his dying and his waking to Allah. Offering praise upon waking is an act of recognising the ongoing gifts of breath, heartbeat, and consciousness — gifts that continued throughout the night solely by Allah's will. These two supplications complement each other: one closes the day, the other opens it. By framing sleep and waking as a cycle of death and resurrection, they bridge the gap of consciousness between night and day with the remembrance of Allah. Imām al-Nawawī notes that reciting both supplications together is an established Sunnah of the Prophet (peace be upon him), confirmed by rigorously authenticated chains of transmission.`,
      },
      source: {
        tr: `Buhârî, Deavât, 7 (6312); Müslim, Zikr, 59 (2711)`,
        en: `Sahih al-Bukhari, Supplications (Da'awat), 7 (6312); Sahih Muslim, Dhikr, 59 (2711)`,
      },
      tags: ['uyku', 'uyanış', 'gece', 'sabah', 'dua', 'günlük'],
      categories: ['uyku uyanış', 'dua', 'günlük'],
      timeOfDay: 'night',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['yatmadan önce', 'uykudan uyanınca', 'gece duası', 'sabah ilk zikir'],
    },
    {
      key: 'uyanis-hamd-ruh',
      nameArabic:
        'اَلْحَمْدُ لِلَّهِ الَّذِي رَدَّ عَلَيَّ رُوحِي وَعَافَانِي فِي جَسَدِي وَأَذِنَ لِي بِذِكْرِهِ',
      name: {
        tr: "Uyanınca Ruhu Geri Veren Allah'a Hamd",
        en: 'Praise for Allah Who Restores the Soul Upon Waking',
      },
      transliteration: {
        tr: `Elhamdülillâhillezî radde aleyye rûhî, ve âfânî fî cesedî, ve ezine lî bizikrihî.`,
        en: `Al-ḥamdulillāhilladhī radda 'alayya rūḥī, wa 'āfānī fī jasadī, wa adhina lī bidhikrihī.`,
      },
      meaning: {
        tr: `Ruhumu bana geri veren, vücuduma âfiyet ihsan eden ve kendisini zikretmeme izin veren Allah'a hamd olsun.`,
        en: `All praise is due to Allah who restored my soul to me, granted well-being to my body, and permitted me to remember Him.`,
      },
      virtue: {
        tr: `Ebû Hüreyre radıyallahu anh, Nebiyy-i Ekrem'in (sas) şöyle buyurduğunu rivâyet etti: "Biriniz uykudan uyandığında şöyle desin…" ve ardından bu dua zikredildi. Uyku sırasında Allah Teâlâ ruhları kendisine özgü bir yerde tutar; sabah dilediğine geri verir, dilediğini yanında alıkoyar. Bu dua, sabahın ilk anında üç nimeti birden sayar: ruhun geri verilmesi (yaşıyorum), bedenin âfiyeti (sağlıklıyım) ve zikre izin verilmesi (bugün de Allah'ı anabilirim). Üçüncü nimet — Allah'ı zikretmeye izin verilmesi — özgün ve derin bir farkındalığa işaret eder: zikir bile Allah'ın bir lutfudur, insan kendi başına ona layık değildir. Bu dua, günü yalnızca biyolojik bir uyanışla değil, manevi bir izinle başlatır. İmâm Tirmizî bu hadisin "hasen garîb" derecesinde olduğunu belirtmiştir; bu, hadisin kabul edilebilir güçte olduğu ve tek bir isnad hattından geldiği anlamına gelir.`,
        en: `Abū Hurayrah (may Allah be pleased with him) narrated that the Prophet (peace be upon him) said: "When one of you wakes from sleep, let him say…" followed by this supplication. During sleep, Allah holds souls in a special abode; in the morning He returns them to whom He wills and retains whom He wills. This supplication enumerates three blessings at the very first moment of waking: the return of the soul (I am alive), the well-being of the body (I am sound), and the permission to engage in dhikr (I may remember Allah today). The third blessing — permission for dhikr — points to a subtle and profound awareness: even the remembrance of Allah is His gift; the servant does not deserve it by his own merit. This supplication frames the day not merely as a biological awakening but as a spiritually granted permission. Imām al-Tirmidhī graded this hadith as "ḥasan gharīb," indicating it is of acceptable strength but transmitted through a single chain of narration.`,
      },
      source: {
        tr: `Tirmizî, Deavât, 26 (3401); Tirmizî: "hasenun garîb"`,
        en: `At-Tirmidhi, Supplications (Da'awat), 26 (3401); graded by al-Tirmidhi as "ḥasan gharīb"`,
      },
      tags: ['uyanış', 'sabah', 'hamd', 'şükür', 'dua'],
      categories: ['uyku uyanış', 'hamd', 'şükür'],
      timeOfDay: 'morning',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['uykudan uyanınca', 'sabah ilk dua', 'hamd zikri'],
    },
    {
      key: 'uyanis-tehlil-gece-af',
      nameArabic:
        'لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      name: {
        tr: 'Uyanınca Tehlil (Günahların Affı)',
        en: 'Tahlīl Upon Waking (Forgiveness of Sins)',
      },
      transliteration: {
        tr: `Lâilâhe illallâhu vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü ve hüve alâ külli şey'in kadîr.`,
        en: `Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli shay'in qadīr.`,
      },
      meaning: {
        tr: `Allah'tan başka ilâh yoktur, yalnız Allah vardır. O tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur. O her şeye kâdirdir.`,
        en: `There is no deity worthy of worship except Allah alone; He has no partner. To Him belongs the dominion, to Him belongs all praise, and He has power over all things.`,
      },
      virtue: {
        tr: `Hz. Âişe radıyallahu anhâdan rivâyet edildiğine göre, Resûlullah (sas) şöyle buyurdu: "Bir kimse Allah Teâlâ ruhunu kendisine geri verdiğinde — yani uykudan uyandığında — bu zikri okursa, günahları deniz köpüğü kadar çok olsa bile Allah Teâlâ onun günahlarını affeder." Tevhid formülünün bu kadar güçlü bir mağfiret vaadi taşıması tesadüf değildir: kişi gece boyunca tüm bilinç ve irade kontrolünü kaybedip uyumuş, sabah ruhu geri verilmiştir. Bu yeniden doğuş anında söylenen tevhid ikrarı — "yalnız Allah vardır, O'nun ortağı yoktur, mülk ve hamd O'na aittir, O her şeye kâdirdir" — tertemiz bir sayfanın açılışına işaret eder. Uykudan uyanmanın küçük bir diriliş olduğu düşünüldüğünde, bu kelime-i tevhidin sabahın ilk sözü olması son derece anlamlıdır. İmâm Nevevî, Buhârî'nin bu hadisi Deavât babında tahric etmesine dikkat çekerek, bu zikrin gündüzün ilk anında okunmasının sünnet olduğunu vurgular.`,
        en: `It is narrated from 'Ā'ishah (may Allah be pleased with her) that the Messenger of Allah (peace be upon him) said: "Whoever, when Allah returns his soul to him — that is, upon waking from sleep — recites this dhikr, Allah will forgive his sins even if they are as numerous as the foam of the sea." It is no coincidence that this formula of tawḥīd carries such a powerful promise of forgiveness: throughout the night the person has lost all consciousness and volition, and in the morning his soul has been returned to him. This declaration of tawḥīd — "there is no deity but Allah alone, He has no partner, to Him belongs dominion and praise, and He has power over all things" — uttered at this moment of rebirth, signals the opening of a clean page. Given that waking from sleep is likened to a minor resurrection, making this tahlīl one's very first words of the day is profoundly significant. Imām al-Nawawī notes that al-Bukhārī recorded this hadith in the chapter of supplications, underlining that reciting this dhikr at the first moment of the day is an established Sunnah.`,
      },
      source: {
        tr: `Buhârî, Deavât, 2 (6325); İbn Mâce, Dua, 10 (3872)`,
        en: `Sahih al-Bukhari, Supplications (Da'awat), 2 (6325); Ibn Majah, Supplication, 10 (3872)`,
      },
      tags: ['uyanış', 'sabah', 'tehlil', 'af', 'günah', 'zikir'],
      categories: ['uyku uyanış', 'tevhid', 'zikir'],
      timeOfDay: 'morning',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['uykudan uyanınca', 'sabah ilk zikir', 'af için', 'günlük virdi'],
    },

    // ─── YATMADAN ÖNCE ─────────────────────────────────────────────────────────

    {
      key: 'uyku-ayetel-kursi',
      nameArabic:
        'اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ...',
      name: {
        tr: 'Âyetel Kürsî (Yatmadan Önce)',
        en: "Āyat al-Kursī (Before Sleep)",
      },
      transliteration: {
        tr: `Allàhü lâ ilâhe illâ hüvel hayyül kayyûm, lâ te'huzühû sinetün velâ nevm, lehû mâ fissemâvâti vemâ fil ard, men zellezî yeşfeu indehû illâ biiznih, ya'lemü mâ beyne eydîhim vemâ halfehüm, velâ yuhîtûne bişey'in min ilmihî illâ bimâ şâe, vesia kürsiyyühüssemâvâti vel ard, velâ yeûdühû hıfzuhumâ vehüvel aliyyül azîm.`,
        en: `Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta'khudhuhū sinatun wa lā nawm, lahū mā fis-samāwāti wa mā fil-arḍ, man dhallladhī yashfa'u 'indahū illā bi-idhnih, ya'lamu mā bayna aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishay'in min 'ilmihī illā bimā shā', wasi'a kursiyyuhus-samāwāti wal-arḍ, wa lā ya'ūduhū ḥifẓuhumā wa huwal-'aliyyul-'aẓīm.`,
      },
      meaning: {
        tr: `Allah, O'ndan başka ilâh olmayan, kendisini uyuklama ve uyku tutmayan, diri ve her şeyin varlığı kendisine bağlı olandır. Göklerde ve yerde ne varsa O'nundur. İzni olmadan O'nun katında kim şefaat edebilir? O, yarattıklarının önlerindekini ve arkalarındakini bilir. O'nun bildirdikleri dışında O'nun ilminden hiçbir şeyi kavrayamazlar. Kürsüsü gökleri ve yeri kaplamıştır. Onları korumak O'na ağır gelmez. O yücedir, büyüktür.`,
        en: `Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass not a thing of His knowledge except for what He wills. His Kursī extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.`,
      },
      virtue: {
        tr: `Ebû Hüreyre radıyallahu anhın rivâyetine göre, insan kılığına giren şeytan üç gece ardarda Resûlullah'ın (sas) toplanan zekât mallarından çalmaya gelmiş; Ebû Hüreyre onu yakalamış, şeytan da kendisini serbest bırakması şartıyla bu âyetin sırrını açıklamıştır: "Yatağına girdiğin zaman Âyetel Kürsî'yi oku. O takdirde Allah tarafından sürekli bir koruyucu bulunur; sabaha kadar şeytan sana yaklaşamaz." Resûlullah (sas) bu bilgiyi teyit ederek "O sana yalan söyledi ama bu konuda doğruyu söyledi" buyurdu. Şeytanın bizzat itiraf ettiği bir sırrın Kur'an'ın en büyük âyetinden gelmesi son derece dikkat çekicidir: el-Hayyü'l-Kayyûm sıfatları — hiç uyumayan, hiç yorulmayan, her şeyi bilen ve her şeye kâdir olan Allah — gece boyunca kesintisiz bir kalkan oluşturur. İmâm Nevevî, Âyetel Kürsî'nin yatmadan önce okunmasının, gece korunması için nakledilen zikirler arasında en güçlü ve en güvenilir olanı olduğunu vurgular.`,
        en: `Abū Hurayrah (may Allah be pleased with him) narrated that a figure in human form came for three consecutive nights to steal from the collected zakāh wealth. Abū Hurayrah caught him each time, and the figure — who was in fact Shayṭān — revealed the secret of this verse in exchange for his release: "When you go to your bed, recite Āyat al-Kursī; Allah will appoint a guardian over you, and no Shayṭān will come near you until morning." The Messenger of Allah (peace be upon him) confirmed this, saying: "He told you the truth, though he is a liar." It is most remarkable that the secret admitted by Shayṭān himself comes from the greatest verse in the Quran: the attributes of al-Ḥayyul-Qayyūm — the Ever-Living who never sleeps, never tires, knows all things, and has power over all things — provide an unbroken shield throughout the night. Imām al-Nawawī emphasises that reciting Āyat al-Kursī before sleep is the most powerful and most reliably transmitted of all the night-protection adhkār.`,
      },
      source: {
        tr: `Buhârî, Vekâlet, 10 (2311); Bakara Sûresi, 255. âyet`,
        en: `Sahih al-Bukhari, Agency (Wakālah), 10 (2311); Quran, Sūrat al-Baqarah, verse 255`,
      },
      tags: ['uyku', 'gece', 'koruma', 'kur\'an', 'ayetel kürsi', 'şeytan'],
      categories: ['uyku uyanış', 'koruma', 'kur\'an'],
      timeOfDay: 'night',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['yatmadan önce', 'gece koruması', 'şeytandan korunma', 'gece virdi'],
    },
    {
      key: 'uyku-bismike-rabbi-yatak',
      nameArabic:
        'بِسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
      name: {
        tr: 'Yatağa Uzanırken Dua',
        en: 'Supplication Upon Lying Down in Bed',
      },
      transliteration: {
        tr: `Bismike Rabbî vada'tü cenbî ve bike erfauhû. İn emsekte nefsî ferhamhâ, ve in erseltehâ fahfezhâ bimâ tahfazü bihî ibâdekes sâlihîn.`,
        en: `Bismika Rabbī wada'tu janbī wa bika arfa'uh. In amsakta nafsī farḥamhā, wa in arsaltahā faḥfaẓhā bimā taḥfaẓu bihī 'ibādakas-ṣāliḥīn.`,
      },
      meaning: {
        tr: `Ey benim Rabbim! Senin isminle yatağıma yattım, yine senin isminle yatağımdan kalkarım. Eğer canımı alacaksan bana merhamet edip bağışla. Şâyet hayatta bırakacaksan, sâlih kullarını koruduğun gibi beni de kötülüklerden koru.`,
        en: `O my Lord, with Your name I lay down my side, and with Your name I raise it. If You take my soul, have mercy on it; and if You release it, guard it with that which You guard Your righteous servants.`,
      },
      virtue: {
        tr: `Ebû Hüreyre radıyallahu anh, Resûlullah'ın (sas) bu duayı yatağına uzandığında okuduğunu rivâyet etti. Dua iki olasılığı birden kapsar: bu gece can alınırsa rahmet dile, alınmazsa salih kullar gibi koru. Birincisi ölüm korkusunu değil, ölümü teslimiyetle karşılamayı öğretir; ikincisi ise gece boyunca "beni kim koruyacak?" sorusuna cevap verir. "Salih kullar gibi koru" ifadesi, kulun kendisi için dilediği koruma düzeyinin sınırını en yüksek seviyeye çeker. Ruhun yalnızca Allah'a ait olduğunu ve O'nun iradesiyle gece geri döndüğünü ya da dönmediğini kabullenmek, hem ölüm kaygısını teskin eder hem de bedenin istirahate çekildiği anlarda zihnin nereye sığınacağını belirler. İmâm Nevevî, bu duanın Sahîhayn'da — hem Buhârî'de hem Müslim'de — sahîh isnadla yer aldığını ve yatmadan önce okunmasının sünnetten sâbit olduğunu vurgular.`,
        en: `Abū Hurayrah (may Allah be pleased with him) narrated that the Messenger of Allah (peace be upon him) would recite this supplication upon lying down in his bed. The supplication covers both possibilities: if the soul is taken this night, ask for mercy; if it is released, ask for the protection given to the righteous. The first teaches not the fear of death but its acceptance with surrender; the second answers the question "who will protect me through the night?" The phrase "guard me with that which You guard Your righteous servants" sets the highest possible benchmark for the protection the servant seeks for himself. Accepting that the soul belongs to Allah alone — that it returns in the morning only by His will — both quiets the anxiety of death and directs the mind, at the moment the body rests, to its true refuge. Imām al-Nawawī emphasises that this supplication appears with an authentic chain in both of the Ṣaḥīḥayn — Sahih al-Bukhari and Sahih Muslim — and that reciting it before sleep is an established Sunnah.`,
      },
      source: {
        tr: `Buhârî, Deavât, 7 (6320); Müslim, Zikr, 58 (2714)`,
        en: `Sahih al-Bukhari, Supplications (Da'awat), 7 (6320); Sahih Muslim, Dhikr, 58 (2714)`,
      },
      tags: ['uyku', 'gece', 'koruma', 'dua', 'rahmet'],
      categories: ['uyku uyanış', 'koruma', 'dua'],
      timeOfDay: 'night',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['yatmadan önce', 'gece duası', 'uyku koruması'],
    },
    {
      key: 'uyku-eslemtu-nefsî',
      nameArabic:
        'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ وَفَوَّضْتُ أَمْرِي إِلَيْكَ وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ رَغْبَةً وَرَهْبَةً إِلَيْكَ لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلاَّ إِلَيْكَ آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
      name: {
        tr: 'Nefsimi Sana Teslim Ettim (Yatmadan Önce Son Dua)',
        en: 'I Have Surrendered Myself to You (Final Supplication Before Sleep)',
      },
      transliteration: {
        tr: `Allàhümme eslemtü nefsî ileyke, ve fevvaztü emrî ileyke, ve elce'tü zahrî ileyke, rağbeten ve rehbeten ileyke, lâ melce'e velâ mencâ minke illâ ileyke. Âmentü bikitâbikellezî enzelte ve nebiyyikellezî erselte.`,
        en: `Allāhumma aslamtu nafsī ilayk, wa fawwaḍtu amrī ilayk, wa alja'tu ẓahrī ilayk, raghbatan wa rahbatan ilayk. Lā malja'a wa lā manjā minka illā ilayk. Āmantu bikitābikalladhī anzalt wa nabiyyikalladhī arsalt.`,
      },
      meaning: {
        tr: `Allahım! Kendimi sana teslim ettim. İşimi sana ısmarladım. Rızânı isteyerek ve azabından korkarak sırtımı sana dayadım. Senden başka sığınak ve kurtuluş yoktur; her şey yine sana aittir. İndirdiğin kitabına ve gönderdiğin peygamberine îmân ettim.`,
        en: `O Allah, I have surrendered myself to You, entrusted my affairs to You, and leaned my back upon You — desiring Your pleasure and fearing Your punishment. There is no refuge and no escape from You except to You. I have believed in Your Book which You revealed and in Your Prophet whom You sent.`,
      },
      virtue: {
        tr: `Berâ ibni Âzib radıyallahu anh, Resûlullah'ın (sas) bu duayı yatmadan önce okumasını kendisine öğrettiğini ve şöyle buyurduğunu rivâyet etti: "Bu duâ senin o geceki son sözlerin olsun. Eğer o gece ölürsen, îmân üzere ölmüş olursun." İmâm Nevevî şöyle der: Bu hadis-i şerîf bize gösteriyor ki insan her gece, Allah'ın yazacağı son satırı seçebilir. Gece bir küçük ölüm ise ve kişi bu duayı son söz olarak söylerse, teslimiyetini, tevekkülünü ve îmânını tescil ederek günü kapatmış olur. "İndirdiğin kitabına ve gönderdiğin peygamberine îmân ettim" cümlesi, bu duayı sıradan bir koruma zikriden çıkarıp tam bir îmân ikrarına dönüştürür. Bu yüzden Resûlullah (sas) "son sözlerin olsun" buyurmuştur: uyku kapanmadan önceki o an, kişinin kendi eliyle belirleyebildiği en anlamlı andır. Sahîhayn'da — hem Buhârî'de hem Müslim'de — sahîh isnadla yer alır.`,
        en: `Al-Barā' ibn 'Āzib (may Allah be pleased with him) narrated that the Messenger of Allah (peace be upon him) taught him this supplication to recite before sleep and said: "Let these be your last words for that night. For if you die that night, you will die upon faith (īmān)." Imām al-Nawawī comments: this hadith shows us that every night a person can choose the last line that Allah will record for him. If sleep is a minor death and this supplication is the servant's final utterance, then he closes the day having registered his surrender, reliance, and faith before Allah. The phrase "I have believed in Your Book which You revealed and in Your Prophet whom You sent" elevates this from an ordinary protective dhikr to a complete declaration of faith. That is why the Prophet (peace be upon him) said "let these be your last words": that moment before sleep descends is the most meaningful moment a person can consciously shape. This supplication is recorded with an authentic chain in both of the Ṣaḥīḥayn — Sahih al-Bukhari and Sahih Muslim.`,
      },
      source: {
        tr: `Buhârî, Deavât, 7 (6311); Müslim, Zikr, 57 (2710)`,
        en: `Sahih al-Bukhari, Supplications (Da'awat), 7 (6311); Sahih Muslim, Dhikr, 57 (2710)`,
      },
      tags: ['uyku', 'gece', 'dua', 'iman', 'tevekkül', 'son dua'],
      categories: ['uyku uyanış', 'iman', 'tevekkül'],
      timeOfDay: 'night',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['yatmadan önce son dua', 'gece virdi', 'tevekkül duası'],
    },
    {
      key: 'uyku-tesbih-33-34',
      nameArabic: 'سُبْحَانَ اللَّهِ — اَلْحَمْدُ لِلَّهِ — اَللَّهُ أَكْبَرُ',
      name: {
        tr: 'Yatmadan Önce Tesbih (33-33-34)',
        en: 'Tasbīḥ Before Sleep (33-33-34)',
      },
      transliteration: {
        tr: `Sübhânallâh (33 kere) — Elhamdülillâh (33 kere) — Allâhü ekber (34 kere).`,
        en: `Subḥānallāh (33 times) — Al-ḥamdulillāh (33 times) — Allāhu akbar (34 times).`,
      },
      meaning: {
        tr: `Allah her türlü noksanlıktan münezzehtir — Hamd Allah'a mahsustur — Allah en büyüktür.`,
        en: `Glory be to Allah — All praise belongs to Allah — Allah is the Greatest.`,
      },
      virtue: {
        tr: `Hz. Ali radıyallahu anh, Fâtıma radıyallahu anhânın ağır ev işlerini şikâyet ederek Resûlullah'tan (sas) hizmetçi istediğini anlattı. Allah'ın Elçisi şöyle buyurdu: "Sizi istediğinizden daha hayırlı bir şeye sevk edeyim mi? Yatağınıza girdiğinizde otuz üç defa 'sübhânallâh', otuz üç defa 'elhamdülillâh', otuz dört defa 'Allâhü ekber' deyin. Bu, sizin için hizmetçiden daha hayırlıdır." Hz. Ali radıyallahu anh, Sıffîn savaşının yapıldığı gece dahil bu zikri hiç ihmal etmediğini söylemiştir. Yüz parçadan oluşan bu zikir, yorulmuş bedenin istirahate çekilmesinden önce zihnin son enerjisini Allah'a yönlendirir. Resûlullah'ın (sas) maddi bir çözüm arayan ikiye manevi bir güç önermesi — "hizmetçiden daha hayırlı" — dünyevi nimetlerin yetersiz kaldığı her ana uygulanabilecek derin bir prensibi ortaya koyar. Tesbih, tahmid ve tekbirin bu sırayla ve bu sayıda okunması Resûlullah'ın (sas) sünneti ile sâbittir ve Sahîhayn'da yer almaktadır.`,
        en: `'Alī (may Allah be pleased with him) narrated that Fāṭimah (may Allah be pleased with her) complained of the hardship of household work and asked the Messenger of Allah (peace be upon him) for a servant. He replied: "Shall I not direct you to something better than what you have asked for? When you go to bed, say 'Subḥānallāh' thirty-three times, 'Al-ḥamdulillāh' thirty-three times, and 'Allāhu akbar' thirty-four times. That is better for you than a servant." 'Alī (may Allah be pleased with him) said he never abandoned this dhikr — even on the night of the Battle of Ṣiffīn. This hundred-fold dhikr directs the mind's last energy toward Allah before the weary body rests. The Prophet's offering of a spiritual power to two seeking a material solution — declaring it "better than a servant" — reveals a deep principle applicable to every moment when worldly means fall short. The sequence and count of tasbīḥ, taḥmīd, and takbīr is established by the Sunnah of the Prophet (peace be upon him) and is recorded in both of the Ṣaḥīḥayn.`,
      },
      source: {
        tr: `Buhârî, Deavât, 11 (6318); Müslim, Zikr, 80 (2727)`,
        en: `Sahih al-Bukhari, Supplications (Da'awat), 11 (6318); Sahih Muslim, Dhikr, 80 (2727)`,
      },
      tags: ['uyku', 'gece', 'tesbih', 'tahmid', 'tekbir', 'zikir'],
      categories: ['uyku uyanış', 'zikir', 'tesbih'],
      timeOfDay: 'night',
      recommendedCount: 100,
      specialDays: [],
      suitableFor: ['yatmadan önce', 'gece zikri', 'günlük virdi', 'yorgun günlerde'],
    },
    {
      key: 'uyku-kafir-suresi',
      nameArabic:
        'قُلْ يَا أَيُّهَا الْكَافِرُونَ — لاَ أَعْبُدُ مَا تَعْبُدُونَ...',
      name: {
        tr: "Kâfirûn Sûresi (Yatmadan Önce)",
        en: "Sūrat al-Kāfirūn (Before Sleep)",
      },
      transliteration: {
        tr: `Kul yâ eyyühel kâfirûn, lâ a'büdü mâ ta'büdûn, velâ entüm âbidûne mâ a'büd, velâ ene âbidün mâ abedtüm, velâ entüm âbidûne mâ a'büd, leküm dînüküm veliye dîn.`,
        en: `Qul yā ayyuhal-kāfirūn, lā a'budu mā ta'budūn, wa lā antum 'ābidūna mā a'bud, wa lā ana 'ābidum mā 'abadtum, wa lā antum 'ābidūna mā a'bud, lakum dīnukum wa liya dīn.`,
      },
      meaning: {
        tr: `De ki: Ey kâfirler! Ben sizin taptığınıza tapmam. Siz de benim taptığıma tapmazsınız. Ben hiçbir zaman sizin taptığınıza tapacak değilim. Siz de benim taptığıma tapacak değilsiniz. Sizin dininiz size, benim dinim bana.`,
        en: `Say: O disbelievers! I do not worship what you worship. Nor are you worshippers of what I worship. Nor will I be a worshipper of what you worship. Nor will you be worshippers of what I worship. For you is your religion, and for me is my religion.`,
      },
      virtue: {
        tr: `Nevfel el-Eşcaî radıyallahu anhdan rivâyet edildiğine göre, Resûlullah (sas) ona şöyle buyurdu: "Kul yâ eyyühel kâfirûn sûresini oku, bitirince de uyu. Çünkü bu sûre şirkten kurtuluş belgesidir." Başka bir rivâyette: "Allah'a şirk koşmaktan sizi koruyacak bir şeyi haber vereyim mi? Uyuyacağınız zaman Kâfirûn sûresini okuyunuz." Bu sûre, kısa olmasına rağmen her tekrarında yenilediği reddiyesiyle birlikte, zihnin şirkten arındığının bir bildirisidir. "Şirkten kurtuluş belgesi" ifadesi son derece güçlüdür: sûreyi okumak yalnızca bir ibadet değil, bir beraatname almaktır. Yatmadan önce okunması — bilinçaltı kapanmadan önce bu net sınırı çizmek — ruhun gece boyunca en temiz îmân üzere dinlenmesini sağlar. Ebû Dâvûd ve Tirmizî'nin tahricinde hadis hasen derecesinde kabul edilmektedir.`,
        en: `Nawfal al-Ashja'ī (may Allah be pleased with him) narrated that the Messenger of Allah (peace be upon him) said to him: "Recite Sūrat al-Kāfirūn, then sleep when you finish it, for it is a declaration of freedom from shirk (associating partners with Allah)." In another narration: "Shall I not tell you of something that will protect you from shirk? Recite Sūrat al-Kāfirūn when you go to sleep." Despite its brevity, this sūrah — with its repeated and emphatic renunciation — is a proclamation that the mind has been cleansed of shirk. The expression "declaration of freedom from shirk" (barā'ah min al-shirk) is remarkably powerful: reciting the sūrah is not merely an act of worship but the receipt of a certificate of acquittal. Reciting it before sleep — drawing this clear boundary before the subconscious closes — ensures that the soul rests through the night upon the purest faith. The hadith is considered ḥasan in the takhrīj of both Abū Dāwūd and al-Tirmidhī.`,
      },
      source: {
        tr: `Ebû Dâvûd, Edeb, 98 (5055); Tirmizî, Deavât, 22 (3403)`,
        en: `Abu Dawood, Adab, 98 (5055); At-Tirmidhi, Supplications (Da'awat), 22 (3403)`,
      },
      tags: ['uyku', 'gece', 'sûre', 'tevhid', 'şirk', 'kur\'an'],
      categories: ['uyku uyanış', 'kur\'an', 'tevhid'],
      timeOfDay: 'night',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: ['yatmadan önce', 'gece sûresi', 'şirkten korunma', 'gece virdi'],
    },
    {
      key: 'uyku-istigfar-kayyum',
      nameArabic:
        'أَسْتَغْفِرُ اللَّهَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
      name: {
        tr: 'Yatmadan Önce İstiğfar (× 3)',
        en: 'Istighfār Before Sleep (× 3)',
      },
      transliteration: {
        tr: `Estağfirullàhellezî lâilâhe illâ hüvel hayyül kayyûmü ve etûbü ileyh.`,
        en: `Astaghfirullāhilladhī lā ilāha illā huwal-ḥayyul-qayyūmu wa atūbu ilayh.`,
      },
      meaning: {
        tr: `Kendisinden başka ilâh bulunmayan, her zaman diri ve her şeyin varlığı kendisine bağlı olan Allah'tan beni bağışlamasını ister ve O'na tevbe ederim.`,
        en: `I seek forgiveness from Allah, besides whom there is no deity worthy of worship, the Ever-Living, the Sustainer of existence, and I turn to Him in repentance.`,
      },
      virtue: {
        tr: `Rivâyete göre Resûlullah (sas) şöyle buyurdu: "Bir kimse yatağına girdiği zaman bu istiğfarı üç defa okursa, günahları deniz köpüğü kadar, yıldızların sayısı kadar, Âlic çölünün kumları kadar, dünya günlerinin sayısı kadar çok olsa bile Allah Teâlâ onun günahlarını affeder." Bu istiğfar cümlesinin kuvveti iki kaynaktan gelir: birincisi, günün son anlarında günah ikrarını üstlenmek — bu, savunmasız bir dürüstlük ve alçakgönüllülük anıdır; ikincisi, Allah'ı el-Hayyü'l-Kayyûm isimleriyle çağırmak — hiç uyumayan, hiç yorulmayan, her şeyi bilen ve her şeye kâdir olan O'na sığınmaktır. Kişi uyku öncesinde en savunmasız anındayken bu güçlü isimlere sarılır. İstiğfarın üç kere tekrarlanması, lafzın gönülde yerleşmesi ve niyetin pekişmesi için tavsiye edilmiştir. İbnü's-Sünnî, bu duayı gece zikri bölümünde tahric etmiştir.`,
        en: `It is narrated that the Messenger of Allah (peace be upon him) said: "Whoever recites this istighfār three times upon entering his bed, Allah will forgive his sins even if they are as numerous as the foam of the sea, as numerous as the stars, as numerous as the grains of sand in the desert of 'Ālij, and as numerous as the days of this world." The power of this sentence of istighfār comes from two sources: first, undertaking the acknowledgement of sin at the very last moments of the day — a moment of vulnerable honesty and humility; second, calling upon Allah by the names al-Ḥayyul-Qayyūm — the Ever-Living who never sleeps, never tires, knows all things, and has power over all things. The servant clings to these powerful names at his most vulnerable moment before sleep. The threefold repetition is recommended so that the words settle in the heart and the intention is firmly established. Ibn al-Sunnī recorded this supplication in the chapter on night-time remembrance.`,
      },
      source: {
        tr: `Tirmizî, Deavât, 38 (3397); İbnü's-Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 723`,
        en: `At-Tirmidhi, Supplications (Da'awat), 38 (3397); Ibn al-Sunnī, 'Amal al-Yawm wa'l-Laylah, no. 723`,
      },
      tags: ['uyku', 'gece', 'istiğfar', 'tevbe', 'af', 'günah'],
      categories: ['uyku uyanış', 'istiğfar', 'tevbe'],
      timeOfDay: 'night',
      recommendedCount: 3,
      specialDays: [],
      suitableFor: ['yatmadan önce', 'gece istiğfarı', 'günahlara kefaret', 'gece virdi'],
    },
  ],
  specialDays: [],
};
