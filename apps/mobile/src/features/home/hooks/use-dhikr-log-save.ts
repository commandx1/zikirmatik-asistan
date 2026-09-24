import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { useAuthStore } from '../../../store/auth-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import { buildDhikrLogPayload, resolveDhikrLogSource } from '../../dhikrs/services/dhikr-log-payload'
import { createDhikrLog } from '../../dhikrs/services/dhikr-logs-api-client'
import type { ZikirItem } from '../../focus/types'

type Options = {
  selectedDhikr: ZikirItem | undefined
  dhikrDisplayName: (item: ZikirItem) => string
  /** Free mode has no dhikr identity yet, so "save" asks for a name instead. */
  openFreeSave: (targetDraft: string) => void
}

export function useDhikrLogSave({ selectedDhikr, dhikrDisplayName, openFreeSave }: Options) {
  const { t } = useTranslation('home')
  const syncError = useDhikrStore(state => state.syncError)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const applySavedBackendLog = useDhikrStore(state => state.applySavedBackendLog)
  const activeAiContext = useDhikrStore(state => state.activeAiContext)
  const selectedSource = useDhikrStore(state => state.selectedSource)
  const setSelectedSource = useDhikrStore(state => state.setSelectedSource)
  const freeTarget = useDhikrStore(state => state.freeModeTarget)
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)
  const [isSavingLog, setIsSavingLog] = useState(false)
  // Mirrors save failures into the unsaved-transition modal (which clears it
  // whenever it opens), so it lives next to the save that sets it.
  const [unsavedTransitionError, setUnsavedTransitionError] = useState<string | null>(null)
  const [autoSaveNoticeId, setAutoSaveNoticeId] = useState(0)

  const saveSelectedProgress = useStableCallback(
    async ({
      countOverride,
      silent = false
    }: {
      countOverride?: number
      // Auto-save (target reached) is not a user-initiated action, so a missing
      // session must not surface an unsolicited error. Network failures are
      // still reported so the user knows to press save manually.
      silent?: boolean
    } = {}) => {
      if (!selectedDhikr) {
        return true
      }

      const rawCount = Math.max(0, Math.floor(countOverride ?? selectedDhikr.current))
      const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, rawCount) : rawCount
      const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target

      if (authStatus !== 'authenticated' || !sessionUserId) {
        if (silent) {
          return false
        }

        const message = t('home:errors.loginRequiredToSave')
        setSyncError(message)
        setUnsavedTransitionError(message)
        return false
      }

      setIsSavingLog(true)
      setSyncError(undefined)
      setUnsavedTransitionError(null)
      const payload = buildDhikrLogPayload(selectedDhikr, {
        userId: sessionUserId,
        displayName: dhikrDisplayName(selectedDhikr),
        count: safeCount,
        isCompleted,
        sourceContext: resolveDhikrLogSource(selectedDhikr.id, activeAiContext, selectedSource)
      })
      try {
        const savedLog = await createDhikrLog(payload)
        applySavedBackendLog(savedLog)
        setSelectedSource(undefined)
        return true
      } catch (error: unknown) {
        console.warn('[dhikr-log] kayıt başarısız', error)
        const message = error instanceof Error ? error.message : t('home:errors.dhikrLogSaveFailed')
        setSyncError(message)
        setUnsavedTransitionError(message)
        return false
      } finally {
        setIsSavingLog(false)
      }
    }
  )

  /** Wired into the counter engine's target-reached trigger. */
  const autoSaveSelected = useStableCallback(async (count: number) => {
    const didSave = await saveSelectedProgress({ countOverride: count, silent: true })
    if (didSave) {
      setAutoSaveNoticeId(prev => prev + 1)
    }
    return didSave
  })

  const onSavePress = useStableCallback(() => {
    if (selectedDhikr) {
      void saveSelectedProgress()
      return
    }

    setSyncError(undefined)
    openFreeSave(freeTarget > 0 ? String(freeTarget) : '')
  })

  const ui = useMemo(
    () => ({ isSavingLog, syncError, autoSaveNoticeId, unsavedTransitionError, onSavePress }),
    [isSavingLog, syncError, autoSaveNoticeId, unsavedTransitionError, onSavePress]
  )

  return {
    ui,
    isSavingLog,
    setIsSavingLog,
    setUnsavedTransitionError,
    saveSelectedProgress,
    autoSaveSelected
  }
}
