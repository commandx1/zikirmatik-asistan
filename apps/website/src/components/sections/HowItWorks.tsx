import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const steps = t.raw("steps") as { title: string; description: string }[];

  return (
    <section id="how-it-works" className="bg-accent-soft/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-ink/70">{t("subtitle")}</p>
        </div>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
