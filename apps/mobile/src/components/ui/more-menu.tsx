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
  const animKutuphane = useSharedValue(0);
  const animProfil = useSharedValue(0);

  useEffect(() => {
    if (open) {
      backdrop.value = withTiming(1, { duration: 200 });
      animProfil.value = withSpring(1, { damping: 15, stiffness: 200 });
      animKutuphane.value = withDelay(60, withSpring(1, { damping: 15, stiffness: 200 }));
    } else {
      backdrop.value = withTiming(0, { duration: 180 });
      animKutuphane.value = withTiming(0, { duration: 150 });
      animProfil.value = withDelay(40, withTiming(0, { duration: 130 }));
    }
  }, [open, backdrop, animKutuphane, animProfil]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backdrop.value, [0, 1], [0, 0.55]),
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
        <Animated.View style={kutuphaneStyle}>
          <Pressable
            onPress={() => handleNavigate("/collections")}
            style={[styles.card, { backgroundColor: tokens.card, borderColor: "rgba(255,255,255,0.09)" }]}
          >
            <FontAwesome6 name="book-open" size={15} color={tokens.accent} iconStyle="solid" />
            <Text style={[styles.cardLabel, { color: tokens.textPrimary }]}>Koleksiyonlar</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={profilStyle}>
          <Pressable
            onPress={() => handleNavigate("/(tabs)/profile")}
            style={[styles.card, { backgroundColor: tokens.card, borderColor: "rgba(255,255,255,0.09)" }]}
          >
            <FontAwesome6 name="user" size={15} color={tokens.accent} iconStyle="regular" />
            <Text style={[styles.cardLabel, { color: tokens.textPrimary }]}>Profil</Text>
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
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
