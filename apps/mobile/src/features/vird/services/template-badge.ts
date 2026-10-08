import type { VirdTemplateSummary } from "@zikirmatik/shared";

/** MOB-VRD-25: "Premium" rozeti yalnız şablonun isPremium bayrağına bağlıdır (kod kaynağı doğrudur). */
export function shouldShowTemplatePremiumBadge(template: Pick<VirdTemplateSummary, "isPremium">): boolean {
  return template.isPremium === true;
}
