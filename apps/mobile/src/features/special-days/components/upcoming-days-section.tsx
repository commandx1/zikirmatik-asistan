import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedTag } from "../../../components/ui/themed-tag";
import type { UpcomingDayViewModel } from "../types/view-model";

type UpcomingDaysSectionProps = {
  days: UpcomingDayViewModel[];
  onPressDay: (id: string) => void;
};

function UpcomingDayCard({ day, onPress }: { day: UpcomingDayViewModel; onPress: (id: string) => void }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("special-days");

  return (
    <Pressable onPress={() => onPress(day.id)} disabled={day.isLocked}>
      <ThemedCard className="rounded-2xl px-4 py-4" borderClassName="border-white/5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full border border-[--accent]/20 bg-[--bg]">
            <FontAwesome6 name={day.icon} size={14} color={tokens.accent} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-start gap-2">
              <Text className="flex-1 text-base font-semibold leading-6 text-[--text-primary]">{day.title}</Text>
              {day.isLocked ? (
                <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-[--bg]">
                  <FontAwesome6 name="lock" size={10} color={tokens.textMuted} />
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-xs leading-5 text-[--text-muted]">{day.dateLabel}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-end">
          <ThemedTag label={day.isLocked ? t("special-days:upcoming.premiumLocked") : day.remaining} className="bg-[--bg] px-3 py-[6px]" />
        </View>
      </ThemedCard>
    </Pressable>
  );
}

export function UpcomingDaysSection({ days, onPressDay }: UpcomingDaysSectionProps) {
  const { t } = useTranslation("special-days");
  return (
    <View className="gap-3">
      <Text className="px-1 text-sm font-semibold text-[--text-primary]">{t("special-days:upcoming.title")}</Text>
      <View className="gap-3">
        {days.map((day) => (
          <UpcomingDayCard key={day.id} day={day} onPress={onPressDay} />
        ))}
      </View>
    </View>
  );
}
