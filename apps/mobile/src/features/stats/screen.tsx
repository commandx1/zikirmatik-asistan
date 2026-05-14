import { Text, View } from "react-native";
import { AppCard } from "@zikirmatik/ui";
import { formatCounter } from "@zikirmatik/shared";
import { PageHeader } from "../../components/ui/page-header";
import { ScreenFrame } from "../../components/ui/screen-frame";
import { useDailyStats } from "./hooks/use-daily-stats";

export function StatsScreen() {
  const stats = useDailyStats();

  return (
    <ScreenFrame contentClassName="w-full">
      <PageHeader title="İstatistikler" subtitle="Bugün ve bu hafta" />
      <View className="gap-5 px-5 pb-5">
        <AppCard className="gap-2">
          <Text className="text-3xl font-bold text-[--text-primary]">{stats.streakDays} gün seri</Text>
          <Text className="text-sm text-[--text-muted]">Haftalık toplam: {formatCounter(stats.weeklyTotal)}</Text>
          <Text className="text-sm text-[--text-muted]">Tamamlama: %{stats.completionRate}</Text>
        </AppCard>
        <View className="h-40 rounded-2xl border border-[--border] bg-[--card]" />
      </View>
    </ScreenFrame>
  );
}
