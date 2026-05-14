import type { ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";

type ThemedInputShape = "pill" | "xl";

type ThemedInputProps = TextInputProps & {
  shape?: ThemedInputShape;
  trailing?: ReactNode;
  className?: string;
};

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemedInput({ shape = "xl", trailing, className, placeholderTextColor, ...props }: ThemedInputProps) {
  const { tokens } = useThemeTokens();
  const radiusClassName = shape === "pill" ? "rounded-full" : "rounded-xl";
  const rightPaddingClassName = trailing ? "pr-12" : "pr-4";

  return (
    <View className="relative">
      <TextInput
        placeholderTextColor={placeholderTextColor ?? withAlpha(tokens.textMuted, 0.75)}
        className={[
          "w-full border border-white/10 bg-[--card] py-3 pl-4 text-sm text-[--text-primary]",
          radiusClassName,
          rightPaddingClassName,
          className ?? ""
        ].join(" ")}
        {...props}
      />
      {trailing ? <View className="absolute bottom-2 right-2 top-2">{trailing}</View> : null}
    </View>
  );
}
