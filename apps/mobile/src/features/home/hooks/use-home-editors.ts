import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { MAX_DHIKR_TARGET, useDhikrStore } from '../../../store/dhikr-store'
import type { ZikirItem } from '../../focus/types'

type Options = {
  selectedDhikr: ZikirItem | undefined
}

const digitsOnly = (value: string) => value.replace(/\D+/g, '')
const clampTargetDigits = (value: string) => digitsOnly(value).slice(0, String(MAX_DHIKR_TARGET).length)

/** Target edit (+ downgrade confirmation). */
export function useHomeEditors({ selectedDhikr }: Options) {
  const freeCount = useDhikrStore(state => state.freeModeCount)
  const freeTarget = useDhikrStore(state => state.freeModeTarget)
  const setSelectedTarget = useDhikrStore(state => state.setSelectedTarget)
  const setFreeModeTarget = useDhikrStore(state => state.setFreeModeTarget)

  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [targetDraft, setTargetDraft] = useState(selectedDhikr ? String(selectedDhikr.target) : '100')
  const [pendingDowngradeTarget, setPendingDowngradeTarget] = useState<number | null>(null)

  useEffect(() => {
    if (!selectedDhikr) {
      setIsEditingTarget(false)
      return
    }

    setTargetDraft(String(selectedDhikr.target > 0 ? selectedDhikr.target : 100))
  }, [selectedDhikr])

  const onTargetPress = useStableCallback(() => {
    setTargetDraft(String(selectedDhikr?.target && selectedDhikr.target > 0 ? selectedDhikr.target : (freeTarget > 0 ? freeTarget : 100)))
    setIsEditingTarget(true)
  })

  const onTargetDraftChange = useCallback((next: string) => setTargetDraft(clampTargetDigits(next)), [])

  const onTargetCancel = useStableCallback(() => {
    setTargetDraft(String(selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.target : (freeTarget > 0 ? freeTarget : 100)))
    setIsEditingTarget(false)
  })

  const onTargetSubmit = useStableCallback(() => {
    const parsed = Number.parseInt(targetDraft, 10)
    const nextTarget = !Number.isNaN(parsed) && parsed > 0 ? Math.min(parsed, MAX_DHIKR_TARGET) : 0

    if (selectedDhikr) {
      if (nextTarget > 0 && nextTarget < selectedDhikr.current) {
        setPendingDowngradeTarget(nextTarget)
        setIsEditingTarget(false)
        return
      }
      if (nextTarget > 0) {
        setSelectedTarget(nextTarget)
      }
      setTargetDraft(String(nextTarget > 0 ? nextTarget : (selectedDhikr?.target ?? 33)))
      setIsEditingTarget(false)
      return
    }

    if (nextTarget > 0 && nextTarget < freeCount) {
      setPendingDowngradeTarget(nextTarget)
      setIsEditingTarget(false)
      return
    }
    setFreeModeTarget(nextTarget)
    setTargetDraft(String(nextTarget > 0 ? nextTarget : 100))
    setIsEditingTarget(false)
  })

  const onTargetDowngradeConfirm = useStableCallback(() => {
    if (pendingDowngradeTarget === null) return
    if (selectedDhikr) {
      setSelectedTarget(pendingDowngradeTarget)
    } else {
      setFreeModeTarget(pendingDowngradeTarget)
    }
    setTargetDraft(String(pendingDowngradeTarget))
    setPendingDowngradeTarget(null)
  })

  const onTargetDowngradeCancel = useStableCallback(() => {
    setPendingDowngradeTarget(null)
    setTargetDraft(String(
      selectedDhikr
        ? (selectedDhikr.target > 0 ? selectedDhikr.target : 33)
        : (freeTarget > 0 ? freeTarget : 100)
    ))
  })

  const ui = useMemo(
    () => ({
      isEditingTarget,
      targetDraft,
      onTargetPress,
      onTargetDraftChange,
      onTargetCancel,
      onTargetSubmit,
      isTargetDowngradeWarningOpen: pendingDowngradeTarget !== null,
      targetDowngradePendingTarget: pendingDowngradeTarget ?? 0,
      onTargetDowngradeConfirm,
      onTargetDowngradeCancel
    }),
    [
      isEditingTarget, targetDraft, onTargetPress, onTargetDraftChange, onTargetCancel, onTargetSubmit,
      pendingDowngradeTarget, onTargetDowngradeConfirm, onTargetDowngradeCancel
    ]
  )

  return { ui, isEditingTarget }
}
