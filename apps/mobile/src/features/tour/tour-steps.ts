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
    title: "Zikir Sayacı",
    description:
      "Parmak izi simgesine bas, zikrini say. Halkalar ilerlemeyi gösterir.",
    tooltipPosition: "bottom",
    padding: 12,
    shape: "circle",
  },
  {
    id: "watch-btn-list",
    refKey: TOUR_REF_WATCH_LIST,
    title: "Zikir Listesi",
    description: "Kayıtlı zikirlerini aç ve sayaca yükle.",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "watch-btn-target",
    refKey: TOUR_REF_WATCH_TARGET,
    title: "Hedef Belirle",
    description: "Kaç kez okuyacağını belirle; halka ilerlemeyi gösterir.",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "watch-btn-reset",
    refKey: TOUR_REF_WATCH_RESET,
    title: "Sayacı Sıfırla",
    description: "Mevcut zikir sayacını başa al.",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "watch-btn-save",
    refKey: TOUR_REF_WATCH_SAVE,
    title: "Kaydet",
    description: "Zikir seansını hesabına kaydet.",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "tap-anywhere",
    refKey: TOUR_REF_TAP_ANYWHERE,
    title: "Her Yere Dokun",
    description:
      "Bu mod açıkken ekranın herhangi bir yerine dokunarak sayabilirsin — sadece parmak izine basmana gerek yok.",
    tooltipPosition: "bottom",
    padding: 10,
    shape: "circle",
  },
  {
    id: "tab-focus",
    tabIndex: 1,
    title: "Zikirlerim",
    description: "Kayıtlı zikirlerini buradan yönet ve sayaca yükle.",
    tooltipPosition: "top",
    padding: 6,
  },
  {
    id: "tab-ai-guide",
    tabIndex: 2,
    title: "AI Rehber",
    description:
      "Yapay zeka destekli kişisel zikir tavsiyeleri al; rehber geçmişini takip eder.",
    tooltipPosition: "top",
    padding: 6,
  },
  {
    id: "tab-special-days",
    tabIndex: 3,
    title: "Özel Günler",
    description:
      "Kandiller ve dini öneme sahip günleri kaçırma; bildirim ile haberdar ol.",
    tooltipPosition: "top",
    padding: 6,
  },
];
