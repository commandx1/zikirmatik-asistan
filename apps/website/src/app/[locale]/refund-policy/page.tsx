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
    title: meta("titleRefund"),
    alternates: {
      canonical:
        locale === routing.defaultLocale ? "/refund-policy" : `/${locale}/refund-policy`,
      languages: {
        en: "/refund-policy",
        tr: "/tr/refund-policy"
      }
    }
  };
}

export default async function RefundPolicyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <LegalPage namespace="refund" />;
}
