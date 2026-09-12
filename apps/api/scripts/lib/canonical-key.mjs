import { createHash } from 'node:crypto';

// Harekeler/tenvin (U+064B–U+0652) ve üst-elif (U+0670) — okunuşu değil
// telaffuz ayrıntısını taşır; aynı duanın harekeli/harekesiz kopyalarını
// aynı köke bağlamak için bunları atarız.
const HARAKAT_RANGE = /[ً-ْٰ]/gu;
// Tatweel (kaşide) — salt görsel uzatma karakteri, anlam taşımaz.
const TATWEEL = /ـ/gu;
// Boşluk ve noktalama (Arapça + Latin) — anahtar üretiminde göz ardı edilir.
const WHITESPACE_AND_PUNCTUATION = /[\s\p{P}]/gu;

/**
 * Arapça metinden (harekesiz, boşluksuz, noktalamasız, NFC normalize)
 * sha1 özetinin ilk 12 hex karakterini üretir. Aynı duanın harekeli ve
 * harekesiz varyantları aynı canonicalKey'i verir.
 *
 * @param {string | undefined | null} nameArabic
 * @returns {string | undefined}
 */
export function canonicalKeyFromArabic(nameArabic) {
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
