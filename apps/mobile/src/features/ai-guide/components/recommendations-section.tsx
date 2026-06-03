import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import type { AiGuideRecommendation } from "../types";
import { RecommendationCard } from "./recommendation-card";

type RecommendationsSectionProps = {
  items: AiGuideRecommendation[];
  onSelectRecommendation: (item: AiGuideRecommendation) => void;
};

export function RecommendationsSection({ items, onSelectRecommendation }: RecommendationsSectionProps) {
  const { tokens } = useThemeTokens();

  if (items.length === 0) {
    return (
      <View className="mb-6">
        <Text className="text-sm" style={{ color: tokens.textMuted }}>
          Öneriler burada listelenecek. Niyetini yazıp gönderdiğinde asistan uygun zikirleri getirecek.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="mb-4 flex-row items-center gap-2 px-1">
        <FontAwesome6 name="star" iconStyle="solid" size={12} color={tokens.accent} />
        <Text className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
          Sana Özel Öneriler
        </Text>
      </View>

      <View className="gap-4">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} onSelect={onSelectRecommendation} />
        ))}
      </View>
    </View>
  );
}
