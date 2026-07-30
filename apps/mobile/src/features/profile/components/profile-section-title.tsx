import { Text } from "react-native";
import { useLocaleUpper } from "../../../hooks/use-locale-upper";

type ProfileSectionTitleProps = {
  label: string;
  accent?: boolean;
};

export function ProfileSectionTitle({ label, accent = false }: ProfileSectionTitleProps) {
  const upper = useLocaleUpper();
  return (
    <Text className={`mb-2 px-1 text-sm font-semibold tracking-[1.1px] ${accent ? "text-[--accent]" : "text-[--text-muted]"}`}>
      {upper(label)}
    </Text>
  );
}
