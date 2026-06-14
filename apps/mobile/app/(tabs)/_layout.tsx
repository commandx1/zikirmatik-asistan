import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Redirect, Tabs } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { useThemePreferences } from "../../src/hooks/use-theme-preferences";
import { useAuthStore } from "../../src/store/auth-store";
import { MoreMenu } from "../../src/components/ui/more-menu";

const TAB_FONT_FAMILY_MAP: Record<string, string | undefined> = {
  merriweather: "Merriweather_400Regular",
  "intel-one-mono": "IntelOneMono_400Regular",
  "finlandica-headline": "Finlandica_400Regular",
  "indie-flower": "IndieFlower_400Regular",
};

type TabIconProps = {
  focused: boolean;
  name: "house" | "list-ul" | "sparkles" | "moon" | "user";
  activeColor: string;
  inactiveColor: string;
  regular?: boolean;
};

function TabIcon({ focused, name, activeColor, inactiveColor, regular = false }: TabIconProps) {
  return (
    <FontAwesome6
      name={name}
      size={19}
      color={focused ? activeColor : inactiveColor}
      iconStyle={regular ? "regular" : "solid"}
      style={{ opacity: focused ? 1 : 0.6, marginBottom: 2 }}
    />
  );
}

export default function TabsLayout() {
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { fontFamily } = useThemePreferences();
  const authStatus = useAuthStore((s) => s.status);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  const androidTabBarExtraBottom = Platform.OS === "android" ? Math.max(insets.bottom, 8) : 0;
  const tabBarHeight = 74 + (Platform.OS === "android" ? androidTabBarExtraBottom : insets.bottom);
  const tabLabelFontFamily = TAB_FONT_FAMILY_MAP[fontFamily];
  const tabLabelStyle = tabLabelFontFamily
    ? { fontSize: 10, fontFamily: tabLabelFontFamily, fontWeight: "normal" as const }
    : { fontSize: 10, fontWeight: "500" as const };

  const dahaFazlaColor = moreMenuOpen ? tokens.accent : tokens.textPrimary;

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: tokens.accent,
          tabBarInactiveTintColor: tokens.textPrimary,
          tabBarStyle: {
            backgroundColor: tokens.bg,
            borderTopColor: "rgba(255,255,255,0.07)",
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: Platform.OS === "android" ? androidTabBarExtraBottom : 8
          },
          tabBarLabelStyle: {
            ...tabLabelStyle
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Ana Sayfa",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="house" activeColor={tokens.accent} inactiveColor={tokens.textPrimary} />
          }}
        />
        <Tabs.Screen
          name="focus"
          options={{
            title: "Zikirlerim",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="list-ul" activeColor={tokens.accent} inactiveColor={tokens.textPrimary} />
          }}
        />
        <Tabs.Screen
          name="ai-guide"
          options={{
            title: "Asistan Rehber",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="sparkles" activeColor={tokens.accent} inactiveColor={tokens.textPrimary} />
          }}
        />
        <Tabs.Screen
          name="special-days"
          options={{
            title: "Özel Günler",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="moon" activeColor={tokens.accent} inactiveColor={tokens.textPrimary} />
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Daha Fazla",
            tabBarButton: ({ style }) => (
              <Pressable
                style={[style, { alignItems: "center", justifyContent: "center" }]}
                onPress={() => setMoreMenuOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Daha Fazla"
              >
                <FontAwesome6
                  name="ellipsis"
                  size={19}
                  color={dahaFazlaColor}
                  iconStyle="solid"
                  style={{ opacity: moreMenuOpen ? 1 : 0.6, marginBottom: 2 }}
                />
                <Text style={{ ...tabLabelStyle, color: dahaFazlaColor }}>
                  Daha Fazla
                </Text>
              </Pressable>
            ),
          }}
        />
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
