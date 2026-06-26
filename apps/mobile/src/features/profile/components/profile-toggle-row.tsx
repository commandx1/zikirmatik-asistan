import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { TogglePill } from "../../../components/ui/toggle-pill";

type ProfileToggleRowProps = {
  label: string;
  iconName: React.ComponentProps<typeof FontAwesome6>["name"];
  iconContainerClassName?: string;
  iconColor?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  bottomBorder?: boolean;
};

export function ProfileToggleRow({
  label,
  iconName,
  iconContainerClassName,
  iconColor,
  value,
  onChange,
  bottomBorder = false
}: ProfileToggleRowProps) {
  const { tokens } = useThemeTokens();

  return (
    <View className={`flex-row items-center justify-between p-4 ${bottomBorder ? "border-b border-white/5" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${iconContainerClassName ?? ""}`}
          style={iconContainerClassName ? undefined : { backgroundColor: withAlpha(tokens.accent, 0.12) }}
        >
          <FontAwesome6 name={iconName} size={14} color={iconColor ?? tokens.accent} />
        </View>
        <Text className="text-base font-medium text-[--text-primary]">{label}</Text>
      </View>
      <TogglePill
        checked={value}
        onToggle={onChange}
        size="compact"
        knobSize={14}
        activeTrackClassName="bg-[#2E7D5E]"
        inactiveTrackClassName="bg-[#1A2E24]"
      />
    </View>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
