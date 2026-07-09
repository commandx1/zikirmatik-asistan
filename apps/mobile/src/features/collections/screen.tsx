import { useRouter } from "expo-router";
import { useRef, useMemo } from "react";
import { ActivityIndicator, FlatList, Platform, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { useProfileStore } from "../../store/profile-store";
import { CollectionCard } from "./components/collection-card";
import { CollectionCategoryFilter } from "./components/collection-category-filter";
import { useCollections } from "./hooks/use-collections";
import { COLLECTION_CATEGORIES, FREE_COLLECTION_KEYS } from "./types";
import type { CollectionCategory } from "./types";
import type { BackendCollection } from "./services/collections-api-client";

export function CollectionsScreen() {
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const bottomPadding =
    32 + (Platform.OS === "android" ? Math.max(insets.bottom, 0) : insets.bottom);

  const pagerRef = useRef<PagerView>(null);
  const isPremium = useProfileStore((s) => s.isPremium);
  const premiumSheet = usePremiumSheet();

  const { collections: rawCollections, activeCategory, setActiveCategory, isLoading, error, refresh } =
    useCollections();

  const collections = useMemo(() => {
    if (isPremium) return rawCollections;
    return [...rawCollections].sort((a, b) => {
      const aFree = FREE_COLLECTION_KEYS.has(a.key) ? 0 : 1;
      const bFree = FREE_COLLECTION_KEYS.has(b.key) ? 0 : 1;
      return aFree - bFree;
    });
  }, [isPremium, rawCollections]);

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
          renderItem={({ item }) => {
            const isLocked = !isPremium && !FREE_COLLECTION_KEYS.has(item.key);
            return (
              <CollectionCard
                item={item}
                isLocked={isLocked}
                onPress={() => {
                  if (isLocked) {
                    premiumSheet.open();
                    return;
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  router.push(`/collections/${item.key}` as any);
                }}
              />
            );
          }}
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
      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        topupProducts={premiumSheet.topupProducts}
        purchasingTopupId={premiumSheet.purchasingTopupId}
        topupError={premiumSheet.topupError}
        onPurchaseTopup={(productId) => {
          void premiumSheet.purchaseTopup(productId).then((purchased) => {
            if (purchased) premiumSheet.close();
          });
        }}
      />
    </PageLayout>
  );
}
