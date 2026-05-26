import type { ZikirItem } from "./types";

export const ZIKIR_STATS = {
  totalCount: "12",
  monthlyCount: "3.4K",
  streakDays: "12"
} as const;

export const ZIKIR_ITEMS: ZikirItem[] = [
  {
    id: "estagfirullah",
    source: "ready",
    nameTurkish: "Estağfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Estağfirullah",
    meaning: "Allah'tan bağışlanma dilerim",
    current: 34,
    target: 100,
    lastActivityLabel: "Bugün 08:24",
    streakDays: 5,
    isFavorite: true
  },
  {
    id: "subhanallah",
    source: "ready",
    nameTurkish: "Sübhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "Sübhanallah",
    meaning: "Allah noksan sıfatlardan münezzehtir",
    current: 100,
    target: 100,
    lastActivityLabel: "Dün 22:15",
    streakDays: 12,
    isFavorite: false
  },
  {
    id: "elhamdulillah",
    source: "ready",
    nameTurkish: "Elhamdülillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Elhamdülillah",
    meaning: "Her türlü hamd ve övgü Allah'a mahsustur",
    current: 67,
    target: 100,
    lastActivityLabel: "Bugün 14:32",
    streakDays: 8,
    isFavorite: true
  },
  {
    id: "allahu-ekber",
    source: "ready",
    nameTurkish: "Allahu Ekber",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Ekber",
    meaning: "Allah en büyüktür",
    current: 23,
    target: 100,
    lastActivityLabel: "Bugün 11:18",
    streakDays: 3,
    isFavorite: false
  },
  {
    id: "la-ilahe-illallah",
    source: "ready",
    nameTurkish: "La ilahe illallah",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    transliteration: "La ilahe illallah",
    meaning: "Allah'tan başka ilah yoktur",
    current: 100,
    target: 100,
    lastActivityLabel: "2 gün önce",
    streakDays: 15,
    isFavorite: false
  },
  {
    id: "la-havle",
    source: "ready",
    nameTurkish: "La havle vela kuvvete illa billah",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "La havle vela kuvvete illa billah",
    meaning: "Güç ve kuvvet ancak Allah'tandır",
    current: 45,
    target: 100,
    lastActivityLabel: "Bugün 16:42",
    streakDays: 6,
    isFavorite: false
  },
  {
    id: "bismillah",
    source: "ready",
    nameTurkish: "Bismillahirrahmanirrahim",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    transliteration: "Bismillahirrahmanirrahim",
    meaning: "Rahman ve Rahim olan Allah'ın adıyla",
    current: 12,
    target: 100,
    lastActivityLabel: "Bugün 09:05",
    streakDays: 2,
    isFavorite: true
  },
  {
    id: "subhanallahi-ve-bihamdihi",
    source: "ready",
    nameTurkish: "Sübhanallahi ve bihamdihi",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Sübhanallahi ve bihamdihi",
    meaning: "Allah'ı hamd ile tesbih ederim",
    current: 89,
    target: 100,
    lastActivityLabel: "Dün 20:34",
    streakDays: 7,
    isFavorite: false
  }
];
