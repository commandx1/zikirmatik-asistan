import type { TFunction } from "i18next";
import type { SupportedLocale } from "../../../i18n";
import { toIntlLocale } from "../../../lib/locale-format";

export function normalizeTimeUnit(value: string) {
  const trimmedDigits = value.replace(/\D+/g, "").slice(0, 2);
  if (!trimmedDigits) {
    return "00";
  }

  return trimmedDigits.padStart(2, "0");
}

export function parseReminderTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return { hour: 8, minute: 0, isValid: false };
  }

  // regex capture groups always match when exec succeeds
  const hour = Number.parseInt(match[1]!, 10);
  const minute = Number.parseInt(match[2]!, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 8, minute: 0, isValid: false };
  }

  return { hour, minute, isValid: true };
}

export function toMemberSinceLabel(isoDate: string, locale: SupportedLocale, t: TFunction) {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) {
    return t("profile:memberSince.newMember");
  }

  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "long",
    year: "numeric"
  });
  const formatted = formatter.format(createdAt);
  const withCapitalizedMonth =
    locale === "en" ? formatted : `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
  return t("profile:memberSince.since", { date: withCapitalizedMonth });
}
