export const PARITY_SCREENS = [
  "onboarding",
  "home",
  "ai-rehber",
  "zikirmatik-focus-mode",
  "ozel-gunler",
  "istatistik",
  "profil",
  "tema-seçici",
  "components"
] as const;

export type ParityScreen = (typeof PARITY_SCREENS)[number];
