import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";

type VirdSwapActiveModalProps = {
  visible: boolean;
  currentProgramTitle: string;
  nextProgramTitle: string;
  isSubmitting?: boolean;
  onPauseAndStart: () => void;
  onUpgrade: () => void;
  /** Yeni programı aktive etmekten vazgeçip taslak olarak bırakır. */
  onKeepDraft: () => void;
};

// VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE ile karşılaşıldığında (editör kaydet,
// şablon başlatma, AI ile oluşturma ve "diğer programlar" listesindeki
// aktifleştirme akışlarının HEPSİNİN paylaştığı) gösterilen ortak 3 seçim:
// mevcut aktif programı duraklatıp yenisini başlat, premium'a geç, ya da
// yeniyi taslak olarak bırak (bkz. hooks/use-vird-program-actions.ts
// swapActive). `onRequestClose` kasıtlı olarak `onKeepDraft` ile aynıdır —
// geri tuşu/dışarı dokunma da "taslak olarak bırak" anlamına gelir.
export function VirdSwapActiveModal({
  visible,
  currentProgramTitle,
  nextProgramTitle,
  isSubmitting = false,
  onPauseAndStart,
  onUpgrade,
  onKeepDraft
}: VirdSwapActiveModalProps) {
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepDraft}>
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <View
          className="w-full max-w-[380px] rounded-2xl p-5"
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.12), backgroundColor: tokens.card }}
        >
          <Text className="mb-2 text-base font-semibold" style={{ color: tokens.textPrimary }}>
            {t("vird:conflict.title")}
          </Text>
          <Text className="text-sm leading-5" style={{ color: tokens.textMuted }}>
            {t("vird:conflict.message", { current: currentProgramTitle, next: nextProgramTitle })}
          </Text>

          <View className="mt-5 gap-2">
            <Pressable
              onPress={onPauseAndStart}
              disabled={isSubmitting}
              className={`h-11 items-center justify-center rounded-full ${isSubmitting ? "opacity-60" : ""}`}
              style={{ backgroundColor: tokens.accent }}
            >
              <Text className="text-sm font-semibold" style={{ color: tokens.bg }}>
                {isSubmitting ? t("vird:conflict.submitting") : t("vird:conflict.pauseAndStart")}
              </Text>
            </Pressable>
            <Pressable
              onPress={onUpgrade}
              disabled={isSubmitting}
              className="h-11 items-center justify-center rounded-full border"
              style={{ borderColor: withAlpha(tokens.accent, 0.5) }}
            >
              <Text className="text-sm font-semibold" style={{ color: tokens.accent }}>
                {t("vird:conflict.upgrade")}
              </Text>
            </Pressable>
            <Pressable onPress={onKeepDraft} disabled={isSubmitting} className="h-10 items-center justify-center rounded-full">
              <Text className="text-sm font-medium" style={{ color: tokens.textMuted }}>
                {t("vird:conflict.keepDraft")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
