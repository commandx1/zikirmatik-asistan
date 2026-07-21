import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { hasLocale, routing } from "../../i18n/routing";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { SITE_URL } from "../../lib/constants";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("titleDefault"),
      template: `%s | ${t("siteName")}`
    },
    description: t("description"),
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: {
        en: "/",
        tr: "/tr"
      }
    },
    openGraph: {
      title: t("titleDefault"),
      description: t("description"),
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
      siteName: t("siteName"),
      images: ["/logo.png"],
      locale: locale === "tr" ? "tr_TR" : "en_US",
      type: "website"
    },
    twitter: {
      card: "summary",
      title: t("titleDefault"),
      description: t("description"),
      images: ["/logo.png"]
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
