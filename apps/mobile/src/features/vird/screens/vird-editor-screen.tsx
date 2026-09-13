import { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useTranslation } from "react-i18next";
import { toDateKey, type VirdPhase, type VirdPhaseSlots, type VirdSlotKey } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedInput } from "../../../components/ui/themed-input";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { useAuthStore } from "../../../store/auth-store";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { useProfileStore } from "../../../store/profile-store";
import { useVirdStore } from "../../../store/vird-store";
import { trackEvent } from "../../../lib/analytics";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import { VirdDhikrPickerModal, type VirdDhikrPickerSelection } from "../components/vird-dhikr-picker-modal";
import { VirdEditorSlotCard, type VirdEditorSlotItem } from "../components/vird-editor-slot-card";
import { VirdSwapActiveModal } from "../components/vird-swap-active-modal";
import { useHydrateVirdSnapshots } from "../hooks/use-hydrate-vird-snapshots";
import { useVirdProgramActions } from "../hooks/use-vird-program-actions";
import { createVirdProgram, updateVirdProgram, VirdApiError } from "../services/vird-api-client";
import { resolveDhikrRef, VIRD_SLOT_KEYS } from "../services/vird-day";
import { toLocalizedText } from "../services/vird-editor-helpers";
import { VIRD_ERROR_CODE, resolveVirdErrorMessage } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import type { DhikrSnapshot, VirdProgramLocal } from "../types";

type EditorSlots = Partial<Record<VirdSlotKey, VirdEditorSlotItem[]>>;

type PendingSwap = { localProgram: VirdProgramLocal; isNew: boolean };

function nowIso(): string {
  return new Date().toISOString();
}

function buildEditorSlotsFromProgram(program: VirdProgramLocal): EditorSlots {
  const sourceSlots = program.phases[0]?.slots ?? {};
  const next: EditorSlots = {};

  for (const slot of VIRD_SLOT_KEYS) {
    const items = sourceSlots[slot];
    if (!items || items.length === 0) {
      continue;
    }
    const mapped = items
      .map((item) => ({ ref: resolveDhikrRef(item) ?? "", isCustom: Boolean(item.customDhikrId), target: item.target }))
      .filter((item) => item.ref.length > 0);
    if (mapped.length > 0) {
      next[slot] = mapped;
    }
  }

  return next;
}

function buildPhasesFromEditorSlots(slots: EditorSlots): VirdPhase[] {
  const phaseSlots: VirdPhaseSlots = {};

  for (const slot of VIRD_SLOT_KEYS) {
    const items = slots[slot];
    if (!items || items.length === 0) {
      continue;
    }
    phaseSlots[slot] = items.map((item) => ({
      ...(item.isCustom ? { customDhikrId: item.ref } : { dhikrId: item.ref }),
      target: Math.max(1, Math.floor(item.target) || 1)
    }));
  }

  return [{ fromDay: 1, toDay: null, slots: phaseSlots }];
}

type VirdEditorScreenProps = { programId?: string };

