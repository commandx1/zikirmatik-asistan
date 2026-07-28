import { keyMap } from './keyMap.mjs';

export const regaibKandili = {
  key: 'regaib-kandili-2025',
  label: {
    tr: 'Regaib Kandili 2025',
    en: "Laylat al-Ragha'ib 2025",
  },
  category: 'ibadet',
  description: {
    tr: "Recep ayının ilk Cuma gecesi: meleklerin çokça rağbet ettiği, ilahi rahmetin sağanak gibi indiği ve duaların en üst mertebeye ulaştığı Regâib Kandili.",
    en: "The first Friday night of the month of Rajab: Laylat al-Ragha'ib, the holy night much sought by the angels, on which divine mercy pours down in abundance and supplications reach their highest station.",
  },
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
      tags: ['regaib kandili', 'recep', 'üç aylar', 'bereket', 'ramazan hazırlığı', 'kandil', 'özel gün', 'recep ayı girişi', 'şaban ayı girişi', "laylat al-ragha'ib", 'üç ayların başlangıcı', 'beginning of the month of rajab', "beginning of the month of sha'ban", 'the beginning of the three holy months'],
      categories: ['kandil', 'özel gün', 'dua', 'recep', 'üç aylar', 'regaib', 'cuma', 'şaban'],
      timeOfDay: ['sabah', 'aksam', 'gece'],
      recommendedCount: 100,
      suitableFor: ['herkes', 'regaib kandili', 'recep ayı girişi', 'şaban ayı girişi', "laylat al-ragha'ib", 'üç ayların başlangıcı', 'beginning of the month of rajab', "beginning of the month of sha'ban", 'the beginning of the three holy months'],
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
      tags: ['regaib', 'kandil', 'secde', 'tesbih', 'melek', 'özel gün', "laylat al-ragha'ib", 'safer ilk çarşamba gecesi', 'safer son çarşamba gecesi', 'last wednesday night of safar', 'first wednesday night of safar'],
      categories: ['zikir', 'ibadet', 'kandil', 'özel gün', 'regaib', 'cuma', 'safer'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 70,
      suitableFor: ['herkes', 'regaib kandili', "laylat al-ragha'ib", 'safer ilk çarşamba gecesi', 'safer son çarşamba gecesi', 'last wednesday night of safar', 'first wednesday night of safar'],
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
      tags: ['regaib', 'kandil', 'secde', 'mağfiret', 'dua', "laylat al-ragha'ib"],
      categories: ['dua', 'ibadet', 'kandil', 'özel gün', 'regaib', 'cuma'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 70,
      suitableFor: ['herkes', 'regaib kandili', "laylat al-ragha'ib"],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Regaib Kandili',
        en: "Laylat al-Ragha'ib",
      },
      type: 'kandil',
      date: '2025-12-25',
      hijriDate: '5 Recep 1447',
      description: {
        tr: "Recep ayının ilk Cuma gecesi: ilahi rahmetin sağanak gibi indiği, meleklerin çokça rağbet ettiği mübarek gece. 12 rekatlık Regâib namazı, secdede özel tesbihat ve Seyyidü'l-İstiğfar ile ihya edilir.",
        en: "The first Friday night of the month of Rajab: the blessed night on which divine mercy pours down in abundance and the angels are abundantly present. It is kept alive with the twelve-rak'ah Ragha'ib prayer, special glorifications in prostration, and Sayyid al-Istighfar.",
      },
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
    {
      name: {
        tr: 'Regaib Kandili',
        en: "Laylat al-Ragha'ib",
      },
      type: 'kandil',
      // Diyanet 2026 Dini Günler Listesi: 10 Aralık 2026 Perşembe
      // (1 Receb 1448) — perşembeyi cumaya bağlayan gece.
      date: '2026-12-10',
      hijriDate: '1 Recep 1448',
      description: {
        tr: "Recep ayının ilk cuma gecesi. Halk arasında kandil olarak idrak edilir; geceye mahsus sahih bir ibadet şekli nakledilmemiştir, nafile ibadet ve dua ile değerlendirilir.",
        en: 'The first Friday night of Rajab, observed as a kandil night. No form of worship specific to it is soundly transmitted; it is spent in voluntary devotion and supplication.',
      },
      article: {
        tr: `Regaib, sözlükte "kendisine rağbet edilen şey, bol ve değerli bağış" anlamındaki *ragībe* kelimesinin çoğuludur. Recep ayının ilk perşembesini cumaya bağlayan geceye bu ad verilmiş ve bu gece, Müslüman toplumların dinî kültüründe Regaib Kandili olarak yerleşmiştir.

Burada açık ve dürüst olmak gerekir. Türkiye Diyanet Vakfı İslâm Ansiklopedisi'nin ifadesiyle, hadis âlimleri bu gecenin "regaib" diye adlandırılmasının ve bu gecede kılınması âdet hâline gelen on iki rekâtlık "Regaib namazı"na dair rivayetlerin mevzû (uydurma) olduğu hususunda birleşmektedir. İbnü'l-Cevzî, bu namaz ve oruçla ilgili hadisin V./XI. yüzyılda uydurulduğunu ve başka hiçbir kaynakta geçmediğini kaydeder. Efendimiz'in bu gecede ana rahmine düştüğü yönündeki nakil de aynı şekilde asılsız görülmüştür. Nitekim bu geceye özel on iki rekâtlık namaz alışkanlığı, ancak hicrî V.–VI. yüzyıllarda ortaya çıkmıştır.

Buna karşılık âlimlerin bir kısmı — İbnü's-Salâh ve Ali el-Kārî gibi — rivayetlerin zayıflığına rağmen bu geceyi vesile ederek ibadet, dua, zikir ve hayırlı işlerle meşgul olmayı faydalı görmüştür. İbn Âbidîn ise bu namazı cemaatle kılmanın bid'at olduğunu, nafile hükmünde olduğu için evde tek başına kılınmasında bir sakınca bulunmadığını belirtmiştir.

Bu tabloya göre sağlıklı yaklaşım şudur: geceyi, "şu kadar rekât kılana şu vaat edilmiştir" türünden bir tarifeyle değil, zaten meşru ve sahih olan amellerle değerlendirmek. Nafile namaz kılmak, Kur'an okumak, tevbe ve istiğfar etmek, salavat getirmek, dua etmek, sadaka vermek ve gönül almak — bunların hiçbiri bu geceye özel değildir, fakat hepsi her zaman makbuldür.

Regaib aynı zamanda Recep ayının ilk günlerine denk gelir; yani Üç Aylar'ın hemen başında bir niyet tazeleme fırsatıdır. Geceyi, önümüzdeki üç ayın düzenini kurmak için bir başlangıç noktası saymak, ona yüklenmiş kaynağı belirsiz faziletlerden çok daha kalıcı bir kazanç sağlar.`,
        en: `"Ragha'ib" is the plural of *raghiba*, meaning a thing desired, an abundant and precious gift. The name was given to the night joining the first Thursday of Rajab to Friday, and it became established in Muslim religious culture as the Ragha'ib kandil.

Honesty is required here. As the Encyclopaedia of Islam of the Turkish Religious Foundation states, hadith scholars are agreed that the naming of this night as "ragha'ib" and the narrations concerning the twelve-rak'ah "Ragha'ib prayer" customarily performed on it are fabricated. Ibn al-Jawzi records that the hadith about this prayer and fast was invented in the fifth/eleventh century and appears in no other source. The report that the Prophet was conceived on this night has likewise been judged baseless. The custom of a twelve-rak'ah prayer specific to this night in fact only appeared in the fifth and sixth centuries AH.

Some scholars — such as Ibn al-Salah and Ali al-Qari — nonetheless considered it beneficial to take the night as an occasion for worship, supplication, remembrance, and good works, despite the weakness of the narrations. Ibn Abidin held that performing this prayer in congregation is an innovation, but that since it counts as voluntary prayer there is no harm in praying alone at home.

Given all this, the sound approach is to spend the night not by following a prescription of "so many units for such a promised reward," but with deeds that are already legitimate and well established: voluntary prayer, recitation of the Qur'an, repentance and seeking forgiveness, salawat, supplication, charity, and mending relationships. None of these is specific to this night, yet all of them are always acceptable.

Ragha'ib also falls in the opening days of Rajab — that is, right at the start of the Three Holy Months. Treating the night as a starting point for setting the rhythm of the coming three months yields something far more lasting than the virtues of uncertain origin attached to it.`,
      },
      practices: [
        {
          title: { tr: 'Nafile namaz kılmak', en: 'Praying voluntary prayers' },
          description: {
            tr: 'Geceye mahsus, sahih rivayete dayanan belirli bir rekât sayısı yoktur. Varsa kaza namazlarını kılmak önceliklidir; ardından nafile veya teheccüd namazı kılınabilir. Âlimler bu namazın cemaatle kılınmasını bid\'at saymış, evde tek başına kılınmasında sakınca görmemiştir.',
            en: 'There is no fixed number of units for this night established by sound narration. Making up missed obligatory prayers takes priority; after that one may pray voluntary or night prayers. Scholars regarded performing it in congregation as an innovation, while seeing no harm in praying alone at home.',
          },
        },
        {
          title: { tr: 'Tevbe ve istiğfar', en: 'Repentance and seeking forgiveness' },
          description: {
            tr: "Seyyidü'l-İstiğfar'ı okumak ve samimi bir tevbe ile geceyi karşılamak, bu gecenin en sağlam kazancıdır. İstiğfarın fazileti sahih hadislerle sabittir ve her zaman geçerlidir.",
            en: 'Reciting Sayyid al-Istighfar and meeting the night with sincere repentance is its firmest gain. The merit of seeking forgiveness is established by sound hadith and holds at all times.',
          },
        },
        {
          title: { tr: 'Kur\'an tilaveti', en: 'Recitation of the Qur\'an' },
          description: {
            tr: 'Gücünüz nispetinde Kur\'an okumak. Belirli bir sûre veya sayı şartı yoktur; anlamı üzerine düşünerek okumak esastır.',
            en: 'Reciting the Qur\'an according to your capacity. No particular chapter or count is required; what matters is reciting with reflection on the meaning.',
          },
        },
        {
          title: { tr: 'Salavat getirmek', en: 'Sending salawat' },
          description: {
            tr: "Ahzâb sûresi 56. âyetteki emir gereği Peygamber Efendimiz'e salât ve selam getirmek. Cuma gecesinde salavatı çoğaltmak, sahih rivayetlere dayanan yerleşik bir edeptir.",
            en: 'Sending blessings upon the Prophet, as commanded in al-Ahzab 33:56. Increasing salawat on the night before Friday is an established practice resting on sound narrations.',
          },
        },
        {
          title: { tr: 'Dua ve sadaka', en: 'Supplication and charity' },
          description: {
            tr: 'Kendiniz, aileniz ve tüm ümmet için dua etmek; muhtaç birine sadaka vermek, dargın olduğunuz biriyle barışmak. Gecenin bereketi bu amellerle somutlaşır.',
            en: 'Praying for yourself, your family, and the whole community; giving charity to someone in need; reconciling with a person you have fallen out with. It is in such deeds that the night takes concrete form.',
          },
        },
        {
          title: { tr: 'Üç Aylar için niyet kurmak', en: 'Setting an intention for the Three Holy Months' },
          description: {
            tr: 'Regaib, Recep\'in ilk günlerine denk gelir. Bu geceyi, Ramazan\'a kadar sürecek bir ibadet düzeni belirlemek için başlangıç noktası saymak en kalıcı kazançtır.',
            en: 'Ragha\'ib falls in the opening days of Rajab. Treating this night as the starting point for a devotional routine lasting until Ramadan is its most enduring benefit.',
          },
        },
      ],
      eventKey: 'regaib-kandili-2026',
      priority: 160,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.SEYYIDUL_ISTIGFAR,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.SUBBUHEN_KUDDUSUN,
      ],
    },
  ],
};
