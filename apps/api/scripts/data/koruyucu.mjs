import { keyMap } from './keyMap.mjs'

export const koruyucu = {
  key: 'koruyucu-zikirler',
  label: {
    tr: 'Büyü, Nazar ve Vesveseye Karşı Koruyucu Zikirler',
    en: 'Protective Dhikrs Against Magic, the Evil Eye and Whispering',
  },
  category: 'koruma',
  description: {
    tr: 'Şeytandan, nazardan ve kötülüklerden korunmak için okunan dualar.',
    en: 'Supplications recited for protection from Satan, the evil eye and evils.',
  },
  dhikrItems: [
    {
      key: 'korunma-muavvizeteyn-felak-nas',
      nameArabic:
        'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلٰهِ النَّاسِ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الْجِنَّةِ وَالنَّاسِ',
      name: {
        tr: 'Muavvizeteyn (Felak ve Nâs Sureleri)',
        en: "Al-Mu'awwidhatayn (Surahs Al-Falaq and An-Nas)",
      },
      transliteration: {
        tr: "Kul eûzü bi-rabbi'l-felak. Min şerri mâ halak. Ve min şerri ğâsikın izâ vekab. Ve min şerri'n-neffâsâti fi'l-ukad. Ve min şerri hâsidin izâ hased. Kul eûzü bi-rabbi'n-nâs. Meliki'n-nâs. İlâhi'n-nâs. Min şerri'l-vesvâsi'l-hannâs. Ellezî yüvesvisü fî sudûri'n-nâs. Mine'l-cinneti ve'n-nâs.",
        en: "Qul a'udhu bi-Rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad. Qul a'udhu bi-Rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
      },
      meaning: {
        tr: "Felak Suresi: De ki: Yarattığı şeylerin şerrinden, karanlığı çöktüğünde gecenin şerrinden, düğümlere üfleyen büyücülerin şerrinden ve kıskandığı zaman hasetçinin şerrinden, sabahın Rabbine sığınırım. Nâs Suresi: De ki: İnsanların Rabbine, insanların Melikine, insanların İlâhına; cinlerden ve insanlardan olup insanların göğüslerine vesvese veren, sinsi vesvesecinin şerrinden sığınırım.",
        en: 'Surah Al-Falaq: Say: I seek refuge in the Lord of daybreak, from the evil of what He has created, from the evil of darkness when it settles, from the evil of those who blow on knots, and from the evil of an envier when he envies. Surah An-Nas: Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the breasts of mankind, from among the jinn and mankind.',
      },
      virtue: {
        tr: "Peygamber Efendimizin (s.a.v.) büyü, nazar, sihir ve vesveseye karşı en çok tavsiye ettiği ve bizzat kendisinin de sabah-akşam üçer defa okuduğu bildirilen iki korunma suresidir. Hastalandığında bu sureleri okuyup ellerine üfleyerek mübarek vücuduna sürdüğü, yatağına girmeden önce de aynı şekilde okuyup üflediği rivayet edilmiştir.",
        en: 'These two surahs are the protective chapters that the Prophet (peace be upon him) recommended most for protection against magic, the evil eye, sorcery, and whispered doubts, and which he himself is reported to have recited morning and evening, three times each. It is narrated that when he fell ill, he would recite them, blow into his hands, and wipe them over his blessed body, and that he would do the same each night before lying down to sleep.',
      },
      source: {
        tr: "Buhârî, Ehâdîsü'l-Enbiyâ, 10; Tirmizî, Tıb, 16; Nesâî, İstiâze, 37; Ebû Dâvûd",
        en: "Sahih al-Bukhari, Ahadith al-Anbiya, 10; At-Tirmidhi, Medicine, 16; An-Nasa'i, Seeking Refuge, 37; Abu Dawood",
      },
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
      key: keyMap.BISMILLAH_LA_YEDURRU,
      nameArabic:
        'بِسْمِ اللّٰهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      name: {
        tr: 'Bismillâhillezî Duası',
        en: "Supplication of 'In the Name of Allah, With Whose Name Nothing Can Harm'",
      },
      transliteration: {
        tr: "Bismillâhillezî lâ yedurru me'asmihî şey'ün fil erdi ve lâ fis-semâi ve hüves-semî'ul alîm.",
        en: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-'Alim.",
      },
      meaning: {
        tr: "Allah'ın adıyla; O'nun ismiyle yerde ve gökte hiçbir şey zarar veremez. O her şeyi işitendir, bilendir.",
        en: "In the name of Allah, with whose name nothing on the earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
      },
      virtue: {
        tr: `Sabah-akşam üçer defa okuyan kişinin, o gün ya da gece ansızın gelebilecek kaza, bela, zehirlenme ve ani rahatsızlıklara karşı Allah'ın koruması altına girdiği bildirilmiştir. "Lâ yedurru" ifadesi mutlak bir olumsuzlama taşır; yerde ve gökte var olan hiçbir tehlikenin Allah'ın ismi yanında etki edemeyeceğini bildiren bu kesinlik, duayı hem manevi hem psikolojik bir zırha dönüştürür. "Ma'asmihî" (O'nun ismiyle birlikte olan) kaydı, duanın yalnızca telaffuz değil, kalbi hazır bir niyetle okunmasını şart koştuğunu ima eder. Sabah vakti okunması günü, akşam vakti okunması geceyi kapsar; böylece gün boyunca bedenî ve manevi hasara karşı sürekli bir kalkan oluşur. Ani hastalık, kaza veya zehirlenme endişesi taşıyan kişilerin günlük rutinine kolayca yerleştirilebilecek sade ama kapsamlı bir koruma duasıdır.`,
        en: "It is reported that whoever recites this three times in the morning and three times in the evening is placed under Allah's protection against sudden harm, calamity, poisoning, and unexpected ailments that day or night. The phrase 'nothing can harm' carries an absolute negation; this certainty, declaring that no danger existing on earth or in the heaven can have effect beside the name of Allah, turns the supplication into both a spiritual and a psychological shield. The qualifier 'with His name' implies that the supplication requires not mere utterance but a heart present with sincere intention. Reciting it in the morning covers the day, and reciting it in the evening covers the night, forming a continuous shield against bodily and spiritual harm throughout the day. It is a simple yet comprehensive protective supplication that can easily be added to the daily routine of anyone concerned about sudden illness, accident, or poisoning.",
      },
      source: {
        tr: "Ebû Dâvûd, Edeb, 110; İbn Mâce, Dua, 16; Tirmizî, Deavât, 13",
        en: "Abu Dawood, Adab, 110; Ibn Majah, Supplication, 16; At-Tirmidhi, Supplications, 13",
      },
      tags: ['safer', 'korunma', 'sabah-akşam', 'bela', 'son çarşamba', 'nazar', 'dua', 'şifa', 'ani rahatsızlık', 'kaza', 'özel gün', 'safer ayı girişi', 'safer ilk çarşamba gecesi', 'safer son çarşamba gecesi', 'last wednesday night of safar', 'first wednesday night of safar', 'beginning of the month of safar'],
      categories: ['dua', 'korunma', 'özel gün', 'genel', 'hastalık', 'safer'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: ['safer ayı', 'bela koruması', 'son çarşamba', 'herkes', 'sabah akşam', 'ani belalara karşı', 'nazar korunması', 'ani rahatsızlık ve kaza', 'zehirlenme korunması', 'safer ayı girişi', 'safer ilk çarşamba gecesi', 'safer son çarşamba gecesi', 'last wednesday night of safar', 'first wednesday night of safar', 'beginning of the month of safar'],
    },
    {
      key: 'korunma-kelimatillahit-tamme',
      nameArabic:
        'أُعِيذُ بِكَلِمَاتِ اللّٰهِ التَّامَّةِ مِنْ شَرِّ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ شَرِّ كُلِّ عَيْنٍ لَامَّةٍ',
      name: {
        tr: 'Kelimâtillâhit-tâmme Duası',
        en: "Supplication of Allah's Perfect Words",
      },
      transliteration: {
        tr: "Eûzü bi-kelimâtillâhi't-tâmmeti min şerri külli şeytânin ve hâmmetin ve min şerri külli aynin lâmmetin.",
        en: "A'udhu bi-kalimatillahit-tammati min sharri kulli shaytanin wa hammatin wa min sharri kulli 'aynin lammah.",
      },
      meaning: {
        tr: "Allah'ın eksiksiz kelimelerine; her şeytanın, her zararlı canlının ve her kem gözün şerrinden sığınırım.",
        en: 'I seek refuge in the perfect words of Allah from the evil of every devil, every venomous creature, and every envious eye.',
      },
      virtue: {
        tr: "Hz. Peygamber'in (s.a.v.) torunları Hasan ve Hüseyin'i (radıyallahu anhümâ) nazardan ve cin çarpmasından korumak için okuduğu ve İbrahim (a.s.) ile evlatlarını da bu sözlerle Allah'a emanet ettiğini haber verdiği bir sığınma duasıdır. Nazar, cin etkisi ve görünmeyen ruhani olumsuzluklara karşı hem çocuklar hem büyükler için günlük vird olarak okunur.",
        en: 'This is a supplication that the Prophet (peace be upon him) recited to protect his grandsons Hasan and Husayn, may Allah be pleased with them, from the evil eye and from the touch of jinn, and he related that Abraham, peace be upon him, entrusted his own sons to Allah with these very words. It is recited daily by both children and adults as protection against the evil eye, the influence of jinn, and unseen spiritual harm.',
      },
      source: {
        tr: "Buhârî, Ehâdîsü'l-Enbiyâ, 10; Müslim, Zikir, 54; Tirmizî, Deavât, 40",
        en: 'Sahih al-Bukhari, Ahadith al-Anbiya, 10; Sahih Muslim, Dhikr, 54; At-Tirmidhi, Supplications, 40',
      },
      tags: ['korunma', 'nazar', 'cin', 'dua'],
      categories: ['genel', 'korunma', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['çocuk korunması', 'kem göz', 'manevi sığınma'],
    },
    {
      key: keyMap.HASBUNALLAH_VEKIL,
      nameArabic: 'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ',
      name: {
        tr: "Hasbünallâhu ve Ni'mel Vekîl",
        en: 'Hasbunallahu wa Ni\'mal Wakil (Allah is Sufficient for Us, and He is the Best Disposer of Affairs)',
      },
      transliteration: {
        tr: "Hasbünallâhu ve ni'mel vekîl.",
        en: "Hasbunallahu wa ni'mal wakil.",
      },
      meaning: {
        tr: 'Allah bize yeter; O ne güzel vekildir.',
        en: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
      },
      virtue: {
        tr: "Hazreti İbrahim (aleyhisselam) ateşe atılırken; Hz. Peygamber (s.a.v.) ve ashabı ise düşmanlarının kalabalık ordusuyla karşı karşıya kaldıklarında bu sözü söylemiştir. Haksız beddua, düşman korkusu ve ruhani darlıklarda müminin sığınacağı en büyük tevekkül zikirlerindendir; sıkıntının şiddetiyle orantılı olarak tekrarı tavsiye edilir.",
        en: 'Abraham, peace be upon him, uttered these words as he was being cast into the fire; and the Prophet, peace be upon him, and his companions said the same when they faced a vast army of enemies. It is among the greatest declarations of trust in Allah to which a believer turns amid unjust curses, fear of enemies, and spiritual distress, and its repetition is recommended in proportion to the intensity of the hardship faced.',
      },
      source: {
        tr: "Âl-i İmrân, 3/173; Buhârî, Tefsir, 13",
        en: 'Surah Aal-i-Imran, 3:173; Sahih al-Bukhari, Quranic Commentary, 13',
      },
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
      name: {
        tr: 'Kalem Suresi Sonu (Nazar Ayeti)',
        en: 'End of Surah Al-Qalam (The Verse of the Evil Eye)',
      },
      transliteration: {
        tr: 'Ve in yekâdüllezîne keferû leyüzlikûneke bi-ebsârihim lemmâ semiûz-zikra ve yekûlûne innehu lemecnûn. Ve mâ huve illâ zikrun lil âlemîn.',
        en: "Wa in yakadul-ladhina kafaru layuzliqunaka bi-absarihim lamma sami'udh-dhikra wa yaqoluna innahu lamajnun. Wa ma huwa illa dhikrul lil-'alamin.",
      },
      meaning: {
        tr: 'İnkâr edenler Kur\'an\'ı işittiklerinde neredeyse seni gözleriyle devirecek gibi oluyorlar ve "O gerçekten bir delidir" diyorlardı. Hâlbuki o (Kur\'an), âlemler için ancak bir öğüttür.',
        en: 'And indeed, those who disbelieve would almost make you slip with their eyes when they hear the message, and they say, "Indeed, he is mad." But it is not except a reminder to the worlds.',
      },
      virtue: {
        tr: 'Kur\'an-ı Kerim\'de nazarın gerçekliğine ve etki gücüne doğrudan işaret eden ayet olarak bilinir; müfessirler bu ayeti "nazar haktır" hadisinin Kur\'ânî delili olarak zikretmiştir. Nazarın yıkıcı etkilerine karşı günlük korunma tertiplerinde, özellikle nazara maruz kaldığı düşünülen kişi ve eşyalar için sıkça okunur.',
        en: 'This verse is known as the one that directly points to the reality and effective power of the evil eye in the Quran; commentators cite it as the Quranic evidence for the hadith stating that "the evil eye is real." It is frequently recited in daily protective litanies against the destructive effects of the evil eye, particularly for people and possessions thought to be exposed to it.',
      },
      source: {
        tr: 'Kalem Suresi, 68/51-52',
        en: 'Surah Al-Qalam, 68:51-52',
      },
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
      name: {
        tr: "Hz. Yunus'un Duası",
        en: "The Supplication of Prophet Jonah (Dhun-Nun's Supplication)",
      },
      transliteration: {
        tr: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn.',
        en: 'La ilaha illa anta subhanaka inni kuntu minazh-zhalimin.',
      },
      meaning: {
        tr: 'Senden başka hiçbir ilâh yoktur. Seni bütün noksan sıfatlardan tenzih ederim. Gerçekten ben zâlimlerden (kendi nefsine haksızlık edenlerden) oldum.',
        en: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
      },
      virtue: {
        tr: 'Ağır manevi hava, içsel tıkanıklık ve beddua etkisi korkusunda sığınılacak güçlü bir yakarıştır. Ağır travmalar, kederler, çaresizlikler ve her türlü psikolojik darlıktan kurtulmaya vesile olur. Kişinin kendi sınırlarını kabul edip mutlak güce sığınmasını sağlayarak bilişsel yükü hafifletir. Öfke ve hiddet anlarında "innî küntü minez-zâlimîn" (ben kendine zulmedenlerdenim) ifadesi, kişiyi öfkenin sahibi olmaktan çıkarıp kendi hatasını fark eden bir konuma taşır; bu dönüşüm gazabın yoğunluğunu kırar. Hz. Yunus (aleyhisselam) balığın karnındaki karanlıkta bu duayı okuduğunda kurtulduğu bildirilmiştir; bu yüzden darlıkta okuyan herkes için icabet vaad edildiği rivayet edilir.',
        en: "This is a powerful supplication for refuge amid heavy spiritual oppression, inner blockage, and fear of the effect of curses. It becomes a means of deliverance from severe trauma, grief, helplessness, and every kind of psychological hardship. By leading a person to acknowledge their own limits and take refuge in the Absolute Power, it lightens the cognitive burden they carry. In moments of anger and rage, the phrase 'indeed, I have been of the wrongdoers' shifts the person out of the position of owning the anger and into one of recognizing their own fault, a shift that breaks the intensity of the rage. It is reported that Prophet Jonah, peace be upon him, recited this supplication in the darkness of the whale's belly and was thereupon delivered; it is narrated that a response is promised to everyone who recites it in hardship for this reason.",
      },
      source: {
        tr: 'Enbiyâ Suresi, 87. Ayet; Tirmizî, Deavât, 82; İbnü\'s-Sünnî',
        en: 'Surah Al-Anbiya, verse 87; At-Tirmidhi, Supplications, 82; Ibn al-Sunni',
      },
      tags: ['korunma', 'yunus duası', 'vesvese', 'sıkıntı', 'öfke', 'sakinleşme', 'darlık', 'kandil', 'mawlid al-nabi'],
      categories: ['genel', 'korunma', 'nefis terbiyesi', 'dua', 'kandil', 'özel gün', 'mevlid'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: ['ruhani sıkıntı', 'vesvese', 'manevi arınma', 'darlık anları', 'öfke ve hiddet', 'çaresizlik ve tıkanıklık', 'travma ve keder', 'mevlid kandili', 'mawlid al-nabi'],
    },
    {
      key: 'korunma-suyuti-vesvese-duasi',
      nameArabic:
        'يَا اللّٰهُ الرَّقِيبُ الْحَفِيظُ الرَّحِيمُ، يَا اللّٰهُ الْحَيُّ الْحَلِيمُ الْعَظِيمُ الرَّؤُوفُ الْكَرِيمُ، يَا اللّٰهُ الْحَيُّ الْقَيُّومُ الْقَائِمُ عَلَى كُلِّ نَفْسٍ بِمَا كَسَبَتْ، حُلْ بَيْنِي وَبَيْنَ عَدُوِّي',
      name: {
        tr: "Süyuti'nin Vesvese ve Korunma Duası",
        en: "Al-Suyuti's Supplication against Whispers and for Protection",
      },
      transliteration: {
        tr: 'Yâ Allah-ür-rakîb-ül-hafîz-ür-rahîm. Yâ Allah-ül-hayy-ül-halîm-ül-azîm-ür-raûf-ül-kerîm. Yâ Allah-ül-hayy-ül-kayyûm-ül-kâimü alâ külli nefsin bimâ kesebet, hul beyni ve beyne adüvvî!',
        en: "Ya Allahur-Raqibul-Hafizur-Rahim. Ya Allahul-Hayyul-Halimul-'Azimur-Ra'uful-Karim. Ya Allahul-Hayyul-Qayyumul-Qa'imu 'ala kulli nafsin bima kasabat, hul bayni wa bayna 'aduwwi!",
      },
      meaning: {
        tr: 'Ey gözeten, koruyan ve merhamet eden Allah\'ım! Ey hayat sahibi, halîm, azametli, çok şefkatli ve cömert olan Allah\'ım! Ey diri, her şeyi ayakta tutan ve her nefsin kazandığı şeyleri bilen (Kayyûm) Allah\'ım! Benimle düşmanımın arasına engel ol!',
        en: 'O Allah, the Watchful, the Preserver, the Merciful! O Allah, the Living, the Forbearing, the Magnificent, the Compassionate, the Generous! O Allah, the Living, the Sustainer, who stands over every soul and what it has earned; come between me and my enemy!',
      },
      virtue: {
        tr: 'Meşhur hadis alimi Celâleddin es-Süyûtî\'nin (rahimehullah) derlediği evrad ve ezkâr mecmualarında yer alan, içsel vesvese, ani korkular ve ruhî bunalımlara karşı günlük korunma virdi olarak okunan bir duadır. "Düşmanımla aramı ayır" ifadesi hem görünen hem görünmeyen (şeytan, nefis, kötü niyetli kişi) düşmanları kapsayacak şekilde genişçe anlaşılmıştır.',
        en: "This supplication appears in the collections of litanies and remembrances compiled by the renowned hadith scholar Jalal al-Din al-Suyuti, may Allah have mercy on him, and is recited daily as protection against inner whispers, sudden fears, and spiritual crises. The phrase 'come between me and my enemy' has broadly been understood to encompass both visible and unseen enemies — Satan, the lower self, and ill-intentioned people alike.",
      },
      source: {
        tr: 'Celâleddin es-Süyûtî, el-Vabilü\'s-Sayyib ve Ezkâr mecmuaları; İmam Gazâlî, İhyâu Ulûmi\'d-Dîn',
        en: "Jalal al-Din al-Suyuti, collections of Adhkar; Imam al-Ghazali, Ihya' Ulum al-Din",
      },
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
      name: {
        tr: 'Dua-i Şifa',
        en: 'Supplication for Healing (Du\'a al-Shifa)',
      },
      transliteration: {
        tr: 'Allâhümme innî eûzü bike min külli durrin ve edri annî mâ yedurrunî.',
        en: "Allahumma inni a'udhu bika min kulli durrin wa adri 'anni ma yadurruni.",
      },
      meaning: {
        tr: "Allah'ım, her türlü zarardan sana sığınırım; bana zarar verecek şeyleri benden uzaklaştır.",
        en: 'O Allah, I seek refuge in You from all harm, and turn away from me whatever would harm me.',
      },
      virtue: {
        tr: "Nazar, haset ve haksız bedduaların bedende ve ruhta bıraktığı ağırlığa karşı arınma niyetiyle okunan, geleneksel şifa dualarındandır. Hastalık anlarında hem beden hem gönül sağlığının Allah'tan istendiği kısa ve kapsamlı bir sığınma duasıdır.",
        en: "This is one of the traditional healing supplications recited with the intention of purification from the weight left on the body and spirit by the evil eye, envy, and unjust curses. It is a short yet comprehensive supplication of refuge through which both physical and spiritual well-being are sought from Allah in times of illness.",
      },
      source: {
        tr: 'Geleneksel şifa duaları ve evrad mecmuaları',
        en: "Traditional healing supplications and litany (wird) compilations",
      },
      tags: ['korunma', 'şifa', 'nazar', 'haset'],
      categories: ['genel', 'korunma', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['nazar etkisi', 'haset', 'ruhani temizlik'],
    },
    {
      key: 'korunma-iman-ikrari-zikri',
      nameArabic: 'آمَنْتُ بِاللّٰهِ وَرُسُلِهِ',
      name: {
        tr: 'İman İkrarı Zikri',
        en: 'Declaration of Faith Dhikr',
      },
      transliteration: {
        tr: 'Âmentü billâhi ve rusulih.',
        en: 'Amantu billahi wa rusulih.',
      },
      meaning: {
        tr: "Allah'a ve O'nun gönderdiği elçilere iman ettim.",
        en: 'I have believed in Allah and His messengers.',
      },
      virtue: {
        tr: "Hz. Peygamber'in (s.a.v.) şeytanın itikatla ilgili vesveselerine karşı ashabına öğrettiği, 'Şeytan biriniz gelip: Bunu kim yarattı, şunu kim yarattı, dediğinde, sonunda Rabbini kim yarattı derse, o zaman Allah'a ve elçilerine iman ettim desin' hadisine dayanan bir iman tazeleme zikridir.",
        en: "This is a dhikr of renewing one's faith, based on the hadith in which the Prophet, peace be upon him, taught his companions that when Satan comes to one of them and says, 'Who created this, who created that,' until he says, 'Who created your Lord,' the person should then say, 'I have believed in Allah and His messengers,' to sever Satan's whisperings concerning matters of belief.",
      },
      source: {
        tr: "Buhârî, Bed'ü'l-Halk, 11; Müslim, Îmân, 212",
        en: 'Sahih al-Bukhari, The Beginning of Creation, 11; Sahih Muslim, Faith, 212',
      },
      tags: ['korunma', 'iman', 'vesvese', 'zikir'],
      categories: ['genel', 'korunma', 'iman'],
      timeOfDay: 'any',
      recommendedCount: 33,
      suitableFor: ['itikadi vesvese', 'iman tazeleme', 'zihinsel netlik'],
    },
    {
      key: 'korunma-estagfirullah-min-kulli-ma-kerihallah',
      nameArabic: 'أَسْتَغْفِرُ اللّٰهَ مِنْ كُلِّ مَا كَرِهَ اللّٰهُ',
      name: {
        tr: 'Estağfirullah min külli mâ kerihallah',
        en: "Istighfar for All That Displeases Allah",
      },
      transliteration: {
        tr: 'Estağfirullah min külli mâ kerihallah.',
        en: 'Astaghfirullaha min kulli ma karihallah.',
      },
      meaning: {
        tr: "Allah'ın razı olmadığı her şey için O'ndan bağışlanma dilerim.",
        en: "I seek Allah's forgiveness for everything that Allah dislikes.",
      },
      virtue: {
        tr: "Maddi-manevi sıkıntılar, nazar ve beddua etkilerinden arınmaya yönelik geleneksel istiğfar tertiplerindendir. Günahtan tam arınmanın, bela ve musibetleri de kökten uzaklaştıracağı anlayışına dayanır; bu yüzden korunma niyeti taşıyan istiğfarlarda tercih edilir.",
        en: "This is among the traditional istighfar litanies aimed at purification from material and spiritual hardship and the effects of the evil eye and curses. It rests on the understanding that complete purification from sin also uproots calamity and misfortune, which is why it is favored among supplications of forgiveness recited with the intention of protection.",
      },
      source: {
        tr: 'İmam-ı Rabbânî, Mektûbât',
        en: 'Imam Rabbani, Maktubat (Letters)',
      },
      tags: ['korunma', 'istiğfar', 'arınma', 'beddua'],
      categories: ['genel', 'korunma', 'istiğfar'],
      timeOfDay: 'any',
      recommendedCount: 70,
      suitableFor: ['günlük istiğfar', 'beddua korkusu', 'manevi temizlik'],
    },
    {
      key: 'afet-bismillahi-ma-saallah-la-kuvvete',
      nameArabic:
        'بِسْمِ اللّٰهِ مَا شَاءَ اللّٰهُ لَا قُوَّةَ إِلَّا بِاللّٰهِ',
      name: {
        tr: "Sühreverdi'nin Tehlikeyi Önleme Duası",
        en: "Bismillahi Ma Sha'Allah Litany",
      },
      transliteration: {
        tr: 'Bismillâhi mâ şâallah lâ kuvvete illâ billâh. Bismillâhi mâ şâallah lâ yesûkul hayre illallah. Bismillâhi mâ şâallah lâ yekşifüssûe illallah...',
        en: "Bismillahi ma sha'Allahu la quwwata illa billah. Bismillahi ma sha'Allahu la yasuqul-khayra illallah. Bismillahi ma sha'Allahu la yakshifus-su'a illallah...",
      },
      meaning: {
        tr: "Allah'ın adıyla; Allah ne dilerse o olur. Güç yalnız O'ndandır. Hayrı yalnız O sevk eder, kötülüğü yalnız O giderir.",
        en: 'In the name of Allah; whatever Allah wills comes to pass. There is no power except through Allah. None brings forth good except He, and none removes harm except He.',
      },
      virtue: {
        tr: 'Sabah okunması halinde ani tehlikeler, kötü düşünceler ve ruhani musibetlerden korunma niyeti taşır. Her sabah üç defa okunması halinde yangın, boğulma, ani ölüm ve beklenmedik afetlere karşı korunma niyeti taşıdığı bildirilmiştir.',
        en: "When recited in the morning, it carries the intention of protection from sudden dangers, evil thoughts, and spiritual calamities. It is reported that reciting it three times every morning carries the intention of protection against fire, drowning, sudden death, and unforeseen calamities.",
      },
      source: {
        tr: "Şeyh Şihâbüddin Sühreverdi hazretlerinin evrâdı, Avârifü'l-Maârif",
        en: "Litany (wird) of Shaykh Shihab al-Din al-Suhrawardi, 'Awarif al-Ma'arif",
      },
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
      name: {
        tr: 'Bakara Suresi İlk ve Son Ayetler Tertibi',
        en: 'Litany of the Opening and Closing Verses of Surah Al-Baqarah',
      },
      transliteration: {
        tr: "Elif-lâm-mîm... Ülâike alâ hüden min rabbihim ve ülâike hümül-müflihûn. Âmener-rasûlü bimâ ünzile ileyhi min rabbihî vel-mü'minûn... fensurnâ alel-kavmil-kâfirîn.",
        en: "Alif-Lam-Mim... Ula'ika 'ala hudam-mir-Rabbihim wa ula'ika humul-muflihun. Amanar-Rasulu bima unzila ilayhi mir-Rabbihi wal-mu'minun... fansurna 'alal-qawmil-kafirin.",
      },
      meaning: {
        tr: "Bakara suresinin, hidayete erenleri müjdeleyen ilk beş ayeti ile Peygamberin ve müminlerin iman ikrarını, tevekkülünü ve bağışlanma dileğini içeren son iki ayetini bir arada ihtiva eden tertip.",
        en: "A litany combining the opening five verses of Surah Al-Baqarah, which give glad tidings to the rightly guided, together with its closing two verses, which contain the declaration of faith, trust in Allah, and plea for forgiveness of the Prophet and the believers.",
      },
      virtue: {
        tr: "Hz. Peygamber (s.a.v.) 'Bakara suresinin sonundaki iki ayeti geceleyin kim okursa, ona (o gece için) yeter' buyurmuştur. Sabah-akşam ruhani baskı altındaki kimselere okunarak manevi arınma ve korunma niyetiyle uygulanır; evin şeytanlardan korunması için de tavsiye edilir.",
        en: "The Prophet, peace be upon him, said, 'Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him.' It is recited morning and evening by those under spiritual pressure, with the intention of purification and protection, and is also recommended for protecting the home from devils.",
      },
      source: {
        tr: "Buhârî, Fedâilü'l-Kur'ân, 10; Müslim, Müsâfirîn, 255",
        en: 'Sahih al-Bukhari, Virtues of the Quran, 10; Sahih Muslim, Travelers\' Prayer, 255',
      },
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
      name: {
        tr: 'Ve Üfevvidü Emrî İlallâh',
        en: 'Wa Ufawwidu Amri Ilallah (I Entrust My Affair to Allah)',
      },
      transliteration: {
        tr: 'Ve üfevvidü emrî ilallâh, innallâhe basîrun bil-ıbâd.',
        en: "Wa ufawwidu amri ilallah, innallaha basirum bil-'ibad.",
      },
      meaning: {
        tr: "Ben işimi Allah'a havale ediyorum. Şüphesiz Allah, kullarını hakkıyla görendir.",
        en: 'I entrust my affair to Allah; indeed, Allah is Seeing of His servants.',
      },
      virtue: {
        tr: "İnsanların hilelerinden, tuzaklarından ve her türlü haksızlıktan korunmak, tam bir teslimiyetle iç huzuru ve emniyeti bulmak için vird edinilir. Bu ayet, Hz. Mûsâ'nın kavminden bir müminin Firavun'un baskısına karşı söylediği ve Allah'a tam teslimiyetle sığındığı andaki duasıdır; haksızlığa uğrayan, kandırılmak ya da ezilmek korkusu taşıyan kişiler için güçlü bir manevî kalkan ve iç sükûnet kaynağıdır.",
        en: "This verse is adopted as a litany for protection from the schemes, traps, and every kind of injustice of people, and to find inner peace and security through complete submission to Allah. It is the supplication of a believing man from among the people of Pharaoh, who spoke these words in defiance of Pharaoh's oppression and took refuge in complete submission to Allah; it is a powerful spiritual shield and source of inner tranquility for those who suffer injustice or fear being deceived or crushed.",
      },
      source: {
        tr: "Mü'min (Gâfir) Sûresi, 40/44",
        en: 'Surah Ghafir (Al-Mu\'min), 40:44',
      },
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
      name: {
        tr: 'Nisa Suresi 100. Ayet Tertibi',
        en: 'Litany of Surah An-Nisa, Verse 100',
      },
      transliteration: {
        tr: 'Ve men yahruc min beytihî muhâciran ilallâhi ve rasûlihî sümme yüdrikhhul mevtü fekad vekaa ecruhû alallâh.',
        en: "Wa mai yakhruj mim baytihi muhajiran ilallahi wa Rasulihi thumma yudrik-hul-mawtu faqad waqa'a ajruhu 'alallah.",
      },
      meaning: {
        tr: "Kim Allah ve Resulü uğrunda hicret ederek evinden çıkar da sonra ölüm yetişirse, mükafatı Allah'a aittir.",
        en: 'And whoever leaves his home as an emigrant to Allah and His Messenger and then death overtakes him, his reward has already become incumbent upon Allah.',
      },
      virtue: {
        tr: "Allah yolunda çıkılan her adımın karşılığının Allah katında güvence altına alındığını bildirir; bu kesin teminat sebebiyle geleneksel korunma tertiplerinde manevi blokajların ve ruhani baskıların çözülmesi niyetiyle okunan ayetler arasında zikredilir.",
        en: "This verse establishes that the reward for every step taken in the way of Allah is guaranteed with Him; because of this firm assurance, it is counted among the verses recited in traditional protective litanies with the intention of dissolving spiritual blockages and pressures.",
      },
      source: {
        tr: 'Nisâ Suresi, 4/100',
        en: 'Surah An-Nisa, 4:100',
      },
      tags: ['korunma', 'nisa', 'ayet', 'büyü'],
      categories: ['genel', 'korunma', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['manevi blokaj', 'ruhani baskı', 'korunma niyeti'],
    },
  ],
  specialDays: [],
};
