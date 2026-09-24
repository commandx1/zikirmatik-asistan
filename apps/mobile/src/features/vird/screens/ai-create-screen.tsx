// "AI ile Vird Programı Oluştur" ekranı. Akış: niyet + süre + dilim(ler) ->
// POST /v1/ai/vird-programs (3 kredi, socketId YOK -> basit spinner) ->
// önizleme -> POST .../activate. Durum/orkestrasyon hooks/use-vird-ai-create.ts'te;
// bu dosya salt görünümdür. Giriş noktası: features/ai-guide/screen.tsx'teki
// "AI ile Vird Programı" kartı (route: app/vird/ai-create.tsx).
import { useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import type { VirdSlotKey } from "@zikirmatik/shared";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PageHeader } from "../../../components/ui/page-header";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedInput } from "../../../components/ui/themed-input";
import { ThemedTag } from "../../../components/ui/themed-tag";
import { TogglePill } from "../../../components/ui/toggle-pill";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { useVirdStore } from "../../../store/vird-store";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import type { AiVirdProgramPreview, AiVirdProgramPreviewPhase } from "../../ai-guide/services/ai-api-client";
import { VirdSwapActiveModal } from "../components/vird-swap-active-modal";
import { useVirdAiCreate } from "../hooks/use-vird-ai-create";
import { VIRD_SLOT_KEYS } from "../services/vird-day";
import { resolveLocalizedText } from "@zikirmatik/shared";
import { useAppLocale } from "../../../i18n";

const DURATION_OPTIONS = [7, 14, 30] as const;
const PRAYER_INDEXES = [1, 2, 3, 4, 5] as const;

export function AiCreateScreen() {
  const { t } = useTranslation("ai-guide");
  const locale = useAppLocale();
  const router = useRouter();
  const resumeAfterPremiumPurchaseRef = useRef<() => void>(() => {});
  const premiumSheet = usePremiumSheet({
    onPremiumActivated: () => resumeAfterPremiumPurchaseRef.current()
  });
  const guide = useVirdAiCreate(premiumSheet.open);
  const setNotice = useVirdStore((state) => state.setNotice);
  const programs = useVirdStore((state) => state.programs);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);
  const currentActiveProgram = programs.find((program) => program.id === activeProgramId) ?? null;
  resumeAfterPremiumPurchaseRef.current = () => {
    void guide.resumeAfterPremiumPurchase();
  };

  const goToHub = (notice: "started" | "draft") => {
    setNotice(notice);
    router.dismissTo("/vird" as Href);
  };

  const handleActivate = async () => {
    if (await guide.activateProgram()) {
      goToHub("started");
    }
  };

  const handlePauseAndActivate = async () => {
    if (await guide.resolveActivationConflictByPausingExisting()) {
      goToHub("started");
    }
  };

  const handleKeepDraft = () => {
    guide.dismissActivationConflict();
    goToHub("draft");
  };

  const handleDiscard = () => {
    guide.discardDraft();
    router.back();
  };

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <PageHeader
          title={t("ai-guide:virdProgram.title")}
          subtitle={t("ai-guide:virdProgram.subtitle")}
          leftIconName="chevron-left"
          onPressLeft={() => router.back()}
        />

        <PageScrollView contentInnerClassName="w-full px-5" keyboardShouldPersistTaps="handled" bottomPadding={40}>
          {guide.programPreview ? (
            <VirdAiPreviewView
              preview={guide.programPreview}
              isActivating={guide.isActivating}
              activationError={guide.activationError}
              activationConflict={guide.activationConflict}
              onActivate={() => void handleActivate()}
              onDiscard={handleDiscard}
            />
          ) : (
            <VirdAiFormView
              freeText={guide.freeText}
              onChangeFreeText={guide.setFreeText}
              durationDays={guide.durationDays}
              onChangeDurationDays={guide.setDurationDays}
              slots={guide.slots}
              onToggleSlot={guide.toggleSlot}
              prayerSelection={guide.prayerSelection}
              onTogglePrayerIndex={guide.togglePrayerIndex}
              creditBalance={guide.creditBalance}
              onPressCredits={premiumSheet.open}
              isGenerating={guide.isGenerating}
              generationError={guide.generationError}
              offTopicMessage={guide.offTopicMessage}
              aiUnavailable={guide.aiUnavailable}
              postPurchaseNotice={guide.postPurchaseNotice}
              onRetryUnavailable={() => void guide.retryGenerateAfterUnavailable()}
              onSubmit={() => void guide.submitGenerate()}
            />
          )}
        </PageScrollView>

        <VirdSwapActiveModal
          visible={guide.activationConflict}
          currentProgramTitle={currentActiveProgram ? resolveLocalizedText(currentActiveProgram.title, locale) : ""}
          nextProgramTitle={guide.programPreview?.title ?? ""}
          isSubmitting={guide.isActivating}
          onPauseAndStart={() => void handlePauseAndActivate()}
          onUpgrade={guide.openPremiumSheetForActivationConflict}
          onKeepDraft={handleKeepDraft}
        />

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
              if (!purchased) {
                return;
              }
              premiumSheet.close();
              void guide.resumeAfterPremiumPurchase();
            });
          }}
          subscriptionPrices={premiumSheet.subscriptionPrices}
          source="vird_ai"
        />
      </View>
    </PageLayout>
  );
}

