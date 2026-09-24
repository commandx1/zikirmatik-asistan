import type { ThemeName } from "@zikirmatik/shared";
import type { AppFontFamily } from "../../../store/theme-store";
import { THEME_LABELS } from "../../../theme/labels";
import type { BackendUser } from "./users-api-client";

export function normalizeThemeName(value: string | undefined): ThemeName | undefined {
  if (!value) {
    return undefined;
  }

  return value in THEME_LABELS ? (value as ThemeName) : undefined;
}

export function normalizeFontFamily(value: string | undefined): AppFontFamily | undefined {
  if (
    value === "default" ||
    value === "merriweather" ||
    value === "intel-one-mono" ||
    value === "finlandica-headline" ||
    value === "indie-flower"
  ) {
    return value;
  }

  return undefined;
}

// Sunucu kullanıcı belgesini profile-store / theme-store hidrasyon
// yüklerine çevirir (saf).
export function toBackendUserHydration(user: BackendUser) {
  return {
    profile: {
      displayName: user.displayName,
      isPremium: user.isPremium,
      reminderTime: user.notifSettings?.reminderTime,
      dailyReminderEnabled: user.notifSettings?.dailyReminder,
      kandilNotificationsEnabled: user.notifSettings?.kandilNotifications,
      // hapticsEnabled eski istemciler/sunucular için korunuyor;
      // hapticsPattern varsa önceliklidir, yoksa store içinde
      // hapticsEnabled'dan türetilir (bkz. resolveHapticsPattern).
      hapticsEnabled: user.hapticsEnabled,
      hapticsPattern: user.hapticsPattern
    },
    appearance: {
      themeName: normalizeThemeName(user.theme),
      fontFamily: normalizeFontFamily(user.fontFamily)
    }
  };
}
