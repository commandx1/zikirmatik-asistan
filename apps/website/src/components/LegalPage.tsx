import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";

type LegalSection = { heading: string; body: string };

export function LegalPage({ namespace }: { namespace: "privacy" | "terms" | "refund" }) {
  const t = useTranslations(namespace);
  const legal = useTranslations("legal");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <Link
        href="/"
        className="text-sm font-semibold text-accent hover:text-accent-light"
      >
        ← {legal("backHome")}
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm font-medium text-ink/50">
        {legal("lastUpdated")}
      </p>
      <p className="prose-legal mt-8 text-base leading-7 text-ink/80">
        {t("intro")}
      </p>

      <div className="prose-legal">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
