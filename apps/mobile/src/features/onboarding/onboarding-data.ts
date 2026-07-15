export type PurposeOption = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
};

export const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    id: "habit",
    titleKey: "onboarding:purpose.habit.title",
    subtitleKey: "onboarding:purpose.habit.subtitle",
    icon: "🙏"
  },
  {
    id: "calm",
    titleKey: "onboarding:purpose.calm.title",
    subtitleKey: "onboarding:purpose.calm.subtitle",
    icon: "🪷"
  },
  {
    id: "tracking",
    titleKey: "onboarding:purpose.tracking.title",
    subtitleKey: "onboarding:purpose.tracking.subtitle",
    icon: "☸️"
  },
  {
    id: "special-days",
    titleKey: "onboarding:purpose.special-days.title",
    subtitleKey: "onboarding:purpose.special-days.subtitle",
    icon: "☪️"
  }
];
