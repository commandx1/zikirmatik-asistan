import type { HeroCardViewModel, UpcomingDayViewModel } from "../types/view-model";

export const HERO_CARD: HeroCardViewModel = {
  id: "fallback-hero",
  badge: "Yaklaşıyor 🌙",
  title: "Mevlid Kandili",
  dateLabel: "13 Eylül 2025, Perşembe",
  countdown: [
    { value: "03", label: "GÜN" }
  ],
  remaining: "3 gün",
  isTodaySpecial: false,
};

export const UPCOMING_DAYS: UpcomingDayViewModel[] = [
  {
    id: "fallback-mevlid",
    icon: "moon",
    title: "Mevlid Kandili",
    dateLabel: "13 Eylül",
    remaining: "3 gün",
  },
  {
    id: "fallback-ramazan",
    icon: "star",
    title: "Ramazan Başlangıcı",
    dateLabel: "11 Mart",
    remaining: "18 gün",
  },
  {
    id: "fallback-kadir",
    icon: "moon",
    title: "Kadir Gecesi",
    dateLabel: "5 Nisan",
    remaining: "43 gün",
  },
  {
    id: "fallback-kurban",
    icon: "mosque",
    title: "Kurban Bayramı",
    dateLabel: "16 Haziran",
    remaining: "115 gün",
  }
];
