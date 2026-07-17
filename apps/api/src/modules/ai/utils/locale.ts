export type SupportedAiLocale = 'tr' | 'en';

const SUPPORTED_AI_LOCALES: SupportedAiLocale[] = ['tr', 'en'];

/**
 * `Accept-Language` header'ından desteklenen locale'i çözümler.
 * Yalnızca 'tr' ve 'en' desteklenir; eksik, ayrıştırılamayan veya başka bir
 * dile ait değerler mevcut davranışı korumak için 'tr'ye düşer.
 */
export function resolveAiRecommendationLocale(
  acceptLanguageHeader?: string | null,
): SupportedAiLocale {
  if (!acceptLanguageHeader) {
    return 'tr';
  }

  const primary = acceptLanguageHeader
    .split(',')[0]
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();

  const languageCode = primary?.split('-')[0];

  return SUPPORTED_AI_LOCALES.includes(languageCode as SupportedAiLocale)
    ? (languageCode as SupportedAiLocale)
    : 'tr';
}
