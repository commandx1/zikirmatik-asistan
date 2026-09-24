import { i18n } from "../i18n";
import { toIntlLocale } from "../lib/locale-format";
import { useProfileStore } from "./profile-store";
import { registerDhikrStoreText } from "./dhikr-store-text";

// Yan etkili modül: app/_layout.tsx en başta import eder. Üretilen metinler
// kalıcı veriye yazılır (widget + local-streak eski etiket ayrıştırması
// okur); biçimi değiştirmeyin.
const intlLocale = () => toIntlLocale(useProfileStore.getState().locale);

registerDhikrStoreText({
  saved: () => i18n.t("focus:relativeDate.saved"),
  notStarted: () => i18n.t("focus:relativeDate.notStarted"),
  todayAt: (now) => {
    const time = now.toLocaleTimeString(intlLocale(), {
      hour: "2-digit",
      minute: "2-digit"
    });

    return i18n.t("focus:relativeDate.todayAt", { time });
  },
  lowercase: (value) => value.toLocaleLowerCase(intlLocale())
});
