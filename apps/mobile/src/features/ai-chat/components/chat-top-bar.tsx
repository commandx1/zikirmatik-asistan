import { useTranslation } from "react-i18next";
import { PageHeader } from "../../../components/ui/page-header";

type ChatTopBarProps = {
  onPressBack: () => void;
  onPressNewChat?: () => void;
  showNewChat?: boolean;
};

export function ChatTopBar({ onPressBack, onPressNewChat, showNewChat }: ChatTopBarProps) {
  const { t } = useTranslation("ai-chat");

  return (
    <PageHeader
      title={t("ai-chat:topBar.title")}
      subtitle={t("ai-chat:topBar.subtitle")}
      leftIconName="chevron-left"
      onPressLeft={onPressBack}
      rightIconName={showNewChat ? "plus" : undefined}
      onPressRight={showNewChat ? onPressNewChat : undefined}
    />
  );
}
