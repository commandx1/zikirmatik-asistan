import { useThemeTokens } from "./theme-provider";

export function useThemeClass() {
  const { fontScale } = useThemeTokens();
  return {
    baseScreen: "flex-1 bg-[--bg]",
    card: "bg-[--card] border border-[--border]",
    textPrimary: "text-[--text-primary]",
    textMuted: "text-[--text-muted]",
    accentText: "text-[--accent]",
    successText: "text-[--success]",
    fontScale
  };
}
