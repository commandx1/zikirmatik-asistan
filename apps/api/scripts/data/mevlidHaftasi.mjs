import { keyMap } from './keyMap.mjs';

export const mevlidHaftasi = {
  key: 'mevlid-haftasi-2026',
  label: {
    tr: 'Mevlid Haftası 2026',
    en: 'Mawlid Week 2026',
  },
  category: 'ibadet',
  description: {
    tr: "12 Rebiülevvel 1448 (24 Ağustos 2026) Mevlid Kandili etrafındaki mübarek hafta. Peygamber Efendimiz'in doğumunu salavat, muhabbet ve şükürle anma günleri.",
    en: "The blessed week surrounding Mawlid al-Nabi on 12 Rabi al-Awwal 1448 (24 August 2026). Days of commemorating the birth of our Prophet with salawat, love, and gratitude.",
  },
  dhikrItems: [],
  specialDays: [
    {
      name: {
        tr: 'Mevlid Haftası — 1. Gün',
        en: 'Mawlid Week — Day 1',
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 7 },
      description: {
        tr: "Mevlid Kandili'ne 4 gün kala: Peygamber sevgisini salavat ve muhabbet zikirleriyle besle.",
        en: "Four days before Mawlid al-Nabi: nourish your love for the Prophet with salawat and dhikrs of devotion.",
      },
      eventFamily: 'mevlid-haftasi',
      dayIndex: 1,
      dayCount: 7,
      priority: 130,
      dhikrKeys: [
        keyMap.SALAVAT_SERIF,
        keyMap.SELLIM_BARIK,
        keyMap.AHZAB_56,
        keyMap.KEMALILLAHI,
        keyMap.MEVLID_HAMD,
      ],
    },
    {
      name: {
        tr: 'Mevlid Haftası — 2. Gün',
        en: 'Mawlid Week — Day 2',
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 8 },
      description: {
        tr: "Mevlid Kandili'ne 3 gün kala: Salavat ve sığınma zikirlerini artırma günü.",
        en: "Three days before Mawlid al-Nabi: a day to increase salawat and dhikrs of seeking refuge.",
      },
      eventFamily: 'mevlid-haftasi',
      dayIndex: 2,
      dayCount: 7,
      priority: 130,
      dhikrKeys: [
        keyMap.SALAVAT_SERIF,
        keyMap.MUNCIYE,
        keyMap.SELLIM_BARIK,
        keyMap.TEFRICIYE_SALAVATI,
        keyMap.MEVLID_RAHMET,
      ],
    },
    {
      name: {
        tr: 'Mevlid Haftası — 3. Gün',
        en: 'Mawlid Week — Day 3',
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 9 },
      description: {
        tr: "Mevlid Kandili'ne 2 gün kala: Salavat-ı Fatih ve muhabbet zikirleriyle hazırlık.",
        en: "Two days before Mawlid al-Nabi: preparation with Salat al-Fatih and dhikrs of devotion.",
      },
      eventFamily: 'mevlid-haftasi',
      dayIndex: 3,
      dayCount: 7,
      priority: 130,
      dhikrKeys: [
        keyMap.SALAVAT_SERIF,
        keyMap.SALAVAT_FATIH,
        keyMap.DELAIL_HAYRAT,
        keyMap.MEVLID_HAMD,
        keyMap.MEVLID_RAHMET,
      ],
    },
    {
      name: {
        tr: 'Mevlid Haftası — 4. Gün',
        en: 'Mawlid Week — Day 4',
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 10 },
      description: {
        tr: "Mevlid Kandili öncesi son hazırlık günü: istiğfar ve salavat ile gönlü temizle.",
        en: "The final day of preparation before Mawlid al-Nabi: purify your heart with istighfar and salawat.",
      },
      eventFamily: 'mevlid-haftasi',
      dayIndex: 4,
      dayCount: 7,
      priority: 132,
      dhikrKeys: [
        keyMap.SALAVAT_SERIF,
        keyMap.ISTIGFAR,
        keyMap.NUR_ZATIYYE,
        keyMap.SELLIM_BARIK,
        keyMap.KEMALILLAHI,
      ],
    },
    {
      name: {
        tr: 'Mevlid Haftası — 6. Gün',
        en: 'Mawlid Week — Day 6',
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 13, night: true },
      description: {
        tr: "Mevlid Kandili'nin ertesi: Kandil sevincini salavat ve hamdla sürdür.",
        en: "The day after Mawlid al-Nabi: carry on the joy of the Holy Night with salawat and praise.",
      },
      eventFamily: 'mevlid-haftasi',
      dayIndex: 6,
      dayCount: 7,
      priority: 128,
      dhikrKeys: [
        keyMap.SALAVAT_SERIF,
        keyMap.HZ_FATIMA_SALAVATI,
        keyMap.MEVLID_HAMD,
        keyMap.MEVLID_RAHMET,
        keyMap.AHZAB_56,
      ],
    },
    {
      name: {
        tr: 'Mevlid Haftası — 7. Gün',
        en: 'Mawlid Week — Day 7',
      },
      type: 'özel gün',
      hijri: { month: 'rebiulevvel', day: 14, night: true },
      description: {
        tr: "Mevlid haftasının son günü: Peygamber muhabbetini salavat ve duayla mühürle.",
        en: "The last day of Mawlid Week: seal your love for the Prophet with salawat and supplication.",
      },
      eventFamily: 'mevlid-haftasi',
      dayIndex: 7,
      dayCount: 7,
      priority: 126,
      dhikrKeys: [
        keyMap.SALAVAT_SERIF,
        keyMap.TEFRICIYE_SALAVATI,
        keyMap.MEVLID_RAHMET,
        keyMap.SELLIM_BARIK,
        keyMap.MEVLID_HAMD,
      ],
    },
  ],
};
