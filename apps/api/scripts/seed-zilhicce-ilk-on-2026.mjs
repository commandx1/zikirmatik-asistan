// pnpm --filter api seed:special-days:zilhicce-2026

import { pathToFileURL } from 'node:url';
import { runSpecialDaySeed } from './lib/special-day-seed.mjs';

const DHIKR_ITEMS = [
  {
    key: 'zilhicce-tevhid-1',
    nameArabic:
      'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    nameTurkish: 'Lâ ilâhe illallâhu vahdehû lâ...',
    transliteration:
      'Lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül mülkü ve lehül hamdü yuhyî ve yumîtü biyedihil hayr. Ve hüve alâ külli şey’in kadîr.',
    meaning:
      "Allah'tan başka ilah yoktur, O tektir, ortağı yoktur. Mülk O'nundur, hamd O'nadır. Diriltir ve öldürür; hayır O'nun elindedir.",
    virtue:
      'Tevhid şuurunu güçlendirir, kurban ve teslimiyet bilincini derinleştirir.',
    source: 'Zilhicce fazileti rivayetleri',
    tags: ['zilhicce', 'tevhid', 'bes-hediye'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['iman', 'teslimiyet', 'huzur'],
  },
  {
    key: 'zilhicce-tevhid-2',
    nameArabic:
      'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ إِلٰهًا وَاحِدًا صَمَدًا لَمْ يَتَّخِذْ صَاحِبَةً وَلَا وَلَدًا',
    nameTurkish: 'Eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh. İlâhen vâhiden...',
    transliteration:
      'Eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh. İlâhen vâhiden sameden lem yettehiz sâhibeten ve lâ veledâ.',
    meaning:
      "Şahitlik ederim ki Allah'tan başka ilah yoktur; O tektir, Samed'dir, eş ve çocuk edinmemiştir.",
    virtue:
      'Samediyet ve ahadiyet bilincini kuvvetlendirir; ihlası artırır.',
    source: 'Zilhicce fazileti rivayetleri',
    tags: ['zilhicce', 'tevhid', 'samed'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['iman', 'ihlas', 'teslimiyet'],
  },
  {
    key: 'zilhicce-tevhid-3',
    nameArabic:
      'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    nameTurkish: 'Eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül mülkü...',
    transliteration:
      'Eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh. Lehül mülkü ve lehül hamdü yuhyî ve yumît. Ve hüve hayyün lâ yemût. Biyedihil hayr. Ve hüve alâ külli şey’in kadîr.',
    meaning:
      "Allah tektir; mülk ve hamd O'nundur. Diriltir ve öldürür. O Hayy'dır, ölmez. Hayır O'nun elindedir.",
    virtue:
      'Faniliği hatırlatır, Bâki olana yönelmeyi ve tevekkülü artırır.',
    source: 'Zilhicce fazileti rivayetleri',
    tags: ['zilhicce', 'tehlil', 'hayy'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['huzur', 'tevekkul', 'marifet'],
  },
  {
    key: 'zilhicce-hasbiye',
    nameArabic:
      'حَسْبِيَ اللّٰهُ وَكَفَى سَمِعَ اللّٰهُ لِمَنْ دَعَا لَيْسَ وَرَاءَ اللّٰهِ مُنْتَهَى',
    nameTurkish: 'Hasbiyallâhu ve kefâ...',
    transliteration:
      'Hasbiyallâhu ve kefâ. Semiallâhu limen deâ. Leyse verâallâhi müntehâ.',
    meaning:
      "Allah bana yeter ve kafidir. Allah dua edeni işitir. Allah'tan öte varılacak bir son yoktur.",
    virtue:
      'Tevekkül ve ilahi himaye bilincini güçlendirir.',
    source: 'Zilhicce fazileti rivayetleri',
    tags: ['zilhicce', 'hasbiye', 'tevekkul'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['tevekkul', 'korunma', 'sukunet'],
  },
  {
    key: 'zilhicce-kapsamli-dua',
    nameArabic:
      'اللّٰهُمَّ لَكَ الْحَمْدُ كَالَّذِي نَقُولُ وَخَيْرًا مِمَّا نَقُولُ اللّٰهُمَّ لَكَ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي وَلَكَ رَبِّ تُرَاثِي اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ وَمِنْ شَتَاتِ الْأَمْرِ',
    nameTurkish: 'Allâhümme lekel hamdü Duası',
    transliteration:
      'Allâhümme lekel hamdü kellezî nekûl ve hayran mimmâ nekûl. Allâhümme leke salâtî ve nüsükî ve mahyâye ve memâtî. Allâhümme innî eûzü bike min azâbil kabr.',
    meaning:
      "Allah'ım, hamd Sana aittir. Namazım, kurbanım, hayatım ve ölümüm Sanadır. Kabir azabından Sana sığınırım.",
    virtue:
      'Kulluğun tamamını Allah’a adama bilincini diri tutar.',
    source: 'Zilhicce fazileti rivayetleri',
    tags: ['zilhicce', 'dua', 'teslimiyet'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 33,
    suitableFor: ['dua', 'teslimiyet', 'huzur'],
  },
  {
    key: 'tekbir-tahmid',
    nameArabic:
      'اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ لَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ وَلِلّٰهِ الْحَمْدُ',
    nameTurkish: 'Tekbir ve Tahmid',
    transliteration:
      'Allâhu ekber Allâhu ekber. Lâ ilâhe illallâhü vallâhu ekber. Allâhu ekber ve lillâhil hamd.',
    meaning:
      "Allah en büyüktür. Allah'tan başka ilah yoktur. Hamd Allah'adır.",
    virtue:
      'Namaz sonrası zikir disiplinini artırır, kalbi sürekli zikre bağlar.',
    source: 'Teşrik ve zilhicce zikir geleneği',
    tags: ['zilhicce', 'tekbir', 'tahmid'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 33,
    suitableFor: ['namaz-sonrasi', 'gun-boyu'],
  },
  {
    key: 'ihlas-kiraati',
    nameArabic:
      'قُلْ هُوَ اللّٰهُ أَحَدٌ اَللّٰهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    nameTurkish: 'İhlas Suresi',
    transliteration:
      'Kul hüvellâhu ehad. Allâhüssamed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
    meaning:
      'De ki: O Allah tektir. Allah Samed’dir. Doğurmamış ve doğurulmamıştır. Hiçbir şey O’na denk değildir.',
    virtue:
      'Tevhid bilincini pekiştirir; özellikle Arefe günü yoğun kıraat tavsiye edilir.',
    source: 'Arefe günü fazilet rivayetleri',
    tags: ['zilhicce', 'arefe', 'ihlas'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 1000,
    suitableFor: ['dua-kabulu', 'magfiret', 'tevhid'],
  },
  {
    key: 'salavat-serife',
    nameArabic: 'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ',
    nameTurkish: 'Salavat-ı Şerife',
    transliteration: 'Allâhümme salli alâ seyyidinâ Muhammed.',
    meaning: "Allah'ım, Efendimiz Muhammed'e salat eyle.",
    virtue:
      'Her gün düzenli salavat, kalpte muhabbeti ve manevi diriliği artırır.',
    source: 'Salavat fazileti rivayetleri',
    tags: ['zilhicce', 'salavat'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['gun-boyu', 'namaz-sonrasi'],
  },
  {
    key: 'arefe-istigfar-100',
    nameArabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    nameTurkish: 'İstiğfar ve Tövbe',
    transliteration: 'Estağfirullâhel azîme ve etûbü ileyh.',
    meaning:
      "Azim olan Allah'tan mağfiret dilerim ve O'na tövbe ederim.",
    virtue:
      'Nefis muhasebesini canlı tutar, kalbi arındırır.',
    source: 'Tirmizi, Deavat',
    tags: ['zilhicce', 'istigfar', 'tevbe', 'arefe'],
    categories: ['zilhicce', 'ozel-gun'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['magfiret', 'kalp-huzuru', 'magfiret', 'arinma', 'tevbe'],
  },
  {
    key: 'ya-hayyu-ya-kayyum',
    nameArabic:
      'يَا حَيُّ يَا قَيُّومُ يَا بَدِيعَ السَّمَاوَاتِ وَالْأَرْضِ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    nameTurkish: 'Yâ Hayyû yâ Kayyûm...',
    transliteration:
      "Yâ Hayyû yâ Kayyûm, yâ bedî'as-semâvâti ve'l-ardı, yâ ze'l-celâli ve'l-ikrâm.",
    meaning:
      'Ey Hayy ve Kayyûm olan Allahım, ey gökleri ve yeri örneksiz yaratan, ey celal ve ikram sahibi.',
    virtue:
      'Kalbi gafletten korumaya, manevi diriliği canlı tutmaya ve bayram günlerinde iç huzuru güçlendirmeye vesile olur.',
    source: 'Bayram günleri kalp diriliği duaları',
    tags: ['zilhicce', 'bayram', 'dua', 'hayy', 'kayyum'],
    categories: ['zilhicce', 'ozel-gun', 'bayram', 'dua'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['kalp-huzuru', 'gafletten-korunma', 'bayram-gunleri'],
  },
  {
    key: 'kelime-i-tevhid-bolca',
    nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    nameTurkish: 'Kelime-i Tevhid',
    transliteration: 'Lâ ilâhe illallâh.',
    meaning: "Allah'tan başka ilah yoktur.",
    virtue:
      'Arefe günü peygamberlerin en hayırlı sözü olan tevhidi bolca tekrar etmek kalbi tahkim eder.',
    source: 'Arefe günü tevhid rivayetleri',
    tags: ['zilhicce', 'arefe', 'tevhid'],
    categories: ['zilhicce', 'ozel-gun', 'arefe'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['iman', 'tevhid', 'huzur'],
  },
  {
    key: 'nur-duasi',
    nameArabic: 'اللّٰهُمَّ اجْعَلْ فِي قَلْبِي نُورًا',
    nameTurkish: 'Nur Duası',
    transliteration: 'Allâhümmec’al fî kalbî nûran.',
    meaning: "Allah'ım, kalbime nur ver.",
    virtue:
      'Manevi basireti artırır, kalpte içsel aydınlanmayı güçlendirir.',
    source: 'Nur talebi duaları',
    tags: ['zilhicce', 'arefe', 'nur', 'dua'],
    categories: ['zilhicce', 'ozel-gun', 'arefe'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['basiret', 'huzur', 'farkindalik'],
  },
];

const ZILHICCE_DAYS = [
  {
    date: '2026-05-18',
    hijriDate: '1 Zilhicce 1447',
    description:
      'Niyet ve tevhid günü. Zikre güçlü bir başlangıç.',
    dhikrKeys: ['zilhicce-tevhid-1', 'tekbir-tahmid', 'salavat-serife'],
  },
  {
    date: '2026-05-19',
    hijriDate: '2 Zilhicce 1447',
    description:
      'Samediyet ve teslimiyetin tefekkürü.',
    dhikrKeys: ['zilhicce-tevhid-2', 'tekbir-tahmid', 'arefe-istigfar-100'],
  },
  {
    date: '2026-05-20',
    hijriDate: '3 Zilhicce 1447',
    description:
      'Hayy olan Rabbe yöneliş ve tevekkül pratiği.',
    dhikrKeys: ['zilhicce-tevhid-3', 'tekbir-tahmid', 'salavat-serife'],
  },
  {
    date: '2026-05-21',
    hijriDate: '4 Zilhicce 1447',
    description:
      'Hasbiye ile kalbi dünyalık endişeden arındırma.',
    dhikrKeys: ['zilhicce-hasbiye', 'arefe-istigfar-100', 'tekbir-tahmid'],
  },
  {
    date: '2026-05-22',
    hijriDate: '5 Zilhicce 1447',
    description:
      'Kapsamlı teslimiyet duası ve şükür bilinci.',
    dhikrKeys: ['zilhicce-kapsamli-dua', 'salavat-serife', 'tekbir-tahmid'],
  },
  {
    date: '2026-05-23',
    hijriDate: '6 Zilhicce 1447',
    description:
      'Tevhid tekrarları ile kalpte sebat oluşturma.',
    dhikrKeys: ['zilhicce-tevhid-1', 'zilhicce-tevhid-2', 'arefe-istigfar-100'],
  },
  {
    date: '2026-05-24',
    hijriDate: '7 Zilhicce 1447',
    description:
      'Tehlil ve hasbiye ile iç huzuru güçlendirme.',
    dhikrKeys: ['zilhicce-tevhid-3', 'zilhicce-hasbiye', 'salavat-serife'],
  },
  {
    date: '2026-05-25',
    hijriDate: '8 Zilhicce 1447',
    description:
      'Arefe hazırlığı: istiğfar, tekbir ve niyet tazeleme.',
    dhikrKeys: ['arefe-istigfar-100', 'tekbir-tahmid', 'zilhicce-tevhid-1'],
  },
  {
    date: '2026-05-26',
    hijriDate: '9 Zilhicce 1447',
    name: 'Arefe Günü',
    type: 'bayram',
    eventKey: 'kurban-bayrami-2026',
    priority: 180,
    description:
      'Rahmet ve mağfiretin doruğu. Arefe günü İhlas kıraati, tevhid, istiğfar, salavat ve nur duası ile yoğun bir zikir programı tavsiye edilir.',
    dhikrKeys: [
      'ihlas-kiraati',
      'kelime-i-tevhid-bolca',
      'arefe-istigfar-100',
      'salavat-serife',
      'nur-duasi',
    ],
  },
  {
    date: '2026-05-27',
    hijriDate: '10 Zilhicce 1447',
    name: 'Kurban Bayramı 1. Gün',
    type: 'bayram',
    eventKey: 'kurban-bayrami-2026',
    dayIndex: 1,
    dayCount: 4,
    priority: 200,
    description:
      'Kurban Bayramı başlangıcı: tekbir, tahmid ve şükür vurgusu.',
    dhikrKeys: [
      'tekbir-tahmid',
      'zilhicce-kapsamli-dua',
      'salavat-serife',
      'ya-hayyu-ya-kayyum',
    ],
  },
];


const SPECIAL_DAYS = ZILHICCE_DAYS.map((item, index) => ({
  name: item.name ?? `${index + 1} Zilhicce`,
  type: item.type ?? 'özel gün',
  date: item.date,
  hijriDate: item.hijriDate,
  description: item.description,
  eventKey: item.eventKey ?? 'zilhicce-ilk-on-1447',
  dayIndex: item.dayIndex ?? index + 1,
  dayCount: item.dayCount ?? 10,
  priority: item.priority ?? 140,
  dhikrKeys: item.dhikrKeys,
}));

export const SPECIAL_DAY_DATASET = {
  key: 'zilhicce-ilk-on-2026',
  label: 'Zilhicce İlk 10 Gün 2026',
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
