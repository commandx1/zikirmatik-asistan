import { PageHeader } from "../../../components/ui/page-header";

type SelectorHeaderProps = {
  title: string;
  subtitle: string;
};

export function SelectorHeader({ title, subtitle }: SelectorHeaderProps) {
  return <PageHeader title={title} subtitle={subtitle} />;
}
