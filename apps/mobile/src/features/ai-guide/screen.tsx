import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { DhikrResumeModal } from "../../components/ui/dhikr-resume-modal";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { UnsavedDhikrTransitionModal } from "../../components/ui/unsaved-dhikr-transition-modal";
import { useAuthStore } from "../../store/auth-store";
import { createDhikrLog } from "../dhikrs/services/dhikr-logs-api-client";

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
import { TopBar } from "./components/top-bar";
import { useAiGuide } from "./hooks/use-ai-guide";
import { useDhikrStartGuard } from "../../hooks/use-dhikr-start-guard";
import { useDhikrStore } from "../../store/dhikr-store";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import type { AiGuideRecommendation } from "./types";

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AiGuideScreen() {
  const router = useRouter();
  const premiumSheet = usePremiumSheet();
  const guide = useAiGuide(premiumSheet.open);
  const guard = useDhikrStartGuard();
  const clearDhikrProgress = useDhikrStore(s => s.clearDhikrProgress);
  const storeItems = useDhikrStore(s => s.items);
  const selectedDhikrId = useDhikrStore(s => s.selectedDhikrId);
  const activeAiContext = useDhikrStore(s => s.activeAiContext);
  const unsavedProgressDhikrIds = useDhikrStore(s => s.unsavedProgressDhikrIds);
  const freeModeCount = useDhikrStore(s => s.freeModeCount);
  const discardUnsavedProgress = useDhikrStore(s => s.discardUnsavedProgress);
  const clearFreeModeSession = useDhikrStore(s => s.clearFreeModeSession);
  const applySavedBackendLog = useDhikrStore(s => s.applySavedBackendLog);
  const authStatus = useAuthStore(s => s.status);
  const sessionUserId = useAuthStore(s => s.session?.userId);
  const sessionAccessToken = useAuthStore(s => s.session?.accessToken);
  const scrollRef = useRef<ScrollView>(null);
  const loadingSectionY = useRef(0);
  const [isDailyEsmaOpen, setDailyEsmaOpen] = useState(false);
  const [pendingRecommendation, setPendingRecommendation] = useState<AiGuideRecommendation | null>(null);
  const [isSavingUnsaved, setIsSavingUnsaved] = useState(false);
  const [unsavedSaveError, setUnsavedSaveError] = useState<string | null>(null);

  const proceedWithRecommendation = (item: AiGuideRecommendation) => {
    guard.guardedStart({
      id: item.id,
      dhikrName: item.title ?? item.transliteration,
      onFresh: () => {
        clearDhikrProgress(item.id);
        guide.selectRecommendation(item);
        router.push("/(tabs)/home");
      },
      onContinue: () => {
        guide.selectRecommendation(item);
        router.push("/(tabs)/home");
      }
    });
  };

  const handleSelectRecommendation = (item: AiGuideRecommendation) => {
    const isSameTarget = item.id === selectedDhikrId;
    const hasUnsaved = !isSameTarget && (
      selectedDhikrId
        ? unsavedProgressDhikrIds.includes(selectedDhikrId)
        : freeModeCount > 0
    );

    if (hasUnsaved) {
      setPendingRecommendation(item);
      setUnsavedSaveError(null);
      return;
    }

    proceedWithRecommendation(item);
  };

  const handleUnsavedSaveAndContinue = async () => {
    const item = pendingRecommendation;
    if (!item || isSavingUnsaved) return;

    const selectedDhikr = storeItems.find(d => d.id === selectedDhikrId);
    if (!selectedDhikr || authStatus !== "authenticated" || !sessionUserId) {
      setUnsavedSaveError("Kaydetmek için giriş yapmalısın.");
      return;
    }

    setIsSavingUnsaved(true);
    setUnsavedSaveError(null);

    const count = Math.max(0, Math.floor(selectedDhikr.current));
    const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, count) : count;
    const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target;
    const aiCtx = activeAiContext?.dhikrId === selectedDhikr.id
      ? { source: "ai" as const, aiRecommendationId: activeAiContext.recommendationId, aiPrompt: activeAiContext.prompt, aiAssistantNote: activeAiContext.assistantNote }
      : { source: "manual" as const };
    const isObjectId = /^[a-f\d]{24}$/i.test(selectedDhikr.id);
    const dateKey = toDateKey(new Date());

    try {
      const savedLog = await createDhikrLog(
        isObjectId
          ? { userId: sessionUserId, dhikrId: selectedDhikr.id, count: safeCount, targetCount: selectedDhikr.target, date: dateKey, ...aiCtx, isCompleted, isFavorite: selectedDhikr.isFavorite }
          : { userId: sessionUserId, customDhikrId: selectedDhikr.id, customDhikrName: selectedDhikr.nameTurkish || selectedDhikr.transliteration, count: safeCount, targetCount: selectedDhikr.target, date: dateKey, ...aiCtx, isCompleted: false, isFavorite: selectedDhikr.isFavorite },
        sessionAccessToken
      );
      applySavedBackendLog(savedLog);
      setPendingRecommendation(null);
      proceedWithRecommendation(item);
    } catch (e) {
      setUnsavedSaveError(e instanceof Error ? e.message : "Zikir kaydedilemedi.");
    } finally {
      setIsSavingUnsaved(false);
    }
  };

  useEffect(() => {
    if (guide.isLoading) {
      setTimeout(
        () => scrollRef.current?.scrollTo({ y: Math.max(0, loadingSectionY.current - 16), animated: true }),
        120,
      );
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
              <Text className="text-sm text-[#fecaca]">{guide.error}</Text>
            </View>
          ) : null}
          <View onLayout={(e) => { loadingSectionY.current = e.nativeEvent.layout.y; }}>
            <LoadingSection visible={guide.isLoading} stepMessage={guide.loadingStep} />
          </View>
          {guide.isLoading ? null : guide.offTopicMessage ? (
            <View className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-4">
              <View className="mb-2 flex-row items-center gap-2">
                <FontAwesome6 name="circle-exclamation" size={14} color="#f87171" />
                <Text className="text-sm font-semibold text-red-400">
                  Konu dışı
                </Text>
              </View>
              <Text className="text-sm leading-5 text-red-200/80">
                {guide.offTopicMessage}
              </Text>
            </View>
          ) : guide.clarification ? (
            <View className="mb-4 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-4">
              <View className="mb-2 flex-row items-center gap-2">
                <FontAwesome6 name="circle-question" size={14} color="#fbbf24" />
                <Text className="text-sm font-semibold text-amber-400">
                  Biraz daha netleştirelim
                </Text>
              </View>
              <Text className="mb-3 text-sm leading-5 text-amber-100/80">
                {guide.clarification.message}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {guide.clarification.suggestedCategories.map((category) => (
                  <View
                    key={category}
                    onTouchEnd={() => void guide.submitClarificationCategory(category)}
                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5"
                  >
                    <Text className="text-xs font-medium text-amber-200">{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <RecommendationsSection
              items={guide.recommendations}
              assistantNote={guide.assistantNote}
              onSelectRecommendation={handleSelectRecommendation}
            />
          )}
        </PageScrollView>

        <UnsavedDhikrTransitionModal
          visible={Boolean(pendingRecommendation)}
          dhikrName={storeItems.find(d => d.id === selectedDhikrId)?.nameTurkish ?? ""}
          count={storeItems.find(d => d.id === selectedDhikrId)?.current ?? freeModeCount}
          isSaving={isSavingUnsaved}
          error={unsavedSaveError}
          onSaveAndContinue={handleUnsavedSaveAndContinue}
          onContinueWithoutSaving={() => {
            const item = pendingRecommendation!;
            setPendingRecommendation(null);
            setUnsavedSaveError(null);
            if (selectedDhikrId) {
              discardUnsavedProgress(selectedDhikrId);
            } else {
              clearFreeModeSession();
            }
            proceedWithRecommendation(item);
          }}
          onCancel={() => {
            setPendingRecommendation(null);
            setUnsavedSaveError(null);
          }}
        />
        <DhikrResumeModal
          visible={guard.isGuardOpen}
          dhikrName={guard.guardDhikrName}
          currentCount={guard.guardCurrentCount}
          onContinue={guard.onGuardContinue}
          onFresh={guard.onGuardFresh}
          onCancel={guard.onGuardCancel}
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

        <ProfilePremiumSheet
          visible={premiumSheet.isOpen}
          selectedPlan={premiumSheet.plan}
          isActivating={premiumSheet.isActivating}
          error={premiumSheet.error}
          onSelectPlan={premiumSheet.setPlan}
          onStartPremium={premiumSheet.activate}
          onClose={premiumSheet.close}
        />
      </View>
    </PageLayout>
  );
}
