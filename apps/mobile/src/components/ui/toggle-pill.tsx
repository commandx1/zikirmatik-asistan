import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

type TogglePillProps = {
  checked: boolean;
  onToggle: (nextValue: boolean) => void;
  activeTrackClassName?: string;
  inactiveTrackClassName?: string;
  knobSize?: number;
  size?: "default" | "compact";
};

export function TogglePill({
  checked,
  onToggle,
  activeTrackClassName = "bg-[#2E7D5E]",
  inactiveTrackClassName = "bg-[#1A2E24]",
  knobSize = 18,
  size = "default"
}: TogglePillProps) {
  const width = size === "default" ? 48 : 40;
  const height = size === "default" ? 24 : 20;
  const knobTravel = width - knobSize - 4;
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic)
    });
  }, [checked, progress]);

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * knobTravel }]
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      className={`rounded-full border border-white/10 p-[2px] ${checked ? activeTrackClassName : inactiveTrackClassName}`}
      onPress={() => onToggle(!checked)}
      style={{ height, width }}
    >
      <Animated.View
        className="rounded-full bg-[#F7F7F7]"
        style={[{ height: knobSize, width: knobSize }, knobAnimatedStyle]}
      />
    </Pressable>
  );
}
