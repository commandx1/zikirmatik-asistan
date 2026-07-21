import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale, routing } from "../../../i18n/routing";
import { LegalPage } from "../../../components/LegalPage";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });

  return {
    title: meta("titlePrivacy"),
    alternates: {
      canonical: locale === routing.defaultLocale ? "/privacy" : `/${locale}/privacy`,
      languages: {
        en: "/privacy",
        tr: "/tr/privacy"
      }
    }
  };
}

export default async function PrivacyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <LegalPage namespace="privacy" />;
}
