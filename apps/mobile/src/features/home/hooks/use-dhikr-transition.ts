import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toDateKey, type LocalizedText } from '@zikirmatik/shared'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { getAppLocale } from '../../../i18n'
import { useAuthStore } from '../../../store/auth-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import { createDhikrLog } from '../../dhikrs/services/dhikr-logs-api-client'
import { findVerifiedActiveDhikrByTransliteration } from '../../dhikrs/services/dhikrs-api-client'
import { createUserDhikr } from '../../dhikrs/services/user-dhikrs-api-client'
import type { EsmaulHusnaItem, ZikirItem } from '../../focus/types'
import { buildNextAutoFreeTitle } from '../services/free-mode-title'
import { shouldConfirmUnsavedDhikrTransition } from '../services/unsaved-transition-guard'
import type { useFreeSaveForm } from './use-free-save-form'
import { usePendingTransition } from './use-pending-transition'

export type PendingDhikrTransition =
  | { kind: 'free' }
  | { kind: 'select'; id: string }
  | { kind: 'quick'; label: string }
  | { kind: 'esma'; item: EsmaulHusnaItem }

type EsmaResumePendingDhikr = {
  _id: string
  name: LocalizedText
  nameArabic: string
  transliteration: LocalizedText
  meaning: LocalizedText
  recommendedCount: number
}

type DhikrDisplayName = (item: { name: LocalizedText | string; transliteration: LocalizedText | string }) => string

type Options = {
  selectedDhikr: ZikirItem | undefined
  dhikrDisplayName: DhikrDisplayName
  freeModeLabel: string
  save: {
    isSavingLog: boolean
    setIsSavingLog: (value: boolean) => void
    setUnsavedTransitionError: (error: string | null) => void
    saveSelectedProgress: () => Promise<boolean>
  }
  freeSave: ReturnType<typeof useFreeSaveForm>
  resetFreeSession: () => void
}

