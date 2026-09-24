import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../../../store/auth-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import { cacheServerStreak } from '../../widget/widget-sync'
import { fetchUserStreak } from '../services/streak-queries'

/** Server streak of the signed-in user: refetched on auth change and after every saved log. */
export function useStreak() {
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)
  const lastSavedBackendLog = useDhikrStore(state => state.lastSavedBackendLog)
  const [streakDays, setStreakDays] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStreakDays = useCallback(async () => {
    if (authStatus !== 'authenticated' || !sessionUserId) {
      setStreakDays(0)
      return
    }

    try {
      const streak = await fetchUserStreak(sessionUserId)
      setStreakDays(streak.currentStreak)
      void cacheServerStreak(streak.currentStreak, streak.lastActiveDate)
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

  return { streakDays, isRefreshing, refresh }
}
