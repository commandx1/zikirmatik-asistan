import { useLocalSearchParams } from "expo-router";
import { VirdEditorScreen } from "../../src/features/vird/screens/vird-editor-screen";

export default function VirdEditorRoute() {
  const { programId, cloneFrom } = useLocalSearchParams<{ programId?: string; cloneFrom?: string }>();
  return (
    <VirdEditorScreen
      programId={typeof programId === "string" ? programId : undefined}
      cloneFromId={typeof cloneFrom === "string" ? cloneFrom : undefined}
    />
  );
}
