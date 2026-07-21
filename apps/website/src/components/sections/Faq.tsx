import { useTranslations } from "next-intl";

export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { question: string; answer: string }[];

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-ink/70">{t("subtitle")}</p>
        </div>

        <div className="mt-12 divide-y divide-ink/10 rounded-2xl border border-ink/10">
          {items.map((item) => (
            <details key={item.question} className="group p-6 open:bg-accent-soft/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink marker:content-none">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-xl text-ink/40 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-ink/70">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
