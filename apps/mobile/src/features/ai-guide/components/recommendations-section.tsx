import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import type { AiGuideRecommendation } from "../types";
import { RecommendationCard } from "./recommendation-card";

type RecommendationsSectionProps = {
  items: AiGuideRecommendation[];
  onSelectRecommendation: (item: AiGuideRecommendation) => void;
};

export function RecommendationsSection({ items, onSelectRecommendation }: RecommendationsSectionProps) {
  if (items.length === 0) {
    return (
      <View className="mb-6">
        <Text className="text-sm text-[#9A9080]">Henüz öneri bulunamadı. Ruh halini güncelleyip tekrar dene.</Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="mb-4 flex-row items-center gap-2 px-1">
        <FontAwesome6 name="sparkles" iconStyle="solid" size={12} color="#C8972A" />
        <Text className="text-sm font-semibold text-[#F0EDE6]">Sana Özel Öneriler</Text>
      </View>

      <View className="gap-4">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} onSelect={onSelectRecommendation} />
        ))}
      </View>
    </View>
  );
}
