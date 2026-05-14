/*
pnpm --filter api seed:special-days:kurban-2026
*/

import { pathToFileURL } from 'node:url';
import { runSpecialDaySeed } from './lib/special-day-seed.mjs';

const DHIKR_ITEMS = [
  {
    key: 'tesrik-tekbiri',
    nameArabic:
      'اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ لاَ إِلٰهَ إِلاَّ اللّٰهُ وَاللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ وَلِلّٰهِ الْحَمْدُ',
    nameTurkish: 'Teşrik Tekbiri',
    transliteration:
      'Allâhu ekber Allâhu ekber. Lâ ilâhe illallâhu vallâhu ekber. Allâhu ekber ve lillâhil-hamd.',
    meaning:
      "Allah en büyüktür. Allah en büyüktür. Allah'tan başka ilah yoktur. Allah en büyüktür. Hamd Allah'adır.",
    virtue:
      'Teşrik günlerinde farz namazların ardından tekbir getirmek bayram şuurunu canlı tutar.',
    source: 'Teşrik tekbirleri geleneği',
    tags: ['kurban-bayrami', 'tesrik', 'tekbir'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 23,
    suitableFor: ['bayram günleri', 'cemaat sonrası zikir'],
  },
  {
    key: 'bayram-tevhid-400',
    nameArabic:
      'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    nameTurkish: 'Bayram Sabahı Tevhid Zikri',
    transliteration:
      'Lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül-mülkü ve lehül-hamdü yuhyî ve yumît. Ve hüve alâ külli şey’in kadîr.',
    meaning:
      "Allah'tan başka ilah yoktur, O tektir ve ortağı yoktur. Mülk O'nundur, hamd O'nadır. Diriltir ve öldürür. O her şeye kadirdir.",
    virtue:
      'Bayram sevincini tevhid bilinciyle birleştirir, kalpte teslimiyet ve şükür duygusunu güçlendirir.',
    source: 'Bayram sabahı tavsiye zikirleri',
    tags: ['kurban-bayrami', 'tevhid'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'morning',
    recommendedCount: 400,
    suitableFor: ['bayram sabahı', 'şükür pratiği'],
  },
  {
    key: 'bayram-tesbih-300',
    nameArabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ',
    nameTurkish: 'Tesbih Zikri',
    transliteration: 'Sübhânallâhi ve bi-hamdihî.',
    meaning: "Allah'ı noksan sıfatlardan tenzih eder ve O'na hamd ederim.",
    virtue:
      'Kalbi arındırır, şükür duygusunu artırır ve bayram günlerinde manevi dengeyi destekler. Bayram günü 300 kere okunup ölmüşlerin ruhuna bağışlandığında her müminin kabrine bin nur girer, okuyan kişi vefat ettiğinde de kabrine bin nur verilir.',
    source: 'Bayram sabahı tavsiye tesbihat',
    tags: ['kurban-bayrami', 'tesbih'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'morning',
    recommendedCount: 300,
    suitableFor: ['bayram sabahı', 'tesbihat'],
  },
  {
    key: 'bayram-istigfar-100',
    nameArabic: 'أَسْتَغْفِرُ اللّٰهَ',
    nameTurkish: 'Estağfirullâh',
    transliteration: 'Estağfirullâh.',
    meaning: "Allah'tan bağışlanma dilerim.",
    virtue:
      'İbadetlerdeki eksiklikler için tevbe bilincini güçlendirir ve kalpte arınma sağlar.',
    source: 'Bayram günü istiğfar tavsiyesi',
    tags: ['kurban-bayrami', 'istigfar', 'tevbe'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['bayram günü', 'tevbe'],
  },
  {
    key: 'ya-hayyu-ya-kayyum',
    nameArabic:
      'يَا حَيُّ يَا قَيُّومُ يَا بَدِيعَ السَّمَاوَاتِ وَالْأَرْضِ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    nameTurkish: 'Kalbin Diriliği Duası',
    transliteration:
      "Yâ Hayyû yâ Kayyûm, yâ bedî'as-semâvâti ve'l-ardı, yâ ze'l-celâli ve'l-ikrâm.",
    meaning:
      'Ey Hayy ve Kayyûm olan Allahım, ey gökleri ve yeri örneksiz yaratan, ey celal ve ikram sahibi.',
    virtue:
      'Kalbi gafletten korumaya, manevi diriliği canlı tutmaya ve bayram günlerinde iç huzuru güçlendirmeye vesile olur.',
    source: 'Bayram günleri kalp diriliği duaları',
    tags: ['kurban-bayrami', 'dua', 'hayy', 'kayyum'],
    categories: ['özel gün', 'bayram', 'dua'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['kalp huzuru', 'gafletten korunma', 'bayram günleri'],
  },
  {
    key: 'kurban-sukru-duasi',
    nameArabic:
      'اللّٰهُمَّ لَكَ الْحَمْدُ كُلُّهُ وَلَكَ الشُّكْرُ كُلُّهُ وَإِلَيْكَ يُرْجَعُ الْأَمْرُ كُلُّهُ',
    nameTurkish: 'Şükür Duası',
    transliteration:
      'Allâhümme lekel-hamdü küllühû ve lekeş-şükrü küllühû ve ileyke yürceul-emru küllühû.',
    meaning:
      "Allah'ım, hamdin bütünü Sana aittir, şükrün bütünü Sana aittir, bütün işler Sana döner.",
    virtue:
      'Kurban ibadetini şükür ve teslimiyet boyutuyla tamamlar, nimetin sahibini hatırlatır.',
    source: 'Kurban ibadeti sonrası şükür duaları',
    tags: ['kurban-bayrami', 'şükür', 'dua'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 7,
    suitableFor: ['kurban kesimi sonrası', 'şükür', 'hamd'],
  },
  {
    key: 'salavat-serife-100',
    nameArabic: 'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ',
    nameTurkish: 'Salavat-ı Şerife',
    transliteration: 'Allâhümme salli alâ seyyidinâ Muhammed.',
    meaning: "Allah'ım, Efendimiz Muhammed'e salat eyle.",
    virtue:
      'Resulullah sevgisini canlı tutar, kalpte merhamet ve bağlılık duygusunu kuvvetlendirir.',
    source: 'Salavat fazileti rivayetleri',
    tags: ['kurban-bayrami', 'salavat'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['gün boyu', 'namaz sonrası', 'peygamber sevgisi'],
  },
  {
    key: 'hasbiye-zikri-100',
    nameArabic: 'حَسْبِيَ اللّٰهُ وَنِعْمَ الْوَكِيلُ',
    nameTurkish: 'Hasbiye Zikri',
    transliteration: "Hasbiyallâhu ve ni'mel-vekîl.",
    meaning: 'Allah bana yeter, O ne güzel vekildir.',
    virtue:
      'Tevekkül bilincini artırır, endişe ve dağınıklık halinde kalbi dengelemeye yardımcı olur.',
    source: 'Tevekkül zikirleri',
    tags: ['kurban-bayrami', 'tevekkül', 'hasbiye'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['gün boyu', 'zorlanma anları'],
  },
  {
    key: 'tevekkul-hasbiye-zikri-100',
    nameArabic:
      'حَسْبِيَ اللّٰهُ وَكَفَى سَمِعَ اللّٰهُ لِمَنْ دَعَا لَيْسَ وَرَاءَ اللّٰهِ مُنْتَهَى',
    nameTurkish: 'Tevekkül ve Hasbiye Zikri',
    transliteration:
      'Hasbiyallâhu ve kefâ. Semiallâhu limen deâ. Leyse verâ-allâhi müntehâ.',
    meaning:
      "Allah bana yeter ve kâfidir. Allah dua edeni işitir. Allah'tan öte varılacak bir son yoktur.",
    virtue:
      "Tevekkül bilincini derinleştirir; kalpte emniyet ve teslimiyet hissini artırır. Rivayette Cebrâil'in Hz. Îsâ'ya öğrettiği zikirlerdendir.",
    source: "Hasbiye rivayetleri (Cebrâil'in Hz. Îsâ'ya öğrettiği zikir)",
    tags: ['kurban-bayrami', 'hasbiye', 'tevekkül', 'dua'],
    categories: ['özel gün', 'bayram', 'dua', 'tevekkül'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['tevekkül', 'endişe anları', 'rahmet talebi'],
  },
  {
    key: 'rabbi-inni-messeni-100',
    nameArabic:
      'رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
    nameTurkish: 'Hz. Eyyub Duası',
    transliteration: 'Rabbi innî messeniyed-durru ve ente erhamur-râhimîn.',
    meaning:
      'Rabbim, bana dert dokundu; Sen merhametlilerin en merhametlisisin.',
    virtue:
      'Sabır, sığınma ve rahmet talebini güçlendirir; sıkıntılı dönemlerde umut ve teslimiyet verir.',
    source: 'Enbiya Suresi 83',
    tags: ['kurban-bayrami', 'dua', 'sabır'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['zorluk anları', 'dua vakitleri'],
  },
  {
    key: 'nur-duasi',
    nameArabic: 'اللّٰهُمَّ اجْعَلْ فِي قَلْبِي نُورًا',
    nameTurkish: 'Nur Duası',
    transliteration: 'Allâhümmec’al fî kalbî nûran.',
    meaning: "Allah'ım, kalbime nur ver.",
    virtue:
      'Manevi farkındalığı artırır, zihinsel dağınıklığı azaltıp iç huzuru destekler.',
    source: 'Nur talebi duaları',
    tags: ['kurban-bayrami', 'dua', 'nur'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'night',
    recommendedCount: 33,
    suitableFor: ['akşam', 'tefekkür'],
  },
  {
    key: 'kelime-i-tevhid-100',
    nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    nameTurkish: 'Kelime-i Tevhid',
    transliteration: 'Lâ ilâhe illallâh.',
    meaning: "Allah'tan başka ilah yoktur.",
    virtue:
      'Tevhid inancını sürekli tazeler, kalbi birliğe ve kulluk bilincine yöneltir.',
    source: 'Tevhid zikirleri',
    tags: ['kurban-bayrami', 'tevhid'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['gün boyu', 'namaz sonrası'],
  },
  {
    key: 'ihlas-kiraati-1000',
    nameArabic: 'قُلْ هُوَ اللّٰهُ أَحَدٌ',
    nameTurkish: 'İhlas Suresi',
    transliteration: 'Kul hüvallâhu ehad.',
    meaning: 'De ki: O Allah tektir.',
    virtue:
      'Arefe günü tevhid bilincini yoğunlaştırır ve kalpte ihlası kuvvetlendiren bir kıraat pratiği sunar.',
    source: 'Arefe günü İhlas kıraati tavsiyeleri',
    tags: ['kurban-bayrami', 'arefe', 'ihlas'],
    categories: ['özel gün', 'bayram'],
    timeOfDay: 'any',
    recommendedCount: 1000,
    suitableFor: ['arefe günü', 'tefekkür'],
  },
  {
    key: 'tevhid-i-mulk-ve-hamd-100',
    nameArabic:
      'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    nameTurkish: 'Tevhid-i Mülk ve Hamd',
    transliteration:
      'Lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül-mülkü ve lehül-hamdü yuhyî ve yumîtü bi-yedihil-hayr. Ve hüve alâ külli şey’in kadîr.',
    meaning:
      "Allah'tan başka ilah yoktur, O tektir ve ortağı yoktur. Mülk O'nundur, hamd O'nadır. Diriltir ve öldürür; hayır O'nun elindedir.",
    virtue:
      'Tevhid bilincini güçlendirir, kalpte teslimiyet ve yakin duygusunu artırır.',
    source: 'Kurban Risalesi rivayetleri',
    tags: ['tevhid', 'zilhicce', 'bayram'],
    categories: ['ozel-gun', 'zilhicce', 'tevhid'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['iman-tazeleme', 'huzur', 'teslimiyet'],
  },
  {
    key: 'tevhid-sehadeti-samed-100',
    nameArabic:
      'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ إِلٰهًا وَاحِدًا صَمَدًا لَمْ يَتَّخِذْ صَاحِبَةً وَلَا وَلَدًا',
    nameTurkish: 'Tevhid Şehadeti (Samed)',
    transliteration:
      'Eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh. İlâhen vâhiden sameden lem yettehiz sâhibeten ve lâ veledâ.',
    meaning:
      "Şahitlik ederim ki Allah'tan başka ilah yoktur; O tektir, Samed'dir, eş ve çocuk edinmemiştir.",
    virtue:
      'Tevhid şuurunu derinleştirir, kalpte ihlası ve kulluk bilincini kuvvetlendirir.',
    source: 'Kurban Risalesi rivayetleri',
    tags: ['tevhid', 'samed', 'ihlas', 'zilhicce'],
    categories: ['ozel-gun', 'zilhicce', 'tevhid'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['iman-tazeleme', 'ihlas', 'teslimiyet'],
  },
  {
    key: 'tehlil-i-hayy-100',
    nameArabic:
      'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    nameTurkish: 'Tehlil-i Hayy',
    transliteration:
      'Eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül-mülkü ve lehül-hamdü yuhyî ve yumît. Ve hüve hayyün lâ yemût. Bi-yedihil-hayr. Ve hüve alâ külli şey’in kadîr.',
    meaning:
      "Allah tektir, mülk ve hamd O'nundur. Diriltir ve öldürür. O Hayy'dır, ölmez. Hayır O'nun elindedir.",
    virtue:
      'Fanilikten Baki olana yönelmeyi hatırlatır, tevekkül ve sükun verir.',
    source: 'Kurban Risalesi rivayetleri',
    tags: ['tehlil', 'hayy', 'tevhid', 'zilhicce'],
    categories: ['ozel-gun', 'zilhicce', 'tevhid'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['tevekkul', 'huzur', 'farkindalik'],
  },
  {
    key: 'istigfar-i-azim-1001',
    nameArabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    nameTurkish: 'İstiğfar-ı Azim',
    transliteration: 'Estağfirullâhel-azîme ve etûbü ileyh.',
    meaning: "Azim olan Allah'tan mağfiret dilerim ve O'na tövbe ederim.",
    virtue:
      'Manevi arınma sağlar; Arefe ve Bayram günlerindeki ibadet eksiklerini telafiye vesile olur.',
    source: 'Tirmizi, Deavat',
    tags: ['istigfar', 'tevbe', 'arinma', 'bayram'],
    categories: ['genel', 'ozel-gun', 'istigfar'],
    timeOfDay: 'any',
    recommendedCount: 1001,
    suitableFor: ['magfiret', 'kalp-huzuru', 'pismanlik'],
  },
];

const SPECIAL_DAYS = [
  {
    name: 'Kurban Bayramı Arefe Günü',
    type: 'özel gün',
    date: '2026-05-26',
    hijriDate: '9 Zilhicce 1447',
    description: 'Arefe Günü (Tevbe, Dua ve Tevhid Yoğunluğu)',
    eventKey: 'kurban-bayrami-2026',
    dhikrKeys: [
      'ihlas-kiraati-1000',
      'tevhid-i-mulk-ve-hamd-100',
      'tevhid-sehadeti-samed-100',
      'tehlil-i-hayy-100',
      'istigfar-i-azim-1001',
    ],
  },
  {
    name: 'Kurban Bayramı',
    type: 'bayram',
    date: '2026-05-27',
    hijriDate: '10 Zilhicce 1447',
    description: 'Kurban Bayramı 1. Gün (Bayram Sabahı ve Teşrik Başlangıcı)',
    eventKey: 'kurban-bayrami-2026',
    dayIndex: 1,
    dayCount: 4,
    dhikrKeys: [
      'tesrik-tekbiri',
      'bayram-tevhid-400',
      'bayram-tesbih-300',
      'bayram-istigfar-100',
      'ya-hayyu-ya-kayyum',
      'kurban-sukru-duasi',
    ],
  },
  {
    name: 'Kurban Bayramı',
    type: 'bayram',
    date: '2026-05-28',
    hijriDate: '11 Zilhicce 1447',
    description: 'Kurban Bayramı 2. Gün (Tevhid, Salavat ve Tevekkül Günü)',
    eventKey: 'kurban-bayrami-2026',
    dayIndex: 2,
    dayCount: 4,
    dhikrKeys: [
      'tesrik-tekbiri',
      'salavat-serife-100',
      'hasbiye-zikri-100',
      'tevekkul-hasbiye-zikri-100',
      'tevhid-i-mulk-ve-hamd-100',
      'bayram-istigfar-100',
      'ya-hayyu-ya-kayyum',
    ],
  },
  {
    name: 'Kurban Bayramı',
    type: 'bayram',
    date: '2026-05-29',
    hijriDate: '12 Zilhicce 1447',
    description: 'Kurban Bayramı 3. Gün (Sabır, Dua ve Arınma Günü)',
    eventKey: 'kurban-bayrami-2026',
    dayIndex: 3,
    dayCount: 4,
    dhikrKeys: [
      'tesrik-tekbiri',
      'tehlil-i-hayy-100',
      'nur-duasi',
      'bayram-istigfar-100',
      'salavat-serife-100',
      'ya-hayyu-ya-kayyum',
    ],
  },
  {
    name: 'Kurban Bayramı',
    type: 'bayram',
    date: '2026-05-30',
    hijriDate: '13 Zilhicce 1447',
    description: 'Kurban Bayramı 4. Gün (Kapanış ve Teşrik Tamamlama Günü)',
    eventKey: 'kurban-bayrami-2026',
    dayIndex: 4,
    dayCount: 4,
    dhikrKeys: [
      'tesrik-tekbiri',
      'kelime-i-tevhid-100',
      'hasbiye-zikri-100',
      'tevekkul-hasbiye-zikri-100',
      'salavat-serife-100',
      'bayram-istigfar-100',
      'ya-hayyu-ya-kayyum',
    ],
  },
];


export const SPECIAL_DAY_DATASET = {
  key: 'kurban-bayrami-2026',
  label: 'Kurban Bayramı 2026',
  dhikrItems: DHIKR_ITEMS,
  specialDays: SPECIAL_DAYS,
};

async function main() {
  await runSpecialDaySeed(SPECIAL_DAY_DATASET);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
