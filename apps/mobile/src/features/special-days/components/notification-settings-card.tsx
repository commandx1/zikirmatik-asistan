import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { Text, View } from "react-native";
import { ThemedCard } from "../../../components/ui/themed-card";
import { TogglePill } from "./toggle-pill";

type NotificationSettingsCardProps = {
  enabled: boolean;
  onToggle: (nextValue: boolean) => void;
};

export function NotificationSettingsCard({ enabled, onToggle }: NotificationSettingsCardProps) {
  const { tokens } = useThemeTokens();

  return (
    <ThemedCard className="flex-row items-center justify-between rounded-2xl px-4 py-4" borderClassName="border-white/5">
      <View className="flex-1 flex-row items-center gap-3 pr-3">
        <View className="h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[--bg]">
          <FontAwesome6 name="bell" iconStyle="regular" size={12} color={tokens.textMuted} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-[--text-primary]">Kandil bildirimlerini al</Text>
          <Text className="pt-1 text-[11px] text-[--text-muted]">Kandilden 1 gün ve 1 saat önce bildirim</Text>
        </View>
      </View>

      <TogglePill
        checked={enabled}
        onToggle={onToggle}
        size="compact"
        knobSize={14}
        activeTrackClassName="bg-[--success]"
        inactiveTrackClassName="bg-[--bg]"
      />
    </ThemedCard>
  );
}
