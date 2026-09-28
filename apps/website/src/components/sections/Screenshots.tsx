import { useTranslations } from "next-intl";
import Image from "next/image";

export function Screenshots() {
  const t = useTranslations("screenshots");
  const captions = t.raw("items") as string[];

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
          {captions.map((caption, index) => {
            const n = index + 1;
            return (
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
                <p className="px-4 py-3 text-center text-sm font-medium text-ink">
                  {caption}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
