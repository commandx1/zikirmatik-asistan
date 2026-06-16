import { useCallback, useState } from 'react'
import { useDhikrStore } from '../store/dhikr-store'

type GuardStartParams = {
  id: string
  dhikrName: string
  onFresh: () => void
  onContinue: () => void
}

type GuardPending = {
  dhikrName: string
  currentCount: number
  onFresh: () => void
  onContinue: () => void
}

const noop = () => {}

export function useDhikrStartGuard() {
  const items = useDhikrStore(state => state.items)
  const selectedDhikrId = useDhikrStore(state => state.selectedDhikrId)
  const [pending, setPending] = useState<GuardPending | null>(null)

  const guardedStart = useCallback(
    (params: GuardStartParams) => {
      const storeItem = items.find(item => item.id === params.id)
      const hasProgress = Boolean(storeItem && storeItem.current > 0)
      const isSelected = Boolean(selectedDhikrId) && selectedDhikrId === params.id

      if (hasProgress || isSelected) {
        setPending({
          dhikrName: params.dhikrName,
          currentCount: storeItem?.current ?? 0,
          onFresh: () => {
            setPending(null)
            params.onFresh()
          },
          onContinue: () => {
            setPending(null)
            params.onContinue()
          }
        })
        return
      }

      params.onFresh()
    },
    [items, selectedDhikrId]
  )

  return {
    guardedStart,
    isGuardOpen: Boolean(pending),
    guardDhikrName: pending?.dhikrName ?? '',
    guardCurrentCount: pending?.currentCount ?? 0,
    onGuardFresh: pending?.onFresh ?? noop,
    onGuardContinue: pending?.onContinue ?? noop,
    onGuardCancel: () => setPending(null)
  }
}
