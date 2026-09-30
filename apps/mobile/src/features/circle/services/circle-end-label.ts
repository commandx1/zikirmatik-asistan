import type { CircleSummary } from "@zikirmatik/shared";
import type { SupportedLocale } from "../../../i18n";
import { formatDateTime } from "../../../lib/locale-format";

const MINUTE_MS = 60_000;

type Translate = (key: string, options: { date: string }) => string;

/**
 * Üyeye gösterilen bitiş etiketi. expiresAt varsa gerçek an, izleyicinin yerel
 * saatinde; "günün sonu" 00:00 yerine son dahil dakika görünsün diye YALNIZ
 * gösterim için 1 dk çıkarılır. expiresAt yoksa (eski halkalar) ham endDate.
 */
export function circleEndLabel(
  circle: Pick<CircleSummary, "endDate" | "expiresAt">,
  locale: SupportedLocale,
  t: Translate,
  timeZone?: string
): string {
  if (circle.expiresAt) {
    const expires = new Date(circle.expiresAt);
    if (!Number.isNaN(expires.getTime())) {
      const shown = formatDateTime(new Date(expires.getTime() - MINUTE_MS), locale, timeZone);
      return t("circle:detail.endsAt", { date: shown });
    }
  }
  return t("circle:detail.endDate", { date: circle.endDate ?? "" });
}
