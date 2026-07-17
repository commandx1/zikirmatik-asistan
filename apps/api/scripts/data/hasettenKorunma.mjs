import { keyMap } from './keyMap.mjs'

export const hasettenKorunma = {
  key: 'hasetten-korunma',
  label: 'Haset ve Kıskançlıktan Korunma Duaları',
  category: 'koruma',
  description: 'Haset ve kıskançlıktan korunmak için Hz. Peygamber\'den gelen dualar.',
  dhikrItems: [
    {
      key: 'haset-ya-mumin',
      nameArabic: 'يَا مُؤْمِنُ',
      name: {
        tr: "Yâ Mü'min",
        en: 'Ya Mu\'min',
      },
      transliteration: {
        tr: "Yâ Mü'min",
        en: "Ya Mu'min",
      },
      meaning: {
        tr: 'Gönüllerde iman ışığı uyandıran, kendine sığınanlara emniyet veren.',
        en: 'He who kindles the light of faith in hearts and grants security to those who seek refuge in Him.',
      },
      virtue: {
        tr: 'Her gün sabah namazının ardından 167 defa zikredildiğinde kalbi ve dili riyadan, kibirden, hasetten ve kötü ahlaktan korur.',
        en: 'When recited 167 times every day after the morning prayer, it guards the heart and tongue against hypocrisy (riya), arrogance, envy, and bad character.',
      },
      source: {
        tr: "Esmâ-i Hüsnâ Literatürü",
        en: "Asma al-Husna (Beautiful Names of Allah) Literature",
      },
      tags: ['haset', 'kıskançlık', 'korunma', 'riya', 'kibir', 'esma', 'sabah zikri'],
      categories: ['genel', 'nefis terbiyesi', 'manevi destek', 'esma'],
      timeOfDay: 'morning',
      recommendedCount: 167,
      suitableFor: [
        'haset ve kıskançlık',
        'riya ve gösteriş',
        'kibir',
        'kötü ahlak',
        'kalp temizliği',
        'sabah namazı sonrası',
      ],
    },
    {
      key: keyMap.RABBENA_GFIR_GILLA,
      nameArabic:
        'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَحِيمٌ',
      name: {
        tr: 'Kalpteki Kini Gideren Dua',
        en: 'Supplication for Removing Rancor from the Heart',
      },
      transliteration: {
        tr: "Rabbenağfir lenâ ve li-ihvâninel-lezîne sebekûnâ bil-îmân, ve lâ tec'al fî kulûbinâ gıllen lillezîne âmenû, Rabbenâ inneke Raûfun Rahîm.",
        en: "Rabbana ighfir lana wa li-ikhwaninal-ladhina sabaquna bil-iman, wa la taj'al fi qulubina ghillan lilladhina amanu, Rabbana innaka Ra'ufun Rahim.",
      },
      meaning: {
        tr: "Rabbimiz! Bizi ve bizden önce gelip geçmiş imanlı kardeşlerimizi bağışla; kalplerimizde, iman edenlere karşı hiçbir kin ve haset bırakma! Rabbimiz! Şüphesiz ki sen çok şefkatli, çok merhametlisin!",
        en: 'Our Lord! Forgive us and our brothers in faith who preceded us, and let there be no rancor in our hearts toward those who believe. Our Lord, You are indeed Ever-Kind, Most Merciful!',
      },
      virtue: {
        tr: "İman edenlere karşı kalpte oluşabilecek kin, nefret ve haset duygularını kökten temizlemek ve kalbi selim kılmak için en etkili Kur'an dualarındandır.",
        en: "This is one of the most effective Quranic supplications for uprooting any rancor, resentment, or envy that may form in the heart toward believers, purifying the heart into a sound and untainted state.",
      },
      source: {
        tr: 'Haşir Suresi, 10. Ayet',
        en: 'Surah Al-Hashr, Verse 10',
      },
      tags: ['haset', 'kin', 'nefret', 'korunma', 'kalp temizliği', 'kuran', 'dua'],
      categories: ['genel', 'nefis terbiyesi', 'manevi destek', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'kin ve nefret',
        'haset ve kıskançlık',
        'kalp selimliği',
        'kardeşlere karşı olumsuz duygular',
        'manevi arınma',
        'kalbi ıslah',
      ],
    },
    {
      key: keyMap.FELAK_SURESI,
      nameArabic:
        'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
      name: {
        tr: 'Felak Suresi',
        en: 'Surah Al-Falaq',
      },
      transliteration: {
        tr: "Kul e'ûzü bi-Rabbil-felak. Min şerri mâ halak. Ve min şerri gâsıkin izâ vakab. Ve min şerrin-neffâsâti fil-ukad. Ve min şerri hâsidin izâ hasad.",
        en: "Qul a'udhu bi-Rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.",
      },
      meaning: {
        tr: "De ki: Sabahın Rabbine sığınırım. Yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyen büyücülerin şerrinden, kıskandığı zaman kıskanç kişinin şerrinden.",
        en: 'Say: I seek refuge in the Lord of daybreak, from the evil of what He has created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.',
      },
      virtue: {
        tr: "Özellikle kıskançlık ve haset gibi kötü niyetlerin, kem gözlerin manevi etkilerinden ve hasetçinin şerrinden korunmak için sabah ve akşam 3'er defa okunması önerilir.",
        en: "It is recommended to recite it three times in the morning and three times in the evening for protection against the spiritual effects of ill intentions such as jealousy and envy, the evil eye, and the harm of the envier.",
      },
      source: {
        tr: "Felak Suresi (Kur'an-ı Kerim, 113. Sure)",
        en: 'Surah Al-Falaq (Quran, Chapter 113)',
      },
      tags: ['haset', 'kıskançlık', 'korunma', 'nazardan korunma', 'sabah akşam', 'kuran'],
      categories: ['genel', 'korunma', 'manevi destek', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'haset ve kıskançlık',
        'kem göz ve nazar',
        'manevi saldırılardan korunma',
        'sabah-akşam zikri',
        'genel korunma',
      ],
    },
    {
      key: 'haset-hasbiyallahu',
      nameArabic:
        'حَسْبِيَ اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
      name: {
        tr: 'Hasbiyallâh Zikri',
        en: 'Hasbiyallah Dhikr (Sufficiency of Allah)',
      },
      transliteration: {
        tr: "Hasbiyallâhu lâ ilâhe illâ hû. Aleyhi tevekkeltü ve hüve Rabbül arşil azîm.",
        en: "Hasbiyallahu la ilaha illa Hu. 'Alayhi tawakkaltu wa Huwa Rabbul-'Arshil-'Azim.",
      },
      meaning: {
        tr: "Allah bana yeter. O'ndan başka ilah yoktur. O'na tevekkül ettim. O yüce arşın Rabbidir.",
        en: 'Allah is sufficient for me. There is no deity but Him. I have placed my trust in Him, and He is the Lord of the mighty Throne.',
      },
      virtue: {
        tr: "Kıskançlık, haset ve bunların getirdiği içsel daralmalar ile negatif etkilerden korunmak amacıyla günde 7 kez okunması tavsiye edilir.",
        en: 'It is recommended to recite it seven times a day for protection against jealousy, envy, and the inner distress and negative effects that accompany them.',
      },
      source: {
        tr: "İbnü's-Sünnî, Amelü'l-Yevm ve'l-Leyle",
        en: "Ibn al-Sunni, 'Amal al-Yawm wa al-Layla",
      },
      tags: ['haset', 'kıskançlık', 'korunma', 'tevekkül', 'teslimiyet', 'hasbiye'],
      categories: ['genel', 'korunma', 'nefis terbiyesi', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'haset ve kıskançlık',
        'içsel daralma',
        'negatif etkilerden korunma',
        'tevekkül güçlendirme',
        'manevi kalkan',
      ],
    },
    {
      key: 'haset-ya-hafiz',
      nameArabic: 'يَا حَافِظُ',
      name: {
        tr: 'Yâ Hâfız',
        en: 'Ya Hafiz',
      },
      transliteration: {
        tr: 'Yâ Hâfız',
        en: 'Ya Hafiz',
      },
      meaning: {
        tr: "Koruyan, muhafaza eden, gözeten.",
        en: 'The Preserver, the Guardian, the Watchful Protector.',
      },
      virtue: {
        tr: "Günde 100 defa zikredildiğinde kıskançlık, haset ve kötü enerjilere karşı manevi bir koruma kalkanı oluşturur.",
        en: 'When recited 100 times a day, it forms a spiritual shield of protection against jealousy, envy, and negative influences.',
      },
      source: {
        tr: 'Esmâ-i Hüsnâ Literatürü',
        en: 'Asma al-Husna (Beautiful Names of Allah) Literature',
      },
      tags: ['haset', 'kıskançlık', 'korunma', 'kötü enerji', 'esma'],
      categories: ['genel', 'korunma', 'manevi destek', 'esma'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: [
        'haset ve kıskançlık',
        'kötü enerjilerden korunma',
        'manevi kalkan',
        'nazar ve haset etkisi',
        'günlük korunma zikri',
      ],
    },
    {
      key: keyMap.LA_MANIA_LIMA_ATAYTE,
      nameArabic:
        'اللّٰهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ وَلَا رَادَّ لِمَا قَضَيْتَ وَلَا مُبَدِّلَ لِمَا حَكَمْتَ وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
      name: {
        tr: 'Namaz Sonrası Teslimiyet Duası',
        en: 'Post-Prayer Supplication of Submission',
      },
      transliteration: {
        tr: "Allâhümme lâ mâni'a limâ a'tayte, ve lâ mu'tiye limâ mena'te. Ve lâ râdde limâ kadayte ve lâ mübeddile limâ hakemte. Ve lâ yenfeu zel ceddi minkel cedd.",
        en: "Allahumma la mani'a lima a'tayta, wa la mu'tiya lima mana'ta. Wa la radda lima qadayta wa la mubaddila lima hakamta. Wa la yanfa'u dhal-jaddi minkal-jadd.",
      },
      meaning: {
        tr: "Allah'ım! Senin verdiğine kimse engel olamaz. Senin men ettiğine de kimse veremez. Senin takdir ettiğini kimse geri çeviremez. Senin hükmünü kimse değiştiremez. Servet sahibine serveti senin katında fayda vermez.",
        en: 'O Allah! None can withhold what You have given, and none can give what You have withheld. None can turn back what You have decreed, and none can alter what You have judged. The wealth of the wealthy does not benefit them against You.',
      },
      virtue: {
        tr: "Hasedin kalbde kök salmasının temel mekanizması şudur: insan başkasının sahip olduğuna bakıp 'neden o var bende yok?' sorusunu sorar ve bu sorudan haset filizlenir. Bu dua, tam da o mekanizmayı kesen bir bilişsel çerçeve sunar; zira her nimetin tek kaynağının Allah olduğunu ve kimsenin O'nun takdirini ne engelleyebileceğini ne de değiştirebileceğini ilan eder. Başkasındaki nimet Allah'ın ona özel takdiridir, kendi yokluğu da Allah'ın bilinçli bir kararıdır; bu gerçek içselleştirildiğinde hasedi besleyen kıyaslama zemini ortadan kalkar. Düzenli okuyan kişilerde başkasının başarı ve nimetlerine karşı duyulan içsel sızının zamanla yerini rızaya ve teslimiyet hissine bıraktığı gözlemlenir. Peygamber Efendimiz bu duayı namaz sonrası sürekli okumuştur; günlük namazların ardından tekrar edilmesi, haset duygusunun fark edilip kırılması için güçlü bir rutin oluşturur.",
        en: "The basic mechanism by which envy takes root in the heart is this: a person looks at what someone else possesses and asks, 'why does he have it and I do not?' — and envy sprouts from that very question. This supplication offers a cognitive framework that cuts that mechanism at its root, since it declares that every blessing has Allah alone as its source, and that no one can either withhold or alter His decree. What another person possesses is Allah's specific decree for them, and one's own lack of it is likewise a deliberate decision of Allah; once this truth is internalized, the ground of comparison that feeds envy disappears. Those who recite it regularly are observed to find that the inner sting felt toward others' success and blessings gradually gives way to contentment and submission. The Prophet (peace be upon him) recited this supplication continually after every prayer; repeating it after each of the daily prayers builds a powerful routine for recognizing and breaking the feeling of envy.",
      },
      source: {
        tr: 'Buhârî, Deavât, 6330; Müslim, Mesâcid, 593',
        en: 'Sahih al-Bukhari, Supplications, 6330; Sahih Muslim, Mosques, 593',
      },
      tags: ['haset', 'kıskançlık', 'korunma', 'teslimiyet', 'rıza', 'namaz sonrası', 'dua'],
      categories: ['genel', 'nefis terbiyesi', 'manevi destek', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'haset ve kıskançlık',
        'başkasının nimetini kıskanma',
        'ilahi taksimata rıza',
        'namaz sonrası zikir',
        'teslimiyet güçlendirme',
        'nefis terbiyesi',
      ],
    },
  ],
  specialDays: [],
}
