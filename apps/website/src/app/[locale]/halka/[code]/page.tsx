import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale, routing } from "../../../../i18n/routing";
import { PlayStoreButton } from "../../../../components/PlayStoreButton";

const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });

  return {
    title: meta("halkaTitle"),
    description: meta("halkaDescription"),
    robots: { index: false }
  };
}

export default async function HalkaInvitePage({
  params
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const CODE = code.toUpperCase();
  if (!CODE_RE.test(CODE)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "halka" });

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 bg-hero-grid bg-[length:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]" />
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-md text-base leading-7 text-ink/70">
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-ink/40" style={{ textTransform: "uppercase" }}>
            {t("codeLabel")}
          </span>
          <span
            className="select-all rounded-2xl border border-ink/10 bg-accent-soft px-8 py-4 font-mono text-3xl font-bold tracking-[0.3em] text-accent sm:text-4xl"
            style={{ userSelect: "all" }}
          >
            {CODE}
          </span>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`zikirmatik://circle/join?code=${CODE}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("openApp")}
          </a>
          <PlayStoreButton label={t("getOnPlay")} />
        </div>

        <p className="mt-6 text-sm text-ink/50">{t("hint")}</p>
      </div>
    </section>
  );
}
