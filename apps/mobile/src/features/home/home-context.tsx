import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Vibration } from 'react-native'
import { useAuthStore } from '../../store/auth-store'
import { MAX_DHIKR_TARGET, useDhikrStore } from '../../store/dhikr-store'
import { useProfileStore } from '../../store/profile-store'
import type { EsmaulHusnaItem, ZikirSource } from '../focus/types'
import { createDhikrLog, listDhikrLogsByUser, type BackendDhikrLog } from '../dhikrs/services/dhikr-logs-api-client'
import { findVerifiedActiveDhikrByTransliteration } from '../dhikrs/services/dhikrs-api-client'
import { createUserDhikr, updateUserDhikrByClientId } from '../dhikrs/services/user-dhikrs-api-client'

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
  isEsmaSelectionModalOpen: boolean
  isSelectingEsmaDhikr: boolean
  selectedEsmaForConfirmation?: EsmaulHusnaItem
  esmaSelectionError: string | null
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
  onStartFreeMode: () => void
  onEsmaPress: (item: EsmaulHusnaItem) => void
  onEsmaSelectCancel: () => void
  onEsmaSelectConfirm: () => void
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
  const addCustomDhikr = useDhikrStore(state => state.addCustomDhikr)
  const upsertPersonalDhikr = useDhikrStore(state => state.upsertPersonalDhikr)
  const upsertDhikrSnapshot = useDhikrStore(state => state.upsertDhikrSnapshot)
  const applySavedBackendLog = useDhikrStore(state => state.applySavedBackendLog)
  const lastSavedBackendLog = useDhikrStore(state => state.lastSavedBackendLog)
  const syncError = useDhikrStore(state => state.syncError)
  const setSyncError = useDhikrStore(state => state.setSyncError)
  const authDisplayName = useAuthStore(state => state.session?.displayName)
  const authStatus = useAuthStore(state => state.status)
  const sessionUserId = useAuthStore(state => state.session?.userId)
  const sessionAccessToken = useAuthStore(state => state.session?.accessToken)
  const hapticsEnabled = useProfileStore(state => state.hapticsEnabled)

  const selectedDhikr = useMemo(() => {
    return items.find(item => item.id === selectedDhikrId)
  }, [items, selectedDhikrId])

  const [activeQuickDhikr, setActiveQuickDhikr] = useState(selectedDhikr?.nameTurkish || selectedDhikr?.transliteration || '')
  const [demoCompleted, setDemoCompleted] = useState(false)
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [targetDraft, setTargetDraft] = useState(selectedDhikr ? String(selectedDhikr.target) : '100')
  const [isSelectingDhikr, setIsSelectingDhikr] = useState(false)
  const [freeCount, setFreeCount] = useState(0)

  const [isCreatingDhikr, setIsCreatingDhikr] = useState(false)
  const [createNameDraft, setCreateNameDraft] = useState('')
  const [createArabicDraft, setCreateArabicDraft] = useState('')
  const [createTargetDraft, setCreateTargetDraft] = useState('33')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isFreeSaveNameModalOpen, setFreeSaveNameModalOpen] = useState(false)
  const [freeSaveNameDraft, setFreeSaveNameDraft] = useState('')
  const [freeSaveTransliterationDraft, setFreeSaveTransliterationDraft] = useState('')
  const [freeSaveMeaningDraft, setFreeSaveMeaningDraft] = useState('')
  const [freeSaveNameError, setFreeSaveNameError] = useState<string | null>(null)
  const [freeSaveTargetDraft, setFreeSaveTargetDraft] = useState('')
  const [selectedEsmaForConfirmation, setSelectedEsmaForConfirmation] = useState<EsmaulHusnaItem | undefined>(undefined)
  const [isSelectingEsmaDhikr, setIsSelectingEsmaDhikr] = useState(false)
  const [esmaSelectionError, setEsmaSelectionError] = useState<string | null>(null)
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
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
    liveFreeCountRef.current = 0
    setFreeCount(0)
    setActiveQuickDhikr(FREE_MODE_LABEL)
  }, [items])

  const fetchStreakDays = useCallback(async () => {
    if (authStatus !== 'authenticated' || !sessionUserId) {
      setStreakDays(0)
      return
    }

    try {
      const logs = await listDhikrLogsByUser(sessionUserId, undefined, undefined, sessionAccessToken)
      setStreakDays(calculateCompletionStreakDays(logs))
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

  const value = useMemo<HomeContextValue>(() => {
    const isTargetMode = Boolean(selectedDhikr && selectedDhikr.target > 0)
    const activeFreeModeTitle =
      freeAutoDhikrNameRef.current?.trim() ||
      (freeCount > 0 ? buildNextAutoFreeTitle(items) : '')

    const submitTarget = () => {
      const parsed = Number.parseInt(targetDraft, 10)
      const nextTarget = !Number.isNaN(parsed) && parsed > 0 ? Math.min(parsed, MAX_DHIKR_TARGET) : 0

      if (selectedDhikr) {
        if (nextTarget > 0) {
          setSelectedTarget(nextTarget)
        }
        setTargetDraft(String(nextTarget > 0 ? nextTarget : (selectedDhikr?.target ?? 33)))
        setIsEditingTarget(false)
        return
      }

      if (nextTarget <= 0) {
        setTargetDraft('100')
        setIsEditingTarget(false)
        return
      }

      const existingFreeItem = freeAutoDhikrIdRef.current
        ? items.find(item => item.id === freeAutoDhikrIdRef.current && item.source === 'personal')
        : undefined
      const nextName =
        existingFreeItem?.nameTurkish?.trim() || freeAutoDhikrNameRef.current?.trim() || buildNextAutoFreeTitle(items)
      const nextTransliteration = existingFreeItem?.transliteration?.trim() || nextName
      const nextCurrent = Math.max(
        0,
        Math.floor(typeof existingFreeItem?.current === 'number' ? existingFreeItem.current : liveFreeCountRef.current)
      )
      const fallbackId =
        existingFreeItem?.id ||
        freeAutoDhikrIdRef.current ||
        `free-auto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

      const upsertAndSelect = (id: string, nameTurkish: string, transliteration: string, isFavorite: boolean) => {
        upsertPersonalDhikr({
          id,
          nameTurkish,
          transliteration,
          current: nextCurrent,
          target: nextTarget,
          isFavorite
        })
        freeAutoDhikrIdRef.current = id
        freeAutoDhikrNameRef.current = nameTurkish
        selectDhikr(id)
        setActiveQuickDhikr(nameTurkish)
        liveFreeCountRef.current = 0
        setFreeCount(0)
      }

      if (authStatus === 'authenticated') {
        if (existingFreeItem) {
          upsertAndSelect(
            existingFreeItem.id,
            existingFreeItem.nameTurkish || nextName,
            existingFreeItem.transliteration || nextTransliteration,
            existingFreeItem.isFavorite
          )
          void updateUserDhikrByClientId(
            existingFreeItem.id,
            {
              name: existingFreeItem.nameTurkish || nextName,
              transliteration: existingFreeItem.transliteration || nextTransliteration,
              target: nextTarget
            },
            sessionAccessToken
          ).catch(() => {
            setSyncError('Hedef güncellemesi senkronize edilemedi.')
          })
        } else {
          void createUserDhikr(
            {
              clientId: fallbackId,
              name: nextName,
              transliteration: nextTransliteration,
              target: nextTarget
            },
            sessionAccessToken
          )
            .then(created => {
              const createdId = created.clientId?.trim() || fallbackId
              const createdName = created.name?.trim() || nextName
              const createdTransliteration = created.transliteration?.trim() || nextTransliteration
              upsertAndSelect(createdId, createdName, createdTransliteration, Boolean(created.isFavorite))
            })
            .catch(() => {
              upsertAndSelect(fallbackId, nextName, nextTransliteration, false)
              setSyncError('Hedef güncellemesi senkronize edilemedi.')
            })
        }
      } else {
        upsertAndSelect(fallbackId, nextName, nextTransliteration, false)
      }

      setTargetDraft(String(nextTarget))
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
    }

    const persistSelectedDhikrLog = ({
      countOverride
    }: {
      countOverride?: number
    } = {}) => {
      if (!selectedDhikr) {
        return
      }

      const rawCount = Math.max(0, Math.floor(countOverride ?? selectedDhikr.current))
      const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, rawCount) : rawCount
      const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target

      if (authStatus !== 'authenticated' || !sessionUserId) {
        setSyncError('Kaydetmek için giriş yapmalısın.')
        return
      }

      setIsSavingLog(true)
      setSyncError(undefined)
      const payload = isObjectId(selectedDhikr.id)
        ? {
            userId: sessionUserId,
            dhikrId: selectedDhikr.id,
            count: safeCount,
            targetCount: selectedDhikr.target,
            date: toDateKey(new Date()),
            source: 'manual' as const,
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
            source: 'manual' as const,
            isCompleted: false,
            isFavorite: selectedDhikr.isFavorite
          }
      void createDhikrLog(
        {
          ...payload
        },
        sessionAccessToken
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
    }

    const clearFreeAutoDhikrRefs = () => {
      freeAutoDhikrIdRef.current = undefined
      freeAutoDhikrNameRef.current = undefined
    }

    const ensureFreeAutoDhikr = async () => {
      if (freeAutoDhikrIdRef.current && freeAutoDhikrNameRef.current) {
        const stillExists = items.some(
          item => item.id === freeAutoDhikrIdRef.current && item.source === 'personal'
        )
        if (!stillExists) {
          freeAutoDhikrIdRef.current = undefined
          freeAutoDhikrNameRef.current = undefined
        } else {
        return {
          id: freeAutoDhikrIdRef.current,
          name: freeAutoDhikrNameRef.current
        }
        }
      }

      const fallbackName = buildNextAutoFreeTitle(items)
      const fallbackId = `free-auto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

      if (authStatus !== 'authenticated') {
        freeAutoDhikrIdRef.current = fallbackId
        freeAutoDhikrNameRef.current = fallbackName
        upsertPersonalDhikr({
          id: fallbackId,
          nameTurkish: fallbackName,
          transliteration: fallbackName,
          current: liveFreeCountRef.current,
          target: 0,
          isFavorite: false
        })
        return { id: fallbackId, name: fallbackName }
      }

      try {
        const created = await createUserDhikr({ target: 0 }, sessionAccessToken)
        const nextId = created.clientId?.trim() || fallbackId
        const nextName = created.name?.trim() || created.transliteration?.trim() || fallbackName
        freeAutoDhikrIdRef.current = nextId
        freeAutoDhikrNameRef.current = nextName
        upsertPersonalDhikr({
          id: nextId,
          nameTurkish: nextName,
          transliteration: nextName,
          current: liveFreeCountRef.current,
          target: 0,
          isFavorite: Boolean(created.isFavorite)
        })
        return { id: nextId, name: nextName }
      } catch {
        freeAutoDhikrIdRef.current = fallbackId
        freeAutoDhikrNameRef.current = fallbackName
        upsertPersonalDhikr({
          id: fallbackId,
          nameTurkish: fallbackName,
          transliteration: fallbackName,
          current: liveFreeCountRef.current,
          target: 0,
          isFavorite: false
        })
        return { id: fallbackId, name: fallbackName }
      }
    }

    const persistFreeModeAutoLog = async (count: number) => {
      if (authStatus !== 'authenticated' || !sessionUserId) {
        return
      }

      const freeAuto = await ensureFreeAutoDhikr()

      setIsSavingLog(true)
      setSyncError(undefined)
      return createDhikrLog(
        {
          userId: sessionUserId,
          customDhikrId: freeAuto.id,
          customDhikrName: freeAuto.name,
          count,
          targetCount: 0,
          date: toDateKey(new Date()),
          source: 'manual',
          isCompleted: false
        },
        sessionAccessToken
      )
        .then(savedLog => {
          applySavedBackendLog(savedLog)
          upsertPersonalDhikr({
            id: freeAuto.id,
            nameTurkish: freeAuto.name,
            transliteration: freeAuto.name,
            current: count,
            target: 0,
            isFavorite: false
          })
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Zikir kaydı kaydedilemedi.'
          setSyncError(message)
        })
        .finally(() => {
          setIsSavingLog(false)
        })
    }

    const closeEsmaSelection = () => {
      if (isSelectingEsmaDhikr) {
        return
      }

      setSelectedEsmaForConfirmation(undefined)
      setEsmaSelectionError(null)
    }

    const confirmEsmaSelection = () => {
      if (!selectedEsmaForConfirmation || isSelectingEsmaDhikr) {
        return
      }

      setIsSelectingEsmaDhikr(true)
      setEsmaSelectionError(null)
      setSyncError(undefined)

      void findVerifiedActiveDhikrByTransliteration(selectedEsmaForConfirmation.transliteration)
        .then(dhikr => {
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
          setFreeCount(0)
          setDemoCompleted(false)
          setSelectedEsmaForConfirmation(undefined)
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Esma zikri bulunamadı.'
          setEsmaSelectionError(message)
          setSyncError(message)
        })
        .finally(() => {
          setIsSelectingEsmaDhikr(false)
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
      target: selectedDhikr?.target ?? 0,
      progress: selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.current / selectedDhikr.target : 0,
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
      isEsmaSelectionModalOpen: Boolean(selectedEsmaForConfirmation),
      isSelectingEsmaDhikr,
      selectedEsmaForConfirmation,
      esmaSelectionError,
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
          const nextCount = liveFreeCountRef.current + 1
          liveFreeCountRef.current = nextCount
          setFreeCount(nextCount)
          if (hapticsEnabled) {
            Vibration.vibrate(25)
          }

          void persistFreeModeAutoLog(nextCount)
          return
        }

        const baseCount = liveSelectedCountRef.current
        const nextRawCount = baseCount + 1
        const nextCount =
          selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, Math.max(0, nextRawCount)) : Math.max(0, nextRawCount)
        liveSelectedCountRef.current = nextCount

        incrementSelected()
        if (hapticsEnabled) {
          Vibration.vibrate(25)
        }

        persistSelectedDhikrLog({
          countOverride: nextCount
        })
      },
      onResetPress: () => {
        if (selectedDhikr) {
          resetSelected()
          liveSelectedCountRef.current = 0
          return
        }

        liveFreeCountRef.current = 0
        setFreeCount(0)

        if (freeAutoDhikrIdRef.current && freeAutoDhikrNameRef.current) {
          upsertPersonalDhikr({
            id: freeAutoDhikrIdRef.current,
            nameTurkish: freeAutoDhikrNameRef.current,
            transliteration: freeAutoDhikrNameRef.current,
            current: 0,
            target: 0,
            isFavorite: false
          })
        }
      },
      onTargetPress: () => {
        const freeAutoItem = freeAutoDhikrIdRef.current
          ? items.find(item => item.id === freeAutoDhikrIdRef.current && item.source === 'personal')
          : undefined
        setTargetDraft(String(selectedDhikr?.target && selectedDhikr.target > 0 ? selectedDhikr.target : (freeAutoItem?.target && freeAutoItem.target > 0 ? freeAutoItem.target : 100)))
        setIsEditingTarget(true)
      },
      onTargetDraftChange: next => {
        const digits = next.replace(/\D+/g, '')
        const trimmed = digits.slice(0, String(MAX_DHIKR_TARGET).length)
        setTargetDraft(trimmed)
      },
      onTargetCancel: () => {
        const freeAutoItem = freeAutoDhikrIdRef.current
          ? items.find(item => item.id === freeAutoDhikrIdRef.current && item.source === 'personal')
          : undefined
        setTargetDraft(String(selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.target : (freeAutoItem?.target && freeAutoItem.target > 0 ? freeAutoItem.target : 100)))
        setIsEditingTarget(false)
      },
      onTargetSubmit: submitTarget,
      onChangeDhikrPress: () => setIsSelectingDhikr(true),
      onCloseDhikrPicker: () => setIsSelectingDhikr(false),
      onSelectDhikr: id => {
        selectDhikr(id)
        setIsSelectingDhikr(false)
      },
      onToggleDemoComplete: () => {
        setDemoCompleted(prev => {
          const next = !prev
          setSelectedCount(next ? (selectedDhikr?.target ?? 0) : 0)
          return next
        })
      },
      onQuickDhikrSelect: label => {
        if (label === FREE_MODE_LABEL) {
          clearSelectedDhikr()
          setActiveQuickDhikr(FREE_MODE_LABEL)
          clearFreeAutoDhikrRefs()
          liveFreeCountRef.current = 0
          setFreeCount(0)
          return
        }

        setActiveQuickDhikr(label)
        const matched = items.find(item => item.nameTurkish === label)
        if (matched) {
          selectDhikr(matched.id)
        }
      },
      onSavePress: () => {
        if (selectedDhikr) {
          persistSelectedDhikrLog()
          return
        }

        setSyncError(undefined)
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

        const createdId = addCustomDhikr({
          name: trimmed,
          transliteration: freeSaveTransliterationDraft.trim() || undefined,
          meaning: freeSaveMeaningDraft.trim() || undefined,
          target: parsedTarget,
          initialCount: freeCount
        })
        closeFreeSaveName()
        if (authStatus !== 'authenticated' || !sessionUserId) {
          setSyncError('Kalıcı kaydetmek için giriş yapmalısın.')
          setFreeCount(0)
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
            target: parsedTarget ?? 0
          },
          sessionAccessToken
        )
          .then(() =>
            createDhikrLog(
              {
                userId: sessionUserId,
                customDhikrId: createdId,
                customDhikrName: trimmed,
                count: freeCount,
                targetCount: parsedTarget ?? 0,
                date: toDateKey(new Date()),
                source: 'manual',
                isCompleted: false
              },
              sessionAccessToken
            )
          )
          .then(savedLog => {
            applySavedBackendLog(savedLog)
            setFreeCount(0)
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
        clearSelectedDhikr()
        clearFreeAutoDhikrRefs()
        liveFreeCountRef.current = 0
        setFreeCount(0)
        setSyncError(undefined)
      },
      onEsmaPress: item => {
        setSelectedEsmaForConfirmation(item)
        setEsmaSelectionError(null)
      },
      onEsmaSelectCancel: closeEsmaSelection,
      onEsmaSelectConfirm: confirmEsmaSelection
    }
  }, [
    activeQuickDhikr,
    addCustomDhikr,
    upsertPersonalDhikr,
    applySavedBackendLog,
    createArabicDraft,
    createError,
    createNameDraft,
    createTargetDraft,
    demoCompleted,
    freeCount,
    freeSaveNameDraft,
    freeSaveTransliterationDraft,
    freeSaveMeaningDraft,
    freeSaveNameError,
    freeSaveTargetDraft,
    selectedEsmaForConfirmation,
    isSelectingEsmaDhikr,
    esmaSelectionError,
    incrementSelected,
    isSavingLog,
    isRefreshing,
    isCreatingDhikr,
    isEditingTarget,
    isSelectingDhikr,
    isFreeSaveNameModalOpen,
    upsertDhikrSnapshot,
    items,
    personalDhikrs,
    quickDhikrs,
    readyDhikrs,
    refresh,
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
    targetDraft
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

function calculateCompletionStreakDays(logs: BackendDhikrLog[]) {
  if (logs.length === 0) {
    return 0
  }

  const completionByDay = new Map<string, boolean>()
  const hasIncompleteOnlyByDay = new Map<string, boolean>()

  for (const log of logs) {
    const hasCompleted = completionByDay.get(log.date) ?? false
    const hasIncompleteOnly = hasIncompleteOnlyByDay.get(log.date) ?? false

    if (log.isCompleted) {
      completionByDay.set(log.date, true)
      hasIncompleteOnlyByDay.set(log.date, false)
      continue
    }

    if (!hasCompleted) {
      hasIncompleteOnlyByDay.set(log.date, hasIncompleteOnly || true)
    }
  }

  const today = startOfDay(new Date())
  const todayKey = toDateKey(today)
  const todayCompleted = completionByDay.get(todayKey) === true
  const todayIncompleteOnly = hasIncompleteOnlyByDay.get(todayKey) === true

  if (todayIncompleteOnly && !todayCompleted) {
    return 0
  }

  let cursor = todayCompleted ? today : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  let streak = 0

  while (true) {
    const key = toDateKey(cursor)
    if (completionByDay.get(key) !== true) {
      break
    }

    streak += 1
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1)
  }

  return streak
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
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
