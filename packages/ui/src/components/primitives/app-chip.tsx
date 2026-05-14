import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "../../utils/cn";

type AppChipProps = PressableProps & {
  label: string;
  active?: boolean;
  className?: string;
};

export function AppChip({ label, active = false, className, ...props }: AppChipProps) {
  return (
    <Pressable
      className={cn(
        "rounded-full border px-4 py-2",
        active
          ? "border-[--accent]/40 bg-[--accent]/10"
          : "border-[--border] bg-[--card]",
        className
      )}
      {...props}
    >
      <Text className={cn("text-xs font-medium", active ? "text-[--accent]" : "text-[--text-muted]")}>{label}</Text>
    </Pressable>
  );
}
