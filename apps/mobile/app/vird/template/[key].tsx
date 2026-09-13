import { useLocalSearchParams } from "expo-router";
import { TemplateDetailScreen } from "../../../src/features/vird/screens/template-detail-screen";

export default function VirdTemplateDetailRoute() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  return <TemplateDetailScreen templateKey={key ?? ""} />;
}
