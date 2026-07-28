import { keyMap } from './keyMap.mjs';

export const saferAyi = {
  key: 'safer-ayi-2026',
  label: {
    tr: 'Safer Ayı 1448',
    en: 'Month of Safar 1448',
  },
  category: 'ibadet',
  description: {
    tr: "Hicri takvimin 2. ayı Safer. İslam inancında zamanın kendi başına uğursuzluk taşıyamayacağı; her belânın yalnızca Allah'ın takdiriyle gerçekleşeceği esasına dayanarak, ibadet, zikir ve dua ile bu ayın ihya edilmesi tavsiye edilmiştir.",
    en: "Safar is the second month of the Hijri calendar. In Islamic belief, time itself can bear no misfortune; every affliction comes to pass solely by the decree of Allah. Upon this principle, it is recommended to revive this month through worship, dhikr, and supplication.",
  },
  dhikrItems: [
    {
      key: keyMap.SAFER_GIRISI_DUASI,
      nameArabic:
        'اَللَّهُمَّ فَرِّجْنَا بِدُخُولِ الصَّفَرِ وَاخْتِمْ لَنَا بِالْخَيْرِ وَالظَّفَرِ',
      name: {
        tr: 'Safer Ayı Giriş Duası',
        en: "Supplication for the Entry of Safar",
      },
      transliteration: {
        tr: "Allâhümme ferricnâ biduhûli's-saferi vehtimlenâ bi'l-hayri ve'z-zaferi.",
        en: "Allahumma farrijna bidukhuli's-safar wakhtim lana bil-khayri waz-zafar.",
      },
      meaning: {
        tr: "Allah'ım! Bizi Safer ayının girişiyle ferahlat ve genişlet. Bize bu ayı hayırla ve zaferle tamamlat.",
        en: "O Allah! Grant us relief and expansion with the entry of Safar, and seal this month for us with goodness and triumph.",
      },
      virtue: {
        tr: "Safer ayının ilk on beş günü boyunca her gün 100 defa okunması son derece faziletlidir. Bu dua, kulun Safer ayına sığınan, Allah'ın genişliğine, hayrına ve zaferine talip olan bir yürekle girmesinin ifadesidir. İslam âlimleri, Safer'in kendi başına uğursuzluk taşımadığını; bilâkis her ayda olduğu gibi Safer'de de hayrın, bereketin ve güzelliğin mümkün olduğunu açıkça beyan etmişlerdir. Bu duayı her gün 100 kere okuyan kimsenin, ruhunda bir ferahlama ve genişlik hissedeceği, en hafifi fakirlik olmak üzere yetmiş türlü belanın üzerinden kaldırılacağı ümit edilir. Nitekim Peygamber Efendimiz (sas) hiçbir ayı veya günü uğursuz saymaz; her zaman ve mekânı Allah'ın bir ikramı olarak görürdü. Bu inanç çerçevesinde Safer'e dua ve ümitle girmek, kulun tevhid anlayışının ve Allah'a olan güveninin bir yansımasıdır.",
        en: "It is highly virtuous to recite this supplication 100 times each day throughout the first fifteen days of Safar. This supplication expresses the servant's entry into Safar seeking refuge in Allah, aspiring to His expansiveness, goodness, and triumph. Islamic scholars have clearly stated that Safar carries no inherent misfortune in itself; rather, as in every month, goodness, blessing, and beauty are possible in Safar too. It is hoped that whoever recites this supplication 100 times daily will experience a sense of relief and expansion in their soul, and that seventy types of calamity — the lightest of which is poverty — will be lifted from them. Indeed, the Prophet (peace be upon him) never considered any month or day to be inherently inauspicious; he regarded every time and place as a gift from Allah. Within this belief framework, entering Safar with supplication and hope is a reflection of the servant's understanding of tawhid and their trust in Allah.",
      },
      source: {
        tr: "Geleneksel Evrad Mecmuaları; Dualar ve Zikirler Kitabı",
        en: "Traditional Wird Collections; Book of Supplications and Dhikr",
      },
      tags: ['safer', 'aylık dua', 'korunma', 'bereket', 'giriş', 'özel gün', 'safer ayı girişi', 'beginning of the month of safar'],
      categories: ['dua', 'özel gün', 'korunma', 'safer'],
      timeOfDay: ['sabah', 'aksam'],
      recommendedCount: 100,
      suitableFor: ['safer ayı', 'bela koruması', 'manevi genişlik', 'herkes', 'safer ayı girişi', 'beginning of the month of safar'],
    },
    {
      key: keyMap.BISMILLAH_LA_YEDURRU,
      nameArabic:
        'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      name: {
        tr: 'Bismillâh Koruma Duası (Lâ Yedurru)',
        en: "Bismillah Protection Supplication (La Yadurru)",
      },
      transliteration: {
        tr: "Bismillâhillezî lâ yedurru me'asmihî şey'ün fi'l-ardı velâ fi's-semâi ve hüve's-semi'ul-alîm.",
        en: "Bismillahilladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa huwa's-sami'ul-'alim.",
      },
      meaning: {
        tr: "O Allah'ın ismiyle ki O'nun ismiyle birlikte olana ne yerde ne de gökte hiçbir şey zarar veremez. O hakkıyla işitendir, çok iyi bilendir.",
        en: "In the name of Allah, with whose name nothing in the earth or in the heaven can cause harm. He is the All-Hearing, the All-Knowing.",
      },
      virtue: {
        tr: "Sabah ve akşam üçer defa okunmasının, kişiyi o günün bütün bela ve musibetlerinden koruyacağı hadis-i şerifte bildirilmiştir. Safer ayı boyunca bu zikre devam etmek, manevi bir zırh gibi kişiyi sarar; özellikle ayın son çarşamba gecesinde 100 defa tekrarlanması, bir senelik belâlara karşı güçlü bir manevi kalkan oluşturur. Osman ibn Affân radıyallahu anh'tan rivayet edilen bu hadiste Peygamber Efendimiz (sas), bu duayı okuyup da herhangi bir belaya uğrayan kimsenin bulunmadığını belirtmiştir. Allah'ın isminin her türlü zarara karşı koruyucu bir güç taşıdığını ilan eden bu dua, Allah'a tam bir tevekkül ve güvenin veciz bir ifadesidir. Safer ayında kaygı, sıkıntı veya belirsizlik anında bu duanın okunması, kalbe sükûnet ve güven verir.",
        en: "It is reported in the hadith that reciting this supplication three times each morning and evening protects the person from all calamities and afflictions of that day. Persisting in this dhikr throughout Safar envelops the person like spiritual armor; reciting it 100 times on the last Wednesday night of the month in particular forms a powerful spiritual shield against the calamities of an entire year. In the hadith narrated from 'Uthman ibn 'Affan, may Allah be pleased with him, the Prophet (peace be upon him) stated that no one who recited this supplication was struck by any calamity. This supplication, which proclaims that the name of Allah carries a protective power against all harm, is a concise expression of complete tawakkul and trust in Allah. Reciting it in moments of anxiety, difficulty, or uncertainty during Safar brings tranquility and confidence to the heart.",
      },
      source: {
        tr: "Ebû Dâvûd, Tıb, 24; Mâü'l-'Ayneyn, Na'tü'l-bidâyât, s. 168",
        en: "Abu Dawood, Medicine, 24; Ma'u'l-'Aynayn, Na't al-Bidayat, p. 168",
      },
      tags: ['safer', 'korunma', 'sabah-akşam', 'bela', 'son çarşamba', 'nazar', 'dua', 'şifa', 'ani rahatsızlık', 'kaza', 'özel gün', 'safer ayı girişi', 'safer ilk çarşamba gecesi', 'safer son çarşamba gecesi', 'last wednesday night of safar', 'first wednesday night of safar', 'beginning of the month of safar'],
      categories: ['dua', 'korunma', 'özel gün', 'genel', 'hastalık', 'safer'],
      timeOfDay: ['sabah', 'aksam', 'gece'],
      recommendedCount: 100,
      suitableFor: ['safer ayı', 'bela koruması', 'son çarşamba', 'herkes', 'sabah akşam', 'ani belalara karşı', 'nazar korunması', 'ani rahatsızlık ve kaza', 'zehirlenme korunması', 'safer ayı girişi', 'safer ilk çarşamba gecesi', 'safer son çarşamba gecesi', 'last wednesday night of safar', 'first wednesday night of safar', 'beginning of the month of safar'],
    },
    {
      key: keyMap.SAFER_KORUNMA_DUASI,
      nameArabic:
        'اَللَّهُمَّ يَا شَدِيدَ الْقُوَى يَا شَدِيدَ الْمِحَالِ يَا عَزِيزُ يَا كَرِيمُ يَا كَبِيرُ يَا مُتَعَالُ زَلَّلْتَ بِعِزَّتِكَ جَمِيعَ خَلْقِكَ اكْفِنِي عَنْ جَمِيعِ خَلْقِكَ يَا مُحْسِنُ يَا مُجَمِّلُ يَا مُتَفَضِّلُ يَا مُنْعِمُ يَا مُكْرِمُ يَا اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
      name: {
        tr: "Safer Korunma Duası (Yâ Şedîdel Guvâ)",
        en: "Safar Protection Supplication (Ya Shadidal-Quwa)",
      },
      transliteration: {
        tr: "Allâhümme yâ şedîdel-guvâ yâ şedîdel-mihâli yâ azîzü yâ kerîmü yâ kebîrü yâ müteâl! Zellelte bi'izzetike cemîa halkike. İkfinî an cemîi halkike yâ muhsinü yâ mücemmilü yâ mütefaddilü yâ mün'imü yâ mükrim! Yâ allâhü lâ ilâhe illâ ente bi-rahmetike yâ erhamerrâhimîn.",
        en: "Allahumma ya shadidal-quwa ya shadidal-mihal ya 'Aziz ya Karim ya Kabir ya Muta'al! Zallalta bi'izzatika jami'a khalqik. Ikfini 'an jami'i khalqika ya Muhsin ya Mujammil ya Mutafaddil ya Mun'im ya Mukrim! Ya Allahu la ilaha illa anta bi-rahmatika ya Arhamar-rahimin.",
      },
      meaning: {
        tr: "Allah'ım! Ey kuvveti güçlü ve azabı şiddetli olan, Ey Azîz, Kerîm, Kebîr ve Müteal! İzzetinle bütün yaratıklarını zelil kıldın. Beni tüm mahlûkatına karşı yeterli kıl; ey Muhsin, Mücemmil, Mütefaddil, Mün'im ve Mükrim! Ey Allah! Senden başka ilah yoktur; rahmetinle muamele eyle, ey merhametlilerin en merhametlisi!",
        en: "O Allah! O You of intense power and severe might, O 'Aziz, Karim, Kabir and Muta'al! You have subdued all Your creation with Your might. Suffice me against all Your creation, O Muhsin, Mujammil, Mutafaddil, Mun'im and Mukrim! O Allah! There is no god but You; deal with us by Your mercy, O Most Merciful of the merciful!",
      },
      virtue: {
        tr: "Bu dua, Safer ayında her gün bir kere okunması halinde, o güne kadar yaşayan insanların okudukları zikirlerden çok daha fazla sevap kazanacağının müjdelendiği; Safer ayının her günü kesintisiz okunması halinde ise bir sonraki Safer ayına kadar semavi afetlerden, salgın hastalıklardan ve yerde ve gökte gelen her türlü bela ve musibetten korunacağı rivayet edilen büyük bir muhafaza duasıdır. Duada geçen Yâ Azîz, Yâ Kerîm, Yâ Kebîr, Yâ Müteal, Yâ Muhsin, Yâ Mücemmil, Yâ Mütefaddil, Yâ Mün'im, Yâ Mükrim gibi Allah'ın güzel isimleri (esma-i hüsna) sıralanarak, O'nun mutlak kudretine, sonsuz ikramına ve yüce merhametine iltica edilmektedir. Bu duayı Safer ayı boyunca günlük pratiğin bir parçası haline getirmek, kalbe ilahi güvence ve sükûnet kazandırır.",
        en: "It is narrated that whoever recites this supplication once each day in Safar will earn a reward surpassing the dhikr recited by all people who have lived before; and whoever recites it without interruption every day of Safar will be protected from celestial calamities, epidemic diseases, and every form of affliction descending from the sky or arising from the earth until the following Safar. In this supplication, the beautiful names of Allah (asma' al-husna) — Ya 'Aziz, Ya Karim, Ya Kabir, Ya Muta'al, Ya Muhsin, Ya Mujammil, Ya Mutafaddil, Ya Mun'im, Ya Mukrim — are invoked in succession, taking refuge in His absolute power, infinite generosity, and supreme mercy. Making this supplication a part of daily practice throughout Safar instils divine assurance and tranquility in the heart.",
      },
      source: {
        tr: "es-Seyyid Hasen Livâsânî, Mirkâtü'l-cinân",
        en: "al-Sayyid Hasan Livasani, Mir'at al-Jinan",
      },
      tags: ['safer', 'korunma', 'esma', 'bela', 'dua', 'özel gün', 'safer ayı girişi', 'beginning of the month of safar'],
      categories: ['dua', 'korunma', 'özel gün', 'safer'],
      timeOfDay: 'any',
      recommendedCount: 1,
      suitableFor: ['safer ayı', 'bela koruması', 'semavi koruma', 'herkes', 'safer ayı girişi', 'beginning of the month of safar'],
    },
    {
      key: keyMap.YA_HALIK,
      nameArabic: 'يَا خَالِقُ',
      name: {
        tr: 'Yâ Hâlik',
        en: 'Ya Khaliq',
      },
      transliteration: {
        tr: 'Yâ Hâlik.',
        en: 'Ya Khaliq.',
      },
      meaning: {
        tr: "Ey her şeyi yoktan var eden, gerçek ve tek yaratıcı olan Allah'ım!",
        en: "O Allah, the true and sole Creator who brought all things into existence from nothing!",
      },
      virtue: {
        tr: "el-Hâlik, Allah'ın güzel isimlerinden (esma-i hüsna) biri olup 'her şeyi yoktan var eden, takdir edip biçim veren' anlamına gelir. Allah'ın yaratma sıfatı mutlak ve benzersizdir; hiçbir yaratılmış varlık gerçek anlamda bir yaratıcı olamaz. Safer ayının son çarşamba gecesi, gelenekte özellikle belâların yoğunlaştığına inanılan bir gece olarak kabul edilir. Bu nedenle el-Hâlik ismini 100 defa zikretmek, yaratıcının mutlak gücüne sığınmak ve O'ndan başkasından gelecek her türlü zarar için O'na tevekkül etmek anlamı taşır. Allah'ı yaratan sıfatıyla zikreden kul, kendisini ve sevdiklerini yalnızca O'nun kudret ve iradesinin şekillendirdiğini kabul eder; böylece kalp, yaratılmış şeylerden duyulan korku yerine Yaratıcıya duyulan güvenle dolar.",
        en: "Al-Khaliq is one of the beautiful names of Allah (asma' al-husna), meaning 'the One who brings all things into existence from nothing, who measures and shapes creation.' Allah's attribute of creation is absolute and without parallel; no created being can be a true creator in any real sense. The last Wednesday of Safar is traditionally regarded as a night when calamities are believed to intensify. For this reason, reciting the name al-Khaliq 100 times carries the meaning of taking refuge in the absolute power of the Creator and placing one's trust in Him against every harm that might come from any other source. The servant who remembers Allah through His attribute of creation acknowledges that only His power and will shape themselves and their loved ones; thus the heart fills with trust in the Creator rather than fear of created things.",
      },
      source: {
        tr: "Mâü'l-'Ayneyn, Na'tü'l-bidâyât, s. 168",
        en: "Ma'u'l-'Aynayn, Na't al-Bidayat, p. 168",
      },
      tags: ['safer', 'esma', 'son çarşamba', 'korunma', 'özel gün', 'safer son çarşamba gecesi', 'last wednesday night of safar'],
      categories: ['zikir', 'esma', 'özel gün', 'safer'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['safer ayı', 'son çarşamba', 'ilahi koruma', 'herkes', 'safer son çarşamba gecesi', 'last wednesday night of safar'],
    },
    {
      key: keyMap.HASBUNALLAH_VEKIL,
      nameArabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
      name: {
        tr: "Hasbünallâhu ve Ni'mel Vekîl (Âl-i İmrân 173)",
        en: "Hasbunallahu wa Ni'mal-Wakil (Aal-i-Imran 3:173)",
      },
      transliteration: {
        tr: "Hasbünallâhu ve ni'mel vekîl.",
        en: "Hasbunallahu wa ni'mal-wakil.",
      },
      meaning: {
        tr: "Allah bize yeter; O ne güzel vekildir.",
        en: "Allah is sufficient for us; what an excellent Guardian He is.",
      },
      virtue: {
        tr: "Bu ayet-i kerime, sıkıntılı, endişeli ve musibetlerin yoğunlaştığı dönemlerde okunarak manevi teselli ve ilahi himaye aranır. Âl-i İmrân suresinin 173. ayetinde yer alan bu kudsi söz, İbrâhim aleyhisselâm ve müminlerin ateşe atılırken söylediği; Allah'a tam teslimiyet ve tevekkülün zirvesini ifade eden bir dua ve zikir cümlesidir. Peygamber Efendimiz (sas) de sıkıntı anında bu cümleyi okumuş ve ümmetine tavsiye etmiştir. Safer ayı boyunca günlük 40 kez tekrar edilmesi; kalbi dünyanın vesveselerinden arındırır, her türlü korku ve kaygıyı Allah'a havale etmeyi kolaylaştırır ve kişiye ruhî bir dinginlik kazandırır. Allah'ın hem kâfî (yeterli) hem de vekîl (işleri en iyi şekilde takdir eden) olduğunu kabul etmek; kulun en büyük manevî güvencesidir.",
        en: "This noble verse is recited in times of hardship, anxiety, and the intensification of calamities, seeking spiritual consolation and divine protection. Found in the 173rd verse of Surah Aal-i-Imran, this sacred phrase was uttered by Ibrahim (peace be upon him) and the believers when they were cast into the fire — it expresses the pinnacle of complete surrender and tawakkul in Allah. The Prophet (peace be upon him) also recited this phrase in moments of difficulty and recommended it to his community. Reciting it 40 times daily throughout Safar purifies the heart from the whisperings of the world, facilitates entrusting every fear and anxiety to Allah, and bestows spiritual serenity upon the person. Acknowledging that Allah is both al-Kafi (the All-Sufficient) and al-Wakil (the One who manages all affairs in the best manner) is the servant's greatest spiritual assurance.",
      },
      source: {
        tr: "Âl-i İmrân Suresi, 173. Ayet",
        en: "Quran, Surah Aal-i-Imran 3:173",
      },
      tags: ['safer', 'kuran', 'tevekkül', 'koruma', 'teslimiyet'],
      categories: ['kuran', 'dua', 'korunma'],
      timeOfDay: 'any',
      recommendedCount: 40,
      suitableFor: ['safer ayı', 'sıkıntı', 'tevekkül', 'ilahi himaye'],
    },
    {
      key: keyMap.RABBI_ENZELTELEYYE,
      nameArabic:
        'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
      name: {
        tr: "Rabbi İnnî Limâ Enzelte (Kasas 24)",
        en: "Rabbi Inni Lima Anzalta (Al-Qasas 28:24)",
      },
      transliteration: {
        tr: "Rabbi innî limâ enzelte ileyye min hayrin fakîr.",
        en: "Rabbi inni lima anzalta ilayya min khayrin faqir.",
      },
      meaning: {
        tr: "Rabbim! Bana indireceğin her hayra muhtacım.",
        en: "My Lord! I am in need of whatever good You send down to me.",
      },
      virtue: {
        tr: "Bu ayet-i kerime, Hz. Musa aleyhisselâmın Medyen'e sığındığında — yorgun, aç ve kimsesiz bir halde — Allah'a yaptığı yakarışın ta kendisidir. Acizliğin ve ihtiyacın en veciz ikrarı olan bu dua cümlesi, kulun sözü dolaştırmadan, süslü ifadeler kullanmadan, yalnızca 'Rabbim, Sen'den gelecek her hayra muhtacım' diyerek Allah'a yönelmesinin güçlü örneğidir. Safer ayında rızık genişliği, ihtiyaçların karşılanması ve darlıkların giderilmesi niyetiyle günlük 7 defa okunması tavsiye edilir. Bu dua sayesinde kul, hem maddî hem de manevî rızık kapısında Allah'ın sonsuz hazinesine iltica eder; tevekkülü derinleşir, kapıların yalnızca O'nun eliyle açıldığına olan inancı pekişir. Kur'an'ın bu güzel duası, her çağda ve her sıkıntıda kul ile Rabbi arasında kurulan en sade ve derin köprüdür.",
        en: "This noble verse is the very supplication that Musa (peace be upon him) made when he took refuge in Madyan — exhausted, hungry, and alone. This phrase, the most concise acknowledgment of helplessness and need, is a powerful example of the servant turning to Allah without circumlocution or ornate expressions, saying simply: 'My Lord, I am in need of whatever good You send down to me.' It is recommended to recite it 7 times daily throughout Safar with the intention of seeking abundance in provision, the fulfillment of needs, and the lifting of hardship. Through this supplication the servant takes refuge in Allah's infinite treasury at the door of both material and spiritual provision; their tawakkul deepens, and their conviction that doors are opened only by His hand is strengthened. This beautiful Quranic supplication is the simplest and most profound bridge between the servant and their Lord in every era and in every difficulty.",
      },
      source: {
        tr: "Kasas Suresi, 24. Ayet",
        en: "Quran, Surah Al-Qasas 28:24",
      },
      tags: ['safer', 'kuran', 'rızık', 'dua', 'ihtiyaç'],
      categories: ['kuran', 'dua', 'rızık'],
      timeOfDay: ['sabah', 'ogle'],
      recommendedCount: 7,
      suitableFor: ['safer ayı', 'rızık talebi', 'ihtiyaç duası', 'herkes'],
    },
    {
      key: keyMap.SAFER_MUAFAZA_DUASI,
      nameArabic:
        'اَللَّهُمَّ اعْصِمْنَا مِنْ جَهْدِ الْبَلَاءِ وَدَرَكِ الشَّقَاءِ وَسُوءِ الْقَضَاءِ وَشَمَاتَةِ الْأَعْدَاءِ وَهُجُومِ الْوَبَاءِ وَمَوْتِ الْفُجْأَةِ وَمِنْ زَوَالِ النِّعْمَةِ وَتَغَيُّرِ الْعَافِيَةِ وَمِنَ الْبَرَصِ وَالْجُذَامِ وَالْبِرْسَامِ وَالْحُمَّى وَالشَّقِيقَةِ وَالْأَمْرَاضِ وَالْأَسْقَامِ بِفَضْلِكَ وَجُودِكَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ وَسَلَّمَ تَسْلِيمًا',
      name: {
        tr: 'Safer Muhafaza Duası (Şifa Suyu Sonrası)',
        en: 'Safar Protection Supplication (After the Healing Water)',
      },
      transliteration: {
        tr: "Allâhümme'simna min cehdil-belâi ve derekiş-şakâi ve sûil-kazâi ve şemâtetil-a'dâi ve hücûmil-vebâi ve mevtil-fücâti ve min zevâlin-ni'meti ve tegayyüril-âfiyeti ve minel-berasi vel-cüzâmi vel-birsâmi vel-hummâ veş-şakîkati vel-emrâdi vel-eskâmi bi-fadlike ve cûdike yâ zel-celâli vel-ikrâm! Bi-rahmetike yâ erhamer-râhimîn! Ve sallallâhü alâ seyyidinâ Muhammedin ve âlihî ve selleme teslîmâ.",
        en: "Allahumma'simna min jahdil-bala'i wa darakish-shaqa'i wa su'il-qada'i wa shamatat il-a'da'i wa hujumil-waba'i wa mawtil-fuja'ati wa min zawalin-ni'mati wa taghayyuril-'afiyati wa minal-barasi wal-judami wal-birsami wal-humma wash-shaqiqati wal-amradi wal-asqami bi-fadlika wa judika ya dhal-jalali wal-ikram! Bi-rahmatika ya Arhamar-rahimin! Wa sallallahu 'ala sayyidina Muhammadin wa alihi wa sallama taslima.",
      },
      meaning: {
        tr: "Allah'ım! Bizi şiddetli beladan, şakavetin ele geçirmesinden, kötü kazadan, düşmanların sevinmesinden, salgın hastalığın saldırısından, ani ölümden; nimetin zevâl bulmasından, âfiyetin değişmesinden; alaca hastalığından, cüzzamdan, zatürreden, hummadan, migrenden, hastalık ve sakatlıklardan; fazlın ve cömertliğinle koru, ey Celâl ve İkrâm Sahibi! Rahmetinle, ey merhametlilerin en merhametlisi! Allah, Efendimiz Muhammed'e (sas), ailesine salat etsin ve tam bir selam ile selam eylesin.",
        en: "O Allah! Protect us from the severity of calamity, from being overtaken by wretchedness, from an evil decree, from the rejoicing of enemies, from the onslaught of plague, and from sudden death; from the loss of blessings and the change of well-being; from leprosy, from leprosy disease, from pleurisy, from fever, from migraine, from illness and infirmity — by Your grace and generosity, O Possessor of Majesty and Honor! By Your mercy, O Most Merciful of the merciful! May Allah bestow salat upon our master Muhammad (peace be upon him), his family, and grant them complete peace.",
      },
      virtue: {
        tr: "Bu dua, Safer'in son çarşamba gecesine özgü kadim bir geleneğin parçasıdır: O gece selam ayetleri gül suyu ve misk karıştırılmış saf suya yazılarak şifa suyuna bırakılır; hane halkı şifa niyetiyle bu suyu içer ve ardından bu muhafaza duası okunur. Dua, kulun şiddetli beladan, kötü kazadan, ani ölümden, salgın ve her türlü fizikî ile ruhî hastalıktan Allah'ın sonsuz fazlına sığındığını ilan eder. Duanın sonundaki salat-ü selam ifadesiyle dua, Peygamber Efendimiz (sas) vasıtasıyla Allah'a ulaştırılmak üzere güçlendirilir. Âlimlerin naklettiği rivayetlere göre bu dua; Safer boyunca süregelen bütün ibadet ve zikirlerin taçlanması ve senenin geri kalanı için ilahi muhafazanın talep edilmesi işlevi görür.",
        en: "This supplication is part of an ancient tradition specific to the last Wednesday night of Safar: on that night, the verses of peace are written on pure water mixed with rose water and musk to create healing water; the members of the household drink this water with the intention of healing, and then this protection supplication is recited. The supplication declares the servant's taking of refuge in Allah's infinite grace from the severity of calamity, an evil decree, sudden death, plague, and every form of physical and spiritual illness. The salat and salam at the end of the supplication strengthens the prayer by directing it to Allah through the intercession of the Prophet (peace be upon him). According to narrations transmitted by scholars, this supplication serves as the crowning of all worship and dhikr maintained throughout Safar, and as a petition for divine protection for the remainder of the year.",
      },
      source: {
        tr: "Muhammed Ebu'l-Yüsr Âbidîn, Tenbîhu'l-kulûbi'n-nâime ale'l-evrâdi'd-dâime",
        en: "Muhammad Abu'l-Yusr 'Abidin, Tanbih al-Qulub al-Na'ima 'ala al-Awrad al-Da'ima",
      },
      tags: ['safer', 'son çarşamba', 'şifa suyu', 'korunma', 'bela', 'hastalık', 'özel gün', 'safer son çarşamba gecesi', 'last wednesday night of safar'],
      categories: ['dua', 'korunma', 'şifa', 'özel gün', 'safer'],
      timeOfDay: ['gece', 'sabah'],
      recommendedCount: 1,
      suitableFor: ['safer ayı', 'son çarşamba', 'şifa niyeti', 'bela koruması', 'safer son çarşamba gecesi', 'last wednesday night of safar'],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Safer Ayı Girişi — İlk Gece',
        en: 'Beginning of the Month of Safar — First Night',
      },
      type: 'özel gün',
      date: '2026-07-15',
      hijriDate: '1 Safer 1448',
      description: {
        tr: "Safer'e giriş gecesi: yatsi namazının ardından, vitirden önce 4 rekatlık nafile (1. Kafirun, 2. 11x İhlas, 3. Felak, 4. Nas) kılınır; akabinde 70x birleşik tesbih ve Safer girişi duası okunur. İlk 15 gün boyunca giriş duası günde 100x tekrarlanır.",
        en: "The night of entering Safar: after the Isha prayer and before the Witr, a four-rakat voluntary prayer is performed (1st: al-Kafirun, 2nd: 11x al-Ikhlas, 3rd: al-Falaq, 4th: an-Nas); thereafter 70x of the combined tasbih and the supplication for the entry of Safar are recited. Throughout the first 15 days, the entry supplication is repeated 100x each day.",
      },
      eventKey: 'safer-ayi-2026',
      priority: 150,
      dhikrKeys: [
        keyMap.SAFER_GIRISI_DUASI,
        keyMap.BISMILLAH_LA_YEDURRU,
        keyMap.SAFER_KORUNMA_DUASI,
        keyMap.LA_HAVLE,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Safer İlk Çarşamba Gecesi',
        en: 'First Wednesday Night of Safar',
      },
      type: 'özel gün',
      date: '2026-07-15',
      hijriDate: '1 Safer 1448',
      description: {
        tr: "Safer'in ilk çarşamba gecesi teheccüd vaktinde 4 rekat kılınır: her rekatta Fatiha + 17x Kevser + 5x İhlas + 1x Felak + 1x Nas. 1448'de 1 Safer, çarşambaya denk gelmektedir.",
        en: "On the first Wednesday night of Safar, a four-rakat prayer is performed at the time of Tahajjud: in each rakat al-Fatihah + 17x al-Kawthar + 5x al-Ikhlas + 1x al-Falaq + 1x an-Nas. In 1448, the 1st of Safar falls on a Wednesday.",
      },
      eventKey: 'safer-ayi-2026',
      priority: 148,
      dhikrKeys: [
        keyMap.BISMILLAH_LA_YEDURRU,
        keyMap.LA_HAVLE,
        keyMap.SUBBUHEN_KUDDUSUN,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Safer Son Çarşamba Gecesi',
        en: 'Last Wednesday Night of Safar',
      },
      type: 'özel gün',
      date: '2026-08-12',
      hijriDate: '29 Safer 1448',
      description: {
        tr: "Safer'in en çetin gecesi: teheccüd vaktinde 4 rekat namaz; ardından selam ayetleri gül suyu/misk karışımlı saf suya yazılarak şifa suyuna bırakılır; hane halkı şifa niyetiyle içer ve muhafaza duası okunur. Bismillah koruma duası 100x, Yâ Hâlik 100x, Sübbûhun Kuddûs 100x zikredilir.",
        en: "The most trying night of Safar: a four-rakat prayer is performed at the time of Tahajjud; thereafter the verses of peace (salam) are written upon pure water mixed with rose water and musk and left to become a water of healing; the household drinks it with the intention of healing, and the supplication of protection is recited. The Bismillah protection supplication is invoked 100x, Ya Khaliq 100x, and Subbuhun Quddus 100x.",
      },
      eventKey: 'safer-ayi-2026',
      priority: 158,
      dhikrKeys: [
        keyMap.BISMILLAH_LA_YEDURRU,
        keyMap.LA_HAVLE,
        keyMap.YA_HALIK,
        keyMap.SUBBUHEN_KUDDUSUN,
        keyMap.SAFER_MUAFAZA_DUASI,
      ],
    },
  ],
};