// Vird programı editörü (yeni oluşturma + mevcut manuel programı düzenleme).
// Tek bir açık uçlu faz üretir (fromDay:1, toDay:null) — bkz. görev notu:
// çoklu fazlı (şablon/AI kaynaklı) bir programın "Düzenle"den açılması hâlâ
// desteklenir ama kaydedince TEK faza indirgenir (bilinen kısıtlama, bkz.
// worker raporu).
export function VirdEditorScreen({ programId }: VirdEditorScreenProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("vird");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";

  const authStatus = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const isPremium = useProfileStore((state) => state.isPremium);
  const programs = useVirdStore((state) => state.programs);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);
  const upsertProgram = useVirdStore((state) => state.upsertProgram);
  const setActiveProgram = useVirdStore((state) => state.setActiveProgram);
  const { pauseProgram, activateProgram } = useVirdProgramActions();
  const premiumSheet = usePremiumSheet();

  const existingProgram = useMemo(
    () => (programId ? programs.find((program) => program.id === programId) ?? null : null),
    [programs, programId]
  );
  const currentActiveProgram = useMemo(
    () => programs.find((program) => program.id === activeProgramId) ?? null,
    [programs, activeProgramId]
  );

  useHydrateVirdSnapshots(existingProgram?.id ?? null);

  const [titleDraft, setTitleDraft] = useState("");
  const [slots, setSlots] = useState<EditorSlots>({});
  const [prayerSelection, setPrayerSelection] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sessionSnapshots, setSessionSnapshots] = useState<Record<string, DhikrSnapshot>>({});
  const [activeSlotForPicker, setActiveSlotForPicker] = useState<VirdSlotKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || !existingProgram) {
      return;
    }
    initializedRef.current = true;
    setTitleDraft(resolveLocalizedText(existingProgram.title, locale));
    setSlots(buildEditorSlotsFromProgram(existingProgram));
    setPrayerSelection(
      existingProgram.prayerSelection && existingProgram.prayerSelection.length > 0
        ? existingProgram.prayerSelection
        : [1, 2, 3, 4, 5]
    );
    // NOT: `locale` bilinçli olarak bağımlılık dizisinde değil — yalnızca
    // İLK yüklemede kullanılır (initializedRef guard'ı), dil değişince
    // formu YENİDEN başlatmak istemiyoruz.
  }, [existingProgram]);

  const displaySnapshots = useMemo(
    () => ({ ...(existingProgram?.dhikrs ?? {}), ...sessionSnapshots }),
    [existingProgram, sessionSnapshots]
  );

  const allRefs = useMemo(() => {
    const refs = new Set<string>();
    for (const items of Object.values(slots)) {
      for (const item of items ?? []) {
        refs.add(item.ref);
      }
    }
    return refs;
  }, [slots]);

  const handleAddToSlot = (slot: VirdSlotKey, selection: VirdDhikrPickerSelection) => {
    setSlots((prev) => {
      const current = prev[slot] ?? [];
      if (current.some((item) => item.ref === selection.ref)) {
        return prev;
      }
      return { ...prev, [slot]: [...current, { ref: selection.ref, isCustom: selection.isCustom, target: selection.target }] };
    });
    setSessionSnapshots((prev) => ({ ...prev, [selection.ref]: selection.snapshot }));
  };

  const handleRemoveFromSlot = (slot: VirdSlotKey, ref: string) => {
    setSlots((prev) => {
      const current = prev[slot] ?? [];
      const next = current.filter((item) => item.ref !== ref);
      const nextSlots = { ...prev };
      if (next.length > 0) {
        nextSlots[slot] = next;
      } else {
        delete nextSlots[slot];
      }
      return nextSlots;
    });
  };

  const handleTargetChange = (slot: VirdSlotKey, ref: string, target: number) => {
    setSlots((prev) => ({
      ...prev,
      [slot]: (prev[slot] ?? []).map((item) => (item.ref === ref ? { ...item, target } : item))
    }));
  };

  const handleTogglePrayerIndex = (index: number) => {
    setPrayerSelection((prev) => (prev.includes(index) ? prev.filter((value) => value !== index) : [...prev, index].sort((a, b) => a - b)));
  };

  const handleSave = async () => {
    const trimmedTitle = titleDraft.trim();
    if (!trimmedTitle) {
      setSaveError(t("vird:editor.errors.titleRequired"));
      return;
    }

    const phases = buildPhasesFromEditorSlots(slots);
    const hasAnyDhikr = Object.values(phases[0]?.slots ?? {}).some((items) => items && items.length > 0);
    if (!hasAnyDhikr) {
      setSaveError(t("vird:editor.errors.atLeastOneDhikr"));
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    try {
      const isMember = authStatus === "authenticated" && Boolean(accessToken);
      const todayKey = toDateKey(new Date());

      const dhikrsSnapshot: Record<string, DhikrSnapshot> = {};
      for (const items of Object.values(phases[0]?.slots ?? {})) {
        for (const item of items ?? []) {
          const ref = resolveDhikrRef(item);
          const snapshot = ref ? displaySnapshots[ref] : undefined;
          if (ref && snapshot) {
            dhikrsSnapshot[ref] = snapshot;
          }
        }
      }

      let localProgram: VirdProgramLocal;

      if (isMember) {
        if (existingProgram && existingProgram.origin === "server") {
          const server = await updateVirdProgram(
            existingProgram.id,
            { title: toLocalizedText(trimmedTitle), phases, prayerSelection },
            accessToken as string
          );
          localProgram = { ...toLocalVirdProgram(server, existingProgram), dhikrs: dhikrsSnapshot };
        } else {
          const seedClientId = existingProgram?.clientId ?? Crypto.randomUUID();
          const server = await createVirdProgram(
            {
              clientId: seedClientId,
              title: toLocalizedText(trimmedTitle),
              kind: existingProgram?.kind ?? "routine",
              source: "manual",
              phases,
              startDate: existingProgram?.startDate ?? todayKey,
              prayerSelection,
              reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } }
            },
            accessToken as string
          );
          localProgram = { ...toLocalVirdProgram(server), dhikrs: dhikrsSnapshot };
        }
      } else {
        const id = existingProgram?.id ?? Crypto.randomUUID();
        localProgram = {
          id,
          clientId: existingProgram?.clientId ?? id,
          origin: "local",
          kind: existingProgram?.kind ?? "routine",
          status: existingProgram?.status ?? "draft",
          source: "manual",
          title: toLocalizedText(trimmedTitle),
          startDate: existingProgram?.startDate ?? todayKey,
          phases,
          prayerSelection,
          reminders: existingProgram?.reminders ?? {
            enabled: false,
            slots: { morning: false, prayer: false, evening: false, night: false }
          },
          dhikrs: dhikrsSnapshot,
          createdAt: existingProgram?.createdAt ?? nowIso(),
          updatedAt: nowIso()
        };
      }

      upsertProgram(localProgram);
      // Bir origin:'local' programın id'si (üye ilk kez sunucuya yazarken)
      // clientId aynı kalsa da sunucunun gerçek _id'sine değişebilir — bu
      // program az önce ana ekranın takip ettiği program İDİYSE referansı
      // hemen güncelle, aksi halde activateProgram başarısız/paywall'a
      // düşerse "aktif program" hiçbir kayıtla eşleşmez kalır (bkz.
      // use-vird-backend-sync.ts'teki AYNI kural).
      if (existingProgram && activeProgramId === existingProgram.id && localProgram.id !== existingProgram.id) {
        setActiveProgram(localProgram.id);
      }

      const isNewProgram = !existingProgram;
      if (isNewProgram) {
        void trackEvent("vird_created", { source: "manual" });
      }

      const activation = await activateProgram(localProgram);
      if (!activation.ok) {
        if (activation.code === VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE) {
          setPendingSwap({ localProgram, isNew: isNewProgram });
          return;
        }
        setSaveError(activation.message || t("vird:editor.errors.activateFailed"));
        return;
      }

      void trackEvent("vird_activated");
      router.back();
    } catch (error) {
      const message =
        error instanceof VirdApiError
          ? resolveVirdErrorMessage(error.code, error.message)
          : error instanceof Error
            ? error.message
            : t("vird:editor.errors.saveFailed");
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!pendingSwap) {
      return;
    }
    setIsSwapSubmitting(true);
    try {
      if (currentActiveProgram) {
        await pauseProgram(currentActiveProgram);
      }
      const retry = await activateProgram(pendingSwap.localProgram);
      setPendingSwap(null);
      if (retry.ok) {
        void trackEvent("vird_activated");
        router.back();
      } else {
        setSaveError(retry.message || t("vird:editor.errors.activateFailed"));
      }
    } finally {
      setIsSwapSubmitting(false);
    }
  };

  const handleUpgradeFromSwap = () => {
    setPendingSwap(null);
    premiumSheet.open();
  };

  const handleCancelSwap = () => {
    setPendingSwap(null);
    router.back();
  };

  return (
    <PageLayout>
      <PageHeader
        title={existingProgram ? t("vird:editor.titleEdit") : t("vird:editor.titleNew")}
        leftIconName="arrow-left"
        onPressLeft={() => router.back()}
      />

      <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={48}>
        <Text className="mb-1.5 text-xs font-medium text-[--text-primary]">{t("vird:editor.titleLabel")}</Text>
        <ThemedInput
          value={titleDraft}
          onChangeText={setTitleDraft}
          placeholder={t("vird:editor.titlePlaceholder")}
          className="mb-2 rounded-xl bg-[--card] px-3"
        />
        <Text className="mb-4 text-xs text-[--text-muted]">
          {t("vird:editor.kindNote", { kind: t(`vird:programKind.${existingProgram?.kind ?? "routine"}`) })}
        </Text>

        {VIRD_SLOT_KEYS.map((slot) => (
          <VirdEditorSlotCard
            key={slot}
            slot={slot}
            items={slots[slot] ?? []}
            displaySnapshots={displaySnapshots}
            onAddPress={() => setActiveSlotForPicker(slot)}
            onRemove={(ref) => handleRemoveFromSlot(slot, ref)}
            onTargetChange={(ref, target) => handleTargetChange(slot, ref, target)}
            prayerSelection={slot === "prayer" ? prayerSelection : undefined}
            onTogglePrayerIndex={slot === "prayer" ? handleTogglePrayerIndex : undefined}
          />
        ))}

        {saveError ? <Text className="mb-3 text-xs text-[#F97373]">{saveError}</Text> : null}

        <PrimaryCtaButton
          label={isSaving ? t("vird:editor.savingButton") : t("vird:editor.saveButton")}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className={isSaving ? "opacity-60" : ""}
        />
      </PageScrollView>

      <VirdDhikrPickerModal
        visible={activeSlotForPicker !== null}
        onRequestClose={() => setActiveSlotForPicker(null)}
        existingRefs={Array.from(allRefs)}
        slotRefs={activeSlotForPicker ? (slots[activeSlotForPicker] ?? []).map((item) => item.ref) : []}
        isPremium={isPremium}
        onRequirePremium={() => {
          setActiveSlotForPicker(null);
          premiumSheet.open();
        }}
        onAdd={(selection) => {
          if (activeSlotForPicker) {
            handleAddToSlot(activeSlotForPicker, selection);
          }
        }}
      />

      <VirdSwapActiveModal
        visible={pendingSwap !== null}
        currentProgramTitle={currentActiveProgram ? resolveLocalizedText(currentActiveProgram.title, locale) : ""}
        nextProgramTitle={titleDraft.trim()}
        isSubmitting={isSwapSubmitting}
        onConfirmSwap={() => void handleConfirmSwap()}
        onUpgrade={handleUpgradeFromSwap}
        onCancel={handleCancelSwap}
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
        source="vird_editor"
      />
    </PageLayout>
  );
}
