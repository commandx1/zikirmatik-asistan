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
  title: string;
  description: string;
  tooltipPosition: "top" | "bottom";
  padding?: number;
};

export type TourRefs = Map<string, RefObject<View | null>>;
