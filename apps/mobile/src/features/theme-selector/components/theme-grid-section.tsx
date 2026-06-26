import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { ThemeName } from "@zikirmatik/shared";
import type { RefObject } from "react";
import { Pressable, Text, View } from "react-native";
import type { ThemeOption } from "../hooks/use-theme-selector";

type ThemeGridSectionProps = {
  options: ThemeOption[];
  selected: ThemeName;
  onSelect: (theme: ThemeName) => void;
  selectedCardRef?: RefObject<View | null>;
};

export function ThemeGridSection({ options, selected, onSelect, selectedCardRef }: ThemeGridSectionProps) {
  return (
    <View>
      <Text className="mb-3 px-1 text-sm font-semibold uppercase tracking-[1.1px] text-[--text-muted]">Hazır Temalar</Text>
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {options.map((option) => {
          const isSelected = option.id === selected;
          const isLocked = option.isPremiumLocked;
          return (
            <Pressable
              key={option.id}
              ref={isSelected ? selectedCardRef : undefined}
              collapsable={false}
              onPress={() => onSelect(option.id)}
              className={`relative w-[48.5%] items-center gap-2 rounded-2xl border bg-[--card] p-3 ${isSelected ? "border-[--accent]" : "border-white/5"} ${isLocked ? "opacity-85" : ""}`}
            >
              {isSelected ? (
                <View className="absolute right-2 top-2 z-10 h-5 w-5 items-center justify-center rounded-full bg-[--accent]">
                  <FontAwesome6 name="check" size={10} color="#0F1B2D" />
                </View>
              ) : null}
              {isLocked ? (
                <View className="absolute left-2 top-2 z-10 flex-row items-center gap-1 rounded-full border border-[--accent]/30 bg-[--accent]/15 px-2 py-1">
                  <FontAwesome6 name="lock" size={8} color="#C8972A" />
                  <Text className="text-xs font-bold uppercase tracking-[0.5px] text-[--accent]">Premium</Text>
                </View>
              ) : null}

              <View className="h-16 w-full items-center justify-center rounded-[10px] border border-white/10" style={{ backgroundColor: option.swatchBg }}>
                <View
                  className="h-8 w-8 items-center justify-center rounded-full border"
                  style={{ backgroundColor: option.swatchInner, borderColor: `${option.dotBorder}50` }}
                >
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: option.dotColor }} />
                </View>
              </View>
              <Text className="text-sm font-medium text-[--text-primary]">{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
