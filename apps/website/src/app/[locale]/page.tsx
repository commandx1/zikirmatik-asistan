import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale, routing } from "../../i18n/routing";
import { Hero } from "../../components/sections/Hero";
import { Features } from "../../components/sections/Features";
import { HowItWorks } from "../../components/sections/HowItWorks";
import { Screenshots } from "../../components/sections/Screenshots";
import { Premium } from "../../components/sections/Premium";
import { Faq } from "../../components/sections/Faq";
import { ContactCta } from "../../components/sections/ContactCta";

export default async function LocaleHomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Screenshots />
      <Premium />
      <Faq />
      <ContactCta />
    </>
  );
}
