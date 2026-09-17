import { useLocalSearchParams } from "expo-router";
import { CircleSessionScreen } from "../../src/features/circle/screens/circle-session-screen";

export default function CircleSessionRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <CircleSessionScreen id={typeof id === "string" ? id : ""} />;
}
