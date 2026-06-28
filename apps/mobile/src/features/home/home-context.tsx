import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../../store/auth-store'
import { MAX_DHIKR_TARGET, useDhikrStore } from '../../store/dhikr-store'
import { useProfileStore } from '../../store/profile-store'
import { ESMAUL_HUSNA } from '../focus/data'
import type { EsmaulHusnaItem, ZikirSource } from '../focus/types'
import { createDhikrLog } from '../dhikrs/services/dhikr-logs-api-client'
import { getUserStreak } from './services/streaks-api-client'
import { findVerifiedActiveDhikrByTransliteration } from '../dhikrs/services/dhikrs-api-client'
import { createUserDhikr } from '../dhikrs/services/user-dhikrs-api-client'
import {
  buildDailyEsmaWelcomeStorageKey,
  resolveDailyEsmaSuggestions
} from './services/daily-esma-suggestion-service'
import { useHomeNavigationIntentStore } from './services/home-navigation-intent-store'
import { shouldConfirmUnsavedDhikrTransition } from './services/unsaved-transition-guard'

type HomeDhikr = {
  id: string
  source: ZikirSource
  nameTurkish: string
  transliteration?: string
  arabic?: string
  meaning?: string
}

type HomeDhikrOption = {
  id: string
  source: ZikirSource
  label: string
  secondary?: string
  target: number
}

const FREE_MODE_LABEL = 'Serbest'

type PendingDhikrTransition =
  | { kind: 'free' }
  | { kind: 'select'; id: string }
  | { kind: 'quick'; label: string }
  | { kind: 'esma'; item: EsmaulHusnaItem }

type EsmaResumePendingDhikr = {
  _id: string
  nameTurkish: string
  nameArabic: string
  transliteration: string
  meaning: string
  recommendedCount: number
}

type EsmaResumePending = {
  dhikr: EsmaResumePendingDhikr
  currentCount: number
}

type HomeContextValue = {
  greeting: string
  streakLabel: string
  isSavingLog: boolean
  isRefreshing: boolean
  syncError?: string
  isTargetMode: boolean
  count: number
  target: number
  progress: number
  mainDhikr: HomeDhikr
  quickDhikrs: string[]
  activeQuickDhikr: string
  selectedSourceLabel: string
  demoCompleted: boolean
  isEditingTarget: boolean
  targetDraft: string
  isSelectingDhikr: boolean
  readyDhikrs: HomeDhikrOption[]
  personalDhikrs: HomeDhikrOption[]
  selectedDhikrId: string
  isCreatingDhikr: boolean
  createNameDraft: string
  createArabicDraft: string
  createTargetDraft: string
  createError: string | null
  isFreeSaveNameModalOpen: boolean
  isUnsavedTransitionModalOpen: boolean
  unsavedTransitionDhikrName: string
  unsavedTransitionCount: number
  unsavedTransitionError: string | null
  isSelectingEsmaDhikr: boolean
  isDailyEsmaWelcomeOpen: boolean
  dailyEsmaSuggestions: EsmaulHusnaItem[]
  freeSaveNameDraft: string
  freeSaveTransliterationDraft: string
  freeSaveMeaningDraft: string
  freeSaveNameError: string | null
  freeSaveTargetDraft: string
  refresh: () => Promise<void>
  onCountPress: () => void
  onResetPress: () => void
  onTargetPress: () => void
  onTargetDraftChange: (value: string) => void
  onTargetCancel: () => void
  onTargetSubmit: () => void
  isTargetDowngradeWarningOpen: boolean
  targetDowngradePendingTarget: number
  targetDowngradeCurrentCount: number
  onTargetDowngradeConfirm: () => void
  onTargetDowngradeCancel: () => void
  onChangeDhikrPress: () => void
  onCloseDhikrPicker: () => void
  onSelectDhikr: (id: string) => void
  onToggleDemoComplete: () => void
  onQuickDhikrSelect: (label: string) => void
  onSavePress: () => void
  onOpenCreateDhikr: () => void
  onCloseCreateDhikr: () => void
  onCreateNameChange: (value: string) => void
  onCreateArabicChange: (value: string) => void
  onCreateTargetChange: (value: string) => void
  onCreateSubmit: () => void
  onFreeSaveNameChange: (value: string) => void
  onFreeSaveTransliterationChange: (value: string) => void
  onFreeSaveMeaningChange: (value: string) => void
  onFreeSaveNameCancel: () => void
  onFreeSaveNameSubmit: () => void
  onFreeSaveTargetChange: (value: string) => void
  onUnsavedTransitionCancel: () => void
  onUnsavedTransitionSaveAndContinue: () => void
  onUnsavedTransitionContinueWithoutSaving: () => void
  onStartFreeMode: () => void
  onEsmaPress: (item: EsmaulHusnaItem) => void
  isEsmaResumeGuardOpen: boolean
  esmaResumeGuardDhikrName: string
  esmaResumeGuardCurrentCount: number
  onEsmaResumeGuardContinue: () => void
  onEsmaResumeGuardFresh: () => void
  onEsmaResumeGuardCancel: () => void
  onDailyEsmaDismiss: () => void
  onDailyEsmaShowAll: () => void
  onDailyEsmaStart: (item: EsmaulHusnaItem) => void
  tapAnywhereEnabled: boolean
  toggleTapAnywhere: () => void
}

