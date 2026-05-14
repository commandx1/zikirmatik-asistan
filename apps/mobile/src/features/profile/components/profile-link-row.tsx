import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

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
  iconContainerClassName = "bg-white/5",
  iconColor = "#F0EDE6",
  rightIconName = "chevron-right",
  rightIconRegular = false,
  bottomBorder = false,
  onPress
}: ProfileLinkRowProps) {
  return (
    <Pressable onPress={onPress} className={`flex-row items-center justify-between p-4 ${bottomBorder ? "border-b border-white/5" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View className={`h-8 w-8 items-center justify-center rounded-full ${iconContainerClassName}`}>
          <FontAwesome6 name={iconName} size={14} color={iconColor} />
        </View>
        <Text className="text-[14px] font-medium text-[--text-primary]">{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {value ? <Text className={`text-[13px] ${valueClassName}`}>{value}</Text> : null}
        <FontAwesome6 name={rightIconName} size={12} color="#9A9080" iconStyle={rightIconRegular ? "regular" : "solid"} style={{ opacity: 0.5 }} />
      </View>
    </Pressable>
  );
}
