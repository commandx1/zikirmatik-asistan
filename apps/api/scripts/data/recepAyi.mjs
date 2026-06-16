import { keyMap } from './keyMap.mjs';

export const recepAyi = {
  key: 'recep-ayi-2025',
  label: 'Recep Ayı 2025',
  category: 'ibadet',
  description:
    "Haram aylardan biri olan Recep, 'tohum ekme' mevsimidir. Üç onar günlük fazda (Hayy-Kayyûm → Ehad-Samed → Ğafûr-Rahîm) esma tesbihiyle, 30 rekatlık hacet namazıyla ve Seyyidü'l-İstiğfar ile ihya edilir.",
  dhikrItems: [
    {
      key: keyMap.SUBHANALLAH_HAYY_KAYYUM,
      nameArabic: 'سُبْحَانَ اللَّهِ الْحَيِّ الْقَيُّومِ',
      nameTurkish: "Sübhânallâhil-Hayyi'l-Kayyûm — Recep 1-10. Günler Zikirı",
      transliteration: "Sübhânallâhil-Hayyi'l-Kayyûm",
      meaning:
        "Ezelî ve ebedî hayat sahibi, bütün varlığı ayakta tutan Allah'ı her türlü noksanlıktan tenzih ederim.",
      virtue:
        "Recep ayının 1-10. günleri arası her gün 100 defa çekilir. Manevi uyanışın başlangıcını teşkil eder; kul varlığının idaresini tefekkür ederek varoluşun kaynağına bağlanmayı sağlar.",
      source: "Enes b. Malik'ten aktarılan rivayetler; Receb-i Şerif Risalesi",
      tags: ['recep', 'esma', 'zikir', 'hayy', 'kayyum'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.SUBHANALLAH_EHAD_SAMED,
      nameArabic: 'سُبْحَانَ اللَّهِ الْأَحَدِ الصَّمَدِ',
      nameTurkish: "Sübhânallâhil-Ehadi's-Samed — Recep 11-20. Günler Zikirı",
      transliteration: "Sübhânallâhil-Ehadi's-Samed",
      meaning:
        "Bir ve tek olan, her şeyin kendisine muhtaç olduğu Allah'ı her türlü noksanlıktan tenzih ederim.",
      virtue:
        "Recep ayının 11-20. günleri arası her gün 100 defa çekilir. Kalbi fani bağlardan ve yaratılışlara muhtaçlık hissinden arındırarak yalnızca Allah'a yöneltir.",
      source: 'Klasik Vird Derlemeleri ve Hadis Şerhleri; Receb-i Şerif Risalesi',
      tags: ['recep', 'esma', 'zikir', 'ehad', 'samed'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.SUBHANALLAH_GAFUR_RAHIM,
      nameArabic: 'سُبْحَانَ اللَّهِ الْغَفُورِ الرَّحِيمِ',
      nameTurkish: "Sübhânallâhi'l-Ğafûri'r-Rahîm — Recep 21-30. Günler Zikirı",
      transliteration: "Sübhânallâhi'l-Ğafûri'r-Rahîm (veya: Sübhânallâhir-Raûf)",
      meaning:
        "Çok bağışlayıcı ve çok merhametli Allah'ı her türlü noksanlıktan tenzih ederim.",
      virtue:
        "Recep ayının son on gününde ilahi rahmetin, mağfiretin ve esirgemenin mutlak tecellisine hazır hale gelmek amacıyla her gün 100 defa çekilir.",
      source: 'Receb-i Şerif Risalesi; IDDEF; Yeni Şafak',
      tags: ['recep', 'esma', 'zikir', 'gafur', 'rahim'],
      categories: ['zikir', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.SEYYIDUL_ISTIGFAR,
      nameArabic:
        'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
      nameTurkish: "Seyyidü'l-İstiğfar — İstiğfarların Efendisi",
      transliteration:
        "Allahümme ente Rabbî lâ ilahe illâ ente halaktenî ve ene abdüke ve ene alâ ahdike ve vâ'dike mestes'tetü. Eûzü bike min şerri mâ sana'tü. Ebû'ü leke bi-ni'metike aleyye ve ebû'ü bizenbî fağfirlî feinnehû lâ yağfiruz-zünûbe illâ ente.",
      meaning:
        "Allah'ım! Sen benim Rabbimsin, Senden başka ilah yoktur. Beni Sen yarattın; ben Senin kulunum ve gücüm yettiği kadar ahdin ve vadine bağlıyım. Yaptığım kötülüklerin şerrinden Sana sığınırım. Üzerimdeki nimetini itiraf ederim; günahımı da itiraf ederim. Beni bağışla; zira günahları Senden başkası bağışlayamaz.",
      virtue:
        "İstiğfarların en üstünü olan Seyyidü'l-İstiğfar. Bu duayı samimiyetle okuyan kişi, gündüz okuduysa o gün ölmeden, gece okuduysa o gece ölmeden önce cennete gireceği Peygamber Efendimiz (s.a.v.) tarafından müjdelenmiştir.",
      source: "Sahih-i Buhârî, Deavât, 2, 16; Ebû Dâvûd, Edeb, 100-101",
      tags: ['recep', 'istiğfar', 'tövbe', 'seyyid', 'cennet'],
      categories: ['dua', 'ibadet', 'istiğfar'],
      timeOfDay: ['sabah', 'aksam'],
      recommendedCount: 3,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.RECEP_HACET_1,
      nameArabic:
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      nameTurkish: 'Recep İlk 10 Gün Hacet Namazı Sonrası Duası',
      transliteration:
        "Lâ ilâhe illallahü vahdehû lâ şerîke leh. Lehü'l-mülkü ve lehü'l-hamdü yuhyî ve yümît. Ve hüve hayyün lâ yemûtü biyedihi'l-hayr. Ve hüve alâ külli şey'in kadîr.",
      meaning:
        "Allah'tan başka ilah yoktur, O tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur. Hayatı O verir, ölümü O takdir eder. Kendisi diridir, ölmez. Hayır O'nun kudret elindedir. O, her şeye kadirdir.",
      virtue:
        "Recep ayının ilk 10 günü kılınan hacet namazının 10 rekatının ardından 11 defa okunur. Namazın kabulüne, günahların silinmesine ve rızık genişliğine vesile olduğu rivayet edilmiştir.",
      source: "İmam Gazâlî, İhyâu Ulûmiddîn; IDDEF Namaz Rehberi",
      tags: ['recep', 'hacet', 'namaz', 'tevhid', 'dua'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 11,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.RECEP_HACET_2,
      nameArabic:
        'إِلَهًا وَاحِدًا أَحَدًا صَمَدًا فَرْدًا وِتْرًا حَيًّا قَيُّومًا دَائِمًا أَبَدًا',
      nameTurkish: 'Recep İkinci 10 Gün Hacet Namazı Sonrası Duası',
      transliteration:
        "İlâhen vâhiden ehaden sameden ferden vitren hayyen kayyûmen dâimen ebedâ. (şu ek ile de okunur: '...lem yettehiz sâhibeten ve lâ veledâ')",
      meaning:
        "Eşi ve benzeri olmayan, tek olan, her şeyin Kendisine muhtaç olduğu, tek ve benzersiz, diri ve kaim olan, ebediyen devam eden tek ilahe ibadet ederiz.",
      virtue:
        "Recep ayının 11-20. günleri arasında kılınan hacet namazlarının ardından 11 defa okunur. Tevhid inancını zirve noktada ikrar ederek manevi derecelerin yükselmesine ve kalbin nurlanmasına vesile olur.",
      source: 'Receb-i Şerif Risalesi; Habertürk İbadet Rehberi',
      tags: ['recep', 'hacet', 'namaz', 'tevhid', 'dua'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 11,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.RECEP_HACET_3,
      nameArabic:
        'اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ وَلَا رَادَّ لِمَا قَضَيْتَ وَلَا مُبَدِّلَ لِمَا حَكَمْتَ وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ سُبْحَانَ رَبِّيَ الْعَلِيِّ الْأَعْلَى الْوَهَّابِ يَا وَهَّابُ يَا وَهَّابُ يَا وَهَّاب',
      nameTurkish: 'Recep Son 10 Gün Hacet Namazı Sonrası Duası (Allâhümme lâ mânia)',
      transliteration:
        "Allâhümme lâ mânia limâ a'tayte, velâ mu'tiye limâ mena'te, velâ râdde limâ kadayte, velâ mübeddile limâ hakemte, velâ yenfeu ze'l-ceddi minkel-cedd. Sübhâne rabbiyel-aliyyil-a'lel-vehhâb (3 kere). Yâ vehhâbü yâ vehhâbü yâ vehhâb.",
      meaning:
        "Allah'ım! Senin verdiğine engel olacak yoktur, Senin engel olduğunu verecek yoktur. Hükmettiğini geri çevirecek, verdiğin kararı değiştirecek kimse yoktur. Varlık sahibinin varlığı Senin katında kendisine fayda vermez. Yüce, ulu ve hibe eden Rabbimi tesbih ederim (3 kere). Ey Vehhâb! Ey Vehhâb! Ey Vehhâb!",
      virtue:
        "Tam bir teslimiyet göstergesi olup dünya ve ahiret sıkıntılarından halas olmaya, bereketli bir yaşama erişmeye vesile olur. Recep'in son on günündeki hacet namazlarının ardından 11 defa okunur.",
      source: 'Ahmed bin Hanbel, Müsned; IDDEF; Yeni Şafak',
      tags: ['recep', 'hacet', 'namaz', 'teslimiyet', 'dua'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'],
      recommendedCount: 11,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.RECEP_15_SECDE_DUASI,
      nameArabic:
        'اللَّهُمَّ لَكَ صَلَّيْتُ وَلَكَ سَجَدْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ فَارْحَمْ ذُلِّي وَكَبْوَتِي لِوَجْهِكَ وَانْفِرَادِي وَخُشُوعِي وَحُدُوعِي وَتَضَرُّعِي وَتَغَيُّرِي وَفَقْرِي وَاجْعَلْ لِي فَرَجًا وَمَخْرَجًا مِنْ هَمِّي بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
      nameTurkish: "Recep 15. Gece Secde Duası",
      transliteration:
        "Allâhümme leke salleytü ve leke secedtü ve bike âmentü ve aleyke tevekkültü. Ferham züllî ve kebvetî li vechî venfirâdî ve huşûî ve hudûî ve tedarruî ve teğayyürî ve fağatî vec-al lî fercen ve mehracen min hemmî birahmetike yâ erhamerrâhimîn.",
      meaning:
        "Allah'ım! Senin için namaz kıldım, Sana secde ettim, Sana iman ettim ve Sana tevekkül ettim. Yüzümün zilletine ve tökezlemesine, tek başınalığıma, huşuuma, boyun büküşüme, yalvarışıma, şaşkınlığıma, fakr ve ihtiyacıma merhamet eyle; rahmetinle bana sıkıntılarımdan bir çıkış ve kurtuluş yolu nasip eyle, ey merhametlilerin en merhametlisi!",
      virtue:
        "Recep ayının tam ortasında kulun kendi aczini en derin ve sarsıcı ifadelerle ilahi huzura arz ederek büyük bir ferahlığa, günahların affına ve hidayete ermesine vesile olan mübarek secde duasıdır.",
      source: 'Receb-i Şerif Risalesi; Lâlegül Dergisi',
      tags: ['recep', 'secde', 'dua', '15. gece', 'acz'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 1,
      suitableFor: ['herkes'],
    },
  ],
  specialDays: [
    {
      name: 'Recep Ayı Girişi — 1. Faz (Hayy-Kayyûm)',
      type: 'özel gün',
      date: '2025-12-21',
      hijriDate: '1 Recep 1447',
      description:
        "Haram aylardan Recep'in başlangıcı. İlk on günde Hayy-Kayyûm esmasıyla manevi uyanış, Seyyidü'l-İstiğfar ile derinlemesine tövbe ve üç aylar duasını çok oku.",
      eventKey: 'recep-ayi-2025',
      dayIndex: 1,
      dayCount: 30,
      priority: 145,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.SUBHANALLAH_HAYY_KAYYUM,
        keyMap.RECEP_HACET_1,
        keyMap.SEYYIDUL_ISTIGFAR,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: 'Recep 11. Gün — 2. Faz (Ehad-Samed)',
      type: 'özel gün',
      date: '2025-12-31',
      hijriDate: '11 Recep 1447',
      description:
        "Recep'in ikinci on günlük fazı. Allah'ın mutlak bağımsızlığını ve tekliğini ifade eden Ehad-Samed esmasına odaklanarak kalbi fani bağlardan kurtulma dönemi.",
      eventKey: 'recep-ayi-2025',
      dayIndex: 11,
      dayCount: 30,
      priority: 143,
      dhikrKeys: [
        keyMap.SUBHANALLAH_EHAD_SAMED,
        keyMap.RECEP_HACET_2,
        keyMap.SEYYIDUL_ISTIGFAR,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: 'Recep 21. Gün — 3. Faz (Ğafûr-Rahîm)',
      type: 'özel gün',
      date: '2026-01-10',
      hijriDate: '21 Recep 1447',
      description:
        "Recep'in son on günü: mağfiret, esirgeme ve merhamet boyutları. Ğafûr-Rahîm esmasıyla tamamlan; Miraç Kandili'ne doğru manevi irtifaını artır.",
      eventKey: 'recep-ayi-2025',
      dayIndex: 21,
      dayCount: 30,
      priority: 148,
      dhikrKeys: [
        keyMap.SUBHANALLAH_GAFUR_RAHIM,
        keyMap.RECEP_HACET_3,
        keyMap.SEYYIDUL_ISTIGFAR,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
      ],
    },
  ],
};
