import { Pressable, ScrollView, Text, View } from "react-native";
import { useZikirlerim } from "../context/zikirlerim-context";

export function ZikirFilterTabs() {
  const { filters, activeFilter, setActiveFilter } = useZikirlerim();

  return (
    <View className="my-4 px-5">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }} className="w-full">
        <View className="flex-row gap-2">
          {filters.map((filter) => {
            const active = filter.key === activeFilter;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                className={`rounded-full px-4 py-2 ${active ? "bg-[--accent]" : "border border-white/5 bg-[--card]"}`}
              >
                <Text className={`text-xs ${active ? "font-semibold text-[#111827]" : "font-medium text-[--text-primary]"}`}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
