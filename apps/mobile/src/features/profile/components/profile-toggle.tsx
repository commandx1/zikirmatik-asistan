import { Pressable, View } from "react-native";

type ProfileToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ProfileToggle({ value, onChange }: ProfileToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className={`h-5 w-10 rounded-full ${value ? "bg-[--accent]" : "bg-white/10"}`}
    >
      <View
        className={`absolute top-0 h-5 w-5 rounded-full border-2 ${value ? "right-0 border-[--accent] bg-white" : "left-0 border-white/20 bg-white"}`}
      />
    </Pressable>
  );
}
