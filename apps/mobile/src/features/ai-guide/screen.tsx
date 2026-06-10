import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";

const DailyEsmaWelcomeModal = lazy(() =>
  import("../home/components/daily-esma-welcome-modal").then((m) => ({ default: m.DailyEsmaWelcomeModal }))
);
import { ESMAUL_HUSNA } from "../focus/data";
import type { EsmaulHusnaItem } from "../focus/types";
import { resolveDailyEsmaSuggestions } from "../home/services/daily-esma-suggestion-service";
import { useHomeNavigationIntentStore } from "../home/services/home-navigation-intent-store";
import { DailyEsmaShortcutCard } from "./components/daily-esma-shortcut-card";
import { HistorySection } from "./components/history-section";
import { InfoTooltip } from "./components/info-tooltip";
import { IntentInputSection } from "./components/intent-input-section";
import { LoadingSection } from "./components/loading-section";
import { RecommendationsSection } from "./components/recommendations-section";
import { RewardedGateSheet } from "./components/rewarded-gate-sheet";
import { TopBar } from "./components/top-bar";
import { useAiGuide } from "./hooks/use-ai-guide";

export function AiGuideScreen() {
  const router = useRouter();
  const guide = useAiGuide();
  const scrollRef = useRef<ScrollView>(null);
  const [isDailyEsmaOpen, setDailyEsmaOpen] = useState(false);

  useEffect(() => {
    if (guide.isLoading) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [guide.isLoading]);
  const dailyEsmaSuggestions = useMemo(() => resolveDailyEsmaSuggestions(ESMAUL_HUSNA, new Date()), []);
  const requestDailyEsmaStart = useHomeNavigationIntentStore((state) => state.requestDailyEsmaStart);
  const requestEsmaListFocus = useHomeNavigationIntentStore((state) => state.requestEsmaListFocus);

  const closeDailyEsma = () => {
    setDailyEsmaOpen(false);
  };

  const showAllDailyEsma = () => {
    setDailyEsmaOpen(false);
    requestEsmaListFocus();
    router.push("/(tabs)/home");
  };

  const startDailyEsma = (item: EsmaulHusnaItem) => {
    setDailyEsmaOpen(false);
    requestDailyEsmaStart(item);
    router.push("/(tabs)/home");
  };

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <TopBar onInfoPress={guide.toggleInfo} />
        <InfoTooltip visible={guide.showInfo} />

        <PageScrollView
          scrollRef={scrollRef}
          contentInnerClassName="w-full px-5"
          keyboardShouldPersistTaps="handled"
          bottomPadding={32}
          onRefresh={guide.refresh}
          refreshing={guide.isRefreshing}
          onScrollBeginDrag={guide.closeInfo}
        >
          <IntentInputSection
            value={guide.intentInput}
            isLoading={guide.isLoading}
            onChangeValue={guide.onIntentInputChange}
            onSend={guide.submitIntent}
            onSelectPrompt={guide.applyPrompt}
          />
          <DailyEsmaShortcutCard onPress={() => setDailyEsmaOpen(true)} />
          <HistorySection
            items={guide.visibleHistoryItems}
            totalCount={guide.historyItems.length}
            isExpanded={guide.isHistoryExpanded}
            activeRecommendationId={guide.recommendationId}
            onToggleExpanded={guide.toggleHistoryExpanded}
            onOpenHistoryItem={guide.openHistoryItem}
          />
          {guide.error ? (
            <View className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
              <Text className="text-[12px] text-[#fecaca]">{guide.error}</Text>
            </View>
          ) : null}
          <LoadingSection visible={guide.isLoading} />
          {guide.isLoading ? null : guide.offTopicMessage ? (
            <View className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-4">
              <View className="mb-2 flex-row items-center gap-2">
                <FontAwesome6 name="circle-exclamation" size={14} color="#f87171" />
                <Text className="text-[13px] font-semibold text-red-400">
                  Konu dışı
                </Text>
              </View>
              <Text className="text-[13px] leading-5 text-red-200/80">
                {guide.offTopicMessage}
              </Text>
            </View>
          ) : (
            <RecommendationsSection
              items={guide.recommendations}
              assistantNote={guide.assistantNote}
              onSelectRecommendation={(item) => {
                guide.selectRecommendation(item);
                router.push("/(tabs)/home");
              }}
            />
          )}
        </PageScrollView>

        <RewardedGateSheet
          visible={guide.isRewardedSheetOpen}
          isRunning={guide.isRewardedRunning}
          onConfirm={guide.confirmRewardedAndSubmit}
          onClose={guide.closeRewardedSheet}
        />
        <Suspense fallback={null}>
        <DailyEsmaWelcomeModal
          visible={isDailyEsmaOpen}
          items={dailyEsmaSuggestions}
          onDismiss={closeDailyEsma}
          onShowAll={showAllDailyEsma}
          onStart={startDailyEsma}
        />
        </Suspense>

      </View>
    </PageLayout>
  );
}
