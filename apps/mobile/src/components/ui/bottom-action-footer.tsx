import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomActionFooterProps = PropsWithChildren<{
  className?: string;
}>;

export function BottomActionFooter({ children, className }: BottomActionFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={["bg-transarent px-5 pt-3", className ?? ""].join(" ")}
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {children}
    </View>
  );
}
