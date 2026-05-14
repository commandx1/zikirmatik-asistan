import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

type PrimaryCtaButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PrimaryCtaButton({
  label,
  className,
  textClassName,
  style,
  ...props
}: PrimaryCtaButtonProps) {
  return (
    <Pressable
      {...props}
      className={cx("relative items-center rounded-full bg-[#C8972A] py-4", className)}
      style={[{ boxShadow: "0 0 20px rgba(200,151,42,0.35)" }, style]}
    >
      <Text className={cx("text-[16px] font-bold text-[#0F1B2D]", textClassName)}>{label}</Text>
    </Pressable>
  );
}
