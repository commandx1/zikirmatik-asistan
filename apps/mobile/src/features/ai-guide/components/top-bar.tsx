import { PageHeader } from "../../../components/ui/page-header";

type TopBarProps = {
  onInfoPress: () => void;
};

export function TopBar({ onInfoPress }: TopBarProps) {
  return (
    <PageHeader
      title="Asistan Rehber"
      subtitle="Ruh haline göre zikirler"
      rightIconName="circle-info"
      onPressRight={onInfoPress}
    />
  );
}
