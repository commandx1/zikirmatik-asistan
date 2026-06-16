import { keyMap } from './keyMap.mjs';

export const ramazanBayrami = {
  key: 'ramazan-bayrami-2026',
  label: 'Ramazan Bayramı 2026',
  category: 'ibadet',
  description:
    "Ramazan Bayramı 3 günü: tekbir, şükür, salavat ve istiğfarla ihya. Bayramı takiben Şevval'den 6 gün oruç tutmak sanki yıl boyunca oruç tutmuş gibi sevap kazandırır (Sahih Müslim). Bayram namazlarından sonra tekbir getirmek sünnettir.",
  dhikrItems: [],
  specialDays: [
    {
      name: 'Ramazan Bayramı 1. Gün',
      type: 'bayram',
      date: '2026-03-20',
      hijriDate: '1 Şevval 1447',
      description:
        "Ramazan orucunun tamamlanmasıyla gelen bayramın ilk günü. Namaz sonrası tekbir getirmek sünnettir. Bayram günlerinde (1-3 Şevval) oruç tutmak haramdır; Şevval'in 6 gün orucu bayram bittikten sonra başlanabilir ve yıl boyunca oruç tutmuş gibi sevap kazandırır (Sahih Müslim, hadis no: 1164).",
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
      name: 'Ramazan Bayramı 2. Gün',
      type: 'bayram',
      date: '2026-03-21',
      hijriDate: '2 Şevval 1447',
      description:
        "Bayramın ikinci günü: tesbih, salavat ve şükür ibadetleriyle geçirilir. Şevval 6 gün orucu sürüyor ise devam etmek müstehaptır. Bayram namazlarında tekbir sünnet; Şafiî ve Hanbelî mezhebine göre altı gün oruç müstehaptır.",
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
      name: 'Ramazan Bayramı 3. Gün',
      type: 'bayram',
      date: '2026-03-22',
      hijriDate: '3 Şevval 1447',
      description:
        "Bayramın son günü. Bayram bittikten sonra Şevval'den 6 gün oruç tutmaya niyetlenmek için son fırsat; bu oruç bayram günleri hariç Şevval içinde herhangi 6 günde tutulabilir. Tevhid ve istiğfarla günü tamamla.",
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
