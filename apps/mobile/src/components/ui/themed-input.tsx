import type { ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { withAlpha } from "@zikirmatik/shared";

type ThemedInputShape = "pill" | "xl";

type ThemedInputProps = TextInputProps & {
  shape?: ThemedInputShape;
  trailing?: ReactNode;
  className?: string;
};

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
