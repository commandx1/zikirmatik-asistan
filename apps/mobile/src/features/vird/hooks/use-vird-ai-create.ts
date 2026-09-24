// "AI ile Program Oluştur" akışının kompozisyon kökü:
//   - use-vird-ai-generate.ts: form + üretim (3 kredi, 503 tekrar dene, satın alma sonrası devam)
//   - use-vird-activation.ts: aktivasyon + 403 VIRD_FREE_LIMIT_ACTIVE çakışma akışı
// Krediler ortak ../../ai-shared/hooks/use-ai-credits.ts'ten gelir; saf parçalar
// services/vird-ai-create-service.ts'dedir.
//
// Akış: generate (POST /v1/ai/vird-programs) → önizleme → activate
// (POST /v1/vird/programs/:id/activate).
import { useCallback, useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import { useVirdActivation } from "./use-vird-activation";
import { useVirdAiGenerate } from "./use-vird-ai-generate";

// Sunucudaki VIRD_PROGRAM_CREDIT_COST (apps/api/src/modules/ai/credits.constants.ts,
// docs/vird-programi.md §3). Yalnızca istemci ön kontrolü içindir — asıl
// zorlama sunucudadır (403 AI_CREDIT_INSUFFICIENT).
const VIRD_AI_PROGRAM_CREDIT_COST = 3;

export function useVirdAiCreate(onOpenPremiumSheet?: () => void) {
  const authStatus = useAuthStore((s) => s.status);
  // Ön kontrol her seferinde tazeler; eşik 3 kredi.
  const credits = useAiCredits({ requiredCredits: VIRD_AI_PROGRAM_CREDIT_COST, alwaysRefresh: true, onOpenPremiumSheet });
  const { refreshCredits } = credits;
  const generate = useVirdAiGenerate(credits, onOpenPremiumSheet);
  const activation = useVirdActivation(generate.programId, onOpenPremiumSheet);
  const { clearDraft, hasPendingGenerate, resumeGenerateAfterCreditPurchase } = generate;
  const { activationConflict, resetActivation, retryActivationAfterPremium } = activation;

  useEffect(() => {
    void refreshCredits();
  }, [authStatus, refreshCredits]);

  const discardDraft = useCallback(() => {
    clearDraft();
    resetActivation();
  }, [clearDraft, resetActivation]);

  /**
   * ProfilePremiumSheet'in `onPremiumActivated` callback'i için tek giriş
   * noktası — bekleyen akışa (kredi yetersizliğinde üretim ya da aktivasyon
   * çakışması) göre doğru devam fonksiyonunu çalıştırır.
   */
  const resumeAfterPremiumPurchase = useCallback(async () => {
    if (hasPendingGenerate()) {
      await resumeGenerateAfterCreditPurchase();
      return;
    }
    // Çakışma modalından premium'a geçilmediyse no-op (bayrak hook içinde).
    await retryActivationAfterPremium();
  }, [hasPendingGenerate, resumeGenerateAfterCreditPurchase, retryActivationAfterPremium]);

  return {
    // form
    freeText: generate.freeText,
    setFreeText: generate.setFreeText,
    durationDays: generate.durationDays,
    setDurationDays: generate.setDurationDays,
    slots: generate.slots,
    toggleSlot: generate.toggleSlot,
    prayerSelection: generate.prayerSelection,
    togglePrayerIndex: generate.togglePrayerIndex,
    // credits
    creditBalance: credits.creditBalance,
    // generation
    isGenerating: generate.isGenerating,
    generationError: generate.generationError,
    offTopicMessage: generate.offTopicMessage,
    aiUnavailable: generate.aiUnavailable,
    postPurchaseNotice: generate.postPurchaseNotice,
    programPreview: generate.programPreview,
    submitGenerate: generate.submitGenerate,
    retryGenerateAfterUnavailable: generate.retryGenerateAfterUnavailable,
    discardDraft,
    // activation
    isActivating: activation.isActivating,
    activationError: activation.activationError,
    activationConflict,
    activateProgram: activation.activateProgram,
    resolveActivationConflictByPausingExisting: activation.resolveActivationConflictByPausingExisting,
    openPremiumSheetForActivationConflict: activation.openPremiumSheetForActivationConflict,
    dismissActivationConflict: activation.dismissActivationConflict,
    // premium sheet purchase resume (hem üretim hem aktivasyon için ortak)
    resumeAfterPremiumPurchase
  };
}
