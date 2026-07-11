import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SectionHeader, useThemeTokens } from "@zikirmatik/ui";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import { ActivityHeatmap } from "./components/activity-heatmap";
import { BadgesRow } from "./components/badges-row";
import { DailyBarChart } from "./components/daily-bar-chart";
import { HourDistribution } from "./components/hour-distribution";
import { PeriodComparison } from "./components/period-comparison";
import { PremiumLockOverlay } from "./components/premium-lock-overlay";
import { SourceDonut } from "./components/source-donut";
import { SummaryCards } from "./components/summary-cards";
import { TopDhikrsList } from "./components/top-dhikrs-list";
import { WeekdayDistribution } from "./components/weekday-distribution";
import { useStats } from "./hooks/use-stats";
import { useAuthStore } from "../../store/auth-store";

function Section({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View>
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </View>
  );
}

export function StatsScreen() {
  const { tokens } = useThemeTokens();
  const { data, isLoading, isRefreshing, error, isPremium, refresh } = useStats();
  const guestMode = useAuthStore((s) => s.guestMode);
  const authStatus = useAuthStore((s) => s.status);
  const premiumSheet = usePremiumSheet();
  const isGuest = guestMode && authStatus !== "authenticated";

  const headerSubtitle = data
    ? isGuest
      ? "Yerel istatistikler"
      : `${data.streak.currentStreak} günlük seri · tüm zamanlar`
    : "Tüm zamanlar özeti";

  return (
    <PageLayout>
      <PageScrollView contentInnerClassName="w-full" onRefresh={refresh} refreshing={isRefreshing}>
      <PageHeader title="İstatistikler" subtitle={headerSubtitle} />

      {isLoading && !data ? (
        <View className="items-center justify-center py-24">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : error && !data ? (
        <View className="items-center justify-center gap-3 px-5 py-24">
          <Text className="text-center text-sm text-[--text-muted]">{error}</Text>
          <Pressable
            onPress={refresh}
            className="rounded-full px-5 py-2.5"
            style={{ backgroundColor: tokens.accent }}
            accessibilityRole="button"
            accessibilityLabel="Tekrar dene"
          >
            <Text className="text-sm font-bold" style={{ color: tokens.bg }}>
              Tekrar dene
            </Text>
          </Pressable>
        </View>
      ) : data ? (
        <View className="gap-6 px-5 pb-10">
          <SummaryCards summary={data} />

          <Section title="Günlük aktivite" subtitle="Çekilen zikir sayısı">
            <DailyBarChart series={data.dailySeries} />
          </Section>

          <Section title="Aktivite takvimi" subtitle="Son 1 yılın günlük yoğunluğu">
            <PremiumLockOverlay locked={!isPremium} onUnlock={premiumSheet.open}>
              <ActivityHeatmap heatmap={data.heatmap} />
            </PremiumLockOverlay>
          </Section>

          <Section title="Dönem karşılaştırması" subtitle="Önceki döneme göre değişim">
            <PremiumLockOverlay locked={!isPremium} onUnlock={premiumSheet.open}>
              <PeriodComparison comparison={data.comparison} />
            </PremiumLockOverlay>
          </Section>

          <Section title="En aktif günler" subtitle="Haftanın günlerine göre">
            <PremiumLockOverlay locked={!isPremium} onUnlock={premiumSheet.open}>
              <WeekdayDistribution distribution={data.weekdayDistribution} />
            </PremiumLockOverlay>
          </Section>

          <Section title="En aktif saatler" subtitle="Günün saatlerine göre">
            <PremiumLockOverlay locked={!isPremium} onUnlock={premiumSheet.open}>
              <HourDistribution distribution={data.hourDistribution} />
            </PremiumLockOverlay>
          </Section>

          <Section title="Kaynak dağılımı" subtitle="Zikirleri nereden başlattın">
            <PremiumLockOverlay locked={!isPremium} onUnlock={premiumSheet.open}>
              <SourceDonut breakdown={data.sourceBreakdown} />
            </PremiumLockOverlay>
          </Section>

          <Section title="En çok çekilen zikirler" subtitle="Tüm zamanların liderleri">
            <PremiumLockOverlay locked={!isPremium} onUnlock={premiumSheet.open}>
              <TopDhikrsList items={data.topDhikrs} />
            </PremiumLockOverlay>
          </Section>

          <Section title="Rozetler" subtitle="Ulaştığın kilometre taşları">
            <BadgesRow badges={data.badges} />
          </Section>
        </View>
      ) : null}
      </PageScrollView>

      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        topupProducts={premiumSheet.topupProducts}
        purchasingTopupId={premiumSheet.purchasingTopupId}
        topupError={premiumSheet.topupError}
        onPurchaseTopup={(productId) => {
          void premiumSheet.purchaseTopup(productId).then((purchased) => {
            if (purchased) premiumSheet.close();
          });
        }}
      />
    </PageLayout>
  );
}
