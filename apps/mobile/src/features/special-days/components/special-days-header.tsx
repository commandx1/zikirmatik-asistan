import { useTranslation } from "react-i18next";
import { PageHeader } from "../../../components/ui/page-header";

export function SpecialDaysHeader() {
  const { t } = useTranslation("special-days");
  return (
    <PageHeader
      title={t("special-days:header.title")}
      subtitle={t("special-days:header.subtitle")}
    />
  );
}
