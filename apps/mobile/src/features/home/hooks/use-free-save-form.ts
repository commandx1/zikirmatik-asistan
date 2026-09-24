import { useCallback, useMemo, useState } from 'react'
import { useStableCallback } from '../../../hooks/use-stable-callback'
import { MAX_DHIKR_TARGET } from '../../../store/dhikr-store'
import type { PendingDhikrTransition } from './use-dhikr-transition'

/** Free-mode "name it to save" modal state; submit lives in useDhikrTransition. */
export function useFreeSaveForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [transliterationDraft, setTransliterationDraft] = useState('')
  const [meaningDraft, setMeaningDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [targetDraft, setTargetDraft] = useState('')
  const [pendingTransition, setPendingTransition] = useState<PendingDhikrTransition | null>(null)

  const open = useCallback((nextTargetDraft: string) => {
    setTargetDraft(nextTargetDraft)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setNameDraft('')
    setTransliterationDraft('')
    setMeaningDraft('')
    setError(null)
    setTargetDraft('')
    setPendingTransition(null)
  }, [])

  const onNameChange = useStableCallback((next: string) => {
    setNameDraft(next)
    if (error) {
      setError(null)
    }
  })

  const onTargetChange = useStableCallback((next: string) => {
    setTargetDraft(next.replace(/\D+/g, '').slice(0, String(MAX_DHIKR_TARGET).length))
    if (error) {
      setError(null)
    }
  })

  const ui = useMemo(
    () => ({
      isFreeSaveNameModalOpen: isOpen,
      freeSaveNameDraft: nameDraft,
      freeSaveTransliterationDraft: transliterationDraft,
      freeSaveMeaningDraft: meaningDraft,
      freeSaveNameError: error,
      freeSaveTargetDraft: targetDraft,
      onFreeSaveNameChange: onNameChange,
      onFreeSaveTransliterationChange: setTransliterationDraft,
      onFreeSaveMeaningChange: setMeaningDraft,
      onFreeSaveTargetChange: onTargetChange,
      onFreeSaveNameCancel: close
    }),
    [isOpen, nameDraft, transliterationDraft, meaningDraft, error, targetDraft, onNameChange, onTargetChange, close]
  )

  return {
    ui,
    isOpen,
    nameDraft,
    transliterationDraft,
    meaningDraft,
    error,
    setError,
    targetDraft,
    pendingTransition,
    setPendingTransition,
    open,
    close
  }
}
