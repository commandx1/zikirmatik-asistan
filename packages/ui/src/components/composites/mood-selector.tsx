import { View } from "react-native";
import { AppChip } from "../primitives/app-chip";

type MoodSelectorProps = {
  moods: string[];
  value: string;
  onChange: (next: string) => void;
};

export function MoodSelector({ moods, value, onChange }: MoodSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {moods.map((mood) => (
        <AppChip key={mood} label={mood} active={mood === value} onPress={() => onChange(mood)} />
      ))}
    </View>
  );
}
