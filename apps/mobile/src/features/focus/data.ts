// TODO(i18n): EN translations for ZIKIR_ITEMS are pending — `en` currently
// mirrors the `tr` value below until real translations are supplied.
import type { EsmaulHusnaItem, ZikirItem } from './types'

export const ZIKIR_ITEMS: ZikirItem[] = [
  {
    id: 'estagfirullah',
    source: 'ready',
    name: { tr: 'Estağfirullah', en: 'Estağfirullah' },
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: { tr: 'Estağfirullah', en: 'Estağfirullah' },
    meaning: { tr: "Allah'tan bağışlanma dilerim", en: "Allah'tan bağışlanma dilerim" },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'subhanallah',
    source: 'ready',
    name: { tr: 'Sübhanallah', en: 'Sübhanallah' },
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: { tr: 'Sübhanallah', en: 'Sübhanallah' },
    meaning: { tr: 'Allah noksan sıfatlardan münezzehtir', en: 'Allah noksan sıfatlardan münezzehtir' },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'elhamdulillah',
    source: 'ready',
    name: { tr: 'Elhamdülillah', en: 'Elhamdülillah' },
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: { tr: 'Elhamdülillah', en: 'Elhamdülillah' },
    meaning: {
      tr: "Her türlü hamd ve övgü Allah'a mahsustur",
      en: "Her türlü hamd ve övgü Allah'a mahsustur"
    },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'allahu-ekber',
    source: 'ready',
    name: { tr: 'Allahu Ekber', en: 'Allahu Ekber' },
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: { tr: 'Allahu Ekber', en: 'Allahu Ekber' },
    meaning: { tr: 'Allah en büyüktür', en: 'Allah en büyüktür' },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'la-ilahe-illallah',
    source: 'ready',
    name: { tr: 'La ilahe illallah', en: 'La ilahe illallah' },
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: { tr: 'La ilahe illallah', en: 'La ilahe illallah' },
    meaning: { tr: "Allah'tan başka ilah yoktur", en: "Allah'tan başka ilah yoktur" },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'la-havle',
    source: 'ready',
    name: { tr: 'La havle vela kuvvete illa billah', en: 'La havle vela kuvvete illa billah' },
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: { tr: 'La havle vela kuvvete illa billah', en: 'La havle vela kuvvete illa billah' },
    meaning: { tr: "Güç ve kuvvet ancak Allah'tandır", en: "Güç ve kuvvet ancak Allah'tandır" },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'bismillah',
    source: 'ready',
    name: { tr: 'Bismillahirrahmanirrahim', en: 'Bismillahirrahmanirrahim' },
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: { tr: 'Bismillahirrahmanirrahim', en: 'Bismillahirrahmanirrahim' },
    meaning: { tr: "Rahman ve Rahim olan Allah'ın adıyla", en: "Rahman ve Rahim olan Allah'ın adıyla" },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'subhanallahi-ve-bihamdihi',
    source: 'ready',
    name: { tr: 'Sübhanallahi ve bihamdihi', en: 'Sübhanallahi ve bihamdihi' },
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: { tr: 'Sübhanallahi ve bihamdihi', en: 'Sübhanallahi ve bihamdihi' },
    meaning: { tr: "Allah'ı hamd ile tesbih ederim", en: "Allah'ı hamd ile tesbih ederim" },
    current: 0,
    target: 100,
    lastActivityLabel: 'Henüz başlanmadı',
    streakDays: 0,
    isFavorite: false
  }
]

