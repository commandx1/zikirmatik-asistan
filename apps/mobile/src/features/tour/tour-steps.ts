import type { TourStepDef } from "./types";

export const TOUR_REF_WATCH = "appleWatch";
export const TOUR_REF_TAP_ANYWHERE = "tapAnywhere";

export const TOUR_STEPS: TourStepDef[] = [
  {
    id: "watch",
    refKey: TOUR_REF_WATCH,
    title: "Zikir Sayacı",
    description:
      "Parmak izi simgesine bas, zikrini say. Halkalar ilerlemeyi gösterir. Alt butonlarla zikir listesi aç, hedef belirle, sıfırla veya kaydet.",
    tooltipPosition: "bottom",
    padding: 12,
  },
  {
    id: "tap-anywhere",
    refKey: TOUR_REF_TAP_ANYWHERE,
    title: "Her Yere Dokun",
    description:
      "Bu mod açıkken ekranın herhangi bir yerine dokunarak sayabilirsin — sadece parmak izine basmana gerek yok.",
    tooltipPosition: "bottom",
    padding: 10,
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
