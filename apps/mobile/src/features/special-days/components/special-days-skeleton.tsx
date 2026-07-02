import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ThemedCard } from "../../../components/ui/themed-card";

function useSkeletonPulse() {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function HeroCardSkeleton() {
  const style = useSkeletonPulse();

  return (
    <ThemedCard className="rounded-[24px] p-6" borderClassName="border-white/10">
      <Animated.View style={style}>
        <View className="h-6 w-28 self-start rounded-full bg-white/15" />
        <View className="mb-2 mt-4 h-7 w-2/3 rounded-full bg-white/20" />
        <View className="mb-6 h-3 w-1/2 rounded-full bg-white/10" />
        <View className="flex-row gap-2">
          <View className="h-14 w-16 rounded-2xl bg-white/12" />
        </View>
        <View className="mt-4 h-8 w-32 self-center rounded-full bg-white/10" />
      </Animated.View>
    </ThemedCard>
  );
}

function TodayActionSkeleton() {
  const style = useSkeletonPulse();

  return (
    <ThemedCard className="rounded-2xl px-4 py-4" borderClassName="border-white/5">
      <Animated.View style={style}>
        <View className="h-4 w-1/2 rounded-full bg-white/20" />
        <View className="mt-2 h-3 w-3/4 rounded-full bg-white/10" />
        <View className="mt-4 h-11 w-full rounded-full bg-white/12" />
      </Animated.View>
    </ThemedCard>
  );
}

function UpcomingDaySkeleton() {
  const style = useSkeletonPulse();

  return (
    <ThemedCard className="rounded-2xl px-4 py-4" borderClassName="border-white/5">
      <Animated.View style={[{ flexDirection: "row", alignItems: "flex-start", gap: 12 }, style]}>
        <View className="h-10 w-10 rounded-full bg-white/15" />
        <View className="flex-1">
          <View className="h-4 w-2/3 rounded-full bg-white/20" />
          <View className="mt-2 h-3 w-1/3 rounded-full bg-white/10" />
        </View>
        <View className="h-6 w-16 rounded-full bg-white/12" />
      </Animated.View>
    </ThemedCard>
  );
}

export function SpecialDaysSkeleton() {
  return (
    <View className="gap-6">
      <HeroCardSkeleton />
      <TodayActionSkeleton />
      <View className="gap-3">
        <View className="ml-1 h-4 w-32 rounded-full bg-white/15" />
        <View className="gap-3">
          <UpcomingDaySkeleton />
          <UpcomingDaySkeleton />
        </View>
      </View>
    </View>
  );
}
