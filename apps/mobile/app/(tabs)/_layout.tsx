import { Redirect, Tabs, usePathname } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { useAuthStore } from "../../src/store/auth-store";
import { MoreMenu } from "../../src/components/ui/more-menu";
import { GlassTabBar, useGlassTabBarInset } from "../../src/components/ui/glass-tab-bar";

export default function TabsLayout() {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("common");
  const authStatus = useAuthStore((s) => s.status);
  const guestMode = useAuthStore((s) => s.guestMode);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const pathname = usePathname();
  const isMoreMenuRoute = !["/home", "/focus", "/ai-guide", "/special-days"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const tabBarHeight = useGlassTabBarInset();

  if (authStatus !== "authenticated" && !guestMode) {
    return <Redirect href="/auth" />;
  }

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: tokens.bg },
        }}
        tabBar={(props) => (
          <GlassTabBar
            {...props}
            onMorePress={() => setMoreMenuOpen((v) => !v)}
            moreActive={moreMenuOpen || isMoreMenuRoute}
          />
        )}
      >
        <Tabs.Screen name="home" options={{ title: t("common:nav.home") }} />
        <Tabs.Screen name="focus" options={{ title: t("common:nav.focus") }} />
        <Tabs.Screen name="ai-guide" options={{ title: t("common:nav.aiGuide") }} />
        <Tabs.Screen name="special-days" options={{ title: t("common:nav.specialDays") }} />
        <Tabs.Screen name="profile" options={{ title: t("common:nav.more") }} />
        <Tabs.Screen
          name="collections"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            href: null
          }}
        />
      </Tabs>
      <MoreMenu open={moreMenuOpen} tabBarHeight={tabBarHeight} onClose={() => setMoreMenuOpen(false)} />
    </View>
  );
}
