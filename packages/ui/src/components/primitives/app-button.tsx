import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type AppButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-4 py-4"
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-[--accent]",
  secondary: "bg-[--card] border border-[--accent]/35",
  ghost: "bg-transparent"
};

const LABEL_CLASS: Record<ButtonVariant, string> = {
  primary: "text-slate-900",
  secondary: "text-[--accent]",
  ghost: "text-[--text-muted]"
};

export function AppButton({ label, variant = "primary", size = "md", className, ...props }: AppButtonProps) {
  return (
    <Pressable className={cn("items-center rounded-full", SIZE_CLASS[size], VARIANT_CLASS[variant], className)} {...props}>
      <Text className={cn("text-sm font-semibold", LABEL_CLASS[variant])}>{label}</Text>
    </Pressable>
  );
}
