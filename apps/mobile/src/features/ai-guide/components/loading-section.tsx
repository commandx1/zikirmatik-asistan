import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { ThemedCard } from "../../../components/ui/themed-card";

type LoadingSectionProps = {
  visible: boolean;
};

function SkeletonCard({ pulse }: { pulse: Animated.Value }) {
  return (
    <ThemedCard className="rounded-[20px] p-5" accent="accentSoft">
      <Animated.View style={{ opacity: pulse }}>
        <View className="mb-3 flex-row items-center gap-2">
          <View className="h-3 w-1/4 rounded-full bg-white/20" />
          <View className="h-3 w-16 rounded-full bg-white/10" />
        </View>
        <View className="mb-2 h-4 w-2/3 rounded-full bg-white/20" />
        <View className="mb-1 h-3 w-full rounded-full bg-white/12" />
        <View className="mb-1 h-3 w-5/6 rounded-full bg-white/12" />
        <View className="mb-4 h-3 w-4/5 rounded-full bg-white/10" />
        <View className="h-10 w-full rounded-full bg-white/15" />
      </Animated.View>
    </ThemedCard>
  );
}

export function LoadingSection({ visible }: LoadingSectionProps) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!visible) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [visible, pulse]);

  if (!visible) {
    return null;
  }

  return (
    <View className="mb-8">
      <View className="mb-4 flex-row items-center gap-2">
        <FontAwesome6 name="sparkles" iconStyle="solid" size={12} color="#D6A93D" />
        <Text className="text-sm font-semibold text-[--text-primary]">Senin için seçiliyor...</Text>
      </View>

      <View className="gap-4">
        <SkeletonCard pulse={pulse} />
        <SkeletonCard pulse={pulse} />
      </View>
    </View>
  );
}
