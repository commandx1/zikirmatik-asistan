import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { ThemedCard } from "../../../components/ui/themed-card";
import { TogglePill } from "../../../components/ui/toggle-pill";
import { useProfileStore } from "../../../store/profile-store";
import { useVirdStore } from "../../../store/vird-store";
import { requestNotificationPermissionForToggle } from "../../notifications/services/request-notification-permission";
import { findProvinceByKey } from "../data/tr-provinces";
import { getPrayerTimes, type PrayerTimesResult } from "../services/prayer-times";
import { VirdProvincePicker } from "./vird-province-picker";

type ReminderSlotKey = "morning" | "prayer" | "evening" | "night";

const SLOT_ORDER: readonly ReminderSlotKey[] = ["morning", "prayer", "evening", "night"];

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

type VirdReminderSettingsProps = {
  /** Premium olmayan bir kullanıcı hatırlatma özelliğine dokunduğunda çağrılır (paywall açar). */
  onRequirePremium: () => void;
};

// Global hatırlatma tercihleri (useVirdStore.reminderPrefs — TÜM programlar
// için tek bir cihaz ayarı, program-özel bir alan DEĞİL) için ayar paneli.
// Gerçek zamanlama use-vird-reminder-sync.ts (app/_layout.tsx'e zaten mount
// edilmiş, BURADAN dokunulmuyor) tarafından bu store'u dinleyerek reaktif
// olarak yapılır — bu bileşen yalnızca setReminderPrefs çağırır.
export function VirdReminderSettings({ onRequirePremium }: VirdReminderSettingsProps) {
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();
  const isPremium = useProfileStore((state) => state.isPremium);
  const reminderPrefs = useVirdStore((state) => state.reminderPrefs);
  const setReminderPrefs = useVirdStore((state) => state.setReminderPrefs);

  const [isPickerOpen, setPickerOpen] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const province = reminderPrefs.provinceKey ? findProvinceByKey(reminderPrefs.provinceKey) : undefined;
  const preview: PrayerTimesResult | null = province ? getPrayerTimes(province.key, new Date()) : null;

  const handleToggleEnabled = async (next: boolean) => {
    if (!isPremium) {
      onRequirePremium();
      return;
    }
    if (!next) {
      setReminderPrefs({ enabled: false });
      return;
    }

    setIsRequestingPermission(true);
    try {
      const granted = await requestNotificationPermissionForToggle();
      if (granted) {
        setReminderPrefs({ enabled: true });
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleToggleSlot = (slot: ReminderSlotKey, next: boolean) => {
    if (!isPremium) {
      onRequirePremium();
      return;
    }
    setReminderPrefs({ slots: { [slot]: next } });
  };

  const handleOpenProvincePicker = () => {
    if (!isPremium) {
      onRequirePremium();
      return;
    }
    setPickerOpen(true);
  };

  return (
    <ThemedCard className="mb-4 rounded-2xl p-4">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-[--text-primary]">{t("vird:reminders.settingsTitle")}</Text>
        <TogglePill
          checked={isPremium && reminderPrefs.enabled}
          onToggle={(next) => void handleToggleEnabled(next)}
          size="compact"
        />
      </View>
      <Text className="mb-3 text-xs leading-4 text-[--text-muted]">
        {isPremium
          ? isRequestingPermission
            ? t("vird:reminders.requestingPermission")
            : t("vird:reminders.settingsSubtitle")
          : t("vird:reminders.premiumRequiredNote")}
      </Text>

      <View style={{ opacity: isPremium ? 1 : 0.5 }}>
        <Text className="mb-2 text-xs font-semibold text-[--text-muted]">{t("vird:reminders.slotsHeading")}</Text>
        <View className="mb-4 gap-2.5">
          {SLOT_ORDER.map((slot) => (
            <View key={slot} className="flex-row items-center justify-between">
              <Text className="text-sm text-[--text-primary]">{t(`vird:slots.${slot}`)}</Text>
              <TogglePill checked={reminderPrefs.slots[slot]} onToggle={(next) => handleToggleSlot(slot, next)} size="compact" />
            </View>
          ))}
        </View>

        <Text className="mb-1.5 text-xs font-semibold text-[--text-muted]">{t("vird:reminders.provinceLabel")}</Text>
        <Pressable
          onPress={handleOpenProvincePicker}
          className="mb-1 flex-row items-center justify-between rounded-xl border px-3.5 py-3"
          style={{ borderColor: withAlpha(tokens.textPrimary, 0.12), backgroundColor: tokens.bg }}
        >
          <Text style={{ color: province ? tokens.textPrimary : withAlpha(tokens.textMuted, 0.85) }} className="text-sm">
            {province?.name ?? t("vird:reminders.provincePlaceholder")}
          </Text>
        </Pressable>

        {preview && province ? (
          <View className="mt-2">
            <Text className="mb-1 text-xs font-semibold text-[--text-muted]">{t("vird:reminders.previewHeading")}</Text>
            <Text className="text-xs leading-4 text-[--text-primary]">
              {t("vird:prayerIndex.1")} {formatClock(preview.fajr)} · {t("vird:prayerIndex.2")} {formatClock(preview.dhuhr)} ·{" "}
              {t("vird:prayerIndex.3")} {formatClock(preview.asr)} · {t("vird:prayerIndex.4")} {formatClock(preview.maghrib)} ·{" "}
              {t("vird:prayerIndex.5")} {formatClock(preview.isha)}
            </Text>
            <Text className="mt-1 text-[11px]" style={{ color: tokens.textMuted }}>
              {t("vird:reminders.approxNote")}
            </Text>
          </View>
        ) : null}
      </View>

      <VirdProvincePicker
        visible={isPickerOpen}
        selectedKey={reminderPrefs.provinceKey}
        onSelect={(selected) => setReminderPrefs({ provinceKey: selected.key })}
        onRequestClose={() => setPickerOpen(false)}
      />
    </ThemedCard>
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
