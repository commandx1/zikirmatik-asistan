import { Text } from "react-native";

type ProfileSectionTitleProps = {
  label: string;
  accent?: boolean;
};

export function ProfileSectionTitle({ label, accent = false }: ProfileSectionTitleProps) {
  return (
    <Text className={`mb-2 px-1 text-sm font-semibold uppercase tracking-[1.1px] ${accent ? "text-[--accent]" : "text-[--text-muted]"}`}>
      {label}
    </Text>
  );
}
