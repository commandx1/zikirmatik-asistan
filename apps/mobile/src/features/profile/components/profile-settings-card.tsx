import type { PropsWithChildren } from "react";
import { ThemedCard } from "../../../components/ui/themed-card";

type ProfileSettingsCardProps = PropsWithChildren<{
  premium?: boolean;
}>;

export function ProfileSettingsCard({ children, premium = false }: ProfileSettingsCardProps) {
  return (
    <ThemedCard className="rounded-2xl" borderClassName={premium ? "border-[--accent]/30" : "border-white/5"}>
      {children}
    </ThemedCard>
  );
}
