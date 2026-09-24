import { Text, View } from "react-native";

type ErrorBoxProps = {
  message: string;
  className?: string;
  textClassName?: string;
  testID?: string;
};

export function ErrorBox({
  message,
  className = "mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3",
  textClassName = "text-sm text-[#fecaca]",
  testID
}: ErrorBoxProps) {
  return (
    <View testID={testID} className={className}>
      <Text className={textClassName}>{message}</Text>
    </View>
  );
}
