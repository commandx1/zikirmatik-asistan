export const COLORS = {
  bg: "#0D1B2A",
  bgCard: "#162235",
  bgCardLight: "#1C2E44",
  gold: "#D4A830",
  goldLight: "#F0C040",
  goldDark: "#A07820",
  white: "#FFFFFF",
  whiteAlpha80: "rgba(255,255,255,0.8)",
  whiteAlpha50: "rgba(255,255,255,0.5)",
  whiteAlpha20: "rgba(255,255,255,0.2)",
  whiteAlpha10: "rgba(255,255,255,0.1)",
  goldAlpha30: "rgba(212,168,48,0.3)",
  goldAlpha15: "rgba(212,168,48,0.15)",
  goldAlpha08: "rgba(212,168,48,0.08)",
  green: "#4CAF7D",
};

export const FPS = 30;
export const DURATION_SEC = 33;
export const TOTAL_FRAMES = FPS * DURATION_SEC;

// Video: 1080x1920 (portrait 9:16) — Play Store uyumlu
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const FONTS = {
  arabic: "'Amiri', 'Traditional Arabic', serif",
  latin: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
};

export const SCENES = {
  intro:       { start: 0,   end: 90  }, // 0-3s
  tagline:     { start: 90,  end: 210 }, // 3-7s
  counter:     { start: 210, end: 420 }, // 7-14s
  aiGuide:     { start: 420, end: 630 }, // 14-21s
  focusMode:   { start: 630, end: 810 }, // 21-27s
  stats:       { start: 810, end: 930 }, // 27-31s
  outro:       { start: 930, end: 990 }, // 31-33s
};
