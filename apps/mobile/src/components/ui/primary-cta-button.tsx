import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { cn as cx } from "@zikirmatik/ui";

type PrimaryCtaButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryCtaButton({
  label,
  className,
  textClassName,
  style,
  ...props
}: PrimaryCtaButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      className={cx("relative items-center rounded-full bg-gold py-4", className)}
      style={[{ boxShadow: "0 0 20px rgba(200,151,42,0.35)" }, style]}
    >
      <Text className={cx("text-lg font-bold text-on-gold", textClassName)}>{label}</Text>
    </Pressable>
  );
}
