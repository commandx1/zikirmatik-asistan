/**
 * `run-rehber-eval.ts` ve `run-chat-eval.ts` arasında paylaşılan küçük
 * yardımcılar. Nest/Mongo bağımlılığı yoktur (execSync hariç, o da yalnızca
 * git sha için kullanılır ve başarısız olursa 'unknown'a düşer).
 */
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');

export function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

/**
 * `ai.service.ts`'deki `resolveTimeOfDay` ile birebir aynı eşleme —
 * eval'ın timeOfDay'i gerçek trafikle aynı mantıkla derive etmesi için.
 */
export function deriveTimeOfDay(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'evening';
  return 'night';
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * `AiPipelineError` örneklerinden `reason`ı, diğer hatalardan `message`'ı
 * çıkarır. Eval hiçbir zaman bir vakadan dolayı çökmemeli — bu yüzden
 * her zaman bir string döner.
 */
export function describeError(error: unknown): string {
  if (error && typeof error === 'object' && 'reason' in error) {
    const reason = (error as { reason?: unknown }).reason;
    const message = (error as { message?: unknown }).message;
    if (typeof reason === 'string') {
      return typeof message === 'string' ? `${reason}: ${message}` : reason;
    }
  }
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'bilinmeyen hata';
}

export function pickLocaleText(
  text: { tr: string; en: string } | undefined,
  locale: 'tr' | 'en',
): string {
  if (!text) return '';
  if (locale === 'en') return text.en?.trim() || text.tr?.trim() || '';
  return text.tr?.trim() || text.en?.trim() || '';
}

export function validateEvalUserId(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed || !/^[0-9a-fA-F]{24}$/.test(trimmed)) {
    throw new Error(
      'AI_EVAL_USER_ID ortam değişkeni geçerli bir MongoDB ObjectId (24 hex karakter) olmalı. ' +
        "Gerçek bir kullanıcı id'si kullanın (bkz. apps/api/scripts/eval/README.md).",
    );
  }
  return trimmed;
}

export function newRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
