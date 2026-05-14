import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
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
  iconContainerClassName = "bg-white/5",
  iconColor = "#F0EDE6",
  value,
  onChange,
  bottomBorder = false
}: ProfileToggleRowProps) {
  return (
    <View className={`flex-row items-center justify-between p-4 ${bottomBorder ? "border-b border-white/5" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View className={`h-8 w-8 items-center justify-center rounded-full ${iconContainerClassName}`}>
          <FontAwesome6 name={iconName} size={14} color={iconColor} />
        </View>
        <Text className="text-[14px] font-medium text-[--text-primary]">{label}</Text>
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
