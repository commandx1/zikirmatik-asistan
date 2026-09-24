import { useEffect, useRef, useState } from "react";
import { Animated, Text } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { withAlpha } from "@zikirmatik/shared";

// Ortak, geçici (2.5s) üst-orta toast banner'ı — aslen home-view.tsx'teki
// TapAnywhereToast'ın aynen taşınmış hali (bkz. FAZ B görevi B8). home-view.tsx
// hâlâ kendi 'hand-pointer' ikonuyla kullanır; vird-hub-screen.tsx notice
// (started/draft) toast'ı için de bunu kullanır.

type ToastBannerProps = {
  message: string | null;
  iconName?: string;
  /** Ekranın üstünde (varsayılan) ya da altında konumlandır. */
  position?: "top" | "bottom";
};

export function ToastBanner({ message, iconName = "hand-pointer", position = "top" }: ToastBannerProps) {
  const { tokens } = useThemeTokens();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null);
  const [displayMessage, setDisplayMessage] = useState("");

  useEffect(() => {
    runningAnim.current?.stop();

    if (message) {
      setDisplayMessage(message);
      opacity.setValue(0);
      translateY.setValue(12);
      runningAnim.current = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true })
      ]);
      runningAnim.current.start();
    } else {
      runningAnim.current = Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 180, useNativeDriver: true })
      ]);
      runningAnim.current.start();
    }
  }, [message, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        ...(position === "bottom" ? { bottom: 40 } : { top: 128 }),
        alignSelf: "center",
        opacity,
        transform: [{ translateY }],
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: withAlpha(tokens.textPrimary, 0.12),
        backgroundColor: tokens.card
      }}
    >
      <FontAwesome6 name={iconName} size={12} color={tokens.accent} />
      <Text className="text-sm" style={{ color: tokens.textPrimary, fontWeight: "500" }}>
        {displayMessage}
      </Text>
    </Animated.View>
  );
}
