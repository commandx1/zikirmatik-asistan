import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import trCommon from "./locales/tr/common.json";
import trProfile from "./locales/tr/profile.json";
import trHome from "./locales/tr/home.json";
import trFocus from "./locales/tr/focus.json";
import trAiGuide from "./locales/tr/ai-guide.json";
import trCollections from "./locales/tr/collections.json";
import trSpecialDays from "./locales/tr/special-days.json";
import trStats from "./locales/tr/stats.json";
import trAuth from "./locales/tr/auth.json";
import trOnboarding from "./locales/tr/onboarding.json";
import trSubscriptions from "./locales/tr/subscriptions.json";
import trNotifications from "./locales/tr/notifications.json";
import trComponents from "./locales/tr/components.json";
import trThemeSelector from "./locales/tr/theme-selector.json";
import trFontSelector from "./locales/tr/font-selector.json";
import trTour from "./locales/tr/tour.json";
import trDhikrs from "./locales/tr/dhikrs.json";
import trUsers from "./locales/tr/users.json";
import enCommon from "./locales/en/common.json";
import enProfile from "./locales/en/profile.json";
import enHome from "./locales/en/home.json";
import enFocus from "./locales/en/focus.json";
import enAiGuide from "./locales/en/ai-guide.json";
import enCollections from "./locales/en/collections.json";
import enSpecialDays from "./locales/en/special-days.json";
import enStats from "./locales/en/stats.json";
import enAuth from "./locales/en/auth.json";
import enOnboarding from "./locales/en/onboarding.json";
import enSubscriptions from "./locales/en/subscriptions.json";
import enNotifications from "./locales/en/notifications.json";
import enComponents from "./locales/en/components.json";
import enThemeSelector from "./locales/en/theme-selector.json";
import enFontSelector from "./locales/en/font-selector.json";
import enTour from "./locales/en/tour.json";
import enDhikrs from "./locales/en/dhikrs.json";
import enUsers from "./locales/en/users.json";

export type SupportedLocale = "tr" | "en";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["tr", "en"];
export const DEFAULT_LOCALE: SupportedLocale = "tr";

const resources = {
  tr: {
    common: trCommon,
    profile: trProfile,
    home: trHome,
    focus: trFocus,
    "ai-guide": trAiGuide,
    collections: trCollections,
    "special-days": trSpecialDays,
    stats: trStats,
    auth: trAuth,
    onboarding: trOnboarding,
    subscriptions: trSubscriptions,
    notifications: trNotifications,
    components: trComponents,
    "theme-selector": trThemeSelector,
    "font-selector": trFontSelector,
    tour: trTour,
    dhikrs: trDhikrs,
    users: trUsers
  },
  en: {
    common: enCommon,
    profile: enProfile,
    home: enHome,
    focus: enFocus,
    "ai-guide": enAiGuide,
    collections: enCollections,
    "special-days": enSpecialDays,
    stats: enStats,
    auth: enAuth,
    onboarding: enOnboarding,
    subscriptions: enSubscriptions,
    notifications: enNotifications,
    components: enComponents,
    "theme-selector": enThemeSelector,
    "font-selector": enFontSelector,
    tour: enTour,
    dhikrs: enDhikrs,
    users: enUsers
  }
} as const;

export function detectDeviceLocale(): SupportedLocale {
  const [primaryLocale] = Localization.getLocales();
  const languageCode = primaryLocale?.languageCode;
  return languageCode === "en" ? "en" : languageCode === "tr" ? "tr" : DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: [
    "common",
    "profile",
    "home",
    "focus",
    "ai-guide",
    "collections",
    "special-days",
    "stats",
    "auth",
    "onboarding",
    "subscriptions",
    "notifications",
    "components",
    "theme-selector",
    "font-selector",
    "tour",
    "dhikrs",
    "users"
  ],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4"
});

export { i18n };
