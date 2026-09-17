import { useLocalSearchParams } from "expo-router";
import { CircleDetailScreen } from "../../src/features/circle/screens/circle-detail-screen";

export default function CircleDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CircleDetailScreen id={typeof id === "string" ? id : ""} />;
}
