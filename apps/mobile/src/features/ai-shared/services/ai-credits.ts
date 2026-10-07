// AI kredi kararlarının saf parçaları — hooks/use-ai-credits.ts bunları
// kullanır; burada (RN/React'sız) test edilir.
import type { AiDailyQuota } from "../../ai-guide/services/ai-api-client";

export type CreditState = { balance: number; isPremium: boolean };

/**
 * /v1/ai/credits alınamazsa /v1/ai/quota'dan türetilen bakiye (yalnız
 * ücretsiz). Premium için gerçek bakiye kotadan bilinemez (M-07: uydurma
 * "sınırsız" sayı yok) → undefined; çağıran son bilinen değere düşer.
 */
export function resolveCreditsFromQuota(quota: AiDailyQuota): CreditState | undefined {
  if (quota.isPremium) {
    return undefined;
  }
  return { balance: Math.max(0, (quota.limit ?? 1) - quota.used), isPremium: false };
}

/** M-07: yalnız gerçek bakiye — premium dahil. Rehber/Sohbet requiredCredits=1, Vird programı 3. */
export function hasEnoughCredits({ balance, requiredCredits }: CreditState & { requiredCredits: number }) {
  return balance >= requiredCredits;
}

/** Yanıttaki `remainingCredits` — sonlu sayı değilse yok sayılır (undefined). */
export function normalizeRemainingCredits(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : undefined;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Satın alma sonrası bakiye sunucuya yansıyana kadar yoklar: ilk deneme
 * hemen, sonra `intervalMs` arayla toplam `attempts` deneme. `check` true
 * dönerse true; denemeler biterse ya da `check` fırlatırsa false.
 */
export async function pollUntil(
  check: () => Promise<boolean>,
  { attempts = 8, intervalMs = 2000, sleep = defaultSleep }: { attempts?: number; intervalMs?: number; sleep?: (ms: number) => Promise<void> } = {}
): Promise<boolean> {
  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (attempt > 0) {
        await sleep(intervalMs);
      }
      if (await check()) {
        return true;
      }
    }
  } catch {
    // eski davranış: döngüdeki hata "yüklenemedi" bildirimine düşerdi
  }
  return false;
}
