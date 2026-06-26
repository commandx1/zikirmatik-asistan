import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Image, Pressable, Text, View } from "react-native";
import { useThemePreferences } from "../../../hooks/use-theme-preferences";

type ProfileUserCardProps = {
  displayName: string;
  profileImageUrl?: string;
  memberSinceLabel: string;
  isPremium: boolean;
  onPressUpgrade: () => void;
};

export function ProfileUserCard({
  displayName,
  profileImageUrl,
  memberSinceLabel,
  isPremium,
  onPressUpgrade
}: ProfileUserCardProps) {
  const { fontFamily } = useThemePreferences();
  const strongTextStyle =
    fontFamily === "merriweather"
      ? { fontFamily: "Merriweather_700Bold", fontWeight: "normal" as const }
      : fontFamily === "intel-one-mono"
        ? { fontFamily: "IntelOneMono_700Bold", fontWeight: "normal" as const }
        : fontFamily === "finlandica-headline"
          ? { fontFamily: "Finlandica_700Bold", fontWeight: "normal" as const }
          : fontFamily === "indie-flower"
            ? { fontFamily: "IndieFlower_400Regular", fontWeight: "normal" as const }
        : undefined;
  const normalizedProfileImageUrl = profileImageUrl?.trim();

  return (
    <View className="mt-2 items-center">
      <View className="relative mb-4">
        <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-[--accent]/30 bg-[--card]">
          {normalizedProfileImageUrl ? (
            <Image
              source={{ uri: normalizedProfileImageUrl }}
              className="h-full w-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <>
              <FontAwesome6 name="moon" size={34} color="#C8972A" />
              <FontAwesome6 name="plus" size={8} color="#C8972A" style={{ opacity: 0.18, position: "absolute", left: 22, top: 33 }} />
              <FontAwesome6 name="plus" size={8} color="#C8972A" style={{ opacity: 0.18, position: "absolute", right: 24, bottom: 30 }} />
            </>
          )}
        </View>
      </View>

      <Text className="mb-1 px-2 text-2xl leading-[34px] font-semibold tracking-tight text-center text-[--text-primary]" numberOfLines={2}>
        {displayName}
      </Text>
      <Text className="mb-3 text-sm leading-[18px] text-[--text-muted]">{memberSinceLabel}</Text>

      {isPremium ? (
        <View className="flex-row items-center gap-1.5 rounded-full bg-[--accent] px-4 py-1.5 shadow-md shadow-[#C8972A]/30">
          <FontAwesome6 name="star" iconStyle="solid" size={11} color="#0F1B2D" />
          <Text className="text-sm font-bold text-[#0F1B2D]" style={strongTextStyle}>Premium</Text>
        </View>
      ) : (
        <Pressable onPress={onPressUpgrade} className="rounded-full border border-[--accent]/20 bg-[--accent]/10 px-5 py-2">
          <Text className="text-sm font-semibold text-[--accent]">Premium'a Geç</Text>
        </Pressable>
      )}
    </View>
  );
}
