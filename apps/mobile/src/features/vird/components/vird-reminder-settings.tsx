import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import { useThemeTokens } from "@zikirmatik/ui";
import { ThemedCard } from "../../../components/ui/themed-card";
import { TogglePill } from "../../../components/ui/toggle-pill";
import { useProfileStore } from "../../../store/profile-store";
import { useVirdStore } from "../../../store/vird-store";
import { requestNotificationPermissionForToggle } from "../../notifications/services/request-notification-permission";
import { resolvePrayerTimes, type PrayerTimesResult } from "../services/prayer-times";
import { withAlpha } from "@zikirmatik/shared";

type ReminderSlotKey = "morning" | "prayer" | "evening" | "night";

const SLOT_ORDER: readonly ReminderSlotKey[] = ["morning", "prayer", "evening", "night"];

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
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
//
// FAZ C: ücretsiz kullanıcı için toggle'lar/konum satırı hiç RENDER EDİLMEZ
// (eskiden dim + onRequirePremium ile korunuyordu) — yalnızca tek bir "aç" CTA'sı.
export function VirdReminderSettings({ onRequirePremium }: VirdReminderSettingsProps) {
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();
  const isPremium = useProfileStore((state) => state.isPremium);
  const reminderPrefs = useVirdStore((state) => state.reminderPrefs);
  const setReminderPrefs = useVirdStore((state) => state.setReminderPrefs);

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const preview: PrayerTimesResult = useMemo(
    () => resolvePrayerTimes(reminderPrefs.coords, new Date()),
    [reminderPrefs.coords]
  );

  const handleToggleEnabled = async (next: boolean) => {
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
    setReminderPrefs({ slots: { [slot]: next } });
  };

  const handleUseLocation = async () => {
    setIsRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Ret durumunda hata modalı YOK — sessizce sabit saat tablosunda kalınır.
        return;
      }
      const position =
        (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      if (!position) {
        return;
      }
      setReminderPrefs({
        coords: { lat: round3(position.coords.latitude), lng: round3(position.coords.longitude) }
      });
    } finally {
      setIsRequestingLocation(false);
    }
  };

  if (!isPremium) {
    return (
      <ThemedCard className="mb-4 rounded-2xl p-4">
        <Text className="mb-1 text-sm font-semibold text-text-primary">{t("vird:reminders.settingsTitle")}</Text>
        <Text className="mb-3 text-xs leading-4 text-text-muted">{t("vird:reminders.premiumRequiredNote")}</Text>
        <Pressable onPress={onRequirePremium} className="self-start rounded-full px-4 py-2" style={{ backgroundColor: tokens.accent }}>
          <Text className="text-xs font-semibold" style={{ color: tokens.bg }}>
            {t("vird:reminders.unlockCta")}
          </Text>
        </Pressable>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard className="mb-4 rounded-2xl p-4">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-text-primary">{t("vird:reminders.settingsTitle")}</Text>
        <TogglePill checked={reminderPrefs.enabled} onToggle={(next) => void handleToggleEnabled(next)} size="compact" />
      </View>
      <Text className="mb-3 text-xs leading-4 text-text-muted">
        {isRequestingPermission ? t("vird:reminders.requestingPermission") : t("vird:reminders.settingsSubtitle")}
      </Text>

      <Text className="mb-2 text-xs font-semibold text-text-muted">{t("vird:reminders.slotsHeading")}</Text>
      <View className="mb-4 gap-2.5">
        {SLOT_ORDER.map((slot) => (
          <View key={slot} className="flex-row items-center justify-between">
            <Text className="text-sm text-text-primary">{t(`vird:slots.${slot}`)}</Text>
            <TogglePill checked={reminderPrefs.slots[slot]} onToggle={(next) => handleToggleSlot(slot, next)} size="compact" />
          </View>
        ))}
      </View>

      <Text className="mb-1.5 text-xs text-text-muted">
        {reminderPrefs.coords ? t("vird:reminders.locationGps") : t("vird:reminders.locationFixed")}
      </Text>
      <Pressable
        onPress={() => void handleUseLocation()}
        disabled={isRequestingLocation}
        className="mb-3 self-start rounded-full border px-4 py-2"
        style={{ borderColor: withAlpha(tokens.textPrimary, 0.12) }}
      >
        <Text className="text-xs font-semibold" style={{ color: tokens.textPrimary }}>
          {t("vird:reminders.useLocation")}
        </Text>
      </Pressable>

      {/* Konum yokken "yaklaşık vakit" önizlemesi yanıltıcı olur (sabit tablo);
          durum satırı zaten sabit saatleri yazıyor. */}
      {reminderPrefs.coords ? (
      <View className="mt-1">
        <Text className="mb-1 text-xs font-semibold text-text-muted">{t("vird:reminders.previewHeading")}</Text>
        <Text className="text-xs leading-4 text-text-primary">
          {t("vird:prayerIndex.1")} {formatClock(preview.fajr)} · {t("vird:prayerIndex.2")} {formatClock(preview.dhuhr)} ·{" "}
          {t("vird:prayerIndex.3")} {formatClock(preview.asr)} · {t("vird:prayerIndex.4")} {formatClock(preview.maghrib)} ·{" "}
          {t("vird:prayerIndex.5")} {formatClock(preview.isha)}
        </Text>
        <Text className="mt-1 text-[11px]" style={{ color: tokens.textMuted }}>
          {t("vird:reminders.approxNote")}
        </Text>
      </View>
      ) : null}
    </ThemedCard>
  );
}

