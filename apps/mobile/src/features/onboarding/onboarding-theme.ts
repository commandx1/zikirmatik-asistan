export const ONBOARDING_COLORS = {
  navy: "#0F1B2D",
  card: "#162236",
  gold: "#C8972A",
  textPrimary: "#F0EDE6",
  textMuted: "#9A9080",
  borderSoft: "rgba(255,255,255,0.08)",
  borderMuted: "rgba(255,255,255,0.12)",
  goldSoft: "rgba(200,151,42,0.25)",
  goldStrong: "rgba(200,151,42,0.5)"
} as const;

export const ONBOARDING_FRAME = {
  maxWidth: 375
} as const;

export const STEP_COUNT = 5;

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