// --- Form (niyet + süre + dilimler) ---

type VirdAiFormViewProps = {
  freeText: string;
  onChangeFreeText: (value: string) => void;
  durationDays: 7 | 14 | 30;
  onChangeDurationDays: (value: 7 | 14 | 30) => void;
  slots: VirdSlotKey[];
  onToggleSlot: (slot: VirdSlotKey) => void;
  prayerSelection: number[];
  onTogglePrayerIndex: (index: number) => void;
  creditBalance: number;
  onPressCredits: () => void;
  isGenerating: boolean;
  generationError?: string;
  offTopicMessage?: string;
  aiUnavailable: { message: string } | null;
  postPurchaseNotice?: string;
  onRetryUnavailable: () => void;
  onSubmit: () => void;
};

function VirdAiFormView({
  freeText,
  onChangeFreeText,
  durationDays,
  onChangeDurationDays,
  slots,
  onToggleSlot,
  prayerSelection,
  onTogglePrayerIndex,
  creditBalance,
  onPressCredits,
  isGenerating,
  generationError,
  offTopicMessage,
  aiUnavailable,
  postPurchaseNotice,
  onRetryUnavailable,
  onSubmit
}: VirdAiFormViewProps) {
  const { t } = useTranslation("ai-guide");
  const { tokens } = useThemeTokens();
  const canSubmit = !isGenerating && slots.length > 0;

  return (
    <View>
      <Text className="mb-2 text-xs font-semibold tracking-[1.1px] text-[--text-muted]">
        {t("ai-guide:virdProgram.form.freeTextLabel").toLocaleUpperCase()}
      </Text>
      <ThemedInput
        value={freeText}
        onChangeText={onChangeFreeText}
        placeholder={t("ai-guide:virdProgram.form.freeTextPlaceholder")}
        shape="xl"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!isGenerating}
        className="mb-6 min-h-[110px] pt-4"
      />

      <Text className="mb-2 text-xs font-semibold tracking-[1.1px] text-[--text-muted]">
        {t("ai-guide:virdProgram.form.durationLabel").toLocaleUpperCase()}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {DURATION_OPTIONS.map((option) => (
          <ThemedTag
            key={option}
            label={t("ai-guide:virdProgram.form.durationOption", { count: option })}
            variant={durationDays === option ? "accent" : "soft"}
            onPress={isGenerating ? undefined : () => onChangeDurationDays(option)}
          />
        ))}
      </View>

      <Text className="mb-2 text-xs font-semibold tracking-[1.1px] text-[--text-muted]">
        {t("ai-guide:virdProgram.form.slotsLabel").toLocaleUpperCase()}
      </Text>
      <View className="mb-2 flex-row flex-wrap gap-2">
        {VIRD_SLOT_KEYS.map((slot) => (
          <ThemedTag
            key={slot}
            label={t(`ai-guide:virdProgram.slots.${slot}`)}
            variant={slots.includes(slot) ? "accent" : "soft"}
            onPress={isGenerating ? undefined : () => onToggleSlot(slot)}
          />
        ))}
      </View>
      {slots.length === 0 ? (
        <Text className="mb-4 text-xs text-[#f87171]">{t("ai-guide:virdProgram.errors.slotsRequired")}</Text>
      ) : (
        <View className="mb-4" />
      )}

      {slots.includes("prayer") ? (
        <ThemedCard className="mb-6 rounded-2xl px-4 py-3">
          <Text className="mb-1 text-xs font-semibold tracking-[1.1px] text-[--text-muted]">
            {t("ai-guide:virdProgram.form.prayerSelectionLabel").toLocaleUpperCase()}
          </Text>
          {PRAYER_INDEXES.map((index) => (
            <View key={index} className="flex-row items-center justify-between py-2">
              <Text className="text-sm text-[--text-primary]">
                {t(`ai-guide:virdProgram.prayerIndex.${index}`)}
              </Text>
              <TogglePill
                checked={prayerSelection.includes(index)}
                onToggle={() => onTogglePrayerIndex(index)}
                size="compact"
              />
            </View>
          ))}
        </ThemedCard>
      ) : null}

      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-xs text-[--text-muted]">{t("ai-guide:virdProgram.form.creditCost")}</Text>
        <Pressable
          onPress={onPressCredits}
          className="flex-row items-center gap-1.5 rounded-full bg-[--bg] px-3 py-1.5"
          accessibilityRole="button"
        >
          <FontAwesome6 name="coins" size={12} color={tokens.accent} />
          <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
            {t("ai-guide:input.creditBalance", { count: creditBalance })}
          </Text>
        </Pressable>
      </View>

      {generationError ? (
        <View className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
          <Text className="text-sm text-[#fecaca]">{generationError}</Text>
        </View>
      ) : null}

      {!isGenerating && postPurchaseNotice ? (
        <View className="mb-4 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3">
          <Text className="text-sm leading-5 text-amber-100/80">{postPurchaseNotice}</Text>
        </View>
      ) : null}

      {offTopicMessage ? (
        <View className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-4">
          <View className="mb-2 flex-row items-center gap-2">
            <FontAwesome6 name="circle-exclamation" size={14} color="#f87171" />
            <Text className="text-sm font-semibold text-red-400">{t("ai-guide:virdProgram.offTopic.title")}</Text>
          </View>
          <Text className="text-sm leading-5 text-red-200/80">{offTopicMessage}</Text>
        </View>
      ) : null}

      {aiUnavailable ? (
        <View className="mb-4 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-4">
          <View className="mb-2 flex-row items-center gap-2">
            <FontAwesome6 name="triangle-exclamation" size={14} color="#fbbf24" />
            <Text className="text-sm font-semibold text-amber-400">
              {t("ai-guide:virdProgram.errors.aiUnavailableTitle")}
            </Text>
          </View>
          <Text className="mb-3 text-sm leading-5 text-amber-100/80">{aiUnavailable.message}</Text>
          <Pressable
            onPress={onRetryUnavailable}
            className="self-start rounded-full bg-amber-500/15 px-4 py-2"
            accessibilityRole="button"
            accessibilityLabel={t("ai-guide:actions.retry")}
          >
            <Text className="text-xs font-semibold text-amber-200">{t("ai-guide:actions.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      {isGenerating ? (
        <View className="mb-4 flex-row items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[--card] px-4 py-5">
          <ActivityIndicator color={tokens.accent} />
          <Text className="text-sm font-semibold text-[--text-primary]">{t("ai-guide:virdProgram.form.loading")}</Text>
        </View>
      ) : (
        <PrimaryCtaButton
          label={t("ai-guide:virdProgram.form.submit")}
          disabled={!canSubmit}
          onPress={onSubmit}
          style={!canSubmit ? { opacity: 0.5 } : undefined}
        />
      )}
    </View>
  );
}

// --- Önizleme (üretilen program + aktifleştirme) ---

type VirdAiPreviewViewProps = {
  preview: AiVirdProgramPreview;
  isActivating: boolean;
  activationError?: string;
  activationConflict: boolean;
  onActivate: () => void;
  onDiscard: () => void;
};

function VirdAiPreviewView({
  preview,
  isActivating,
  activationError,
  activationConflict,
  onActivate,
  onDiscard
}: VirdAiPreviewViewProps) {
  const { t } = useTranslation("ai-guide");
  const { tokens } = useThemeTokens();

  return (
    <View>
      <Text className="mb-1 text-lg font-bold text-[--text-primary]">{preview.title}</Text>
      {preview.summary ? (
        <Text className="mb-5 text-sm leading-5 text-[--text-muted]">{preview.summary}</Text>
      ) : (
        <View className="mb-5" />
      )}

      <Text className="mb-2 text-xs font-semibold tracking-[1.1px] text-[--text-muted]">
        {t("ai-guide:virdProgram.preview.phasesTitle").toLocaleUpperCase()}
      </Text>
      <View className="mb-6 gap-3">
        {preview.phases.map((phase, index) => (
          <PhaseCard key={`${phase.fromDay}-${phase.toDay ?? "end"}-${index}`} phase={phase} />
        ))}
      </View>

      {activationError ? (
        <View className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
          <Text className="text-sm text-[#fecaca]">{activationError}</Text>
        </View>
      ) : null}

      {!activationConflict ? (
        isActivating ? (
          <View className="mb-3 flex-row items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[--card] px-4 py-5">
            <ActivityIndicator color={tokens.accent} />
          </View>
        ) : (
          <PrimaryCtaButton
            label={t("ai-guide:virdProgram.actions.start")}
            onPress={onActivate}
            className="mb-3"
          />
        )
      ) : null}

      <Pressable onPress={onDiscard} disabled={isActivating} className="items-center py-3" accessibilityRole="button">
        <Text className="text-sm font-semibold text-[--text-muted]">{t("ai-guide:virdProgram.actions.discard")}</Text>
      </Pressable>
    </View>
  );
}

function PhaseCard({ phase }: { phase: AiVirdProgramPreviewPhase }) {
  const { t } = useTranslation("ai-guide");

  const dayRangeLabel =
    phase.toDay == null
      ? t("ai-guide:virdProgram.preview.phaseDayRangeOpen", { from: phase.fromDay })
      : t("ai-guide:virdProgram.preview.phaseDayRange", { from: phase.fromDay, to: phase.toDay });

  const slotEntries = VIRD_SLOT_KEYS.map((slot) => ({ slot, items: phase.slots[slot] ?? [] })).filter(
    (entry) => entry.items.length > 0
  );

  return (
    <ThemedCard className="rounded-2xl px-4 py-3.5" accent="accentSoft">
      <Text className="mb-1 text-sm font-semibold text-[--text-primary]">{dayRangeLabel}</Text>
      {phase.note ? <Text className="mb-2 text-xs leading-4 text-[--text-muted]">{phase.note}</Text> : null}

      {slotEntries.map(({ slot, items }) => (
        <View key={slot} className="mt-2">
          <Text className="mb-1 text-xs font-semibold text-[--text-muted]">{t(`ai-guide:virdProgram.slots.${slot}`)}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {items.map((item, itemIndex) => (
              <View key={`${item.dhikrId}-${itemIndex}`} className="rounded-full border border-white/10 bg-[--bg] px-3 py-1">
                <Text className="text-xs text-[--text-primary]">
                  {item.name} {t("ai-guide:virdProgram.preview.targetSuffix", { count: item.target })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ThemedCard>
  );
}
