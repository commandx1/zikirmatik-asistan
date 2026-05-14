import { useThemeStore } from "../store/theme-store";

export function useThemePreferences() {
  const themeName = useThemeStore((s) => s.themeName);
  const fontFamily = useThemeStore((s) => s.fontFamily);
  const setThemeName = useThemeStore((s) => s.setThemeName);
  const setFontFamily = useThemeStore((s) => s.setFontFamily);
  const hydrateAppearance = useThemeStore((s) => s.hydrateAppearance);

  return {
    themeName,
    fontFamily,
    setThemeName,
    setFontFamily,
    hydrateAppearance
  };
}
