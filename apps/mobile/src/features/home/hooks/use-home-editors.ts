import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { useAuthStore } from '../../../store/auth-store'
import { MAX_DHIKR_TARGET, useDhikrStore } from '../../../store/dhikr-store'
import { createUserDhikr } from '../../dhikrs/services/user-dhikrs-api-client'
import type { ZikirItem, ZikirSource } from '../../focus/types'

export type HomeDhikrOption = {
  id: string
  source: ZikirSource
  label: string
  secondary?: string
  target: number
}

type Options = {
  selectedDhikr: ZikirItem | undefined
  dhikrDisplayName: (item: ZikirItem) => string
  freeModeLabel: string
}

const digitsOnly = (value: string) => value.replace(/\D+/g, '')
const clampTargetDigits = (value: string) => digitsOnly(value).slice(0, String(MAX_DHIKR_TARGET).length)

/** Target edit (+ downgrade confirmation), custom dhikr creation and the dhikr picker. */
export function useHomeEditors({ selectedDhikr, dhikrDisplayName, freeModeLabel }: Options) {
  const { t } = useTranslation('home')
  const items = useDhikrStore(state => state.items)
  const freeCount = useDhikrStore(state => state.freeModeCount)
  const freeTarget = useDhikrStore(state => state.freeModeTarget)
  const setSelectedTarget = useDhikrStore(state => state.setSelectedTarget)
  const setFreeModeTarget = useDhikrStore(state => state.setFreeModeTarget)
  const addCustomDhikr = useDhikrStore(state => state.addCustomDhikr)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const authStatus = useAuthStore(state => state.status)

  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [targetDraft, setTargetDraft] = useState(selectedDhikr ? String(selectedDhikr.target) : '100')
  const [pendingDowngradeTarget, setPendingDowngradeTarget] = useState<number | null>(null)
  const [isSelectingDhikr, setIsSelectingDhikr] = useState(false)
  const [isCreatingDhikr, setIsCreatingDhikr] = useState(false)
  const [createNameDraft, setCreateNameDraft] = useState('')
  const [createArabicDraft, setCreateArabicDraft] = useState('')
  const [createTargetDraft, setCreateTargetDraft] = useState('33')
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDhikr) {
      setIsEditingTarget(false)
      return
    }

    setTargetDraft(String(selectedDhikr.target > 0 ? selectedDhikr.target : 100))
  }, [selectedDhikr])

  // Every tap replaces the selected item (current/lastActivity) and so the
  // `items` array; the options only depend on this projection, so key them on
  // it to keep them (and HomeUiContext) stable while counting.
  // ponytail: O(items) stringify per provider render; fine for a few hundred dhikrs.
  const optionsKey = JSON.stringify(
    items.map(item => [item.id, item.source, dhikrDisplayName(item), item.arabic ?? null, item.target])
  )
  const { readyDhikrs, personalDhikrs } = useMemo(() => {
    const options = (JSON.parse(optionsKey) as [string, ZikirSource, string, string | null, number][]).map(
      ([id, source, label, secondary, target]): HomeDhikrOption => ({
        id,
        source,
        label,
        secondary: secondary ?? undefined,
        target
      })
    )
    return {
      readyDhikrs: options.filter(option => option.source === 'ready'),
      personalDhikrs: options.filter(option => option.source === 'personal')
    }
  }, [optionsKey])

  const quickDhikrs = useMemo(() => {
    const primaryReady = readyDhikrs.slice(0, 4).map(item => item.label)
    const personal = personalDhikrs.map(item => item.label)
    return Array.from(new Set([freeModeLabel, ...primaryReady, ...personal]))
  }, [personalDhikrs, readyDhikrs, freeModeLabel])

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

  const onChangeDhikrPress = useCallback(() => setIsSelectingDhikr(true), [])
  const closeDhikrPicker = useCallback(() => setIsSelectingDhikr(false), [])

  const onOpenCreateDhikr = useCallback(() => {
    setIsCreatingDhikr(true)
    setCreateError(null)
  }, [])

  const onCloseCreateDhikr = useCallback(() => {
    setIsCreatingDhikr(false)
    setCreateNameDraft('')
    setCreateArabicDraft('')
    setCreateTargetDraft('33')
    setCreateError(null)
  }, [])

  const onCreateNameChange = useStableCallback((next: string) => {
    setCreateNameDraft(next)
    if (createError) {
      setCreateError(null)
    }
  })

  const onCreateTargetChange = useCallback((next: string) => setCreateTargetDraft(digitsOnly(next)), [])

  const onCreateSubmit = useStableCallback(() => {
    const trimmed = createNameDraft.trim()
    if (!trimmed) {
      setCreateError(t('home:errors.nameRequired'))
      return
    }

    const parsedTarget = Number.parseInt(createTargetDraft, 10)
    const createdId = addCustomDhikr({
      name: trimmed,
      arabicOrPronunciation: createArabicDraft,
      target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
    })
    if (authStatus === 'authenticated') {
      void createUserDhikr({
        clientId: createdId,
        name: trimmed,
        transliteration: createArabicDraft.trim() || undefined,
        target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
      }).catch(() => {
        setSyncError(t('home:errors.dhikrSyncFailed'))
      })
    }
    onCloseCreateDhikr()
    setIsSelectingDhikr(false)
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
      onTargetDowngradeCancel,
      isSelectingDhikr,
      readyDhikrs,
      personalDhikrs,
      quickDhikrs,
      onChangeDhikrPress,
      onCloseDhikrPicker: closeDhikrPicker,
      isCreatingDhikr,
      createNameDraft,
      createArabicDraft,
      createTargetDraft,
      createError,
      onOpenCreateDhikr,
      onCloseCreateDhikr,
      onCreateNameChange,
      onCreateArabicChange: setCreateArabicDraft,
      onCreateTargetChange,
      onCreateSubmit
    }),
    [
      isEditingTarget, targetDraft, onTargetPress, onTargetDraftChange, onTargetCancel, onTargetSubmit,
      pendingDowngradeTarget, onTargetDowngradeConfirm, onTargetDowngradeCancel, isSelectingDhikr, readyDhikrs,
      personalDhikrs, quickDhikrs, onChangeDhikrPress, closeDhikrPicker, isCreatingDhikr, createNameDraft,
      createArabicDraft, createTargetDraft, createError, onOpenCreateDhikr, onCloseCreateDhikr, onCreateNameChange,
      onCreateTargetChange, onCreateSubmit
    ]
  )

  return { ui, isEditingTarget, isSelectingDhikr, isCreatingDhikr, closeDhikrPicker }
}
