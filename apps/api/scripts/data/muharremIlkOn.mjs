import { keyMap } from './keyMap.mjs'

export const muharremIlkOn = {
  key: 'muharrem-ilk-on-2026',
  label: {
    tr: 'Muharrem İlk 10 Gün 2026',
    en: 'First 10 Days of Muharram 2026',
  },
  category: 'ibadet',
  description: {
    tr: "Muharrem'in ilk on gününe ait oruç, aşure ve zikirler.",
    en: "Fasting, Ashura, and dhikrs pertaining to the first ten days of Muharram.",
  },
  dhikrItems: [
    {
      key: keyMap.ASURE_DUASI,
      nameArabic:
        'اَلْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ وَالصَّلَاةُ وَالسَّلَامُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ اللَّهُمَّ أَنْتَ الْأَبَدِيُّ الْقَدِيمُ الْحَيُّ الْكَرِيمُ الْحَنَّانُ الْمَنَّانُ وَهَذِهِ سَنَةٌ جَدِيدَةٌ أَسْأَلُكَ فِيهَا الْعِصْمَةَ مِنَ الشَّيْطَانِ الرَّجِيمِ وَالْعَوْنَ عَلَى هَذِهِ النَّفْسِ الْأَمَّارَةِ بِالسُّوءِ وَالِاشْتِغَالَ بِمَا يُقَرِّبُنِي إِلَيْكَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَأَهْلِ بَيْتِهِ أَجْمَعِينَ',
      name: {
        tr: 'Aşure Günü Duası',
        en: "Supplication for the Day of Ashura",
      },
      transliteration: {
        tr: "Elhamdü lillâhi rabbil âlemîn. Vessalâtü vesselâmü alâ seyyidinâ Muhammedin ve alâ âlihî ve sahbihî ecmaîn. Allâhümme entel ebediyyül kadîmül hayyül kerîmül hannânül mennân. Ve hâzihî senetün cedîdetün es'elüke fîhel ismete mineşşeytânirracîm vel avne alâ hâzihin nefsil emmârati bis-sûi vel iştiğâli bimâ yukarribünî ileyke. Yâ zel-celâli vel-ikrâm. Bi-rahmetike yâ erhamer-râhimîn. Ve sallâllâhü alâ seyyidinâ Muhammedin ve alâ âlihî ve sahbihî ve ehl-i beytihî ecmaîn.",
        en: "Alhamdu lillahi Rabbil 'alamin. Was-salatu was-salamu 'ala sayyidina Muhammadin wa 'ala alihi wa sahbihi ajma'in. Allahumma antal-abadiyyul-qadimul-hayyul-karimul-hannanul-mannan. Wa hadhihi sanatun jadidatun as'aluka fiha-l-'ismata minash-shaytanir-rajim wal-'awna 'ala hadhihin-nafsil-ammarati bis-su'i wal-ishtighala bima yuqarribuni ilayka. Ya dhal-jalali wal-ikram. Bi-rahmatika ya arhamar-rahimin. Wa sallallahu 'ala sayyidina Muhammadin wa 'ala alihi wa sahbihi wa ahli baytihi ajma'in.",
      },
      meaning: {
        tr: "Hamd, âlemlerin Rabbi Allah'a mahsustur. Salat ve selam Efendimiz Muhammed'e, ailesine ve tüm ashabına olsun. Allah'ım! Sen Ebedî, Kadîm, Hayy, Kerîm, Hannân ve Mennânsın. Bu yeni senede beni kovulmuş şeytandan korumanı, kötülüğü çok isteyen nefsime karşı yardım etmeni ve beni Sana yaklaştıran amellerle meşgul kılmanı niyaz ediyorum. Ey Celâl ve İkrâm Sahibi! Rahmetinle muamele eyle, ey merhametlilerin en merhametlisi!",
        en: "All praise belongs to Allah, Lord of the worlds. Peace and blessings be upon our master Muhammad, his family, and all his companions. O Allah! You are the Eternal, the Ever-Existing, the Living, the Generous, the Compassionate, the Bestower of favor. This is a new year in which I ask You for protection from the accursed Satan, for aid against this soul that commands evil, and to be occupied with what draws me nearer to You. O Possessor of Majesty and Honor! Deal with me through Your mercy, O Most Merciful of the merciful!",
      },
      virtue: {
        tr: "Aşure gününde yeni hicri yılın başında okunan hususi duadır. Yıl boyunca şeytanın vesveselerinden korunmayı, nefis-i emmâreye karşı ilahi yardımı ve salih amellerle meşgul olmayı talep eder.",
        en: 'This is a special supplication recited on the Day of Ashura at the start of the new Hijri year. It seeks protection from the whispers of Satan throughout the year, divine aid against the soul that commands evil, and the ability to remain occupied with righteous deeds.',
      },
      source: {
        tr: "Şihâbüddîn es-Sühreverdî; Allâme Safûrî, Nüzhetü'l-mecâlis",
        en: "Shihab al-Din al-Suhrawardi; Allamah al-Safuri, Nuzhat al-Majalis",
      },
      tags: ['aşure', 'muharrem', 'yılbaşı', 'nefis', 'şeytan', 'dua', 'muharram', 'özel gün'],
      categories: ['dua', 'ibadet', 'özel gün', 'aşure', 'muharrem'],
      timeOfDay: ['sabah', 'ogle'],
      recommendedCount: 1,
      suitableFor: ['aşure günü', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.AYETEL_KURSI,
      nameArabic:
        'اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
      name: {
        tr: 'Âyetel Kürsî',
        en: 'Ayat al-Kursi',
      },
      transliteration: {
        tr: "Allâhu lâ ilâhe illâ hüvel hayyül kayyûm. Lâ te'huzuhû sinetün ve lâ nevm. Lehû mâ fis-semâvâti ve mâ fil-ard. Men zellezî yeşfeu indehû illâ bi-iznih. Ya'lemu mâ beyne eydîhim ve mâ halfehüm. Ve lâ yuhîtûne bi şey'in min ilmihî illâ bimâ şâ'. Vesia kürsiyyühüs-semâvâti vel-ard. Ve lâ yeûdühû hifzuhümâ. Ve hüvel aliyyül azîm.",
        en: "Allahu la ilaha illa huwal-hayyul-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum. Wa la yuhituna bi shay'in min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard. Wa la ya'uduhu hifzuhuma. Wa huwal-'aliyyul-'azim.",
      },
      meaning: {
        tr: "Allah, kendisinden başka ilah olmayandır; diridir, kayyumdur. O'nu ne uyuklama ne uyku tutar. Göklerde ve yerde ne varsa O'nundur. İzni olmadan katında kim şefaat edebilir? Kulların önlerindekini ve arkalarındakini bilir. O'nun dilediği kadarının dışında ilminden hiçbir şeyi kuşatamazlar. Kürsüsü gökleri ve yeri kaplamıştır; onları koruyup gözetmek O'na ağır gelmez. O yücedir, büyüktür.",
        en: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
      },
      virtue: {
        tr: 'Yıl boyunca maddi ve manevi belalardan korunma niyetiyle ilahi himayeye sığınma bilincini güçlendirir. Şeytan, cin, nazar ve manevi baskılara karşı en güçlü korunma ayetlerinden biri kabul edilir.',
        en: 'Reciting it strengthens the awareness of seeking refuge in divine protection from material and spiritual harm throughout the year. It is regarded as one of the strongest protective verses against Satan, jinn, the evil eye, and spiritual oppression.',
      },
      source: {
        tr: 'Bakara 255',
        en: 'Surah Al-Baqarah 255',
      },
      tags: ['muharrem', 'hicri yılbaşı', 'korunma', 'güven', 'ayetel kürsi', 'kandil', 'ramazan', 'ramadan', 'özel gün', 'kadir gecesi', 'laylat al-qadr', 'hijri new year'],
      categories: ['özel gün', 'muharrem', 'kuran', 'ramazan', 'oruç', 'kandil', 'kadir gecesi', 'arefe'],
      timeOfDay: 'any',
      recommendedCount: 360,
      suitableFor: ['korunma', 'güven', 'hicri yılbaşı', 'muharrem ilk 10', 'nazar ve vesvese', 'ev koruması', 'ramazan', 'ramadan', 'kadir gecesi', 'laylat al-qadr', 'hijri new year'],
    },
    {
      key: keyMap.BAKIYAT_SALIHAT,
      nameArabic: 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَاللّٰهُ أَكْبَرُ',
      name: {
        tr: 'Bakıyat-ı Salihat Zikri',
        en: 'Dhikr of the Enduring Righteous Deeds',
      },
      transliteration: {
        tr: 'Sübhanellahi velhamdü lillahi vallahü ekber.',
        en: "Subhanallahi wal-hamdu lillahi wallahu akbar.",
      },
      meaning: {
        tr: 'Allahı tenzih ederim, hamd Allahadır, Allah en büyüktür.',
        en: 'Glory be to Allah, praise be to Allah, and Allah is the Greatest.',
      },
      virtue: {
        tr: 'Şükür, tesbih ve tekbir bilincini birlikte pekiştirir; varoluşsal şükranı canlı tutar.',
        en: 'It reinforces gratitude, glorification, and exaltation of Allah together, keeping a deep sense of existential thankfulness alive.',
      },
      source: {
        tr: 'Bakiyat-ı Salihat rivayetleri',
        en: 'Narrations on the Enduring Righteous Deeds (Baqiyat as-Salihat)',
      },
      tags: ['muharrem', 'tesbih', 'hamd', 'tekbir', 'muharram', 'özel gün'],
      categories: ['özel gün', 'muharrem', 'tesbih'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['şükür', 'muharrem ilk 10', 'manevi denge', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.YA_SELAM,
      nameArabic: 'يَا سَلَامُ',
      name: {
        tr: 'Ya Selam (c.c.)',
        en: 'Ya Salam',
      },
      transliteration: {
        tr: 'Yâ Selâm.',
        en: 'Ya Salam.',
      },
      meaning: {
        tr: 'Esenlik ve selametin kaynağı olan Allah.',
        en: 'O Allah, the Source of peace and well-being.',
      },
      virtue: {
        tr: 'Bedensel ve ruhsal esenlik niyetini güçlendirir; barış ve sükun talebini diri tutar.',
        en: 'Reciting it strengthens the intention for bodily and spiritual well-being, keeping the request for peace and tranquility alive.',
      },
      source: {
        tr: 'Esma-i Hüsna',
        en: 'Al-Asma al-Husna (the Beautiful Names of Allah)',
      },
      tags: ['muharrem', 'esma', 'selamet', 'barış', 'muharram', 'özel gün'],
      categories: ['özel gün', 'muharrem', 'esma'],
      timeOfDay: 'any',
      recommendedCount: 313,
      suitableFor: ['huzur', 'muharrem ilk 10', 'barış niyeti', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.YA_RAHMAN_YA_RAHIM,
      nameArabic: 'يَا رَحْمٰنُ يَا رَحِيمُ',
      name: {
        tr: 'Ya Rahman Ya Rahim',
        en: 'Ya Rahman Ya Rahim',
      },
      transliteration: {
        tr: 'Yâ Rahmân, Yâ Rahîm.',
        en: 'Ya Rahman, Ya Rahim.',
      },
      meaning: {
        tr: 'Rahman ve Rahim olan Allahın merhametine sığınma zikri.',
        en: 'A dhikr seeking refuge in the mercy of Allah, the Most Gracious, the Most Merciful.',
      },
      virtue: {
        tr: 'Merhamet, şefkat ve empati bilincini artırır; kalbi yumuşatır.',
        en: 'It increases the awareness of mercy, compassion, and empathy, softening the heart.',
      },
      source: {
        tr: 'Esma-i Hüsna',
        en: 'Al-Asma al-Husna (the Beautiful Names of Allah)',
      },
      tags: ['muharrem', 'esma', 'rahmet', 'merhamet', 'muharram', 'özel gün'],
      categories: ['özel gün', 'muharrem', 'esma'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['merhamet', 'muharrem ilk 10', 'kalp yumuşaması', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.TEVHID,
      nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ',
      name: {
        tr: 'Kelime-i Tevhid ve Risalet',
        en: 'The Word of Tawhid and Risalah',
      },
      transliteration: {
        tr: 'Lâ ilâhe illallâh Muhammedür Rasûlullâh.',
        en: "La ilaha illallah, Muhammadur Rasulullah.",
      },
      meaning: {
        tr: 'Allahtan başka ilah yoktur; Muhammed Allahın Resulüdür.',
        en: 'There is no deity but Allah; Muhammad is the Messenger of Allah.',
      },
      virtue: {
        tr: 'Kimlik ve aidiyet bilincini tazeler; Nebevi rehberliğe bağlılığı güçlendirir.',
        en: "Reciting it renews the believer's sense of identity and belonging, strengthening devotion to prophetic guidance.",
      },
      source: {
        tr: 'Kelime-i tevhid geleneği',
        en: 'The tradition of the Word of Tawhid',
      },
      tags: ['muharrem', 'tevhid', 'risalet', 'aidiyet', 'bayram', 'kandil', 'ramazan', 'ramadan', 'özel gün', 'muharram', 'eid al-fitr', 'eid al-adha', 'mawlid al-nabi', 'zilkade ayı girişi', 'rebiülevvel ayı başlangıcı', 'beginning of rabi al-awwal', 'beginning of jumada al-ula', 'cemaziyelevvel ayı başlangıcı', "beginning of the month of dhu al-qi'dah"],
      categories: ['özel gün', 'tevhid', 'ramazan', 'oruç', 'bayram', 'zilkade', 'muharrem', 'kandil', 'mevlid'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['iman tazeleme', 'aidiyet', 'kandil gecesi', 'tefekkür', 'özel gün', 'ramazan', 'ramadan', 'muharrem', 'muharram', 'eid al-fitr', 'eid al-adha', 'kurban bayramı', 'mevlid kandili', 'mawlid al-nabi', 'zilkade ayı girişi', 'rebiülevvel ayı başlangıcı', 'beginning of rabi al-awwal', 'beginning of jumada al-ula', 'cemaziyelevvel ayı başlangıcı', "beginning of the month of dhu al-qi'dah"],
    },
    {
      key: keyMap.SELAMUN_KAVLEN,
      nameArabic: 'سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ',
      name: {
        tr: 'Selamün Kavlen Mirrabbirrahim',
        en: "Salamun Qawlan Min Rabbir-Rahim",
      },
      transliteration: {
        tr: 'Selâmün kavlen mir rabbir rahîm.',
        en: 'Salamun qawlan mir Rabbir Rahim.',
      },
      meaning: {
        tr: 'Merhametli Rabden sözlü bir selam vardır.',
        en: 'Peace, a word from a Merciful Lord.',
      },
      virtue: {
        tr: 'Selamet, umut ve güven duygusunu besler; kalbe rahmet iklimi kazandırır.',
        en: 'It nurtures a sense of peace, hope, and security, bringing a climate of mercy to the heart.',
      },
      source: {
        tr: 'Yasin 58',
        en: 'Surah Ya-Sin 58',
      },
      tags: ['muharrem', 'kuran', 'selamet', 'umut', 'muharram', 'özel gün'],
      categories: ['özel gün', 'muharrem', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: ['umut', 'muharrem ilk 10', 'manevi teselli', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.SEHADET,
      nameArabic:
        'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللّٰهِ',
      name: {
        tr: 'Kelime-i Şehadet',
        en: 'The Word of Shahadah',
      },
      transliteration: {
        tr: 'Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
        en: "Ash-hadu an la ilaha illallah wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
      },
      meaning: {
        tr: 'Şahitlik ederim ki Allahtan başka ilah yoktur ve Muhammed onun kulu ve resulüdür.',
        en: 'I bear witness that there is no deity but Allah, and I bear witness that Muhammad is His servant and Messenger.',
      },
      virtue: {
        tr: 'İman ikrarını yeniler; Aşure gününde tevhid ve teslimiyet şuurunu pekiştirir.',
        en: "Reciting it renews the declaration of faith, reinforcing the awareness of Tawhid and submission on the Day of Ashura.",
      },
      source: {
        tr: 'Kelime-i şehadet geleneği',
        en: 'The tradition of the Word of Shahadah',
      },
      tags: ['muharrem', 'aşure', 'iman', 'şehadet', 'muharram', 'özel gün'],
      categories: ['özel gün', 'muharrem', 'tevhid'],
      timeOfDay: 'any',
      recommendedCount: 33,
      suitableFor: ['aşure günü', 'iman tazeleme', 'muharrem ilk 10', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.HASBIYALLAH_VEKIL,
      nameArabic:
        'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ',
      name: {
        tr: 'Hasbiyallah Vekil Zikri',
        en: 'Hasbiyallahu wa Ni\'mal Wakil Dhikr',
      },
      transliteration: {
        tr: "Hasbiyallahü ve ni'mel vekîl. Ni'mel mevlâ ve ni'men-nasîr.",
        en: "Hasbiyallahu wa ni'mal wakil. Ni'mal mawla wa ni'man-nasir.",
      },
      meaning: {
        tr: 'Allah bana yeter, O ne güzel vekildir. O ne güzel mevladır ve ne güzel yardımcıdır.',
        en: 'Allah is sufficient for me, and He is the best Disposer of affairs. He is the best Protector and the best Helper.',
      },
      virtue: {
        tr: "Aşure günü tevekkül, ilahi koruma ve yardım bilincini güçlendirmek için 70 kez okunur. Allah'a tam teslimiyetin ve O'nun yeterliliğinin ikrarıdır.",
        en: "It is recited 70 times on the Day of Ashura to strengthen the sense of reliance on Allah, divine protection, and aid. It is a declaration of complete submission to Allah and an affirmation of His sufficiency.",
      },
      source: {
        tr: "Yusuf Tavaslı; Mustafa Ertuğrul, Dua Hazinesi; Kenzü'n-necâh",
        en: "Yusuf Tavasli; Mustafa Ertugrul, Dua Hazinesi; Kanz al-Najah",
      },
      tags: ['aşure', 'muharrem', 'tevekkül', 'korunma', 'yardım', 'muharram', 'özel gün'],
      categories: ['dua', 'zikir', 'özel gün', 'aşure', 'muharrem'],
      timeOfDay: 'any',
      recommendedCount: 70,
      suitableFor: ['aşure günü', 'tevekkül', 'ilahi yardım talebi', 'korunma', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.SUBHANALLAHI_MIZAN,
      nameArabic:
        'سُبْحَانَ اللَّهِ مِلْءَ الْمِيزَانِ وَمُنْتَهَى الْعِلْمِ وَمَبْلَغَ الرِّضَا وَزِنَةَ الْعَرْشِ',
      name: {
        tr: "Sübhanallahi Mil'el Mizan Zikri",
        en: "Subhanallahi Mil'al-Mizan Dhikr",
      },
      transliteration: {
        tr: "Sübhanallahi mil'el mîzân ve müntehe'l-ilmi ve meble'ğar-rızâ ve zinete'l-arş.",
        en: "Subhanallahi mil'al-mizani wa muntahal-'ilmi wa mablaghar-rida wa zinatal-'arsh.",
      },
      meaning: {
        tr: "Allah'ı, mizanı dolduracak kadar, ilmin son sınırına kadar, rızanın ulaştığı yere kadar ve arşın ağırlığınca tenzih ederim.",
        en: 'Glory be to Allah, to the extent that fills the scale, to the utmost limit of knowledge, to the extent of His good pleasure, and to the weight of the Throne.',
      },
      virtue: {
        tr: "Aşure günü okunması tavsiye edilen bu zikir, sonsuz bir tesbih ikrarıdır; Allah'ın büyüklüğünü insan aklının ötesindeki ölçülerle ifade eder. 10 kez okunur.",
        en: "This dhikr, recommended on the Day of Ashura, is a declaration of boundless glorification, expressing the greatness of Allah in terms beyond human comprehension. It is recited 10 times.",
      },
      source: {
        tr: "Şeyh Ebu'l-Bekā el-Ömerî; Muhammed Ebu'l-Yüsr Âbidîn, el-Evrâdü'd-dâime",
        en: "Shaykh Abu'l-Baqa al-'Umari; Muhammad Abu'l-Yusr 'Abidin, Al-Awrad ad-Da'imah",
      },
      tags: ['aşure', 'muharrem', 'tesbih', 'arş', 'mizan', 'muharram', 'özel gün'],
      categories: ['zikir', 'tesbih', 'özel gün', 'aşure', 'muharrem'],
      timeOfDay: 'any',
      recommendedCount: 10,
      suitableFor: ['aşure günü', 'tesbih', 'tefekkür', 'muharrem ilk 10', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.ASURE_ENBIYA_DUASI,
      nameArabic:
        'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ اللَّهُمَّ يَا مُفَرِّجَ كُلِّ كَرْبٍ وَيَا قَابِلَ تَوْبَةِ آدَمَ يَوْمَ عَاشُورَاءَ وَيَا رَافِعَ إِدْرِيسَ وَيَا مُسْكِنَ سَفِينَةِ نُوحٍ وَيَا غِيَاثَ إِبْرَاهِيمَ وَيَا مُفَرِّجَ كَرْبِ أَيُّوبَ وَيَا جَابِرَ كَسْرِ يُوسُفَ وَيَا مُحْيِيَ يُونُسَ مِنَ الْحُوتِ يَوْمَ عَاشُورَاءَ فَرِّجْ عَنَّا كَمَا فَرَّجْتَ عَنْ أَنْبِيَائِكَ وَأَوْلِيَائِكَ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
      name: {
        tr: 'Aşure Günü Enbiya Duası',
        en: 'Supplication of the Prophets for the Day of Ashura',
      },
      transliteration: {
        tr: "Bismillâhirrahmânirrahîm. Allâhümme yâ müferrica külli kerbin ve yâ kâbile tevbeti Âdeme yevme âşûrâ. Ve yâ râfia İdrîse ve yâ müskine sefîneti Nûhiin ve yâ ğıyâse İbrâhîme ve yâ müferrice kerbi Eyyûbe ve yâ câbire kesri Yûsüfe ve yâ mühyiye Yûnüse mine'l-hûti yevme âşûrâ'. Ferric annâ kemâ ferrâcte an enbiyâike ve evliyâike birahmetike yâ erhamerrâhimîn.",
        en: "Bismillahir-Rahmanir-Rahim. Allahumma ya mufarrija kulli karbin wa ya qabila tawbati Adama yawma 'ashura. Wa ya rafi'a Idrisa wa ya muskina safinati Nuhin wa ya ghiyatha Ibrahima wa ya mufarrija karbi Ayyuba wa ya jabira kasri Yusufa wa ya muhyiya Yunusa minal-huti yawma 'ashura. Farrij 'anna kama farrajta 'an anbiya'ika wa awliya'ika bi-rahmatika ya arhamar-rahimin.",
      },
      meaning: {
        tr: "Allah'ım! Her sıkıntıyı gideren, Aşure günü Âdem'in tevbesini kabul eden, İdris'i yücelten, Nuh'un gemisini dindiren, İbrahim'in imdadına yetişen, Eyyüb'ün sıkıntısını gideren, Yusuf'un kırıklığını saran ve Yunus'u Aşure günü balıktan kurtaran Sensin. Rahmetinle peygamberlerine ve velilerine yaptığın gibi bizden de sıkıntıyı gider, ey merhametlilerin en merhametlisi!",
        en: "O Allah! You are the Reliever of every distress, the Accepter of Adam's repentance on the Day of Ashura, the Exalter of Idris, the Calmer of Noah's ark, the Aid of Abraham, the Reliever of Job's distress, the Mender of Joseph's affliction, and the One who saved Jonah from the whale on the Day of Ashura. Relieve our distress by Your mercy just as You relieved it for Your prophets and saints, O Most Merciful of the merciful!",
      },
      virtue: {
        tr: "Aşure gününe özel bu dua, yedi peygamberin Aşure günündeki mucizelerini ve kurtuluşlarını anarak ilahi yardım talep eder. Her peygamberin adından güç ve şefaat dilenir.",
        en: "This supplication, specific to the Day of Ashura, seeks divine aid by recalling the miracles and deliverances of seven prophets on that day. Strength and intercession are sought through the mention of each prophet's name.",
      },
      source: {
        tr: 'Geleneksel Aşure duaları derlemesi',
        en: 'Traditional compilation of Ashura supplications',
      },
      tags: ['aşure', 'muharrem', 'enbiya', 'kurtuluş', 'şefaat', 'dua', 'muharram', 'özel gün'],
      categories: ['dua', 'ibadet', 'özel gün', 'aşure', 'muharrem'],
      timeOfDay: ['sabah', 'ogle'],
      recommendedCount: 1,
      suitableFor: ['aşure günü', 'sıkıntı giderme', 'kurtuluş niyeti', 'enbiya vesilesi', 'muharrem', 'muharram'],
    },
    {
      key: keyMap.FATIHA_SURESI,
      nameArabic:
        'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الْضَّالِّينَ',
      name: {
        tr: 'Fatiha Suresi',
        en: 'Surah Al-Fatiha',
      },
      transliteration: {
        tr: "Bismillâhirrahmânirrahîm. Elhamdü lillâhi rabbil âlemîn. Errahmânirrahîm. Mâliki yevmiddîn. İyyâke na'büdü ve iyyâke nesta'în. İhdinessırâtel müstakîm. Sırâtallezîne en'amte aleyhim. Ğayril mağdûbi aleyhim ve leddâllîn.",
        en: "Bismillahir-Rahmanir-Rahim. Alhamdu lillahi Rabbil-'alamin. Ar-Rahmanir-Rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an'amta 'alayhim. Ghayril-maghdubi 'alayhim wa lad-dallin.",
      },
      meaning: {
        tr: "Rahman ve Rahim Allah'ın adıyla. Hamd, âlemlerin Rabbi Allah'a mahsustur. Rahman'dır, Rahim'dir. Din gününün sahibidir. Yalnız Sana ibadet eder, yalnız Senden yardım dileriz. Bizi doğru yola ilet. Nimet verdiklerinin yoluna; gazaba uğrayanların ve sapıkların yoluna değil.",
        en: 'In the name of Allah, the Most Gracious, the Most Merciful. All praise belongs to Allah, Lord of the worlds, the Most Gracious, the Most Merciful, Master of the Day of Judgment. You alone we worship, and You alone we ask for help. Guide us to the straight path, the path of those You have blessed, not of those who have earned Your anger nor of those who have gone astray.',
      },
      virtue: {
        tr: "Aşure günü gül suyu ritüelinde 7 kez okunur; yıl boyunca berekete vesile olur. Fatiha, Kur'an'ın özü ve açılışıdır; her duanın başı ve sonudur. Sahih kaynaklarda Aşure günü bu sure üzerine özel amel rivayetleri mevcuttur.",
        en: "It is recited 7 times during the rosewater ritual on the Day of Ashura, becoming a means of blessing throughout the year. Al-Fatiha is the essence and opening of the Quran, the beginning and end of every supplication. Reliable sources record special practices concerning this surah on the Day of Ashura.",
      },
      source: {
        tr: "Fatiha Suresi (Kur'an 1:1-7); Muhammed Ebu'l-Yüsr Âbidîn, el-Evrâdü'd-dâime, sh. 93",
        en: "Surah Al-Fatiha (Quran 1:1-7); Muhammad Abu'l-Yusr 'Abidin, Al-Awrad ad-Da'imah, p. 93",
      },
      tags: ['aşure', 'muharrem', 'fatiha', 'kuran', 'dua', 'bereket'],
      categories: ['kuran', 'dua', 'özel gün'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'aşure günü',
        'bereket niyeti',
        'gül suyu ritüeli',
        'dua başlangıcı',
        'herkes',
      ],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Hicri Yılbaşı',
        en: 'Hijri New Year',
      },
      type: 'özel gün',
      date: '2026-06-16',
      hijriDate: '1 Muharrem 1448',
      description: {
        tr: 'Yeni hicri yıla tevbe, tevhid ve korunma niyetiyle giriş.',
        en: 'Entering the new Hijri year with the intention of repentance, tawhid, and protection.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 1,
      dayCount: 10,
      priority: 170,
      dhikrKeys: [keyMap.ESTAGFIRULLAH, keyMap.IHLAS, keyMap.AYETEL_KURSI],
    },
    {
      name: {
        tr: '2 Muharrem',
        en: '2 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-17',
      hijriDate: '2 Muharrem 1448',
      description: {
        tr: 'Şükür ve tesbih bilincini güçlendirme günü.',
        en: 'A day to strengthen the consciousness of gratitude and glorification (tasbih).',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 2,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.BAKIYAT_SALIHAT],
    },
    {
      name: {
        tr: '3 Muharrem',
        en: '3 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-18',
      hijriDate: '3 Muharrem 1448',
      description: {
        tr: 'Selamet ve şifa niyetini güçlendirme günü.',
        en: 'A day to strengthen the intention of well-being and healing.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 3,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.YA_SELAM],
    },
    {
      name: {
        tr: '4 Muharrem',
        en: '4 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-19',
      hijriDate: '4 Muharrem 1448',
      description: {
        tr: 'Tevhid ile ego kırma ve teslimiyet günü.',
        en: 'A day of breaking the ego and submission through tawhid.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 4,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.VAHDEHU_LA],
    },
    {
      name: {
        tr: '5 Muharrem',
        en: '5 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-20',
      hijriDate: '5 Muharrem 1448',
      description: {
        tr: 'Rahmet ve merhamet iklimini diri tutma günü.',
        en: 'A day to keep alive the climate of mercy and compassion.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 5,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.YA_RAHMAN_YA_RAHIM],
    },
    {
      name: {
        tr: '6 Muharrem',
        en: '6 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-21',
      hijriDate: '6 Muharrem 1448',
      description: {
        tr: 'Acziyet, tevekkül ve dayanıklılık günü.',
        en: 'A day of humility, trust in God (tawakkul), and endurance.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 6,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.LA_HAVLE],
    },
    {
      name: {
        tr: '7 Muharrem',
        en: '7 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-22',
      hijriDate: '7 Muharrem 1448',
      description: {
        tr: 'İhlas ve tevhidde sebat günü.',
        en: 'A day of sincerity (ikhlas) and steadfastness in tawhid.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 7,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.IHLAS],
    },
    {
      name: {
        tr: '8 Muharrem',
        en: '8 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-23',
      hijriDate: '8 Muharrem 1448',
      description: {
        tr: 'Kelime-i tevhid ve risalet bilincini tazeleme günü.',
        en: 'A day to renew the consciousness of the word of tawhid and prophethood.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 8,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.TEVHID],
    },
    {
      name: {
        tr: '9 Muharrem',
        en: '9 Muharram',
      },
      type: 'özel gün',
      date: '2026-06-24',
      hijriDate: '9 Muharrem 1448',
      description: {
        tr: 'Selamet ve ilahi hitap ümidiyle okunacak zikir günü.',
        en: 'A day of dhikr to be recited in hope of well-being and divine address.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 9,
      dayCount: 10,
      priority: 160,
      dhikrKeys: [keyMap.SELAMUN_KAVLEN, keyMap.SEHADET, keyMap.IHLAS],
    },
    {
      name: {
        tr: '10 Muharrem (Aşure)',
        en: '10 Muharram (Ashura)',
      },
      type: 'özel gün',
      date: '2026-06-25',
      hijriDate: '10 Muharrem 1448',
      description: {
        tr: 'Aşure gününde enbiya vesilesiyle kurtuluş duası ve zikir.',
        en: 'Supplication and dhikr for salvation through the prophets on the Day of Ashura.',
      },
      eventKey: 'muharrem-ilk-on-2026',
      dayIndex: 10,
      dayCount: 10,
      priority: 170,
      dhikrKeys: [
        keyMap.ASURE_DUASI,
        keyMap.HASBIYALLAH_VEKIL,
        keyMap.SUBHANALLAHI_MIZAN,
        keyMap.ASURE_ENBIYA_DUASI,
        keyMap.IHLAS,
      ],
    },
  ],
};
