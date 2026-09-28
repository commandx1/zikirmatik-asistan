import type { RefObject } from "react";
import type { View } from "react-native";

export type SpotlightBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TourStepDef = {
  id: string;
  refKey?: string;
  tabIndex?: number;
  titleKey: string;
  descriptionKey: string;
  tooltipPosition: "top" | "bottom";
  padding?: number;
  shape?: "circle" | "rect";
};

export type TourRefs = Map<string, RefObject<View | null>>;

export type TabBarGeometry = {
  screenWidth: number;
  screenHeight: number;
  insetBottom: number;
  statusBarOffset: number;
  tabIndex: number;
  tabCount: number;
  barHeight: number;
  bottomGap: number;
  sideMargin: number;
};

/** Pure geometry math for the tab-bar spotlight, kept separate from RN measurement so it's unit-testable. */
export function computeTabBarSpotlightBounds({
  screenWidth,
  screenHeight,
  insetBottom,
  statusBarOffset,
  tabIndex,
  tabCount,
  barHeight,
  bottomGap,
  sideMargin,
}: TabBarGeometry): SpotlightBounds {
  const pillWidth = screenWidth - sideMargin * 2;
  const tabWidth = pillWidth / tabCount;
  const pillTop = screenHeight - insetBottom - bottomGap - barHeight + statusBarOffset;
  return {
    x: sideMargin + tabIndex * tabWidth,
    y: pillTop,
    width: tabWidth,
    height: barHeight,
  };
}
