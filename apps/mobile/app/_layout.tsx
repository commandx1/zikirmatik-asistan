import "../global.css";

import { useEffect, useState, type ReactNode } from "react";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Notifications from "expo-notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/lib/query-client";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@zikirmatik/ui";
import { DEFAULT_BG_FALLBACK } from "@zikirmatik/shared";
import { i18n } from "../src/i18n";
import { Merriweather_400Regular, Merriweather_700Bold, useFonts } from "@expo-google-fonts/merriweather";
import { IntelOneMono_400Regular, IntelOneMono_700Bold } from "@expo-google-fonts/intel-one-mono";
import { Finlandica_400Regular, Finlandica_700Bold } from "@expo-google-fonts/finlandica";
import { IndieFlower_400Regular } from "@expo-google-fonts/indie-flower";
import { ThemeTransitionProvider } from "../src/contexts/theme-transition-context";
import { TourProvider } from "../src/features/tour/tour-context";
import { TourOverlay } from "../src/features/tour/tour-overlay";
import { ForceUpdateModal } from "../src/components/ui/force-update-modal";
import { NotificationPermissionModal } from "../src/components/ui/notification-permission-modal";
import { NotificationPermissionDeniedModal } from "../src/components/ui/notification-permission-denied-modal";
import { AuthPromptModal } from "../src/features/auth/components/auth-prompt-modal";
import { fetchAppConfigOrNull, isUpdateRequired } from "../src/lib/app-config";
import { initAnalytics } from "../src/lib/analytics";
import { useAuthSessionSync } from "../src/features/auth/hooks/use-auth-session-sync";
import { useGuestMigration } from "../src/features/auth/hooks/use-guest-migration";
import { useDhikrBackendSync } from "../src/features/dhikrs/hooks/use-dhikr-backend-sync";
import { useVirdBackendSync } from "../src/features/vird/hooks/use-vird-backend-sync";
import { useCircleSync } from "../src/features/circle/hooks/use-circle-sync";
import { useNotificationTapRouting } from "../src/features/notifications/hooks/use-notification-tap-routing";
import { usePushDeviceRegistration } from "../src/features/notifications/hooks/use-push-device-registration";
import { useBackendUserSync } from "../src/features/users/hooks/use-backend-user-sync";
import { useEventNotificationSync } from "../src/features/notifications/hooks/use-event-notification-sync";
import { useVirdReminderSync } from "../src/features/vird/hooks/use-vird-reminder-sync";
import { useDailyReminderSync } from "../src/features/notifications/hooks/use-daily-reminder-sync";
import { useTourNotificationOptIn } from "../src/features/tour/hooks/use-tour-notification-opt-in";
import { useStreakReminderSync } from "../src/features/home/hooks/use-streak-reminder-sync";
import { useWidgetSync } from "../src/features/widget/widget-sync";
import { useWidgetAnalytics } from "../src/features/widget/use-widget-analytics";
import { BadgeCelebrationHost } from "../src/features/stats/components/badge-celebration-host";
import { useThemePreferences } from "../src/hooks/use-theme-preferences";
import type { AppFontFamily } from "../src/store/theme-store";
import { useThemeStore } from "../src/store/theme-store";
import { useAppConfigStore } from "../src/store/app-config-store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

