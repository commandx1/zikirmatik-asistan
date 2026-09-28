import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../../../store/auth-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import type { BackendStreak } from '../../home/services/streaks-api-client'
import { cacheServerStreak } from '../../widget/widget-sync'
import { fetchUserStreak } from '../services/streak-queries'

/** Server streak of the signed-in user: refetched on auth change and after every saved log. */
export function useStreak() {
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)
  const lastSavedBackendLog = useDhikrStore(state => state.lastSavedBackendLog)
  const [streak, setStreak] = useState<{ forUserId: string; value: BackendStreak } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStreakDays = useCallback(async () => {
    if (authStatus !== 'authenticated' || !sessionUserId) {
      setStreak(null)
      return
    }

    try {
      const fetched = await fetchUserStreak(sessionUserId)
      setStreak({ forUserId: sessionUserId, value: fetched })
      void cacheServerStreak(fetched.currentStreak, fetched.lastActiveDate)
    } catch {
      // Keep the existing streak value when network is unavailable.
    }
  }, [authStatus, sessionUserId])

  useEffect(() => {
    void fetchStreakDays()
  }, [fetchStreakDays])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !sessionUserId || !lastSavedBackendLog) {
      return
    }

    if (lastSavedBackendLog.userId !== sessionUserId) {
      return
    }

    void fetchStreakDays()
  }, [authStatus, fetchStreakDays, lastSavedBackendLog, sessionUserId])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchStreakDays()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchStreakDays])

  // null until fetched for THIS user — never a previous account's streak
  // (account switch) and never a "0" that only means "not loaded yet".
  const serverStreak = authStatus === 'authenticated' && streak && streak.forUserId === sessionUserId ? streak.value : null

  return { streakDays: serverStreak?.currentStreak ?? 0, serverStreak, isRefreshing, refresh }
}
