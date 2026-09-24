// TODO(i18n): EN translations for ZIKIR_ITEMS are pending — `en` currently
// mirrors the `tr` value below until real translations are supplied.
import type { ZikirItem } from "../features/focus/types";

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
