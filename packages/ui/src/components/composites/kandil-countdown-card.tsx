import { Text } from "react-native";
import { AppCard } from "../primitives/app-card";

type KandilCountdownCardProps = {
  title: string;
  countdownLabel: string;
};

export function KandilCountdownCard({ title, countdownLabel }: KandilCountdownCardProps) {
  return (
    <AppCard className="gap-2 border-[--accent]/30 bg-[--card]">
      <Text className="text-lg font-bold text-[--text-primary]">{title}</Text>
      <Text className="text-xs text-[--text-muted]">{countdownLabel}</Text>
    </AppCard>
  );
}
