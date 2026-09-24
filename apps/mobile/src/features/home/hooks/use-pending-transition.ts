import { useState } from 'react'
import { useStableCallback } from '../../../hooks/use-stable-callback'

/**
 * Shared "leaving a dhikr with unsaved progress" flow (home + focus screens):
 * `request` either runs the transition or parks it behind the confirm modal,
 * whose three outcomes are cancel / discard-and-run / save-and-run.
 */
export function usePendingTransition<T>({
  run,
  discard,
  save,
  isSaving,
  setError
}: {
  run: (transition: T) => void
  discard: () => void
  save: () => Promise<boolean>
  isSaving: boolean
  setError: (error: string | null) => void
}) {
  const [pending, setPending] = useState<T | null>(null)

  const request = useStableCallback((transition: T, needsConfirm: boolean) => {
    if (needsConfirm) {
      setPending(transition)
      setError(null)
      return
    }

    run(transition)
  })

  const cancel = useStableCallback(() => {
    if (isSaving) {
      return
    }

    setPending(null)
    setError(null)
  })

  const continueWithoutSaving = useStableCallback(() => {
    if (!pending || isSaving) {
      return
    }

    const transition = pending
    discard()
    setPending(null)
    setError(null)
    run(transition)
  })

  const saveAndContinue = useStableCallback(() => {
    if (!pending || isSaving) {
      return
    }

    const transition = pending
    void save().then(didSave => {
      if (!didSave) {
        return
      }

      setPending(null)
      setError(null)
      run(transition)
    })
  })

  return { pending, setPending, request, cancel, continueWithoutSaving, saveAndContinue }
}
