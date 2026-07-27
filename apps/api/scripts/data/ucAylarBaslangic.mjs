import { keyMap } from './keyMap.mjs';

export const ucAylarBaslangic = {
  key: 'uc-aylar-baslangic-2025',
  label: {
    tr: 'Üç Aylar Başlangıcı 2025',
    en: 'Beginning of the Three Holy Months 2025',
  },
  category: 'ibadet',
  description: {
    tr: "Recep, Şaban ve Ramazan'dan oluşan Üç Aylar'ın başlangıcı: 1 Recep 1447, 21 Aralık 2025.",
    en: "The beginning of the Three Holy Months—comprising Rajab, Sha'ban, and Ramadan: 1 Rajab 1447, 21 December 2025.",
  },
  dhikrItems: [],
  specialDays: [
    {
      name: {
        tr: 'Üç Ayların Başlangıcı (1 Recep)',
        en: 'The Beginning of the Three Holy Months (1 Rajab)',
      },
      type: 'özel gün',
      date: '2025-12-21',
      hijriDate: '1 Recep 1447',
      description: {
        tr: "Allah'ın ayı Recep'in ilk günü ve Üç Aylar'ın kapısı. Peygamber Efendimiz bu günde Recep-Şaban-Ramazan duasını okur, mübarek aylara bereketli bir başlangıç niyetiyle girerdi.",
        en: "The first day of Rajab, the month of Allah, and the gateway to the Three Holy Months. On this day the Prophet (peace be upon him) would recite the supplication of Rajab, Sha'ban, and Ramadan, entering these blessed months with the intention of a bountiful beginning.",
      },
      eventKey: 'uc-aylar-baslangic-2025',
      priority: 155,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
        keyMap.ESTAGFIRULLAH,
      ],
    },
    {
      name: {
        tr: 'Üç Ayların Başlangıcı (1 Recep)',
        en: 'The Beginning of the Three Holy Months (1 Rajab)',
      },
      type: 'özel gün',
      // Diyanet 2026 Dini Günler Listesi: 1 Receb 1448 → 10 Aralık 2026 Perşembe.
      date: '2026-12-10',
      hijriDate: '1 Recep 1448',
      description: {
        tr: "Haram aylardan Recep'in ilk günü ve Recep–Şaban–Ramazan'dan oluşan Üç Aylar'ın kapısı. Kaza, oruç ve zikir düzenini kurmak için uygun bir başlangıç.",
        en: 'The first day of Rajab, one of the sacred months, and the gateway to the Three Holy Months of Rajab, Shaban, and Ramadan — a fitting point to establish a routine of make-up prayers, fasting, and remembrance.',
      },
      article: {
        tr: `Recep ayının ilk günüyle birlikte, halk arasında "Üç Aylar" diye anılan Recep–Şaban–Ramazan dönemi başlar. Bu üçlü tabir bir âyet veya hadis tabiri değil, İslam toplumlarında yerleşmiş bir adlandırmadır; Ramazan'a doğru uzanan bir hazırlık mevsimini ifade eder.

Recep'in Kur'an'daki dayanağı, haram aylar üzerinedir. Tevbe sûresi 36. âyette ayların sayısının on iki, bunlardan dördünün haram (saygın) ay olduğu bildirilir; Peygamber Efendimiz bu dört ayı zilkade, zilhicce, muharrem ve recep olarak saymıştır (Buhârî, Meğâzî 77; Müslim, Kasâme 29). Diğer üçü ardışık olduğu hâlde Recep tek başına geldiği için "ferd" diye anılır. Bu aylarda saygıyı korumak, günahtan daha çok sakınmak ve iyiliği çoğaltmak esastır.

Burada dürüst bir uyarı gereklidir: Recep ayına özel fazilet bildiren rivayetlerin büyük bölümü, hadis âlimlerince uydurma ya da zayıf olarak değerlendirilmiştir. "Recep Allah'ın ayı, Şaban benim ayım, Ramazan ümmetimin ayıdır" gibi meşhur sözlerin sağlam bir dayanağı bulunmamıştır. Bu ayda okunması yaygınlaşan "Allâhümme bârik lenâ fî Recebe ve Şa'bân ve belliğnâ Ramazân" duası ise Müsned ve Ebû Nuaym'ın Hilye'sinde geçer ve zayıf hadisler arasında sayılır; buna rağmen bu aya dair nakiller içinde en çok itimat edilenlerden biri kabul edilir. Dolayısıyla bu duayı okumak güzeldir, fakat ona sahih bir hadise dayanan kesin bir vaat yüklenmemelidir.

Recep orucu konusunda âlimler ihtilaf etmiştir. Haram aylarda oruca teşvik eden rivayetler bulunduğu için bir kısmı müstehap görmüş; bir kısmı ise bu aya Ramazan'ı gölgeleyecek bir kutsallık yüklenmesi ve halkın onu farz sanması endişesiyle çekimser kalmıştır. Üçüncü bir görüş ise ayın tamamını oruçlu geçirmeyi hoş görmemiş, aralıklı tutmayı tavsiye etmiştir. Bu sebeple Recep'te oruç tutulacaksa, ayın tamamını değil, pazartesi–perşembe ve eyyâm-ı biyd gibi zaten sünnet olan günleri tercih etmek en selametli yoldur.

Özetle bu günün asıl değeri, üç aylık bir dönemi bilinçli bir niyetle karşılamaktır: kaza borçlarını planlamak, düzenli bir Kur'an programı kurmak, sadakayı sürekli hâle getirmek ve Ramazan'a hazır girmek.`,
        en: `With the first day of Rajab begins the period popularly known as the "Three Holy Months" — Rajab, Shaban, and Ramadan. This expression is not a Qur'anic or prophetic term but a name established in Muslim societies; it denotes a season of preparation leading toward Ramadan.

Rajab's basis in the Qur'an lies in the sacred months. Al-Tawba 9:36 states that the months are twelve, four of which are sacred; the Prophet enumerated these four as Dhu al-Qada, Dhu al-Hijja, Muharram, and Rajab (Bukhari, Maghazi 77; Muslim, Qasama 29). Since the other three run consecutively while Rajab stands alone, it is called "the solitary one." What matters in these months is to preserve their sanctity, to be more careful about sin, and to increase in good.

An honest caution is needed here: most narrations reporting virtues specific to Rajab have been judged fabricated or weak by hadith scholars. Well-known sayings such as "Rajab is God's month, Shaban is my month, Ramadan is my community's month" have no sound basis. The supplication widely recited in this month — "O God, bless Rajab and Shaban for us, and bring us to Ramadan" — appears in the Musnad and in Abu Nuaym's Hilya and is counted among the weak hadiths, though it is regarded as among the more reliable of the narrations about this month. Reciting it is therefore good, but no firm promise resting on an authentic hadith should be attached to it.

Scholars have differed over fasting in Rajab. Because narrations encourage fasting in the sacred months, some considered it recommended; others were reserved, fearing that a sanctity eclipsing Ramadan would be attached to the month and that people would take it to be obligatory. A third view disapproved of fasting the whole month and advised fasting with breaks. If one fasts in Rajab, then, the safest course is to choose days that are already sunna — Mondays and Thursdays and the "white days" — rather than the entire month.

In sum, the real value of this day lies in meeting a three-month season with a deliberate intention: planning any make-up obligations, setting up a regular Qur'an schedule, making charity continuous, and entering Ramadan prepared.`,
      },
      practices: [
        {
          title: { tr: 'Recep–Şaban–Ramazan duası', en: 'The supplication of Rajab, Shaban, and Ramadan' },
          description: {
            tr: '"Allâhümme bârik lenâ fî Recebe ve Şa\'bân ve belliğnâ Ramazân" — "Allahım! Recep ve Şaban\'ı bize mübarek kıl ve bizi Ramazan\'a ulaştır." Müsned ve Ebû Nuaym\'ın Hilye\'sinde geçen bu rivayet zayıf sayılmıştır; nafile ve dua olarak okunması güzel görülmüş, fakat kesin bir fazilet vaadi olarak nakledilmemiştir.',
            en: '"O God, bless Rajab and Shaban for us, and bring us to Ramadan." Recorded in the Musnad and Abu Nuaym\'s Hilya, this narration is considered weak; reciting it as a supplication has been seen as good, though it is not transmitted as a definite promise of reward.',
          },
        },
        {
          title: { tr: 'Kaza namaz ve oruçlarını planlamak', en: 'Planning missed prayers and fasts' },
          description: {
            tr: 'Üç Aylar\'ın en somut kazancı, Ramazan\'a borçsuz girmektir. Varsa kaza namaz ve oruçlarını hesaplayıp günlük küçük bir hedefe bağlayın.',
            en: 'The most concrete gain of these months is entering Ramadan free of arrears. Work out any missed prayers and fasts and tie them to a small daily target.',
          },
        },
        {
          title: { tr: 'Sünnet olan günlerde oruç', en: 'Fasting on the days that are sunna' },
          description: {
            tr: 'Ayın tamamını oruçlu geçirmek yerine pazartesi–perşembe günleri ile ayın 13, 14 ve 15. günlerini (eyyâm-ı biyd) tercih etmek, âlimlerin ihtilafı karşısında en selametli yoldur.',
            en: 'Rather than fasting the whole month, choosing Mondays and Thursdays and the 13th, 14th, and 15th (the "white days") is the safest course given the scholarly disagreement.',
          },
        },
        {
          title: { tr: 'İstiğfar ve tevbe', en: 'Seeking forgiveness and repentance' },
          description: {
            tr: 'Haram aylarda günahtan sakınmaya daha çok özen gösterilir. Günlük belirli bir istiğfar sayısı belirlemek ve Seyyidü\'l-İstiğfar\'ı öğrenmek bu dönemi tutarlı kılar.',
            en: 'In the sacred months greater care is taken to avoid sin. Setting a daily count of istighfar and learning Sayyid al-Istighfar gives this period consistency.',
          },
        },
        {
          title: { tr: 'Düzenli Kur\'an programı', en: 'A regular Qur\'an schedule' },
          description: {
            tr: 'Günde bir sayfa dahi olsa sabit bir tilavet programı kurmak; Ramazan\'a alışkanlık kazanmış olarak girmenin en pratik yoludur.',
            en: 'Establishing a fixed recitation schedule — even a page a day — is the most practical way to enter Ramadan with the habit already formed.',
          },
        },
      ],
      eventKey: 'uc-aylar-baslangic-2026',
      priority: 155,
      dhikrKeys: [
        keyMap.RECEP_DUASI,
        keyMap.ISTIGFAR,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
        keyMap.ESTAGFIRULLAH,
      ],
    },
  ],
};
