import type { TourStepDef } from "./types";

export const TOUR_REF_WATCH = "appleWatch";
export const TOUR_REF_TAP_ANYWHERE = "tapAnywhere";
export const TOUR_REF_WATCH_LIST = "watchBtnList";
export const TOUR_REF_WATCH_TARGET = "watchBtnTarget";
export const TOUR_REF_WATCH_RESET = "watchBtnReset";
export const TOUR_REF_WATCH_SAVE = "watchBtnSave";

export const TOUR_STEPS: TourStepDef[] = [
  {
    id: "watch",
    refKey: TOUR_REF_WATCH,
    titleKey: "tour:steps.watch.title",
    descriptionKey: "tour:steps.watch.description",
    tooltipPosition: "bottom",
    padding: 12,
    shape: "circle",
  },
  {
    id: "watch-btn-list",
    refKey: TOUR_REF_WATCH_LIST,
    titleKey: "tour:steps.watchBtnList.title",
    descriptionKey: "tour:steps.watchBtnList.description",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "watch-btn-target",
    refKey: TOUR_REF_WATCH_TARGET,
    titleKey: "tour:steps.watchBtnTarget.title",
    descriptionKey: "tour:steps.watchBtnTarget.description",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "watch-btn-reset",
    refKey: TOUR_REF_WATCH_RESET,
    titleKey: "tour:steps.watchBtnReset.title",
    descriptionKey: "tour:steps.watchBtnReset.description",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "watch-btn-save",
    refKey: TOUR_REF_WATCH_SAVE,
    titleKey: "tour:steps.watchBtnSave.title",
    descriptionKey: "tour:steps.watchBtnSave.description",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "tap-anywhere",
    refKey: TOUR_REF_TAP_ANYWHERE,
    titleKey: "tour:steps.tapAnywhere.title",
    descriptionKey: "tour:steps.tapAnywhere.description",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "tab-focus",
    tabIndex: 1,
    titleKey: "tour:steps.tabFocus.title",
    descriptionKey: "tour:steps.tabFocus.description",
    tooltipPosition: "top",
    padding: 6,
  },
  {
    id: "tab-ai-guide",
    tabIndex: 2,
    titleKey: "tour:steps.tabAiGuide.title",
    descriptionKey: "tour:steps.tabAiGuide.description",
    tooltipPosition: "top",
    padding: 6,
  },
  {
    id: "tab-special-days",
    tabIndex: 3,
    titleKey: "tour:steps.tabSpecialDays.title",
    descriptionKey: "tour:steps.tabSpecialDays.description",
    tooltipPosition: "top",
    padding: 6,
  },
];
