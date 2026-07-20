export const yemekDualari = {
  key: 'yemek-dualari',
  label: {
    tr: 'Yemek ve İçme Duaları',
    en: 'Supplications for Eating and Drinking',
  },
  category: 'gunluk',
  description: {
    tr: 'Yemek öncesinde ve sonrasında okunacak şükür ve bereket duaları.',
    en: 'Supplications of gratitude and blessing to be recited before and after eating.',
  },
  dhikrItems: [
    {
      key: 'yemek-besmele',
      nameArabic: 'بِسْمِ اللَّهِ — وَإِنْ نَسِيَ: بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ',
      name: {
        tr: 'Yemekte Besmele',
        en: 'Bismillah Before Eating',
      },
      transliteration: {
        tr: `Bismillâh. — Unutulursa: Bismillâhi evvelehû ve âhirahû.`,
        en: `Bismillah. — If forgotten: Bismillahi awwalahy wa akhirah.`,
      },
      meaning: {
        tr: `Allah'ın adıyla. — Başta da sonda da Allah'ın adıyla.`,
        en: `In the name of Allah. — In the name of Allah, at its beginning and at its end.`,
      },
      virtue: {
        tr: `Resûlullah (sas) üvey oğlu Ömer ibn Ebî Seleme radıyallahu anh'e şöyle buyurdu: "Besmele çek, sağ elinle ye, hep önünden ye." Bir başka hadiste: "Biriniz yemeğe başlarken besmele çeksin. Şayet besmeleyi unutursa, hatırladığı anda 'Bismillâhi evvelehû ve âhirahû' desin." Câbir radıyallahu anh'ın rivâyetine göre kişi eve girerken besmele çekerse şeytan kendi askerlerine "Burada barınacak yeriniz ve yiyeceğiniz yok" der; besmele çekilmezse "Hem yatak hem yemek buldunuz" der.

Besmele, sofraya birlik ve beraberlik sağlar; şeytanı sofra ortaklığından uzak tutar. Allah'ın adını anmakla başlayan her yemek, sıradan bir bedensel ihtiyacın ötesine geçerek ibadet boyutuna taşınır. Bu sebeple Hanefî fakihler besmeleyi yemekte vâcib düzeyinde değerlendirmiştir. Sofrada oturanlardan birinin sesli besmele çekmesi diğerleri adına da yeterli kabul edilmiştir.

Besmeleyi unutanlar için öğretilen "Bismillâhi evvelehû ve âhirahû" formülü, hatayı başından itibaren telafi etme imkânı sunmaktadır. Bu ifade, Allah'ın adının yemeğin tamamını — baştan sona — kapsaması gerektiğini hatırlatır ve geç de olsa niyet tazelemesini sağlar.`,
        en: `The Messenger of Allah (peace be upon him) instructed his stepson 'Umar ibn Abi Salamah, may Allah be pleased with him: "Mention the name of Allah, eat with your right hand, and eat from what is in front of you." In another narration: "When one of you begins to eat, let him mention the name of Allah. If he forgets to mention the name of Allah at the beginning, let him say: 'Bismillahi awwalahu wa akhirah' (In the name of Allah at its beginning and at its end)."

According to the narration of Jabir, may Allah be pleased with him, when a person mentions Allah's name upon entering his home, the devil tells his troops: "You have no lodging here and no food." If he does not mention Allah's name, the devil says: "You have found lodging and food."

Beginning a meal with the Bismillah transforms a mundane physical act into an act of worship, binding the nourishment one receives to divine remembrance. Hanafi jurists have regarded it as close to obligatory (wajib) at the start of every meal. If one person at the table recites it aloud, it suffices on behalf of all present.

The formula taught for those who forget — "Bismillahi awwalahu wa akhirah" — demonstrates the mercy and flexibility embedded in Islamic practice: even a late recollection carries the full spiritual effect, encompassing the meal in its entirety under the name of Allah.`,
      },
      source: {
        tr: `Buhârî, Et'ime, 2 (5373); Müslim, Eşribe, 108 (2022); Ebû Dâvûd, Et'ime, 15 (3767); Tirmizî, Et'ime, 47 (1858)`,
        en: `Sahih al-Bukhari, At'ima, 2 (5373); Sahih Muslim, Ashribah, 108 (2022); Abu Dawood, At'ima, 15 (3767); At-Tirmidhi, At'ima, 47 (1858)`,
      },
      tags: ['yemek', 'besmele', 'zikir', 'günlük', 'sünnet'],
      categories: ['yemek', 'zikir', 'günlük'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: [
        'her yemekte',
        'her içecekte',
        'besmeleyi unutunca',
        'sofra adabı',
      ],
    },
    {
      key: 'yemek-baslangic-duasi',
      nameArabic:
        'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ بِسْمِ اللَّهِ',
      name: {
        tr: 'Yemek Başlangıcı Duası',
        en: 'Supplication at the Beginning of a Meal',
      },
      transliteration: {
        tr: `Allâhümme bârik lenâ fîmâ razaktenâ, ve kınâ azâben nâr. Bismillâh.`,
        en: `Allahumma barik lana fima razaqtana wa qina 'adhaban-nar. Bismillah.`,
      },
      meaning: {
        tr: `Allahım! Bize rızık olarak verdiğin bu nimette bereket ver ve bizi cehennem azabından koru. Allah'ın adıyla.`,
        en: `O Allah! Bless us in what You have provided for us and protect us from the punishment of the Fire. In the name of Allah.`,
      },
      virtue: {
        tr: `Abdullah ibn Amr radıyallahu anh, Resûlullah'ın (sas) sofrasına yemek getirildiğinde bu duayı okuduğunu rivâyet etti. Dua iki temel dilekle açılır: bereketlenme (bârik) ve ateşten korunma (kınâ azâben nâr). İki dilekler arasındaki bağ derin bir anlam taşır: Yemek, ahirete dair bir bilinçle yenildiğinde nimetin ruhunu tamamlar.

"Bârik" kelimesi, Arapça "b-r-k" kökünden türeyip "sabitlenmek, artmak, çoğalmak" manalarını içerir; yani salt bolluk değil, kalıcı ve hayırlı bereket istenmektedir. "Kınâ azâben nâr" cümlesi ise yemeğin dünyevî hazdan ibaret olmadığını, onu yiyen kişinin ahiretini de düşünmesi gerektiğini hatırlatır.

Duanın besmele ile kapanması son derece manidardır: Dua, Allah'ın adına bağlanarak niyet tazelenir ve yemek Allah'ın rızası gözetilerek yenilir hâle gelir. Sofra duası olarak çocuklara öğretmek için de uygundur; kısa yapısı ve ikili dilek biçimi kolayca akılda kalır.`,
        en: `'Abdullah ibn 'Amr, may Allah be pleased with him, narrated that when food was brought to the Messenger of Allah (peace be upon him), he would recite this supplication. The du'a opens with two essential requests: barakah (blessing) in what has been provided, and protection from the punishment of the Fire.

The word "barik" derives from the Arabic root b-r-k, meaning "to settle, increase, and multiply" — conveying not mere abundance but lasting, wholesome increase. The phrase "wa qina 'adhaban-nar" situates the act of eating within a broader eschatological consciousness: the nourishment one receives is meant to sustain righteous deeds, not merely satisfy appetite.

The supplication closing with the Bismillah renews the intention — tying the meal to divine remembrance and transforming a physical act into worship. The paired structure of the du'a (bless us / protect us) makes it an ideal supplication to teach children at the dinner table, as its brevity and balanced form commit easily to memory.`,
      },
      source: {
        tr: `İbnü's-Sünnî, Amelü'l-Yevm ve'l-Leyle, nr. 457`,
        en: `Ibn al-Sunni, 'Amal al-Yawm wa al-Laylah, no. 457`,
      },
      tags: ['yemek', 'dua', 'bereket', 'başlangıç'],
      categories: ['yemek', 'dua'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: [
        'yemek başlamadan önce',
        'sofra duası',
        'bereket duası',
      ],
    },
    {
      key: 'yemek-sonrasi-hamd',
      nameArabic:
        'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ غَيْرَ مَكْفِيٍّ وَلَا مُوَدَّعٍ وَلَا مُسْتَغْنًى عَنْهُ رَبَّنَا',
      name: {
        tr: 'Yemekten Sonra Hamd Duası (Uzun)',
        en: 'Extended Praise Supplication After Eating',
      },
      transliteration: {
        tr: `Elhamdülillâhi kesîren tayyiben mübâreken fîhi, gayra mekfiyyin velâ müvedda'in velâ müstağnen anhü rabbenâ.`,
        en: `Alhamdu lillahi kathiran tayyiban mubarakan fihi, ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu rabbana.`,
      },
      meaning: {
        tr: `Rabbimiz! Sana tertemiz duygularla, artıp çoğalan, huzûrundan geri çevrilmeyip kabul edilen, senden müstağni kalınamayan sayısız hamd ile hamd ederiz.`,
        en: `Our Lord! All praise belongs to You — praise that is abundant, wholesome, and blessed; praise that is not returned unanswered, not bidden farewell, and not dispensed with — our Lord.`,
      },
      virtue: {
        tr: `Ebû Ümâme radıyallahu anh, Resûlullah'ın (sas) sofrasını kaldırınca bu hamdi okuduğunu rivâyet etti. Dua üç özel nitelik içerir: "kesîren" (çokça), "tayyiben" (temiz, samimi), "mübâreken fîh" (kendisinde bereket olan). Bu üç sıfat, hamdin hem niceliğini hem niteliğini hem de bereketini belirler.

Ardından üç olumsuzla pekiştirilen ikrar gelir: bu hamd karşılıksız kalmaz (gayra mekfiyyin), terk edilmez (velâ müvedda'in), O'ndan müstağni kalınamaz (velâ müstağnen anh). Her bir olumsuz, Allah'a olan muhtaçlığın farklı bir boyutunu ortaya koyar: dua kabul edilir, ilişki kopulmaz ve nimet sahibinden bağımsız olunamaz.

Bu dua, yemekten kalkarken şükrü yalnızca söze değil, Allah'ın sonsuz nimetine olan bağımlılık bilincine dönüştürür. Alimler bu hamdin Buhârî'deki senedi ve lafzı itibariyle en güçlü yemek sonrası dua olduğunu belirtmiştir. Sofrada okunabildiği gibi her türlü nimetten sonra söylenebilir.`,
        en: `Abu Umamah, may Allah be pleased with him, narrated that when the table was cleared, the Messenger of Allah (peace be upon him) would recite this praise. The hamd contains three distinctive attributes: "kathiran" (in abundance), "tayyiban" (wholesome and sincere), and "mubarakan fih" (blessed within itself). These three qualifiers define both the quantity, quality, and sacred weight of the praise.

Three negations then follow in succession, reinforcing the acknowledgment of dependence: this praise is not returned (ghayra makfiyyin), not bidden farewell (wa la muwadda'in), and one cannot be self-sufficient apart from the Lord (wa la mustaghnan 'anh). Each negation reveals a distinct dimension of the servant's reliance upon Allah.

This supplication transforms the act of rising from the table from a simple gesture of fullness into a conscious acknowledgment of perpetual need before the Lord of sustenance. Scholars have noted that this du'a, by virtue of its chain and wording in Sahih al-Bukhari, is among the strongest authenticated post-meal supplications. It may equally be recited after receiving any form of blessing or provision.`,
      },
      source: {
        tr: `Buhârî, Et'ime, 54 (5458)`,
        en: `Sahih al-Bukhari, At'ima, 54 (5458)`,
      },
      tags: ['yemek', 'dua', 'hamd', 'şükür', 'sofra'],
      categories: ['yemek', 'dua', 'şükür'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: [
        'yemek bittikten sonra',
        'sofra kaldırılırken',
        'şükür duası',
      ],
    },
    {
      key: 'yemek-sonrasi-muslimiin',
      nameArabic:
        'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
      name: {
        tr: 'Yemekten Sonra Kısa Hamd',
        en: 'Brief Praise Supplication After Eating',
      },
      transliteration: {
        tr: `Elhamdülillâhillezî et'amenâ ve sekânâ ve cealenâ müslimîn.`,
        en: `Alhamdu lillahil-ladhi at'amana wa saqana wa ja'alana muslimin.`,
      },
      meaning: {
        tr: `Bize yedirip içiren ve bizi Müslüman kılan Allah'a hamd olsun.`,
        en: `All praise is due to Allah who fed us, gave us drink, and made us Muslims.`,
      },
      virtue: {
        tr: `Ebû Saîd el-Hudrî radıyallahu anh, Resûlullah'ın (sas) yemeğini yedikten sonra bu duayı okuduğunu nakletmiştir. Kısalığı ve içeriği onu ezber için mükemmel kılar: nimetin üç boyutu — yemek, içmek, İslâm — tek cümlede toplanmıştır.

Üçüncü unsur olan "cealenâ müslimîn" (bizi Müslüman kıldı), duayı sıradan bir sofra şükründen çok farklı bir yere taşır. İslâm, yemeğin ve suyun önünde anılmaz; tam tersine nihai nimet olarak sonra zikredilir. Bu sıralama bir anlam hiyerarşisi içerir: bedensel nimetler geçici ve dünyevî iken İslâm ebedî ve uhrevîdir.

Duanın kısalığı bir eksiklik değil, bir güçtür: her öğünde kolayca okunabilmesi için kısa ve öz tutulmuştur. Çocuklara öğretilmesi için de en uygun yemek sonrası duadır; tek cümlelik yapısı, hem Türkçe anlayışı hem de Arapça lafzı itibariyle küçük yaşlardan itibaren öğretilebilir.`,
        en: `Abu Sa'id al-Khudri, may Allah be pleased with him, narrated that the Messenger of Allah (peace be upon him) would recite this supplication after finishing his meal. Its brevity and content make it ideal for memorisation: three dimensions of divine favour — food, drink, and Islam — are gathered into a single sentence.

The third element, "ja'alana muslimin" (and made us Muslims), elevates this beyond an ordinary post-meal thanksgiving. Islam is not mentioned first among the blessings but last — positioned as the supreme gift. This ordering reflects a hierarchy of meaning: physical provisions are transient and worldly, while Islam is eternal and concerns the hereafter.

The conciseness of this du'a is a strength rather than a limitation: it is deliberately brief so that it can be recited with ease and sincerity after every meal. It is the most suitable post-meal supplication for teaching children; its single-sentence structure allows it to be learned — both in its Arabic wording and Turkish meaning — from an early age.`,
      },
      source: {
        tr: `Ebû Dâvûd, Et'ime, 53 (3850); Tirmizî, Et'ime, 48 (1816)`,
        en: `Abu Dawood, At'ima, 53 (3850); At-Tirmidhi, At'ima, 48 (1816)`,
      },
      tags: ['yemek', 'dua', 'hamd', 'şükür', 'kısa'],
      categories: ['yemek', 'dua', 'şükür'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: [
        'yemek sonrası',
        'kısa hamd',
        'çocuklara öğretmek için',
        'günlük sofra duası',
      ],
    },
    {
      key: 'yemek-sonrasi-gunah-affeder',
      nameArabic:
        'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
      name: {
        tr: 'Yemek Sonrası Günahları Affettiren Dua',
        en: 'Supplication After Eating That Expiates Sins',
      },
      transliteration: {
        tr: `Elhamdülillâhillezî et'amenî hâzâ ve rezekanîhi min gayri havlin minnî velâ kuvvetin.`,
        en: `Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah.`,
      },
      meaning: {
        tr: `Bana bu yemeği yediren ve onu elde edecek bir güç ve kudretim olmadan bana nasip eden Allah'a hamd olsun.`,
        en: `All praise is due to Allah who fed me this food and provided it to me without any power or strength on my part.`,
      },
      virtue: {
        tr: `Muâz ibn Enes radıyallahu anh, Resûlullah'ın (sas) şöyle buyurduğunu rivâyet etti: "Bir kimse yemek yedikten sonra 'Elhamdülillâhillezî et'amenî hâzâ ve rezekanîhi min gayri havlin minnî velâ kuvvetin' derse, daha önce işlediği günahlar affedilir." Bu rivâyet Ebû Dâvûd ve Tirmizî'de geçmekte olup Tirmizî "hasen" olarak değerlendirmiştir.

Duanın içindeki "min gayri havlin minnî velâ kuvvetin" (benden hiçbir güç ve kudret olmaksızın) ifadesi, gerçek anlamda tevekküle açık kapıdır. Kişi yemeği kazandığını, pişirdiğini, hazırladığını düşünebilir; oysa bu dua tüm bu süreçlerin arkasında Allah'ın takdirini ve rızkını verme sıfatını görmeyi öğretir.

Yemeği hazırlayan, pişiren, sofrayı kuran elin bile nihayetinde Allah'ın takdiri olduğunu hatırlatan bu bilinç, duanın mağfiret vaadini anlam zemininde taşır. Şükür, yalnızca sonucu değil; sebebi ve vesileyi de Allah'a bağlar. Bu sebeple dua, geçmiş günahlara kefaret olarak rivâyet edilmiştir: gerçek tevekkülle birleşen bir hamd, kalbi arındırır.`,
        en: `Mu'adh ibn Anas, may Allah be pleased with him, narrated that the Messenger of Allah (peace be upon him) said: "Whoever eats food and then says 'Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah,' his previously committed sins will be forgiven." This narration is recorded by Abu Dawood and At-Tirmidhi, the latter grading it as hasan.

The phrase "min ghayri hawlin minni wa la quwwah" (without any power or strength on my part) is the theological heart of this supplication. One might naturally attribute the food on one's table to one's own earning, cooking, or effort — yet this du'a trains the servant to see behind every stage of provision the decree and sustaining will of Allah.

The promise of expiation of sins carried in this supplication is grounded in a profound theological reality: gratitude (hamd) combined with genuine tawakkul (reliance upon Allah) purifies the heart. When a person acknowledges that not a single morsel reached his mouth through his own independent power, that acknowledgment of total dependence is itself an act of worship deserving of divine mercy and forgiveness.`,
      },
      source: {
        tr: `Tirmizî, Deavât, 57 (3458); Ebû Dâvûd, Et'ime, 53 (3849)`,
        en: `At-Tirmidhi, Da'awat, 57 (3458); Abu Dawood, At'ima, 53 (3849)`,
      },
      tags: ['yemek', 'dua', 'günah', 'af', 'şükür'],
      categories: ['yemek', 'dua', 'istiğfar'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: [
        'yemek sonrası',
        'günahlara kefaret',
        'tevekkül duası',
      ],
    },
    {
      key: 'yemek-iftar-ev-sahibine',
      nameArabic:
        'أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ وَأَكَلَ طَعَامَكُمُ الْأَبْرَارُ وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ',
      name: {
        tr: 'İftar Ev Sahibine Dua',
        en: 'Supplication for the Host at Iftar',
      },
      transliteration: {
        tr: `Eftare indekümüs sâimûn, ve ekele taâmekümül ebrâr, ve sallet aleykümül melâike.`,
        en: `Aftara 'indakumus-sa'imun, wa akala ta'amakumul-abrar, wa sallat 'alaykumul-mala'ikah.`,
      },
      meaning: {
        tr: `Evinizde oruçlular iftâr etsin. Yemeğinizi sâlih kimseler yesin. Melekler de sizin için dua etsin.`,
        en: `May those who are fasting break their fast with you, may the righteous eat your food, and may the angels invoke blessings upon you.`,
      },
      virtue: {
        tr: `Resûlullah (sas), Sa'd ibn Ubâde radıyallahu anh'ın evinde iftâr ettikten sonra bu duayı okudu; daha sonra Sa'd ibn Muâz radıyallahu anh'ın evinde de aynı duayı okuduğu rivâyet edilmiştir. Dua üç katmanlı bir hayır dileyişidir.

Birinci dilekte "sâimûn" (oruçlular) ifadesi, evin mübarek bir mekân olduğunu ve oruç tutan sâlih kimseleri çektiğini müjdeler. İkinci dilekte "ebrâr" (sâlih, hayır sahibi kimseler), ev sahibinin sofrasının daima hayırlı insanları çekeceğini; üçüncüde meleklerin salâtı ise bu dünyevî ve insanî hayra semavî bir mühür vurulduğunu simgeler.

Üçüncü dilekteki "sallet" ifadesi dikkat çekicidir: meleklerin dua etmesi ya da istiğfar etmesi anlamındadır. Bu, Ramazan'da oruçluya iftar açtıranların semadan karşılık aldığını, onların günahlarının bağışlanması için meleklerin aracı olduğunu haber verir. Dua, Ramazan ayında ve oruçluya iftar açtırıldığı her durumda okunabilir; misafirlikte ev sahibine yapılabilecek en değerli dua olarak telakki edilmiştir.`,
        en: `The Messenger of Allah (peace be upon him) recited this supplication after breaking his fast at the home of Sa'd ibn 'Ubadah, may Allah be pleased with him; it is also narrated that he repeated it at the home of Sa'd ibn Mu'adh, may Allah be pleased with him. The du'a is a three-tiered invocation of goodness.

The first tier, invoking "al-sa'imun" (those who are fasting), conveys that the host's home has become a blessed place that draws righteous, fasting souls. The second tier — "al-abrar" (the righteous, the doers of good) — extends the blessing further: the host's table will perpetually attract those of upright character. The third tier, the salat of the angels, places a heavenly seal upon this earthly and human act of generosity.

The word "sallat" in the third invocation is significant: it refers to the angels invoking mercy and seeking forgiveness on behalf of the host. This narration informs us that those who provide iftar for a fasting person receive a celestial response — the angels intercede for the forgiveness of their sins. This supplication may be recited during Ramadan and whenever one hosts an iftar; it is considered among the most valuable supplications a guest can offer to a host.`,
      },
      source: {
        tr: `Ebû Dâvûd, Et'ime, 54 (3854); İbn Mâce, Sıyâm, 45 (1747); Nesâî, es-Sünenü'l-Kübrâ, nr. 6893`,
        en: `Abu Dawood, At'ima, 54 (3854); Ibn Majah, Siyam, 45 (1747); An-Nasa'i, as-Sunan al-Kubra, no. 6893`,
      },
      tags: ['yemek', 'iftar', 'ramazan', 'oruç', 'misafir', 'dua'],
      categories: ['yemek', 'dua', 'ramazan'],
      timeOfDay: 'evening',
      recommendedCount: 10,
      specialDays: ['ramazan'],
      suitableFor: [
        'iftarda ev sahibine dua',
        'ramazanda misafirlik',
        'oruçluya yemek ikramı',
        'sofra sonrası',
      ],
    },
    {
      key: 'yemek-ikram-edene-karsilik',
      nameArabic:
        'اللَّهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي وَاسْقِ مَنْ سَقَانِي',
      name: {
        tr: 'İkram Edene Karşılık Dua',
        en: 'Supplication for One Who Has Offered Food or Drink',
      },
      transliteration: {
        tr: `Allâhümme et'ım men et'amenî, veskı men sekânî.`,
        en: `Allahumma at'im man at'amani wasqi man saqani.`,
      },
      meaning: {
        tr: `Allahım! Bana yiyecek verene sen de yiyecek ver. Bana içecek verene sen de içecek ver.`,
        en: `O Allah! Feed the one who fed me, and give drink to the one who gave me drink.`,
      },
      virtue: {
        tr: `Mikdâd ibn Esved radıyallahu anh'ın uzun hadisinden alınan bu dua, Resûlullah'ın (sas) kendisine süt ikram eden kişi için ettiği senâdır. Hz. Peygamber, bir gece kendisi için ayrılan sütün içildiğini görünce bedduâ etmek yerine bu hayır duasını okudu.

Dua, "iyiliğe iyilikle karşılık vermek yetmez, Allah'ın kapısını çal" anlayışını cisimleştirir. İnsan, yaptığı iyilik karşısında aldığı duayı değil; verdiği nimetin Allah'ın katında kabul görmesini asıl ödül bilir. Bu sebeple bu dua, basit bir teşekkürün çok ötesindedir: kişi karşısındakine "Allah seni de yedirsin, seni de içirsin" diyerek onu doğrudan Allah'ın takdir meclisine havale eder.

Misafir bu duayı ev sahibine, hediye alan verene, yemek getirilen getirene okuyabilir. Hangi bağlamda okunursa okunsun, her sofra daveti, her ikram, her su bardağı bu duayı tetikleyen bir vesile olarak görülmüştür. Resûlullah'ın bu duayı büyük bir minnetle ve hayır içerikli karşılıkla okuması, İslâm'ın ikrama olan kadirşinaslığını en güzel şekilde ortaya koyar.`,
        en: `This supplication is taken from the longer hadith of Miqdad ibn Aswad, may Allah be pleased with him, and represents the du'a the Messenger of Allah (peace be upon him) made for the person who had offered him milk. Upon finding one night that the milk set aside for him had been consumed by another, the Prophet (peace be upon him) did not respond with reproach but instead recited this prayer of blessing.

The du'a gives tangible form to a profound Islamic principle: responding to a favour not merely in kind, but by directing the benefactor to the door of Allah Himself. The giver receives not just gratitude from a fellow human being, but an invocation that their own provision and sustenance be replenished by the Lord of all provision.

A guest may recite this supplication for his host, one who receives a gift may say it for the giver, and one served food or drink may direct it toward the one who served. In whatever context it is recited — a dinner invitation, a small gesture of hospitality, a glass of water — it has been regarded as the fitting response to any act of generosity. The Prophet's (peace be upon him) choice of this blessing over any expression of displeasure is itself the most eloquent demonstration of how Islam honours the act of giving.`,
      },
      source: {
        tr: `Müslim, Eşribe, 175 (2055)`,
        en: `Sahih Muslim, Ashribah, 175 (2055)`,
      },
      tags: ['yemek', 'dua', 'şükür', 'misafir', 'ikram'],
      categories: ['yemek', 'dua', 'şükür'],
      timeOfDay: 'any',
      recommendedCount: 10,
      specialDays: [],
      suitableFor: [
        'ikram sonrası',
        'yemek davetinde',
        'misafirlikte',
        'hediye alınca',
        'su içirilince',
      ],
    },
  ],
  specialDays: [],
};
