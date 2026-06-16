import { keyMap } from './keyMap.mjs';

export const kadirGecesi = {
  key: 'kadir-gecesi-2026',
  label: 'Kadir Gecesi 2026',
  category: 'ibadet',
  description:
    "Bin aydan daha hayırlı olan Kadir Gecesi: 27 Ramazan 1447, 16 Mart 2026.",
  dhikrItems: [
    {
      key: keyMap.KADIR_DUASI,
      nameArabic:
        'اللّٰهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
      nameTurkish: 'Kadir Gecesi Duası',
      transliteration:
        "Allâhümme inneke afüvvün kerîmün tühibbül afve fa'fü annî.",
      meaning:
        "Allah'ım, şüphesiz sen çok affedicisin, cömertin, affetmeyi seversin; beni de affet.",
      virtue:
        "Hz. Aişe Validemiz Peygamber Efendimiz'e 'Kadir Gecesi'ne yetişirsem ne diyeyim?' diye sormuş, Efendimiz bu duayı öğretmiştir. Tirmizî'nin sahih olarak naklettiği bu kısa dua, Kadir Gecesi'nin özüdür. İnsan bu gece her şeyden çok Allah'ın affını talep etmeli, hiçbir dünyalık istek duadan önce gelmemelidir. Büyük müfessirler bu duanın Kadir Gecesi'nde çok tekrar edilmesi gerektiği konusunda ittifak etmiştir. Kısa olmasına rağmen içerdiği anlam yoğunluğu ve sahihliği bakımından Kadir Gecesi'nin en kıymetli zikirlerindendir.",
      source: "Tirmizî, Deavât 84; Hz. Aişe rivayeti - sahih",
      tags: ['kadir gecesi', 'ramazan', 'af', 'mağfiret', 'dua'],
      categories: ['kandil', 'özel gün', 'ramazan', 'dua'],
      timeOfDay: 'night',
      recommendedCount: 1000,
      suitableFor: [
        'kadir gecesi',
        'mağfiret talebi',
        'af niyeti',
        'gece ibadeti',
        'ramazan son on',
        'tevbe',
        'yalvarış',
      ],
    },
  ],
  specialDays: [
    {
      name: 'Kadir Gecesi',
      type: 'kandil',
      date: '2026-03-16',
      hijriDate: '27 Ramazan 1447',
      description:
        "Bin aydan daha hayırlı olan Kadir Gecesi. Bu gece inen melekler ve Ruh, sabahın doğuşuna kadar esenlik getirir. (Kadir 1-5)",
      eventKey: 'kadir-gecesi-2026',
      priority: 200,
      dhikrKeys: [
        keyMap.KADIR_DUASI,
        keyMap.IHLAS,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.AYETEL_KURSI,
      ],
    },
  ],
};
