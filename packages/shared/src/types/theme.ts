export type ThemeName =
  | "gece-koyu"
  | "gece-lacivert"
  | "cami-yesili"
  | "osmanli-bordo"
  | "col-kumulu"
  | "kum-tasi-minimal"
  | "zumrut-mermer"
  | "saf-gece-amoled"
  | "ay-isigi"
  | "klasik-bej"
  | "derin-mavi"
  | "gul-bahcesi"
  | "saf-siyah"
  | "acik-mod"
  //| "premium-doku";

export type FontSize = "small" | "medium" | "large";

export type AppMode = "classic" | "smart";

export type ThemeGradient = {
  colors: [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export type ThemeTokens = {
  bg: string;
  card: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  success: string;
  border: string;
  bgGradient?: ThemeGradient;
};

export type FontTokens = {
  scale: number;
  named: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
    "5xl": number;
    "6xl": number;
  };
  px: Record<string, number>;
  leading: Record<string, number>;
};
