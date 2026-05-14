import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

type CardAccent = "none" | "accent" | "accentSoft" | "success" | "muted";

type ThemedCardProps = PropsWithChildren<
  ViewProps & {
    className?: string;
    accent?: CardAccent;
    elevated?: boolean;
    borderClassName?: string;
  }
>;

const ACCENT_CLASS: Record<CardAccent, string> = {
  none: "",
  accent: "border-l-4 border-l-[--accent]",
  accentSoft: "border-l-4 border-l-[--accent]/30",
  success: "border-l-4 border-l-[--success]",
  muted: "border-l-4 border-l-white/20"
};

export function ThemedCard({
  children,
  className,
  accent = "none",
  elevated = false,
  borderClassName = "border-white/5",
  ...props
}: ThemedCardProps) {
  const composed = [
    "overflow-hidden border bg-[--card]",
    borderClassName ? `border ${borderClassName}` : "",
    ACCENT_CLASS[accent],
    elevated ? "shadow-sm shadow-black/30" : "",
    className ?? ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View className={composed} {...props}>
      {children}
    </View>
  );
}
