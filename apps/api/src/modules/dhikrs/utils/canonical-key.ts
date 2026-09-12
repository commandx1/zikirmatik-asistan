import { createHash } from 'node:crypto';

// apps/api/scripts/lib/canonical-key.mjs ile birebir aynı mantık — biri
// seed script'i, diğeri Nest CRUD (DhikrsService.create/update) için.
const HARAKAT_RANGE = /[ً-ْٰ]/gu;
const TATWEEL = /ـ/gu;
const WHITESPACE_AND_PUNCTUATION = /[\s\p{P}]/gu;

/**
 * Arapça metinden (harekesiz, boşluksuz, noktalamasız, NFC normalize)
 * sha1 özetinin ilk 12 hex karakterini üretir. Aynı duanın harekeli ve
 * harekesiz varyantları aynı canonicalKey'i verir.
 */
export function canonicalKeyFromArabic(
  nameArabic: string | undefined | null,
): string | undefined {
  if (typeof nameArabic !== 'string') {
    return undefined;
  }

  const stripped = nameArabic
    .replace(HARAKAT_RANGE, '')
    .replace(TATWEEL, '')
    .replace(WHITESPACE_AND_PUNCTUATION, '')
    .normalize('NFC');

  if (!stripped) {
    return undefined;
  }

  return createHash('sha1').update(stripped, 'utf8').digest('hex').slice(0, 12);
}
