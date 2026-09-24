import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { useNotificationPromptStore } from '../../../store/notification-prompt-store'
import { useOnboardingStore } from '../../../store/onboarding-store'
import { ESMAUL_HUSNA } from '../../focus/data'
import type { EsmaulHusnaItem } from '../../focus/types'
import {
  buildDailyEsmaWelcomeStorageKey,
  resolveDailyEsmaSuggestions
} from '../services/daily-esma-suggestion-service'
import { useHomeNavigationIntentStore } from '../services/home-navigation-intent-store'

type Options = {
  /** Something on home needs the user's attention first (modal, unsaved progress…). */
  isHomeBusy: boolean
  onStart: (item: EsmaulHusnaItem) => void
}

/** Once-a-day Esma suggestions popup, deferred while home is busy. */
export function useDailyEsmaWelcome({ isHomeBusy, onStart }: Options) {
  const isTourCompleted = useOnboardingStore(s => s.isTourCompleted)
  const isNotificationPromptBlocking = useNotificationPromptStore(s => s.isPending || s.visible || s.deniedVisible)
  const pendingNavigationDailyEsmaStart = useHomeNavigationIntentStore(state => state.pendingDailyEsmaStart)
  const esmaListFocusRequestId = useHomeNavigationIntentStore(state => state.esmaListFocusRequestId)
  const [dailyEsmaSuggestions, setDailyEsmaSuggestions] = useState<EsmaulHusnaItem[]>([])
  const [isDailyEsmaWelcomeOpen, setDailyEsmaWelcomeOpen] = useState(false)
  const [checkedDailyEsmaWelcomeKey, setCheckedDailyEsmaWelcomeKey] = useState('')

  const shouldDeferDailyEsmaWelcome =
    !isTourCompleted ||
    isNotificationPromptBlocking ||
    isHomeBusy ||
    Boolean(pendingNavigationDailyEsmaStart) ||
    esmaListFocusRequestId > 0

  useEffect(() => {
    const today = new Date()
    const storageKey = buildDailyEsmaWelcomeStorageKey(today)

    if (shouldDeferDailyEsmaWelcome) {
      if (pendingNavigationDailyEsmaStart || esmaListFocusRequestId > 0) {
        setCheckedDailyEsmaWelcomeKey(storageKey)
      }
      return
    }

    if (checkedDailyEsmaWelcomeKey === storageKey) {
      return
    }

    let isCancelled = false
    void AsyncStorage.getItem(storageKey)
      .then(value => {
        if (isCancelled) {
          return
        }

        setCheckedDailyEsmaWelcomeKey(storageKey)
        if (value) {
          return
        }

        const suggestions = resolveDailyEsmaSuggestions(ESMAUL_HUSNA, today)
        if (suggestions.length === 0) {
          return
        }

        setDailyEsmaSuggestions(suggestions)
        setDailyEsmaWelcomeOpen(true)
      })
      .catch(() => {
        setCheckedDailyEsmaWelcomeKey(storageKey)
      })

    return () => {
      isCancelled = true
    }
  }, [
    checkedDailyEsmaWelcomeKey,
    esmaListFocusRequestId,
    isNotificationPromptBlocking,
    isTourCompleted,
    pendingNavigationDailyEsmaStart,
    shouldDeferDailyEsmaWelcome
  ])

  const markDailyEsmaWelcomeSeen = useCallback(() => {
    const today = new Date()
    const storageKey = buildDailyEsmaWelcomeStorageKey(today)
    setCheckedDailyEsmaWelcomeKey(storageKey)
    setDailyEsmaWelcomeOpen(false)
    void AsyncStorage.setItem(storageKey, 'seen').catch(() => {
      // Ignore local marker write errors; the popup remains dismissed for this session.
    })
    // Only today's marker is ever read; drop yesterday's so keys don't pile up.
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    void AsyncStorage.removeItem(buildDailyEsmaWelcomeStorageKey(yesterday)).catch(() => {})
  }, [])

  const onDailyEsmaStart = useStableCallback((item: EsmaulHusnaItem) => {
    markDailyEsmaWelcomeSeen()
    onStart(item)
  })

  return useMemo(
    () => ({
      isDailyEsmaWelcomeOpen,
      dailyEsmaSuggestions,
      onDailyEsmaDismiss: markDailyEsmaWelcomeSeen,
      onDailyEsmaShowAll: markDailyEsmaWelcomeSeen,
      onDailyEsmaStart
    }),
    [isDailyEsmaWelcomeOpen, dailyEsmaSuggestions, markDailyEsmaWelcomeSeen, onDailyEsmaStart]
  )
}