function RootProviders({ children }: { children: ReactNode }) {
  const { themeName, fontFamily } = useThemePreferences();
  const themeStoreHydrated = useThemeStore((s) => s.hasHydrated);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [fontsLoaded] = useFonts({
    Merriweather_400Regular,
    Merriweather_700Bold,
    IntelOneMono_400Regular,
    IntelOneMono_700Bold,
    Finlandica_400Regular,
    Finlandica_700Bold,
    IndieFlower_400Regular
  });
  useAuthSessionSync();
  // Order matters: migration drains the pending guest snapshot and gates
  // useDhikrBackendSync (ve aynı gate'i paylaşan useVirdBackendSync)
  // tamamlanana kadar (bkz. useGuestMigrationStore).
  useGuestMigration();
  useDhikrBackendSync();
  useVirdBackendSync();
  useCircleSync();
  useBackendUserSync();
  usePushDeviceRegistration();
  useEffect(() => {
    initAnalytics();
  }, []);
  useNotificationTapRouting();
  useStreakReminderSync();
  useWidgetSync();
  useWidgetAnalytics();
  useEventNotificationSync();
  useVirdReminderSync();
  useDailyReminderSync();
  const promptForDailyReminder = useTourNotificationOptIn();

  const resolvedFontFamily = resolveGlobalFontFamily(fontFamily, fontsLoaded);
  const resolvedStrongFontFamily = resolveGlobalStrongFontFamily(fontFamily, fontsLoaded);

  useEffect(() => {
    fetchAppConfigOrNull().then((config) => {
      if (config?.minVersion && isUpdateRequired(config.minVersion)) {
        setForceUpdate(true);
      }
      // Request failed (network error, non-2xx, bad JSON) -> config is null.
      // Leave the persisted flag untouched rather than resetting it to
      // false; a successful response always reflects the server's current
      // value (true OR false), enabling both roll-out and roll-back.
      if (config) {
        useAppConfigStore.getState().setServerPushEnabled(config.serverPushEnabled);
      }
    });
  }, []);

  useEffect(() => {
    // Some RN builds expose readonly defaults on native text components.
    // Keep this best-effort so startup never crashes if mutation is blocked.
    safeSetDefaultTextStyle(Text, resolvedFontFamily);
    safeSetDefaultTextStyle(TextInput, resolvedFontFamily);
  }, [resolvedFontFamily]);

  if (!themeStoreHydrated) {
    return <View style={{ flex: 1, backgroundColor: DEFAULT_BG_FALLBACK }} />;
  }

  return (
    <>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            themeName={themeName}
            fontSize="medium"
            textFontFamily={resolvedFontFamily}
            textFontFamilyStrong={resolvedStrongFontFamily}
          >
            <ThemeTransitionProvider>
              <TourProvider onComplete={promptForDailyReminder}>
                {children}
                <TourOverlay />
                <NotificationPermissionModal />
                <NotificationPermissionDeniedModal />
                <AuthPromptModal />
                <BadgeCelebrationHost />
              </TourProvider>
            </ThemeTransitionProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
      <ForceUpdateModal visible={forceUpdate} />
    </>
  );
}

export default function RootLayout() {
  return (
    <RootProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: DEFAULT_BG_FALLBACK }
        }}
      >
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="theme-selector" />
        <Stack.Screen name="font-selector" />
      </Stack>
    </RootProviders>
  );
}

// expo-router yakalar: RootLayout (dolayısıyla RootProviders içindeki
// ThemeProvider/I18nextProvider) render sırasında patlarsa bu bileşen
// devreye girer. O anda hiçbir provider garanti değildir — bu yüzden tema
// token'ı yerine DEFAULT_BG_FALLBACK + sabit renkler, react-i18next hook'u
// yerine ham `i18n.t` (senkron init edilmiş singleton, bkz. message-bubble.tsx
// ile aynı desen) kullanılır.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: DEFAULT_BG_FALLBACK, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: "#F5F5F5", fontSize: 18, fontWeight: "600", marginBottom: 8, textAlign: "center" }}>
        {i18n.t("common:errorBoundary.title")}
      </Text>
      <Text style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
        {error.message || i18n.t("common:errorBoundary.message")}
      </Text>
      <Pressable
        onPress={() => void retry()}
        style={{ borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#F5F5F5" }}
      >
        <Text style={{ color: "#0B1423", fontSize: 14, fontWeight: "600" }}>{i18n.t("common:errorBoundary.retry")}</Text>
      </Pressable>
    </View>
  );
}

function resolveGlobalFontFamily(fontFamily: AppFontFamily, fontsLoaded: boolean) {
  if (!fontsLoaded) {
    return undefined;
  }

  if (fontFamily === "merriweather") {
    return "Merriweather_400Regular";
  }

  if (fontFamily === "intel-one-mono") {
    return "IntelOneMono_400Regular";
  }

  if (fontFamily === "finlandica-headline") {
    return "Finlandica_400Regular";
  }

  if (fontFamily === "indie-flower") {
    return "IndieFlower_400Regular";
  }

  return undefined;
}

function resolveGlobalStrongFontFamily(fontFamily: AppFontFamily, fontsLoaded: boolean) {
  if (!fontsLoaded) {
    return undefined;
  }

  if (fontFamily === "merriweather") {
    return "Merriweather_700Bold";
  }

  if (fontFamily === "intel-one-mono") {
    return "IntelOneMono_700Bold";
  }

  if (fontFamily === "finlandica-headline") {
    return "Finlandica_700Bold";
  }

  if (fontFamily === "indie-flower") {
    return "IndieFlower_400Regular";
  }

  return undefined;
}

function safeSetDefaultTextStyle(component: unknown, resolvedFontFamily: string | undefined) {
  try {
    const target = component as { defaultProps?: Record<string, unknown> };
    target.defaultProps = target.defaultProps ?? {};
    target.defaultProps.style = resolvedFontFamily ? [{ fontFamily: resolvedFontFamily }] : undefined;
  } catch {
    // no-op: avoid app crash on platforms where defaultProps are immutable
  }
}
