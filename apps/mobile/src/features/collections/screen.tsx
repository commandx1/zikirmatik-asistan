import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { ActivityIndicator, FlatList, Platform, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useThemeTokens } from "@zikirmatik/ui";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { trackEvent } from "../../lib/analytics";
import { TemplateShelf } from "../vird/components/template-shelf";
import { CollectionCard } from "./components/collection-card";
import { CollectionCategoryFilter } from "./components/collection-category-filter";
import { useCollections } from "./hooks/use-collections";
import { COLLECTION_CATEGORIES } from "./types";
import type { CollectionCategory } from "./types";
import type { BackendCollection } from "./services/collections-api-client";

export function CollectionsScreen() {
  const router = useRouter();
  const { t } = useTranslation("collections");
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPadding =
    32 + (Platform.OS === "android" ? Math.max(insets.bottom, 0) : insets.bottom) + tabBarHeight;

  const pagerRef = useRef<PagerView>(null);

  const { collections, activeCategory, setActiveCategory, isLoading, error, refresh } =
    useCollections();

  function handleFilterChange(cat: CollectionCategory | "all") {
    const idx = COLLECTION_CATEGORIES.findIndex((c) => c.key === cat);
    pagerRef.current?.setPage(idx);
  }

  const renderCollectionItem = useCallback(
    ({ item }: { item: BackendCollection }) => (
      <CollectionCard
        item={item}
        onPress={() => {
          void trackEvent("collection_opened", { key: item.key });
          router.push(`/collections/${item.key}`);
        }}
      />
    ),
    [router]
  );

  function renderPage(catKey: string) {
    const data =
      catKey === "all" ? collections : collections.filter((c) => c.category === catKey);
    // Vird programı şablonları rafı yalnızca "all" (tümü) sayfasının üstünde
    // gösterilir — bkz. features/vird/components/template-shelf.tsx.
    const showTemplateShelf = catKey === "all";

    if (isLoading && collections.length === 0) {
      return (
        <View key={catKey} className="flex-1">
          {showTemplateShelf ? <TemplateShelf /> : null}
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={tokens.accent} />
          </View>
        </View>
      );
    }

    if (error) {
      return (
        <View key={catKey} className="flex-1">
          {showTemplateShelf ? <TemplateShelf /> : null}
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-text-muted">{error}</Text>
          </View>
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
          ListHeaderComponent={showTemplateShelf ? <TemplateShelf /> : undefined}
          renderItem={renderCollectionItem}
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Text className="text-text-muted">{t("collections:screen.emptyList")}</Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("collections:screen.title")} />

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
