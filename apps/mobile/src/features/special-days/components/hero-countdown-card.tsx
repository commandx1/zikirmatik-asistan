import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useThemeTokens } from "@zikirmatik/ui";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedTag } from "../../../components/ui/themed-tag";
import { CountdownStrip } from "./countdown-strip";
import { DecorativePattern } from "./decorative-pattern";
import type { HeroCardViewModel } from "../types/view-model";

type HeroCountdownCardProps = {
  data: HeroCardViewModel;
  onPressDetail: (id: string) => void;
};

export function HeroCountdownCard({ data, onPressDetail }: HeroCountdownCardProps) {
  const { tokens } = useThemeTokens();
  const isTodaySpecial = data.isTodaySpecial;
  const pulseProgress = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);
  const badgeFloatProgress = useSharedValue(0);

  useEffect(() => {
    if (isTodaySpecial) {
      pulseProgress.value = withRepeat(
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
      shimmerProgress.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
      badgeFloatProgress.value = withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseProgress);
      cancelAnimation(shimmerProgress);
      cancelAnimation(badgeFloatProgress);
      pulseProgress.value = 0;
      shimmerProgress.value = 0;
      badgeFloatProgress.value = 0;
    }

    return () => {
      cancelAnimation(pulseProgress);
      cancelAnimation(shimmerProgress);
      cancelAnimation(badgeFloatProgress);
    };
  }, [badgeFloatProgress, isTodaySpecial, pulseProgress, shimmerProgress]);

  const cardPulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseProgress.value, [0, 1], [1, 1.01]) }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseProgress.value, [0, 1], [0.16, 0.34]),
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerProgress.value, [0, 1], [-230, 340]) }, { rotateZ: "14deg" }],
  }));

  const badgeFloatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(badgeFloatProgress.value, [0, 1], [0, -3]) }],
  }));

  const accentTransparent = withAlpha(tokens.accent, 0);
  const accentSoft = withAlpha(tokens.accent, 0.12);
  const accentStrong = withAlpha(tokens.accent, 0.3);

  return (
    <Pressable
      onPress={() => onPressDetail(data.id)}
      disabled={data.isLocked}
      className={data.isLocked ? "opacity-60" : undefined}
    >
      <Animated.View style={isTodaySpecial ? cardPulseAnimatedStyle : undefined}>
        <ThemedCard
          className="rounded-[24px] p-6"
          borderClassName={isTodaySpecial ? "border-[--accent]/60" : "border-white/10"}
          elevated
          style={{
            shadowColor: isTodaySpecial ? tokens.accent : "#000000",
            shadowOpacity: isTodaySpecial ? 0.44 : 0.28,
            shadowRadius: isTodaySpecial ? 24 : 20,
            shadowOffset: { width: 0, height: 6 },
            backgroundColor: isTodaySpecial
              ? withAlpha(tokens.accent, 0.12)
              : "rgba(255,255,255,0.06)",
          }}
        >
          {/* Glass sheen overlay */}
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0.00)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: "absolute", inset: 0, borderRadius: 24 }}
          />
          {isTodaySpecial ? (
            <>
              <Animated.View pointerEvents="none" className="absolute inset-0" style={glowAnimatedStyle}>
                <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[--accent]/28" />
                <View className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[--accent]/14" />
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    top: -36,
                    bottom: -36,
                    width: 170,
                  },
                  shimmerAnimatedStyle,
                ]}
              >
                <LinearGradient
                  colors={[accentTransparent, accentSoft, accentStrong, accentSoft, accentTransparent]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </>
          ) : null}
          <DecorativePattern />

          <View className="z-10 flex-row items-center justify-between gap-2">
            <ThemedTag label={data.badge} variant="accent" className="self-start px-3 py-[7px]" />
            {isTodaySpecial ? (
              <Animated.View style={badgeFloatAnimatedStyle}>
                <ThemedTag
                  label="Bugünün Özel Günü"
                  variant="primary"
                  className="border-[--accent]/40 bg-[--bg]/75 px-3 py-[7px]"
                  textClassName="text-[--text-primary]"
                  leading={<FontAwesome6 name="sparkles" iconStyle="solid" size={10} color={tokens.accent} />}
                />
              </Animated.View>
            ) : null}
          </View>
          {data.isLocked ? (
            <View className="z-10 mt-2 self-start">
              <ThemedTag label="Premium Kilidi" className="bg-[--bg] px-3 py-[6px]" />
            </View>
          ) : null}

          <View className="z-10 mb-6 mt-4">
            <Text
              className={`text-2xl leading-[34px] font-semibold tracking-tight ${
                isTodaySpecial ? "text-white" : "text-[--text-primary]"
              }`}
              numberOfLines={2}
            >
              {data.title}
            </Text>
            <Text className={`pt-1 text-sm leading-5 ${isTodaySpecial ? "text-[--text-primary]" : "text-[--text-muted]"}`}>
              {data.dateLabel}
            </Text>
          </View>

          <CountdownStrip segments={data.countdown} />

          <View
            className={`z-10 mt-4 flex-row items-center justify-center gap-2 rounded-full px-3 py-2 ${
              isTodaySpecial ? "bg-[--bg]/70" : ""
            }`}
          >
            <FontAwesome6
              name="calendar-day"
              iconStyle="regular"
              size={12}
              color={isTodaySpecial ? tokens.textPrimary : tokens.textMuted}
            />
            <Text className={`text-xs leading-5 ${isTodaySpecial ? "text-[--text-primary]" : "text-[--text-muted]"}`}>
              Kalan: {data.remaining}
            </Text>
          </View>
        </ThemedCard>
      </Animated.View>
    </Pressable>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
