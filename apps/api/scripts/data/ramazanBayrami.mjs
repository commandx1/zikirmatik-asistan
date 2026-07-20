import { keyMap } from './keyMap.mjs';

export const ramazanBayrami = {
  key: 'ramazan-bayrami-2026',
  label: {
    tr: 'Ramazan Bayramı 2026',
    en: 'Eid al-Fitr 2026',
  },
  category: 'ibadet',
  description: {
    tr: "Ramazan Bayramı 3 günü: tekbir, şükür, salavat ve istiğfarla ihya. Bayramı takiben Şevval'den 6 gün oruç tutmak sanki yıl boyunca oruç tutmuş gibi sevap kazandırır (Sahih Müslim). Bayram namazlarından sonra tekbir getirmek sünnettir.",
    en: "The three days of Eid al-Fitr: revived with takbir, gratitude, salawat and istighfar. Fasting six days of Shawwal after the Eid earns reward as if one had fasted the whole year (Sahih Muslim). Reciting takbir after the Eid prayers is sunnah.",
  },
  dhikrItems: [],
  specialDays: [
    {
      name: {
        tr: 'Ramazan Bayramı 1. Gün',
        en: 'Eid al-Fitr Day 1',
      },
      type: 'bayram',
      date: '2026-03-20',
      hijriDate: '1 Şevval 1447',
      description: {
        tr: "Ramazan orucunun tamamlanmasıyla gelen bayramın ilk günü. Namaz sonrası tekbir getirmek sünnettir. Bayram günlerinde (1-3 Şevval) oruç tutmak haramdır; Şevval'in 6 gün orucu bayram bittikten sonra başlanabilir ve yıl boyunca oruç tutmuş gibi sevap kazandırır (Sahih Müslim, hadis no: 1164).",
        en: "The first day of the Eid that comes with the completion of the Ramadan fast. Reciting takbir after the prayer is sunnah. Fasting on the days of Eid (1-3 Shawwal) is forbidden; the six-day fast of Shawwal can begin after the Eid ends and earns reward as if one had fasted the whole year (Sahih Muslim, hadith no: 1164).",
      },
      eventKey: 'ramazan-bayrami-2026',
      dayIndex: 1,
      dayCount: 3,
      priority: 190,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.SALAVAT_SERIF,
        keyMap.SUBHANALLAHI_VE_BIHAMDIHI,
        keyMap.ESTAGFIRULLAH,
        keyMap.IHLAS,
      ],
    },
    {
      name: {
        tr: 'Ramazan Bayramı 2. Gün',
        en: 'Eid al-Fitr Day 2',
      },
      type: 'bayram',
      date: '2026-03-21',
      hijriDate: '2 Şevval 1447',
      description: {
        tr: "Bayramın ikinci günü: tesbih, salavat ve şükür ibadetleriyle geçirilir. Şevval 6 gün orucu sürüyor ise devam etmek müstehaptır. Bayram namazlarında tekbir sünnet; Şafiî ve Hanbelî mezhebine göre altı gün oruç müstehaptır.",
        en: "The second day of the Eid: spent with the worship of tasbih, salawat and gratitude. If the six-day Shawwal fast is ongoing, it is recommended (mustahabb) to continue. Takbir at the Eid prayers is sunnah; according to the Shafi'i and Hanbali schools, the six-day fast is recommended (mustahabb).",
      },
      eventKey: 'ramazan-bayrami-2026',
      dayIndex: 2,
      dayCount: 3,
      priority: 185,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.SALAVAT_SERIF,
        keyMap.SUBHANALLAHI_VE_BIHAMDIHI,
        keyMap.ISTIGFAR,
        keyMap.IHLAS,
      ],
    },
    {
      name: {
        tr: 'Ramazan Bayramı 3. Gün',
        en: 'Eid al-Fitr Day 3',
      },
      type: 'bayram',
      date: '2026-03-22',
      hijriDate: '3 Şevval 1447',
      description: {
        tr: "Bayramın son günü. Bayram bittikten sonra Şevval'den 6 gün oruç tutmaya niyetlenmek için son fırsat; bu oruç bayram günleri hariç Şevval içinde herhangi 6 günde tutulabilir. Tevhid ve istiğfarla günü tamamla.",
        en: "The last day of the Eid. After the Eid ends, this is the last opportunity to intend to fast six days of Shawwal; this fast can be kept on any six days within Shawwal except the Eid days. Complete the day with tawhid and istighfar.",
      },
      eventKey: 'ramazan-bayrami-2026',
      dayIndex: 3,
      dayCount: 3,
      priority: 183,
      dhikrKeys: [
        keyMap.TESRIK_TEKBIRI,
        keyMap.SALAVAT_SERIF,
        keyMap.IHLAS,
        keyMap.TEVHID,
        keyMap.ESTAGFIRULLAH,
      ],
    },
  ],
};
