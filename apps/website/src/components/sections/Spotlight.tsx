import { useTranslations } from "next-intl";
import Image from "next/image";

const ICONS: Record<"vird" | "halka" | "aiGuide", string[]> = {
  vird: ["📅", "✨", "▶"],
  halka: ["👥", "🔗", "🎉"],
  aiGuide: ["🧭", "📖", "🕌"]
};

export function Spotlight({
  ns,
  image,
  tone,
  id
}: {
  ns: "vird" | "halka" | "aiGuide";
  image: string;
  tone: "dark" | "light";
  id: string;
}) {
  const t = useTranslations(ns);
  const pillars = t.raw("pillars") as { title: string; description: string }[];
  const icons = ICONS[ns];
  const isDark = tone === "dark";

  return (
    <section
      id={id}
      className={
        isDark
          ? "bg-ink py-20 text-white sm:py-28"
          : "bg-accent-soft/40 py-20 sm:py-28"
      }
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <span
            style={{ textTransform: "uppercase" }}
            className={
              isDark
                ? "inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-light"
                : "inline-flex items-center rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold tracking-wide text-accent"
            }
          >
            {t("eyebrow")}
          </span>
          <h2 className={isDark ? "mt-6 text-3xl font-bold tracking-tight sm:text-4xl" : "mt-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl"}>
            {t("title")}
          </h2>
          <p className={isDark ? "mt-4 text-lg text-white/70" : "mt-4 text-lg text-ink/70"}>
            {t("subtitle")}
          </p>

          <div className="mt-10 space-y-4">
            {pillars.map((pillar, index) => (
              <div
                key={pillar.title}
                className={
                  isDark
                    ? "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm"
                    : "rounded-2xl border border-ink/5 bg-white p-6 shadow-sm ring-1 ring-black/5"
                }
              >
                <div
                  aria-hidden="true"
                  className={
                    isDark
                      ? "flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl"
                      : "flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-xl text-accent"
                  }
                >
                  {icons[index % icons.length]}
                </div>
                <h3 className={isDark ? "mt-4 text-lg font-semibold text-white" : "mt-4 text-lg font-semibold text-ink"}>
                  {pillar.title}
                </h3>
                <p className={isDark ? "mt-2 text-sm leading-6 text-white/70" : "mt-2 text-sm leading-6 text-ink/70"}>
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>

          <p className={isDark ? "mt-8 text-xs text-white/50" : "mt-8 text-xs text-ink/50"}>
            {t("note")}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-[2.25rem] border border-ink/10 bg-white shadow-2xl">
            <Image
              src={image}
              alt={t("title")}
              width={520}
              height={1156}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
