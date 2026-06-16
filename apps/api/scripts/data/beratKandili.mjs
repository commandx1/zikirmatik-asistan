import { keyMap } from './keyMap.mjs';

export const beratKandili = {
  key: 'berat-kandili-2026',
  label: 'Berat Kandili 2026',
  category: 'ibadet',
  description:
    "15 Şaban 1447 gecesi (2 Şubat 2026): takdir-i ilahinin tecelli ettiği, amellerin, rızıkların ve ecellerin yıllık olarak karara bağlandığı mübarek gece.",
  dhikrItems: [
    {
      key: keyMap.BERAT_DUASI,
      nameArabic:
        'اللَّهُمَّ ارْزُقْنَا قَلْباً تَقِيّاً مِنَ الشِّرْكِ بَرِيئاً لَا كَافِراً وَلَا شَقِيّاً',
      nameTurkish: 'Berat Gecesi Kalp Duası',
      transliteration:
        "Allâhümmerzuknâ kalben takiyyen mineşşirki beriyyen lâ kâfiren ve la şakiyyâ",
      meaning:
        "Allah'ım! Bize şirkten uzak, tertemiz, takva sahibi bir kalp rızıklandır. İnkârcı ve isyankâr olmayan bir gönül ihsan eyle.",
      virtue:
        "Hazreti Peygamber'in (s.a.v.) Berat Gecesi'nde en çok okuduğu ve ümmetine tavsiye ettiği kalbi koruma altına alan hususi duadır.",
      source: 'Hadis-i Şerif, Süheyl b. Amr rivayeti; Berat Kandili Duaları',
      tags: ['berat', 'kandil', 'kalp', 'dua', 'şaban'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 100,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.BERAT_SECDE_DUASI,
      nameArabic:
        'أَعُوذُ بِعَفْوِكَ مِنْ عِقَابِكَ وَأَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ وَأَعُوذُ بِكَ مِنْكَ جَلَّ وَجْهُكَ لَا أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ',
      nameTurkish: 'Berat Gecesi Secde Duası',
      transliteration:
        "Eûzu bi-afvike min ikâbike ve eûzu bi-ridâke min sahatike ve eûzu bike minke celle vechuke lâ-uhsî senâen aleyke ente kemâ esneyte alâ nefsike",
      meaning:
        "Ya Rabbi, cezandan affına sığınırım, gazabından rızana sığınırım. Senden yine Sana sığınırım. Şanın yücedir; Seni layıkıyla övemem. Sen kendini övdüğün gibisin.",
      virtue:
        "Berat Gecesi secdede en az 3 veya 7 defa okunması sünnet olan sığınma duasıdır. Secde halinde duanın kabulünün yakın olduğu bildirilmiştir.",
      source: 'Müslim, Dua, 72; et-Tergib ve\'t-Terhib, 2/119',
      tags: ['berat', 'kandil', 'secde', 'dua', 'sığınma'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 7,
      suitableFor: ['herkes'],
    },
    {
      key: keyMap.RABBENA_LA_TUZIG,
      nameArabic:
        'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
      nameTurkish: 'Rabbena Lâ Tüziğ — Berat Gecesi Hidayet Duası',
      transliteration:
        "Rabbena la tüziğ kulubena ba'de iz hedeytena veheb lena mil ledünke rahmeh inneke entel vehhab",
      meaning:
        "Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi kaydırma, katından bize bir rahmet bağışla. Şüphesiz lütfu en bol olan Sensin.",
      virtue:
        "Berat Gecesi hidayetin korunması ve son nefeste kâmil imanla ölmek niyetiyle 300 kere okunması faziletli görülmüştür.",
      source: "Kur'an-ı Kerim, Âl-i İmrân 3:8; Veliyüddîn er-Rahâvî el-Mahmûdî, Fezâilü'l-eyyâm",
      tags: ['berat', 'kandil', 'hidayet', 'dua', 'kuran'],
      categories: ['dua', 'ibadet'],
      timeOfDay: ['gece', 'yatsi'],
      recommendedCount: 300,
      suitableFor: ['herkes'],
    },
  ],
  specialDays: [
    {
      name: 'Berat Kandili',
      type: 'kandil',
      date: '2026-02-02',
      hijriDate: '15 Şaban 1447',
      description:
        "Şaban'ın 15. gecesi: Allah'ın kimi bağışlayacağını, kimin rızkını, ömrünü ve kaderini belirleyeceğini açıkladığı mübarek gece. Üç Yasin, secde duası, istiğfar ve Salât-ı Münciye ile ihya edilir.",
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
