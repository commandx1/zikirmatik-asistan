import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback } from "react";
import { CollectionDetailScreen } from "../../../src/features/collections/collection-detail-screen";

export default function CollectionDetailRoute() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // [key] is a Stack screen inside the collections tab — parent is the Tabs navigator
      const tabNav = navigation.getParent();
      tabNav?.setOptions({ tabBarStyle: { display: "none" } });
      return () => tabNav?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

  return <CollectionDetailScreen collectionKey={key ?? ""} />;
}
