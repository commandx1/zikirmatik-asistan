import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

type ProfileTimeRowProps = {
  label: string;
  value: string;
  bottomBorder?: boolean;
  onPress?: () => void;
};

export function ProfileTimeRow({ label, value, bottomBorder = false, onPress }: ProfileTimeRowProps) {
  return (
    <Pressable onPress={onPress} className={`flex-row items-center justify-between p-4 ${bottomBorder ? "border-b border-white/5" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-white/5">
          <FontAwesome6 name="clock" iconStyle="regular" size={14} color="#F0EDE6" />
        </View>
        <Text className="text-[14px] font-medium text-[--text-primary]">{label}</Text>
      </View>
      <View className="rounded-md bg-white/5 px-2 py-1">
        <Text className="text-[13px] font-medium text-[--text-primary]">{value}</Text>
      </View>
    </Pressable>
  );
}
