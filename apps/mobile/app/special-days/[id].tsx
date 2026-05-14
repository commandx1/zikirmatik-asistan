import { useLocalSearchParams } from "expo-router";
import { SpecialDayDetailScreen } from "../../src/features/special-days/special-day-detail-screen";

export default function SpecialDayDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  return <SpecialDayDetailScreen id={id} />;
}
