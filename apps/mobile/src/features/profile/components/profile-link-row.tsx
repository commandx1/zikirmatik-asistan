import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { withAlpha } from "@zikirmatik/shared";

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
  valueClassName = "text-text-muted",
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
        <Text className="text-base font-medium text-text-primary">{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {value ? <Text className={`text-sm ${valueClassName}`}>{value}</Text> : null}
        <FontAwesome6 name={rightIconName} size={12} color={tokens.textMuted} iconStyle={rightIconRegular ? "regular" : "solid"} style={{ opacity: 0.72 }} />
      </View>
    </Pressable>
  );
}

