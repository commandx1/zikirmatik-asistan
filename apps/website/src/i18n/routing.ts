import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "en",
  localePrefix: "as-needed"
});

export type AppLocale = (typeof routing.locales)[number];

export function hasLocale(
  locales: readonly string[],
  value: string | undefined
): value is AppLocale {
  return typeof value === "string" && locales.includes(value);
}
