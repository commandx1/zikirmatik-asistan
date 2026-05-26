import { useRouter } from "expo-router";
import { PageHeader } from "../../../components/ui/page-header";

type SelectorHeaderProps = {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
};

export function SelectorHeader({ title, subtitle, showBackButton = false }: SelectorHeaderProps) {
  const router = useRouter();

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      leftIconName={showBackButton ? "chevron-left" : undefined}
      onPressLeft={
        showBackButton
          ? () => {
              router.back();
            }
          : undefined
      }
    />
  );
}
