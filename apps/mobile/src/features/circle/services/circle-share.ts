// Zikir Halkası paylaşım/davet yardımcıları — saf (RN import'suz), test
// edilebilir mantık. Ekranlar (circle-detail-screen.tsx, circle-join-screen.tsx)
// bu fonksiyonları kullanır.
import { CIRCLE_CODE_RE, resolveLocalizedText, type CircleSummary, type LocalizedText } from "@zikirmatik/shared";
import type { CreateDhikrLogPayload } from "../../dhikrs/services/dhikr-logs-api-client";

const SHARE_BASE_URL = "https://zikirmatik-asistan.vercel.app";

/** Halka davet mesajı (TR/EN). Link + kod ayrı satırda. */
export function buildCircleShareMessage({
  name,
  code,
  locale
}: {
  name: string;
  code: string;
  locale: string;
}): string {
  // M-09: TR kökte (/halka/KOD), EN kullanıcı /en/halka/KOD.
  const isTr = locale.startsWith("tr");
  const link = `${SHARE_BASE_URL}${isTr ? "" : "/en"}/halka/${code}`;

  if (isTr) {
    return `${name} zikir halkasına katıl!\n${link}\nKod: ${code}`;
  }

  return `Join the "${name}" dhikr circle!\n${link}\nCode: ${code}`;
}

/** Halka başlığı: ad yoksa (null) zikrin adı uygulama dilinde. */
export function resolveCircleTitle(
  circle: { name: string | null; dhikr: { name: LocalizedText } },
  locale: "tr" | "en"
): string {
  return circle.name || resolveLocalizedText(circle.dhikr.name, locale);
}

/** İlerleme çubuğu yüzdesi: hedef aşılsa da en çok 100 (gerçek sayı ayrıca gösterilir). */
export function circleProgressPercent(total: number, goal: number): number {
  return goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
}

/**
 * Ham bir metinden (yapıştırılmış kod, link ya da query param) geçerli bir
 * halka kodu çıkarır. Boşluk/tire temizlenir, büyük harfe çevrilir ve
 * CIRCLE_CODE_RE ile doğrulanır. Geçersizse null döner.
 */
export function parseCircleCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const linkMatch = trimmed.match(/\/(?:halka|circle\/join)\/?[^A-Za-z0-9]*([A-Za-z0-9-]{6,})/i);
  const queryMatch = trimmed.match(/[?&]code=([A-Za-z0-9-]{6,})/i);
  const raw = linkMatch?.[1] ?? queryMatch?.[1] ?? trimmed;

  const candidate = raw.replace(/[\s-]/g, "").toUpperCase();
  return CIRCLE_CODE_RE.test(candidate) ? candidate : null;
}

/**
 * Halkanın toplam sayacının ekranda GÖSTERİLECEK değeri — asla geriye
 * düşmez. Sunucu poll'u ile gelen `serverTotal`/`serverMine` ile yerel
 * `localMine` (henüz sunucuya yazılmamış artışlar dahil) birleştirilir:
 * total - serverMine, "benim dışımdaki" katkıyı verir; + localMine ile
 * benim en güncel katkım eklenir. `prev` ile max alınarak eski (daha büyük)
 * bir değerin üzerine asla yazılmaz.
 */
export function computeDisplayTotal(prev: number, serverTotal: number, serverMine: number, localMine: number): number {
  return Math.max(prev, serverTotal - serverMine + localMine);
}

export function buildCircleLogPayload({
  userId,
  circle,
  count,
  date
}: {
  userId: string;
  circle: Pick<CircleSummary, "id" | "dhikrId" | "goalCount">;
  count: number;
  date: string;
}): CreateDhikrLogPayload {
  return {
    userId,
    dhikrId: circle.dhikrId,
    count,
    targetCount: circle.goalCount,
    date,
    source: "circle",
    circleId: circle.id,
    isCompleted: false
  };
}
