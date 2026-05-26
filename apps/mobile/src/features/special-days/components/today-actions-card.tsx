import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { ThemedCard } from "../../../components/ui/themed-card";
import type { TodayActionViewModel } from "../types/view-model";

type TodayActionsCardProps = {
  action: TodayActionViewModel;
  onPressDetail: (id: string) => void;
};

export function TodayActionsCard({ action, onPressDetail }: TodayActionsCardProps) {
  const { tokens } = useThemeTokens();

  return (
    <Pressable
      onPress={() => onPressDetail(action.specialDayId)}
      disabled={action.isLocked}
      className={action.isLocked ? "opacity-60" : undefined}
    >
      <ThemedCard className="rounded-2xl px-4 py-4" borderClassName="border-white/5">
        <Text className="text-sm font-semibold text-[--text-primary]">{action.title}</Text>
        <Text className="mt-1 text-xs leading-5 text-[--text-muted]">{action.subtitle}</Text>

        <Pressable
          onPress={() => onPressDetail(action.specialDayId)}
          disabled={action.isLocked}
          className={`mt-4 h-11 flex-row items-center justify-center gap-2 rounded-full border border-[--accent]/40 ${
            action.isLocked ? "opacity-60" : ""
          }`}
        >
          <FontAwesome6
            name={action.isLocked ? "lock" : "compass"}
            iconStyle="regular"
            size={12}
            color={tokens.accent}
          />
          <Text className="text-sm font-semibold text-[--accent]">{action.ctaLabel}</Text>
        </Pressable>
      </ThemedCard>
    </Pressable>
  );
}
