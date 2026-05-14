import { Pressable, Text, View } from "react-native";

type ProfileLogoutRowProps = {
  onPress: () => void;
};

export function ProfileLogoutRow({ onPress }: ProfileLogoutRowProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-start p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8" />
        <Text className="text-[14px] font-medium text-[#EF4444]">Çıkış Yap</Text>
      </View>
    </Pressable>
  );
}
