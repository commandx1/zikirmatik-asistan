import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type MoreMenuProps = {
  open: boolean;
  tabBarHeight: number;
  onClose: () => void;
};

export function MoreMenu({ open, tabBarHeight, onClose }: MoreMenuProps) {
  const router = useRouter();
  const { tokens } = useThemeTokens();

  const backdrop = useSharedValue(0);
  const animIstatistik = useSharedValue(0);
  const animKutuphane = useSharedValue(0);
  const animProfil = useSharedValue(0);

  useEffect(() => {
    if (open) {
      backdrop.value = withTiming(1, { duration: 200 });
      animProfil.value = withSpring(1, { damping: 15, stiffness: 200 });
      animKutuphane.value = withDelay(60, withSpring(1, { damping: 15, stiffness: 200 }));
      animIstatistik.value = withDelay(120, withSpring(1, { damping: 15, stiffness: 200 }));
    } else {
      backdrop.value = withTiming(0, { duration: 180 });
      animIstatistik.value = withTiming(0, { duration: 150 });
      animKutuphane.value = withDelay(40, withTiming(0, { duration: 140 }));
      animProfil.value = withDelay(80, withTiming(0, { duration: 130 }));
    }
  }, [open, backdrop, animIstatistik, animKutuphane, animProfil]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backdrop.value, [0, 1], [0, 0.55]),
  }));

  const istatistikStyle = useAnimatedStyle(() => ({
    opacity: animIstatistik.value,
    transform: [{ translateY: interpolate(animIstatistik.value, [0, 1], [16, 0]) }],
  }));

  const kutuphaneStyle = useAnimatedStyle(() => ({
    opacity: animKutuphane.value,
    transform: [{ translateY: interpolate(animKutuphane.value, [0, 1], [16, 0]) }],
  }));

  const profilStyle = useAnimatedStyle(() => ({
    opacity: animProfil.value,
    transform: [{ translateY: interpolate(animProfil.value, [0, 1], [16, 0]) }],
  }));

  function handleNavigate(href: string) {
    onClose();
    setTimeout(() => {
      router.push(href as Parameters<typeof router.push>[0]);
    }, 180);
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? "auto" : "none"}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={[styles.itemsContainer, { bottom: tabBarHeight + 12 }]}>
        <Animated.View style={istatistikStyle}>
          <Pressable
            onPress={() => handleNavigate("/(tabs)/stats")}
            style={[styles.card, { backgroundColor: tokens.card, borderColor: "rgba(255,255,255,0.09)" }]}
          >
            <FontAwesome6 name="chart-line" size={15} color={tokens.accent} iconStyle="solid" />
            <Text className="text-base font-semibold" style={{ color: tokens.textPrimary }}>İstatistik</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={kutuphaneStyle}>
          <Pressable
            onPress={() => handleNavigate("/(tabs)/collections")}
            style={[styles.card, { backgroundColor: tokens.card, borderColor: "rgba(255,255,255,0.09)" }]}
          >
            <FontAwesome6 name="book-open" size={15} color={tokens.accent} iconStyle="solid" />
            <Text className="text-base font-semibold" style={{ color: tokens.textPrimary }}>Koleksiyonlar</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={profilStyle}>
          <Pressable
            onPress={() => handleNavigate("/(tabs)/profile")}
            style={[styles.card, { backgroundColor: tokens.card, borderColor: "rgba(255,255,255,0.09)" }]}
          >
            <FontAwesome6 name="user" size={15} color={tokens.accent} iconStyle="regular" />
            <Text className="text-base font-semibold" style={{ color: tokens.textPrimary }}>Profil</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#000",
  },
  itemsContainer: {
    position: "absolute",
    right: 12,
    gap: 8,
    alignItems: "flex-end",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 156,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
