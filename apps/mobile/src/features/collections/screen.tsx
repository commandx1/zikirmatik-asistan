import { useRouter } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, FlatList, Platform, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CollectionCard } from "./components/collection-card";
import { CollectionCategoryFilter } from "./components/collection-category-filter";
import { useCollections } from "./hooks/use-collections";
import { COLLECTION_CATEGORIES } from "./types";
import type { CollectionCategory } from "./types";
import type { BackendCollection } from "./services/collections-api-client";

export function CollectionsScreen() {
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const bottomPadding =
    32 + (Platform.OS === "android" ? Math.max(insets.bottom, 0) : insets.bottom);

  const pagerRef = useRef<PagerView>(null);

  const { collections, activeCategory, setActiveCategory, isLoading, error, refresh } =
    useCollections();

  function handleFilterChange(cat: CollectionCategory | "all") {
    const idx = COLLECTION_CATEGORIES.findIndex((c) => c.key === cat);
    pagerRef.current?.setPage(idx);
  }

  function renderPage(catKey: string) {
    const data =
      catKey === "all" ? collections : collections.filter((c) => c.category === catKey);

    if (isLoading && collections.length === 0) {
      return (
        <View key={catKey} className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      );
    }

    if (error) {
      return (
        <View key={catKey} className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[--text-muted]">{error}</Text>
        </View>
      );
    }

    return (
      <View key={catKey} className="flex-1">
        <FlatList<BackendCollection>
          data={data}
          keyExtractor={(item) => item.key}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: bottomPadding }}
          onRefresh={refresh}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <CollectionCard
              item={item}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => router.push(`/collections/${item.key}` as any)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Text className="text-[--text-muted]">Koleksiyon bulunamadı.</Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <PageLayout>
      <PageHeader title="Koleksiyonlar" />

      <CollectionCategoryFilter
        activeCategory={activeCategory}
        onChange={handleFilterChange}
      />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => {
          const cat = COLLECTION_CATEGORIES[e.nativeEvent.position];
          if (cat) setActiveCategory(cat.key as CollectionCategory | "all");
        }}
      >
        {COLLECTION_CATEGORIES.map((cat) => renderPage(cat.key))}
      </PagerView>
    </PageLayout>
  );
}
