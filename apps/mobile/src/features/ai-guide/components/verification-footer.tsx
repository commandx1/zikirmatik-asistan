import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";

export function VerificationFooter() {
  return (
    <View className="mb-2 mt-4 flex-row items-center justify-center gap-2 opacity-60">
      <FontAwesome6 name="circle-check" size={11} color="#C8972A" />
      <Text className="text-[10px] text-[#9A9080]">Tüm içerikler güvenilir dini kaynaklardan alınmıştır.</Text>
    </View>
  );
}
