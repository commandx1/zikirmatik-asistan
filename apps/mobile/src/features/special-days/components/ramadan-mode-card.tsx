import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedCard } from "../../../components/ui/themed-card";
import { TogglePill } from "./toggle-pill";
import { useLocaleUpper } from "../../../hooks/use-locale-upper";

type RamadanModeCardProps = {
  enabled: boolean;
  showCta?: boolean;
  onToggle: (nextValue: boolean) => void;
};

export function RamadanModeCard({ enabled, showCta = true, onToggle }: RamadanModeCardProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("special-days");
  const upper = useLocaleUpper();

  return (
    <ThemedCard className="overflow-hidden rounded-[20px] p-5" borderClassName="border-[--success]/35">
      <View className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-[--success]/20" />
      <View className="absolute right-[-16px] top-[-16px] h-16 w-16 rounded-full bg-[--bg]/70" />

      <View className="relative z-10 mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <FontAwesome6 name="moon" size={16} color={tokens.success} />
          <Text className="text-base font-bold text-[--text-primary]">{t("special-days:ramadanMode.title")}</Text>
        </View>
        <TogglePill
          checked={enabled}
          onToggle={onToggle}
          activeTrackClassName="bg-[--success]"
          inactiveTrackClassName="bg-[--bg]"
        />
      </View>

      <View className="relative z-10 flex-row rounded-xl border border-white/5 bg-[--bg]/30 px-4 py-3">
        <View className="flex-1 items-center border-r border-white/10">
          <Text className="text-xs tracking-[1px] text-[--text-muted]">{upper(t("special-days:ramadanMode.sahur"))}</Text>
          <Text className="pt-1 text-lg font-semibold text-[--text-primary]">04:23</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xs tracking-[1px] text-[--text-muted]">{upper(t("special-days:ramadanMode.iftar"))}</Text>
          <Text className="pt-1 text-lg font-semibold text-[--text-primary]">19:45</Text>
        </View>
      </View>

      {enabled && showCta ? (
        <View className="relative z-10 mt-4 border-t border-white/10 pt-4">
          <View className="h-10 items-center justify-center rounded-full bg-[--success]">
            <Text className="text-sm font-medium" style={{ color: tokens.bg }}>
              {t("special-days:ramadanMode.cta")}
            </Text>
          </View>
        </View>
      ) : null}
    </ThemedCard>
  );
}
