import { useLocalSearchParams } from "expo-router";
import { CollectionDetailScreen } from "../../src/features/collections/collection-detail-screen";

export default function CollectionDetailRoute() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  return <CollectionDetailScreen collectionKey={key ?? ""} />;
}
