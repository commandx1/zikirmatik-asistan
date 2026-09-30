import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: false
});

export type AppLocale = (typeof routing.locales)[number];

export function hasLocale(
  locales: readonly string[],
  value: string | undefined
): value is AppLocale {
  return typeof value === "string" && locales.includes(value);
}
