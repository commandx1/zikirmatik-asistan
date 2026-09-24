import { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Svg, { Path } from "react-native-svg";
import { useThemeTokens } from "@zikirmatik/ui";
import type { AuthProvider } from "@zikirmatik/shared";
import { PageLayout } from "../../components/ui/page-layout";
import { useAuthStore } from "../../store/auth-store";
import appLogo from "../../assets/app-logo.png";
import { TEST_IDS } from "../../test-ids";
import { withAlpha as hexWithAlpha } from "@zikirmatik/shared";

function relativeLuminance(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function ValueRow({ icon, label, accent, textPrimary }: { icon: React.ComponentProps<typeof FontAwesome6>["name"]; label: string; accent: string; textPrimary: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: hexWithAlpha(accent, 0.15) }}>
        <FontAwesome6 name={icon} size={16} color={accent} />
      </View>
      <Text className="flex-1 text-[15px] font-medium" style={{ color: textPrimary }}>
        {label}
      </Text>
    </View>
  );
}

export function AuthScreen() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useThemeTokens();
  const status = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.authError);
  const signInWithProvider = useAuthStore((s) => s.signInWithProvider);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(null);

  const busy = status === "authenticating";
  const isLightTheme = relativeLuminance(tokens.bg) > 0.5;

  if (status === "authenticated") {
    return <Redirect href="/" />;
  }

  const handleProvider = async (provider: AuthProvider) => {
    setPendingProvider(provider);
    void Haptics.selectionAsync().catch(() => {});
    await signInWithProvider(provider);
    setPendingProvider(null);
  };

  return (
    <PageLayout>
      {router.canGoBack() ? (
        <Pressable
          onPress={() => router.back()}
          testID={TEST_IDS.auth.close}
          accessibilityRole="button"
          accessibilityLabel={t("auth:screen.close")}
          className="absolute z-10 h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
          style={{ top: insets.top + 8, right: 16 }}
        >
          <FontAwesome6 name="xmark" size={18} color={tokens.textMuted} />
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignSelf: "center", width: "100%", maxWidth: 420 }}>
          <Animated.View
            entering={FadeInDown.duration(420).delay(0).reduceMotion(ReduceMotion.System)}
            style={{ alignItems: "center" }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{
                height: 148,
                width: 148,
                backgroundColor: hexWithAlpha(tokens.accent, 0.07),
                borderWidth: 1,
                borderColor: hexWithAlpha(tokens.accent, 0.22)
              }}
            >
              <Image source={appLogo} style={{ height: 108, width: 108 }} resizeMode="contain" accessibilityIgnoresInvertColors />
            </View>
            <Text
              className="text-center text-text-primary"
              style={{ fontSize: 32, fontWeight: "700", letterSpacing: -0.5, marginTop: 24 }}
            >
              {t("auth:screen.appName")}
            </Text>
            <Text
              className="text-center text-text-muted"
              style={{ fontSize: 16, lineHeight: 24, maxWidth: 320, marginTop: 10 }}
            >
              {t("auth:screen.subtitle")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(420).delay(70).reduceMotion(ReduceMotion.System)}
            className="rounded-3xl border border-border bg-card"
            style={{ marginTop: 28, padding: 16, gap: 14 }}
          >
            <ValueRow icon="cloud-arrow-up" label={t("auth:screen.valueSync")} accent={tokens.accent} textPrimary={tokens.textPrimary} />
            <ValueRow icon="calendar-check" label={t("auth:screen.valueVird")} accent={tokens.accent} textPrimary={tokens.textPrimary} />
            <ValueRow icon="wand-magic-sparkles" label={t("auth:screen.valueAi")} accent={tokens.accent} textPrimary={tokens.textPrimary} />
          </Animated.View>

          {authError ? (
            <Animated.View
              entering={FadeInDown.duration(420).delay(140).reduceMotion(ReduceMotion.System)}
              className="flex-row items-center"
              style={{
                marginTop: 20,
                borderRadius: 16,
                padding: 14,
                backgroundColor: "rgba(239,68,68,0.12)",
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.35)",
                gap: 10
              }}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <FontAwesome6 name="circle-exclamation" size={16} color="#F87171" />
              <Text className="flex-1 text-text-primary" style={{ fontSize: 14, lineHeight: 20 }}>
                {authError}
              </Text>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInDown.duration(420).delay(210).reduceMotion(ReduceMotion.System)}
            style={{ marginTop: 24, gap: 12 }}
          >
            {Platform.OS === "ios" ? (
              busy && pendingProvider === "apple" ? (
                <View
                  style={{
                    height: 56,
                    width: "100%",
                    borderRadius: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isLightTheme ? "#000000" : "#FFFFFF"
                  }}
                >
                  <ActivityIndicator color={isLightTheme ? "#FFFFFF" : "#000000"} />
                </View>
              ) : (
                <View pointerEvents={busy ? "none" : "auto"} style={{ opacity: busy && pendingProvider !== "apple" ? 0.5 : 1 }}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={
                      isLightTheme
                        ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                        : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    }
                    cornerRadius={28}
                    style={{ height: 56, width: "100%" }}
                    onPress={() => void handleProvider("apple")}
                  />
                </View>
              )
            ) : null}

            <Pressable
              disabled={busy}
              onPress={() => void handleProvider("google")}
              testID={TEST_IDS.auth.google}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy: pendingProvider === "google" }}
              className="h-14 flex-row items-center justify-center gap-3 rounded-full border active:opacity-80"
              style={{
                backgroundColor: isLightTheme ? "#FFFFFF" : tokens.card,
                borderColor: isLightTheme ? "#DADCE0" : hexWithAlpha(tokens.textPrimary, 0.2),
                opacity: busy && pendingProvider !== "google" ? 0.5 : 1
              }}
            >
              {busy && pendingProvider === "google" ? <ActivityIndicator color={tokens.textPrimary} /> : <GoogleLogo />}
              <Text style={{ fontSize: 17, fontWeight: "600", color: tokens.textPrimary }}>{t("auth:screen.signInGoogle")}</Text>
            </Pressable>

            <View className="flex-row items-center gap-3" style={{ marginVertical: 4 }}>
              <View className="h-px flex-1" style={{ backgroundColor: tokens.border }} />
              <Text className="text-text-muted" style={{ fontSize: 13 }}>
                {t("auth:screen.or")}
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: tokens.border }} />
            </View>

            <Pressable
              disabled={busy}
              onPress={() => {
                continueAsGuest();
                router.replace("/(tabs)/home");
              }}
              testID={TEST_IDS.auth.guest}
              accessibilityRole="button"
              className="h-14 flex-row items-center justify-center gap-2 rounded-full border active:opacity-80"
              style={{
                borderColor: hexWithAlpha(tokens.accent, 0.5),
                backgroundColor: hexWithAlpha(tokens.accent, 0.1),
                opacity: busy ? 0.5 : 1
              }}
            >
              <FontAwesome6 name="user" size={15} color={tokens.accent} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: tokens.accent }}>
                {t("auth:screen.continueAsGuest")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
