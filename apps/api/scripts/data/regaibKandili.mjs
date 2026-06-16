import { keyMap } from './keyMap.mjs';

export const regaibKandili = {
  key: 'regaib-kandili-2025',
  label: 'Regaib Kandili 2025',
  category: 'ibadet',
  description:
    "Recep ayının ilk Cuma gecesi: meleklerin çokça rağbet ettiği, ilahi rahmetin sağanak gibi indiği ve duaların en üst mertebeye ulaştığı Regâib Kandili.",
  dhikrItems: [
    {
      key: keyMap.RECEP_DUASI,
      nameArabic:
        'اللّٰهُمَّ بَارِكْ لَنَا فِي رَجَبَ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ',
      nameTurkish: 'Recep Ayı ve Üç Aylar Duası',
      transliteration:
        "Allâhümme bârik lenâ fî recebin ve şa'bâne ve belliğnâ ramazân.",
      meaning:
        "Allah'ım, bize Recep ve Şaban'ı mübarek kıl; bizi Ramazan'a kavuştur.",
      virtue:
        "Peygamber Efendimiz Recep ayı girdiğinde bu duayı okurdu. Üç Aylar'a bereketli bir giriş niyetiyle okunan bu dua, kalbi Ramazan'a hazırlar; arınma, teslimiyet ve şükür bilincini canlı tutar. Recep Allah'ın ayı, Şaban Peygamber'in ayı, Ramazan ise ümmetin ayıdır; bu dua üçünü birden kuşatır.",
      source: "Ahmed bin Hanbel, Müsned, I, 259; Beyhakî, Şuabü'l-İman",
      tags: ['regaib kandili', 'recep', 'üç aylar', 'bereket', 'ramazan hazırlığı'],
      categories: ['kandil', 'özel gün', 'dua'],
      timeOfDay: ['sabah', 'aksam', 'gece'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.SUBBUHEN_KUDDUSUN,
      nameArabic: 'سُبُّوحٌ قُدُّوسٌ رَبُّنَا وَرَبُّ الْمَلَائِكَةِ وَالرُّوحِ',
      nameTurkish: "Sübbûhun Kuddûsün — Regâib Gecesi Secde Tesbihi",
      transliteration: "Sübbûhun Kuddûsün Rabbünâ ve Rabbül-melâiketi verrûh",
      meaning:
        "Rabbimiz, mukarreb meleklerin ve Ruh'un (Cebrail'in) Rabbi olan Allah, her türlü kusurdan münezzeh, eksikliklerden pak ve yücedir.",
      virtue:
        "Regâib Gecesi kılınan namazın secdelerinde 70'er defa okunur. Meleklerin yeryüzüne rağbet ettiği bu gecede secdede yapılan bu tesbihin ardından edilen duaların reddolunmayacağı rivayet edilmiştir.",
      source: 'İmam Gazâlî, İhyâu Ulûmiddîn, I, 554-555',
      tags: ['regaib', 'kandil', 'secde', 'tesbih', 'melek'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 70,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.RABBIGFIR_VERHAM,
      nameArabic:
        'رَبِّ اغْفِرْ وَارْحَمْ وَتَجَاوَزْ عَمَّا تَعْلَمُ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ',
      nameTurkish: "Rabbığfir Verham — Regâib Gecesi İki Secde Arası Duası",
      transliteration:
        "Rabbığfir verham ve tecâvez ammâ ta'lemü. İnneke ente'l-e'azzü'l-ekram",
      meaning:
        "Rabbim! Beni bağışla, bana merhamet et, bildiğin tüm kusurlarımdan geç ve onları bağışla; şüphesiz Sen en yüce ve en kerim olansın.",
      virtue:
        "Regâib gecesi iki secde arasında 70 defa okunur. Kalbi samimiyetle doldurarak günahların bütünüyle affedilmesini talep etmek ve ilahi merhamete sığınmak amacıyla okunur.",
      source: 'İmam Gazâlî, İhyâu Ulûmiddîn; Mahmud Sami Ramazanoğlu, Dualar ve Zikirler',
      tags: ['regaib', 'kandil', 'secde', 'mağfiret', 'dua'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 70,
      suitableFor: ['herkes'],
    },
  ],
  specialDays: [
    {
      name: 'Regaib Kandili',
      type: 'kandil',
      date: '2025-12-25',
      hijriDate: '5 Recep 1447',
      description:
        "Recep ayının ilk Cuma gecesi: ilahi rahmetin sağanak gibi indiği, meleklerin çokça rağbet ettiği mübarek gece. 12 rekatlık Regâib namazı, secdede özel tesbihat ve Seyyidü'l-İstiğfar ile ihya edilir.",
      eventKey: 'regaib-kandili-2025',
      priority: 160,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.SUBBUHEN_KUDDUSUN,
        keyMap.RABBIGFIR_VERHAM,
        keyMap.SEYYIDUL_ISTIGFAR,
        keyMap.SALAVAT_SERIF,
      ],
    },
  ],
};
