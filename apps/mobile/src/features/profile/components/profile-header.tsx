import { useTranslation } from "react-i18next";
import { PageHeader } from "../../../components/ui/page-header";

export function ProfileHeader() {
  const { t } = useTranslation("profile");
  return <PageHeader title={t("profile:header.title")} />;
}
