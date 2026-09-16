import { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { useThemeTokens } from "@zikirmatik/ui";
import { TabIcon } from "./tab-icons";

export const GLASS_TAB_BAR_HEIGHT = 60;
export const GLASS_TAB_BAR_BOTTOM_GAP = 10;
export const GLASS_TAB_BAR_SIDE_MARGIN = 16;

const VISIBLE_TABS = ["home", "focus", "ai-guide", "special-days", "profile"] as const;

function relativeLuminance(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Total vertical space the floating bar occupies from the screen bottom. */
export function useGlassTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return GLASS_TAB_BAR_HEIGHT + GLASS_TAB_BAR_BOTTOM_GAP + insets.bottom;
}

type GlassTabBarProps = BottomTabBarProps & {
  onMorePress: () => void;
  moreActive: boolean;
};

export function GlassTabBar({ state, descriptors, navigation, onMorePress, moreActive }: GlassTabBarProps) {
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [pillWidth, setPillWidth] = useState(0);
  const translateX = useSharedValue(0);
  const isLightTheme = relativeLuminance(tokens.bg) > 140 / 255;

  const focusedRouteName = state.routes[state.index]?.name;
  const focusedVisibleIndex = VISIBLE_TABS.indexOf(focusedRouteName as (typeof VISIBLE_TABS)[number]);
  const activeIndex = moreActive || focusedVisibleIndex === -1 ? VISIBLE_TABS.length - 1 : focusedVisibleIndex;

  const setTabBarHeight = useContext(BottomTabBarHeightCallbackContext);
  const inset = useGlassTabBarInset();
  useEffect(() => {
    setTabBarHeight?.(inset);
  }, [setTabBarHeight, inset]);

  const tabWidth = pillWidth / VISIBLE_TABS.length;
  useEffect(() => {
    if (pillWidth > 0) {
      translateX.value = withSpring(activeIndex * tabWidth, { damping: 18, stiffness: 180, mass: 0.6 });
    }
  }, [activeIndex, pillWidth, tabWidth, translateX]);
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View
      style={[
        styles.wrapper,
        {
          left: GLASS_TAB_BAR_SIDE_MARGIN,
          right: GLASS_TAB_BAR_SIDE_MARGIN,
          bottom: GLASS_TAB_BAR_BOTTOM_GAP + insets.bottom,
          height: GLASS_TAB_BAR_HEIGHT,
        },
      ]}
    >
      <LiquidGlassView
        style={[styles.pill, !isLiquidGlassSupported && { backgroundColor: tokens.card, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }]}
        effect="regular"
        colorScheme={isLightTheme ? "light" : "dark"}
        interactive={false}
        onLayout={(e) => setPillWidth(e.nativeEvent.layout.width)}
      >
        {!isLiquidGlassSupported ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frostTint]} />
        ) : null}
        {pillWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: tabWidth - 8,
                marginHorizontal: 4,
                backgroundColor: `${tokens.accent}29`,
                borderColor: `${tokens.accent}40`,
              },
              indicatorStyle,
            ]}
          />
        ) : null}

        {VISIBLE_TABS.map((name, index) => {
          const foundRoute = state.routes.find((r) => r.name === name);
          if (!foundRoute) return null;
          const route = foundRoute;
          const isProfile = name === "profile";
          const isActive = isProfile ? moreActive || focusedVisibleIndex === -1 : index === activeIndex;
          const label = descriptors[route.key]?.options.title ?? name;
          const color = isActive ? tokens.accent : tokens.textPrimary;

          function handlePress() {
            void Haptics.selectionAsync().catch(() => {});
            if (isProfile) {
              onMorePress();
              return;
            }
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          function handleLongPress() {
            if (isProfile) return;
            navigation.emit({ type: "tabLongPress", target: route.key });
          }

          return (
            <Pressable
              key={name}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={styles.tab}
              accessibilityRole={isProfile ? "button" : "tab"}
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={label}
              hitSlop={4}
            >
              <View style={{ opacity: isActive ? 1 : 0.6 }}>
                <TabIcon name={name} color={color} size={25} />
              </View>
            </Pressable>
          );
        })}
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pill: {
    flex: 1,
    borderRadius: GLASS_TAB_BAR_HEIGHT / 2,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  frostTint: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  indicator: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 999,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
