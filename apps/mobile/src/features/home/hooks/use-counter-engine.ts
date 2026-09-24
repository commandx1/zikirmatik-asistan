import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toDateKey } from '@zikirmatik/shared'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { fireCounterFeedback } from '../../../services/counter-feedback'
import { resolveHapticsPattern } from '../../../services/haptics'
import { useCounterStyleStore } from '../../../store/counter-style-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import { useProfileStore } from '../../../store/profile-store'
import type { ZikirItem } from '../../focus/types'
import { computeCurrentLap, computeLapProgress, lapNumberCompletedAt, resolveLapSize } from '../services/lap-counter'

type Options = {
  selectedDhikr: ZikirItem | undefined
  /** Selected dhikr reached its target: persist silently, resolve whether it saved. */
  onAutoSave: (count: number) => Promise<boolean>
  /** Free mode reached its target: open the naming modal with this target draft. */
  openFreeSave: (targetDraft: string) => void
}

export function useCounterEngine({ selectedDhikr, onAutoSave, openFreeSave }: Options) {
  const freeCount = useDhikrStore(state => state.freeModeCount)
  const freeTarget = useDhikrStore(state => state.freeModeTarget)
  const freeModeLapSize = useDhikrStore(state => state.freeModeLapSize)
  const incrementSelected = useDhikrStore(state => state.incrementSelected)
  const resetSelected = useDhikrStore(state => state.resetSelected)
  const setSelectedCount = useDhikrStore(state => state.setSelectedCount)
  const setSelectedLapSize = useDhikrStore(state => state.setSelectedLapSize)
  const incrementFreeMode = useDhikrStore(state => state.incrementFreeMode)
  const resetFreeMode = useDhikrStore(state => state.resetFreeMode)
  const clearFreeModeSession = useDhikrStore(state => state.clearFreeModeSession)
  const setFreeModeLapSize = useDhikrStore(state => state.setFreeModeLapSize)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const storedHapticsPattern = useProfileStore(state => state.hapticsPattern)
  const storedHapticsEnabled = useProfileStore(state => state.hapticsEnabled)
  const hapticsPattern = resolveHapticsPattern(storedHapticsPattern, storedHapticsEnabled)
  // Tık sesi de haptikler gibi her dokunuşta çalınır; premium olmayan
  // kullanıcı bir ses paketi seçmiş olsa bile (ayar ekranında paywall
  // arkasında kalır) burada sessize düşürülür.
  const isPremium = useProfileStore(state => state.isPremium)
  const soundPack = useCounterStyleStore(state => state.soundPack)
  const effectiveSoundPack = isPremium ? soundPack : 'off'

  const [demoCompleted, setDemoCompleted] = useState(false)
  const [lapCompletedNoticeId, setLapCompletedNoticeId] = useState(0)
  const [lastCompletedLap, setLastCompletedLap] = useState(0)

  // Taps can outrun re-renders; these hold the count the next tap builds on.
  const liveSelectedCountRef = useRef(0)
  const liveFreeCountRef = useRef(0)
  // Guards the auto-save that fires when a target is reached: keyed by
  // dhikr + day + target so resetting and re-reaching the same target on the
  // same day does not overwrite the already stored log a second time. The
  // manual save button is never gated by this.
  const autoSavedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    liveSelectedCountRef.current = selectedDhikr?.current ?? 0
  }, [selectedDhikr?.current, selectedDhikr?.id])

  useEffect(() => {
    liveFreeCountRef.current = freeCount
  }, [freeCount])

  const count = selectedDhikr?.current ?? freeCount
  const target = selectedDhikr?.target ?? freeTarget
  const isTargetMode = target > 0
  const progress = target > 0 ? count / target : 0
  const lapSize = resolveLapSize(selectedDhikr ? selectedDhikr.lapSize : freeModeLapSize)
  const currentLap = computeCurrentLap(count, lapSize)
  const lapProgress = computeLapProgress(count, lapSize)

  const giveFeedback = (prev: number, next: number) => {
    if (fireCounterFeedback({ prev, next, lapSize, pattern: hapticsPattern, soundPack: effectiveSoundPack })) {
      setLastCompletedLap(lapNumberCompletedAt(next, lapSize))
      setLapCompletedNoticeId(prevId => prevId + 1)
    }
  }

  const onCountPress = useStableCallback(() => {
    if (demoCompleted) {
      return
    }

    if (!selectedDhikr) {
      const prevCount = liveFreeCountRef.current
      const nextRawCount = prevCount + 1
      const nextCount = freeTarget > 0 ? Math.min(freeTarget, nextRawCount) : nextRawCount
      liveFreeCountRef.current = nextCount
      incrementFreeMode()
      giveFeedback(prevCount, nextCount)

      // Free mode has no dhikr identity yet, so it cannot be logged
      // silently — reaching the target opens the naming modal instead.
      if (freeTarget > 0 && prevCount < freeTarget && nextCount >= freeTarget) {
        const autoSaveKey = `free:${toDateKey(new Date())}:${freeTarget}`
        if (autoSavedKeyRef.current !== autoSaveKey) {
          autoSavedKeyRef.current = autoSaveKey
          setSyncError(undefined)
          openFreeSave(String(freeTarget))
        }
      }

      return
    }

    const baseCount = liveSelectedCountRef.current
    const nextRawCount = baseCount + 1
    const nextCount =
      selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, Math.max(0, nextRawCount)) : Math.max(0, nextRawCount)
    liveSelectedCountRef.current = nextCount

    incrementSelected()
    giveFeedback(baseCount, nextCount)

    // Reaching the target used to require pressing save for the day to
    // count toward the streak; persist it here so the progress is never
    // silently lost. Bound to the tap path on purpose: an effect would also
    // fire on mount for a persisted at-target dhikr and for the tour's
    // demo toggle, which must not write logs.
    if (selectedDhikr.target > 0 && baseCount < selectedDhikr.target && nextCount >= selectedDhikr.target) {
      const autoSaveKey = `${selectedDhikr.id}:${toDateKey(new Date())}:${selectedDhikr.target}`
      if (autoSavedKeyRef.current !== autoSaveKey) {
        autoSavedKeyRef.current = autoSaveKey
        void onAutoSave(nextCount).then(didSave => {
          if (!didSave) {
            // Allow another attempt once the user resets and re-reaches it.
            autoSavedKeyRef.current = null
          }
        })
      }
    }
  })

  const onResetPress = useStableCallback(() => {
    if (selectedDhikr) {
      resetSelected()
      liveSelectedCountRef.current = 0
      return
    }

    liveFreeCountRef.current = 0
    resetFreeMode()
  })

  const setLapSize = useStableCallback((size: number) => {
    if (selectedDhikr) {
      setSelectedLapSize(size)
      return
    }

    setFreeModeLapSize(size)
  })

  const onToggleDemoComplete = useStableCallback(() => {
    setDemoCompleted(prev => {
      const next = !prev
      setSelectedCount(next ? (selectedDhikr?.target ?? 0) : 0)
      return next
    })
  })

  /** Drops the free-mode session and the live count the next tap builds on. */
  const resetFreeSession = useCallback(() => {
    liveFreeCountRef.current = 0
    clearFreeModeSession()
  }, [clearFreeModeSession])

  const counter = useMemo(
    () => ({ count, target, progress, isTargetMode, lapSize, currentLap, lapProgress, onCountPress, onResetPress }),
    [count, target, progress, isTargetMode, lapSize, currentLap, lapProgress, onCountPress, onResetPress]
  )

  const ui = useMemo(
    () => ({ setLapSize, lapCompletedNoticeId, lastCompletedLap, demoCompleted, onToggleDemoComplete }),
    [setLapSize, lapCompletedNoticeId, lastCompletedLap, demoCompleted, onToggleDemoComplete]
  )

  return { counter, ui, setDemoCompleted, resetFreeSession }
}
