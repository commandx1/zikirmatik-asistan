import "../global.css";

import { useEffect, type ReactNode } from "react";
import { Stack } from "expo-router";
import { Text, TextInput } from "react-native";
import * as Notifications from "expo-notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@zikirmatik/ui";
import { Merriweather_400Regular, Merriweather_700Bold, useFonts } from "@expo-google-fonts/merriweather";
import { IntelOneMono_400Regular, IntelOneMono_700Bold } from "@expo-google-fonts/intel-one-mono";
import { Finlandica_400Regular, Finlandica_700Bold } from "@expo-google-fonts/finlandica";
import { IndieFlower_400Regular } from "@expo-google-fonts/indie-flower";
import { useAuthSessionSync } from "../src/features/auth/hooks/use-auth-session-sync";
import { useDhikrBackendSync } from "../src/features/dhikrs/hooks/use-dhikr-backend-sync";
import { useUserPreferencesSync } from "../src/features/users/hooks/use-user-preferences-sync";
import { useThemePreferences } from "../src/hooks/use-theme-preferences";
import type { AppFontFamily } from "../src/store/theme-store";
import { useThemeStore } from "../src/store/theme-store";

const queryClient = new QueryClient();

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
  useDhikrBackendSync();
  useUserPreferencesSync();

  const resolvedFontFamily = resolveGlobalFontFamily(fontFamily, fontsLoaded);
  const resolvedStrongFontFamily = resolveGlobalStrongFontFamily(fontFamily, fontsLoaded);

  useEffect(() => {
    // Some RN builds expose readonly defaults on native text components.
    // Keep this best-effort so startup never crashes if mutation is blocked.
    safeSetDefaultTextStyle(Text, resolvedFontFamily);
    safeSetDefaultTextStyle(TextInput, resolvedFontFamily);
  }, [resolvedFontFamily]);

  if (!themeStoreHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        themeName={themeName}
        fontSize="medium"
        textFontFamily={resolvedFontFamily}
        textFontFamilyStrong={resolvedStrongFontFamily}
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <RootProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
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
