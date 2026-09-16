import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as Crypto from "expo-crypto";
import { useTranslation } from "react-i18next";
import { toDateKey, type VirdPhase, type VirdSlotKey } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedInput } from "../../../components/ui/themed-input";
import { ThemedTag } from "../../../components/ui/themed-tag";
import { TogglePill } from "../../../components/ui/toggle-pill";
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
import { dayIndexFor, phaseForDay, resolveDhikrRef, VIRD_SLOT_KEYS } from "../services/vird-day";
import { buildAutoVirdTitle, buildEditorSlotsFromPhase, toLocalizedText, type EditorSlots } from "../services/vird-editor-helpers";
import { VIRD_ERROR_CODE, resolveVirdErrorMessage } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import type { DhikrSnapshot, VirdProgramLocal } from "../types";

type PendingSwap = { localProgram: VirdProgramLocal };

function nowIso(): string {
  return new Date().toISOString();
}

function buildPhasesFromEditorSlots(slots: EditorSlots, enabledSlots: readonly VirdSlotKey[]): VirdPhase[] {
  const phaseSlots: EditorSlots = {};

  for (const slot of VIRD_SLOT_KEYS) {
    if (!enabledSlots.includes(slot)) {
      continue;
    }
    const items = slots[slot];
    if (!items || items.length === 0) {
      continue;
    }
    phaseSlots[slot] = items;
  }

  return [
    {
      fromDay: 1,
      toDay: null,
      slots: Object.fromEntries(
        Object.entries(phaseSlots).map(([slot, items]) => [
          slot,
          (items as VirdEditorSlotItem[]).map((item) => ({
            ...(item.isCustom ? { customDhikrId: item.ref } : { dhikrId: item.ref }),
            target: Math.max(1, Math.floor(item.target) || 1)
          }))
        ])
      )
    }
  ];
}

type VirdEditorScreenProps = { programId?: string; cloneFromId?: string };

