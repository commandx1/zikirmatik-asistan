import { useTranslations } from "next-intl";
import { PlayStoreButton } from "../PlayStoreButton";

export function Premium() {
  const t = useTranslations("premium");
  const table = t.raw("table") as { headers: string[]; rows: string[][] };
  const credits = t.raw("credits.items") as string[];

  return (
    <section id="premium" className="bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-white/70">{t("subtitle")}</p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-white/80">
                {table.headers.map((header) => (
                  <th key={header} className="px-5 py-4 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row[0]} className="border-t border-white/10">
                  {row.map((cell, index) => (
                    <td
                      key={`${row[0]}-${index}`}
                      className={`px-5 py-4 ${
                        index === 0
                          ? "font-medium text-white"
                          : "text-white/70"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white">
            {t("credits.title")}
          </h3>
          <p className="mt-2 text-sm text-white/70">
            {t("credits.description")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {credits.map((credit) => (
              <li
                key={credit}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80"
              >
                {credit}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-white/50">{t("note")}</p>

        <div className="mt-6 flex justify-center">
          <PlayStoreButton label={t("cta")} />
        </div>
      </div>
    </section>
  );
}