export const ESMAUL_HUSNA: EsmaulHusnaItem[] = [
  {
    nameArabic: 'اللَّهُ',
    transliteration: 'ALLAH (C.C.)',
    meaning: 'Tüm isim ve sıfatları kendinde toplayan, eşi benzeri bulunmayan tek ilah.',
    virtue:
      'Derecenin hem Allah hem insanlar katında artması; sevilen, sayılan, sözü geçen biri olmak; her türlü şeytan ve nefis şerrinden korunmak; uykuda meleklerin yardımına nail olmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الرَّحْمٰنُ',
    transliteration: 'Er-Rahmân',
    meaning: 'Dünyadaki bütün yaratılmışlara ayırt etmeden merhamet eden, esirgeyen.',
    virtue:
      'Dünya ve ahirette ilahi sevgi kazanmak; farz namaz ardı 100 zikirle rıza bulmak; 40 gün riyazetle 1000 zikirle kalp gözünün açılması; her arzunun gerçekleşmesi.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الرَّحِيمُ',
    transliteration: 'Er-Rahîm',
    meaning: 'Ahirette sadece müminlere sonsuz ihsanda, lütufta ve merhamette bulunan.',
    virtue:
      'Maddi ve manevi bol rızık; belalardan, kazalardan ve afetlerden korunma; uykuda ağlayan/korkan çocukların şifası; ahlak güzelliği ve fiziki iyileşme.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمَلِكُ',
    transliteration: 'El-Melik',
    meaning: 'Kainatın tek sahibi, mülk ve saltanatı sürekli olan mutlak hükümdar.',
    virtue:
      'Maddi ve manevi güçlü olmak; insanlara sözünü dinletip emir sahibi olmak; her sabah namazı ardı 121 zikirle fakirlikten kalıcı kurtuluş; gizli sırlara ve ilme vakıf olmak.',
    dhikrDay: 'Çarşamba'
  },
  {
    nameArabic: 'الْقُدُّوسُ',
    transliteration: 'El-Kuddüs',
    meaning: 'Hatadan, gafletten, aczden ve her türlü eksiklikten pek uzak, pek temiz.',
    virtue:
      'Maddi-manevi her türlü temizlik; nefsi şehvetten ve manevi hastalıklardan koruma; vesveseden ve şeytanın hilelerinden uzaklaşıp insanlar arasında saygı görmek.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'السَّلَامُ',
    transliteration: 'Es-Selâm',
    meaning: 'Kullarını her türlü tehlikelerden selamete çıkaran, cennette selam veren.',
    virtue:
      'Korkulardan emin olmak; hastanın üzerine okunduğunda fiziki şifa; kabza yazılıp aç karnına içildiğinde vesvese hastalığının yok olması; her duanın kabule ulaşması.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُؤْمِنُ',
    transliteration: "El-Mü'min",
    meaning: 'Gönüllerde iman ışığı uyandıran, kendine sığınanları koruyan ve rahatlatan.',
    virtue:
      'Kötü ve bulaşıcı hastalıklara yakalanmamak; dili yalandan, küfürden, riyadan, zinadan, kibirden ve hasetten uzaklaştırmak; kimseye muhtaç olmamak.',
    dhikrDay: 'Pazartesi'
  },
  {
    nameArabic: 'الْمُهَيْمِنُ',
    transliteration: 'El-Müheymin',
    meaning: 'Her şeyi görüp gözeten, her varlığın yaptıklarından haberdar olan, koruyan.',
    virtue:
      'İnsanların düşüncelerini ve niyetlerini okumak; unutkanlıktan kurtulmak; yatsı namazı sonrası okuyup uyuyana rüyada olacak hadiselerin bildirilmesi; bela ve musibetten korunma.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْعَزِيزُ',
    transliteration: 'El-Azîz',
    meaning: 'İzzet sahibi, mağlup edilmesi asla mümkün olmayan, her şeye galip.',
    virtue:
      'Düşmanlara ezici üstünlük sağlamak; kendini insanlara sevdirmek; iş ve isteklerin geri çevrilmemesi; evden çıkarken okunduğunda dünya ve ahiret bahtiyarlığı.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْجَبَّارُ',
    transliteration: 'El-Cebbâr',
    meaning: 'Eksikleri tamamlayan, dilediğini zorla yaptırmaya muktedir olan, azamet sahibi.',
    virtue:
      'İsteklerin gerçekleşmesi; insanların ve cinlerin şerrinden emin olmak; düşmanların helaki; "Ya Zülcelali Vel İkram" ile yazıldığında insanlara şirin ve heybetli görünmek.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْمُتَكَبِّرُ',
    transliteration: 'El-Mütekebbir',
    meaning: 'Büyüklükte eşi benzeri olmayan, her şeyde büyüklüğünü gösteren.',
    virtue:
      'İzzet ve refaha nail olmak; konuşurken muhatapları tesir altında bırakmak; itibar kazanmak; kötü ahlaklı ve haram işleyen kişilerin ıslah olması.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْخَالِقُ',
    transliteration: 'El-Hâlık',
    meaning: 'Bütün varlığı, halleri ve hadiseleri tayin edip yoktan var eden.',
    virtue:
      'İşlerde üzüntü ve darlıktan kurtulmak; her işte başarı; zor akıl hastalarına yazılıp taşıtıldığında şifa; çözülmesi imkansız görülen işlerin kolayca çözülmesi.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْبَارِئُ',
    transliteration: "El-Bâri'",
    meaning: 'Eşyayı ve her şeyin vücudunu birbirine uygun ve kusursuz yaratan.',
    virtue:
      'İş hayatında olağanüstü başarı ve şöhret; düşmanları yenmek; zihin ve aklın gelişimi; ağır işlerin kolaylaşması; bir sene devamla zikredildiğinde şifacılık yeteneği.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُصَوِّرُ',
    transliteration: 'El-Musavvir',
    meaning: 'Varlıklara şekillerini veren, onları birbirinden farklı kılan.',
    virtue:
      'Maksat ve merama ulaşmak; en zor işleri başarmak; sanatkarlar için yaratıcılık; ruhanilerle irtibat kurmak; sıkıntılardan arınmak; ahlaklı evlat sahibi olmak.',
    dhikrDay: 'Pazartesi'
  },
  {
    nameArabic: 'الْغَفَّارُ',
    transliteration: 'El-Gaffâr',
    meaning: 'Kullarının günahlarını örten, mağfireti pek çok olan.',
    virtue:
      'Günahların bağışlanması ve korunması; hata ve isyanlardan arınma; düşman ve hasımların gözünde görünmez (zararsız) hale gelmek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْقَهَّارُ',
    transliteration: 'El-Kahhâr',
    meaning: 'Her şeye, her istediğini yapacak surette galip ve hakim olan.',
    virtue:
      'Din düşmanlarının, zalimlerin ve zorbaların kahrından kurtulmak; nefs-i emmarenin isteklerini ve kötü huyları ezmek.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْوَهَّابُ',
    transliteration: 'El-Vehhâb',
    meaning: 'Karşılıksız bol ihsanlarda, bağışlarda ve hibelerde bulunan.',
    virtue:
      'Sıkıntısız, borçsuz ve son derece konforlu bir yaşam; rızkın artması; mahlukata karşı güçlü ve heybetli görünmek; duaların hızla kabulü.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الرَّزَّاقُ',
    transliteration: 'Er-Rezzâk',
    meaning: 'Bütün mahlukatın rızkını veren ve her türlü ihtiyacını karşılayan.',
    virtue:
      'Rızık bolluğu; maddi sıkıntıların kalıcı bitişi; zihin açılması; resmi işlerin çözülmesi; sabah namazı öncesi okunup üflendiğinde eve kötülük girmemesi.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْفَتَّاحُ',
    transliteration: 'El-Fettâh',
    meaning: 'Her türlü zorlukları kolaylaştıran, maddi-manevi darlıktan kurtaran.',
    virtue:
      'Maddi ve manevi hayır kapılarının açılması; ticarette başarı; darlık çekmemek; kalbin nurlanması; rüyada bilinmeyen sırların gösterilmesi.',
    dhikrDay: 'Çarşamba'
  },
  {
    nameArabic: 'الْعَلِيمُ',
    transliteration: 'El-Alîm',
    meaning: 'Her şeyi en küçük detayına kadar ezeli ve ebedi ilmi ile en iyi bilen.',
    virtue:
      'İlim zenginliği; gizli sırlara vakıf olmak; hikmetli konuşma; anlayış ve zeka artışı; ilahi marifete ulaşmak.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْقَابِضُ',
    transliteration: 'El-Kâbıd',
    meaning: 'Dilediğine darlık veren, sıkan, daraltan, ruhları alan.',
    virtue:
      'Zalimin zulmünden korunmak; heybet ve celal kazanarak düşman dedikodularını engellemek; nefsani kötü huyları bırakmak; metafizik perdelerin kalkması.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْبَاسِطُ',
    transliteration: 'El-Bâsıt',
    meaning: 'Dilediğine bolluk veren, açan, genişleten, ferahlatan.',
    virtue:
      'Rızkın genişlemesi ve bereket; korkulardan emin olmak; endişelerin gitmesi; kalp gözünün açılması; keyif ve neşenin artması.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْخَافِضُ',
    transliteration: 'El-Hâfıd',
    meaning: 'Dereceleri alçaltan, kâfir ve facirleri aşağıya indiren.',
    virtue:
      'Kötülerin ve belaların defedilmesi; zalimlerin şerrinden korunmak; düşmanlara karşı her daim üstün ve güçlü görünmek.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الرَّافِعُ',
    transliteration: 'Er-Râfi',
    meaning: 'Şeref vererek yükselten, yukarı kaldıran.',
    virtue:
      'İnsanlar arasında ve iş hayatında yükselmek; tevazu sahibi olmak; rızkın artması; düşmanların kalbine korku salmak; fakirlikten korunma.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُعِزُّ',
    transliteration: "El-Mu'ız",
    meaning: 'Dilediğini aziz eden, izzet verip ağırlayan.',
    virtue:
      'Fakirlik ve zelillikten kurtulmak; gücün ve cesaretin artması; kadri kıymetin yücelmesi; mahlukata karşı heybetli görünmek.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'المُذِلُّ',
    transliteration: 'El-Müzil',
    meaning: 'Dilediğini zillete düşüren, hor ve hakir eden.',
    virtue:
      'Düşmanları zelil etmek; zalim şerrinden emin olmak; haksızlık yapanları hezimete uğratmak.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'السَّمِيعُ',
    transliteration: 'Es-Semî',
    meaning: 'Her şeyi en iyi işiten, duaları kabul eden.',
    virtue:
      'Duaların ilahi dergahta hızla kabulü; oruç ve halvetle zikredildiğinde ruhsal hassasiyetin artması ve metafizik algıların açılması.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْبَصِيرُ',
    transliteration: 'El-Basîr',
    meaning: 'Gizli açık her şeyi en iyi gören, her şeyi fark eden.',
    virtue:
      'Acziyetin ortadan kalkması; basiretli ve sezgileri güçlü biri olmak; dünya ve ahiret korkularından tamamen kurtulmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْحَكَمُ',
    transliteration: 'El-Hakem',
    meaning: 'Mutlak hakim olan, hakkı batıldan ayıran, hikmetle hükmeden.',
    virtue:
      'Haklı davayı kazanmak; insanlar arasında hak ve adaletle hüküm vermek; olayların iç yüzünü kavrama yeteneği.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْعَدْلُ',
    transliteration: 'El-Adl',
    meaning: 'Mutlak adil olan, her şeyi yerli yerinde yapan.',
    virtue:
      'Adaletli olmak; haklı davayı kazanmak; nefsi terbiye etmek; haram işlerden ve kötü ahlaktan uzak durmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'اللَّطِيفُ',
    transliteration: 'El-Latîf',
    meaning: 'Bütün incelikleri bilen, kullarına sezdirmeden lütuf sunan.',
    virtue:
      'Dileklerin kabulü; kısmet ve rızkın umulmadık yerlerden artması; zor durumların kolayca atlatılması.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْخَبِيرُ',
    transliteration: 'El-Habîr',
    meaning: 'Her şeyin iç yüzünden, gizli tarafından haberdar olan.',
    virtue:
      'Hafıza ve idrakin genişlemesi; bilinmeyen, gizemli meselelerin rüya ve ilham yoluyla kişiye aşikar olması.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْحَلِيمُ',
    transliteration: 'El-Halîm',
    meaning: 'Cezalandırmada acele etmeyen, yumuşak davranan, hilm sahibi.',
    virtue:
      'Ahlak güzelliği; yumuşak huylu olmak; öfke, hiddet ve sinir krizlerinden kurtulup ruhi sükunete ermek.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْعَظِيمُ',
    transliteration: 'El-Azîm',
    meaning: 'Pek yüce, büyüklükte benzeri ve ortağı olmayan.',
    virtue:
      'Sözünün insanlar üzerinde son derece tesirli ve dinlenir olması; toplum nezdinde büyük heybet ve saygınlık kazanmak.',
    dhikrDay: 'Çarşamba'
  },
  {
    nameArabic: 'الْغَفُورُ',
    transliteration: 'El-Gafûr',
    meaning: 'Affı ve mağfireti çok bol olan, günahları bağışlayan.',
    virtue:
      'Günahların affı; kötü ahlaktan korunmak; stres ve anksiyeteden kurtulup kalbe derin bir huzur ve sekine indirmek.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الشَّكُورُ',
    transliteration: 'Eş-Şekûr',
    meaning: 'Kendi rızası için yapılan az amele çok sevap veren.',
    virtue:
      'Verilen nimetlerin şükrünü eda edebilmek; talihin açıklığı; rızıkta ve kazançta bereketin katlanarak artması.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْعَلِيُّ',
    transliteration: 'El-Aliyy',
    meaning: 'Yüceler yücesi, çok yüksek ve ulaşılamaz olan.',
    virtue:
      'Zilletten, hor görülmekten kurtulmak; ilim ve manevi derecelerin hızla artması; saygınlık elde etmek.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْكَبِيرُ',
    transliteration: 'El-Kebîr',
    meaning: 'Büyüklüğünde hudut olmayan, her şeyden büyük olan.',
    virtue:
      'Maddi ve manevi büyüklük; toplumda sözü dinlenen, hürmet ve tazim gören saygın bir lider konumuna gelmek.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْحَفِيظُ',
    transliteration: 'El-Hafîz',
    meaning: 'Yapılan işleri ayrıntısıyla tutan, her şeyi belli vakte kadar koruyan.',
    virtue:
      'Nefsin, canın ve malın korunması; zalimlerin şerrinden emin olmak; düşmanlara karşı her daim üstünlük sağlamak.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْمُقِيتُ',
    transliteration: 'El-Mukît',
    meaning: 'Yaratılmış her mahlukatın azığını, gıdasını ve rızkını veren.',
    virtue:
      'Muhtaç olunan rızkı kolayca kazanmak; beden gücü elde etmek; darlık ve açlık korkularından emin olmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْحَسِيبُ',
    transliteration: 'El-Hasîb',
    meaning: 'Kulların hayatları boyunca yaptıklarının hesabını en iyi gören.',
    virtue:
      'Herkese karşı açık alınlı ve dürüst olmak; korkulardan emin olmak; haksız ithamlardan ve dedikodulardan korunmak.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْجَلِيلُ',
    transliteration: 'El-Celîl',
    meaning: 'Azamet, celal ve ululuk sahibi olan, şanı yüce olan.',
    virtue:
      'Toplumda manevi heybet kazanmak; düşmanların kötülük yapmaya cesaret edememesi; saygı duyulan biri olmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْكَرِيمُ',
    transliteration: 'El-Kerîm',
    meaning: 'Karşılıksız veren, çok ikram edici, lütuf ve ihsanı bol olan.',
    virtue:
      'Cömertlik ve güzel ahlak kazanmak; darlıktan kurtulmak; her türlü maddi-manevi lütfa zahmetsizce ulaşmak.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الرَّقِيبُ',
    transliteration: 'Er-Rakîb',
    meaning: 'Bütün varlıkları ve işleri her an murakabe edip gözeten.',
    virtue:
      'Hırsızlıktan, ihanetten ve kazalardan emin olmak; işlerin kontrol altında aksamadan ilerlemesi.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْمُجِيبُ',
    transliteration: 'El-Mucîb',
    meaning: 'Kendisine dua edenlerin dualarını kabul eden, istekleri veren.',
    virtue:
      'Duaların engelsiz şekilde ilahi huzura kabulü; hayırlı isteklerin hızlıca gerçekleşmesi.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْوَاسِعُ',
    transliteration: 'El-Vâsi',
    meaning: 'İlmi, rahmeti ve kudreti ile her şeyi kuşatan, lütfu bol olan.',
    virtue:
      'Kalp ve gönül ferahlığı; rızık darlığından kurtulmak; ömre, rızka ve berekete genişlik kazandırmak.',
    dhikrDay: 'Pazartesi'
  },
  {
    nameArabic: 'الْحَكِيمُ',
    transliteration: 'El-Hakîm',
    meaning: 'Emirleri, kelamı ve bütün işleri mutlak hikmetli olan.',
    virtue:
      'Derin ilim ve hikmet sahibi olmak; engellerin kalkması; işlerde en hayırlı ve isabetli kararları verebilmek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْوَدُودُ',
    transliteration: 'El-Vedûd',
    meaning: 'İyi kullarını çok seven, sevilmeye ve dostluğa en layık olan.',
    virtue:
      'İnsanlar arasında eşsiz bir sevgi, şefkat ve muhabbet celbi; borçlardan ve maddi sıkıntılardan kurtulmak.',
    dhikrDay: 'Pazartesi'
  },
  {
    nameArabic: 'الْمَجِيدُ',
    transliteration: 'El-Mecîd',
    meaning: 'Nimeti ve ihsanı sonsuz, şanı ve şerefi çok yüksek olan.',
    virtue:
      'Şan, şeref ve makam kazanmak; insanların sevgisine nail olmak; kalbin manevi kirlerden temizlenmesi.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْبَاعِثُ',
    transliteration: 'El-Bâis',
    meaning: 'Ölüleri diriltip kabirlerinden çıkaran, elçiler gönderen.',
    virtue:
      'Alacakları tahsil edebilmek; zalimlerin şerrinden ve iftiralardan hızla kurtulmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الشَّهِيدُ',
    transliteration: 'Eş-Şehîd',
    meaning: 'Bütün zamanlarda ve her yerde hazır ve nazır olan, gören.',
    virtue:
      'Heybetli görünmek; asi, itaatsiz ve geçimsiz yakınların, eş ve çocukların ıslah olup yola gelmesi.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْحَقُّ',
    transliteration: 'El-Hakk',
    meaning: 'Varlığı hiç değişmeden duran, hakkı ve adaleti gösteren.',
    virtue:
      'Haklı davalarda üstün gelmek; yalan ve batıllardan uzaklaşmak; işlerin doğruluk ve dürüstlük üzere yürümesi.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْوَكِيلُ',
    transliteration: 'El-Vekîl',
    meaning: 'Kendisine tevekkül edenlerin işlerini en iyi neticeye ulaştıran.',
    virtue:
      'Ani musibetlerden korunmak; rızık kapılarının açılması; düşman üzerine zöhre saatinde beddua için okunması.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْقَوِيُّ',
    transliteration: 'El-Kaviyy',
    meaning: 'Pek kuvvetli, pek güçlü, kudreti en üstün olan.',
    virtue:
      'Kansızlık ve fiziki zayıflıktan kurtulmak; yolculuk kazalarından muhafaza olmak; ağır yükleri kolayca kaldırmak.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْمَتِينُ',
    transliteration: 'El-Metîn',
    meaning: 'Çok sağlam, kudreti hiç eksilmeyen, sarsılmaz olan.',
    virtue:
      'Maddi-manevi direnç kazanmak; fakirlikten, zulümden, kötü ahlaktan arınmak; manevi sırlara vakıf olmak.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْوَلِيُّ',
    transliteration: 'El-Veliyy',
    meaning: 'İnananların, salih kulların gerçek dostu ve yardımcısı.',
    virtue:
      'Her işte ilahi yardım görmek; ahiret hesabının kolaylaşması; veli kullar zümresine kabul edilmek.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْحَمِيدُ',
    transliteration: 'El-Hamîd',
    meaning: 'Ancak kendisine hamdedilen, bütün varlığın diliyle övülen.',
    virtue:
      'Ahlakın ve amellerin güzelleşmesi; kazancın helal yoldan genişlemesi; mahlukatın sevgisi; namaz ardı 100 okuma ile salih olmak.',
    dhikrDay: 'Çarşamba'
  },
  {
    nameArabic: 'الْمُحْصِي',
    transliteration: 'El-Muhsî',
    meaning: 'Sonsuz da olsa her şeyin tek tek sayısını ve miktarını bilen.',
    virtue:
      'Zekanın olağanüstü kuvvetlenmesi; unutkanlığın tamamen gitmesi; muhatap kalplerin itaat etmesi; hastalıklara şifa.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُبْدِئُ',
    transliteration: 'El-Mübdi',
    meaning: 'Bütün varlıkları örneksiz ve maddesiz olarak ilk baştan yaratan.',
    virtue:
      'Girişilen işlerde üstün başarı; karar verme güçlüklerini aşmak; başlanan projeleri bitirmek.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْمُعِيدُ',
    transliteration: 'El-Muîd',
    meaning: 'Varlıkları yok ettikten sonra tekrar yaratan, dirilten.',
    virtue:
      'Kaybedilen itibar, mevki ve makamı geri kazanmak; altüst olmuş işlerin yeniden düzene girmesi.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْمُحْيِي',
    transliteration: 'El-Muhyî',
    meaning: 'İhya eden, can bağışlayan, dirilten, sağlık veren.',
    virtue:
      'Şifacılık yeteneklerinin uyanması; kalbin gafletten uyanıp dirilmesi; ağır ve kronik hastalıklardan kurtuluş.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْمُمِيتُ',
    transliteration: 'El-Mümît',
    meaning: 'Canlıların hayatına son veren, ölümü yaratan, öldüren.',
    virtue:
      'Nefsin harama olan meylini ve şehvetini köreltmek; düşmanların her türlü kötü planını iptal etmek.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْحَيُّ',
    transliteration: 'El-Hayy',
    meaning: 'Diri, tam ve mükemmel manasıyla sonsuz hayat sahibi.',
    virtue:
      'Genç, zinde ve diri kalmak; bedensel güçlenme; uzun ve sağlıklı ömür; kalbin tevhid nuruyla dolması.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْقَيُّومُ',
    transliteration: 'El-Kayyûm',
    meaning: 'Gökleri, yeri ve her şeyi ayakta tutan, varlığı kendinden olan.',
    virtue:
      'Ruhsal ve psikolojik rahatsızlıkların tedavisi; işlerin süreklilik ve istikrar kazanması.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْوَاجِدُ',
    transliteration: 'El-Vâcid',
    meaning: 'İstediğini istediği an bulan, hiçbir şeye muhtaç olmayan.',
    virtue:
      'Kaybedilen değerli şeyleri bulmak; kalbin manevi zenginliği; mevcut nimetlerin elden çıkmasını engellemek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْمَاجِدُ',
    transliteration: 'El-Mâcid',
    meaning: 'Kadri büyük, şanı yüce, keremi ve cömertliği bol olan.',
    virtue:
      'Kan basıncının dengelenmesi; şan ve şerefin artması; maddi imkanların genişlemesi.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْوَاحِدُ',
    transliteration: 'El-Vâhid',
    meaning: 'Zatında, sıfatlarında ve fiillerinde ortağı bulunmayan tek.',
    virtue:
      'Kalbin masivadan arınarak tek ilaha yönelmesi; yalnızlık korkusunu yenmek; tevhid bilincine ulaşmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الصَّمَدُ',
    transliteration: 'Es-Samed',
    meaning: 'Herkesin muhtaç olduğu, kendisi hiçbir şeye muhtaç olmayan.',
    virtue:
      'Şansın açılması; dertlere derman bulmak; kimseye muhtaç olmadan onurlu ve bağımsız bir yaşam sürmek.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْقَادِرُ',
    transliteration: 'El-Kâdir',
    meaning: 'Dilediğini yapmaya gücü yeten, mutlak kudret sahibi.',
    virtue:
      'Bedensel ve zihinsel güç kazanmak; düşman şerrinden tam koruma; bilimsel çalışmalarda başarı; sol göz sağlığı.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُقْتَدِرُ',
    transliteration: 'El-Muktedir',
    meaning: 'Güç ve kuvvet sahipleri üzerinde dilediği gibi tasarruf eden.',
    virtue:
      'İktidar, güç ve nüfuz sahibi olmak; zor işlerin kolayca çözülmesi; omuz ve boyun fıtığı şifası.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْمُقَدِّمُ',
    transliteration: 'El-Mukaddim',
    meaning: 'Dilediğini ileri geçiren, öne alan, yükselten.',
    virtue:
      'Sınav, ticaret ve hayırlı işlerde rakiplerin önüne geçmek; makamda yükselmek; işlerin hızlanması.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْمُؤَخِّرُ',
    transliteration: 'El-Muahhir',
    meaning: 'Dilediğini geride bırakan, arkaya koyan, erteleyen.',
    virtue:
      'Kötü niyetli kişileri geride bırakmak; belaları ertelemek; sağ ayak ve lenf ödemi şifası.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْأَوَّلُ',
    transliteration: 'El-Evvel',
    meaning: 'Ezeli olan, başlangıcı bulunmayan, ilk olan.',
    virtue:
      'Girişilen işlerin sonunun hayırla neticelenmesi; uzun yolculukların kaza belasız tamamlanması.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْآخِرُ',
    transliteration: 'El-Âhir',
    meaning: 'Ebedi olan, sonu bulunmayan, sonsuz olan.',
    virtue:
      'Ömrün hayırla tamamlanması; son nefeste imanla göçmek; gizli düşmanların tamamen etkisiz hale gelmesi.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الظَّاهِرُ',
    transliteration: 'Ez-Zâhir',
    meaning: 'Eserleriyle, yarattıklarıyla varlığı açık ve aşikar olan.',
    virtue:
      'Gizli kalmış işlerin aydınlanması; kalbin nurlanması; rakiplere karşı ezici üstünlük sağlamak.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْبَاطِنُ',
    transliteration: 'El-Bâtın',
    meaning: 'Yüceliği gizli olan, akılların idrak edemeyeceği zat.',
    virtue:
      'Ruhsal derinlik ve manevi olgunluk kazanmak; vesveselerden kalıcı olarak özgürleşmek.',
    dhikrDay: 'Pazartesi'
  },
  {
    nameArabic: 'الْوَالِي',
    transliteration: 'El-Vâlî',
    meaning: 'Kainatı idare eden, onun üzerinde tek tasarruf sahibi olan.',
    virtue:
      'Yönetim ve liderlik yeteneği kazanmak; karmaşık işleri kolayca idare etmek; amirler nezdinde dinlenmek.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُتَعَالِي',
    transliteration: 'El-Müteâlî',
    meaning: 'İzzet, şan ve şerefiyle her şeyden üstün, pek yüce olan.',
    virtue:
      'Mevki ve makamın korunması; haksız suçlamalardan ve iftiralardan uzak kalmak; devlet işlerinin kolaylaşması.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'الْبَرُّ',
    transliteration: 'El-Berr',
    meaning: 'İyilik ve ihsanı bol olan, kullarının iyiliğini isteyen.',
    virtue:
      'İçindeki iyilik yapma arzusunun artması; kazalardan korunmak; ahlakın mükemmelleşmesi.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'التَّوَّابُ',
    transliteration: 'Et-Tevvâb',
    meaning: 'Tövbeleri kabul eden, günahları bağışlayan.',
    virtue:
      'Günahlardan samimi tövbeyle sıyrılmak; kötü alışkanlıkları kolayca bırakmak; rızık kapılarının açılması.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْمُنْتَقِمُ',
    transliteration: 'El-Müntekim',
    meaning: 'Suçluları adaletiyle cezalandıran, intikam alan.',
    virtue:
      'Zalimlerin şerrinden adalete sığınmak; haksızlığa uğrayanların hakkını ilahi adaletle geri alması.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'الْعَفُوُّ',
    transliteration: 'El-Afüvv',
    meaning: 'Affı çok olan, günahları tamamen silip yok eden.',
    virtue:
      'İlahi affa nail olmak; kin, nefret ve intikam gibi kalbi yıpratan duygulardan tamamen arınmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الرَّؤُوفُ',
    transliteration: 'Er-Raûf',
    meaning: 'Çok merhametli, çok şefkatli, lütufta bulunan.',
    virtue:
      'Merhamet ve şefkat duygularının artması; insanlar tarafından sevilip korunmak; öfkenin kontrolü.',
    dhikrDay: 'Cumartesi'
  },
  {
    nameArabic: 'مَالِكُ الْمُلْكِ',
    transliteration: 'Mâlik-ül Mülk',
    meaning: 'Her varlığın, mülkün tek ve mutlak sahibi olan.',
    virtue:
      'Maddi güç, mal ve servetin korunması; kimseye borçlu kalmadan huzurlu bir yaşam sürmek.',
    dhikrDay: 'Çarşamba'
  },
  {
    nameArabic: 'ذُو الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Zül-Celâli vel İkrâm',
    meaning: 'Hem celal (azamet) hem de ikram (kerem) sahibi olan.',
    virtue:
      'Duaların en hızlı şekilde kabulü; insanların gözünde olağanüstü saygınlık ve karizma kazanmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُقْسِطُ',
    transliteration: 'El-Muksit',
    meaning: 'Her işi birbirine denk yapan, mutlak adil olan.',
    virtue:
      'Aile içi geçimsizliklerin ve huzursuzlukların bitmesi; adil kararlar verebilmek; borç ödeme kolaylığı.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْجَامِعُ',
    transliteration: 'El-Câmi',
    meaning: 'Mahşerde mahlukatı bir araya toplayan, birleştiren.',
    virtue:
      'Kaybolan eşyayı veya insanı bulmak; dargınları barıştırmak; dağınık işleri bir araya getirmek.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْغَنِيُّ',
    transliteration: 'El-Ganiyy',
    meaning: 'Hiçbir şeye ihtiyacı olmayan, mutlak zengin olan.',
    virtue:
      'Maddi-manevi zenginlik; baş ağrısı ve migren ağrılarının şifası.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْمُغْنِي',
    transliteration: 'El-Mugnî',
    meaning: 'Dilediğini zengin kılan, kendi kendine yeterli kılan.',
    virtue:
      'Büyük zenginliğe ulaşmak; geçim darlığından tamamen kurtulmak; insanlardan bir şey istemeyecek konuma gelmek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْمَانِعُ',
    transliteration: 'El-Mâni',
    meaning: 'Dilemediği şeylerin gerçekleşmesini engelleyen, koruyan.',
    virtue:
      'Kazaların, belaların engellenmesi; sağ el, başın üstü ve kalp için şifa; zararlı alışkanlıkları bırakmak.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الضَّارُ',
    transliteration: 'Ed-Dârr',
    meaning: 'Zarar verenleri yaratan, dilediğine zarar veren.',
    virtue:
      'Zararlı düşmanların planlarını bozmak; hile yapanların hilelerini kendi başlarına yıkmak.',
    dhikrDay: 'Salı'
  },
  {
    nameArabic: 'النَّافِعُ',
    transliteration: 'En-Nâfi',
    meaning: 'Fayda verenleri yaratan, dilediğine fayda sağlayan.',
    virtue:
      'Hastalıklara şifa bulmak; kazancın artması; girişilen her türlü ticari işten büyük kârlar elde etmek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'النُّورُ',
    transliteration: 'En-Nûr',
    meaning: 'Alemleri nurlandıran, kalplere hidayet nuru veren.',
    virtue:
      'Kalbin iman nuruyla dolması; zihin ve basiret açıklığı; doğru yolu kolayca görebilmek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الْهَادِي',
    transliteration: 'El-Hâdî',
    meaning: 'Hidayet veren, dilediğini doğru yola ulaştıran.',
    virtue:
      'Hidayete ermek; çocukların güzel ahlaklı olması; idrar kesesi ve kalp için fiziki şifa.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْبَدِيعُ',
    transliteration: 'El-Bedî',
    meaning: 'Örneksiz, benzersiz ve eşsiz yaratan.',
    virtue:
      'Sanatta, bilimde ve iş hayatında özgün projeler üretmek; zor işlerin üstesinden gelmek; takdir toplamak.',
    dhikrDay: 'Perşembe'
  },
  {
    nameArabic: 'الْبَاقِي',
    transliteration: 'El-Bâkî',
    meaning: 'Ebedi olan, varlığının sonu bulunmayan.',
    virtue:
      'Ömrün uzun ve bereketli olması; sadır, idrar yolu ve boşaltım için fiziki şifa; gelecek endişesini yenmek.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الْوَارِثُ',
    transliteration: 'El-Vâris',
    meaning: 'Her şey yok olduktan sonra varlığı devam eden asıl sahibi.',
    virtue:
      'Mal, mülk ve toprak sahibi olmak; hayırlı bir neslin devam etmesi; ahiret saadetine ermek.',
    dhikrDay: 'Cuma'
  },
  {
    nameArabic: 'الرَّشِيدُ',
    transliteration: 'Er-Reşîd',
    meaning: 'Doğru yolu en iyi gösteren, irşad eden.',
    virtue:
      'Alınan kararlardan pişman olmamak; doğru kararlar vermek; prostat, omurilik ve sağ ayak için fiziki şifa.',
    dhikrDay: 'Pazar'
  },
  {
    nameArabic: 'الصَّبُورُ',
    transliteration: 'Es-Sabûr',
    meaning: 'Cezalandırmada acele etmeyen, sabrı çok olan.',
    virtue:
      'Zor zamanlarda sabır ve metanet kazanmak; öfkeyi kontrol altına almak; sıkıntılardan kurtulmak.',
    dhikrDay: 'Pazar'
  }
]
