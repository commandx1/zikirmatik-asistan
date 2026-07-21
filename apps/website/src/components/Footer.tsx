import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PlayStoreButton } from "./PlayStoreButton";
import { APP_NAME } from "../lib/constants";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-lg font-semibold">{APP_NAME}</p>
            <p className="mt-3 max-w-sm text-sm text-white/70">{t("tagline")}</p>
            <div className="mt-6">
              <PlayStoreButton label={nav("getOnPlay")} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/90">{t("product")}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <a href="#features" className="hover:text-white">
                  {nav("features")}
                </a>
              </li>
              <li>
                <a href="#premium" className="hover:text-white">
                  {nav("premium")}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white">
                  {nav("faq")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/90">{t("legal")}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/privacy" className="hover:text-white">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white">
                  {t("refund")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. {t("rights")}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
