// AI kredi kararlarının saf parçaları — hooks/use-ai-credits.ts bunları
// kullanır; burada (RN/React'sız) test edilir.
import type { AiDailyQuota } from "../../ai-guide/services/ai-api-client";

export type CreditState = { balance: number; isPremium: boolean };

/** /v1/ai/credits alınamazsa /v1/ai/quota'dan türetilen bakiye. */
export function resolveCreditsFromQuota(quota: AiDailyQuota): CreditState {
  return {
    balance: quota.isPremium ? Number.MAX_SAFE_INTEGER : Math.max(0, (quota.limit ?? 1) - quota.used),
    isPremium: quota.isPremium
  };
}

/** Rehber/Sohbet requiredCredits=1 (balance > 0), Vird programı 3. */
export function hasEnoughCredits({ balance, isPremium, requiredCredits }: CreditState & { requiredCredits: number }) {
  return isPremium || balance >= requiredCredits;
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
