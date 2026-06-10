import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Redirect, Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { useThemePreferences } from "../../src/hooks/use-theme-preferences";
import { useAuthStore } from "../../src/store/auth-store";

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

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  const androidTabBarExtraBottom = Platform.OS === "android" ? Math.max(insets.bottom, 8) : 0;
  const tabLabelFontFamily = TAB_FONT_FAMILY_MAP[fontFamily];
  const tabLabelStyle = tabLabelFontFamily
    ? { fontSize: 10, fontFamily: tabLabelFontFamily, fontWeight: "normal" as const }
    : { fontSize: 10, fontWeight: "500" as const };

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
            height: 74 + androidTabBarExtraBottom,
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
            title: "Profil",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="user" regular activeColor={tokens.accent} inactiveColor={tokens.textPrimary} />
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            href: null
          }}
        />
      </Tabs>
    </View>
  );
}
