import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { ThemedCard } from "../../../components/ui/themed-card";
import { resolveLocalizedText } from "@zikirmatik/shared";
import { useVirdStore } from "../../../store/vird-store";
import { trackEvent } from "../../../lib/analytics";
import { useVirdProgramActions } from "../hooks/use-vird-program-actions";
import { VIRD_ERROR_CODE } from "../services/vird-error-codes";
import type { VirdProgramLocal } from "../types";
import { VirdSwapActiveModal } from "./vird-swap-active-modal";
import { useAppLocale } from "../../../i18n";

type Props = {
  program: VirdProgramLocal;
  /** Premium gerektiren bir sonuca (aktif program limiti) ulaşıldığında çağrılır (paywall açar). */
  onRequirePremium: () => void;
};

// "Diğer programlar" listesindeki tek bir satır (vird-hub-screen.tsx).
// Aktivasyon VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE ile çakışırsa (ücretsiz plan,
// zaten başka bir aktif program var) KENDİ VirdSwapActiveModal'ını açar —
// diğer akışlarla (editör, şablon, AI) AYNI 3 seçim (bkz. dosya başı notu,
// use-vird-program-actions.ts swapActive).
export function VirdProgramListItem({ program, onRequirePremium }: Props) {
  const { t } = useTranslation("vird");
  const locale = useAppLocale();
  const { tokens } = useThemeTokens();
  const { pauseProgram, deleteProgram, activateProgram, swapActive } = useVirdProgramActions();
  const setNotice = useVirdStore((state) => state.setNotice);
  const programs = useVirdStore((state) => state.programs);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);

  const [isBusy, setIsBusy] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSwapPending, setIsSwapPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isActive = program.status === "active";
  const title = resolveLocalizedText(program.title, locale);
  const currentActiveProgram = programs.find((candidate) => candidate.id === activeProgramId) ?? null;

  const handleToggleActive = async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    setError(undefined);
    try {
      if (isActive) {
        const result = await pauseProgram(program);
        if (!result.ok) {
          setError(result.message);
        }
        return;
      }

      const result = await activateProgram(program);
      if (!result.ok) {
        if (result.code === VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE) {
          setIsSwapPending(true);
        } else {
          setError(result.message);
        }
        return;
      }
      void trackEvent("vird_activated");
      setNotice("started");
    } finally {
      setIsBusy(false);
    }
  };

  const handlePauseAndStart = async () => {
    setIsBusy(true);
    try {
      const result = await swapActive(program);
      setIsSwapPending(false);
      if (result.ok) {
        void trackEvent("vird_activated");
        setNotice("started");
      } else {
        setError(result.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    setIsConfirmingDelete(false);
    setIsBusy(true);
    setError(undefined);
    try {
      const result = await deleteProgram(program);
      if (!result.ok) {
        setError(result.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ThemedCard className="mb-3 rounded-2xl p-4">
      <Text className="mb-0.5 text-sm font-semibold text-[--text-primary]" numberOfLines={1}>
        {title}
      </Text>
      <Text className="mb-3 text-xs text-[--text-muted]">
        {t(`vird:programKind.${program.kind}`)} · {t(`vird:programStatus.${program.status}`)}
      </Text>

      {error ? <Text className="mb-2 text-xs text-[#F97373]">{error}</Text> : null}

      <View className="flex-row items-center gap-2">
        <Pressable
          disabled={isBusy}
          onPress={() => void handleToggleActive()}
          className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
          style={{ borderColor: tokens.accent, opacity: isBusy ? 0.6 : 1 }}
        >
          <FontAwesome6 name={isActive ? "pause" : "play"} iconStyle="solid" size={10} color={tokens.accent} />
          <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
            {isActive ? t("vird:setup.pauseAction") : t("vird:setup.resumeAction")}
          </Text>
        </Pressable>

        <Pressable
          disabled={isBusy}
          onPress={() => setIsConfirmingDelete(true)}
          className="flex-row items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5"
          style={{ opacity: isBusy ? 0.6 : 1 }}
        >
          <FontAwesome6 name="trash" iconStyle="solid" size={10} color={tokens.textMuted} />
          <Text className="text-xs font-semibold" style={{ color: tokens.textMuted }}>
            {t("vird:setup.deleteAction")}
          </Text>
        </Pressable>
      </View>

      <ConfirmModal
        visible={isConfirmingDelete}
        title={t("vird:setup.deleteConfirmTitle")}
        message={t("vird:setup.deleteConfirmMessage", { title })}
        confirmLabel={t("vird:setup.deleteAction")}
        cancelLabel={t("common:actions.cancel")}
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmingDelete(false)}
      />

      <VirdSwapActiveModal
        visible={isSwapPending}
        currentProgramTitle={currentActiveProgram ? resolveLocalizedText(currentActiveProgram.title, locale) : ""}
        nextProgramTitle={title}
        isSubmitting={isBusy}
        onPauseAndStart={() => void handlePauseAndStart()}
        onUpgrade={() => {
          setIsSwapPending(false);
          onRequirePremium();
        }}
        onKeepDraft={() => setIsSwapPending(false)}
      />
    </ThemedCard>
  );
}
