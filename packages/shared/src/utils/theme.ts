import type { FontSize, FontTokens, ThemeName, ThemeTokens } from "../types/theme";

export const THEME_PRESETS: Record<ThemeName, ThemeTokens> = {
  "gece-koyu": {
    bg: "#0B1423",
    card: "#162236",
    textPrimary: "#F4F6FB",
    textMuted: "#98A8C2",
    accent: "#C8972A",
    success: "#3DB489",
    border: "#1E2F48"
  },
  "gece-lacivert": {
    bg: "#0A0F1F",
    card: "#111A33",
    textPrimary: "#EDF2FF",
    textMuted: "#9FB1D6",
    accent: "#6FA8FF",
    success: "#58C59B",
    border: "#1D2A4A"
  },
  "cami-yesili": {
    bg: "#0E1C17",
    card: "#193228",
    textPrimary: "#EEF6F2",
    textMuted: "#9AB8AE",
    accent: "#C8A03A",
    success: "#49BA8C",
    border: "#25483A"
  },
  "osmanli-bordo": {
    bg: "#2B0F16",
    card: "#4A1E2A",
    textPrimary: "#FCEFF3",
    textMuted: "#D5AFC0",
    accent: "#D4AF37",
    success: "#62C89D",
    border: "#6A2F40"
  },
  "col-kumulu": {
    bg: "#2A2015",
    card: "#3C2E1F",
    textPrimary: "#FAF1E5",
    textMuted: "#CBB79D",
    accent: "#E0B25A",
    success: "#67B58A",
    border: "#5A4531"
  },
  "kum-tasi-minimal": {
    bg: "#EFE3D0",
    card: "#DCC8A8",
    textPrimary: "#3A2D20",
    textMuted: "#856D54",
    accent: "#9A6B2F",
    success: "#2F8F67",
    border: "#CBB291"
  },
  "zumrut-mermer": {
    bg: "#0E1E1A",
    card: "#15332B",
    textPrimary: "#EDF8F3",
    textMuted: "#9ABCAE",
    accent: "#4FB08B",
    success: "#5AC99D",
    border: "#1F4A3D",
    bgGradient: {
      colors: ["#071510", "#0E1E1A", "#15332B"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }
    }
  },
  "saf-gece-amoled": {
    bg: "#000000",
    card: "#0F0F10",
    textPrimary: "#F7F7F7",
    textMuted: "#A0A0A0",
    accent: "#C8972A",
    success: "#4CB98E",
    border: "#212124"
  },
  "ay-isigi": {
    bg: "#F6F7FB",
    card: "#E9ECF5",
    textPrimary: "#1E2640",
    textMuted: "#5F6B8E",
    accent: "#4056A1",
    success: "#2EA77B",
    border: "#D2D9EA"
  },
  "klasik-bej": {
    bg: "#F5EFE5",
    card: "#FFFFFF",
    textPrimary: "#30261B",
    textMuted: "#7A6856",
    accent: "#B2872E",
    success: "#2E8B57",
    border: "#E8DDCD"
  },
  "derin-mavi": {
    bg: "#08172A",
    card: "#11253E",
    textPrimary: "#EFF5FF",
    textMuted: "#A3B4D4",
    accent: "#D3A64A",
    success: "#4DC293",
    border: "#1D3656"
  },
  "gul-bahcesi": {
    bg: "#24161D",
    card: "#3A2230",
    textPrimary: "#FCEEF6",
    textMuted: "#CBA4BA",
    accent: "#DAAE58",
    success: "#59C39A",
    border: "#563347"
  },
  "saf-siyah": {
    bg: "#050505",
    card: "#141414",
    textPrimary: "#F7F7F7",
    textMuted: "#A0A0A0",
    accent: "#D2A038",
    success: "#4CB98E",
    border: "#242424"
  },
  "acik-mod": {
    bg: "#F8FAFF",
    card: "#FFFFFF",
    textPrimary: "#172339",
    textMuted: "#5D6F8C",
    accent: "#B88724",
    success: "#2EA77B",
    border: "#DFE6F1"
  },
  /* "premium-doku": {
    bg: "#0C131A",
    card: "#16222C",
    textPrimary: "#F3F7FB",
    textMuted: "#AAB8C9",
    accent: "#D4AF37",
    success: "#4DBB90",
    border: "#243544",
    bgGradient: {
      colors: ["#0A1118", "#0C131A", "#111C26"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }
    }
  } */
};

export const DEFAULT_THEME: ThemeName = "gece-koyu";

export const FONT_SCALE: Record<FontSize, number> = {
  small: 0.92,
  medium: 1,
  large: 1.1
};

const NAMED_FONT_BASE: FontTokens["named"] = {
  xs: 10.5,
  sm: 12.25,
  base: 14,
  lg: 15.75,
  xl: 17.5,
  "2xl": 21,
  "3xl": 24.5,
  "4xl": 31.5,
  "5xl": 42,
  "6xl": 52.5
};

const PIXEL_FONT_BASE = [
  10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 25, 26, 28, 30, 32, 34, 42, 50, 52, 64
];

const LINE_HEIGHT_BASE = [20, 34, 48, 58];

export function resolveThemeName(themeName?: string): ThemeName {
  if (themeName && themeName in THEME_PRESETS) {
    return themeName as ThemeName;
  }
  return DEFAULT_THEME;
}

export function resolveThemeTokens(themeName?: string): ThemeTokens {
  const safeName = resolveThemeName(themeName);
  return THEME_PRESETS[safeName];
}

export function resolveFontScale(fontSize?: string): number {
  if (fontSize && fontSize in FONT_SCALE) {
    return FONT_SCALE[fontSize as FontSize];
  }
  return FONT_SCALE.medium;
}

export function resolveFontTokens(fontSize?: string): FontTokens {
  const scale = resolveFontScale(fontSize);

  const named = Object.fromEntries(
    Object.entries(NAMED_FONT_BASE).map(([key, size]) => [key, roundTo2(size * scale)])
  ) as FontTokens["named"];

  const px = Object.fromEntries(
    PIXEL_FONT_BASE.map((size) => [String(size), roundTo2(size * scale)])
  );

  const leading = Object.fromEntries(
    LINE_HEIGHT_BASE.map((size) => [String(size), roundTo2(size * scale)])
  );

  return { scale, named, px, leading };
}

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}
