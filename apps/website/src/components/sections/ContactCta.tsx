"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CONTACT_EMAIL } from "../../lib/constants";

export function ContactCta() {
  const t = useTranslations("contact");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg text-ink/70">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {t("mailtoLabel")}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>

        <p className="mt-6 text-sm text-ink/50">{t("email")}</p>
      </div>
    </section>
  );
}
