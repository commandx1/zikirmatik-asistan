import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { useThemeTokens } from "@zikirmatik/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DhikrContentStack } from "../../components/ui/dhikr-content-stack";
import { DhikrResumeModal } from "../../components/ui/dhikr-resume-modal";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { ThemedCard } from "../../components/ui/themed-card";
import { UnsavedDhikrTransitionModal } from "../../components/ui/unsaved-dhikr-transition-modal";
import { useDhikrStartGuard } from "../../hooks/use-dhikr-start-guard";
import { useAuthStore } from "../../store/auth-store";
import { useDhikrStore } from "../../store/dhikr-store";
import { createDhikrLog } from "../dhikrs/services/dhikr-logs-api-client";
import { useCollectionDetail } from "./hooks/use-collection-detail";
import type { BackendCollectionDhikr } from "./services/collections-api-client";

type Props = {
  collectionKey: string;
};

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CollectionDetailScreen({ collectionKey }: Props) {
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const bottomPadding = 40 + (Platform.OS === "android" ? Math.max(insets.bottom, 0) : insets.bottom);
  const { detail, isLoading, error } = useCollectionDetail(collectionKey);

  const storeItems = useDhikrStore((s) => s.items);
  const selectedDhikrId = useDhikrStore((s) => s.selectedDhikrId);
  const upsertDhikrSnapshot = useDhikrStore((s) => s.upsertDhikrSnapshot);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);
  const setSelectedTarget = useDhikrStore((s) => s.setSelectedTarget);
  const setSelectedCount = useDhikrStore((s) => s.setSelectedCount);
  const unsavedProgressDhikrIds = useDhikrStore((s) => s.unsavedProgressDhikrIds);
  const freeModeCount = useDhikrStore((s) => s.freeModeCount);
  const discardUnsavedProgress = useDhikrStore((s) => s.discardUnsavedProgress);
  const clearFreeModeSession = useDhikrStore((s) => s.clearFreeModeSession);
  const applySavedBackendLog = useDhikrStore((s) => s.applySavedBackendLog);
  const activeAiContext = useDhikrStore((s) => s.activeAiContext);

  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const sessionAccessToken = useAuthStore((s) => s.session?.accessToken);

  const guard = useDhikrStartGuard();

  const [pendingDhikr, setPendingDhikr] = useState<BackendCollectionDhikr | null>(null);
  const [isSavingUnsaved, setIsSavingUnsaved] = useState(false);
  const [unsavedSaveError, setUnsavedSaveError] = useState<string | null>(null);

  const startDhikr = (dhikr: BackendCollectionDhikr) => {
    guard.guardedStart({
      id: dhikr._id,
      dhikrName: dhikr.nameTurkish,
      onFresh: () => {
        upsertDhikrSnapshot({
          id: dhikr._id,
          source: "ready",
          nameTurkish: dhikr.nameTurkish,
          arabic: dhikr.nameArabic,
          transliteration: dhikr.transliteration,
          meaning: dhikr.meaning,
          virtue: dhikr.virtue,
          contentSource: dhikr.source,
          current: 0,
          target: dhikr.recommendedCount,
          lastActivityLabel: "Henüz başlanmadı",
          streakDays: 0,
          isFavorite: false,
        });
        selectDhikr(dhikr._id);
        setSelectedTarget(dhikr.recommendedCount);
        setSelectedCount(0);
        router.push("/(tabs)/home");
      },
      onContinue: () => {
        selectDhikr(dhikr._id);
        router.push("/(tabs)/home");
      }
    });
  };

  const handleStartDhikr = (dhikr: BackendCollectionDhikr) => {
    const isSameTarget = dhikr._id === selectedDhikrId;
    const hasUnsaved = !isSameTarget && (
      selectedDhikrId
        ? unsavedProgressDhikrIds.includes(selectedDhikrId)
        : freeModeCount > 0
    );
    if (hasUnsaved) {
      setPendingDhikr(dhikr);
      setUnsavedSaveError(null);
      return;
    }
    startDhikr(dhikr);
  };

  const handleUnsavedSaveAndContinue = async () => {
    if (!pendingDhikr || isSavingUnsaved) return;
    const selectedDhikr = storeItems.find((d) => d.id === selectedDhikrId);
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
      const dhikr = pendingDhikr;
      setPendingDhikr(null);
      startDhikr(dhikr);
    } catch (e) {
      setUnsavedSaveError(e instanceof Error ? e.message : "Zikir kaydedilemedi.");
    } finally {
      setIsSavingUnsaved(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={detail?.label ?? "Koleksiyon"}
        leftIconName="arrow-left"
        onPressLeft={() => router.back()}
      />

      {isLoading && !detail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[--text-muted]">{error}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
        >
          {detail?.description ? (
            <ThemedCard className="mb-5 rounded-2xl px-4 py-3" accent="accentSoft">
              <Text className="text-sm leading-5 text-[--text-muted]">
                {detail.description}
              </Text>
            </ThemedCard>
          ) : null}

          <View className="gap-4">
            {detail?.dhikrs.map((dhikr, index) => (
              <ThemedCard
                key={dhikr._id}
                className="rounded-2xl p-4"
                elevated
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-[--text-muted]">
                    {index + 1}/{detail.dhikrs.length}
                  </Text>
                  <View className="rounded-full bg-[--accent]/10 px-2.5 py-0.5">
                    <Text className="text-xs font-medium text-[--accent]">
                      {dhikr.recommendedCount}×
                    </Text>
                  </View>
                </View>

                <Text className="text-base font-semibold text-[--text-primary]">
                  {dhikr.nameTurkish}
                </Text>

                <DhikrContentStack
                  arabic={dhikr.nameArabic}
                  transliteration={dhikr.transliteration}
                  meaning={dhikr.meaning}
                />

                {dhikr.source ? (
                  <Text className="mt-3 text-xs leading-4 text-[--text-muted]">
                    {dhikr.source}
                  </Text>
                ) : null}

                <View className="mt-4 flex-row items-center justify-end">
                  <Pressable
                    onPress={() => handleStartDhikr(dhikr)}
                    className="flex-row items-center gap-1.5 rounded-full bg-[--accent] px-4 py-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <FontAwesome6
                      name="play"
                      iconStyle="solid"
                      size={10}
                      color={tokens.bg}
                    />
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: tokens.bg }}
                    >
                      Sayaca Ekle
                    </Text>
                  </Pressable>
                </View>
              </ThemedCard>
            ))}
          </View>
        </ScrollView>
      )}

      <UnsavedDhikrTransitionModal
        visible={Boolean(pendingDhikr)}
        dhikrName={storeItems.find((d) => d.id === selectedDhikrId)?.nameTurkish ?? ""}
        count={storeItems.find((d) => d.id === selectedDhikrId)?.current ?? freeModeCount}
        isSaving={isSavingUnsaved}
        error={unsavedSaveError}
        onSaveAndContinue={handleUnsavedSaveAndContinue}
        onContinueWithoutSaving={() => {
          const dhikr = pendingDhikr!;
          setPendingDhikr(null);
          setUnsavedSaveError(null);
          if (selectedDhikrId) {
            discardUnsavedProgress(selectedDhikrId);
          } else {
            clearFreeModeSession();
          }
          startDhikr(dhikr);
        }}
        onCancel={() => {
          setPendingDhikr(null);
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
    </PageLayout>
  );
}
