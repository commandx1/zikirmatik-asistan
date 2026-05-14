import { Pressable, Text, View } from "react-native";

type ProfileDemoControlsProps = {
  onOpenSheet: () => void;
};

export function ProfileDemoControls({ onOpenSheet }: ProfileDemoControlsProps) {
  return (
    <View className="absolute right-4 top-4 z-[100] gap-2 opacity-20">
      <Pressable className="rounded border border-gray-300 bg-white px-3 py-1.5">
        <Text className="text-xs font-bold text-black">Tema Değiştir</Text>
      </Pressable>
      <Pressable onPress={onOpenSheet} className="rounded bg-[--accent] px-3 py-1.5">
        <Text className="text-xs font-bold text-[#0F1B2D]">Sheet Test</Text>
      </Pressable>
    </View>
  );
}
