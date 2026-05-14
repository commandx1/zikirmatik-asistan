import type { ThemeName } from "@zikirmatik/shared";

export type ProfileQuickStat = {
  id: string;
  value: string;
  label: string;
};

export type ThemeLabelMap = Record<ThemeName, string>;
