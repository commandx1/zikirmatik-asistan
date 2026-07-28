import { keyMap } from './keyMap.mjs';

export const beratKandili = {
  key: 'berat-kandili-2026',
  label: {
    tr: 'Berat Kandili 2026',
    en: "Laylat al-Bara'ah 2026",
  },
  category: 'ibadet',
  description: {
    tr: '15 Şaban 1447 gecesi (2 Şubat 2026): takdir-i ilahinin tecelli ettiği, amellerin, rızıkların ve ecellerin yıllık olarak karara bağlandığı mübarek gece.',
    en: 'The night of 15 Sha\'ban 1447 (2 February 2026): the blessed night on which divine decree manifests, and deeds, provisions, and appointed lifespans are ordained for the year.',
  },
  dhikrItems: [
    {
      key: keyMap.BERAT_DUASI,
      nameArabic:
        'اللَّهُمَّ ارْزُقْنَا قَلْباً تَقِيّاً مِنَ الشِّرْكِ بَرِيئاً لَا كَافِراً وَلَا شَقِيّاً',
      name: {
        tr: 'Berat Gecesi Kalp Duası',
        en: "Heart Supplication for Laylat al-Bara'ah",
      },
      transliteration: {
        tr: "Allâhümmerzuknâ kalben takiyyen mine'ş-şirki berîen, lâ kâfiren ve lâ şakiyyâ.",
        en: "Allahummarzuqna qalban taqiyyan minash-shirki bari'an, la kafiran wa la shaqiyyan.",
      },
      meaning: {
        tr: "Allah'ım! Bize şirkten uzak, tertemiz, takva sahibi bir kalp rızıklandır. İnkârcı ve isyankâr olmayan bir gönül ihsan eyle.",
        en: 'O Allah! Grant us a heart pious and free from idolatry, that is neither disbelieving nor rebellious, and bestow upon us from Your grace a heart of piety.',
      },
      virtue: {
        tr: "Hazreti Peygamber'in (s.a.v.) Berat Gecesi'nde en çok okuduğu ve ümmetine tavsiye ettiği kalbi koruma altına alan hususi duadır.",
        en: 'This is a special supplication that the Prophet (peace be upon him) frequently recited on the Night of Barat and recommended to his community as a means of guarding and protecting the heart.',
      },
      source: {
        tr: 'Hadis-i Şerif, Süheyl b. Amr rivayeti; Berat Kandili Duaları',
        en: 'Hadith, narrated by Suhail ibn Amr; Night of Barat Supplications',
      },
      tags: ['berat', 'kandil', 'kalp', 'dua', 'şaban', "laylat al-bara'ah"],
      categories: ['dua', 'ibadet', 'kandil', 'özel gün', 'berat'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes', 'berat kandili', "laylat al-bara'ah"],
    },
    {
      key: keyMap.BERAT_SECDE_DUASI,
      nameArabic:
        'أَعُوذُ بِعَفْوِكَ مِنْ عِقَابِكَ وَأَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ وَأَعُوذُ بِكَ مِنْكَ جَلَّ وَجْهُكَ لَا أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ',
      name: {
        tr: 'Berat Gecesi Secde Duası',
        en: "Prostration Supplication for Laylat al-Bara'ah",
      },
      transliteration: {
        tr: "Eûzü bi'afvike min ikâbike ve eûzü bi-rıdâke min sahatike ve eûzü bike minke. Celle vechüke, lâ uhsî senâen aleyke. Ente kemâ esneyte alâ nefsik.",
        en: "A'udhu bi 'afwika min 'iqabik, wa a'udhu bi ridaka min sakhatik, wa a'udhu bika minka. Jalla wajhuka. La uhsi thana'an 'alayka. Anta kama athnayta 'ala nafsik.",
      },
      meaning: {
        tr: 'Ya Rabbi, cezandan affına sığınırım, gazabından rızana sığınırım. Senden yine Sana sığınırım. Şanın yücedir; Seni layıkıyla övemem. Sen kendini övdüğün gibisin.',
        en: 'O my Lord, I seek refuge in Your pardon from Your punishment. I seek refuge in Your pleasure from Your wrath. I seek refuge in You from You. Your glory is beyond compare; I cannot praise You as You deserve. You are as You have praised Yourself.',
      },
      virtue: {
        tr: 'Berat Gecesi secdede en az 3 veya 7 defa okunması sünnet olan sığınma duasıdır. Secde halinde duanın kabulünün yakın olduğu bildirilmiştir.',
        en: 'On the Night of Barat, it is Sunnah to recite this supplication of seeking refuge in prostration at least 3 or 7 times. It is reported that supplications made in prostration are close to acceptance.',
      },
      source: {
        tr: "Müslim, Dua, 72; et-Tergib ve't-Terhib, 2/119",
        en: 'Muslim, Book of Supplications, 72; At-Targheeb wa At-Tarheeb, 2/119',
      },
      tags: ['berat', 'kandil', 'secde', 'dua', 'sığınma', "laylat al-bara'ah"],
      categories: ['dua', 'ibadet', 'kandil', 'özel gün', 'berat'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 7,
      suitableFor: ['herkes', 'berat kandili', "laylat al-bara'ah"],
    },
    {
      key: keyMap.RABBENA_LA_TUZIG,
      nameArabic:
        'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
      name: {
        tr: 'Berat Gecesi Hidayet Duası',
        en: "Guidance Supplication for Laylat al-Bara'ah",
      },
      transliteration: {
        tr: "Rabbenâ lâ tüziğ kulûbenâ ba'de iz hedeytenâ ve heb lenâ min ledünke rahmeh. İnneke ente'l-Vehhâb.",
        en: "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah. Innaka antal-Wahhab.",
      },
      meaning: {
        tr: 'Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi kaydırma, katından bize bir rahmet bağışla. Şüphesiz lütfu en bol olan Sensin.',
        en: 'Our Lord, do not deviate our hearts after You have guided us, and grant us mercy from Your presence. Indeed, You are the Bestower of abundantly.',
      },
      virtue: {
        tr: 'Berat Gecesi hidayetin korunması ve son nefeste kâmil imanla ölmek niyetiyle 300 kere okunması faziletli görülmüştür.',
        en: "On the Night of Barat, it is considered virtuous to recite this supplication 300 times with the intention of preserving guidance and dying with complete faith on one's last breath.",
      },
      source: {
        tr: "Kur'an-ı Kerim, Âl-i İmrân 3:8; Veliyüddîn er-Rahâvî el-Mahmûdî, Fezâilü'l-eyyâm",
        en: "Quran, Surah Aal-i-Imran 3:8; Wali al-Din al-Raha'i al-Mahmudi, Virtues of the Days",
      },
      tags: ['berat', 'kandil', 'hidayet', 'dua', 'kuran', "laylat al-bara'ah"],
      categories: ['dua', 'ibadet', 'kandil', 'özel gün', 'berat'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 300,
      suitableFor: ['herkes', 'berat kandili', "laylat al-bara'ah"],
    },
  ],
  specialDays: [
    {
      name: {
        tr: 'Berat Kandili',
        en: "Laylat al-Bara'ah",
      },
      type: 'kandil',
      date: '2026-02-02',
      hijriDate: '15 Şaban 1447',
      description: {
        tr: "Şaban'ın 15. gecesi: Allah'ın kimi bağışlayacağını, kimin rızkını, ömrünü ve kaderini belirleyeceğini açıkladığı mübarek gece. Üç Yasin, secde duası, istiğfar ve Salât-ı Münciye ile ihya edilir.",
        en: "The 15th night of Sha'ban: the blessed night on which Allah reveals whom He will forgive and decrees the provision, lifespan, and destiny of His servants. It is kept alive with three recitations of Surah Ya-Sin, the prostration supplication, istighfar, and Salat al-Munjiya.",
      },
      eventKey: 'berat-kandili-2026',
      priority: 170,
      dhikrKeys: [
        keyMap.BERAT_DUASI,
        keyMap.BERAT_SECDE_DUASI,
        keyMap.RABBENA_LA_TUZIG,
        keyMap.KADIR_DUASI,
        keyMap.MUNCIYE,
      ],
    },
  ],
};
