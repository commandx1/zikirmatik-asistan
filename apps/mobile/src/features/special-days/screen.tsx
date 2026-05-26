import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { HeroCountdownCard } from "./components/hero-countdown-card";
import { SpecialDaysHeader } from "./components/special-days-header";
import { TodayActionsCard } from "./components/today-actions-card";
import { UpcomingDaysSection } from "./components/upcoming-days-section";
import { useSpecialDays } from "./hooks/use-special-days";

export function SpecialDaysScreen() {
  const router = useRouter();
  const specialDays = useSpecialDays();

  return (
    <PageLayout>
      <PageScrollView contentInnerClassName="w-full" onRefresh={specialDays.refresh} refreshing={specialDays.isLoading}>
        <View className="w-full">
          <SpecialDaysHeader />
          <View className="gap-6 px-5 pb-8">
            {specialDays.error ? (
              <View className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3">
                <Text className="text-[12px] text-[#fecaca]">{specialDays.error}</Text>
              </View>
            ) : null}
            <HeroCountdownCard
              data={specialDays.heroCard}
              onPressDetail={(id) => router.push(`/special-days/${id}`)}
            />
            {specialDays.todayAction ? (
              <TodayActionsCard
                action={specialDays.todayAction}
                onPressDetail={(id) => router.push(`/special-days/${id}`)}
              />
            ) : null}
            {specialDays.hasUpcomingItems ? (
              <UpcomingDaysSection
                days={specialDays.upcomingDays}
                onPressDay={(id) => router.push(`/special-days/${id}`)}
              />
            ) : null}
          </View>
        </View>
      </PageScrollView>
    </PageLayout>
  );
}
