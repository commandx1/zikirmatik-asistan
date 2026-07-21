import { useTranslations } from "next-intl";
import Image from "next/image";
import { SCREENSHOT_COUNT } from "../../lib/constants";

export function Screenshots() {
  const t = useTranslations("screenshots");
  const items = Array.from({ length: SCREENSHOT_COUNT }, (_, i) => i + 1);

  return (
    <section id="screenshots" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-ink/70">{t("subtitle")}</p>
        </div>

        <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((n) => (
            <div
              key={n}
              className="w-56 shrink-0 snap-center overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm sm:w-64"
            >
              <Image
                src={`/screenshots/${n}.png`}
                alt={`${t("alt")} ${n}`}
                width={520}
                height={1120}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
