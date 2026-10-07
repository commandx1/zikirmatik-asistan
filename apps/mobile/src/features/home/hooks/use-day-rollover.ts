import { useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { useAuthStore } from '../../../store/auth-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import { buildDhikrLogPayload } from '../../dhikrs/services/dhikr-log-payload'
import { createDhikrLog } from '../../dhikrs/services/dhikr-logs-api-client'
import type { ZikirItem } from '../../focus/types'
import { decideDayRollover } from '../services/day-rollover'

type Pending = { item: ZikirItem; name: string; count: number; dateKey: string }

/**
 * M-01: on a new (device-local) day the selected dhikr starts from 0. A member's
 * unsaved count from an earlier day is asked about once: save it under the day
 * it was counted, or drop it. The decision itself lives in services/day-rollover.
 */
export function useDayRollover({
  selectedDhikr,
  dhikrDisplayName
}: {
  selectedDhikr: ZikirItem | undefined
  dhikrDisplayName: (item: ZikirItem) => string
}) {
  const { t } = useTranslation('home')
  const startNewDay = useDhikrStore(state => state.startNewDay)
  const applySavedBackendLog = useDhikrStore(state => state.applySavedBackendLog)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const unsavedIds = useDhikrStore(state => state.unsavedProgressDhikrIds)
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)
  const isMember = authStatus === 'authenticated' && Boolean(sessionUserId)
  const [pending, setPending] = useState<Pending | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Bumped when the app returns to the foreground so a midnight crossed in the background is noticed.
  const [dayTick, setDayTick] = useState(0)

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setDayTick(tick => tick + 1)
    })
    return () => sub.remove()
  }, [])

  const id = selectedDhikr?.id
  const current = selectedDhikr?.current ?? 0
  const lastActivityAt = selectedDhikr?.lastActivityAt
  const isUnsaved = id ? unsavedIds.includes(id) : false

  useEffect(() => {
    if (!selectedDhikr || pending) return
    const decision = decideDayRollover({ current, lastActivityAt, isUnsaved, isMember }, new Date())
    if (decision.kind === 'reset') {
      startNewDay(selectedDhikr.id)
    } else if (decision.kind === 'ask') {
      setPending({
        item: selectedDhikr,
        name: dhikrDisplayName(selectedDhikr),
        count: decision.count,
        dateKey: decision.dateKey
      })
    }
    // selectedDhikr is an object that changes on every tap; only the primitives below drive the decision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, current, lastActivityAt, isUnsaved, isMember, dayTick, pending, startNewDay])

  const onSave = useStableCallback(async () => {
    if (!pending || isSaving || !sessionUserId) return
    const { item, count, dateKey, name } = pending
    const safeCount = item.target > 0 ? Math.min(item.target, count) : count
    setIsSaving(true)
    try {
      const saved = await createDhikrLog(
        buildDhikrLogPayload(item, {
          userId: sessionUserId,
          displayName: name,
          count: safeCount,
          isCompleted: item.target > 0 && safeCount >= item.target,
          date: dateKey
        })
      )
      applySavedBackendLog(saved)
      startNewDay(item.id)
      setPending(null)
    } catch (error: unknown) {
      // The question stays open so nothing is lost; the error shows as a toast.
      setSyncError(error instanceof Error ? error.message : t('home:errors.dhikrLogSaveFailed'))
    } finally {
      setIsSaving(false)
    }
  })

  const onDiscard = useStableCallback(() => {
    if (!pending || isSaving) return
    startNewDay(pending.item.id)
    setPending(null)
  })

  return useMemo(
    () => ({
      isDayRolloverOpen: Boolean(pending),
      dayRolloverDhikrName: pending?.name ?? '',
      dayRolloverCount: pending?.count ?? 0,
      isDayRolloverSaving: isSaving,
      onDayRolloverSave: onSave,
      onDayRolloverDiscard: onDiscard
    }),
    [pending, isSaving, onSave, onDiscard]
  )
}
