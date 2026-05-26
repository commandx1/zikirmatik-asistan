import type { ComponentProps } from "react";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export type SpecialDayIconName = ComponentProps<typeof FontAwesome6>["name"];

export type CountdownSegment = {
  label: string;
  value: string;
};

export type HeroCardViewModel = {
  id: string;
  badge: string;
  title: string;
  dateLabel: string;
  countdown: CountdownSegment[];
  remaining: string;
  isLocked: boolean;
  isTodaySpecial: boolean;
};

export type UpcomingDayViewModel = {
  id: string;
  dateLabel: string;
  icon: SpecialDayIconName;
  remaining: string;
  title: string;
  isLocked: boolean;
};

export type TodayActionViewModel = {
  specialDayId: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  isLocked: boolean;
};
