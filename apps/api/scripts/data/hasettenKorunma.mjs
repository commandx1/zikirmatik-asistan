import { keyMap } from './keyMap.mjs'

export const hasettenKorunma = {
  key: 'hasetten-korunma',
  label: 'Haset ve Kıskançlıktan Korunma Duaları',
  dhikrItems: [
    {
      key: 'haset-ya-mumin',
      nameArabic: 'يَا مُؤْمِنُ',
      nameTurkish: "Yâ Mü'min",
      transliteration: "Yâ Mü'min",
      meaning: "Gönüllerde iman ışığı uyandıran, kendine sığınanlara emniyet veren.",
      virtue:
        "Her gün sabah namazının ardından 167 defa zikredildiğinde kalbi ve dili riyadan, kibirden, hasetten ve kötü ahlaktan korur.",
      source: 'Esmâ-i Hüsnâ Literatürü',
      tags: ['haset', 'kiskanclık', 'korunma', 'riya', 'kibir', 'esma', 'sabah-zikri'],
      categories: ['genel', 'nefis-terbiyesi', 'manevi-destek', 'esma'],
      timeOfDay: 'morning',
      recommendedCount: 167,
      suitableFor: [
        'haset ve kıskançlık',
        'riya ve gösteriş',
        'kibir',
        'kötü ahlak',
        'kalp temizliği',
        'sabah namazı sonrası',
      ],
    },
    {
      key: keyMap.RABBENA_GFIR_GILLA,
      nameArabic:
        'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَحِيمٌ',
      nameTurkish: 'Kalpteki Kini Gideren Dua',
      transliteration:
        "Rabbenağfir lenâ ve li-ihvâninel-lezîne sebekûnâ bil-îmân, ve lâ tec'al fî kulûbinâ gıllen lillezîne âmenû, Rabbenâ inneke Raûfun Rahîm.",
      meaning:
        "Rabbimiz! Bizi ve bizden önce gelip geçmiş imanlı kardeşlerimizi bağışla; kalplerimizde, iman edenlere karşı hiçbir kin ve haset bırakma! Rabbimiz! Şüphesiz ki sen çok şefkatli, çok merhametlisin!",
      virtue:
        "İman edenlere karşı kalpte oluşabilecek kin, nefret ve haset duygularını kökten temizlemek ve kalbi selim kılmak için en etkili Kur'an dualarındandır.",
      source: "Haşir Suresi, 10. Ayet",
      tags: ['haset', 'kin', 'nefret', 'korunma', 'kalp-temizligi', 'kuran', 'dua'],
      categories: ['genel', 'nefis-terbiyesi', 'manevi-destek', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'kin ve nefret',
        'haset ve kıskançlık',
        'kalp selimliği',
        'kardeşlere karşı olumsuz duygular',
        'manevi arınma',
        'kalbi ıslah',
      ],
    },
    {
      key: keyMap.FELAK_SURESI,
      nameArabic:
        'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
      nameTurkish: 'Felak Suresi',
      transliteration:
        "Kul e'ûzü bi-Rabbil-felak. Min şerri mâ halak. Ve min şerri gâsıkin izâ vakab. Ve min şerrin-neffâsâti fil-ukad. Ve min şerri hâsidin izâ hasad.",
      meaning:
        "De ki: Sabahın Rabbine sığınırım. Yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyen büyücülerin şerrinden, kıskandığı zaman kıskanç kişinin şerrinden.",
      virtue:
        "Özellikle kıskançlık ve haset gibi kötü niyetlerin, kem gözlerin manevi etkilerinden ve hasetçinin şerrinden korunmak için sabah ve akşam 3'er defa okunması önerilir.",
      source: "Felak Suresi (Kur'an-ı Kerim, 113. Sure)",
      tags: ['haset', 'kiskanclık', 'korunma', 'nazardan-korunma', 'sabah-aksam', 'kuran'],
      categories: ['genel', 'korunma', 'manevi-destek', 'kuran'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'haset ve kıskançlık',
        'kem göz ve nazar',
        'manevi saldırılardan korunma',
        'sabah-akşam zikri',
        'genel korunma',
      ],
    },
    {
      key: 'haset-hasbiyallahu',
      nameArabic:
        'حَسْبِيَ اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
      nameTurkish: 'Hasbiyallâh Zikri',
      transliteration:
        "Hasbiyallâhu lâ ilâhe illâ hû. Aleyhi tevekkeltü ve hüve Rabbül arşil azîm.",
      meaning:
        "Allah bana yeter. O'ndan başka ilah yoktur. O'na tevekkül ettim. O yüce arşın Rabbidir.",
      virtue:
        "Kıskançlık, haset ve bunların getirdiği içsel daralmalar ile negatif etkilerden korunmak amacıyla günde 7 kez okunması tavsiye edilir.",
      source: "Hadis-i Şerif / İbn Sünni",
      tags: ['haset', 'kiskanclık', 'korunma', 'tevekkül', 'teslimiyet', 'hasbiye'],
      categories: ['genel', 'korunma', 'nefis-terbiyesi', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'haset ve kıskançlık',
        'içsel daralma',
        'negatif etkilerden korunma',
        'tevekkül güçlendirme',
        'manevi kalkan',
      ],
    },
    {
      key: 'haset-ya-hafiz',
      nameArabic: 'يَا حَافِظُ',
      nameTurkish: 'Yâ Hâfız',
      transliteration: 'Yâ Hâfız',
      meaning: "Koruyan, muhafaza eden, gözeten.",
      virtue:
        "Günde 100 defa zikredildiğinde kıskançlık, haset ve kötü enerjilere karşı manevi bir koruma kalkanı oluşturur.",
      source: 'Esmâ-i Hüsnâ Literatürü',
      tags: ['haset', 'kiskanclık', 'korunma', 'kotu-enerji', 'esma'],
      categories: ['genel', 'korunma', 'manevi-destek', 'esma'],
      timeOfDay: 'any',
      recommendedCount: 100,
      suitableFor: [
        'haset ve kıskançlık',
        'kötü enerjilerden korunma',
        'manevi kalkan',
        'nazar ve haset etkisi',
        'günlük korunma zikri',
      ],
    },
    {
      key: keyMap.LA_MANIA_LIMA_ATAYTE,
      nameArabic:
        'اللّٰهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ وَلَا رَادَّ لِمَا قَضَيْتَ وَلَا مُبَدِّلَ لِمَا حَكَمْتَ وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
      nameTurkish: 'Namaz Sonrası Teslimiyet Duası',
      transliteration:
        "Allâhümme lâ mâni'a limâ a'tayte, ve lâ mu'tiye limâ mena'te. Ve lâ râdde limâ kadayte ve lâ mübeddile limâ hakemte. Ve lâ yenfeu zel ceddi minkel cedd.",
      meaning:
        "Allah'ım! Senin verdiğine kimse engel olamaz. Senin men ettiğine de kimse veremez. Senin takdir ettiğini kimse geri çeviremez. Senin hükmünü kimse değiştiremez. Servet sahibine serveti senin katında fayda vermez.",
      virtue:
        "Hasedin kalbde kök salmasının temel mekanizması şudur: insan başkasının sahip olduğuna bakıp 'neden o var bende yok?' sorusunu sorar ve bu sorudan haset filizlenir. Bu dua, tam da o mekanizmayı kesen bir bilişsel çerçeve sunar; zira her nimetin tek kaynağının Allah olduğunu ve kimsenin O'nun takdirini ne engelleyebileceğini ne de değiştirebileceğini ilan eder. Başkasındaki nimet Allah'ın ona özel takdiridir, kendi yokluğu da Allah'ın bilinçli bir kararıdır; bu gerçek içselleştirildiğinde hasedi besleyen kıyaslama zemini ortadan kalkar. Düzenli okuyan kişilerde başkasının başarı ve nimetlerine karşı duyulan içsel sızının zamanla yerini rızaya ve teslimiyet hissine bıraktığı gözlemlenir. Peygamber Efendimiz bu duayı namaz sonrası sürekli okumuştur; günlük namazların ardından tekrar edilmesi, haset duygusunun fark edilip kırılması için güçlü bir rutin oluşturur.",
      source: 'Buhârî; Tirmizî; Nesâî',
      tags: ['haset', 'kiskanclık', 'korunma', 'teslimiyet', 'rıza', 'namaz-sonrasi', 'dua'],
      categories: ['genel', 'nefis-terbiyesi', 'manevi-destek', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 3,
      suitableFor: [
        'haset ve kıskançlık',
        'başkasının nimetini kıskanma',
        'ilahi taksimata rıza',
        'namaz sonrası zikir',
        'teslimiyet güçlendirme',
        'nefis terbiyesi',
      ],
    },
  ],
  specialDays: [],
}
