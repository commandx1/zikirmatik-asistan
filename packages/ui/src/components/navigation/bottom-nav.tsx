import { Pressable, Text, View } from "react-native";
import { cn } from "../../utils/cn";

export type NavItem = {
  key: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

type BottomNavProps = {
  items: NavItem[];
};

export function BottomNav({ items }: BottomNavProps) {
  return (
    <View className="flex-row items-center justify-between border-t border-[--border] bg-[--card] px-3 py-2">
      {items.map((item) => (
        <Pressable key={item.key} onPress={item.onPress} className="w-16 items-center gap-1 py-1">
          <Text className={cn("text-[10px]", item.active ? "text-[--accent]" : "text-[--text-muted]")}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
