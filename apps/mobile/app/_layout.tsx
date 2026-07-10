import "../global.css";

import { useEffect, useState, type ReactNode } from "react";
import { Stack } from "expo-router";
import { Text, TextInput, View } from "react-native";
import * as Notifications from "expo-notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@zikirmatik/ui";
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
import { fetchMinRequiredVersion, isUpdateRequired } from "../src/lib/app-config";
import { useAuthSessionSync } from "../src/features/auth/hooks/use-auth-session-sync";
import { useGuestMigration } from "../src/features/auth/hooks/use-guest-migration";
import { useDhikrBackendSync } from "../src/features/dhikrs/hooks/use-dhikr-backend-sync";
import { useUserPreferencesSync } from "../src/features/users/hooks/use-user-preferences-sync";
import { useTourNotificationOptIn } from "../src/features/tour/hooks/use-tour-notification-opt-in";
import { useThemePreferences } from "../src/hooks/use-theme-preferences";
import type { AppFontFamily } from "../src/store/theme-store";
import { useThemeStore } from "../src/store/theme-store";

const queryClient = new QueryClient();

// Matches the default theme's bg (packages/shared/src/utils/theme.ts) and
// android.adaptiveIcon.backgroundColor in app.json — used before ThemeProvider
// mounts, so it can't read theme tokens yet.
const FALLBACK_BACKGROUND_COLOR = "#0B1423";

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
  // useDhikrBackendSync until it completes (see useGuestMigrationStore).
  useGuestMigration();
  useDhikrBackendSync();
  useUserPreferencesSync();
  const promptForDailyReminder = useTourNotificationOptIn();

  const resolvedFontFamily = resolveGlobalFontFamily(fontFamily, fontsLoaded);
  const resolvedStrongFontFamily = resolveGlobalStrongFontFamily(fontFamily, fontsLoaded);

  useEffect(() => {
    fetchMinRequiredVersion().then((minVersion) => {
      console.log(minVersion, 'MIN VERSION')
      if (minVersion && isUpdateRequired(minVersion)) {
        setForceUpdate(true);
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
    return <View style={{ flex: 1, backgroundColor: FALLBACK_BACKGROUND_COLOR }} />;
  }

  return (
    <>
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
            </TourProvider>
          </ThemeTransitionProvider>
        </ThemeProvider>
      </QueryClientProvider>
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
          contentStyle: { backgroundColor: FALLBACK_BACKGROUND_COLOR }
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
