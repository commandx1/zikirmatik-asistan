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
  "galaksi-girdabi": {
    bg: "#080514",
    card: "#12092A",
    textPrimary: "#EDE8FF",
    textMuted: "#C4B5E8",
    accent: "#8B5CF6",
    success: "#34D399",
    border: "#261A4A",
    bgGradient: {
      colors: ["#08051A", "#1A0842", "#0A0F3A"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }
    }
  },
  "karadeniz": {
    bg: "#0A1510",
    card: "#14261C",
    textPrimary: "#E6F5EE",
    textMuted: "#88AF9C",
    accent: "#5EA87A",
    success: "#4DC28A",
    border: "#1E3E2A"
  },
  "safran": {
    bg: "#180E04",
    card: "#2A1A09",
    textPrimary: "#FAF0E2",
    textMuted: "#C8A478",
    accent: "#E87820",
    success: "#5EC490",
    border: "#40220C"
  },
  "tekke": {
    bg: "#0E0B1F",
    card: "#17102E",
    textPrimary: "#EAE5FA",
    textMuted: "#A896C8",
    accent: "#7A58B2",
    success: "#4DBB8E",
    border: "#2C1E48"
  },
  "peygamber-mavisi": {
    bg: "#060F1E",
    card: "#0C1B30",
    textPrimary: "#EAF2FF",
    textMuted: "#84ACC8",
    accent: "#3E8FD4",
    success: "#4DC49A",
    border: "#142E4E"
  },
  "su-dalgasi": {
    bg: "#050C18",
    card: "#0A1628",
    textPrimary: "#E8F4FF",
    textMuted: "#7AAAC8",
    accent: "#4ABACC",
    success: "#4DC49A",
    border: "#142238"
  },
  "lacivert-indigo": {
    bg: "#08091A",
    card: "#0F1130",
    textPrimary: "#E8EAFF",
    textMuted: "#8890C8",
    accent: "#7B82F0",
    success: "#4DC49A",
    border: "#1C2050",
    bgGradient: {
      colors: ["#05060F", "#08091A", "#0D1028"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }
    }
  },
  "altin-varak": {
    bg: "#110E05",
    card: "#1E1A0A",
    textPrimary: "#FBF0D5",
    textMuted: "#BF9F50",
    accent: "#EFC030",
    success: "#5CC490",
    border: "#332B0E",
    bgGradient: {
      colors: ["#0D0B03", "#110E05", "#1A1508"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }
    }
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
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60
};

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

  const leading = Object.fromEntries(
    LINE_HEIGHT_BASE.map((size) => [String(size), roundTo2(size * scale)])
  );

  return { scale, named, leading };
}

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}
