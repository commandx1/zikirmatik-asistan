import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { toDateKey, resolveLocalizedText } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedCard } from "../../../components/ui/themed-card";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { trackEvent } from "../../../lib/analytics";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { useAuthStore } from "../../../store/auth-store";

import { useProfileStore } from "../../../store/profile-store";
import { useVirdStore } from "../../../store/vird-store";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import { VirdSwapActiveModal } from "../components/vird-swap-active-modal";
import { useVirdProgramActions } from "../hooks/use-vird-program-actions";
import { createVirdProgram, fetchVirdTemplate, VirdApiError } from "../services/vird-api-client";
import { buildLocalProgramFromTemplate, toLocalizedText } from "../services/vird-editor-helpers";
import { VIRD_ERROR_CODE, resolveVirdErrorMessage } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import type { VirdProgramLocal } from "../types";
import { useAppLocale } from "../../../i18n";

type Props = { templateKey: string };

type PendingSwap = { localProgram: VirdProgramLocal };

// Bir vird programı şablonunun tam detayı: açıklama, fazlar/dilimler ve
// zikirler; "Programı başlat" premium şablon + premium olmayan kullanıcıda
// paywall açar, aksi halde misafir tamamen yerel, üye sunucu üzerinden
// (createProgram + activate, aktif sınırı akışı — bkz. vird-swap-active-modal.tsx)
// programı kurar/aktifleştirir.
export function TemplateDetailScreen({ templateKey }: Props) {
  const router = useRouter();
  const { t } = useTranslation("vird");
  const locale = useAppLocale();
  const { tokens } = useThemeTokens();
  const premiumSheet = usePremiumSheet();

  const authStatus = useAuthStore((state) => state.status);
  const isPremium = useProfileStore((state) => state.isPremium);
  const programs = useVirdStore((state) => state.programs);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);
  const upsertProgram = useVirdStore((state) => state.upsertProgram);
  const setNotice = useVirdStore((state) => state.setNotice);
  const { activateProgram, swapActive } = useVirdProgramActions();

  const currentActiveProgram = useMemo(
    () => programs.find((program) => program.id === activeProgramId) ?? null,
    [programs, activeProgramId]
  );

  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | undefined>();
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false);
  const trackedViewRef = useRef<string | null>(null);

  const templateQuery = useQuery(
    {
      queryKey: qk.virdTemplate(templateKey),
      queryFn: () => fetchVirdTemplate(templateKey),
      staleTime: 0,
      retry: false
    },
    queryClient
  );
  const template = templateQuery.data ?? null;
  const isLoading = templateQuery.isLoading;
  const loadError = templateQuery.error
    ? templateQuery.error instanceof VirdApiError
      ? resolveVirdErrorMessage(templateQuery.error.code, templateQuery.error.message)
      : t("vird:templates.loadError")
    : undefined;

  useEffect(() => {
    if (trackedViewRef.current === templateKey) {
      return;
    }
    trackedViewRef.current = templateKey;
    void trackEvent("template_viewed", { key: templateKey });
  }, [templateKey]);

  const fallbackTitle = toLocalizedText(t("vird:templates.untitledFallback"));

  const handleStart = async () => {
    if (!template || isStarting) {
      return;
    }

    if (template.isPremium && !isPremium) {
      premiumSheet.open();
      return;
    }

    setIsStarting(true);
    setStartError(undefined);

    try {
      const isMember = authStatus === "authenticated";
      // Sunucu, şablon kaynaklı bir oluşturmada startDate verilmezse
      // template.anchorDate'i (o da yoksa bugünü) kullanır — burada da AYNI
      // önceliği (anchorDate önce) uygulayıp açıkça göndeririz (paylaşılan
      // CreateVirdProgramRequest tipinde startDate zorunlu alan).
      const startDateKey = template.anchorDate ?? toDateKey(new Date());
      let localProgram: VirdProgramLocal;

      if (isMember) {
        const clientId = Crypto.randomUUID();
        const server = await createVirdProgram({
          clientId,
          title: template.title ?? fallbackTitle,
          kind: template.kind,
          source: "template",
          templateKey: template.key,
          startDate: startDateKey
        });
        const seed = buildLocalProgramFromTemplate(template, {
          id: clientId,
          clientId,
          startDateKey,
          nowIso: new Date().toISOString(),
          fallbackTitle
        });
        localProgram = { ...toLocalVirdProgram(server), dhikrs: seed.dhikrs };
      } else {
        const id = Crypto.randomUUID();
        localProgram = buildLocalProgramFromTemplate(template, {
          id,
          clientId: id,
          startDateKey,
          nowIso: new Date().toISOString(),
          fallbackTitle
        });
      }

      upsertProgram(localProgram);

      const activation = await activateProgram(localProgram);
      if (!activation.ok) {
        if (activation.code === VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE) {
          setPendingSwap({ localProgram });
          return;
        }
        setStartError(activation.message || t("vird:templates.detail.startFailed"));
        return;
      }

      void trackEvent("template_started", { key: template.key });
      setNotice("started");
      router.dismissTo("/vird");
    } catch (error) {
      const message =
        error instanceof VirdApiError ? resolveVirdErrorMessage(error.code, error.message) : t("vird:templates.detail.startFailed");
      setStartError(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePauseAndStart = async () => {
    if (!pendingSwap) {
      return;
    }
    setIsSwapSubmitting(true);
    try {
      const retry = await swapActive(pendingSwap.localProgram);
      setPendingSwap(null);
      if (retry.ok) {
        void trackEvent("template_started", { key: templateKey });
        setNotice("started");
        router.dismissTo("/vird");
      } else {
        setStartError(retry.message || t("vird:templates.detail.startFailed"));
      }
    } finally {
      setIsSwapSubmitting(false);
    }
  };

  const handleKeepDraft = () => {
    setPendingSwap(null);
    setNotice("draft");
    router.dismissTo("/vird");
  };

  const title = template?.title ? resolveLocalizedText(template.title, locale) : t("vird:templates.untitledFallback");

  return (
    <PageLayout>
      <PageHeader title={title} leftIconName="arrow-left" onPressLeft={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : loadError || !template ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-text-muted">{loadError ?? t("vird:templates.loadError")}</Text>
        </View>
      ) : (
        <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={40}>
          {template.isPremium ? (
            <View className="mb-4 self-start rounded-full px-3 py-1">
              <Text className="text-xs font-semibold text-accent">{t("vird:templates.premiumBadge")}</Text>
            </View>
          ) : null}

          {template.description ? (
            <ThemedCard className="mb-5 rounded-2xl px-4 py-3" accent="accentSoft">
              <Text className="text-sm leading-5 text-text-muted">{resolveLocalizedText(template.description, locale)}</Text>
            </ThemedCard>
          ) : null}

          <Text className="mb-2 text-xs font-semibold text-text-muted">{t("vird:templates.detail.phasesHeading")}</Text>
          <View className="gap-4">
            {template.phases.map((phase, phaseIndex) => (
              <ThemedCard key={`${phase.fromDay}-${phaseIndex}`} className="rounded-2xl p-4">
                <Text className="mb-3 text-xs font-semibold text-accent">
                  {phase.toDay != null
                    ? t("vird:templates.detail.dayRangeLabel", { from: phase.fromDay, to: phase.toDay })
                    : t("vird:templates.detail.dayRangeOpenLabel", { from: phase.fromDay })}
                </Text>

                <View className="gap-3">
                  {(Object.keys(phase.slots) as Array<keyof typeof phase.slots>).map((slot) => {
                    const items = phase.slots[slot];
                    if (!items || items.length === 0) {
                      return null;
                    }
                    return (
                      <View key={String(slot)}>
                        <Text className="mb-1 text-xs font-semibold text-text-muted">{t(`vird:slots.${slot}`)}</Text>
                        {items.map((item) => (
                          <View key={item.dhikrId} className="flex-row items-center justify-between py-0.5">
                            <Text className="flex-1 pr-2 text-sm text-text-primary" numberOfLines={1}>
                              {resolveLocalizedText(item.transliteration, locale) || resolveLocalizedText(item.name, locale)}
                            </Text>
                            <Text className="text-xs text-text-muted">{t("vird:setup.targetSuffix", { count: item.target })}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </ThemedCard>
            ))}
          </View>

          {startError ? <Text className="mt-4 text-xs text-[#F97373]">{startError}</Text> : null}

          <PrimaryCtaButton
            label={isStarting ? t("vird:templates.detail.startingButton") : t("vird:templates.detail.startButton")}
            onPress={() => void handleStart()}
            disabled={isStarting}
            className={`mt-5 ${isStarting ? "opacity-60" : ""}`}
          />
        </PageScrollView>
      )}

      <VirdSwapActiveModal
        visible={pendingSwap !== null}
        currentProgramTitle={currentActiveProgram ? resolveLocalizedText(currentActiveProgram.title, locale) : ""}
        nextProgramTitle={title}
        isSubmitting={isSwapSubmitting}
        onPauseAndStart={() => void handlePauseAndStart()}
        onUpgrade={() => {
          setPendingSwap(null);
          premiumSheet.open();
        }}
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
        subscriptionPrices={premiumSheet.subscriptionPrices}
        source="vird_template"
      />
    </PageLayout>
  );
}
