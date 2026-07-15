import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useThemeTokens } from '@zikirmatik/ui'
import { useTranslation } from 'react-i18next'
import { DhikrContentStack } from '../../components/ui/dhikr-content-stack'
import { DhikrResumeModal } from '../../components/ui/dhikr-resume-modal'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { ThemedCard } from '../../components/ui/themed-card'
import { UnsavedDhikrTransitionModal } from '../../components/ui/unsaved-dhikr-transition-modal'
import { useDhikrStartGuard } from '../../hooks/use-dhikr-start-guard'
import { useAuthStore } from '../../store/auth-store'
import { useDhikrStore } from '../../store/dhikr-store'
import { createDhikrLog } from '../dhikrs/services/dhikr-logs-api-client'
import { useSpecialDayDetail } from './hooks/use-special-day-detail'
import type { BackendSpecialDayDetail } from './services/special-days-api-client'

type SpecialDayDetailScreenProps = {
  id: string
}

type PendingStart = {
  item: BackendSpecialDayDetail['recommendedDhikrs'][number]
  target: number
  progressCount: number
}

function toDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function SpecialDayDetailScreen({ id }: SpecialDayDetailScreenProps) {
  const router = useRouter()
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('special-days')

  const dhikrItems = useDhikrStore(state => state.items)
  const selectedDhikrId = useDhikrStore(state => state.selectedDhikrId)
  const upsertDhikrSnapshot = useDhikrStore(state => state.upsertDhikrSnapshot)
  const selectDhikr = useDhikrStore(state => state.selectDhikr)
  const setSelectedTarget = useDhikrStore(state => state.setSelectedTarget)
  const setSelectedCount = useDhikrStore(state => state.setSelectedCount)
  const unsavedProgressDhikrIds = useDhikrStore(state => state.unsavedProgressDhikrIds)
  const freeModeCount = useDhikrStore(state => state.freeModeCount)
  const discardUnsavedProgress = useDhikrStore(state => state.discardUnsavedProgress)
  const clearFreeModeSession = useDhikrStore(state => state.clearFreeModeSession)
  const applySavedBackendLog = useDhikrStore(state => state.applySavedBackendLog)
  const activeAiContext = useDhikrStore(state => state.activeAiContext)
  const setSelectedSource = useDhikrStore(state => state.setSelectedSource)

  const authStatus = useAuthStore(s => s.status)
  const sessionUserId = useAuthStore(s => s.session?.userId)
  const sessionAccessToken = useAuthStore(s => s.session?.accessToken)

  const detail = useSpecialDayDetail(id)
  const guard = useDhikrStartGuard()

  const [pendingStart, setPendingStart] = useState<PendingStart | null>(null)
  const [isSavingUnsaved, setIsSavingUnsaved] = useState(false)
  const [unsavedSaveError, setUnsavedSaveError] = useState<string | null>(null)

  const startDhikr = (item: PendingStart['item'], target: number, progressCount: number) => {
    guard.guardedStart({
      id: item.id,
      dhikrName: item.nameTurkish,
      onFresh: () => {
        upsertDhikrSnapshot({
          id: item.id,
          source: 'ready',
          nameTurkish: item.nameTurkish,
          arabic: item.nameArabic,
          transliteration: item.transliteration,
          meaning: item.meaning,
          current: 0,
          target,
          lastActivityLabel: t('special-days:detail.notStarted'),
          streakDays: 0,
          isFavorite: false,
        })
        selectDhikr(item.id)
        setSelectedSource('special-day')
        setSelectedTarget(target)
        setSelectedCount(0)
        router.push('/(tabs)/home')
      },
      onContinue: () => {
        selectDhikr(item.id)
        setSelectedSource('special-day')
        setSelectedTarget(target)
        setSelectedCount(progressCount)
        router.push('/(tabs)/home')
      }
    })
  }

  const handleStartPress = (item: PendingStart['item'], target: number, progressCount: number) => {
    const isSameTarget = item.id === selectedDhikrId
    const hasUnsaved = !isSameTarget && (
      selectedDhikrId
        ? unsavedProgressDhikrIds.includes(selectedDhikrId)
        : freeModeCount > 0
    )
    if (hasUnsaved) {
      setPendingStart({ item, target, progressCount })
      setUnsavedSaveError(null)
      return
    }
    startDhikr(item, target, progressCount)
  }

  const handleUnsavedSaveAndContinue = async () => {
    if (!pendingStart || isSavingUnsaved) return
    const selectedDhikr = dhikrItems.find(d => d.id === selectedDhikrId)
    if (!selectedDhikr || authStatus !== 'authenticated' || !sessionUserId) {
      setUnsavedSaveError(t('special-days:errors.loginRequired'))
      return
    }
    setIsSavingUnsaved(true)
    setUnsavedSaveError(null)
    const count = Math.max(0, Math.floor(selectedDhikr.current))
    const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, count) : count
    const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target
    const sourceMeta = activeAiContext?.dhikrId === selectedDhikr.id
      ? { source: 'special-day' as const, aiRecommendationId: activeAiContext.recommendationId, aiPrompt: activeAiContext.prompt, aiAssistantNote: activeAiContext.assistantNote }
      : { source: 'special-day' as const }
    const isObjectId = /^[a-f\d]{24}$/i.test(selectedDhikr.id)
    const dateKey = toDateKey(new Date())
    try {
      const savedLog = await createDhikrLog(
        isObjectId
          ? { userId: sessionUserId, dhikrId: selectedDhikr.id, count: safeCount, targetCount: selectedDhikr.target, date: dateKey, ...sourceMeta, isCompleted, isFavorite: selectedDhikr.isFavorite }
          : { userId: sessionUserId, customDhikrId: selectedDhikr.id, customDhikrName: selectedDhikr.nameTurkish || selectedDhikr.transliteration, count: safeCount, targetCount: selectedDhikr.target, date: dateKey, ...sourceMeta, isCompleted: false, isFavorite: selectedDhikr.isFavorite },
        sessionAccessToken
      )
      applySavedBackendLog(savedLog)
      const { item, target, progressCount } = pendingStart
      setPendingStart(null)
      startDhikr(item, target, progressCount)
    } catch (e) {
      setUnsavedSaveError(e instanceof Error ? e.message : t('special-days:errors.saveFailed'))
    } finally {
      setIsSavingUnsaved(false)
    }
  }

  return (
    <PageLayout>
      <View className='flex-1 w-full'>
        <PageHeader
          title={t('special-days:detail.pageTitle')}
          leftIconName='chevron-left'
          onPressLeft={() => {
            router.back()
          }}
        />

        <PageScrollView
          contentInnerClassName='w-full px-5'
          bottomPadding={56}
          onRefresh={detail.refresh}
          refreshing={detail.isLoading}
        >
          {detail.error ? (
            <View className='mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3'>
              <Text className='text-sm text-[#fecaca]'>{detail.error}</Text>
            </View>
          ) : null}

          {!detail.detail ? null : (
            <>
              <ThemedCard className='rounded-2xl p-5' borderClassName='border-white/5' elevated>
                <Text className='text-xs font-semibold uppercase tracking-[1.1px] text-[--text-muted]'>
                  {t('special-days:detail.pageTitle')}
                </Text>
                <Text className='mt-2 text-2xl leading-[34px] font-semibold tracking-tight text-[--text-primary]' numberOfLines={2}>
                  {detail.detail.name}
                </Text>
                <Text className='mt-1 text-sm leading-5 text-[--text-muted]'>{detail.detail.dateLabel}</Text>
                {detail.detail.description ? (
                  <Text className='mt-3 text-sm leading-6 text-[--text-primary]'>{detail.detail.description}</Text>
                ) : null}
                <View className='mt-4 flex-row items-center gap-2'>
                  <FontAwesome6 name='check-double' size={12} color={tokens.accent} />
                  <Text className='text-xs text-[--text-muted]'>
                    {t('special-days:detail.completedLabel', {
                      completed: detail.detail.progress.completedCount,
                      total: detail.detail.progress.totalCount
                    })}
                  </Text>
                </View>
              </ThemedCard>

              <ThemedCard className='mt-4 rounded-2xl p-4' borderClassName='border-white/5'>
                <Text className='text-xs font-semibold uppercase tracking-[1px] text-[--text-muted]'>
                  {t('special-days:detail.themeTitle')}
                </Text>
                <Text className='mt-1 text-base font-semibold text-[--text-primary]'>{detail.detail.themeTitle}</Text>
                <Text className='mt-1 text-sm leading-6 text-[--text-muted]'>{detail.detail.themeSummary}</Text>
              </ThemedCard>

              <View className='mt-6 gap-3'>
                <Text className='px-1 text-sm font-semibold text-[--text-primary]'>{t('special-days:detail.recommendedDhikrs')}</Text>
                {detail.detail.recommendedDhikrs.map(item => {
                  const matchedLocal = dhikrItems.find(dhikr => dhikr.id === item.id)
                  const target = Math.max(1, matchedLocal?.target ?? item.progressTarget ?? item.recommendedCount ?? 1)
                  const progressCount = Math.max(
                    0,
                    Math.min(target, Math.max(item.progressCount ?? 0, matchedLocal?.current ?? 0))
                  )
                  const progressPct = Math.max(0, Math.min(100, Math.round((progressCount / target) * 100)))
                  const isCompleted = item.isCompleted || progressCount >= target

                  return (
                    <ThemedCard key={item.id} className='rounded-2xl p-4' borderClassName='border-white/5'>
                      <View className='flex-row items-start justify-between gap-3'>
                        <Text className='flex-1 text-base font-semibold text-[--text-primary]'>{item.nameTurkish}</Text>
                        <Text
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isCompleted ? 'bg-[--success]/15 text-[--success]' : 'bg-[--accent]/15 text-[--accent]'
                          }`}
                        >
                          {isCompleted ? t('special-days:detail.completed') : `${progressCount}/${target}`}
                        </Text>
                      </View>

                      <DhikrContentStack
                        arabic={item.nameArabic}
                        transliteration={item.transliteration}
                        meaning={item.meaning}
                      />

                      <View className='mt-4'>
                        <View className='mb-2 flex-row items-center justify-between'>
                          <Text className='text-xs text-[--text-muted]'>{t('special-days:detail.target', { target })}</Text>
                          <Text className={`text-xs font-semibold ${isCompleted ? 'text-[--success]' : 'text-[--accent]'}`}>
                            %{Math.round(progressPct)}
                          </Text>
                        </View>
                        <View
                          className='h-2 overflow-hidden rounded-full'
                          style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.1) }}
                        >
                          <View
                            className={`h-full rounded-full ${isCompleted ? 'bg-[--success]' : 'bg-[--accent]'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </View>
                      </View>

                      <View className='mt-4 flex-row items-center justify-end'>
                        <Pressable
                          onPress={() => handleStartPress(item, target, progressCount)}
                          className='rounded-full bg-[--accent] px-4 py-2'
                        >
                          <Text className='text-xs font-semibold' style={{ color: tokens.bg }}>
                            {t('special-days:detail.start')}
                          </Text>
                        </Pressable>
                      </View>
                    </ThemedCard>
                  )
                })}
              </View>
            </>
          )}
        </PageScrollView>

        <UnsavedDhikrTransitionModal
          visible={Boolean(pendingStart)}
          dhikrName={dhikrItems.find(d => d.id === selectedDhikrId)?.nameTurkish ?? ''}
          count={dhikrItems.find(d => d.id === selectedDhikrId)?.current ?? freeModeCount}
          isSaving={isSavingUnsaved}
          error={unsavedSaveError}
          onSaveAndContinue={handleUnsavedSaveAndContinue}
          onContinueWithoutSaving={() => {
            const pending = pendingStart!
            setPendingStart(null)
            setUnsavedSaveError(null)
            if (selectedDhikrId) {
              discardUnsavedProgress(selectedDhikrId)
            } else {
              clearFreeModeSession()
            }
            startDhikr(pending.item, pending.target, pending.progressCount)
          }}
          onCancel={() => {
            setPendingStart(null)
            setUnsavedSaveError(null)
          }}
        />
        <DhikrResumeModal
          visible={guard.isGuardOpen}
          dhikrName={guard.guardDhikrName}
          currentCount={guard.guardCurrentCount}
          onContinue={guard.onGuardContinue}
          onFresh={guard.onGuardFresh}
          onCancel={guard.onGuardCancel}
        />
      </View>
    </PageLayout>
  )
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}
