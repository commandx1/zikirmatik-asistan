import { useCallback } from "react";

import { useAppLocale, type SupportedLocale } from "../i18n";
import { toLocaleUpper } from "../lib/locale-format";

/**
 * RN'de className'deki büyük harf stili (textTransform) Android'de cihaz
 * locale'ini kullanır (tr cihazda "i" → "İ"). Bu hook, büyük harfe çevirmeyi
 * uygulamanın seçili diline göre JS tarafında yapar. Dil değişince bileşen
 * yeniden render olur.
 */
export function useLocaleUpper(): (value?: string | null) => string {
  const locale = useAppLocale() as SupportedLocale;

  return useCallback(
    (value?: string | null) => {
      if (!value) return "";
      return toLocaleUpper(value, locale);
    },
    [locale]
  );
}
