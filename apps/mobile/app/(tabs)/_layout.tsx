import { Tabs, usePathname } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { MoreMenu } from "../../src/components/ui/more-menu";
import { GlassTabBar, useGlassTabBarInset } from "../../src/components/ui/glass-tab-bar";

export default function TabsLayout() {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("common");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const pathname = usePathname();
  const isMoreMenuRoute = !["/home", "/focus", "/ai-guide", "/special-days"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const tabBarHeight = useGlassTabBarInset();

  // The auto-guest effect in the root layout (app/_layout.tsx) guarantees
  // authenticated-or-guest for every entry route, including a cold deep link
  // straight into (tabs), so no /auth redirect guard is needed here.
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
