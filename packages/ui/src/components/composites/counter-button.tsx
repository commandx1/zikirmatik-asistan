import { Pressable, Text, View } from "react-native";

type CounterButtonProps = {
  value: number;
  target: number;
  onPress?: () => void;
};

export function CounterButton({ value, target, onPress }: CounterButtonProps) {
  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={onPress}
        className="h-48 w-48 items-center justify-center rounded-full bg-[--accent] active:opacity-90"
      >
        <Text className="text-5xl font-bold text-slate-900" selectable>
          {value}
        </Text>
      </Pressable>
      <Text className="text-xs text-[--text-muted]">Hedef: {target}</Text>
    </View>
  );
}
