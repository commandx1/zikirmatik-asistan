import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
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
    title: meta("titleTerms"),
    alternates: {
      canonical: locale === routing.defaultLocale ? "/terms" : `/${locale}/terms`,
      languages: {
        en: "/terms",
        tr: "/tr/terms"
      }
    }
  };
}

export default async function TermsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <LegalPage namespace="terms" />;
}
