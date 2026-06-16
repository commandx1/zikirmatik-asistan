import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ThemedCard } from "../../../components/ui/themed-card";

const STEPS = [
  "Mesajınız analiz ediliyor",
  "Zikirler taranıyor",
  "Size uygun zikirler belirleniyor",
  "Öneriler hazırlanıyor",
] as const;

const STEP_DELAYS = [1400, 2900, 5000] as const;

type StepStatus = "pending" | "active" | "completed";

function StepItem({ label, status }: { label: string; status: StepStatus }) {
  const rotation = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(status === "active" ? 1 : 0.35);

  useEffect(() => {
    if (status === "active") {
      rotation.value = withRepeat(
        withTiming(360, { duration: 900, easing: Easing.linear }),
        -1,
        false,
      );
      labelOpacity.value = withTiming(1, { duration: 250 });
    } else if (status === "completed") {
      cancelAnimation(rotation);
      rotation.value = 0;
      checkScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      checkOpacity.value = withTiming(1, { duration: 250 });
      labelOpacity.value = withTiming(0.45, { duration: 300 });
    }

    return () => {
      cancelAnimation(rotation);
    };
  }, [status, rotation, checkScale, checkOpacity, labelOpacity]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <View className="flex-row items-center gap-3 py-1">
      <View className="h-6 w-6 items-center justify-center">
        {status === "pending" ? (
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          />
        ) : status === "active" ? (
          <Animated.View style={spinStyle}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: "rgba(214, 169, 61, 0.25)",
                borderTopColor: "#D6A93D",
              }}
            />
          </Animated.View>
        ) : (
          <Animated.View style={checkStyle}>
            <FontAwesome6 name="circle-check" iconStyle="solid" size={16} color="#4ade80" />
          </Animated.View>
        )}
      </View>

      <Animated.View style={labelStyle}>
        <Text
          className={`text-sm leading-5 ${
            status === "active" ? "font-semibold text-[--text-primary]" : "text-[--text-muted]"
          }`}
        >
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

function SkeletonCard({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(opacity);
      return;
    }

    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    return () => cancelAnimation(opacity);
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ThemedCard className="rounded-[20px] p-5" accent="accentSoft">
      <Animated.View style={style}>
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

type LoadingSectionProps = {
  visible: boolean;
};

export function LoadingSection({ visible }: LoadingSectionProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!visible) {
      setActiveStep(0);
      return;
    }

    setActiveStep(0);
    const t1 = setTimeout(() => setActiveStep(1), STEP_DELAYS[0]);
    const t2 = setTimeout(() => setActiveStep(2), STEP_DELAYS[1]);
    const t3 = setTimeout(() => setActiveStep(3), STEP_DELAYS[2]);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View className="mb-8">
      <View className="mb-4 flex-row items-center gap-2 px-1">
        <FontAwesome6 name="sparkles" iconStyle="solid" size={12} color="#D6A93D" />
        <Text className="text-sm font-semibold text-[--text-primary]">Asistan çalışıyor</Text>
      </View>

      <ThemedCard className="mb-4 rounded-[20px] px-5 py-4" accent="accentSoft">
        <View className="gap-1">
          {STEPS.map((label, index) => (
            <StepItem
              key={label}
              label={label}
              status={
                index < activeStep ? "completed" : index === activeStep ? "active" : "pending"
              }
            />
          ))}
        </View>
      </ThemedCard>

      <View className="gap-4">
        <SkeletonCard visible={visible} />
        <SkeletonCard visible={visible} />
      </View>
    </View>
  );
}
