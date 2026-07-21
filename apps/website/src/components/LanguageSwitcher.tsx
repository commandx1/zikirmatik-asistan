"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "../i18n/navigation";
import { routing } from "../i18n/routing";

const LABELS: Record<string, string> = {
  en: "EN",
  tr: "TR"
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("footer");

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/20 p-1"
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          aria-current={loc === locale}
          onClick={() => router.replace(pathname, { locale: loc })}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            loc === locale
              ? "bg-white text-ink"
              : "text-white/70 hover:text-white"
          }`}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
