import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { ThemedCard } from "../../../components/ui/themed-card";

type LoadingSectionProps = {
  visible: boolean;
};

export function LoadingSection({ visible }: LoadingSectionProps) {
  if (!visible) {
    return null;
  }

  return (
    <View className="mb-8">
      <View className="mb-4 flex-row items-center gap-2">
        <FontAwesome6 name="sparkles" iconStyle="solid" size={12} color="#D6A93D" />
        <Text className="text-sm font-semibold text-[--text-primary]">Senin için seçiliyor...</Text>
      </View>

      <ThemedCard className="rounded-[20px] p-5" accent="accentSoft">
        <View className="mb-4 h-4 w-1/3 rounded bg-white/5" />
        <View className="mb-2 h-8 w-3/4 rounded bg-white/5" />
        <View className="mb-4 h-4 w-1/2 rounded bg-white/5" />
        <View className="mt-4 h-10 w-full rounded-full bg-white/5" />
      </ThemedCard>
    </View>
  );
}
