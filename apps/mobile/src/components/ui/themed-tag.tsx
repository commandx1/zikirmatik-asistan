import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ThemedTagVariant = "soft" | "accent" | "primary";

type ThemedTagProps = {
  label: string;
  leading?: ReactNode;
  onPress?: () => void;
  variant?: ThemedTagVariant;
  className?: string;
  textClassName?: string;
};

const CONTAINER_CLASSNAMES: Record<ThemedTagVariant, string> = {
  soft: "border-white/10 bg-[--card]",
  accent: "border-[--accent]/20 bg-[--bg]",
  primary: "border-white/10 bg-[--bg]"
};

const TEXT_CLASSNAMES: Record<ThemedTagVariant, string> = {
  soft: "text-[--text-muted]",
  accent: "text-[--accent]",
  primary: "text-[--text-primary]"
};

export function ThemedTag({ label, leading, onPress, variant = "soft", className, textClassName }: ThemedTagProps) {
  const content = (
    <>
      {leading ? <View>{leading}</View> : null}
      <Text className={["text-[11px] font-medium", TEXT_CLASSNAMES[variant], textClassName ?? ""].join(" ")}>{label}</Text>
    </>
  );

  const wrapperClassName = [
    "flex-row items-center gap-1.5 rounded-full border px-3 py-1.5",
    CONTAINER_CLASSNAMES[variant],
    className ?? ""
  ].join(" ");

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={wrapperClassName}>
        {content}
      </Pressable>
    );
  }

  return <View className={wrapperClassName}>{content}</View>;
}
