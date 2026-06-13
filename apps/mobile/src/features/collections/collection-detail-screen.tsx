import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DhikrContentStack } from "../../components/ui/dhikr-content-stack";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { ThemedCard } from "../../components/ui/themed-card";
import { useDhikrStore } from "../../store/dhikr-store";
import { useCollectionDetail } from "./hooks/use-collection-detail";
import type { BackendCollectionDhikr } from "./services/collections-api-client";

type Props = {
  collectionKey: string;
};

export function CollectionDetailScreen({ collectionKey }: Props) {
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const bottomPadding = 40 + (Platform.OS === "android" ? Math.max(insets.bottom, 0) : insets.bottom);
  const { detail, isLoading, error } = useCollectionDetail(collectionKey);

  const upsertDhikrSnapshot = useDhikrStore((s) => s.upsertDhikrSnapshot);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);
  const setSelectedTarget = useDhikrStore((s) => s.setSelectedTarget);
  const setSelectedCount = useDhikrStore((s) => s.setSelectedCount);

  function handleStartDhikr(dhikr: BackendCollectionDhikr) {
    upsertDhikrSnapshot({
      id: dhikr._id,
      source: "ready",
      nameTurkish: dhikr.nameTurkish,
      arabic: dhikr.nameArabic,
      transliteration: dhikr.transliteration,
      meaning: dhikr.meaning,
      virtue: dhikr.virtue,
      contentSource: dhikr.source,
      current: 0,
      target: dhikr.recommendedCount,
      lastActivityLabel: "Henüz başlanmadı",
      streakDays: 0,
      isFavorite: false,
    });
    selectDhikr(dhikr._id);
    setSelectedTarget(dhikr.recommendedCount);
    setSelectedCount(0);
    router.push("/(tabs)/home");
  }

  return (
    <PageLayout>
      <PageHeader
        title={detail?.label ?? "Koleksiyon"}
        leftIconName="arrow-left"
        onPressLeft={() => router.back()}
      />

      {isLoading && !detail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[--text-muted]">{error}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
        >
          {detail?.description ? (
            <ThemedCard className="mb-5 rounded-2xl px-4 py-3" accent="accentSoft">
              <Text className="text-[13px] leading-5 text-[--text-muted]">
                {detail.description}
              </Text>
            </ThemedCard>
          ) : null}

          <View className="gap-4">
            {detail?.dhikrs.map((dhikr, index) => (
              <ThemedCard
                key={dhikr._id}
                className="rounded-2xl p-4"
                elevated
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[--text-muted]">
                    {index + 1}/{detail.dhikrs.length}
                  </Text>
                  <View className="rounded-full bg-[--accent]/10 px-2.5 py-0.5">
                    <Text className="text-[11px] font-medium text-[--accent]">
                      {dhikr.recommendedCount}×
                    </Text>
                  </View>
                </View>

                <Text className="text-[15px] font-semibold text-[--text-primary]">
                  {dhikr.nameTurkish}
                </Text>

                <DhikrContentStack
                  arabic={dhikr.nameArabic}
                  transliteration={dhikr.transliteration}
                  meaning={dhikr.meaning}
                />

                {dhikr.source ? (
                  <Text className="mt-3 text-[11px] leading-4 text-[--text-muted]">
                    {dhikr.source}
                  </Text>
                ) : null}

                <View className="mt-4 flex-row items-center justify-end">
                  <Pressable
                    onPress={() => handleStartDhikr(dhikr)}
                    className="flex-row items-center gap-1.5 rounded-full bg-[--accent] px-4 py-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <FontAwesome6
                      name="play"
                      iconStyle="solid"
                      size={10}
                      color={tokens.bg}
                    />
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: tokens.bg }}
                    >
                      Sayaca Ekle
                    </Text>
                  </Pressable>
                </View>
              </ThemedCard>
            ))}
          </View>
        </ScrollView>
      )}
    </PageLayout>
  );
}