/** Switching the active dhikr (picker, quick chips, free mode, Esma) behind the unsaved-progress guard. */
export function useDhikrTransition({
  selectedDhikr,
  dhikrDisplayName,
  freeModeLabel,
  save,
  freeSave,
  resetFreeSession
}: Options) {
  const { t } = useTranslation('home')
  const items = useDhikrStore(state => state.items)
  const selectedDhikrId = useDhikrStore(state => state.selectedDhikrId)
  const selectDhikr = useDhikrStore(state => state.selectDhikr)
  const clearSelectedDhikr = useDhikrStore(state => state.clearSelectedDhikr)
  const unsavedProgressDhikrIds = useDhikrStore(state => state.unsavedProgressDhikrIds)
  const discardUnsavedProgress = useDhikrStore(state => state.discardUnsavedProgress)
  const upsertDhikrSnapshot = useDhikrStore(state => state.upsertDhikrSnapshot)
  const clearFreeModeSession = useDhikrStore(state => state.clearFreeModeSession)
  const addCustomDhikr = useDhikrStore(state => state.addCustomDhikr)
  const applySavedBackendLog = useDhikrStore(state => state.applySavedBackendLog)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const freeCount = useDhikrStore(state => state.freeModeCount)
  const freeTarget = useDhikrStore(state => state.freeModeTarget)
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)

  const [activeQuickDhikr, setActiveQuickDhikr] = useState(selectedDhikr ? dhikrDisplayName(selectedDhikr) : '')
  const [isSelectingEsmaDhikr, setIsSelectingEsmaDhikr] = useState(false)
  const [esmaResumePending, setEsmaResumePending] = useState<{
    dhikr: EsmaResumePendingDhikr
    currentCount: number
  } | null>(null)

  useEffect(() => {
    setActiveQuickDhikr(selectedDhikr ? dhikrDisplayName(selectedDhikr) : freeModeLabel)
  }, [selectedDhikr, dhikrDisplayName, freeModeLabel])

  const applyEsma = (dhikr: EsmaResumePendingDhikr, fresh: boolean) => {
    if (fresh) {
      upsertDhikrSnapshot({
        id: dhikr._id,
        source: 'ready',
        name: dhikr.name,
        arabic: dhikr.nameArabic,
        transliteration: dhikr.transliteration,
        meaning: dhikr.meaning,
        current: 0,
        target: dhikr.recommendedCount,
        lastActivityLabel: t('home:lastActivity.notStarted'),
        streakDays: 0,
        isFavorite: false
      })
    }
    selectDhikr(dhikr._id)
    setActiveQuickDhikr(dhikrDisplayName(dhikr))
    resetFreeSession()
    setEsmaResumePending(null)
  }

  const startEsmaDhikr = (item: EsmaulHusnaItem) => {
    if (isSelectingEsmaDhikr) return
    setIsSelectingEsmaDhikr(true)
    setSyncError(undefined)
    void findVerifiedActiveDhikrByTransliteration(item.transliteration)
      .then(dhikr => {
        if (dhikr._id === selectedDhikrId) {
          applyEsma(dhikr, false)
          return
        }

        const storeItem = items.find(i => i.id === dhikr._id)
        const hasProgress = Boolean(storeItem && storeItem.current > 0)

        if (hasProgress) {
          setEsmaResumePending({ dhikr, currentCount: storeItem?.current ?? 0 })
          return
        }

        applyEsma(dhikr, true)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t('home:errors.esmaDhikrNotFound')
        setSyncError(message)
      })
      .finally(() => {
        setIsSelectingEsmaDhikr(false)
      })
  }

  const runFreeTransition = () => {
    clearSelectedDhikr()
    setActiveQuickDhikr(freeModeLabel)
    resetFreeSession()
    setSyncError(undefined)
  }

  const runDhikrTransition = useStableCallback((transition: PendingDhikrTransition) => {
    if (transition.kind === 'free') {
      runFreeTransition()
      return
    }

    if (transition.kind === 'select') {
      selectDhikr(transition.id)
      return
    }

    if (transition.kind === 'esma') {
      startEsmaDhikr(transition.item)
      return
    }

    if (transition.label === freeModeLabel) {
      runFreeTransition()
      return
    }

    setActiveQuickDhikr(transition.label)
    const matched = items.find(item => dhikrDisplayName(item) === transition.label)
    if (matched) {
      selectDhikr(matched.id)
    }
  })

  const guard = usePendingTransition<PendingDhikrTransition>({
    run: runDhikrTransition,
    discard: () => {
      if (selectedDhikrId) {
        discardUnsavedProgress(selectedDhikrId)
      } else {
        resetFreeSession()
      }
    },
    save: () => save.saveSelectedProgress(),
    isSaving: save.isSavingLog,
    setError: save.setUnsavedTransitionError
  })

  const requestDhikrTransition = (transition: PendingDhikrTransition, targetDhikrId?: string) => {
    const isLeavingFreeMode =
      transition.kind !== 'free' && !(transition.kind === 'quick' && transition.label === freeModeLabel)
    guard.request(
      transition,
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId,
        targetDhikrId,
        unsavedProgressDhikrIds,
        hasUnsavedFreeMode: !selectedDhikrId && freeCount > 0,
        isLeavingFreeMode
      })
    )
  }

  const onSelectDhikr = useStableCallback((id: string) => requestDhikrTransition({ kind: 'select', id }, id))
  const onQuickDhikrSelect = useStableCallback((label: string) => {
    const matched = items.find(item => dhikrDisplayName(item) === label)
    requestDhikrTransition({ kind: 'quick', label }, matched?.id)
  })
  const onStartFreeMode = useStableCallback(() => requestDhikrTransition({ kind: 'free' }))
  const onEsmaPress = useStableCallback((item: EsmaulHusnaItem) => requestDhikrTransition({ kind: 'esma', item }))

  const onUnsavedTransitionSaveAndContinue = useStableCallback(() => {
    // Free mode has nothing to log until it is named: hand the pending
    // transition to the naming modal, which runs it after saving.
    if (guard.pending && !save.isSavingLog && !selectedDhikr && freeCount > 0) {
      freeSave.setPendingTransition(guard.pending)
      guard.setPending(null)
      save.setUnsavedTransitionError(null)
      freeSave.open(freeTarget > 0 ? String(freeTarget) : '')
      return
    }

    guard.saveAndContinue()
  })

  const onEsmaResumeGuardFresh = useStableCallback(() => {
    if (!esmaResumePending) return
    applyEsma(esmaResumePending.dhikr, true)
  })
  const onEsmaResumeGuardContinue = useStableCallback(() => {
    if (!esmaResumePending) return
    applyEsma(esmaResumePending.dhikr, false)
  })
  const onEsmaResumeGuardCancel = useCallback(() => setEsmaResumePending(null), [])

  const onFreeSaveNameSubmit = useStableCallback(() => {
    const trimmed = freeSave.nameDraft.trim()
    if (!trimmed) {
      freeSave.setError(t('home:errors.nameRequired'))
      return
    }
    const parsedTarget =
      freeSave.targetDraft.trim().length > 0 ? Number.parseInt(freeSave.targetDraft, 10) : undefined
    if (parsedTarget !== undefined && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      freeSave.setError(t('home:errors.targetInvalid'))
      return
    }
    const countToSave = freeCount
    const targetToSave = parsedTarget ?? 0
    const transliteration = freeSave.transliterationDraft.trim() || undefined
    const meaning = freeSave.meaningDraft.trim() || undefined

    const createdId = addCustomDhikr({
      name: trimmed,
      transliteration,
      meaning,
      target: targetToSave,
      initialCount: countToSave
    })
    const transitionAfterSave = freeSave.pendingTransition
    freeSave.close()
    clearFreeModeSession()
    if (transitionAfterSave) {
      runDhikrTransition(transitionAfterSave)
    }
    if (authStatus !== 'authenticated' || !sessionUserId) {
      setSyncError(t('home:errors.loginRequiredToSavePermanently'))
      return
    }

    save.setIsSavingLog(true)
    setSyncError(undefined)
    void createUserDhikr({ clientId: createdId, name: trimmed, transliteration, meaning, target: targetToSave })
      .then(() =>
        createDhikrLog({
          userId: sessionUserId,
          customDhikrId: createdId,
          customDhikrName: trimmed,
          count: countToSave,
          targetCount: targetToSave,
          date: toDateKey(new Date()),
          source: 'manual',
          isCompleted: targetToSave > 0 && countToSave >= targetToSave
        })
      )
      .then(savedLog => {
        applySavedBackendLog(savedLog)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t('home:errors.dhikrLogSaveFailed')
        setSyncError(message)
      })
      .finally(() => {
        save.setIsSavingLog(false)
      })
  })

  const activeFreeModeTitle =
    freeCount > 0 ? buildNextAutoFreeTitle(items, t('home:selectedDhikrMeaning.titleLabel'), getAppLocale()) : ''
  const unsavedTransitionDhikrName =
    (selectedDhikr ? dhikrDisplayName(selectedDhikr) : '') || activeFreeModeTitle || freeModeLabel
  const esmaResumeGuardDhikrName = esmaResumePending ? dhikrDisplayName(esmaResumePending.dhikr) : ''

  const ui = useMemo(
    () => ({
      activeQuickDhikr,
      onSelectDhikr,
      onQuickDhikrSelect,
      onStartFreeMode,
      onEsmaPress,
      isSelectingEsmaDhikr,
      isUnsavedTransitionModalOpen: Boolean(guard.pending),
      unsavedTransitionDhikrName,
      onUnsavedTransitionCancel: guard.cancel,
      onUnsavedTransitionSaveAndContinue,
      onUnsavedTransitionContinueWithoutSaving: guard.continueWithoutSaving,
      isEsmaResumeGuardOpen: Boolean(esmaResumePending),
      esmaResumeGuardDhikrName,
      esmaResumeGuardCurrentCount: esmaResumePending?.currentCount ?? 0,
      onEsmaResumeGuardContinue,
      onEsmaResumeGuardFresh,
      onEsmaResumeGuardCancel,
      ...freeSave.ui,
      onFreeSaveNameSubmit
    }),
    [
      activeQuickDhikr, onSelectDhikr, onQuickDhikrSelect, onStartFreeMode, onEsmaPress, isSelectingEsmaDhikr,
      guard.pending, unsavedTransitionDhikrName, guard.cancel, onUnsavedTransitionSaveAndContinue,
      guard.continueWithoutSaving, esmaResumePending, esmaResumeGuardDhikrName, onEsmaResumeGuardContinue,
      onEsmaResumeGuardFresh, onEsmaResumeGuardCancel, freeSave.ui, onFreeSaveNameSubmit
    ]
  )

  return {
    ui,
    pendingDhikrTransition: guard.pending,
    isSelectingEsmaDhikr,
    hasUnsavedActiveDhikr: selectedDhikrId ? unsavedProgressDhikrIds.includes(selectedDhikrId) : freeCount > 0,
    activeFreeModeTitle,
    onEsmaPress
  }
}
