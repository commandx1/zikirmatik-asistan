import { Text, View } from "react-native";
import { i18n } from "../../../i18n";
import { RecommendationCard } from "../../ai-guide/components/recommendation-card";
import type { AiGuideRecommendation } from "../../ai-guide/types";
import type { ChatDhikrCard, ChatMessage } from "../hooks/use-ai-chat";

type MessageBubbleProps = {
  message: ChatMessage;
  onSelectDhikr: (item: ChatDhikrCard) => void;
};

function toRecommendation(card: ChatDhikrCard, index: number): AiGuideRecommendation {
  return {
    id: card.id,
    title: card.title,
    chipEmoji: index === 0 ? "💆" : "✨",
    chipLabel:
      index === 0
        ? i18n.t("ai-guide:recommendation.chipLabelPrimary")
        : i18n.t("ai-guide:recommendation.chipLabelSecondary"),
    arabic: card.arabic,
    transliteration: card.transliteration || card.title || "",
    meaning: card.meaning,
    virtue: card.virtue,
    source: card.source,
    recommendedCount: card.recommendedCount,
    isPrimary: index === 0
  };
}

export function MessageBubble({ message, onSelectDhikr }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View className={`mb-4 w-full ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[88%] rounded-2xl px-4 py-3 ${
          isUser ? "rounded-br-sm bg-[--accent]" : "rounded-bl-sm border border-white/10 bg-[--card]"
        }`}
      >
        <Text className={`text-sm leading-5 ${isUser ? "text-[#111827]" : "text-[--text-primary]"}`}>
          {message.content}
        </Text>
      </View>

      {!isUser && message.recommendedDhikrs.length > 0 ? (
        <View className="mt-3 w-full gap-3">
          {message.recommendedDhikrs.map((card, index) => (
            <RecommendationCard
              key={card.id}
              item={toRecommendation(card, index)}
              onSelect={() => onSelectDhikr(card)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
