import { useTranslations } from "next-intl";

const ICONS = ["◎", "✦", "🔔", "📈", "🎨", "☁"];

export function Features() {
  const t = useTranslations("features");
  const items = t.raw("items") as { title: string; description: string }[];

  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-ink/70">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-xl text-accent"
              >
                {ICONS[index % ICONS.length]}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
