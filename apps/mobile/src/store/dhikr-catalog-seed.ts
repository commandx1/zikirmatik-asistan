import type { ZikirItem } from "../features/focus/types";

export const ZIKIR_ITEMS: ZikirItem[] = [
  {
    id: 'estagfirullah',
    source: 'ready',
    name: { tr: 'Estağfirullah', en: 'Astaghfirullah' },
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: { tr: 'Estağfirullah', en: 'Astaghfirullah' },
    meaning: { tr: "Allah'tan bağışlanma dilerim", en: 'I seek forgiveness from Allah.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'subhanallah',
    source: 'ready',
    name: { tr: 'Sübhanallah', en: 'Subhanallah' },
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: { tr: 'Sübhanallah', en: 'Subhanallah' },
    meaning: { tr: 'Allah noksan sıfatlardan münezzehtir', en: 'Glory be to Allah; He is free from every imperfection.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'elhamdulillah',
    source: 'ready',
    name: { tr: 'Elhamdülillah', en: 'Alhamdulillah' },
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: { tr: 'Elhamdülillah', en: 'Alhamdulillah' },
    meaning: {
      tr: "Her türlü hamd ve övgü Allah'a mahsustur",
      en: 'All praise is due to Allah alone.'
    },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'allahu-ekber',
    source: 'ready',
    name: { tr: 'Allahu Ekber', en: 'Allahu Akbar' },
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: { tr: 'Allahu Ekber', en: 'Allahu Akbar' },
    meaning: { tr: 'Allah en büyüktür', en: 'Allah is the Greatest.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'la-ilahe-illallah',
    source: 'ready',
    name: { tr: 'La ilahe illallah', en: 'La ilaha illallah' },
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: { tr: 'La ilahe illallah', en: 'La ilaha illallah' },
    meaning: { tr: "Allah'tan başka ilah yoktur", en: 'There is no god but Allah.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'la-havle',
    source: 'ready',
    name: { tr: 'La havle vela kuvvete illa billah', en: 'La hawla wa la quwwata illa billah' },
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: { tr: 'La havle vela kuvvete illa billah', en: 'La hawla wa la quwwata illa billah' },
    meaning: { tr: "Güç ve kuvvet ancak Allah'tandır", en: 'There is no power nor strength except with Allah.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'bismillah',
    source: 'ready',
    name: { tr: 'Bismillahirrahmanirrahim', en: 'Bismillahir Rahmanir Rahim' },
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: { tr: 'Bismillahirrahmanirrahim', en: 'Bismillahir Rahmanir Rahim' },
    meaning: { tr: "Rahman ve Rahim olan Allah'ın adıyla", en: 'In the name of Allah, the Most Compassionate, the Most Merciful.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  },
  {
    id: 'subhanallahi-ve-bihamdihi',
    source: 'ready',
    name: { tr: 'Sübhanallahi ve bihamdihi', en: 'Subhanallahi wa bihamdihi' },
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: { tr: 'Sübhanallahi ve bihamdihi', en: 'Subhanallahi wa bihamdihi' },
    meaning: { tr: "Allah'ı hamd ile tesbih ederim", en: 'Glory be to Allah and praise be to Him.' },
    current: 0,
    target: 100,
    lastActivityLabel: '',
    streakDays: 0,
    isFavorite: false
  }
]