const HomeContext = createContext<HomeContextValue | null>(null)

export function HomeProvider({ children }: { children: ReactNode }) {
  const items = useDhikrStore(state => state.items)
  const selectedDhikrId = useDhikrStore(state => state.selectedDhikrId)
  const selectDhikr = useDhikrStore(state => state.selectDhikr)
  const clearSelectedDhikr = useDhikrStore(state => state.clearSelectedDhikr)
  const incrementSelected = useDhikrStore(state => state.incrementSelected)
  const resetSelected = useDhikrStore(state => state.resetSelected)
  const setSelectedCount = useDhikrStore(state => state.setSelectedCount)
  const setSelectedTarget = useDhikrStore(state => state.setSelectedTarget)
  const freeCount = useDhikrStore(state => state.freeModeCount)
  const freeTarget = useDhikrStore(state => state.freeModeTarget)
  const incrementFreeMode = useDhikrStore(state => state.incrementFreeMode)
  const resetFreeMode = useDhikrStore(state => state.resetFreeMode)
  const clearFreeModeSession = useDhikrStore(state => state.clearFreeModeSession)
  const setFreeModeTarget = useDhikrStore(state => state.setFreeModeTarget)
  const addCustomDhikr = useDhikrStore(state => state.addCustomDhikr)
  const upsertDhikrSnapshot = useDhikrStore(state => state.upsertDhikrSnapshot)
  const applySavedBackendLog = useDhikrStore(state => state.applySavedBackendLog)
  const lastSavedBackendLog = useDhikrStore(state => state.lastSavedBackendLog)
  const syncError = useDhikrStore(state => state.syncError)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const unsavedProgressDhikrIds = useDhikrStore(state => state.unsavedProgressDhikrIds)
  const discardUnsavedProgress = useDhikrStore(state => state.discardUnsavedProgress)
  const activeAiContext = useDhikrStore(state => state.activeAiContext)
  const selectedSource = useDhikrStore(state => state.selectedSource)
  const setSelectedSource = useDhikrStore(state => state.setSelectedSource)
  const authDisplayName = useAuthStore(state => state.session?.displayName)
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)
  const sessionAccessToken = useAuthStore(state => state.session?.accessToken)
  const hapticsEnabled = useProfileStore(state => state.hapticsEnabled)
  const pendingNavigationDailyEsmaStart = useHomeNavigationIntentStore(state => state.pendingDailyEsmaStart)
  const esmaListFocusRequestId = useHomeNavigationIntentStore(state => state.esmaListFocusRequestId)

  const selectedDhikr = useMemo(() => {
    return items.find(item => item.id === selectedDhikrId)
  }, [items, selectedDhikrId])

  const [activeQuickDhikr, setActiveQuickDhikr] = useState(selectedDhikr?.nameTurkish || selectedDhikr?.transliteration || '')
  const [demoCompleted, setDemoCompleted] = useState(false)
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [targetDraft, setTargetDraft] = useState(selectedDhikr ? String(selectedDhikr.target) : '100')
  const [isSelectingDhikr, setIsSelectingDhikr] = useState(false)

  const [isCreatingDhikr, setIsCreatingDhikr] = useState(false)
  const [createNameDraft, setCreateNameDraft] = useState('')
  const [createArabicDraft, setCreateArabicDraft] = useState('')
  const [createTargetDraft, setCreateTargetDraft] = useState('33')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isFreeSaveNameModalOpen, setFreeSaveNameModalOpen] = useState(false)
  const [pendingDhikrTransition, setPendingDhikrTransition] = useState<PendingDhikrTransition | null>(null)
  const [unsavedTransitionError, setUnsavedTransitionError] = useState<string | null>(null)
  const [freeSaveNameDraft, setFreeSaveNameDraft] = useState('')
  const [freeSaveTransliterationDraft, setFreeSaveTransliterationDraft] = useState('')
  const [freeSaveMeaningDraft, setFreeSaveMeaningDraft] = useState('')
  const [freeSaveNameError, setFreeSaveNameError] = useState<string | null>(null)
  const [freeSaveTargetDraft, setFreeSaveTargetDraft] = useState('')
  const [pendingFreeSaveTransition, setPendingFreeSaveTransition] = useState<PendingDhikrTransition | null>(null)
  const [isSelectingEsmaDhikr, setIsSelectingEsmaDhikr] = useState(false)
  const [esmaResumePending, setEsmaResumePending] = useState<EsmaResumePending | null>(null)
  const [dailyEsmaSuggestions, setDailyEsmaSuggestions] = useState<EsmaulHusnaItem[]>([])
  const [isDailyEsmaWelcomeOpen, setDailyEsmaWelcomeOpen] = useState(false)
  const [checkedDailyEsmaWelcomeKey, setCheckedDailyEsmaWelcomeKey] = useState('')
  const [pendingDowngradeTarget, setPendingDowngradeTarget] = useState<number | null>(null)
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [tapAnywhereEnabled, setTapAnywhereEnabled] = useState(false)
  const toggleTapAnywhere = useCallback(() => {
    setTapAnywhereEnabled(prev => {
      const next = !prev
      void AsyncStorage.setItem('tap-anywhere-enabled', next ? '1' : '0')
      return next
    })
  }, [])

  useEffect(() => {
    void AsyncStorage.getItem('tap-anywhere-enabled').then(val => {
      if (val === '1') setTapAnywhereEnabled(true)
    })
  }, [])

  const liveSelectedCountRef = useRef(0)
  const liveFreeCountRef = useRef(0)
  const freeAutoDhikrIdRef = useRef<string | undefined>(undefined)
  const freeAutoDhikrNameRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    liveSelectedCountRef.current = selectedDhikr?.current ?? 0
  }, [selectedDhikr?.current, selectedDhikr?.id])

  useEffect(() => {
    liveFreeCountRef.current = freeCount
  }, [freeCount])

  useEffect(() => {
    if (!freeAutoDhikrIdRef.current) {
      return
    }

    const stillExists = items.some(
      item => item.id === freeAutoDhikrIdRef.current && item.source === 'personal'
    )
    if (stillExists) {
      return
    }

    freeAutoDhikrIdRef.current = undefined
    freeAutoDhikrNameRef.current = undefined
    setActiveQuickDhikr(FREE_MODE_LABEL)
  }, [items])

  const fetchStreakDays = useCallback(async () => {
    if (authStatus !== 'authenticated' || !sessionUserId) {
      setStreakDays(0)
      return
    }

    try {
      const streak = await getUserStreak(sessionUserId, sessionAccessToken)
      setStreakDays(streak.currentStreak)
    } catch {
      // Keep the existing streak value when network is unavailable.
    }
  }, [authStatus, sessionAccessToken, sessionUserId])

  useEffect(() => {
    if (!selectedDhikr) {
      setActiveQuickDhikr(FREE_MODE_LABEL)
      setIsEditingTarget(false)
      return
    }

    setActiveQuickDhikr(selectedDhikr.nameTurkish || selectedDhikr.transliteration)
    setTargetDraft(String(selectedDhikr.target > 0 ? selectedDhikr.target : 100))
  }, [selectedDhikr?.id, selectedDhikr?.nameTurkish, selectedDhikr?.target, selectedDhikr?.transliteration])

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

  const readyDhikrs = useMemo<HomeDhikrOption[]>(
    () =>
      items
        .filter(item => item.source === 'ready')
        .map(item => ({
          id: item.id,
          source: item.source,
          label: item.nameTurkish || item.transliteration,
          secondary: item.arabic,
          target: item.target
        })),
    [items]
  )

  const personalDhikrs = useMemo<HomeDhikrOption[]>(
    () =>
      items
        .filter(item => item.source === 'personal')
        .map(item => ({
          id: item.id,
          source: item.source,
          label: item.nameTurkish || item.transliteration,
          secondary: item.arabic,
          target: item.target
        })),
    [items]
  )

  const quickDhikrs = useMemo(() => {
    const primaryReady = readyDhikrs.slice(0, 4).map(item => item.label)
    const personal = personalDhikrs.map(item => item.label)
    return Array.from(new Set([FREE_MODE_LABEL, ...primaryReady, ...personal]))
  }, [personalDhikrs, readyDhikrs])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchStreakDays()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchStreakDays])

  const hasUnsavedActiveDhikr = selectedDhikrId
    ? unsavedProgressDhikrIds.includes(selectedDhikrId)
    : freeCount > 0
  const shouldDeferDailyEsmaWelcome =
    hasUnsavedActiveDhikr ||
    isEditingTarget ||
    isSelectingDhikr ||
    isCreatingDhikr ||
    isFreeSaveNameModalOpen ||
    Boolean(pendingDhikrTransition) ||
    isSelectingEsmaDhikr ||
    Boolean(pendingNavigationDailyEsmaStart) ||
    esmaListFocusRequestId > 0

  useEffect(() => {
    const today = new Date()
    const storageKey = buildDailyEsmaWelcomeStorageKey(today)

    if (shouldDeferDailyEsmaWelcome) {
      if (pendingNavigationDailyEsmaStart || esmaListFocusRequestId > 0) {
        setCheckedDailyEsmaWelcomeKey(storageKey)
      }
      return
    }

    if (checkedDailyEsmaWelcomeKey === storageKey) {
      return
    }

    let isCancelled = false
    void AsyncStorage.getItem(storageKey)
      .then(value => {
        if (isCancelled) {
          return
        }

        setCheckedDailyEsmaWelcomeKey(storageKey)
        if (value) {
          return
        }

        const suggestions = resolveDailyEsmaSuggestions(ESMAUL_HUSNA, today)
        if (suggestions.length === 0) {
          return
        }

        setDailyEsmaSuggestions(suggestions)
        setDailyEsmaWelcomeOpen(true)
      })
      .catch(() => {
        setCheckedDailyEsmaWelcomeKey(storageKey)
      })

    return () => {
      isCancelled = true
    }
  }, [
    checkedDailyEsmaWelcomeKey,
    esmaListFocusRequestId,
    pendingNavigationDailyEsmaStart,
    shouldDeferDailyEsmaWelcome
  ])

  const markDailyEsmaWelcomeSeen = useCallback(() => {
    const storageKey = buildDailyEsmaWelcomeStorageKey(new Date())
    setCheckedDailyEsmaWelcomeKey(storageKey)
    setDailyEsmaWelcomeOpen(false)
    void AsyncStorage.setItem(storageKey, 'seen').catch(() => {
      // Ignore local marker write errors; the popup remains dismissed for this session.
    })
  }, [])

  const value = useMemo<HomeContextValue>(() => {
    const isTargetMode = selectedDhikr ? selectedDhikr.target > 0 : freeTarget > 0
    const activeFreeModeTitle =
      freeAutoDhikrNameRef.current?.trim() ||
      (freeCount > 0 ? buildNextAutoFreeTitle(items) : '')

    const submitTarget = () => {
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
    }

    const closeCreate = () => {
      setIsCreatingDhikr(false)
      setCreateNameDraft('')
      setCreateArabicDraft('')
      setCreateTargetDraft('33')
      setCreateError(null)
    }

    const closeFreeSaveName = () => {
      setFreeSaveNameModalOpen(false)
      setFreeSaveNameDraft('')
      setFreeSaveTransliterationDraft('')
      setFreeSaveMeaningDraft('')
      setFreeSaveNameError(null)
      setFreeSaveTargetDraft('')
      setPendingFreeSaveTransition(null)
    }

    const saveSelectedDhikrLog = async ({
      countOverride
    }: {
      countOverride?: number
    } = {}) => {
      if (!selectedDhikr) {
        return true
      }

      const rawCount = Math.max(0, Math.floor(countOverride ?? selectedDhikr.current))
      const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, rawCount) : rawCount
      const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target

      if (authStatus !== 'authenticated' || !sessionUserId) {
        const message = 'Kaydetmek için giriş yapmalısın.'
        setSyncError(message)
        setUnsavedTransitionError(message)
        return false
      }

      setIsSavingLog(true)
      setSyncError(undefined)
      setUnsavedTransitionError(null)
      const aiLogContext =
        activeAiContext?.dhikrId === selectedDhikr.id
          ? {
              source: 'ai' as const,
              aiRecommendationId: activeAiContext.recommendationId,
              aiPrompt: activeAiContext.prompt,
              aiAssistantNote: activeAiContext.assistantNote
            }
          : selectedSource === 'special-day'
            ? { source: 'special-day' as const }
            : { source: 'manual' as const }
      const payload = isObjectId(selectedDhikr.id)
        ? {
            userId: sessionUserId,
            dhikrId: selectedDhikr.id,
            count: safeCount,
            targetCount: selectedDhikr.target,
            date: toDateKey(new Date()),
            ...aiLogContext,
            isCompleted,
            isFavorite: selectedDhikr.isFavorite
          }
        : {
            userId: sessionUserId,
            customDhikrId: selectedDhikr.id,
            customDhikrName: selectedDhikr.nameTurkish || selectedDhikr.transliteration,
            customDhikrArabic: selectedDhikr.arabic,
            count: safeCount,
            targetCount: selectedDhikr.target,
            date: toDateKey(new Date()),
            ...aiLogContext,
            isCompleted: false,
            isFavorite: selectedDhikr.isFavorite
          }
      try {
        const savedLog = await createDhikrLog(
          {
            ...payload
          },
          sessionAccessToken
        )
        applySavedBackendLog(savedLog)
        setSelectedSource(undefined)
        return true
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Zikir kaydı kaydedilemedi.'
        setSyncError(message)
        setUnsavedTransitionError(message)
        return false
      } finally {
        setIsSavingLog(false)
      }
    }

    const clearFreeAutoDhikrRefs = () => {
      freeAutoDhikrIdRef.current = undefined
      freeAutoDhikrNameRef.current = undefined
    }

    const applyEsmaFresh = (dhikr: EsmaResumePendingDhikr) => {
      upsertDhikrSnapshot({
        id: dhikr._id,
        source: 'ready',
        nameTurkish: dhikr.nameTurkish,
        arabic: dhikr.nameArabic,
        transliteration: dhikr.transliteration || dhikr.nameTurkish,
        meaning: dhikr.meaning,
        current: 0,
        target: dhikr.recommendedCount,
        lastActivityLabel: 'Henüz başlanmadı',
        streakDays: 0,
        isFavorite: false
      })
      selectDhikr(dhikr._id)
      setActiveQuickDhikr(dhikr.nameTurkish || dhikr.transliteration)
      clearFreeAutoDhikrRefs()
      liveFreeCountRef.current = 0
      clearFreeModeSession()
      setDemoCompleted(false)
      setEsmaResumePending(null)
    }

    const applyEsmaContinue = (dhikr: EsmaResumePendingDhikr) => {
      selectDhikr(dhikr._id)
      setActiveQuickDhikr(dhikr.nameTurkish || dhikr.transliteration)
      clearFreeAutoDhikrRefs()
      liveFreeCountRef.current = 0
      clearFreeModeSession()
      setDemoCompleted(false)
      setEsmaResumePending(null)
    }

    const startEsmaDhikr = (item: EsmaulHusnaItem) => {
      if (isSelectingEsmaDhikr) return
      setIsSelectingEsmaDhikr(true)
      setSyncError(undefined)
      void findVerifiedActiveDhikrByTransliteration(item.transliteration)
        .then(dhikr => {
          if (dhikr._id === selectedDhikrId) {
            applyEsmaContinue(dhikr)
            return
          }

          const storeItem = items.find(i => i.id === dhikr._id)
          const hasProgress = Boolean(storeItem && storeItem.current > 0)

          if (hasProgress) {
            setEsmaResumePending({ dhikr, currentCount: storeItem?.current ?? 0 })
            return
          }

          applyEsmaFresh(dhikr)
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Esma zikri bulunamadı.'
          setSyncError(message)
        })
        .finally(() => {
          setIsSelectingEsmaDhikr(false)
        })
    }

    const runDhikrTransition = (transition: PendingDhikrTransition) => {
      if (transition.kind === 'free') {
        clearSelectedDhikr()
        setActiveQuickDhikr(FREE_MODE_LABEL)
        clearFreeAutoDhikrRefs()
        liveFreeCountRef.current = 0
        clearFreeModeSession()
        setSyncError(undefined)
        return
      }

      if (transition.kind === 'select') {
        selectDhikr(transition.id)
        setIsSelectingDhikr(false)
        return
      }

      if (transition.kind === 'esma') {
        startEsmaDhikr(transition.item)
        return
      }

      if (transition.label === FREE_MODE_LABEL) {
        runDhikrTransition({ kind: 'free' })
        return
      }

      setActiveQuickDhikr(transition.label)
      const matched = items.find(item => item.nameTurkish === transition.label)
      if (matched) {
        selectDhikr(matched.id)
      }
    }

    const requestDhikrTransition = (transition: PendingDhikrTransition, targetDhikrId?: string) => {
      const isLeavingFreeMode =
        transition.kind !== 'free' && !(transition.kind === 'quick' && transition.label === FREE_MODE_LABEL)
      if (
        shouldConfirmUnsavedDhikrTransition({
          selectedDhikrId,
          targetDhikrId,
          unsavedProgressDhikrIds,
          hasUnsavedFreeMode: !selectedDhikrId && freeCount > 0,
          isLeavingFreeMode
        })
      ) {
        setPendingDhikrTransition(transition)
        setUnsavedTransitionError(null)
        return
      }

      runDhikrTransition(transition)
    }

    const closeUnsavedTransition = () => {
      if (isSavingLog) {
        return
      }

      setPendingDhikrTransition(null)
      setUnsavedTransitionError(null)
    }

    const continueUnsavedTransition = () => {
      if (!pendingDhikrTransition || isSavingLog) {
        return
      }

      const transition = pendingDhikrTransition
      if (selectedDhikrId) {
        discardUnsavedProgress(selectedDhikrId)
      } else {
        liveFreeCountRef.current = 0
        clearFreeModeSession()
      }
      setPendingDhikrTransition(null)
      setUnsavedTransitionError(null)
      runDhikrTransition(transition)
    }

    const saveAndContinueUnsavedTransition = () => {
      if (!pendingDhikrTransition || isSavingLog) {
        return
      }

      const transition = pendingDhikrTransition
      if (!selectedDhikr && freeCount > 0) {
        setPendingFreeSaveTransition(transition)
        setPendingDhikrTransition(null)
        setUnsavedTransitionError(null)
        setFreeSaveTargetDraft(freeTarget > 0 ? String(freeTarget) : '')
        setFreeSaveNameModalOpen(true)
        return
      }

      void saveSelectedDhikrLog().then(didSave => {
        if (!didSave) {
          return
        }

        setPendingDhikrTransition(null)
        setUnsavedTransitionError(null)
        runDhikrTransition(transition)
      })
    }

    return {
      greeting: `Selam, ${authDisplayName?.trim() || 'Dostum'}`,
      streakLabel: `${streakDays} gün`,
      isSavingLog,
      isRefreshing,
      syncError,
      isTargetMode,
      count: selectedDhikr?.current ?? freeCount,
      target: selectedDhikr?.target ?? freeTarget,
      progress: selectedDhikr
        ? selectedDhikr.target > 0
          ? selectedDhikr.current / selectedDhikr.target
          : 0
        : freeTarget > 0
          ? freeCount / freeTarget
          : 0,
      mainDhikr: {
        id: selectedDhikr?.id ?? '',
        source: selectedDhikr?.source ?? 'personal',
        nameTurkish: selectedDhikr?.nameTurkish || selectedDhikr?.transliteration || activeFreeModeTitle,
        transliteration: selectedDhikr?.transliteration || (selectedDhikr ? '' : activeFreeModeTitle),
        arabic: selectedDhikr?.arabic,
        meaning: selectedDhikr?.meaning
      },
      quickDhikrs,
      activeQuickDhikr,
      selectedSourceLabel: selectedDhikr
        ? selectedDhikr.source === 'personal'
          ? 'Kaynak: Zikirlerim'
          : 'Kaynak: Hazır'
        : 'Serbest Zikir',
      demoCompleted,
      isEditingTarget,
      targetDraft,
      isSelectingDhikr,
      readyDhikrs,
      personalDhikrs,
      selectedDhikrId: selectedDhikrId,
      isCreatingDhikr,
      createNameDraft,
      createArabicDraft,
      createTargetDraft,
      createError,
      isFreeSaveNameModalOpen,
      isUnsavedTransitionModalOpen: Boolean(pendingDhikrTransition),
      unsavedTransitionDhikrName: selectedDhikr?.nameTurkish || selectedDhikr?.transliteration || activeFreeModeTitle || FREE_MODE_LABEL,
      unsavedTransitionCount: selectedDhikr?.current ?? freeCount,
      unsavedTransitionError,
      isSelectingEsmaDhikr,
      isDailyEsmaWelcomeOpen,
      dailyEsmaSuggestions,
      freeSaveNameDraft,
      freeSaveTransliterationDraft,
      freeSaveMeaningDraft,
      freeSaveNameError,
      freeSaveTargetDraft,
      refresh,
      onCountPress: () => {
        if (demoCompleted) {
          return
        }

        if (!selectedDhikr) {
          const prevCount = liveFreeCountRef.current
          const nextRawCount = prevCount + 1
          const nextCount = freeTarget > 0 ? Math.min(freeTarget, nextRawCount) : nextRawCount
          liveFreeCountRef.current = nextCount
          incrementFreeMode()
          if (hapticsEnabled && nextCount !== prevCount) {
            Vibration.vibrate(25)
          }

          return
        }

        const baseCount = liveSelectedCountRef.current
        const nextRawCount = baseCount + 1
        const nextCount =
          selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, Math.max(0, nextRawCount)) : Math.max(0, nextRawCount)
        liveSelectedCountRef.current = nextCount

        incrementSelected()
        if (hapticsEnabled && nextCount !== baseCount) {
          Vibration.vibrate(25)
        }
      },
      onResetPress: () => {
        if (selectedDhikr) {
          resetSelected()
          liveSelectedCountRef.current = 0
          return
        }

        liveFreeCountRef.current = 0
        resetFreeMode()
      },
      onTargetPress: () => {
        setTargetDraft(String(selectedDhikr?.target && selectedDhikr.target > 0 ? selectedDhikr.target : (freeTarget > 0 ? freeTarget : 100)))
        setIsEditingTarget(true)
      },
      onTargetDraftChange: next => {
        const digits = next.replace(/\D+/g, '')
        const trimmed = digits.slice(0, String(MAX_DHIKR_TARGET).length)
        setTargetDraft(trimmed)
      },
      onTargetCancel: () => {
        setTargetDraft(String(selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.target : (freeTarget > 0 ? freeTarget : 100)))
        setIsEditingTarget(false)
      },
      onTargetSubmit: submitTarget,
      onChangeDhikrPress: () => setIsSelectingDhikr(true),
      onCloseDhikrPicker: () => setIsSelectingDhikr(false),
      onSelectDhikr: id => {
        requestDhikrTransition({ kind: 'select', id }, id)
      },
      onToggleDemoComplete: () => {
        setDemoCompleted(prev => {
          const next = !prev
          setSelectedCount(next ? (selectedDhikr?.target ?? 0) : 0)
          return next
        })
      },
      onQuickDhikrSelect: label => {
        const matched = items.find(item => item.nameTurkish === label)
        requestDhikrTransition({ kind: 'quick', label }, matched?.id)
      },
      onSavePress: () => {
        if (selectedDhikr) {
          void saveSelectedDhikrLog()
          return
        }

        setSyncError(undefined)
        setFreeSaveTargetDraft(freeTarget > 0 ? String(freeTarget) : '')
        setFreeSaveNameModalOpen(true)
      },
      onOpenCreateDhikr: () => {
        setIsCreatingDhikr(true)
        setCreateError(null)
      },
      onCloseCreateDhikr: closeCreate,
      onCreateNameChange: next => {
        setCreateNameDraft(next)
        if (createError) {
          setCreateError(null)
        }
      },
      onCreateArabicChange: setCreateArabicDraft,
      onCreateTargetChange: next => setCreateTargetDraft(next.replace(/\D+/g, '')),
      onCreateSubmit: () => {
        const trimmed = createNameDraft.trim()
        if (!trimmed) {
          setCreateError('Zikir adı zorunlu.')
          return
        }

        const parsedTarget = Number.parseInt(createTargetDraft, 10)
        const createdId = addCustomDhikr({
          name: trimmed,
          arabicOrPronunciation: createArabicDraft,
          target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
        })
        if (authStatus === 'authenticated') {
          void createUserDhikr(
            {
              clientId: createdId,
              name: trimmed,
              transliteration: createArabicDraft.trim() || undefined,
              target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
            },
            sessionAccessToken
          ).catch(() => {
            setSyncError('Zikir kaydı senkronize edilemedi.')
          })
        }
        closeCreate()
        setIsSelectingDhikr(false)
      },
      onFreeSaveNameChange: next => {
        setFreeSaveNameDraft(next)
        if (freeSaveNameError) {
          setFreeSaveNameError(null)
        }
      },
      onFreeSaveTransliterationChange: next => {
        setFreeSaveTransliterationDraft(next)
      },
      onFreeSaveMeaningChange: next => {
        setFreeSaveMeaningDraft(next)
      },
      onFreeSaveTargetChange: next => {
        const digits = next.replace(/\D+/g, '')
        const trimmed = digits.slice(0, String(MAX_DHIKR_TARGET).length)
        setFreeSaveTargetDraft(trimmed)
        if (freeSaveNameError) {
          setFreeSaveNameError(null)
        }
      },
      onFreeSaveNameCancel: closeFreeSaveName,
      onFreeSaveNameSubmit: () => {
        const trimmed = freeSaveNameDraft.trim()
        if (!trimmed) {
          setFreeSaveNameError('Zikir adı zorunlu.')
          return
        }
        const parsedTarget =
          freeSaveTargetDraft.trim().length > 0 ? Number.parseInt(freeSaveTargetDraft, 10) : undefined
        if (parsedTarget !== undefined && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
          setFreeSaveNameError('Hedef girilecekse 1 veya daha büyük olmalı.')
          return
        }
        const countToSave = freeCount
        const targetToSave = parsedTarget ?? 0

        const createdId = addCustomDhikr({
          name: trimmed,
          transliteration: freeSaveTransliterationDraft.trim() || undefined,
          meaning: freeSaveMeaningDraft.trim() || undefined,
          target: targetToSave,
          initialCount: countToSave
        })
        const transitionAfterSave = pendingFreeSaveTransition
        closeFreeSaveName()
        clearFreeModeSession()
        if (transitionAfterSave) {
          runDhikrTransition(transitionAfterSave)
        }
        if (authStatus !== 'authenticated' || !sessionUserId) {
          setSyncError('Kalıcı kaydetmek için giriş yapmalısın.')
          return
        }

        setIsSavingLog(true)
        setSyncError(undefined)
        void createUserDhikr(
          {
            clientId: createdId,
            name: trimmed,
            transliteration: freeSaveTransliterationDraft.trim() || undefined,
            meaning: freeSaveMeaningDraft.trim() || undefined,
            target: targetToSave
          },
          sessionAccessToken
        )
          .then(() =>
            createDhikrLog(
              {
                userId: sessionUserId,
                customDhikrId: createdId,
                customDhikrName: trimmed,
                count: countToSave,
                targetCount: targetToSave,
                date: toDateKey(new Date()),
                source: 'manual',
                isCompleted: false
              },
              sessionAccessToken
            )
          )
          .then(savedLog => {
            applySavedBackendLog(savedLog)
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Zikir kaydı kaydedilemedi.'
            setSyncError(message)
          })
          .finally(() => {
            setIsSavingLog(false)
          })
      },
      onStartFreeMode: () => {
        requestDhikrTransition({ kind: 'free' })
      },
      onEsmaPress: item => {
        requestDhikrTransition({ kind: 'esma', item })
      },
      isEsmaResumeGuardOpen: Boolean(esmaResumePending),
      esmaResumeGuardDhikrName: esmaResumePending?.dhikr.nameTurkish ?? '',
      esmaResumeGuardCurrentCount: esmaResumePending?.currentCount ?? 0,
      onEsmaResumeGuardFresh: () => {
        if (!esmaResumePending) return
        applyEsmaFresh(esmaResumePending.dhikr)
      },
      onEsmaResumeGuardContinue: () => {
        if (!esmaResumePending) return
        applyEsmaContinue(esmaResumePending.dhikr)
      },
      onEsmaResumeGuardCancel: () => setEsmaResumePending(null),
      onDailyEsmaDismiss: markDailyEsmaWelcomeSeen,
      onDailyEsmaShowAll: markDailyEsmaWelcomeSeen,
      onDailyEsmaStart: item => {
        markDailyEsmaWelcomeSeen()
        requestDhikrTransition({ kind: 'esma', item })
      },
      onUnsavedTransitionCancel: closeUnsavedTransition,
      onUnsavedTransitionSaveAndContinue: saveAndContinueUnsavedTransition,
      onUnsavedTransitionContinueWithoutSaving: continueUnsavedTransition,
      isTargetDowngradeWarningOpen: pendingDowngradeTarget !== null,
      targetDowngradePendingTarget: pendingDowngradeTarget ?? 0,
      targetDowngradeCurrentCount: selectedDhikr ? selectedDhikr.current : freeCount,
      onTargetDowngradeConfirm: () => {
        if (pendingDowngradeTarget === null) return
        if (selectedDhikr) {
          setSelectedTarget(pendingDowngradeTarget)
          setTargetDraft(String(pendingDowngradeTarget))
        } else {
          setFreeModeTarget(pendingDowngradeTarget)
          setTargetDraft(String(pendingDowngradeTarget))
        }
        setPendingDowngradeTarget(null)
      },
      onTargetDowngradeCancel: () => {
        setPendingDowngradeTarget(null)
        setTargetDraft(String(
          selectedDhikr
            ? (selectedDhikr.target > 0 ? selectedDhikr.target : 33)
            : (freeTarget > 0 ? freeTarget : 100)
        ))
      },
      tapAnywhereEnabled,
      toggleTapAnywhere
    }
  }, [
    activeQuickDhikr,
    addCustomDhikr,
    applySavedBackendLog,
    clearSelectedDhikr,
    clearFreeModeSession,
    createArabicDraft,
    createError,
    createNameDraft,
    createTargetDraft,
    demoCompleted,
    dailyEsmaSuggestions,
    discardUnsavedProgress,
    freeCount,
    freeTarget,
    freeSaveNameDraft,
    freeSaveTransliterationDraft,
    freeSaveMeaningDraft,
    freeSaveNameError,
    freeSaveTargetDraft,
    isSelectingEsmaDhikr,
    esmaResumePending,
    incrementFreeMode,
    incrementSelected,
    isSavingLog,
    isRefreshing,
    isCreatingDhikr,
    isDailyEsmaWelcomeOpen,
    isEditingTarget,
    isSelectingDhikr,
    isFreeSaveNameModalOpen,
    pendingFreeSaveTransition,
    markDailyEsmaWelcomeSeen,
    pendingDhikrTransition,
    pendingDowngradeTarget,
    upsertDhikrSnapshot,
    items,
    personalDhikrs,
    quickDhikrs,
    readyDhikrs,
    refresh,
    resetFreeMode,
    resetSelected,
    syncError,
    selectDhikr,
    selectedDhikrId,
    selectedDhikr,
    sessionUserId,
    sessionAccessToken,
    setSyncError,
    streakDays,
    authDisplayName,
    authStatus,
    hapticsEnabled,
    setSelectedCount,
    setSelectedTarget,
    setFreeModeTarget,
    targetDraft,
    unsavedProgressDhikrIds,
    unsavedTransitionError,
    tapAnywhereEnabled,
    toggleTapAnywhere
  ])

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>
}

export function useHomeContext() {
  const ctx = useContext(HomeContext)
  if (!ctx) {
    throw new Error('useHomeContext must be used within HomeProvider')
  }
  return ctx
}

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value)
}

function toDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildNextAutoFreeTitle(
  items: Array<{
    source: ZikirSource
    nameTurkish: string
    transliteration?: string
  }>
) {
  let maxIndex = 0

  for (const item of items) {
    if (item.source !== 'personal') {
      continue
    }

    const title = (item.nameTurkish || item.transliteration || '').trim()
    const match = /^Başlık\s+(\d+)$/i.exec(title)
    if (!match) {
      continue
    }

    const parsed = Number.parseInt(match[1] ?? '', 10)
    if (Number.isFinite(parsed) && parsed > maxIndex) {
      maxIndex = parsed
    }
  }

  return `Başlık ${maxIndex + 1}`
}
