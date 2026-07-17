import { keyMap } from './keyMap.mjs'

export const salavat = {
  key: 'salavat',
  label: 'Salavat ve Selam',
  category: 'dua',
  description: "Hz. Peygamber'e salavat getirme formları ve faziletleri.",
  dhikrItems: [
    {
      key: keyMap.SALAVAT_SERIF,
      nameArabic:
        'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
      name: {
        tr: 'Mevlid Salavatı',
        en: 'Mawlid Salawat',
      },
      transliteration: {
        tr: 'Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
        en: 'Allahumma salli ala sayyidina Muhammadin wa ala ali sayyidina Muhammad.',
      },
      meaning: {
        tr: "Allah'ım, Efendimiz Muhammed'e ve O'nun âline salât eyle.",
        en: "O Allah, bestow Your blessings upon our Master Muhammad and upon the family of our Master Muhammad.",
      },
      virtue: {
        tr: "Salavat-ı Şerife, kalbi Resûlullah sevgisiyle dirilten en bereketli zikirlerdendir. Kişiye manevi huzur, gönül ferahlığı ve iç sükûnet kazandırır. Peygamber Efendimiz'e yapılan her salavatın rahmet kapılarını açtığı rivayet edilmiştir. Salavat, duaların kabulüne vesile olan kıymetli ameller arasında görülür. Sürekli salavat getiren kimsenin kalbi yumuşar, dili güzelleşir ve manevi bağı kuvvetlenir. Sıkıntı anlarında salavat okumak, kalbe teselli ve umut verir. Günahlara kefaret ve derecelerin yükselmesine vesile olduğu bildirilmiştir. Salavat, kişinin hayatına bereket ve nur katan bir ibadet olarak kabul edilir. Meleklerin salavat ehline dua ettiği ve rahmetle yaklaştığı rivayet edilir. Resûlullah'a sevgiyle getirilen her salavat, müminin kalbini Allah'a daha yakın hâle getirir.",
        en: "The Salawat al-Sharifa is among the most blessed forms of dhikr, reviving the heart with love for the Messenger of Allah (peace be upon him). It brings spiritual tranquility, openness of the heart, and inner peace. It is narrated that every salawat upon the Prophet (peace be upon him) opens the gates of divine mercy. Salawat is considered among the most meritorious deeds that serve as a means for supplications to be accepted. One who consistently recites salawat finds their heart softened, their tongue beautified, and their spiritual connection strengthened. Reciting salawat in moments of difficulty brings consolation and hope to the heart. It has been reported to be an expiation for sins and a means of elevation in degrees. Salawat is regarded as an act of worship that brings blessing and light into one's life. It is narrated that angels pray for those who recite salawat and draw near them with mercy. Every salawat brought with sincere love for the Messenger brings the believer's heart closer to Allah.",
      },
      source: {
        tr: 'Salavat fazileti rivayetleri',
        en: 'Narrations on the Virtue of Salawat',
      },
      tags: ['kurban bayramı', 'salavat'],
      categories: ['özel gün', 'bayram'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: [
        'gün boyu',
        'namaz sonrası',
        'peygamber sevgisi',
        'manevi huzur',
        'dua öncesi',
        'dua kabulü',
        'kalp huzuru',
        'bereket',
        'rahmet',
        'şefaat ümidi',
        'manevi yakınlık',
        'iç ferahlığı',
        'cuma günü',
        'salih amel',
        'sünnete bağlılık',
        'manevi güçlenme',
      ],
    },
    {
      key: keyMap.SELLIM_BARIK,
      nameArabic:
        'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
      name: {
        tr: 'Salavat-ı Şerife (Salli Sellim Barik)',
        en: 'Salawat al-Sharifa (Salli Sellim Barik)',
      },
      transliteration: {
        tr: 'Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
        en: 'Allahumma salli wa sallim wa barik ala sayyidina Muhammadin wa ala ali sayyidina Muhammad.',
      },
      meaning: {
        tr: "Allah'ım, Efendimiz Muhammed'e ve O'nun âline salât, selam ve bereket ihsan eyle.",
        en: "O Allah, bestow Your blessings, peace, and grace upon our Master Muhammad and upon the family of our Master Muhammad.",
      },
      virtue: {
        tr: 'Peygamber sevgisini artırır, sünnete bağlılığı güçlendirir ve kalpte rahmet-bereket bilincini canlı tutar. Bu salavat, hem salavatın hem selâmın hem de bereketin üçünü birden zikrederek daha kapsamlı bir ihsânı Allah\'tan niyaz eder. Her üç dilekte bulunmak, mümin için manevi açıdan çok yönlü bir bağlanma ve teslimiyet ifadesidir. Cuma günleri, kandil gecelerinde ve meclislerin başında bu formülü okumak tavsiye edilir.',
        en: "This salawat strengthens love for the Prophet (peace be upon him), reinforces adherence to the Sunnah, and keeps alive in the heart an awareness of divine mercy and blessing. By combining salat, salam, and barakah in one supplication, it seeks a more comprehensive bestowal of grace from Allah. Invoking all three is a spiritually multifaceted expression of devotion and submission for the believer. It is recommended to recite this formula on Fridays, on blessed nights, and at the beginning of gatherings.",
      },
      source: {
        tr: 'Salavat fazileti rivayetleri',
        en: 'Narrations on the Virtue of Salawat',
      },
      tags: ['mevlid kandili', 'salavat', 'bereket', 'peygamber sevgisi'],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['salavat', 'peygamber sevgisi', 'manevi bereket'],
    },
    {
      key: keyMap.MUNCIYE,
      nameArabic:
        'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ، وَتَقْضِي لَنَا بِهَا جَمِيعَ الْحَاجَاتِ، وَتُطَهِّرُنَا بِهَا مِنْ جَمِيعِ السَّيِّئَاتِ، وَتَرْفَعُنَا بِهَا أَعْلَى الدَّرَجَاتِ، وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ، مِنْ جَمِيعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ',
      name: {
        tr: 'Salât-ı Tüncîna (Salât-ı Münciye)',
        en: "Salat al-Tunjina (Salat al-Munjiya — The Delivering Prayer)",
      },
      transliteration: {
        tr: "Allâahumme salli alâ seyyidinâ Muhammedin, salâten tüncînâ bihâ min cemîil ehvâali vel âfât, ve takdî lenâ bihâ cemî'al hâcât, ve tutahhirunâ bihâ min cemî'isseyyi'âat ve terfe'unâ bihâ a'ledderecâat, ve tübelliğunâ bihâ aksa'l gayât, min cemî'il hayrâti fi'l hayâti ve ba'del memâat.",
        en: "Allahumma salli ala sayyidina Muhammadin, salatan tunjina biha min jami'il ahwali wal-afat, wa taqdiy lana biha jami'al-hajat, wa tutahhiruna biha min jami'is-sayyi'at, wa tarfa'una biha a'lad-darajat, wa tuballiguna biha aqsal-ghayat, min jami'il-khayrati fil-hayati wa ba'dal-mamat.",
      },
      meaning: {
        tr: "Allah'ım! Peygamber Efendimiz Hazret-i Muhammed Mustafâ'ya salât eyle. Öyle bir salât ki; o salât vesîlesiyle bizi bütün korku ve âfetlerden kurtar, bütün ihtiyaçlarımızı gider, bizi bütün günahlardan temizle, bizi derecelerin en yücesine yükselt ve onun vesîlesiyle bizi, hayâtta ve ölümden sonra bütün hayırların en son noktasına ulaştır.",
        en: "O Allah! Bestow Your blessings upon our Master Muhammad — a salawat through which You deliver us from all fears and afflictions, fulfill for us all our needs, purify us from all sins, raise us to the highest of degrees, and through which You bring us to the furthest ends of all goodness, in this life and after death.",
      },
      virtue: {
        tr: 'Korku, bela, deprem ve afetlerden korunmaya vesile bir kalkan duası olarak aktarılır. Darda kalan, korku içinde olan ve çıkış yolu arayan kimselerin bu salavata sarılması tavsiye edilir. Münciye; "kurtaran" demektir ve her türlü sıkıntıdan kurtuluşu ifade eder. Bu salavat, Berat Kandili gecesi ihya programlarında özellikle yer alır. Birçok tasavvuf geleneğinde kırk bir kez okunması tavsiye edilmiştir.',
        en: "This salawat is transmitted as a protecting shield and means of salvation from fear, afflictions, earthquakes, and calamities. It is recommended that those in distress, in fear, or seeking a way out cling to this salawat. 'Munjiya' means 'the delivering one,' signifying deliverance from all hardship. This salawat is specifically featured in the devotional programs of Laylat al-Bara'ah. Many Sufi traditions recommend reciting it forty-one times.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'korunma', 'münciye'],
      categories: ['kandil', 'özel gün', 'salavat', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: ['afetlerden korunma', 'korku anları', 'emniyet duası'],
    },
    {
      key: 'salavat-ibrahimiyye',
      nameArabic:
        'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
      name: {
        tr: 'Salavât-i İbrahimiyye',
        en: 'Salawat al-Ibrahimiyya',
      },
      transliteration: {
        tr: `Allàhümme salli alâ Muhammedin ve alâ âli Muhammed, kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd. Allàhümme bârik alâ Muhammedin ve alâ âli Muhammed, kemâ bârekte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd.`,
        en: `Allahumma salli ala Muhammadin wa ala ali Muhammad, kama sallayta ala Ibrahima wa ala ali Ibrahim, innaka Hamidum Majid. Allahumma barik ala Muhammadin wa ala ali Muhammad, kama barakta ala Ibrahima wa ala ali Ibrahim, innaka Hamidum Majid.`,
      },
      meaning: {
        tr: `Allah'ım! İbrâhim'e ve İbrâhim'in âilesine salât ettiğin gibi Muhammed'e ve Muhammed'in âilesine de salât et; şüphesiz sen övülmeye lâyık ve yüce olansın. Allah'ım! İbrâhim'e ve İbrâhim'in âilesine bereket ihsân ettiğin gibi Muhammed'e ve Muhammed'in âilesine de bereket ihsân et; şüphesiz sen övülmeye lâyık ve yüce olansın.`,
        en: `O Allah! Bestow Your blessings upon Muhammad and the family of Muhammad, just as You bestowed Your blessings upon Ibrahim and the family of Ibrahim; indeed, You are the Most Praiseworthy, the Most Glorious. O Allah! Bestow Your grace upon Muhammad and the family of Muhammad, just as You bestowed Your grace upon Ibrahim and the family of Ibrahim; indeed, You are the Most Praiseworthy, the Most Glorious.`,
      },
      virtue: {
        tr: `Ebû Mes'ûd el-Ensârî radıyallahu anhın rivâyetine göre Resûlullah (sas) şöyle buyurdu: "Muhakkak ki Allah, İbrâhim milletine Hz. İbrâhim'e yaptığı gibi, bana da salât etmesini size emretti." Bir başka rivâyette Hz. Ka'b b. Ucre radıyallahu anha sahabeler "Ya Resûlallah, sana nasıl selam edeceğimizi öğrendik, ama nasıl salât getireceklerimizi bilmiyoruz" deyince bu formülü öğretti (Buhârî/Müslim). Bu salavat, Kur'ân-ı Kerîm'in "Allah ve melekleri Peygamber'e salât eder; ey iman edenler siz de ona salât ve selam getirin" (Ahzab, 56) emrinin fiilî karşılığıdır. "Her kim bana bir salât getirirse Allah da ona on salât getirir" hadisi (Müslim) göz önünde bulundurulduğunda, bu dua hem en derli hem de en büyük geri dönüşü olan zikirlerden biridir.`,
        en: `According to the narration of Abu Mas'ud al-Ansari (may Allah be pleased with him), the Messenger of Allah (peace be upon him) said: "Indeed Allah has commanded you to send salawat upon me just as He commanded the community of Ibrahim to do so for Ibrahim." In another narration, when the Companions said, "O Messenger of Allah, we have learned how to give you salam, but we do not know how to send salawat upon you," he taught them this very formula (Bukhari/Muslim). This salawat is the practical fulfillment of the Quranic command: "Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and salute him with a worthy salutation" (Al-Ahzab 33:56). Considering the hadith "Whoever sends one salawat upon me, Allah sends ten blessings upon him" (Muslim), this supplication is among the most comprehensive and highest-return forms of dhikr.`,
      },
      source: {
        tr: `Buhârî, Enbiyâ, 10 (3370); Müslim, Salât, 65–66 (405–406)`,
        en: `Sahih al-Bukhari, Book of the Prophets, 10 (3370); Sahih Muslim, Salat, 65–66 (405–406)`,
      },
      tags: ['salavat', 'Hz. Muhammed', 'günlük', 'zikir', 'bereket'],
      categories: ['salavat', 'günlük', 'zikir'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: ['cuma'],
      suitableFor: [
        'her zaman',
        'günlük salavat',
        'cuma günü',
        'dua öncesi ve sonrası',
        'bereket için',
      ],
    },
    {
      key: 'salavat-cuma-cok-getir',
      nameArabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
      name: {
        tr: 'Cuma Günü Salavat',
        en: "Friday Salawat",
      },
      transliteration: {
        tr: `Allàhümme salli ve sellim alâ nebiyyinâ Muhammed.`,
        en: `Allahumma salli wa sallim ala nabiyyina Muhammad.`,
      },
      meaning: {
        tr: `Allah'ım! Peygamberimiz Muhammed'e salât et ve selâmet ver.`,
        en: `O Allah! Bestow Your blessings and grant peace upon our Prophet Muhammad.`,
      },
      virtue: {
        tr: `Evs b. Evs radıyallahu anhdan rivâyet edildiğine göre Resûlullah (sas) şöyle buyurdu: "Günlerin en faziletlisi Cuma günüdür. O gün Âdem aleyhisselâm yaratıldı, o gün vefat etti; o gün sûr üflenecek, o gün büyük sarsıntı olacak. O gün bana çok salavat getirin; zira salavatlarınız bana arz edilir." Sahabeler: 'Bedenin çürüdükten sonra salavatımız nasıl arz edilir?' diye sorduklarında, Resûlullah: 'Allah yeryüzüne nebilerin bedenlerini yemeyi haram kılmıştır' buyurdu. Bir başka rivâyette "Kim bana Cuma günü seksen salavat getirirse, seksen yıllık günahı bağışlanır" hadisi de bu günün özel değerine işaret eder.`,
        en: `According to the narration of Aws ibn Aws (may Allah be pleased with him), the Messenger of Allah (peace be upon him) said: "The best of your days is Friday. On it Adam (peace be upon him) was created, on it he died, on it the Trumpet will be blown, and on it the universal shaking will occur. So send many blessings upon me on that day, for your salawat are presented to me." The Companions asked: "How will our salawat be presented to you when your body has decomposed?" He replied: "Allah has forbidden the earth from consuming the bodies of the Prophets." In another narration, "Whoever sends eighty salawat upon me on Friday will have eighty years of sins forgiven" — pointing further to the special worth of this day.`,
      },
      source: {
        tr: `Ebû Dâvûd, Salât, 207 (1531); İbn Mâce, İkâme, 79 (1636); sahîh`,
        en: `Abu Dawood, Salat, 207 (1531); Ibn Majah, Iqama, 79 (1636); sahih`,
      },
      tags: ['salavat', 'cuma', 'haftalık', 'özel gün'],
      categories: ['salavat', 'günlük', 'özel günler'],
      timeOfDay: 'any',
      recommendedCount: 80,
      specialDays: ['cuma'],
      suitableFor: [
        'cuma günü özellikle',
        'haftalık ibadet',
        'günah silme niyetiyle',
      ],
    },
    {
      key: 'salavat-kiyamette-yakin',
      nameArabic:
        'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ وَسَلِّمْ',
      name: {
        tr: 'Kısa Günlük Salavat',
        en: 'Short Daily Salawat',
      },
      transliteration: {
        tr: `Allàhümme salli alâ Muhammedin ve alâ âli Muhammedin ve sellim.`,
        en: `Allahumma salli ala Muhammadin wa ala ali Muhammadin wa sallim.`,
      },
      meaning: {
        tr: `Allah'ım! Muhammed'e ve Muhammed'in âilesine salât et ve selâmet ver.`,
        en: `O Allah! Bestow Your blessings upon Muhammad and the family of Muhammad, and grant them peace.`,
      },
      virtue: {
        tr: `Abdullah b. Mes'ûd radıyallahu anhdan rivâyet edildiğine göre Resûlullah (sas) şöyle buyurdu: "Kıyamet günü insanların bana en yakını, bana en çok salavat getirendir." Tirmizî bu hadisi hasen kabul etmiştir. Bunun yanı sıra "benim yanımda adı anılıp da bana salavat getirmeyen kişi cimridir" buyurmuş (Tirmizî, Deavât 100); kişinin adını duyduğu, söylediği ya da düşündüğü her anda bu kısa formülle hem şeref hem yakınlık kazanabileceğini göstermiştir.`,
        en: `According to the narration of Abdullah ibn Mas'ud (may Allah be pleased with him), the Messenger of Allah (peace be upon him) said: "The closest of people to me on the Day of Resurrection will be those who sent the most salawat upon me." At-Tirmidhi graded this hadith as hasan. He also said: "The miser is the one in whose presence I am mentioned yet he does not send salawat upon me" (At-Tirmidhi, Dawa't, 100) — demonstrating that with this brief formula, one may attain both honor and nearness every time the Prophet's blessed name is heard, spoken, or brought to mind.`,
      },
      source: {
        tr: `Tirmizî, Vitr, 21 (484); hasen`,
        en: `At-Tirmidhi, Witr, 21 (484); hasan`,
      },
      tags: ['salavat', 'kısa', 'günlük', 'zikir'],
      categories: ['salavat', 'günlük', 'zikir'],
      timeOfDay: 'any',
      recommendedCount: 100,
      specialDays: [],
      suitableFor: [
        'her zaman',
        'kısa günlük zikir olarak',
        'Hz. Peygamber anıldığında',
        'dua başlamadan önce',
        'tesbih yerine',
      ],
    },
    {
      key: keyMap.KEMALILLAHI,
      nameArabic:
        'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ عَدَدَ كَمَالِ اللّٰهِ وَكَمَا يَلِيقُ بِكَمَالِهِ',
      name: {
        tr: 'Kema Lillahi Salavatı',
        en: "Salawat Kama Lillahi (As Befits the Perfection of Allah)",
      },
      transliteration: {
        tr: 'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedin ve alâ âlihi adede kema-lillahi ve kema yeligu bikemâlih.',
        en: "Allahumma salli wa sallim wa barik ala sayyidina Muhammadin wa ala alihi adada kamali'llahi wa kama yaleequ bikamalihi.",
      },
      meaning: {
        tr: "Allah'ım, Efendimiz Muhammed'e ve âline Senin kemaline yaraşır şekilde salat, selam ve bereket ihsan eyle.",
        en: "O Allah, bestow Your blessings, peace, and grace upon our Master Muhammad and his family, in a manner that befits Your own perfection and to a measure equal to the perfection of Allah.",
      },
      virtue: {
        tr: 'Tek bir okunuşta yetmiş bin salavatın manevi sevabına eşdeğer kabul edilen salavat tertibidir. Kemalin sonsuzluğuna atıf yapılarak Allah\'ın zatına yakışır bir düzeyde salât talep edilmektedir. Bu yüce niyet ve kapsam itibarıyla diğer salavat tertiplerinden ayrışır; manevi mertebe arayanlar ve salavat hatmi yapanlar için bilhassa tavsiye edilir.',
        en: "This salawat composition is considered equivalent in spiritual merit to seventy thousand salawat in a single recitation. By invoking the infinity of divine perfection, it requests from Allah a salawat befitting His own exalted essence. It is distinguished from other salawat formulas in its lofty intention and scope, and is especially recommended for those seeking spiritual elevation and for those undertaking a khatm of salawat.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'kemal', 'bereket'],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['salavat hatmi', 'manevi bereket', 'peygamber sevgisi'],
    },
    {
      key: keyMap.DELAIL_HAYRAT,
      nameArabic:
        'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ صَلَاةً تُعَادِلُ جَمِيعَ صَلَوَاتِ أَهْلِ مَحَبَّتِكَ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ سَلَامًا يُعَادِلُ سَلَامَهُمْ',
      name: {
        tr: "Delailü'l-Hayrat Dengi Salavat",
        en: "Salawat Equivalent to Dala'il al-Khayrat",
      },
      transliteration: {
        tr: "Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âlihi salâten te'dilü cemî'a salevâti ehli mehabbetike ve sellim alâ seyyidinâ Muhammedin ve alâ âlihi selâmen ya'dilü selâmehüm.",
        en: "Allahumma salli ala sayyidina Muhammadin wa ala alihi salatan ta'dilu jami'a salawati ahli mahabbatika wa sallim ala sayyidina Muhammadin wa ala alihi salaman ya'dilu salamahum.",
      },
      meaning: {
        tr: 'Allahım, Efendimiz Muhammede ve âline, muhabbet ehlinin tüm salavatlarına denk bir salat; onların selamlarına denk bir selam eyle.',
        en: "O Allah, bestow upon our Master Muhammad and his family a salawat equivalent to all the salawat of the people of Your love, and grant our Master Muhammad and his family a peace equivalent to all of their salams.",
      },
      virtue: {
        tr: "Üç kez okunduğunda tüm muhabbet ehlinin salavatlarının toplamına ve Delailü'l-Hayrat okumaya denk sayılan bir salavat tertibidir. Derin bir muhabbet ve niyet taşımaktadır; okunurken Allah'ın sevdiklerinin tamamına duyulan bağlılık ve sevgi kalbe yansır. Kandil gecelerinde ve salavat programlarında bu salavata yer vermek, manevi derinliği artırır.",
        en: "Recited three times, this salawat composition is considered equivalent in merit to the sum of all salawat of the people of divine love and to a full recitation of Dala'il al-Khayrat. It carries a profound depth of love and intention; as it is recited, the heart reflects a devotion and affection toward all whom Allah loves. Including this salawat in blessed night observances and salawat programs deepens one's spiritual experience.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'delail', 'muhabbet'],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: [
        'muhabbet ehli niyeti',
        'salavat programı',
        'kandil gecesi',
        'manevi bereket',
      ],
    },
    {
      key: keyMap.NUR_ZATIYYE,
      nameArabic:
        'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ نُورِ الذَّاتِ وَالسِّرِّ السَّارِي فِي جَمِيعِ الْأَسْمَاءِ وَالصِّفَاتِ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ عَدَدَ مَا فِي عِلْمِكَ مُضَاعَفًا بِدَوَامِكَ',
      name: {
        tr: 'Nur-u Zatiyye Salavatı',
        en: "Salawat al-Nur al-Zatiyya (The Light of the Divine Essence)",
      },
      transliteration: {
        tr: "Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedin nûri'z-zâti ve's-sirri's-sârî fî cemî'i'l-esmâi ve's-sıfât, ve alâ âlihî ve sahbihî ve sellim adede mâ fî ilmike muzâafen bi-devâmik.",
        en: "Allahumma salli wa sallim wa barik ala sayyidina Muhammadin nuriz-Zati was-sirris-sari fi jami'il-asma'i was-sifat, wa ala alihi wa sahbihi wa sallim adada ma fi 'ilmika muda'afan bi-dawamik.",
      },
      meaning: {
        tr: "Allah'ım! Zât'ının nuru, bütün isim ve sıfatlarının eserlerine akarak yayılan sır olan Efendimiz Muhammed'e, onun Âl ve Ashabına; senin ilminde var olanların adedince ve daimi olmanla katlandıkça katlanacak şekilde salat, selam ve bereket eyle.",
        en: "O Allah! Bestow Your blessings, peace, and grace upon our Master Muhammad — the light of the Divine Essence and the secret permeating all of the divine Names and Attributes — and upon his family and Companions, to a number equal to all that exists within Your knowledge, multiplied by the measure of Your eternity.",
      },
      virtue: {
        tr: 'Nur-u Zatiyye salavatı olarak bilinir; yüz bin salavat kuvvetinde zihni aydınlattığı kabul edilir. İlahî esma ve sıfatların tamamına işaret etmesi, bu salavatı özellikle tefekkür ehli için manevi yoğunluk açısından benzersiz kılar. Kapalı kapıların aralanması, sıkıntı ve belaların bertaraf edilmesi için tavsiye edilen bu salavat, zihinsel berraklık ve manevi nur talebi amacıyla az sayıda ama dikkatli bir şekilde okunmalıdır.',
        en: "Known as Salawat al-Nur al-Zatiyya, it is held to illuminate the mind with the spiritual force of one hundred thousand salawat. Its reference to all of the divine Names and Attributes makes this salawat uniquely intense in spiritual depth, particularly for those inclined toward contemplation (tafakkur). Recommended for the opening of closed doors and for the removal of difficulties and afflictions, this salawat should be recited in modest yet mindful repetitions with the intention of seeking mental clarity and divine light.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'nur', 'tefekkür'],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'any',
      recommendedCount: 10,
      suitableFor: [
        'zihinsel berraklık',
        'manevi nur talebi',
        'tefekkür',
        'kapalı kapıların açılması',
        'sıkıntı ve belaların def edilmesi için',
      ],
    },
    {
      key: keyMap.SALAVAT_FATIH,
      nameArabic:
        'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ، وَالْخَاتِمِ لِمَا سَبَقَ، وَالنَّاصِرِ الْحَقَّ بِالْحَقِّ، وَالْهَادِي إِلَى صِرَاطِكَ الْمُسْتَقِيمِ، صَلَّى اللّٰهُ عَلَيْهِ وَعَلَى آلِهِ وَأَصْحَابِهِ حَقَّ قَدْرِهِ وَمِقْدَارِهِ الْعَظِيمِ',
      name: {
        tr: 'Salavat-ı Fatih',
        en: 'Salawat al-Fatih (The Opening Salawat)',
      },
      transliteration: {
        tr: 'Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedinil fâtihi limâ uğlika, vel hâtimi li mâ sebeka, ven nâsıril hakkı bil hakkı, ve hâdî ilâ sırâtikel müstekıym. Sallallâhü aleyhi ve alâ âlihi ve ashâbihî hakka kadrihî ve mikdârihil azîm.',
        en: "Allahumma salli wa sallim wa barik ala sayyidina Muhammadin al-fatihi lima ughliq, wal-khatimi lima sabaq, wan-nasiri'l-haqqi bil-haqq, wal-hadi ila siratika'l-mustaqim. Sallallahu alayhi wa ala alihi wa ashabihi haqqa qadrihi wa miqdarihil-azim.",
      },
      meaning: {
        tr: "Allah'ım! Kapalı olanları açan, geçmişi mühürleyen, hakkı hak ile destekleyen ve doğru yoluna ileten Efendimiz Muhammed'e (s.a.v.) salât ve selâm eyle, O'nu mübarek kıl. O'na, âline ve ashabına, O'nun kadrince ve yüce miktarınca salât eyle.",
        en: "O Allah! Bestow Your blessings, peace, and grace upon our Master Muhammad — the Opener of what was closed, the Seal of what came before, the Helper of truth through truth, and the Guide to Your straight path. May Allah's blessings be upon him and upon his family and Companions, to the measure of his worth and his immense standing.",
      },
      virtue: {
        tr: 'Kapalı kapıları açan, hakka yardım eden ve hidayet yolunu gösteren en kuvvetli salavatlardan kabul edilir. Salavat-ı Fatih, büyük manevi yoğunluğu nedeniyle ileri bir himmet ve niyet gerektirir. Bazı tasavvuf çevrelerinde altı bin kez sıradan bir salavata denk sayıldığı ifade edilmiştir. Zor işler, karanlık anlar ve hidayet talebi için bu salavata başvurmak, gelenekte yaygın tavsiyeler arasındadır.',
        en: "This is considered among the most powerful salawat for opening closed doors, aiding truth, and illuminating the path of guidance. Salawat al-Fatih requires a lofty intention and spiritual resolve, owing to its intense depth. In some Sufi circles, it has been said to equal six thousand ordinary salawat. Turning to this salawat in difficult affairs, in moments of spiritual darkness, and when seeking guidance is among the widely recommended practices in the tradition.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'feth', 'hidayet'],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['hidayet talebi', 'zor işlerin açılması', 'manevi destek'],
    },
    {
      key: keyMap.HZ_FATIMA_SALAVATI,
      nameArabic:
        'اللّٰهُمَّ صَلِّ عَلَى مَنْ رُوحُهُ مِحْرَابُ الْأَرْوَاحِ وَالْمَلَائِكَةِ وَالْكَوْنِ، اللّٰهُمَّ صَلِّ عَلَى مَنْ هُوَ إِمَامُ الْأَنْبِيَاءِ وَالْمُرْسَلِينَ، اللّٰهُمَّ صَلِّ عَلَى مَنْ هُوَ إِمَامُ أَهْلِ الْجَنَّةِ عِبَادِ اللّٰهِ الْمُؤْمِنِينَ',
      name: {
        tr: "Hz. Fatıma'nın Salavatı",
        en: "Salawat of Sayyida Fatima al-Zahra",
      },
      transliteration: {
        tr: 'Allahümme salli ala men ruhuhu mihrabül ervahı ve melaiketi vel kevn. Allahümme salli ala men hüve imamül enbiyai vel mürseliyn. Allahümme salli ala men hüve imamü ehlil cenneti ıbadillahil mü\'minin.',
        en: "Allahumma salli ala man ruhuhu mihrabul-arwahi wal-mala'ikati wal-kawn. Allahumma salli ala man huwa imamul-anbiya'i wal-mursalin. Allahumma salli ala man huwa imamu ahlil-jannati ibadillahil-mu'minin.",
      },
      meaning: {
        tr: "Ya rabbi! Babacığım Hazreti Muhammed (s.a.v.)'e salat getir. O bütün kainatın kıblesidir. Ervahlar, melaikeler ve peygamberler hep ondan şefaat isterler. Ya rabbi! Benim peygamberim Hazreti Muhammed'e salat getir. Çünkü o peygamberlerin ve resullerin reisidir. Ya Rabbi! Babam Hazreti Muhammed (s.a.v.)'e salat getir. Zira o mü'minlerin, cennet ahalisinin, peygamberlerin ve resullerin en hayırlısıdır.",
        en: "O Lord! Bestow Your blessings upon my father the Prophet Muhammad (peace be upon him). He is the qibla of all of creation. The souls, the angels, and the prophets all seek his intercession. O Lord! Bestow Your blessings upon my Prophet Muhammad (peace be upon him), for he is the foremost of all prophets and messengers. O Lord! Bestow Your blessings upon my father Muhammad (peace be upon him), for he is the best of the believers, the people of Paradise, the prophets, and all of the messengers.",
      },
      virtue: {
        tr: 'Denizler mürekkep, ağaçlar kalem olsa sevabının yazılamayacağı nakledilen yüce bir salavat tertibidir. Sayyida Fâtıma radıyallahu anhânın bu salavata olan derin bağlılığı, Ehl-i Beyt muhabbetinin en güzel ifadelerinden biridir. Kandil gecelerinde ve salavat meclislerinde okunması tavsiye edilen bu dua, kalpte peygamber ve Ehl-i Beyt sevgisini pekiştirir.',
        en: "It is narrated that even if all oceans were ink and all trees were pens, the reward of this salawat could not be fully recorded. The profound devotion of Sayyida Fatima (may Allah be pleased with her) to this salawat is one of the most beautiful expressions of love for the Ahl al-Bayt. It is recommended to recite this supplication on blessed nights and in salawat gatherings, as it strengthens in the heart the love for the Prophet (peace be upon him) and his blessed household.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'ehlibeyt', 'muhabbet'],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['ehlibeyt muhabbeti', 'derin salavat', 'kandil gecesi'],
    },
    {
      key: keyMap.RUYADA_GORME_SALAVATI,
      nameArabic:
        'اللّٰهُمَّ صَلِّ عَلَى رُوحِ سَيِّدِنَا مُحَمَّدٍ فِي الْأَرْوَاحِ، وَصَلِّ عَلَى جَسَدِ سَيِّدِنَا مُحَمَّدٍ فِي الْأَجْسَادِ، وَصَلِّ عَلَى قَبْرِ سَيِّدِنَا مُحَمَّدٍ فِي الْقُبُورِ',
      name: {
        tr: 'Rüyada Görme Salavatı',
        en: 'Salawat for Seeing the Prophet in a Dream',
      },
      transliteration: {
        tr: 'Allâhümme salli alâ rûhi seyyidinâ Muhammedin fil ervâh. Ve salli alâ cesedi seyyidinâ Muhammedin fil ecsâd. Ve salli alâ kabri seyyidinâ Muhammedin fil qubûr.',
        en: 'Allahumma salli ala ruhi sayyidina Muhammadin fil-arwah. Wa salli ala jasadi sayyidina Muhammadin fil-ajsad. Wa salli ala qabri sayyidina Muhammadin fil-qubur.',
      },
      meaning: {
        tr: 'Allahım, Efendimiz Muhammedin ruhuna ruhlar aleminde, bedenine bedenler aleminde ve kabrine kabirler aleminde salat eyle.',
        en: "O Allah, bestow Your blessings upon the soul of our Master Muhammad among all souls, upon the body of our Master Muhammad among all bodies, and upon the grave of our Master Muhammad among all graves.",
      },
      virtue: {
        tr: "Yatmadan önce açıktan yüz kez okunduğunda Peygamber'i rüyada görmeye vesile kılındığı nakledilir. Kandil gecelerinde bu salavata hususi yer verilmesi, onun manevi ehemmiyetini gösterir. Hem Peygamber'in ruhuna hem bedenine hem de mübarek kabrine ayrı ayrı salât edilerek Allah'a yönelme, eşsiz bir teslimiyet ve muhabbet ifadesidir.",
        en: "It is narrated that reciting this salawat aloud one hundred times before sleep is a means of seeing the Prophet (peace be upon him) in a dream. The special attention given to this salawat on blessed nights reflects its spiritual significance. Turning to Allah with individual salawat directed at the Prophet's soul, body, and blessed grave separately is an expression of unique devotion and love.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: [
        'mevlid kandili',
        'berat-kandili',
        'salavat',
        'ruya',
        'gece-ibadeti',
      ],
      categories: ['kandil', 'özel gün', 'salavat'],
      timeOfDay: 'night',
      recommendedCount: 100,
      suitableFor: [
        'yatmadan önce',
        'rüya niyeti',
        'gece zikri',
        'kandil gecesi',
      ],
    },
    {
      key: keyMap.TEFRICIYE_SALAVATI,
      nameArabic:
        'اللّٰهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ، وَتَنْفَرِجُ بِهِ الْكُرَبُ، وَتُقْضَى بِهِ الْحَوَائِجُ، وَتُنَالُ بِهِ الرَّغَائِبُ، وَحُسْنُ الْخَوَاتِمِ، وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ، وَعَلَى آلِهِ وَصَحْبِهِ وَفِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ',
      name: {
        tr: 'Salavat-ı Tefriciyye',
        en: 'Salawat al-Tafrijiyya (The Relief-Bringing Salawat)',
      },
      transliteration: {
        tr: "Allahümme salli salâten kâmileten ve sellim selâmen tâmmen alâ seyyidina Muhammedinillezi tenhallü bihil ukadu ve tenfericu bihil kürübu ve tukdâ bihil hevâicu ve tunâlü bihir ragâibu ve hüsnül hâvatimi ve yüsteska'l gamâmu bi vechihil kerîm ve alâ âlihi ve sahbihi ve fî külli lemhatin ve nefesin bi adedi külli malûmin lek.",
        en: "Allahumma salli salatan kamilatan wa sallim salaman tamman ala sayyidina Muhammadin alladhi tanhillu bihil-'uqadu, wa tanfariju bihil-kurabu, wa tuqda bihil-hawa'iju, wa tunalu bihir-ragha'ibu wa husnul-khawatimi, wa yustasqal-ghamambu wajhihil-karim, wa ala alihi wa sahbihi wa fi kulli lamhatin wa nafasin bi 'adadi kulli ma'lumin lak.",
      },
      meaning: {
        tr: "Ya Rab! Bizim Efendimiz Muhammed'e (S.A.V.) tam kusursuz bir salât ve rahmet, mükemmel bir selâm ve selâmet vermeni diliyoruz. O Peygamber ki, onun bu hürmetine düğümler çözülür, belalar ve sıkıntılar onun hürmetine açılıp dağılır, ihtiyaçlar ve hacet onun bu hürmetine yerine getirilir. Maksatlara O'nun hürmetine ulaşılır, güzel sonuçlar O'nun hürmetine elde edilir. O'nun şerefli yüzünün hürmetine bulutlardaki yağmur istenilir. Allah'ım, onun ashabına, ehl-i beytine de her nefes alacak zamanda ve göz kırpacak kadar zamanda sana malum olan varlıklar sayısınca salât et.",
        en: "O Lord! We beseech You to bestow upon our Master Muhammad (peace be upon him) a complete and perfect blessing and a full and entire salutation of peace. He is the Prophet through whose honor knots are untied, afflictions and distress are dispersed and lifted, needs and necessities are fulfilled, aspirations are attained, and beautiful endings are secured. Through the honor of his noble countenance, rain is sought from the clouds. O Allah, bestow that same salawat upon his Companions and his Ahl al-Bayt, in every glance of an eye and every breath, to a number equal to all that is known to You.",
      },
      virtue: {
        tr: 'Günde en az 41 kez okunduğunda düğümleri çözen, kederleri gideren ve hastalara şifa vesilesi olan salavat olarak aktarılır. Salavat-ı Tefriciyye, adını "ferahlık ve genişlik" anlamındaki "tefrîc" kökünden alır ve sıkıntıda olan kimselere hususi olarak tavsiye edilir. İçinde barındırdığı anlam derinliği nedeniyle her bir cümle ayrı bir dua hükmündedir; hacet, şifa, rızık ve güzel akıbet niyetlerini birden kuşatan bir salavattır.',
        en: "When recited at least forty-one times a day, this salawat is transmitted as one that unties knots, removes distress, and serves as a means of healing for the sick. Salawat al-Tafrijiyya takes its name from the root 'tafrij,' meaning 'relief and expansion,' and is especially recommended for those in hardship. Due to the depth of meaning it contains, each of its sentences functions as a distinct supplication; it is a salawat that simultaneously encompasses the intentions of need, healing, provision, and a blessed end.",
      },
      source: {
        tr: 'Salavat mecmuaları',
        en: 'Salawat Compilations',
      },
      tags: ['mevlid kandili', 'salavat', 'ferahlik', 'şifa'],
      categories: ['kandil', 'özel gün', 'salavat', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: [
        'sıkıntıların giderilmesi',
        'şifa niyeti',
        'hacet duası',
        'işlerin kolaylaşması',
        'kaza ve belalardan korunma',
        'duaların kabul olması',
        'geçim darlığının sona ermesi',
      ],
    },
    {
      key: keyMap.SABAN_SALAVATI,
      nameArabic:
        'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ فِي الْأَرْوَاحِ وَصَلِّ عَلَى جَسَدِ مُحَمَّدٍ فِي الْأَجْسَادِ وَصَلِّ عَلَى قَبْرِ مُحَمَّدٍ فِي الْقُبُورِ',
      name: {
        tr: 'Şaban Salavat-ı Şerifi — Ruh, Ceset ve Kabir Salavat',
        en: "Sha'ban Salawat al-Sharif — The Salawat of Soul, Body, and Grave",
      },
      transliteration: {
        tr: 'Allahümme salli alâ Muhammedin fil-ervâh. Ve salli alâ cesedi Muhammedin fil-ecsâd. Ve salli alâ kabri Muhammedin fil-kubûr.',
        en: "Allahumma salli ala Muhammadin fil-arwah. Wa salli ala jasadi Muhammadin fil-ajsad. Wa salli ala qabri Muhammadin fil-qubur.",
      },
      meaning: {
        tr: "Allah'ım! Ruhlar arasında Hz. Muhammed'in ruhuna, bedenler arasında O'nun bedenine, kabirler arasında O'nun kabrine salat eyle.",
        en: "O Allah! Bestow Your blessings upon the soul of Muhammad (peace be upon him) among all souls, upon the body of Muhammad among all bodies, and upon the grave of Muhammad among all graves.",
      },
      virtue: {
        tr: "Şaban ayının 27. gecesi kılınan iki rekatlık namazın ardından 100 defa okunur. Nebevi şefaate doğrudan ulaştırdığı belirtilen hususi salavattır. Şaban-ı Şerif, Resûlullah'ın (s.a.v.) amellerin Allah'a arz edildiği mübarek ay olarak nitelendirdiği aydır; bu nedenle bu salavat, söz konusu gecede Peygamber'e yakınlık ve şefaat ümidiyle okunur.",
        en: "This salawat is recited one hundred times following a two-rak'ah prayer on the twenty-seventh night of the month of Sha'ban. It is a special salawat reported to provide direct access to Prophetic intercession. Sha'ban al-Sharif is the month that the Messenger of Allah (peace be upon him) described as the month in which deeds are presented to Allah; for this reason, this salawat is recited on that night with the hope of nearness to the Prophet and his intercession.",
      },
      source: {
        tr: "Şaban-ı Şerif Risalesi",
        en: "Treatise on Sha'ban al-Sharif",
      },
      tags: ['şaban', 'salavat', '27. gece', 'şefaat'],
      categories: ['salavat', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
  ],
  specialDays: [],
};
