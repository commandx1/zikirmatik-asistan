import { resolveLocalizedText, type LocalizedText } from '@zikirmatik/shared'
import type { ZikirSource } from '../../focus/types'

/**
 * Next "<prefix> N" title for an unnamed free-mode session: one past the
 * highest N among personal dhikrs already titled that way.
 */
export function buildNextAutoFreeTitle(
  items: Array<{
    source: ZikirSource
    name: LocalizedText | string
    transliteration?: LocalizedText | string
  }>,
  prefix: string,
  locale: 'tr' | 'en'
) {
  let maxIndex = 0

  for (const item of items) {
    if (item.source !== 'personal') {
      continue
    }

    const title = (
      resolveLocalizedText(item.name, locale) ||
      (item.transliteration ? resolveLocalizedText(item.transliteration, locale) : '')
    ).trim()
    const match = new RegExp(`^${prefix}\\s+(\\d+)$`, 'i').exec(title)
    if (!match) {
      continue
    }

    const parsed = Number.parseInt(match[1] ?? '', 10)
    if (Number.isFinite(parsed) && parsed > maxIndex) {
      maxIndex = parsed
    }
  }

  return `${prefix} ${maxIndex + 1}`
}
