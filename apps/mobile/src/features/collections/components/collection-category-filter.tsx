import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { COLLECTION_CATEGORIES } from "../types";
import type { CollectionCategory } from "../types";

type Props = {
  activeCategory: CollectionCategory | "all";
  onChange: (category: CollectionCategory | "all") => void;
};

export function CollectionCategoryFilter({ activeCategory, onChange }: Props) {
  const { tokens } = useThemeTokens();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const itemLayouts = useRef<{ x: number; width: number }[]>([]);

  useEffect(() => {
    const idx = COLLECTION_CATEGORIES.findIndex((c) => c.key === activeCategory);
    const layout = itemLayouts.current[idx];
    if (!layout || !scrollRef.current) return;
    const targetX = layout.x + layout.width / 2 - screenWidth / 2;
    scrollRef.current.scrollTo({ x: Math.max(0, targetX), animated: true });
  }, [activeCategory, screenWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
      className="mb-4"
      style={{ maxHeight: 44, height: 44 }}
    >
      {COLLECTION_CATEGORIES.map((cat, idx) => {
        const isActive = cat.key === activeCategory;
        return (
          <Pressable
            key={cat.key}
            onPress={() => onChange(cat.key)}
            onLayout={(e) => {
              itemLayouts.current[idx] = {
                x: e.nativeEvent.layout.x,
                width: e.nativeEvent.layout.width,
              };
            }}
            style={{ height: 36 }}
            className={[
              "rounded-full px-4 items-center justify-center border",
              isActive
                ? "bg-[--accent] border-[--accent]"
                : "border-white/15 bg-white/5",
            ].join(" ")}
          >
            <Text
              className="text-[13px] font-medium"
              style={{ color: isActive ? tokens.bg : tokens.textMuted }}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
