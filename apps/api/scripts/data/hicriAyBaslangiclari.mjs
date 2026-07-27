import { keyMap } from './keyMap.mjs';

/**
 * Hicri ay başlangıçları (1448).
 *
 * Tarihler Diyanet İşleri Başkanlığı "2026 Yılı Dini Günler Listesi"nden
 * alınmıştır (vakithesaplama.diyanet.gov.tr/icerik.php?icerik=153):
 *   1 Rebiülevvel 1448  → 14 Ağustos 2026 Cuma
 *   1 Rebiülahir 1448   → 12 Eylül 2026 Cumartesi
 *   1 Cemaziyelevvel    → 12 Ekim 2026 Pazartesi
 *   1 Cemaziyelahir     → 10 Kasım 2026 Salı
 *
 * Not: Bu ayların kendilerine mahsus, sahih rivayete dayanan özel bir ibadeti
 * yoktur. İçerikler bilinçli olarak "aya özel fazilet" iddiası kurmaz; her ay
 * için geçerli olan sünnetlere (hilâl duası, eyyâm-ı biyd orucu, pazartesi
 * perşembe orucu, muhasebe) yönlendirir.
 */
export const hicriAyBaslangiclari = {
  key: 'hicri-ay-baslangiclari-1448',
  label: {
    tr: 'Hicri Ay Başlangıçları 1448',
    en: 'Hijri Month Beginnings 1448',
  },
  category: 'ibadet',
  description: {
    tr: 'Rebiülevvel, Rebiülahir, Cemaziyelevvel ve Cemaziyelahir aylarının başlangıç günleri (1448).',
    en: 'The first days of Rabi al-Awwal, Rabi al-Akhir, Jumada al-Ula, and Jumada al-Akhira (1448).',
  },
  dhikrItems: [],
  specialDays: [
    {
      name: {
        tr: 'Rebiülevvel Ayı Başlangıcı',
        en: 'Beginning of Rabi al-Awwal',
      },
      type: 'özel gün',
      date: '2026-08-14',
      hijriDate: '1 Rebiülevvel 1448',
      description: {
        tr: "Peygamber Efendimiz'in doğduğu, hicretle Medine'ye ulaştığı ve vefat ettiği ay başlıyor. Salavat ve siyerle karşılanan bir ay.",
        en: "The month in which the Prophet was born, reached Medina in the hijra, and passed away. A month met with salawat and the reading of his life.",
      },
      article: {
        tr: `Rebiülevvel, hicri takvimin üçüncü ayıdır. Adı "ilk bahar" anlamına gelir; İslam öncesi Arap toplumunda ay adları konulurken bu ayın bahara denk gelmesinden gelmektedir. Hicri takvim ay yılına dayandığı için aylar mevsimler içinde kayar, dolayısıyla bugün bu isimler mevsimsel bir karşılık taşımaz.

Bu ay, Peygamber Efendimiz'in hayatındaki üç dönüm noktasıyla anılır. Siyer kaynaklarına göre Efendimiz bu ayda dünyaya gelmiş, hicret yolculuğunun sonunda Medine'ye bu ayda ulaşmış ve yine bu ayda vefat etmiştir. Bu sebeple Rebiülevvel, İslam toplumlarında hüzün ve şükrün birlikte anıldığı bir ay olmuştur.

Ayın on ikinci gecesi Mevlid Kandili olarak idrak edilir; 1448 yılında bu gece 24 Ağustos 2026 Pazartesi akşamına denk gelmektedir. Mevlid'in dışında bu aya mahsus, sahih rivayete dayanan özel bir namaz veya oruç bulunmamaktadır. Ayı değerli kılan, Efendimiz'le olan bağın tazelenmesidir.

Bu sebeple ayı karşılarken en yerinde niyet, salavatı günlük bir alışkanlık hâline getirmek ve siyer okumaya bir yer açmaktır. Bunun yanında her ay için geçerli olan sünnetler bu ayda da geçerlidir: ayın 13, 14 ve 15. günlerinde tutulan eyyâm-ı biyd orucu, pazartesi ve perşembe oruçları, hilâli görünce yapılan dua ve ay başında yapılan kısa bir muhasebe.`,
        en: `Rabi al-Awwal is the third month of the Hijri calendar. Its name means "the first spring," dating from the pre-Islamic Arab practice of naming months after the season in which they then fell. Because the Hijri calendar follows the lunar year, the months drift through the seasons, so these names no longer carry any seasonal meaning today.

The month is remembered for three turning points in the life of the Prophet. According to the sira sources, he was born in this month, reached Medina at the end of the hijra in this month, and passed away in this month as well. For this reason Rabi al-Awwal has long been a month in which Muslims hold sorrow and gratitude together.

The twelfth night of the month is observed as Mawlid al-Nabi; in 1448 this falls on the evening of Monday, 24 August 2026. Apart from the Mawlid, there is no prayer or fast specific to this month established by sound narration. What gives the month its value is the renewal of one's bond with the Prophet.

The most fitting intention on entering this month, then, is to make salawat a daily habit and to make room for reading his life story. Alongside this, the sunnas that apply to every month apply here too: the "white days" fast on the 13th, 14th, and 15th, fasting on Mondays and Thursdays, the supplication made upon sighting the new moon, and a brief self-reckoning at the start of the month.`,
      },
      practices: [
        {
          title: { tr: 'Salavatı günlük alışkanlık hâline getirmek', en: 'Making salawat a daily habit' },
          description: {
            tr: "Ahzâb sûresi 56. âyette Peygamber'e salât ve selam getirmek müminlere emredilir. Bu ay boyunca günde belirli bir sayı belirleyip düzenli salavat getirmek, ayın anlamına en uygun ameldir.",
            en: 'In al-Ahzab 33:56 the believers are commanded to send blessings and peace upon the Prophet. Setting a daily count and keeping to it through the month is the practice most fitting to its meaning.',
          },
        },
        {
          title: { tr: 'Siyer okumak', en: 'Reading the sira' },
          description: {
            tr: "Ay boyunca Efendimiz'in hayatından düzenli olarak okumak — özellikle hicret ve Medine dönemi — bu ayı bilgiyle besler. Aile içinde kısa bölümler okumak da güzel bir usuldür.",
            en: "Reading regularly from the Prophet's life through the month — particularly the hijra and the Medinan period — feeds it with knowledge. Reading short passages together as a family is a fine way to do this.",
          },
        },
        {
          title: { tr: 'Hilâl duası', en: 'Supplication on sighting the new moon' },
          description: {
            tr: "Tirmizî'nin naklettiğine göre Peygamber Efendimiz yeni ayı görünce şöyle dua ederdi: \"Allâhümme ehillehû aleynâ bi'l-emni ve'l-îmân, ve's-selâmeti ve'l-İslâm\" — \"Allahım! Bu ayı bize emniyet, iman, selâmet ve İslâm ile getir.\"",
            en: 'Tirmidhi narrates that upon seeing the new moon the Prophet would supplicate: "O God, bring it over us with security and faith, with safety and submission."',
          },
        },
        {
          title: { tr: 'Eyyâm-ı biyd orucu', en: 'Fasting the white days' },
          description: {
            tr: "Buhârî ve Müslim'de her aydan üç gün oruç tutmanın tavsiye edildiği rivayet edilir; bu üç günün ayın 13, 14 ve 15'i olduğu Nesâî ve Tirmizî rivayetlerinde belirtilir. Rebiülevvel 1448'de bu günler 26–28 Ağustos 2026'ya denk gelir.",
            en: 'Bukhari and Muslim record the recommendation to fast three days of every month; narrations in Nasa\'i and Tirmidhi identify these as the 13th, 14th, and 15th. In Rabi al-Awwal 1448 these fall on 26–28 August 2026.',
          },
        },
      ],
      eventKey: 'hicri-ay-baslangici-rebiulevvel-1448',
      priority: 130,
      dhikrKeys: [
        keyMap.HILAL_DUASI,
        keyMap.SALAVAT_SERIF,
        keyMap.ISTIGFAR,
        keyMap.TEVHID,
        keyMap.ESTAGFIRULLAH,
      ],
    },
    {
      name: {
        tr: 'Rebiülahir Ayı Başlangıcı',
        en: 'Beginning of Rabi al-Akhir',
      },
      type: 'özel gün',
      date: '2026-09-12',
      hijriDate: '1 Rebiülahir 1448',
      description: {
        tr: 'Hicri yılın dördüncü ayı başlıyor. Aya mahsus özel bir ibadeti yoktur; her ay geçerli olan sünnetlerle karşılanır.',
        en: 'The fourth month of the Hijri year begins. It has no worship specific to it; it is met with the sunnas that apply to every month.',
      },
      article: {
        tr: `Rebiülahir, hicri takvimin dördüncü ayıdır. "İkinci bahar" anlamına gelen adı, kendisinden önce gelen Rebiülevvel ile birlikte konulmuştur. Ay adları İslam öncesi Arap toplumunda o dönemki mevsimlere göre verildiği için, hicri takvimin ay yılına dayanması sebebiyle bugün bu isimler mevsimsel bir karşılık taşımaz.

Bu ayın kendisine mahsus, sahih bir rivayete dayanan özel bir namazı, orucu ya da gecesi yoktur. Bazı halk takvimlerinde bu aya nispet edilen ibadet tarifleri dolaşsa da, bunların hadis kaynaklarında güvenilir bir dayanağı bulunmaz. Böyle bir ayın en doğru karşılanma biçimi, aya olmayan bir fazilet yüklemek yerine, her ay için sabit olan sünnetleri sürdürmektir.

Bunlar bellidir: hilâli görünce dua etmek, ayın 13, 14 ve 15. günlerinde eyyâm-ı biyd orucunu tutmak, pazartesi ve perşembe günleri oruç tutmak, Kur'an okumayı ve günlük zikri aksatmamak.

Ay başları aynı zamanda kısa bir muhasebe için doğal bir duraktır. Geçen ay hangi niyet tutuldu, hangisi yarım kaldı; namaz, sadaka, kul hakkı ve sıla-i rahim hangi noktada — bunları gözden geçirip önümüzdeki ay için tek bir somut hedef belirlemek, gösterişli fakat kısa ömürlü ibadet çıkışlarından daha kalıcıdır.`,
        en: `Rabi al-Akhir is the fourth month of the Hijri calendar. Its name, meaning "the second spring," was given alongside the preceding month, Rabi al-Awwal. Since the month names were assigned in pre-Islamic Arabia according to the seasons of that time, and the Hijri calendar follows the lunar year, these names carry no seasonal meaning today.

This month has no prayer, fast, or night specific to it established by sound narration. Descriptions of month-specific devotions do circulate in some popular calendars, but they have no reliable basis in the hadith sources. The soundest way to meet such a month is not to assign it a virtue it does not have, but to keep up the sunnas that hold for every month.

These are well defined: supplicating upon sighting the new moon, fasting the "white days" on the 13th, 14th, and 15th, fasting on Mondays and Thursdays, and not letting recitation of the Qur'an and daily remembrance lapse.

The start of a month is also a natural point for a brief self-reckoning. Which intentions from last month were kept and which were left unfinished; where things stand with prayer, charity, the rights of others, and ties of kinship — reviewing these and setting a single concrete goal for the coming month lasts longer than a burst of devotion that is impressive but short-lived.`,
      },
      practices: [
        {
          title: { tr: 'Hilâl duası', en: 'Supplication on sighting the new moon' },
          description: {
            tr: "Tirmizî'nin naklettiğine göre Peygamber Efendimiz yeni ayı görünce şöyle dua ederdi: \"Allâhümme ehillehû aleynâ bi'l-emni ve'l-îmân, ve's-selâmeti ve'l-İslâm\" — \"Allahım! Bu ayı bize emniyet, iman, selâmet ve İslâm ile getir.\"",
            en: 'Tirmidhi narrates that upon seeing the new moon the Prophet would supplicate: "O God, bring it over us with security and faith, with safety and submission."',
          },
        },
        {
          title: { tr: 'Eyyâm-ı biyd orucu', en: 'Fasting the white days' },
          description: {
            tr: "Her aydan üç gün oruç tutmak Buhârî ve Müslim'de tavsiye edilir; bu günlerin ayın 13, 14 ve 15'i olduğu Nesâî ve Tirmizî rivayetlerinde geçer. Rebiülahir 1448'de bu günler 24–26 Eylül 2026'ya denk gelir.",
            en: 'Fasting three days of each month is recommended in Bukhari and Muslim; narrations in Nasa\'i and Tirmidhi identify them as the 13th, 14th, and 15th. In Rabi al-Akhir 1448 these fall on 24–26 September 2026.',
          },
        },
        {
          title: { tr: 'Pazartesi ve perşembe orucu', en: 'Fasting on Mondays and Thursdays' },
          description: {
            tr: "Tirmizî'de amellerin pazartesi ve perşembe günleri Allah'a arz edildiği, Efendimiz'in de bu günlerde oruçlu olmayı sevdiği rivayet edilir. Ayı bu düzenle geçirmek, aya özel bir ibadet aramaktan daha sağlam bir yoldur.",
            en: 'Tirmidhi records that deeds are presented to God on Mondays and Thursdays, and that the Prophet liked to be fasting on those days. Keeping this rhythm through the month is a firmer path than searching for a month-specific devotion.',
          },
        },
        {
          title: { tr: 'Ay başı muhasebesi', en: 'A reckoning at the turn of the month' },
          description: {
            tr: 'Geçen ayın niyetlerini gözden geçirip yeni ay için tek bir somut hedef belirleyin: bir vakit namazı cemaatle kılmak, günlük belirli sayıda istiğfar, ya da düzenli bir sadaka gibi.',
            en: 'Review last month\'s intentions and set one concrete goal for the new one: praying a particular prayer in congregation, a fixed daily count of istighfar, or a regular act of charity.',
          },
        },
      ],
      eventKey: 'hicri-ay-baslangici-rebiulahir-1448',
      priority: 130,
      dhikrKeys: [
        keyMap.HILAL_DUASI,
        keyMap.ISTIGFAR,
        keyMap.ESTAGFIRULLAH,
        keyMap.SALAVAT_SERIF,
        keyMap.SUBHANALLAHI_VE_BIHAMDIHI,
      ],
    },
    {
      name: {
        tr: 'Cemaziyelevvel Ayı Başlangıcı',
        en: 'Beginning of Jumada al-Ula',
      },
      type: 'özel gün',
      date: '2026-10-12',
      hijriDate: '1 Cemaziyelevvel 1448',
      description: {
        tr: 'Hicri yılın beşinci ayı başlıyor. Aya mahsus özel bir ibadeti yoktur; her ay geçerli olan sünnetlerle karşılanır.',
        en: 'The fifth month of the Hijri year begins. It has no worship specific to it; it is met with the sunnas that apply to every month.',
      },
      article: {
        tr: `Cemaziyelevvel, hicri takvimin beşinci ayıdır. Adı, Arapça'da "donmak, katılaşmak" anlamındaki *cemed* kökünden gelir; İslam öncesi Arap toplumunda ay adları konulurken bu ayın kışa denk gelmesine işaret eder. Hicri takvim ay yılına dayandığı ve her yıl güneş yılından yaklaşık on bir gün geride kaldığı için, bugün bu isimlerin mevsimsel bir karşılığı kalmamıştır.

Bu ayın kendisine mahsus, sahih rivayete dayanan özel bir namazı, orucu veya gecesi yoktur. Bir aya kaynağı olmayan fazilet nispet etmek, dinin kendi ölçüsüne aykırıdır; nitekim hadis âlimleri, belirli aylara özel ibadet vaat eden pek çok rivayetin uydurma olduğunu tespit etmiştir. Doğru yaklaşım, sabit ve sahih olana tutunmaktır.

Her ay geçerli olan sünnetler bu ayda da geçerlidir: hilâli görünce dua etmek, ayın 13, 14 ve 15. günlerinde eyyâm-ı biyd orucunu tutmak, pazartesi ve perşembe oruçları, günlük Kur'an tilaveti ve zikir.

Ayrıca hicri ay başları, ibadet hayatını gözden geçirmek için tabii bir duraktır. Bir sonraki ay olan Cemaziyelahir'in ardından Recep gelir ve Üç Aylar başlar; bu ay, o dönemi karşılamak için sessiz bir hazırlık ayı olarak değerlendirilebilir.`,
        en: `Jumada al-Ula is the fifth month of the Hijri calendar. Its name derives from the Arabic root *jamad*, meaning "to freeze" or "to harden," pointing to the fact that in pre-Islamic Arabia, when the month names were fixed, it fell in winter. Because the Hijri calendar follows the lunar year and falls behind the solar year by about eleven days annually, these names no longer correspond to any season.

This month has no prayer, fast, or night specific to it established by sound narration. Ascribing an unfounded virtue to a month runs against the measure of the religion itself; hadith scholars have in fact identified many narrations promising month-specific devotions as fabrications. The sound approach is to hold to what is established and authentic.

The sunnas that apply to every month apply here too: supplicating upon sighting the new moon, fasting the "white days" on the 13th, 14th, and 15th, fasting on Mondays and Thursdays, and daily recitation and remembrance.

The turn of a Hijri month is also a natural point at which to review one's devotional life. After the following month, Jumada al-Akhira, comes Rajab and the Three Holy Months begin; this month can be treated as a quiet period of preparation for that season.`,
      },
      practices: [
        {
          title: { tr: 'Hilâl duası', en: 'Supplication on sighting the new moon' },
          description: {
            tr: "Tirmizî'nin naklettiğine göre Peygamber Efendimiz yeni ayı görünce şöyle dua ederdi: \"Allâhümme ehillehû aleynâ bi'l-emni ve'l-îmân, ve's-selâmeti ve'l-İslâm\" — \"Allahım! Bu ayı bize emniyet, iman, selâmet ve İslâm ile getir.\"",
            en: 'Tirmidhi narrates that upon seeing the new moon the Prophet would supplicate: "O God, bring it over us with security and faith, with safety and submission."',
          },
        },
        {
          title: { tr: 'Eyyâm-ı biyd orucu', en: 'Fasting the white days' },
          description: {
            tr: "Her aydan üç gün oruç tutmak Buhârî ve Müslim'de tavsiye edilir; bu günlerin ayın 13, 14 ve 15'i olduğu Nesâî ve Tirmizî rivayetlerinde geçer. Cemaziyelevvel 1448'de bu günler 23–25 Ekim 2026'ya denk gelir.",
            en: 'Fasting three days of each month is recommended in Bukhari and Muslim; narrations in Nasa\'i and Tirmidhi identify them as the 13th, 14th, and 15th. In Jumada al-Ula 1448 these fall on 23–25 October 2026.',
          },
        },
        {
          title: { tr: 'Günlük zikir düzenini kurmak', en: 'Establishing a daily remembrance routine' },
          description: {
            tr: 'Namaz sonrası tesbihat, sabah–akşam zikirleri ve günlük istiğfar sayısı gibi sade bir düzen kurmak; ayı bir alışkanlık inşa etme dönemi hâline getirir.',
            en: 'Setting a simple routine — the tasbih after prayer, morning and evening remembrances, a daily count of istighfar — turns the month into a period for building a habit.',
          },
        },
        {
          title: { tr: 'Üç Aylar öncesi hazırlık', en: 'Preparing for the Three Holy Months' },
          description: {
            tr: 'Recep ayına iki ay kaldı. Varsa kaza namazlarını ve kaza oruçlarını planlamak, borç ve kul hakkı gibi meseleleri gözden geçirmek için uygun bir zaman.',
            en: 'Two months remain until Rajab. This is a fitting time to plan any missed prayers and fasts, and to review outstanding debts and obligations toward others.',
          },
        },
      ],
      eventKey: 'hicri-ay-baslangici-cemaziyelevvel-1448',
      priority: 130,
      dhikrKeys: [
        keyMap.HILAL_DUASI,
        keyMap.ISTIGFAR,
        keyMap.SUBHANALLAHI_VE_BIHAMDIHI,
        keyMap.TEVHID,
        keyMap.SALAVAT_SERIF,
      ],
    },
    {
      name: {
        tr: 'Cemaziyelahir Ayı Başlangıcı',
        en: 'Beginning of Jumada al-Akhira',
      },
      type: 'özel gün',
      date: '2026-11-10',
      hijriDate: '1 Cemaziyelahir 1448',
      description: {
        tr: 'Hicri yılın altıncı ayı başlıyor. Üç Aylar\'dan önceki son ay; hazırlık ve muhasebe için uygun bir dönem.',
        en: 'The sixth month of the Hijri year begins — the last before the Three Holy Months, a fitting period for preparation and self-reckoning.',
      },
      article: {
        tr: `Cemaziyelahir, hicri takvimin altıncı ayıdır. Adı, kendisinden önce gelen Cemaziyelevvel ile birlikte "donma, katılaşma" anlamındaki *cemed* kökünden gelir ve bu adların konulduğu dönemde ayın kışa denk gelmesine işaret eder. Hicri takvim ay yılına dayandığından bu isimler bugün mevsimsel bir anlam taşımaz.

Bu ayın kendisine mahsus, sahih rivayete dayanan özel bir namazı, orucu ya da gecesi bulunmamaktadır. Ayı değerli kılan, konumudur: Cemaziyelahir'in ardından Recep girer ve Üç Aylar başlar. Bu yönüyle bu ay, uzun bir ibadet mevsimine hazırlanılan son duraktır.

Hazırlık, çoğu zaman coşkulu bir başlangıçtan daha belirleyicidir. Varsa kaza namazlarının ve kaza oruçlarının planlanması, düzenli bir Kur'an okuma programının kurulması, sadaka için sabit bir miktar belirlenmesi ve kul hakkıyla ilgili meselelerin çözülmesi bu ayda yapılabilecek işlerdir. Recep girdiğinde hazır bir düzenle karşılamak, o ayı boşa geçirmemenin en sağlam yoludur.

Bunun yanında her ay geçerli olan sünnetler sürdürülür: hilâli görünce dua etmek, eyyâm-ı biyd orucu, pazartesi ve perşembe oruçları, günlük zikir ve tilavet.`,
        en: `Jumada al-Akhira is the sixth month of the Hijri calendar. Its name, like that of the preceding month, comes from the root *jamad*, "to freeze" or "to harden," reflecting the season in which it fell when these names were fixed. Since the Hijri calendar follows the lunar year, the names carry no seasonal meaning today.

This month has no prayer, fast, or night specific to it established by sound narration. What gives it significance is its position: after Jumada al-Akhira comes Rajab, and with it the Three Holy Months. In that sense this is the final stop before a long devotional season.

Preparation is often more decisive than an enthusiastic start. Planning any missed prayers and fasts, setting up a regular Qur'an reading schedule, fixing an amount for charity, and settling matters involving the rights of others are all work that can be done in this month. Entering Rajab with a routine already in place is the surest way not to let it slip by.

Alongside this, the sunnas that hold for every month continue: supplicating upon sighting the new moon, the "white days" fast, fasting on Mondays and Thursdays, and daily remembrance and recitation.`,
      },
      practices: [
        {
          title: { tr: 'Kaza namaz ve oruçlarını planlamak', en: 'Planning missed prayers and fasts' },
          description: {
            tr: 'Üç Aylar girmeden önce varsa kaza borçlarını hesaplayıp günlük küçük bir hedefe bağlamak, Recep ve Şaban\'ı çok daha verimli kılar.',
            en: 'Working out any outstanding obligatory prayers and fasts before the Three Holy Months begin, and tying them to a small daily target, makes Rajab and Sha\'ban far more productive.',
          },
        },
        {
          title: { tr: 'Hilâl duası', en: 'Supplication on sighting the new moon' },
          description: {
            tr: "Tirmizî'nin naklettiğine göre Peygamber Efendimiz yeni ayı görünce şöyle dua ederdi: \"Allâhümme ehillehû aleynâ bi'l-emni ve'l-îmân, ve's-selâmeti ve'l-İslâm\" — \"Allahım! Bu ayı bize emniyet, iman, selâmet ve İslâm ile getir.\"",
            en: 'Tirmidhi narrates that upon seeing the new moon the Prophet would supplicate: "O God, bring it over us with security and faith, with safety and submission."',
          },
        },
        {
          title: { tr: 'Eyyâm-ı biyd orucu', en: 'Fasting the white days' },
          description: {
            tr: "Her aydan üç gün oruç tutmak Buhârî ve Müslim'de tavsiye edilir; bu günlerin ayın 13, 14 ve 15'i olduğu Nesâî ve Tirmizî rivayetlerinde geçer. Cemaziyelahir 1448'de bu günler 22–24 Kasım 2026'ya denk gelir.",
            en: 'Fasting three days of each month is recommended in Bukhari and Muslim; narrations in Nasa\'i and Tirmidhi identify them as the 13th, 14th, and 15th. In Jumada al-Akhira 1448 these fall on 22–24 November 2026.',
          },
        },
        {
          title: { tr: 'Sadaka ve kul hakkı', en: 'Charity and the rights of others' },
          description: {
            tr: 'Düzenli, küçük ama sürekli bir sadaka belirlemek ve varsa borç, dargınlık gibi meseleleri çözmek — ibadet mevsimine temiz bir sayfayla girmenin yoludur.',
            en: 'Setting a small but steady act of charity, and settling debts or estrangements, is how one enters a devotional season with a clean slate.',
          },
        },
      ],
      eventKey: 'hicri-ay-baslangici-cemaziyelahir-1448',
      priority: 130,
      dhikrKeys: [
        keyMap.HILAL_DUASI,
        keyMap.ISTIGFAR,
        keyMap.SEYYIDUL_ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.ESTAGFIRULLAH,
      ],
    },
  ],
};
