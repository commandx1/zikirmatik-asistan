import { View, type ViewProps } from "react-native";
import { cn } from "../../utils/cn";

type AppCardProps = ViewProps & {
  padded?: boolean;
  elevated?: boolean;
  className?: string;
};

export function AppCard({ padded = true, elevated = false, className, ...props }: AppCardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-[--border] bg-[--card]",
        padded && "p-4",
        elevated && "shadow-sm shadow-black/30",
        className
      )}
      {...props}
    />
  );
}
