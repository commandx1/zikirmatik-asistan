/*
pnpm --filter api seed:special-days:mevlid-2026
*/

import { pathToFileURL } from 'node:url';
import { runSpecialDaySeed } from './lib/special-day-seed.mjs';

const DHIKR_ITEMS = [
  {
    key: 'mevlid-salavat-1000',
    nameArabic:
      'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
    nameTurkish: 'Mevlid Salavatı',
    transliteration:
      'Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
    meaning: "Allah'ım, Efendimiz Muhammed'e ve O'nun aline salat eyle.",
    virtue:
      'Peygamber sevgisini güçlendirir, kalpte muhabbet ve bağlılığı artırır.',
    source: 'Salavat fazileti rivayetleri',
    tags: ['mevlid-kandili', 'salavat', 'peygamber-sevgisi'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 1000,
    suitableFor: ['kandil gecesi', 'mevlid programı', 'peygamber sevgisi'],
  },
  {
    key: 'mevlid-tevhid-100',
    nameArabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    nameTurkish: 'Mevlid Tevhid Zikri',
    transliteration: 'Lâ ilâhe illallâh.',
    meaning: "Allah'tan başka ilah yoktur.",
    virtue:
      'Tevhid şuurunu kuvvetlendirir, ibadetleri ihlasla yapmaya yardımcı olur.',
    source: 'Tevhid zikirleri',
    tags: ['mevlid-kandili', 'tevhid'],
    categories: ['kandil', 'özel gün', 'tevhid'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['iman tazeleme', 'kandil gecesi', 'tefekkür'],
  },
  {
    key: 'mevlid-istigfar-100',
    nameArabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    nameTurkish: 'Mevlid İstiğfarı',
    transliteration: 'Estağfirullâhel-azîme ve etûbü ileyh.',
    meaning: "Azim olan Allah'tan mağfiret dilerim ve O'na tövbe ederim.",
    virtue:
      'Kalbi arındırır, kusurlar için tevbe bilincini canlı tutar.',
    source: 'Tirmizi, Deavat',
    tags: ['mevlid-kandili', 'istigfar', 'tevbe'],
    categories: ['kandil', 'özel gün', 'istigfar'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['tevbe', 'arınma', 'gece ibadeti'],
  },
  {
    key: 'mevlid-la-havle-100',
    nameArabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
    nameTurkish: 'Lâ Havle Zikri',
    transliteration: 'Lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm.',
    meaning:
      'Güç ve kuvvet yalnızca yüce ve büyük olan Allahın yardımıyladır.',
    virtue:
      'Kulun acziyetini kabul ederek mutlak güç ve kudreti Allaha havale etmesini sağlar; tevekkül ve teslimiyet bilincini güçlendirir.',
    source: 'Havkale fazileti rivayetleri',
    tags: ['mevlid-kandili', 'havkale', 'tevekkül', 'teslimiyet'],
    categories: ['kandil', 'özel gün', 'tevekkül'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['acziyet bilinci', 'tevekkül', 'zorlanma anları'],
  },
  {
    key: 'mevlid-duha-suresi-50',
    nameArabic:
      'وَالضُّحَى وَاللَّيْلِ إِذَا سَجَى مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَى',
    nameTurkish: 'Duha Suresi',
    transliteration:
      'Ved-duhâ. Velleyli izâ secâ. Mâ veddeake rabbüke ve mâ kalâ.',
    meaning:
      'Kuşluk vaktine ve sükun bulmuş geceye andolsun. Rabbin seni terk etmedi ve sana darılmadı.',
    virtue:
      'Ümit, teselli ve rahmet vurgusunu güçlendirir; kalbe ferahlık ve teslimiyet kazandırır.',
    source: 'Duha Suresi',
    tags: ['mevlid-kandili', 'kuran', 'sure', 'teselli'],
    categories: ['kandil', 'özel gün', 'kuran'],
    timeOfDay: 'any',
    recommendedCount: 50,
    suitableFor: ['manevi ferahlık', 'tefekkür', 'kandil gecesi'],
  },
  {
    key: 'mevlid-seytandan-siginma-33',
    nameArabic:
      'أَعُوذُ بِاللّٰهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ رَبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَعُوذُ بِكَ رَبِّ أَنْ يَحْضُرُونِ',
    nameTurkish: 'Şeytanın Şerrinden Sığınma Duası',
    transliteration:
      'Eûzu billâhis-semîil-alîmi mineş-şeytânir-racîm. Rabbi eûzu bike min hemezâtiş-şeyâtîn. Ve eûzu bike rabbi en yahdurûn.',
    meaning:
      'İşiten ve bilen Allah’a kovulmuş şeytandan sığınırım. Rabbim, şeytanların vesveselerinden Sana sığınırım ve onların yanımda bulunmalarından da Sana sığınırım.',
    virtue:
      'Kalbi vesvese ve dağınıklıktan korumaya yardımcı olur; zikri huzurla sürdürmek için manevi korunma bilinci kazandırır.',
    source: 'Müminun 97-98',
    tags: ['mevlid-kandili', 'dua', 'korunma', 'siginma'],
    categories: ['kandil', 'özel gün', 'dua'],
    timeOfDay: 'any',
    recommendedCount: 33,
    suitableFor: ['vesveseden korunma', 'manevi korunma', 'gece ibadeti'],
  },
  {
    key: 'mevlid-sabir-ve-sebat-ayeti',
    nameArabic:
      'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا وَاتَّقُوا اللّٰهَ لَعَلَّكُمْ تُفْلِحُونَ صَدَقَ اللّٰهُ الْعَظِيمُ',
    nameTurkish: 'Sabır ve Sebat Ayeti',
    transliteration:
      'Bismillâhir-rahmânir-rahîm. Yâ eyyühellezîne âmenûsbirû ve sâbirû ve râbitû vettekullâhe lealleküm tüflihûn. Sadekallâhül-azîm.',
    meaning:
      'Ey iman edenler, sabredin, sabırda yarışın, hazırlıklı ve uyanık olun, Allahtan sakının ki kurtuluşa eresiniz.',
    virtue:
      'Sabır, sebat ve takva bilincini güçlendirir; kandil gecesinde nefis muhasebesine ve manevi diriliğe destek olur.',
    source: 'Âl-i İmran 200',
    tags: ['mevlid-kandili', 'kuran', 'ayet', 'sabir', 'takva'],
    categories: ['kandil', 'özel gün', 'kuran'],
    timeOfDay: 'any',
    recommendedCount: 1,
    suitableFor: ['sabır', 'sebat', 'manevi disiplin'],
  },
  {
    key: 'mevlid-salavat-emri-ayeti',
    nameArabic:
      'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ إِنَّ اللّٰهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا صَدَقَ اللّٰهُ الْعَظِيمُ',
    nameTurkish: 'Salavat Emri Ayeti',
    transliteration:
      'Bismillâhir-rahmânir-rahîm. İnnallâhe ve melâiketehû yüsallûne alen-nebiyy. Yâ eyyühellezîne âmenû sallû aleyhi ve sellimû teslîmâ. Sadekallâhül-azîm.',
    meaning:
      'Şüphesiz Allah ve melekleri Peygambere salat ederler. Ey iman edenler, siz de ona salat edin ve tam bir teslimiyetle selam verin.',
    virtue:
      'Peygambere salavat bilincini kuvvetlendirir; Mevlid Kandili gecesinde sünnete bağlılık ve muhabbeti artırır.',
    source: 'Ahzab 56',
    tags: ['mevlid-kandili', 'kuran', 'ayet', 'salavat', 'peygamber-sevgisi'],
    categories: ['kandil', 'özel gün', 'kuran', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 1,
    suitableFor: ['salavat bilinci', 'peygamber sevgisi', 'kandil gecesi'],
  },
  {
    key: 'mevlid-salavat-sellim-barik-100',
    nameArabic:
      'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ',
    nameTurkish: 'Salavat-ı Şerife (Salli Sellim Barik)',
    transliteration:
      'Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
    meaning:
      "Allah'ım, Efendimiz Muhammed'e ve O'nun aline salat, selam ve bereket ihsan eyle.",
    virtue:
      'Peygamber sevgisini artırır, sünnete bağlılığı güçlendirir ve kalpte rahmet-bereket bilincini canlı tutar.',
    source: 'Salavat fazileti rivayetleri',
    tags: ['mevlid-kandili', 'salavat', 'bereket', 'peygamber-sevgisi'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['salavat', 'peygamber sevgisi', 'manevi bereket'],
  },
  {
    key: 'mevlid-rabbena-zalemna-100',
    nameArabic:
      'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    nameTurkish: "Hz. Adem'in Duası",
    transliteration:
      'Rabbenâ zalemnâ enfüsenâ ve in lem tağfir lenâ ve terhamnâ le nekûnenne minel-hâsirîn.',
    meaning:
      'Rabbimiz, biz kendimize zulmettik. Eğer bizi bağışlamaz ve bize merhamet etmezsen mutlaka ziyan edenlerden oluruz.',
    virtue:
      'Tevbe, pişmanlık ve ilahi merhamet talebini derinleştirir; nefis muhasebesini güçlendirir.',
    source: 'Araf 23',
    tags: ['mevlid-kandili', 'dua', 'tevbe', 'merhamet'],
    categories: ['kandil', 'özel gün', 'dua', 'istigfar'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['tevbe', 'pişmanlık', 'merhamet talebi'],
  },
  {
    key: 'mevlid-rabbi-inni-messeni-100',
    nameArabic:
      'رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
    nameTurkish: "Hz. Eyyûb'un Duası",
    transliteration: 'Rabbi innî messeniyed-durru ve ente erhamür-râhimîn.',
    meaning:
      'Rabbim, şüphesiz bana bir zarar dokundu; Sen merhametlilerin en merhametlisisin.',
    virtue:
      'Sabrı, sığınmayı ve rahmet ümidini güçlendirir; sıkıntı anlarında kalbi teslimiyete yöneltir.',
    source: 'Enbiya 83',
    tags: ['mevlid-kandili', 'dua', 'sabir', 'rahmet'],
    categories: ['kandil', 'özel gün', 'dua'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['sıkıntı anları', 'sabır', 'rahmet talebi'],
  },
  {
    key: 'mevlid-la-ilahe-illa-ente-100',
    nameArabic:
      'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    nameTurkish: "Hz. Yunus'un Duası",
    transliteration: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn.',
    meaning:
      'Senden başka ilah yoktur, Seni tenzih ederim. Şüphesiz ben zalimlerden oldum.',
    virtue:
      'Tevbe, teslimiyet ve kurtuluş ümidi bilincini güçlendirir; darlık anlarında kalbe sığınma şuuru verir.',
    source: 'Enbiya 87',
    tags: ['mevlid-kandili', 'dua', 'tevbe', 'tevhid'],
    categories: ['kandil', 'özel gün', 'dua', 'tevhid'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['darlık anları', 'tevbe', 'manevi sığınma'],
  },
  {
    key: 'mevlid-kema-lillahi-salavat-100',
    nameArabic:
      'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ عَدَدَ كَمَالِ اللّٰهِ وَكَمَا يَلِيقُ بِكَمَالِهِ',
    nameTurkish: 'Kema Lillahi Salavatı',
    transliteration:
      'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedin ve alâ âlihi adede kema-lillahi ve kema yeligu bikemâlih.',
    meaning:
      "Allah'ım, Efendimiz Muhammed'e ve aline Senin kemaline yaraşır şekilde salat, selam ve bereket ihsan eyle.",
    virtue:
      'Tek bir okunuşta yetmiş bin salavatın manevi sevabına eşdeğer kabul edilen salavat tertibidir.',
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'kemal', 'bereket'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['salavat hatmi', 'manevi bereket', 'peygamber sevgisi'],
  },
  {
    key: 'mevlid-delail-hayrat-dengi-100',
    nameArabic:
      'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ صَلَاةً تُعَادِلُ جَمِيعَ صَلَوَاتِ أَهْلِ مَحَبَّتِكَ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ سَلَامًا يُعَادِلُ سَلَامَهُمْ',
    nameTurkish: "Delailü'l-Hayrat Dengi Salavat",
    transliteration:
      "Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âlihi salâten te'dilü cemî'a salevâti ehli mehabbetike ve sellim alâ seyyidinâ Muhammedin ve alâ âlihi selâmen ya'dilü selâmehüm.",
    meaning:
      'Allahım, Efendimiz Muhammede ve aline, muhabbet ehlinin tüm salavatlarına denk bir salat; onların selamlarına denk bir selam eyle.',
    virtue:
      "Üç kez okunduğunda tüm muhabbet ehlinin salavatlarının toplamına ve Delailü'l-Hayrat okumaya denk sayılan bir salavat tertibidir.",
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'delail', 'muhabbet'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['muhabbet ehli niyeti', 'salavat programı', 'kandil gecesi'],
  },
  {
    key: 'mevlid-nur-u-zatiyye-100',
    nameArabic:
      'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ النُّورِ الذَّاتِيِّ وَالسِّرِّ السَّارِي فِي سَائِرِ الْأَسْمَاءِ وَالصِّفَاتِ',
    nameTurkish: 'Nur-u Zatiyye Salavatı',
    transliteration:
      'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedin in-nûriz-zâtiyyi ves sirris-sârî fî sâiril esmâi ves sıfât.',
    meaning:
      "Allah'ım, zatî nur ve ilahi isim-sıfatlarda tecelli eden sır sahibi Efendimiz Muhammed'e salat, selam ve bereket eyle.",
    virtue:
      'Nur-u Zatiyye salavatı olarak bilinir; yüz bin salavat kuvvetinde zihni aydınlattığı kabul edilir.',
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'nur', 'tefekkür'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['zihinsel berraklık', 'manevi nur talebi', 'tefekkür'],
  },
  {
    key: 'mevlid-salavat-i-fatih-100',
    nameArabic:
      'اللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ وَالْخَاتِمِ لِمَا سَبَقَ',
    nameTurkish: 'Salavat-ı Fatih',
    transliteration:
      'Allâhümme salli ve sellim ve barik alâ seyyidinâ Muhammedinil fâtihi limâ uğlika vel hâtimi limâ sebeka...',
    meaning:
      'Allahım, kapalı olanı açan ve önceki hakikatleri tamamlayan Efendimiz Muhammede salat, selam ve bereket eyle.',
    virtue:
      'Kapalı kapıları açan, hakka yardım eden ve hidayet yolunu gösteren en kuvvetli salavatlardan kabul edilir.',
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'feth', 'hidayet'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['hidayet talebi', 'zor işlerin açılması', 'manevi destek'],
  },
  {
    key: 'mevlid-hz-fatima-salavati-100',
    nameArabic:
      'اللّٰهُمَّ صَلِّ عَلَى مَنْ رُوحُهُ مِحْرَابُ الْأَرْوَاحِ وَالْمَلَائِكَةِ وَالْكَوْنِ اللّٰهُمَّ صَلِّ عَلَى مَنْ هُوَ إِمَامُ الْأَنْبِيَاءِ',
    nameTurkish: "Hz. Fatıma'nın Salavatı",
    transliteration:
      'Allâhümme salli alâ men rûhuhu mihrâbül ervâhı vel melâiketi vel kevn. Allâhümme salli alâ men hüve imâmül enbiyâi...',
    meaning:
      'Allahım, ruhu varlık ve melekut âleminin kıblesi olan zata ve peygamberlerin imamına salat eyle.',
    virtue:
      'Denizler mürekkep, ağaçlar kalem olsa sevabının yazılamayacağı nakledilen yüce bir salavat tertibidir.',
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'ehlibeyt', 'muhabbet'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['ehlibeyt muhabbeti', 'derin salavat', 'kandil gecesi'],
  },
  {
    key: 'mevlid-ruyada-gorme-salavati-70',
    nameArabic:
      'اللّٰهُمَّ صَلِّ عَلَى رُوحِ سَيِّدِنَا مُحَمَّدٍ فِي الْأَرْوَاحِ اللّٰهُمَّ صَلِّ عَلَى جَسَدِ سَيِّدِنَا مُحَمَّدٍ فِي الْأَجْسَادِ',
    nameTurkish: 'Rüyada Görme Salavatı',
    transliteration:
      'Allâhümme salli alâ rûhi seyyidinâ Muhammedin fil ervâh. Allâhümme salli alâ cesedi seyyidinâ Muhammedin fil ecsâd...',
    meaning:
      'Allahım, Efendimiz Muhammedin ruhuna ruhlar aleminde ve bedenine bedenler aleminde salat eyle.',
    virtue:
      "Yatmadan önce açıktan yetmiş kez okunduğunda Peygamber'i rüyada görmeye vesile kılındığı nakledilir.",
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'ruya', 'gece-ibadeti'],
    categories: ['kandil', 'özel gün', 'salavat'],
    timeOfDay: 'night',
    recommendedCount: 70,
    suitableFor: ['yatmadan önce', 'rüya niyeti', 'gece zikri'],
  },
  {
    key: 'mevlid-salavat-i-tefriciyye-41',
    nameArabic:
      'اللّٰهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ',
    nameTurkish: 'Salavat-ı Tefriciyye',
    transliteration:
      'Allâhümme salli salâten kâmileten ve sellim selâmen tâmmen alâ seyyidinâ Muhammedinillezî tenhallü bihil ugad...',
    meaning:
      "Allah'ım, düğümlerin çözüldüğü Efendimiz Muhammede eksiksiz salat ve tam selam eyle.",
    virtue:
      'Günde en az 41 kez okunduğunda düğümleri çözen, kederleri gideren ve hastalara şifa vesilesi olan salavat olarak aktarılır.',
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'ferahlik', 'sifa'],
    categories: ['kandil', 'özel gün', 'salavat', 'dua'],
    timeOfDay: 'any',
    recommendedCount: 41,
    suitableFor: ['sıkıntıların giderilmesi', 'şifa niyeti', 'hacet duası'],
  },
  {
    key: 'mevlid-salat-i-tuncina-41',
    nameArabic:
      'اللّٰهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ',
    nameTurkish: 'Salât-ı Tüncîna (Salât-ı Münciye)',
    transliteration:
      "Allâhümme salli 'alâ seyyidinâ Muhammedin... Salâten tüncînâ bihâ min cemî'ı'l-ehvâli ve'l-âfât...",
    meaning:
      'Allahım, Efendimiz Muhammede öyle bir salat eyle ki onunla bizi bütün korku, bela ve afetlerden kurtarasın.',
    virtue:
      "Korku, bela, deprem ve afetlerden korunmaya vesile bir kalkan duası olarak aktarılır.",
    source: 'Salavat mecmuaları',
    tags: ['mevlid-kandili', 'salavat', 'korunma', 'munciye'],
    categories: ['kandil', 'özel gün', 'salavat', 'dua'],
    timeOfDay: 'any',
    recommendedCount: 41,
    suitableFor: ['afetlerden korunma', 'korku anları', 'emniyet duası'],
  },
  {
    key: 'mevlid-hamd-tesbih-100',
    nameArabic:
      'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ',
    nameTurkish: 'Mevlid Hamd ve Tesbih Zikri',
    transliteration:
      'Sübhânallâh, vel-hamdü lillâh, ve lâ ilâhe illallâh, vallâhu ekber.',
    meaning:
      "Allah'ı tesbih ederim, hamd Allah'adır, Allah'tan başka ilah yoktur, Allah en büyüktür.",
    virtue:
      'Dil, kalp ve şükür boyutunu birlikte canlandırır; geceyi zikirle ihyaya destek olur.',
    source: 'Tesbih ve tahmid zikirleri',
    tags: ['mevlid-kandili', 'tesbih', 'tahmid'],
    categories: ['kandil', 'özel gün', 'tesbih'],
    timeOfDay: 'any',
    recommendedCount: 100,
    suitableFor: ['şükür', 'zikir meclisi', 'kandil gecesi'],
  },
  {
    key: 'mevlid-rahmet-duasi-100',
    nameArabic:
      'اللّٰهُمَّ إِنِّي أَسْأَلُكَ حُبَّكَ وَحُبَّ مَنْ يُحِبُّكَ وَالْعَمَلَ الَّذِي يُبَلِّغُنِي حُبَّكَ',
    nameTurkish: 'Mevlid Muhabbet Duası',
    transliteration:
      'Allâhümme innî es’elüke hubbeke ve hubbe men yuhibbüke vel-amel-ellezî yubelliğunî hubbek.',
    meaning:
      'Allah’ım, Senden Senin sevgini, Seni sevenlerin sevgisini ve beni Senin sevgine ulaştıracak ameli isterim.',
    virtue:
      'Peygamber ahlakına yönelmeyi, Allah sevgisini ve salih amel niyetini güçlendirir.',
    source: 'Tirmizi, Deavat',
    tags: ['mevlid-kandili', 'dua', 'muhabbet'],
    categories: ['kandil', 'özel gün', 'dua'],
    timeOfDay: 'night',
    recommendedCount: 100,
    suitableFor: ['muhabbet', 'ahlak niyeti', 'gece duası'],
  },
];

const SPECIAL_DAYS = [
  {
    name: 'Mevlid Kandili',
    type: 'kandil',
    date: '2026-08-24',
    hijriDate: '11 Rebiülevvel 1448',
    description:
      'Peygamber Efendimizin doğumunu salavat, tevhid, istiğfar ve dua ile ihya etme gecesi.',
    eventKey: 'mevlid-kandili-2026',
    priority: 180,
    dhikrKeys: [
      'mevlid-salavat-1000',
      'mevlid-tevhid-100',
      'mevlid-istigfar-100',
      'mevlid-la-havle-100',
      'mevlid-duha-suresi-50',
      'mevlid-seytandan-siginma-33',
      'mevlid-sabir-ve-sebat-ayeti',
      'mevlid-salavat-emri-ayeti',
      'mevlid-salavat-sellim-barik-100',
      'mevlid-rabbena-zalemna-100',
      'mevlid-rabbi-inni-messeni-100',
      'mevlid-la-ilahe-illa-ente-100',
      'mevlid-kema-lillahi-salavat-100',
      'mevlid-delail-hayrat-dengi-100',
      'mevlid-nur-u-zatiyye-100',
      'mevlid-salavat-i-fatih-100',
      'mevlid-hz-fatima-salavati-100',
      'mevlid-ruyada-gorme-salavati-70',
      'mevlid-salavat-i-tefriciyye-41',
      'mevlid-salat-i-tuncina-41',
      'mevlid-hamd-tesbih-100',
      'mevlid-rahmet-duasi-100',
    ],
  },
];

export const SPECIAL_DAY_DATASET = {
  key: 'mevlid-kandili-2026',
  label: 'Mevlid Kandili 2026',
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
