import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { CurrentStateCard } from "./components/current-state-card";
import { InfoTooltip } from "./components/info-tooltip";
import { LoadingSection } from "./components/loading-section";
import { MoodInputSection } from "./components/mood-input-section";
import { RecommendationsSection } from "./components/recommendations-section";
import { RewardedGateSheet } from "./components/rewarded-gate-sheet";
import { TopBar } from "./components/top-bar";
import { VerificationFooter } from "./components/verification-footer";
import { useAiGuide } from "./hooks/use-ai-guide";

export function AiGuideScreen() {
  const router = useRouter();
  const guide = useAiGuide();

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <TopBar onInfoPress={guide.toggleInfo} />
        <InfoTooltip visible={guide.showInfo} />

        <PageScrollView
          contentInnerClassName="w-full px-5"
          keyboardShouldPersistTaps="handled"
          bottomPadding={32}
          onRefresh={guide.refresh}
          refreshing={guide.isRefreshing}
          onScrollBeginDrag={guide.closeInfo}
        >
          <CurrentStateCard
            moodTitle={guide.selectedMood}
            moodEmoji={guide.moodEmoji}
            prayerTimeLabel={guide.prayerTimeLabel}
            weekdayLabel={guide.weekdayLabel}
          />
          <MoodInputSection
            value={guide.moodInput}
            isLoading={guide.isLoading}
            onChangeValue={guide.onMoodInputChange}
            onSend={guide.submitMood}
            onSelectPrompt={guide.applyPrompt}
          />
          {guide.error ? (
            <View className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
              <Text className="text-[12px] text-[#fecaca]">{guide.error}</Text>
            </View>
          ) : null}
          <LoadingSection visible={guide.isLoading} />
          {guide.isLoading ? null : (
            <RecommendationsSection
              items={guide.recommendations}
              onSelectRecommendation={(item) => {
                guide.selectRecommendation(item);
                router.push("/(tabs)/home");
              }}
            />
          )}
          <VerificationFooter />
        </PageScrollView>

        <RewardedGateSheet
          visible={guide.isRewardedSheetOpen}
          isRunning={guide.isRewardedRunning}
          onConfirm={guide.confirmRewardedAndSubmit}
          onClose={guide.closeRewardedSheet}
        />
      </View>
    </PageLayout>
  );
}
