import { AI_RECOMMENDATION_MOCKS, DHIKR_MOCKS, SPECIAL_DAY_MOCKS } from "@zikirmatik/shared";

export const HOME_VM = {
  primaryDhikr: DHIKR_MOCKS[0],
  quickActions: ["Sabah", "Akşam", "Stres", "Şükür"]
};

export const AI_GUIDE_VM = {
  moods: ["Stresli", "Huzurlu", "Yorgun", "Mutlu", "Kararsız"],
  recommendation: AI_RECOMMENDATION_MOCKS[0]
};

export const SPECIAL_DAYS_VM = {
  featured: SPECIAL_DAY_MOCKS[0],
  upcoming: [
    "Regaib Kandili",
    "Miraç Kandili",
    "Berat Kandili",
    "Kadir Gecesi"
  ]
};

export const STATS_VM = {
  streakDays: 12,
  weeklyTotal: 387,
  completionRate: 83
};
