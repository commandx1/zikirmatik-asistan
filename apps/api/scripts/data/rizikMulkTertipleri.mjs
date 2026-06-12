import { keyMap } from './keyMap.mjs'

export const rizikMulkTertipleri = {
  key: 'rizik-ve-mulk-tertipleri',
  label: 'Rızık ve Mülk Tertipleri',
  dhikrItems: [
    {
      key: 'rizik-kombinasyon-ya-gani-ya-mugni',
      nameArabic: 'يَا غَنِيُّ يَا مُغْنِي',
      nameTurkish: 'Ya Gani Ya Muğnî',
      transliteration: 'Yâ Ganî, Yâ Muğnî',
      meaning: 'Ey mutlak zengin olan ve dilediğini zengin kılan Allahım.',
      virtue:
        'Rızık ve zenginlik niyeti için güçlü kombinasyon olarak zikredilir; fakirlik kapılarını kapatma niyeti taşır.',
      source: 'Havas ve esma kombinasyon geleneği',
      tags: ['rızık', 'zenginlik', 'esma kombinasyon', 'bereket'],
      categories: ['genel', 'esma', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 2160,
      suitableFor: ['fakirlikten kurtuluş', 'gelir artışı', 'maddi refah'],
    },
    {
      key: 'rizik-kombinasyon-ya-fettah-ya-malikel-mulk',
      nameArabic: 'يَا فَتَّاحُ يَا مَالِكَ الْمُلْكِ',
      nameTurkish: "Ya Fettâh Ya Mâlikü'l-Mülk",
      transliteration: "Yâ Fettâh, Yâ Mâlikü'l-Mülk",
      meaning: 'Ey kapıları açan ve mülkün sahibi olan Allahım.',
      virtue:
        'İş, rızık ve mülk kapılarının açılması niyetiyle okunan tertiplerdendir.',
      source: 'Havas ve esma kombinasyon geleneği',
      tags: ['rızık', 'mülk', 'iş kapısı', 'esma kombinasyon'],
      categories: ['genel', 'esma', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 2000,
      suitableFor: [
        'mülk edinme',
        'iş kapılarının açılması',
        'darlığın bitmesi',
      ],
    },
    {
      key: 'rizik-vakia-suresi-gece',
      nameArabic: 'سُورَةُ الْوَاقِعَةِ',
      nameTurkish: 'Vâkıa Suresi (Gecelik Vird)',
      transliteration: "Sûretü'l-Vâkıa",
      meaning: 'Vâkıa suresinin her gece düzenli okunması.',
      virtue:
        "İslam literatüründe 'zenginlik suresi' olarak anılır; fakirlik korkusuna karşı manevi destek kabul edilir.",
      source: "Abdullah b. Mes'ud rivayeti ve geleneksel vird uygulamaları",
      tags: ['rızık', 'vakia', 'sure', 'bereket'],
      categories: ['genel', 'sure', 'rızık bereket'],
      timeOfDay: 'night',
      recommendedCount: 10,
      suitableFor: ['gece virdi', 'geçim bereketi', 'fakirlik korkusu'],
    },
    {
      key: 'rizik-vakia-suresi-41-gun',
      nameArabic: 'سُورَةُ الْوَاقِعَةِ',
      nameTurkish: 'Vâkıa Suresi (41 Günlük Tertip)',
      transliteration: "Sûretü'l-Vâkıa",
      meaning:
        'Vâkıa suresinin 40 gün boyunca günlük 40/41 tekrar okunması tertibi.',
      virtue:
        'Düzenli okuma ile yorulmadan helal rızık ve geçim genişliği niyeti taşır.',
      source: 'Geleneksel vird tertipleri',
      tags: ['rızık', 'vakia', '40 gün', 'vird'],
      categories: ['genel', 'sure', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: ['40 günlük tertip', 'helal rızık', 'bereket artışı'],
    },
    {
      key: 'rizik-fatiha-seher-41',
      nameArabic: 'سُورَةُ الْفَاتِحَةِ',
      nameTurkish: 'Fâtiha Suresi (Seher Tertibi)',
      transliteration: "Sûretü'l-Fâtiha",
      meaning: 'Fâtiha suresinin seher vaktinde 40/41 defa okunması.',
      virtue:
        'Maddi ve manevi bereket kapılarının açılması niyetiyle seherde uygulanan tertiplerdendir.',
      source: 'Tasavvufi vird ve tecrübe geleneği',
      tags: ['rızık', 'fatiha', 'seher', 'bereket'],
      categories: ['genel', 'sure', 'rızık bereket'],
      timeOfDay: 'morning',
      recommendedCount: 41,
      suitableFor: ['seher vakti', 'rızık bereketi', 'hane bereketi'],
    },
    {
      key: 'rizik-kadr-suresi',
      nameArabic: 'سُورَةُ الْقَدْرِ',
      nameTurkish: 'Kadr Suresi',
      transliteration: "Sûretü'l-Kadr",
      meaning: 'Kadr suresinin malın korunması ve bereket niyetiyle okunması.',
      virtue:
        'Malın zayi olmaması, bereketin artması ve borçların ödenmesine manevi destek niyetiyle okunur.',
      source: 'Geleneksel rızık ve korunma uygulamaları',
      tags: ['rızık', 'kadr', 'mal koruma', 'bereket'],
      categories: ['genel', 'sure', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['mal korunması', 'borç ödemesi', 'bereket niyeti'],
    },
    {
      key: 'rizik-fatir-29-30',
      nameArabic:
        'إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنْفَقُوا مِمَّا رَزَقْنَاهُمْ سِرًّا وَعَلَانِيَةً يَرْجُونَ تِجَارَةً لَنْ تَبُورَ',
      nameTurkish: 'Fâtır 29-30 Ticaret Ayetleri',
      transliteration:
        'İnnellezîne yetlûne kitâbellâhi ve ekâmus-salâte ve enfekû mimmâ razaknâhum sirran ve alâniyeten yercûne ticâreten len tebûr.',
      meaning:
        "Allah'ın kitabını okuyan, namazı dosdoğru kılan ve infak edenlerin bitip tükenmeyecek bir ticaret ummaları.",
      virtue:
        "Ticarette kesadın önlenmesi ve 'ticaraten len tebûr' sırrına erişme niyetiyle okunur.",
      source: 'Fâtır Suresi 29-30',
      tags: ['rızık', 'ticaret', 'fatir', 'helal kazanç'],
      categories: ['genel', 'ayet', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 33,
      suitableFor: ['ticari bereket', 'helal kazanç', 'iş sürekliliği'],
    },
    {
      key: keyMap.RIZIK_EBU_UMAME,
      nameArabic:
        'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
      nameTurkish: 'Ebu Ümâme Duası',
      transliteration:
        'Allâhümme innî eûzü bike minel hemmi vel-hazen, ve eûzü bike minel aczi vel-kesel, ve eûzü bike minel-cübnî vel-buhl, ve eûzü bike min galebetid-deyni ve kahri’r-ricâl.',
      meaning:
        'Allahım, kederden, acizlikten, tembellikten, cimrilikten, borcun baskısından ve insanların kahrından sana sığınırım.',
      virtue:
        'Sabah-akşam okunarak borç ve kaygı yükünü hafifletmeye, psikolojik direnci artırmaya niyet edilir.',
      source: 'Buhârî, Deavât',
      tags: ['rızık', 'borç', 'kaygı', 'sabır'],
      categories: ['genel', 'dua', 'rızık bereket', 'gelecek kaygısı'],
      timeOfDay: 'any',
      recommendedCount: 2,
      suitableFor: ['sabah akşam virdi', 'borç baskısı', 'psikolojik direnç'],
    },
    {
      key: 'rizik-hz-muaz-borc-duasi',
      nameArabic:
        'اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَنْ تَشَاءُ وَتَنْزِعُ الْمُلْكَ مِمَّنْ تَشَاءُ... تَرْحَمُ مَنْ تَشَاءُ وَأَنْتَ الرَّحْمٰنُ الرَّحِيمُ ارْزُقْنِي رَحْمَةً تُغْنِينِي بِهَا عَمَّنْ سِوَاكَ',
      nameTurkish: "Hz. Muâz'a Öğretilen Borç Duası",
      transliteration:
        'Allâhümme mâlikel-mülki tü’til-mülke men teşâ’ ve tenziul-mülke mimmen teşâ’... terhamü men teşâ’ ve ente’r-Rahmânü’r-Rahîm, ürzüknî rahmeten tuğnînî bihâ ammen sivâk.',
      meaning:
        'Ey mülkün sahibi Allahım, mülkü dilediğine verirsin... beni senden başkasına muhtaç etmeyecek bir rahmetle rızıklandır.',
      virtue:
        'Ağır borç yükünün hafiflemesi ve geniş rızka vesile olması niyetiyle öğretilen dualardandır.',
      source: "Hz. Muâz'a talim edilen borç duası rivayetleri",
      tags: ['rızık', 'borç', 'mülk', 'rahmet'],
      categories: ['genel', 'dua', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: ['yüksek borç', 'muhtaçlıktan kurtulma', 'rızık genişliği'],
    },
    {
      key: 'rizik-la-ilahe-illallahul-melikul-hakkul-mubin',
      nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ الْمَلِكُ الْحَقُّ الْمُبِينُ',
      nameTurkish: "Lâ ilâhe illallâhu'l Melikü'l Hakkul Mübin",
      transliteration: "Lâ ilâhe illallâhu'l Melikü'l Hakkul Mübin.",
      meaning: 'Allah’tan başka ilah yoktur; O Melik, Hak ve apaçık olandır.',
      virtue:
        'Fakirlikten korunma ve kazancın bereketlenmesi niyetiyle günlük vird olarak okunur.',
      source: 'Geleneksel temcid zikirleri',
      tags: ['rızık', 'temcid', 'tevhid', 'bereket'],
      categories: ['genel', 'dua', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: ['fakirlik korkusu', 'gelir bereketi', 'günlük vird'],
    },
    {
      key: 'rizik-hz-suleyman-mulk-duasi',
      nameArabic:
        'رَبِّ اغْفِرْ لِي وَهَبْ لِي مُلْكًا لَا يَنْبَغِي لِأَحَدٍ مِنْ بَعْدِي إِنَّكَ أَنْتَ الْوَهَّابُ',
      nameTurkish: "Hz. Süleyman'ın Mülk Duası",
      transliteration:
        'Rabbiğfir lî ve heb lî mülken lâ yenbeğî li-ehadin min ba’dî inneke entel-Vehhâb.',
      meaning:
        'Rabbim, beni bağışla ve bana benden sonra kimseye nasip olmayacak bir mülk ver. Şüphesiz sen çok bağışta bulunansın.',
      virtue:
        'Hayırlı bir yuva, mülk edinme ve maddi imkanların helal yoldan artması niyetiyle okunur.',
      source: 'Sâd Suresi, 35. Ayet',
      tags: ['rızık', 'mülk', 'ev', 'vehhab'],
      categories: ['genel', 'ayet', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 41,
      suitableFor: ['ev sahibi olma', 'mülk edinme', 'hayırlı yuva'],
    },
    {
      key: 'rizik-ya-zul-celali-vel-ikram',
      nameArabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
      nameTurkish: 'Ya Zül Celâli vel İkrâm',
      transliteration: 'Yâ Zül-Celâli vel-İkrâm',
      meaning: 'Ey celal ve ikram sahibi olan Allahım.',
      virtue:
        'Refah, bereket ve dünyevi işlerde kolaylık niyetiyle tertiplerde zikredilir.',
      source: 'Esma ve vird geleneği',
      tags: ['esma', 'bereket', 'ikram', 'refah'],
      categories: ['genel', 'esma', 'rızık bereket'],
      timeOfDay: 'any',
      recommendedCount: 1100,
      suitableFor: ['iş kolaylığı', 'bereket artışı', 'itibar'],
    },
  ],
  specialDays: [],
};
