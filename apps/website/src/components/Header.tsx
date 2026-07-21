import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "../i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { APP_NAME } from "../lib/constants";

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <Image
            src="/logo.png"
            alt={APP_NAME}
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-sm sm:text-base">{APP_NAME}</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex"
        >
          <a href="#features" className="hover:text-ink">
            {t("features")}
          </a>
          <a href="#how-it-works" className="hover:text-ink">
            {t("howItWorks")}
          </a>
          <a href="#screenshots" className="hover:text-ink">
            {t("screenshots")}
          </a>
          <a href="#premium" className="hover:text-ink">
            {t("premium")}
          </a>
          <a href="#faq" className="hover:text-ink">
            {t("faq")}
          </a>
          <a href="#contact" className="hover:text-ink">
            {t("contact")}
          </a>
        </nav>

        <div className="hidden items-center gap-3 sm:flex [&_[role=group]]:border-ink/10 [&_button]:text-ink/60 [&_button[aria-current=true]]:bg-ink [&_button[aria-current=true]]:text-white">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
