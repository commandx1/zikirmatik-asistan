import { TextInput, type TextInputProps, View } from "react-native";
import { cn } from "../../utils/cn";

type AppInputProps = TextInputProps & {
  className?: string;
};

export function AppInput({ className, ...props }: AppInputProps) {
  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] px-4 py-3">
      <TextInput placeholderTextColor="#8798B3" className={cn("text-sm text-[--text-primary]", className)} {...props} />
    </View>
  );
}
