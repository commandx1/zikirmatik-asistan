import { Text, View } from "react-native";
import { APP_VERSION_LABEL } from "../data";

export function ProfileAppVersion() {
  return (
    <View className="mt-8 pb-4">
      <Text className="text-center text-[11px] font-medium text-[--text-muted]/50">{APP_VERSION_LABEL}</Text>
    </View>
  );
}