// Vird programı editörü. İki mod: (1) rutin (yeni oluşturma ya da tek fazlı
// manuel bir programı düzenleme) — dilim çipleri + zikir seçimi; (2) journey
// (kind:'journey' ya da birden fazla fazı olan bir program, ör. şablon/AI
// kaynaklı) — fazlar SALT-OKUNUR gösterilir, yalnız ad + namaz vakitleri
// düzenlenebilir, kaydet yalnız {title,prayerSelection} gönderir. Journey
// modundan "Kopyala ve uyarla" ile o günün fazı yeni bir rutin taslağa
// tohumlanabilir (fazlara dokunmadan).
export function VirdEditorScreen({ programId, cloneFromId }: VirdEditorScreenProps) {
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
  const setNotice = useVirdStore((state) => state.setNotice);
  const { activateProgram, swapActive } = useVirdProgramActions();
  const premiumSheet = usePremiumSheet();

  const existingProgram = useMemo(
    () => (programId ? programs.find((program) => program.id === programId) ?? null : null),
    [programs, programId]
  );
  const cloneSourceProgram = useMemo(
    () => (cloneFromId ? programs.find((program) => program.id === cloneFromId) ?? null : null),
    [programs, cloneFromId]
  );
  const currentActiveProgram = useMemo(
    () => programs.find((program) => program.id === activeProgramId) ?? null,
    [programs, activeProgramId]
  );

  useHydrateVirdSnapshots(existingProgram?.id ?? null);
  useHydrateVirdSnapshots(cloneSourceProgram?.id ?? null);

  const journeyMode = Boolean(existingProgram) && (existingProgram!.kind === "journey" || existingProgram!.phases.length > 1);

  const [titleDraft, setTitleDraft] = useState("");
  const [enabledSlots, setEnabledSlots] = useState<VirdSlotKey[]>(["morning", "evening"]);
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
    if (initializedRef.current) {
      return;
    }

    if (existingProgram) {
      initializedRef.current = true;
      setTitleDraft(resolveLocalizedText(existingProgram.title, locale));
      setPrayerSelection(
        existingProgram.prayerSelection && existingProgram.prayerSelection.length > 0
          ? existingProgram.prayerSelection
          : [1, 2, 3, 4, 5]
      );
      if (!journeyMode) {
        const phaseSlots = buildEditorSlotsFromPhase(existingProgram.phases[0]);
        setSlots(phaseSlots);
        setEnabledSlots(Object.keys(phaseSlots) as VirdSlotKey[]);
      }
      return;
    }

    if (cloneFromId) {
      if (!cloneSourceProgram) {
        return; // henüz store'a hidrasyon gelmedi; program yüklenince tekrar denenir
      }
      initializedRef.current = true;
      const todayKey = toDateKey(new Date());
      const dayIndex = dayIndexFor(cloneSourceProgram, todayKey);
      const sourcePhase = phaseForDay(cloneSourceProgram, dayIndex) ?? cloneSourceProgram.phases[0];
      const phaseSlots = buildEditorSlotsFromPhase(sourcePhase);
      setTitleDraft(`${resolveLocalizedText(cloneSourceProgram.title, locale)} ${t("vird:editor.autoTitleSuffix")}`);
      setSlots(phaseSlots);
      setEnabledSlots(Object.keys(phaseSlots) as VirdSlotKey[]);
      setPrayerSelection(
        cloneSourceProgram.prayerSelection && cloneSourceProgram.prayerSelection.length > 0
          ? cloneSourceProgram.prayerSelection
          : [1, 2, 3, 4, 5]
      );
      setSessionSnapshots((prev) => ({ ...prev, ...cloneSourceProgram.dhikrs }));
      return;
    }

    initializedRef.current = true;
    // Yeni (boş) bir rutin: varsayılan çipler morning+evening (bkz.
    // buildAutoVirdTitle ile eşleşen "Sabah-Akşam virdi" varsayılan başlığı).
    // NOT: `locale`/`t` bilinçli olarak bağımlılık dizisinde değil — yalnızca
    // İLK yüklemede kullanılır (initializedRef guard'ı).
  }, [existingProgram, cloneFromId, cloneSourceProgram, journeyMode]);

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

  const toggleEnabledSlot = (slot: VirdSlotKey) => {
    setEnabledSlots((prev) => (prev.includes(slot) ? prev.filter((value) => value !== slot) : [...prev, slot]));
  };

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

  const goToHub = (notice: "started" | "saved" | "draft") => {
    setNotice(notice);
    router.dismissTo("/vird" as Href);
  };

  const handleSaveRoutine = async () => {
    const phases = buildPhasesFromEditorSlots(slots, enabledSlots);
    const hasAnyDhikr = Object.values(phases[0]?.slots ?? {}).some((items) => items && items.length > 0);
    if (!hasAnyDhikr) {
      setSaveError(t("vird:editor.errors.atLeastOneDhikr"));
      return;
    }

    const trimmedTitle = titleDraft.trim();
    const title = trimmedTitle ? toLocalizedText(trimmedTitle) : buildAutoVirdTitle(enabledSlots);

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
        const server = await updateVirdProgram(existingProgram.id, { title, phases, prayerSelection }, accessToken as string);
        localProgram = { ...toLocalVirdProgram(server, existingProgram), dhikrs: dhikrsSnapshot };
      } else {
        const seedClientId = existingProgram?.clientId ?? Crypto.randomUUID();
        const server = await createVirdProgram(
          {
            clientId: seedClientId,
            title,
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
        title,
        startDate: existingProgram?.startDate ?? todayKey,
        phases,
        prayerSelection,
        reminders: existingProgram?.reminders ?? { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
        dhikrs: dhikrsSnapshot,
        createdAt: existingProgram?.createdAt ?? nowIso(),
        updatedAt: nowIso()
      };
    }

    upsertProgram(localProgram);
    // Bir origin:'local' programın id'si (üye ilk kez sunucuya yazarken)
    // clientId aynı kalsa da sunucunun gerçek _id'sine değişebilir — bu
    // program az önce ana ekranın takip ettiği program İDİYSE referansı
    // hemen güncelle (bkz. use-vird-backend-sync.ts'teki AYNI kural).
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
        setPendingSwap({ localProgram });
        return;
      }
      setSaveError(activation.message || t("vird:editor.errors.activateFailed"));
      return;
    }

    void trackEvent("vird_activated");
    goToHub(existingProgram ? "saved" : "started");
  };

  const handleSaveJourney = async () => {
    if (!existingProgram) {
      return;
    }
    const trimmedTitle = titleDraft.trim();
    const title = trimmedTitle ? toLocalizedText(trimmedTitle) : existingProgram.title;

    let localProgram: VirdProgramLocal;
    const isMember = authStatus === "authenticated" && Boolean(accessToken);

    if (isMember && existingProgram.origin === "server") {
      const server = await updateVirdProgram(existingProgram.id, { title, prayerSelection }, accessToken as string);
      localProgram = toLocalVirdProgram(server, existingProgram);
    } else {
      localProgram = { ...existingProgram, title, prayerSelection, updatedAt: nowIso() };
    }

    upsertProgram(localProgram);

    const activation = await activateProgram(localProgram);
    if (!activation.ok) {
      if (activation.code === VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE) {
        setPendingSwap({ localProgram });
        return;
      }
      setSaveError(activation.message || t("vird:editor.errors.activateFailed"));
      return;
    }

    void trackEvent("vird_activated");
    goToHub("saved");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(undefined);
    try {
      if (journeyMode) {
        await handleSaveJourney();
      } else {
        await handleSaveRoutine();
      }
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

  const handlePauseAndStart = async () => {
    if (!pendingSwap) {
      return;
    }
    setIsSwapSubmitting(true);
    try {
      const retry = await swapActive(pendingSwap.localProgram);
      setPendingSwap(null);
      if (retry.ok) {
        void trackEvent("vird_activated");
        goToHub("started");
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

  const handleKeepDraft = () => {
    setPendingSwap(null);
    goToHub("draft");
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
          placeholder={journeyMode ? t("vird:editor.titlePlaceholder") : resolveLocalizedText(buildAutoVirdTitle(enabledSlots), locale)}
          className="mb-4 rounded-xl bg-[--card] px-3"
        />

        {journeyMode ? (
          <>
            <Text className="mb-2 text-xs font-semibold text-[--text-muted]">{t("vird:editor.journeyReadOnlyNote")}</Text>
            <View className="mb-4 gap-2">
              {existingProgram!.phases.map((phase, index) => (
                <View key={`${phase.fromDay}-${index}`} className="rounded-xl border border-white/10 bg-[--card] px-3 py-2.5">
                  <Text className="text-xs font-semibold text-[--accent]">
                    {phase.toDay != null
                      ? t("vird:templates.detail.dayRangeLabel", { from: phase.fromDay, to: phase.toDay })
                      : t("vird:templates.detail.dayRangeOpenLabel", { from: phase.fromDay })}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mb-2 text-xs font-semibold text-[--text-muted]">{t("vird:editor.prayerHeading")}</Text>
            <View className="mb-6 gap-1 rounded-2xl border border-white/10 bg-[--card] px-4 py-2">
              {[1, 2, 3, 4, 5].map((index) => (
                <View key={index} className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-[--text-primary]">{t(`vird:prayerIndex.${index}`)}</Text>
                  <TogglePill checked={prayerSelection.includes(index)} onToggle={() => handleTogglePrayerIndex(index)} size="compact" />
                </View>
              ))}
            </View>

            {/* "Kopyala ve uyarla" — o günün fazını yeni bir rutin taslağa tohumlar. */}
            <PrimaryCtaButton
              label={t("vird:editor.cloneAndAdapt")}
              onPress={() => router.push({ pathname: "/vird/editor", params: { cloneFrom: existingProgram!.id } })}
              className="mb-3"
            />
          </>
        ) : (
          <>
            <Text className="mb-2 text-xs font-semibold text-[--text-muted]">{t("vird:editor.whenHeading")}</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {VIRD_SLOT_KEYS.map((slot) => (
                <ThemedTag
                  key={slot}
                  label={t(`vird:slots.${slot}`)}
                  variant={enabledSlots.includes(slot) ? "accent" : "soft"}
                  onPress={() => toggleEnabledSlot(slot)}
                />
              ))}
            </View>

            {VIRD_SLOT_KEYS.filter((slot) => enabledSlots.includes(slot)).map((slot) => (
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
          </>
        )}

        {saveError ? <Text className="mb-3 text-xs text-[#F97373]">{saveError}</Text> : null}

        <PrimaryCtaButton
          label={isSaving ? t("vird:editor.savingButton") : existingProgram ? t("vird:editor.saveButton") : t("vird:editor.saveAndStart")}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className={isSaving ? "opacity-60" : ""}
        />
      </PageScrollView>

      {!journeyMode ? (
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
          onRemove={(ref) => {
            if (activeSlotForPicker) {
              handleRemoveFromSlot(activeSlotForPicker, ref);
            }
          }}
        />
      ) : null}

      <VirdSwapActiveModal
        visible={pendingSwap !== null}
        currentProgramTitle={currentActiveProgram ? resolveLocalizedText(currentActiveProgram.title, locale) : ""}
        nextProgramTitle={
          pendingSwap
            ? resolveLocalizedText(pendingSwap.localProgram.title, locale)
            : titleDraft.trim() || (existingProgram ? resolveLocalizedText(existingProgram.title, locale) : "")
        }
        isSubmitting={isSwapSubmitting}
        onPauseAndStart={() => void handlePauseAndStart()}
        onUpgrade={handleUpgradeFromSwap}
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
        source="vird_editor"
      />
    </PageLayout>
  );
}
