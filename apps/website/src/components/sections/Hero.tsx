import { useTranslations } from "next-intl";
import Image from "next/image";
import { PlayStoreButton } from "../PlayStoreButton";

export function Hero() {
  const t = useTranslations("hero");
  const brand = useTranslations("meta")("siteName");

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 bg-hero-grid bg-[length:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:py-28">
        <div>
          <span
            className="inline-flex items-center rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold tracking-wide text-accent"
            style={{ textTransform: "uppercase" }}
          >
            {t("eyebrow")}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PlayStoreButton label={t("ctaPrimary")} />
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent"
            >
              {t("ctaSecondary")}
              <span aria-hidden="true">→</span>
            </a>
          </div>
          <p
            className="mt-6 text-xs font-medium tracking-wide text-ink/40"
            style={{ textTransform: "uppercase" }}
          >
            {t("badge")}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent-soft blur-2xl" />
          <div className="overflow-hidden rounded-[2.25rem] border border-ink/10 bg-white shadow-2xl">
            <Image
              src="/screenshots/1.png"
              alt={brand}
              width={520}
              height={1120}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
