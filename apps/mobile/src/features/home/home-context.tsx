import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { resolveLocalizedText, type LocalizedText } from '@zikirmatik/shared'
import { useAppLocale } from '../../i18n'
import { useAuthStore } from '../../store/auth-store'
import { useDhikrStore } from '../../store/dhikr-store'
import { dhikrDisplayName as dhikrDisplayNamePure } from '../dhikrs/services/dhikr-display'
import type { ZikirSource } from '../focus/types'
import { useStreak } from '../stats/hooks/use-streak'
import { useCounterEngine } from './hooks/use-counter-engine'
import { useDailyEsmaWelcome } from './hooks/use-daily-esma-welcome'
import { useDhikrLogSave } from './hooks/use-dhikr-log-save'
import { useDhikrTransition } from './hooks/use-dhikr-transition'
import { useFreeSaveForm } from './hooks/use-free-save-form'
import { useHomeEditors } from './hooks/use-home-editors'
import { useTapAnywherePref } from './hooks/use-tap-anywhere-pref'

type HomeDhikr = {
  id: string
  source: ZikirSource
  displayName: string
  transliteration?: string
  arabic?: string
  meaning?: string
}

/**
 * Home state is split by update frequency: HomeCounterContext changes on every
 * tap (count, progress, lap), HomeUiContext only when a modal, draft, list or
 * notice changes. Subscribe to the narrowest one you need.
 */
export type HomeCounterValue = ReturnType<typeof useHomeValues>['counter']
export type HomeUiValue = ReturnType<typeof useHomeValues>['ui']

const HomeCounterContext = createContext<HomeCounterValue | null>(null)
const HomeUiContext = createContext<HomeUiValue | null>(null)

function useHomeValues() {
  const { t } = useTranslation('home')
  const locale = useAppLocale()
  const dhikrDisplayName = useCallback(
    (item: { name: LocalizedText | string; transliteration: LocalizedText | string }) =>
      dhikrDisplayNamePure(item, locale),
    [locale]
  )
  const freeModeLabel = t('home:freeMode.label')
  const items = useDhikrStore(state => state.items)
  const selectedDhikrId = useDhikrStore(state => state.selectedDhikrId)
  const authDisplayName = useAuthStore(state => state.session?.displayName)
  const selectedDhikr = useMemo(() => items.find(item => item.id === selectedDhikrId), [items, selectedDhikrId])

  const { tapAnywhereEnabled, toggleTapAnywhere } = useTapAnywherePref()
  const { streakDays, isRefreshing, refresh } = useStreak()
  const freeSave = useFreeSaveForm()
  const save = useDhikrLogSave({ selectedDhikr, dhikrDisplayName, openFreeSave: freeSave.open })
  const engine = useCounterEngine({ selectedDhikr, onAutoSave: save.autoSaveSelected, openFreeSave: freeSave.open })
  const editors = useHomeEditors({ selectedDhikr, dhikrDisplayName, freeModeLabel })
  const transition = useDhikrTransition({
    selectedDhikr,
    dhikrDisplayName,
    freeModeLabel,
    save,
    freeSave,
    resetFreeSession: engine.resetFreeSession,
    setDemoCompleted: engine.setDemoCompleted,
    closeDhikrPicker: editors.closeDhikrPicker
  })
  const esma = useDailyEsmaWelcome({
    isHomeBusy:
      transition.hasUnsavedActiveDhikr ||
      editors.isEditingTarget ||
      editors.isSelectingDhikr ||
      editors.isCreatingDhikr ||
      freeSave.isOpen ||
      Boolean(transition.pendingDhikrTransition) ||
      transition.isSelectingEsmaDhikr,
    onStart: transition.onEsmaPress
  })

  // Derived as primitives so the memo below survives taps (which replace `selectedDhikr`).
  const mainDhikrId = selectedDhikr?.id ?? ''
  const mainDhikrSource = selectedDhikr?.source ?? 'personal'
  const mainDhikrName = (selectedDhikr ? dhikrDisplayName(selectedDhikr) : '') || transition.activeFreeModeTitle
  const mainDhikrTransliteration =
    (selectedDhikr ? resolveLocalizedText(selectedDhikr.transliteration, locale) : '') ||
    (selectedDhikr ? '' : transition.activeFreeModeTitle)
  const mainDhikrArabic = selectedDhikr?.arabic
  const mainDhikrMeaning = selectedDhikr?.meaning ? resolveLocalizedText(selectedDhikr.meaning, locale) : undefined
  const mainDhikr = useMemo<HomeDhikr>(
    () => ({
      id: mainDhikrId,
      source: mainDhikrSource,
      displayName: mainDhikrName,
      transliteration: mainDhikrTransliteration,
      arabic: mainDhikrArabic,
      meaning: mainDhikrMeaning
    }),
    [mainDhikrId, mainDhikrSource, mainDhikrName, mainDhikrTransliteration, mainDhikrArabic, mainDhikrMeaning]
  )
  const selectedSourceLabel = selectedDhikr
    ? selectedDhikr.source === 'personal'
      ? t('home:selectedSource.myDhikrs')
      : t('home:selectedSource.ready')
    : t('home:selectedSource.free')
  const greeting = t('home:greeting', { name: authDisplayName?.trim() || t('home:defaultName') })
  const streakLabel = t('home:streakLabel', { count: streakDays })

  const counter = useMemo(
    () => ({
      ...engine.counter,
      // Both modals show the live count, so they follow the per-tap context.
      unsavedTransitionCount: engine.counter.count,
      targetDowngradeCurrentCount: engine.counter.count
    }),
    [engine.counter]
  )

  const ui = useMemo(
    () => ({
      greeting,
      streakLabel,
      streakDays,
      isRefreshing,
      refresh,
      tapAnywhereEnabled,
      toggleTapAnywhere,
      mainDhikr,
      selectedDhikrId,
      selectedSourceLabel,
      ...save.ui,
      ...engine.ui,
      ...editors.ui,
      ...transition.ui,
      ...esma
    }),
    [
      greeting, streakLabel, streakDays, isRefreshing, refresh, tapAnywhereEnabled, toggleTapAnywhere, mainDhikr,
      selectedDhikrId, selectedSourceLabel, save.ui, engine.ui, editors.ui, transition.ui, esma
    ]
  )

  return { counter, ui }
}

export function HomeProvider({ children }: { children: ReactNode }) {
  const { counter, ui } = useHomeValues()
  return (
    <HomeUiContext.Provider value={ui}>
      <HomeCounterContext.Provider value={counter}>{children}</HomeCounterContext.Provider>
    </HomeUiContext.Provider>
  )
}

/** Per-tap state: count, target, progress, lap + the count/reset handlers. */
export function useHomeCounter() {
  const ctx = useContext(HomeCounterContext)
  if (!ctx) {
    throw new Error('useHomeCounter must be used within HomeProvider')
  }
  return ctx
}

/** Everything else on home (modals, drafts, lists, notices); stable across taps. */
export function useHomeUi() {
  const ctx = useContext(HomeUiContext)
  if (!ctx) {
    throw new Error('useHomeUi must be used within HomeProvider')
  }
  return ctx
}
