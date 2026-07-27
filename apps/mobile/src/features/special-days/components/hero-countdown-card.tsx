import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useThemeTokens } from "@zikirmatik/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("special-days");
  const isTodaySpecial = data.isTodaySpecial;
  const pulseProgress = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);
  const badgeFloatProgress = useSharedValue(0);
  const borderRotation = useSharedValue(0);

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
      borderRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseProgress);
      cancelAnimation(shimmerProgress);
      cancelAnimation(badgeFloatProgress);
      cancelAnimation(borderRotation);
      pulseProgress.value = 0;
      shimmerProgress.value = 0;
      badgeFloatProgress.value = 0;
      borderRotation.value = 0;
    }

    return () => {
      cancelAnimation(pulseProgress);
      cancelAnimation(shimmerProgress);
      cancelAnimation(badgeFloatProgress);
      cancelAnimation(borderRotation);
    };
  }, [badgeFloatProgress, borderRotation, isTodaySpecial, pulseProgress, shimmerProgress]);

  const cardPulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseProgress.value, [0, 1], [1, 1.01]) }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseProgress.value, [0, 1], [0.16, 0.34]),
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerProgress.value, [0, 1], [-230, 340]) }, { rotateZ: "14deg" }],
  }));

  const borderRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderRotation.value}deg` }],
  }));

  const accentTransparent = withAlpha(tokens.accent, 0);
  const accentSoft = withAlpha(tokens.accent, 0.12);
  const accentStrong = withAlpha(tokens.accent, 0.3);
  const cardBg = withAlpha(tokens.accent, 0.12);

  const cardContent = (
    <>
      <View className="z-10 flex-row items-center justify-between gap-2">
        <ThemedTag label={data.badge} variant="accent" className="self-start px-3 py-[7px]" />
      </View>
      <View className="z-10 mb-6 mt-4">
        <Text
          className="text-2xl leading-[34px] font-semibold tracking-tight text-[--text-primary]"
          numberOfLines={2}
        >
          {data.title}
        </Text>
        <Text className="pt-1 text-sm leading-5 text-[--text-muted]">
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
          {t("special-days:hero.remainingPrefix", { remaining: data.remaining })}
        </Text>
      </View>
    </>
  );

  if (isTodaySpecial) {
    return (
      <Pressable
        onPress={() => onPressDetail(data.id)}
      >
        <Animated.View
          style={[
            cardPulseAnimatedStyle,
            {
              borderRadius: 24,
              shadowColor: tokens.accent,
              shadowOpacity: 0.44,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 6 },
              elevation: 12,
              backgroundColor: cardBg,
            },
          ]}
        >
          {/* Gradient border wrapper — overflow:hidden clips the rotating gradient */}
          <View style={{ borderRadius: 24, overflow: "hidden", padding: 1.5 }}>
            {/* Rotating gradient that forms the border */}
            <Animated.View style={[StyleSheet.absoluteFillObject, styles.gradientCenter]}>
              <Animated.View style={[styles.gradientSquare, borderRotateStyle]}>
                <LinearGradient
                  colors={[
                    withAlpha(tokens.accent, 0.15),
                    tokens.accent,
                    "rgba(255,255,255,0.82)",
                    tokens.accent,
                    withAlpha(tokens.accent, 0.15),
                    tokens.accent,
                    "rgba(255,255,255,0.82)",
                    tokens.accent,
                    withAlpha(tokens.accent, 0.15),
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </Animated.View>

            {/* Inner card content — opaque background hides gradient except at the 1.5px border margin */}
            <View style={{ borderRadius: 22.5, overflow: "hidden", backgroundColor: tokens.card }}>
              {/* Accent tint overlay */}
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: cardBg, borderRadius: 22.5 }]} />
              {/* Glass sheen */}
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0.00)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ position: "absolute", inset: 0, borderRadius: 22.5 }}
              />
              {/* Animated glows */}
              <Animated.View pointerEvents="none" className="absolute inset-0" style={glowAnimatedStyle}>
                <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[--accent]/28" />
                <View className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[--accent]/14" />
              </Animated.View>
              {/* Shimmer */}
              <Animated.View
                pointerEvents="none"
                style={[{ position: "absolute", top: -36, bottom: -36, width: 170 }, shimmerAnimatedStyle]}
              >
                <LinearGradient
                  colors={[accentTransparent, accentSoft, accentStrong, accentSoft, accentTransparent]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              <DecorativePattern />
              <View style={{ padding: 24 }}>
                {cardContent}
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPressDetail(data.id)}
    >
      <ThemedCard
        className="rounded-[24px] p-6"
        borderClassName="border-white/10"
        elevated
        style={{
          shadowColor: "#000000",
          shadowOpacity: 0.28,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 6 },
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0.00)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: "absolute", inset: 0, borderRadius: 24 }}
        />
        <DecorativePattern />
        {cardContent}
      </ThemedCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradientCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradientSquare: {
    width: "250%",
    aspectRatio: 1,
  },
});

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
