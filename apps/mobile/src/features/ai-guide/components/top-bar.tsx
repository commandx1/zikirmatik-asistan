import { useTranslation } from "react-i18next";
import { PageHeader } from "../../../components/ui/page-header";

type TopBarProps = {
  onInfoPress: () => void;
};

export function TopBar({ onInfoPress }: TopBarProps) {
  const { t } = useTranslation("ai-guide");

  return (
    <PageHeader
      title={t("ai-guide:topBar.title")}
      subtitle={t("ai-guide:topBar.subtitle")}
      rightIconName="circle-info"
      onPressRight={onInfoPress}
    />
  );
}
