// Sohbet gönderiminin saf kararları (use-chat-stream.ts kullanır): boş mesaj
// engeli, A-11 clientMessageId yeniden kullanımı, hata sınıflandırma ve
// CLIENT_MESSAGE_ID_IN_PROGRESS tekrarı.
import {
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_UNAVAILABLE_CODE,
  DAILY_LIMIT_REACHED_CODE
} from "../../ai-shared/ai-error-codes";

export const CLIENT_MESSAGE_ID_IN_PROGRESS = "CLIENT_MESSAGE_ID_IN_PROGRESS";
export const CLIENT_MESSAGE_ID_CONFLICT = "CLIENT_MESSAGE_ID_CONFLICT";

/** Yalnız boşluk → sunucu 400'ler; istemci hiç göndermez. */
export const isBlankMessage = (text: string) => text.trim().length === 0;

export type ClientMessageKey = { text: string; id: string };

/** Aynı metnin tekrarı (503 sonrası "Tekrar dene") aynı anahtarı taşır; metin değişirse yeni anahtar. */
export function resolveClientMessageId(prev: ClientMessageKey | undefined, text: string, create: () => string): ClientMessageKey {
  return prev && prev.text === text ? prev : { text, id: create() };
}

export type ChatErrorKind = "credit" | "unavailable" | "in_progress" | "other";

/** B-30: günlük limit de kredi gibi premium sayfasına gider; CONFLICT genel hata (other). */
export function classifyChatError(code: string | undefined): ChatErrorKind {
  if (code === AI_CREDIT_INSUFFICIENT_CODE || code === DAILY_LIMIT_REACHED_CODE) return "credit";
  if (code === AI_UNAVAILABLE_CODE) return "unavailable";
  if (code === CLIENT_MESSAGE_ID_IN_PROGRESS) return "in_progress";
  return "other";
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 409 IN_PROGRESS (aynı anahtarla ilk istek sürüyor) → kısa beklemeyle aynı çağrıyı tekrarla; tükenirse son hatayı fırlat. */
export async function retryOnInProgress<T>(
  run: () => Promise<T>,
  { delaysMs = [1500, 3000, 4500], sleep = defaultSleep }: { delaysMs?: number[]; sleep?: (ms: number) => Promise<void> } = {}
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      const delay = delaysMs[attempt];
      if (classifyChatError(code) !== "in_progress" || delay === undefined) throw error;
      await sleep(delay);
    }
  }
}
