import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";

type ProfileLinkRowProps = {
  label: string;
  iconName: React.ComponentProps<typeof FontAwesome6>["name"];
  value?: string;
  valueClassName?: string;
  iconContainerClassName?: string;
  iconColor?: string;
  rightIconName?: React.ComponentProps<typeof FontAwesome6>["name"];
  rightIconRegular?: boolean;
  bottomBorder?: boolean;
  onPress?: () => void;
};

export function ProfileLinkRow({
  label,
  iconName,
  value,
  valueClassName = "text-[--text-muted]",
  iconContainerClassName,
  iconColor,
  rightIconName = "chevron-right",
  rightIconRegular = false,
  bottomBorder = false,
  onPress
}: ProfileLinkRowProps) {
  const { tokens } = useThemeTokens();
  const resolvedIconColor = iconColor ?? tokens.accent;

  return (
    <Pressable onPress={onPress} className={`flex-row items-center justify-between p-4 ${bottomBorder ? "border-b border-white/5" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${iconContainerClassName ?? ""}`}
          style={iconContainerClassName ? undefined : { backgroundColor: withAlpha(tokens.accent, 0.12) }}
        >
          <FontAwesome6 name={iconName} size={14} color={resolvedIconColor} />
        </View>
        <Text className="text-base font-medium text-[--text-primary]">{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {value ? <Text className={`text-sm ${valueClassName}`}>{value}</Text> : null}
        <FontAwesome6 name={rightIconName} size={12} color={tokens.textMuted} iconStyle={rightIconRegular ? "regular" : "solid"} style={{ opacity: 0.72 }} />
      </View>
    </Pressable>
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
