import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { saveUserPreferences } from "../../users/services/users-api-client";
import { syncDailyReminderNotification } from "../services/daily-reminder-notifications";
import { normalizeTimeUnit, parseReminderTime } from "../services/profile-format";

export function useReminderTimeModal() {
  const { t } = useTranslation(["profile", "common"]);
  const reminderTime = useProfileStore((s) => s.reminderTime);
  const dailyReminderEnabled = useProfileStore((s) => s.dailyReminderEnabled);
  const setReminderTime = useProfileStore((s) => s.setReminderTime);
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);

  const [isReminderTimeModalOpen, setIsReminderTimeModalOpen] = useState(false);
  const [reminderHourDraft, setReminderHourDraft] = useState("08");
  const [reminderMinuteDraft, setReminderMinuteDraft] = useState("00");
  const [isSavingReminderTime, setIsSavingReminderTime] = useState(false);
  const [reminderTimeError, setReminderTimeError] = useState<string>();

  const normalizedReminderDraft = `${normalizeTimeUnit(reminderHourDraft)}:${normalizeTimeUnit(reminderMinuteDraft)}`;
  const canSaveReminderTime = normalizedReminderDraft !== reminderTime && !isSavingReminderTime;

  const openReminderTimeModal = () => {
    const parsed = parseReminderTime(reminderTime);
    setReminderHourDraft(String(parsed.hour).padStart(2, "0"));
    setReminderMinuteDraft(String(parsed.minute).padStart(2, "0"));
    setReminderTimeError(undefined);
    setIsReminderTimeModalOpen(true);
  };

  const closeReminderTimeModal = () => {
    if (isSavingReminderTime) {
      return;
    }
    setReminderTimeError(undefined);
    setIsReminderTimeModalOpen(false);
  };

  const onReminderHourChange = (value: string) => {
    setReminderHourDraft(value);
    if (reminderTimeError) {
      setReminderTimeError(undefined);
    }
  };

  const onReminderMinuteChange = (value: string) => {
    setReminderMinuteDraft(value);
    if (reminderTimeError) {
      setReminderTimeError(undefined);
    }
  };

  const saveReminderTime = async () => {
    const parsed = parseReminderTime(normalizedReminderDraft);
    if (!parsed.isValid) {
      setReminderTimeError(t("profile:reminderTimeModal.invalidTime"));
      return;
    }

    const nextReminderTime = `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
    const previousReminderTime = reminderTime;
    setReminderTime(nextReminderTime);
    setReminderTimeError(undefined);
    setIsSavingReminderTime(true);

    try {
      await syncDailyReminderNotification({
        enabled: dailyReminderEnabled,
        reminderTime: nextReminderTime,
        requestPermission: false
      });

      if (authStatus === "authenticated" && session?.userId) {
        await saveUserPreferences(session.userId, {
          reminderTime: nextReminderTime,
          dailyReminder: dailyReminderEnabled
        });
      }

      setIsReminderTimeModalOpen(false);
    } catch {
      setReminderTime(previousReminderTime);
      setReminderTimeError(t("profile:errors.reminderTimeUpdateFailed"));
    } finally {
      setIsSavingReminderTime(false);
    }
  };

  return {
    isReminderTimeModalOpen,
    reminderHourDraft,
    reminderMinuteDraft,
    isSavingReminderTime,
    reminderTimeError,
    canSaveReminderTime,
    openReminderTimeModal,
    closeReminderTimeModal,
    onReminderHourChange,
    onReminderMinuteChange,
    saveReminderTime
  };
}
