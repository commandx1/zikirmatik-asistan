import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";

type VirdSwapActiveModalProps = {
  visible: boolean;
  currentProgramTitle: string;
  nextProgramTitle: string;
  isSubmitting?: boolean;
  onConfirmSwap: () => void;
  onUpgrade: () => void;
  onCancel: () => void;
};

// VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE ile karşılaşıldığında (editör kaydet
// akışı ve şablon başlatma akışı — bkz. vird-editor-screen.tsx,
// template-detail-screen.tsx) gösterilen ortak seçim: mevcut aktif programı
// duraklatıp yenisini başlat, ya da premium'a geç. "Diğer programlar"
// listesindeki (vird-setup-panel) basit aktifleştirme aynı hatada bunun
// yerine doğrudan paywall açar (kullanıcı orada zaten aynı sonucu iki ayrı
// dokunuşla — önce duraklat, sonra aktifleştir — elde edebilir).
export function VirdSwapActiveModal({
  visible,
  currentProgramTitle,
  nextProgramTitle,
  isSubmitting = false,
  onConfirmSwap,
  onUpgrade,
  onCancel
}: VirdSwapActiveModalProps) {
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <View
          className="w-full max-w-[380px] rounded-2xl p-5"
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.12), backgroundColor: tokens.card }}
        >
          <Text className="mb-2 text-base font-semibold" style={{ color: tokens.textPrimary }}>
            {t("vird:setup.swapActiveTitle")}
          </Text>
          <Text className="text-sm leading-5" style={{ color: tokens.textMuted }}>
            {t("vird:setup.swapActiveMessage", { current: currentProgramTitle, next: nextProgramTitle })}
          </Text>

          <View className="mt-5 gap-2">
            <Pressable
              onPress={onConfirmSwap}
              disabled={isSubmitting}
              className={`h-11 items-center justify-center rounded-full ${isSubmitting ? "opacity-60" : ""}`}
              style={{ backgroundColor: tokens.accent }}
            >
              <Text className="text-sm font-semibold" style={{ color: tokens.bg }}>
                {isSubmitting ? t("vird:setup.swapActiveSubmitting") : t("vird:setup.swapActiveConfirm")}
              </Text>
            </Pressable>
            <Pressable
              onPress={onUpgrade}
              disabled={isSubmitting}
              className="h-11 items-center justify-center rounded-full border"
              style={{ borderColor: withAlpha(tokens.accent, 0.5) }}
            >
              <Text className="text-sm font-semibold" style={{ color: tokens.accent }}>
                {t("vird:setup.swapActiveUpgrade")}
              </Text>
            </Pressable>
            <Pressable onPress={onCancel} disabled={isSubmitting} className="h-10 items-center justify-center rounded-full">
              <Text className="text-sm font-medium" style={{ color: tokens.textMuted }}>
                {t("common:actions.cancel")}
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
