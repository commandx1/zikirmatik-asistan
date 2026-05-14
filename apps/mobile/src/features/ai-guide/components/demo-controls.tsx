import { Pressable, Text, View } from "react-native";

type DemoControlsProps = {
  onToggleLoading: () => void;
};

export function DemoControls({ onToggleLoading }: DemoControlsProps) {
  return (
    <View className="absolute right-4 top-4 z-[100] flex-row gap-2 opacity-10">
      <Pressable className="rounded bg-[#1F2937] px-2 py-1.5">
        <Text className="text-xs text-white">Tema</Text>
      </Pressable>
      <Pressable onPress={onToggleLoading} className="rounded bg-[#C8972A] px-2 py-1.5">
        <Text className="text-xs font-medium text-black">Yükleniyor</Text>
      </Pressable>
    </View>
  );
}
