import { useTranslations } from "next-intl";

const ICONS = ["📖", "🕌", "🧭"];

export function AiGuide() {
  const t = useTranslations("aiGuide");
  const pillars = t.raw("pillars") as { title: string; description: string }[];

  return (
    <section id="ai-guide" className="bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-light">
            {t("eyebrow")}
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-white/70">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm"
            >
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl"
              >
                {ICONS[index % ICONS.length]}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/50">{t("note")}</p>
      </div>
    </section>
  );
}
