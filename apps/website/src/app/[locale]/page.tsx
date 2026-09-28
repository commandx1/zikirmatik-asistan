import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale, routing } from "../../i18n/routing";
import { Hero } from "../../components/sections/Hero";
import { Features } from "../../components/sections/Features";
import { Spotlight } from "../../components/sections/Spotlight";
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
      <Spotlight ns="vird" tone="light" image="/screenshots/2.png" id="vird" />
      <Spotlight ns="halka" tone="dark" image="/screenshots/4.png" id="halka" />
      <Spotlight ns="aiGuide" tone="light" image="/screenshots/5.png" id="ai-guide" />
      <HowItWorks />
      <Screenshots />
      <Premium />
      <Faq />
      <ContactCta />
    </>
  );
}
