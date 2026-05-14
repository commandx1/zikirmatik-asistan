import { createContext, useContext, useMemo } from "react";
import { vars } from "nativewind";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { FontSize, FontTokens, ThemeName, ThemeTokens } from "@zikirmatik/shared";
import { resolveFontTokens, resolveThemeName, resolveThemeTokens } from "@zikirmatik/shared";

type ThemeContextValue = {
  themeName: ThemeName;
  fontSize: FontSize;
  tokens: ThemeTokens;
  fontScale: number;
  fontTokens: FontTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  themeName?: string;
  fontSize?: string;
  textFontFamily?: string;
  textFontFamilyStrong?: string;
  children: ReactNode;
};

export function ThemeProvider({ themeName, fontSize, textFontFamily, textFontFamilyStrong, children }: ThemeProviderProps) {
  const safeThemeName = resolveThemeName(themeName);
  const safeFontSize = (fontSize === "small" || fontSize === "large" || fontSize === "medium"
    ? fontSize
    : "medium") as FontSize;

  const value = useMemo<ThemeContextValue>(() => {
    const fontTokens = resolveFontTokens(safeFontSize);

    return {
      themeName: safeThemeName,
      fontSize: safeFontSize,
      tokens: resolveThemeTokens(safeThemeName),
      fontScale: fontTokens.scale,
      fontTokens
    };
  }, [safeThemeName, safeFontSize]);

  const variableStyle = useMemo(
    () => {
      const fontVariables = {
        "--font-scale": String(value.fontTokens.scale),
        "--font-xs": `${value.fontTokens.named.xs}px`,
        "--font-sm": `${value.fontTokens.named.sm}px`,
        "--font-base": `${value.fontTokens.named.base}px`,
        "--font-lg": `${value.fontTokens.named.lg}px`,
        "--font-xl": `${value.fontTokens.named.xl}px`,
        "--font-2xl": `${value.fontTokens.named["2xl"]}px`,
        "--font-3xl": `${value.fontTokens.named["3xl"]}px`,
        "--font-4xl": `${value.fontTokens.named["4xl"]}px`,
        "--font-5xl": `${value.fontTokens.named["5xl"]}px`,
        "--font-6xl": `${value.fontTokens.named["6xl"]}px`,
        "--leading-20": `${value.fontTokens.leading["20"]}px`,
        "--leading-34": `${value.fontTokens.leading["34"]}px`,
        "--leading-48": `${value.fontTokens.leading["48"]}px`,
        "--leading-58": `${value.fontTokens.leading["58"]}px`
      } as Record<string, string>;

      Object.entries(value.fontTokens.px).forEach(([size, scaled]) => {
        fontVariables[`--font-${size}`] = `${scaled}px`;
      });

      return vars({
        "--bg": value.tokens.bg,
        "--card": value.tokens.card,
        "--text-primary": value.tokens.textPrimary,
        "--text-muted": value.tokens.textMuted,
        "--accent": value.tokens.accent,
        "--success": value.tokens.success,
        "--border": value.tokens.border,
        "--app-font-family": textFontFamily ?? "System",
        "--app-font-family-strong": textFontFamilyStrong ?? textFontFamily ?? "System",
        ...fontVariables
      });
    },
    [textFontFamily, textFontFamilyStrong, value]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={variableStyle} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useThemeTokens(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeTokens must be used within ThemeProvider");
  }
  return ctx;
}
