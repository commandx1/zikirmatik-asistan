import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppSelectBox } from "../../../components/ui/app-selectbox";
import { KeyboardAwareBottomSheetModal } from "../../../components/ui/keyboard-aware-bottom-sheet-modal";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { label: value, value };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { label: value, value };
});

type ProfileReminderTimeModalProps = {
  visible: boolean;
  hourDraft: string;
  minuteDraft: string;
  isSaving: boolean;
  canSave: boolean;
  error?: string;
  onChangeHour: (value: string) => void;
  onChangeMinute: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function ProfileReminderTimeModal({
  visible,
  hourDraft,
  minuteDraft,
  isSaving,
  canSave,
  error,
  onChangeHour,
  onChangeMinute,
  onSave,
  onClose
}: ProfileReminderTimeModalProps) {
  const { t } = useTranslation(["profile", "common"]);

  return (
    <KeyboardAwareBottomSheetModal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      showHandle
      overlayClassName="flex-1 justify-end bg-black/55"
      sheetClassName="rounded-t-3xl border-t border-white/10 bg-[--card] p-5 pb-10"
      scrollContentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className="mb-1 text-lg font-semibold text-[--text-primary]">{t("profile:reminderTimeModal.title")}</Text>
      <Text className="mb-4 text-xs text-[--text-muted]">
        {t("profile:reminderTimeModal.description")}
      </Text>

      <View className="flex-row items-end gap-3">
        <View className="flex-1">
          <Text className="mb-1.5 text-xs font-medium text-[--text-primary]">{t("profile:reminderTimeModal.hour")}</Text>
          <AppSelectBox
            value={hourDraft}
            options={HOUR_OPTIONS}
            onChange={onChangeHour}
            title={t("profile:reminderTimeModal.hourPickerTitle")}
          />
        </View>
        <Text className="mb-3 text-lg font-semibold text-[--text-muted]">:</Text>
        <View className="flex-1">
          <Text className="mb-1.5 text-xs font-medium text-[--text-primary]">{t("profile:reminderTimeModal.minute")}</Text>
          <AppSelectBox
            value={minuteDraft}
            options={MINUTE_OPTIONS}
            onChange={onChangeMinute}
            title={t("profile:reminderTimeModal.minutePickerTitle")}
          />
        </View>
      </View>

      {error ? <Text className="mt-3 text-xs text-[#F97373]">{error}</Text> : null}

      <View className="mt-4 flex-row items-center justify-end gap-2">
        <Pressable
          onPress={onClose}
          disabled={isSaving}
          className={`rounded-full border border-white/20 px-4 py-2 ${isSaving ? "opacity-60" : ""}`}
        >
          <Text className="text-sm font-medium text-[--text-primary]">{t("common:actions.cancel")}</Text>
        </Pressable>
        <PrimaryCtaButton
          label={isSaving ? t("common:actions.saving") : t("common:actions.save")}
          onPress={onSave}
          disabled={!canSave || isSaving}
          className={`px-4 !py-2 ${!canSave || isSaving ? "opacity-50" : ""}`}
          textClassName="text-sm font-semibold"
        />
      </View>
    </KeyboardAwareBottomSheetModal>
  );
}
