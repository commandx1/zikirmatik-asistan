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
      name: {
        tr: 'Recep Ayı ve Üç Aylar Duası',
        en: 'Supplication for Rajab and the Three Sacred Months',
      },
      transliteration: {
        tr: "Allâhümme bârik lenâ fî recebin ve şa'bâne ve belliğnâ ramazân.",
        en: "Allahumma barik lana fi Rajaba wa Sha'bana wa ballighna Ramadan.",
      },
      meaning: {
        tr: "Allah'ım, bize Recep ve Şaban'ı mübarek kıl; bizi Ramazan'a kavuştur.",
        en: "O Allah, bless Rajab and Sha'ban for us, and allow us to reach Ramadan.",
      },
      virtue: {
        tr: "Resûlullah'ın (sas) Recep ayı girdiğinde bu duayı okuduğu rivayet edilmiştir. Üç Aylar'a bereketli bir giriş niyetiyle okunan bu dua, kalbi Ramazan'a hazırlar; arınma, teslimiyet ve şükür bilincini canlı tutar. Recep Allah'ın ayı, Şaban Resûlullah'ın (sas) ayı, Ramazan ise ümmetin ayı olarak anılır; bu dua üçünü birden kuşatır.",
        en: "It is narrated that the Messenger of Allah (peace be upon him) would recite this supplication when the month of Rajab entered. Recited with the intention of entering the Three Sacred Months with blessing, this supplication prepares the heart for Ramadan and keeps alive the awareness of purification, submission, and gratitude. Rajab is referred to as the month of Allah, Sha'ban as the month of the Messenger of Allah (peace be upon him), and Ramadan as the month of the Ummah; this supplication gathers all three together.",
      },
      source: {
        tr: "Ahmed bin Hanbel, Müsned, I, 259; Beyhakî, Şuabü'l-İman",
        en: "Ahmad ibn Hanbal, Musnad, I, 259; Al-Bayhaqi, Shu'ab al-Iman",
      },
      tags: ['regaib kandili', 'recep', 'üç aylar', 'bereket', 'ramazan hazırlığı'],
      categories: ['kandil', 'özel gün', 'dua'],
      timeOfDay: ['sabah', 'aksam', 'gece'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.SUBBUHEN_KUDDUSUN,
      nameArabic: 'سُبُّوحٌ قُدُّوسٌ رَبُّنَا وَرَبُّ الْمَلَائِكَةِ وَالرُّوحِ',
      name: {
        tr: 'Regâib Gecesi Secde Tesbihi',
        en: "Prostration Tasbih for Laylat al-Ragha'ib",
      },
      transliteration: {
        tr: "Sübbûhun Kuddûsün Rabbünâ ve Rabbü'l-melâiketi ve'r-rûh.",
        en: "Subbuhun quddusun Rabbuna wa Rabbul-mala'ikati war-ruh.",
      },
      meaning: {
        tr: "Rabbimiz, meleklerin ve Ruh'un Rabbi olan Allah, her türlü kusurdan münezzeh, eksikliklerden pak ve yücedir.",
        en: 'Our Lord, the Lord of the angels and the Ruh, is free from every imperfection, pure from every deficiency, and exalted in holiness.',
      },
      virtue: {
        tr: "Regâib Gecesi kılınan namazın secdelerinde 70'er defa okunur. Meleklerin yeryüzüne rağbet ettiği bu gecede secdede yapılan bu tesbihin ardından edilen duaların reddolunmayacağı rivayet edilmiştir.",
        en: "It is recited 70 times in each prostration of the prayer performed on Laylat al-Ragha'ib. It has been narrated that, on this night when the angels turn toward the earth in abundance, supplications made after this Tasbih in prostration will not be rejected.",
      },
      source: {
        tr: 'İmam Gazâlî, İhyâu Ulûmiddîn, I, 554-555',
        en: "Imam al-Ghazali, Ihya' Ulum al-Din, I, 554-555",
      },
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
      name: {
        tr: 'Regâib Gecesi İki Secde Arası Duası',
        en: "Supplication Between the Two Prostrations for Laylat al-Ragha'ib",
      },
      transliteration: {
        tr: "Rabbiğfir verham ve tecâvez ammâ ta'lem. İnneke ente'l-e'azzü'l-ekram.",
        en: "Rabbi-ghfir warham wa tajawaz 'amma ta'lam. Innaka antal-a'azzul-akram.",
      },
      meaning: {
        tr: 'Rabbim! Beni bağışla, bana merhamet et, bildiğin kusurlarımdan geç. Şüphesiz Sen en izzetli ve en kerem sahibisin.',
        en: 'My Lord, forgive me, have mercy on me, and overlook what You know. Indeed, You are the Most Mighty and the Most Generous.',
      },
      virtue: {
        tr: 'Regâib Gecesi iki secde arasında 70 defa okunur. Kalbi samimiyetle doldurarak günahların bütünüyle affedilmesini talep etmek ve ilahi merhamete sığınmak amacıyla okunur.',
        en: "It is recited 70 times between the two prostrations on Laylat al-Ragha'ib. It is read with a heart filled with sincerity, seeking complete forgiveness for sins and taking refuge in divine mercy.",
      },
      source: {
        tr: 'İmam Gazâlî, İhyâu Ulûmiddîn; Mahmud Sami Ramazanoğlu, Dualar ve Zikirler',
        en: "Imam al-Ghazali, Ihya' Ulum al-Din; Mahmud Sami Ramazanoglu, Supplications and Dhikrs",
      },
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
