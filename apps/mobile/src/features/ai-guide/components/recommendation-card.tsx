import { Pressable, Text, View } from "react-native";
import { DhikrContentStack } from "../../../components/ui/dhikr-content-stack";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedTag } from "../../../components/ui/themed-tag";
import type { AiGuideRecommendation } from "../types";

type RecommendationCardProps = {
  item: AiGuideRecommendation;
  onSelect: (item: AiGuideRecommendation) => void;
};

export function RecommendationCard({ item, onSelect }: RecommendationCardProps) {
  if (item.isPrimary) {
    return (
      <ThemedCard className="relative rounded-[20px] p-5" accent="accent" elevated>
        <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[--accent]/5" />

        <View className="relative z-10 mb-3 flex-row items-start justify-between">
          <ThemedTag
            label={item.chipLabel}
            variant="accent"
            leading={<Text className="text-[10px]">{item.chipEmoji}</Text>}
            className="px-2.5 py-1"
            textClassName="text-[10px]"
          />
          <Text className="text-xs font-semibold text-[--text-muted]">{item.repeatLabel}</Text>
        </View>

        <View className="relative z-10 mb-4">
          {item.title ? (
            <Text className="mb-1 mt-1 px-0.5 text-sm font-semibold text-[--text-primary]">{item.title}</Text>
          ) : null}
          <DhikrContentStack
            arabic={item.arabic}
            transliteration={item.transliteration}
            meaning={item.meaning}
          />
          <RecommendationEvidence item={item} />
        </View>

        <Pressable onPress={() => onSelect(item)} className="relative z-10 w-full rounded-full bg-[--accent] py-3">
          <Text className="text-center text-sm font-semibold text-[#111827]">Başla</Text>
        </Pressable>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard className="rounded-[20px] p-4">
      <View className="mb-3 flex-row items-start justify-between">
        <ThemedTag
          label={item.chipLabel}
          variant="primary"
          leading={<Text className="text-[10px]">{item.chipEmoji}</Text>}
          className="px-2 py-1"
          textClassName="text-[10px]"
        />
      </View>

      <View className="mb-4">
        {item.title ? (
          <Text className="mb-1 mt-1 px-0.5 text-sm font-semibold text-[--text-primary]">{item.title}</Text>
        ) : null}
        <DhikrContentStack
          arabic={item.arabic}
          transliteration={item.transliteration}
          meaning={item.meaning}
        />
        <RecommendationEvidence item={item} />
      </View>

      <Pressable onPress={() => onSelect(item)} className="w-full rounded-full border border-[--accent]/40 py-2.5">
        <Text className="text-center text-sm font-medium text-[--accent]">Başla</Text>
      </Pressable>
    </ThemedCard>
  );
}

function RecommendationEvidence({ item }: { item: AiGuideRecommendation }) {
  if (!item.virtue && !item.source && !item.recommendedCount) {
    return null;
  }

  return (
    <View className="mt-3 gap-2">
      {item.virtue ? (
        <View className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.9px] text-[--text-muted]">Fazilet</Text>
          <Text className="text-xs leading-5 text-[--text-muted]" style={{ textAlign: "justify" }}>
            {item.virtue}
          </Text>
        </View>
      ) : null}
      {item.source || item.recommendedCount ? (
        <View className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          {item.source ? (
            <>
              <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.9px] text-[--text-muted]">Kaynak</Text>
              <Text className="text-xs leading-5 text-[--text-muted]" style={{ textAlign: "justify" }}>
                {item.source}
              </Text>
            </>
          ) : null}
          {item.recommendedCount ? (
            <Text className={`${item.source ? "mt-2" : ""} text-xs text-[--text-muted]`}>
              Önerilen hedef: {item.recommendedCount}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
