export type ZikirFilterKey = "all" | "active" | "completed" | "favorites";
export type ZikirSource = "ready" | "personal";

export type ZikirItem = {
  id: string;
  source: ZikirSource;
  arabic?: string;
  transliteration: string;
  meaning?: string;
  current: number;
  target: number;
  lastActivityLabel: string;
  streakDays: number;
  isFavorite: boolean;
};
