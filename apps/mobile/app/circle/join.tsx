import { useLocalSearchParams } from "expo-router";
import { CircleJoinScreen } from "../../src/features/circle/screens/circle-join-screen";

export default function CircleJoinRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <CircleJoinScreen code={typeof code === "string" ? code : ""} />;
}
