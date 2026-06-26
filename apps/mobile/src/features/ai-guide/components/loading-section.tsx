import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ThemedCard } from "../../../components/ui/themed-card";

const STEPS = [
  "Mesajınız analiz ediliyor...",
  "Zikirler taranıyor...",
  "Size uygun zikirler belirleniyor...",
  "Öneriler hazırlanıyor...",
] as const;

const STEP_DELAYS = [2050, 3550, 5650] as const;

function Spinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
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
  );
}

function FadingStepLabel({ step }: { step: number }) {
  const [displayed, setDisplayed] = useState(step);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (step === displayed) return;

    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setDisplayed)(step);
        opacity.value = withTiming(1, { duration: 280 });
      }
    });
  }, [step]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <Text className="text-sm font-semibold text-[--text-primary]">
        {STEPS[displayed]}
      </Text>
    </Animated.View>
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
        <View className="flex-row items-center gap-3">
          <Spinner />
          <FadingStepLabel step={activeStep} />
        </View>
      </ThemedCard>

      <View className="gap-4">
        <SkeletonCard visible={visible} />
        <SkeletonCard visible={visible} />
      </View>
    </View>
  );
}
