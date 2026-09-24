import { toDateKey } from '@zikirmatik/shared'
import type { AiDhikrContext } from '../../focus/types'
import type { CreateDhikrLogPayload } from './dhikr-logs-api-client'
import { isObjectId } from './dhikr-ids'

export type DhikrLogSourceContext =
  | { source: 'manual' }
  | { source: 'special-day' }
  | { source: 'ai'; aiRecommendationId: string; aiPrompt: string; aiAssistantNote?: string }

type LoggableDhikr = { id: string; target: number; arabic?: string; isFavorite: boolean }

/**
 * Log payload for a store dhikr — catalog (ObjectId) dhikrs are keyed by
 * `dhikrId`, personal ones by `customDhikr*`. Key order mirrors what the home
 * and focus screens sent before this was shared.
 */
export function buildDhikrLogPayload(
  item: LoggableDhikr,
  {
    userId,
    displayName,
    count,
    isCompleted,
    sourceContext = { source: 'manual' }
  }: {
    userId: string
    /** Only sent for personal dhikrs (`customDhikrName`). */
    displayName: string
    count: number
    isCompleted: boolean
    sourceContext?: DhikrLogSourceContext
  }
): CreateDhikrLogPayload {
  const dhikrKey = isObjectId(item.id)
    ? { dhikrId: item.id }
    : { customDhikrId: item.id, customDhikrName: displayName, customDhikrArabic: item.arabic }

  return {
    userId,
    ...dhikrKey,
    count,
    targetCount: item.target,
    date: toDateKey(new Date()),
    ...sourceContext,
    isCompleted,
    isFavorite: item.isFavorite
  }
}

/** AI recommendation wins over a special-day start; anything else is manual. */
export function resolveDhikrLogSource(
  dhikrId: string,
  activeAiContext: AiDhikrContext | undefined,
  selectedSource: 'special-day' | undefined
): DhikrLogSourceContext {
  if (activeAiContext?.dhikrId === dhikrId) {
    return {
      source: 'ai',
      aiRecommendationId: activeAiContext.recommendationId,
      aiPrompt: activeAiContext.prompt,
      aiAssistantNote: activeAiContext.assistantNote
    }
  }

  return selectedSource === 'special-day' ? { source: 'special-day' } : { source: 'manual' }
}
