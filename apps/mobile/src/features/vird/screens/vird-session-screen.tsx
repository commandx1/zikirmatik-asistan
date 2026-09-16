import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Pressable, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { toDateKey, type VirdSlotKey } from '@zikirmatik/shared'
import { i18n } from '../../../i18n'
import { PageHeader } from '../../../components/ui/page-header'
import { PageLayout, PageScrollView } from '../../../components/ui/page-layout'
import { ThemedCard } from '../../../components/ui/themed-card'
import { PrimaryCtaButton } from '../../../components/ui/primary-cta-button'
import { DhikrContentStack } from '../../../components/ui/dhikr-content-stack'
import { resolveLocalizedText, useDhikrStore } from '../../../store/dhikr-store'
import { useAuthStore } from '../../../store/auth-store'
import { useCounterStyleStore } from '../../../store/counter-style-store'
import { useProfileStore } from '../../../store/profile-store'
import { useVirdStore } from '../../../store/vird-store'
import { fireLapHaptic, fireTapHaptic, resolveHapticsPattern } from '../../../services/haptics'
import { playClickSound } from '../../../services/click-sound'
import { createDhikrLog } from '../../dhikrs/services/dhikr-logs-api-client'
import { AppleWatchView, type CounterVisualModel } from '../../home/components/apple-watch'
import { TesbihCounterView } from '../../home/components/tesbih-counter'
import { useHydrateVirdSnapshots } from '../hooks/use-hydrate-vird-snapshots'
import { dayIndexFor, VIRD_SLOT_KEYS } from '../services/vird-day'
import { calculateVirdStreak } from '../services/vird-streak'
import {
  buildSessionItems,
  buildSessionLogPayload,
  nextIncompleteSession,
  pickNextIndex,
  remainingReps,
  type VirdSessionItem,
  type VirdSessionKey
} from '../services/vird-session'
import type { VirdProgramLocal } from '../types'

// Rehberli vird oturumu (`/vird/session`) — tek bir dilime (namaz için tek bir
// vakte) odaklı sayaç ekranı. `components/todays-vird-card.tsx`'in
// satırlarından açılır; ana sayaçla (home-context.tsx) HİÇBİR bağlantısı
// yoktur — kendi useVirdStore.setProgress ile ilerler, kendi dhikr-logs
// POST'unu atar.
export type VirdSessionScreenProps = {
  programId?: string
  slot?: string
  prayerIndex: number | null
}

// Seans butonları ana sayaç CTA'sından daha alçak (kullanıcı geri bildirimi).
const SESSION_CTA_STYLE = { paddingVertical: 11 } as const

function isVirdSlotKey(value: string | undefined): value is VirdSlotKey {
  return typeof value === 'string' && (VIRD_SLOT_KEYS as readonly string[]).includes(value)
}

export function VirdSessionScreen({ programId, slot, prayerIndex }: VirdSessionScreenProps) {
  const router = useRouter()
  const programs = useVirdStore((state) => state.programs)
  const program = useMemo(() => programs.find((candidate) => candidate.id === programId) ?? null, [programs, programId])
  const isValid = Boolean(program) && isVirdSlotKey(slot)

  useEffect(() => {
    if (!isValid) {
      router.back()
    }
  }, [isValid, router])

  if (!program || !isValid) {
    return null
  }

  return (
    <SessionBody
      key={`${programId}:${slot}:${prayerIndex ?? 0}`}
      program={program}
      slot={slot as VirdSlotKey}
      prayerIndex={prayerIndex}
    />
  )
}

function sessionLabelFor(key: VirdSessionKey, t: (k: string) => string): string {
  if (key.slot === 'prayer' && key.prayerIndex != null) {
    return t(`vird:prayerIndex.${key.prayerIndex}`)
  }
  return t(`vird:slots.${key.slot}`)
}

function SessionBody({
  program,
  slot,
  prayerIndex
}: {
  program: VirdProgramLocal
  slot: VirdSlotKey
  prayerIndex: number | null
}) {
  const router = useRouter()
  const { t } = useTranslation('vird')
  const locale = (i18n.language === 'en' ? 'en' : 'tr') as 'tr' | 'en'
  const fallbackName = t('vird:home.itemFallbackName')

  useHydrateVirdSnapshots(program.id)

  const todayKey = toDateKey(new Date())
  const dayIndex = dayIndexFor(program, todayKey)

  const todayProgress = useVirdStore((state) => state.dayProgress[todayKey])
  const setProgress = useVirdStore((state) => state.setProgress)
  const virdStreak = useVirdStore((state) => state.virdStreak)
  const dayProgress = useVirdStore((state) => state.dayProgress)

  const sessionKey: VirdSessionKey = useMemo(() => ({ slot, prayerIndex }), [slot, prayerIndex])
  const items = useMemo(
    () => buildSessionItems(program, todayKey, sessionKey, todayProgress),
    [program, todayKey, sessionKey, todayProgress]
  )

  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstIncomplete = items.findIndex((item) => !item.completed)
    return firstIncomplete >= 0 ? firstIncomplete : 0
  })

  const current: VirdSessionItem | undefined = items[currentIndex]
  const snapshot = current ? program.dhikrs[current.ref] : undefined
  const name = current ? resolveLocalizedText(snapshot?.name ?? fallbackName, locale) || fallbackName : ''
  const transliteration = snapshot?.transliteration ? resolveLocalizedText(snapshot.transliteration, locale) : undefined
  const meaning = snapshot?.meaning ? resolveLocalizedText(snapshot.meaning, locale) : undefined

  const allDone = items.length > 0 && items.every((item) => item.completed)
  const nextIndex = pickNextIndex(items, currentIndex)
  const nextSession = allDone ? nextIncompleteSession(program, todayKey, todayProgress, sessionKey) : null
  const nextItem = nextIndex != null ? items[nextIndex] : null
  const nextItemSnapshot = nextItem ? program.dhikrs[nextItem.ref] : undefined
  const nextName = nextItem ? resolveLocalizedText(nextItemSnapshot?.name ?? fallbackName, locale) || fallbackName : ''

  // Ayarlar: home-context.tsx ile AYNI çözümleme (bkz. görev notu).
  const storedHapticsPattern = useProfileStore((state) => state.hapticsPattern)
  const storedHapticsEnabled = useProfileStore((state) => state.hapticsEnabled)
  const hapticsPattern = resolveHapticsPattern(storedHapticsPattern, storedHapticsEnabled)
  const isPremium = useProfileStore((state) => state.isPremium)
  const soundPack = useCounterStyleStore((state) => state.soundPack)
  const effectiveSoundPack = isPremium ? soundPack : 'off'
  const counterStyle = useCounterStyleStore((state) => state.counterStyle)

  const authStatus = useAuthStore((state) => state.status)
  const sessionUserId = useAuthStore((state) => state.session?.userId)
  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken)
  const applySavedBackendLog = useDhikrStore((state) => state.applySavedBackendLog)

  // Bu oturumda değişip henüz sunucuya yazılmamış item'lar. Yalnız bunlar POST edilir;
  // dokunulmamış item'lar kapanışta gereksiz istek üretmez.
  const dirtyRef = useRef(new Set<string>())

  const flush = useCallback(
    async (itemKey: string) => {
      if (authStatus !== 'authenticated' || !sessionUserId) {
        return
      }
      if (!dirtyRef.current.has(itemKey)) {
        return
      }
      const item = items.find((candidate) => candidate.itemKey === itemKey)
      if (!item) {
        return
      }
      const liveCount = useVirdStore.getState().dayProgress[todayKey]?.[itemKey]?.count ?? 0
      // İyimser temizleme: close() + unmount cleanup art arda çağrıldığında aynı
      // sayı iki kez POST edilmesin; hata olursa tekrar kirli işaretlenir.
      dirtyRef.current.delete(itemKey)
      try {
        const payload = buildSessionLogPayload({
          userId: sessionUserId,
          program,
          item: { ...item, count: liveCount },
          dayIndex,
          date: todayKey,
          locale,
          fallbackName
        })
        const saved = await createDhikrLog(payload, sessionAccessToken)
        applySavedBackendLog(saved)
      } catch (error: unknown) {
        dirtyRef.current.add(itemKey)
        console.warn('[vird-session] log kaydı başarısız', error)
      }
    },
    [authStatus, sessionUserId, sessionAccessToken, todayKey, items, program, dayIndex, locale, fallbackName, applySavedBackendLog]
  )

  // unmount/AppState background flush her zaman EN GÜNCEL items/flush'ı
  // kullanmalı — bağımlılık dizisine flush eklemek her sayaç artışında
  // efekti yeniden bağlardı, bu yüzden ref üzerinden okunur.
  const itemsRef = useRef(items)
  itemsRef.current = items
  const flushRef = useRef(flush)
  flushRef.current = flush

  const flushAll = useCallback(() => {
    for (const item of itemsRef.current) {
      void flushRef.current(item.itemKey)
    }
  }, [])

  useEffect(() => {
    return () => {
      flushAll()
    }
  }, [flushAll])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'inactive' || nextState === 'background') {
        flushAll()
      }
    })
    return () => subscription.remove()
  }, [flushAll])

  const onCountPress = () => {
    if (!current) {
      return
    }
    const { itemKey, count, target } = current
    if (count >= target) {
      return
    }
    const next = count + 1
    setProgress(todayKey, itemKey, next, target)
    dirtyRef.current.add(itemKey)
    fireTapHaptic(hapticsPattern)
    playClickSound(effectiveSoundPack)
    if (next >= target) {
      fireLapHaptic(hapticsPattern)
      void flush(itemKey)
    }
  }

  const onResetPress = () => {
    if (!current) {
      return
    }
    setProgress(todayKey, current.itemKey, 0, current.target)
    dirtyRef.current.add(current.itemKey)
  }

  const goNext = () => {
    if (!current) {
      return
    }
    void flush(current.itemKey)
    if (nextIndex != null) {
      setCurrentIndex(nextIndex)
    }
  }

  const close = () => {
    flushAll()
    router.back()
  }

  const goNextSession = () => {
    if (!nextSession) {
      return
    }
    router.replace({
      pathname: '/vird/session',
      params: {
        programId: program.id,
        slot: nextSession.slot,
        ...(nextSession.prayerIndex != null ? { prayerIndex: String(nextSession.prayerIndex) } : {})
      }
    })
  }

  const model: CounterVisualModel = {
    count: current?.count ?? 0,
    target: current?.target ?? 0,
    progress: current && current.target > 0 ? current.count / current.target : 0,
    isTargetMode: true,
    onCountPress,
    onResetPress,
    onTargetPress: () => {},
    onSavePress: () => {},
    isSavingLog: false,
    mainDhikr: { displayName: name },
    activeQuickDhikr: '',
    currentLap: 0,
    lapSize: 33
  }

  const streak = useMemo(() => {
    if (authStatus === 'authenticated' && virdStreak) {
      return virdStreak
    }
    return calculateVirdStreak(program, dayProgress)
  }, [authStatus, virdStreak, program, dayProgress])

  const sessionLabel = sessionLabelFor(sessionKey, t)
  const title =
    prayerIndex != null
      ? t('vird:session.prayerTitle', { prayer: t(`vird:prayerIndexShort.${prayerIndex}`) })
      : t('vird:session.title', { slot: sessionLabel })
  const position = t('vird:session.position', { index: currentIndex + 1, total: items.length })

  return (
    <PageLayout>
      <PageHeader title={title} leftIconName="xmark" onPressLeft={close} />

      <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={40}>
        {items.length === 0 ? (
          <ThemedCard className="items-center rounded-2xl px-4 py-6">
            <Text className="mb-4 text-sm text-[--text-muted]">{t('vird:home.noItemsToday')}</Text>
            <PrimaryCtaButton label={t('vird:session.close')} onPress={close} className="w-full" style={SESSION_CTA_STYLE} textClassName="text-base" />
          </ThemedCard>
        ) : allDone ? (
          <ThemedCard className="items-center rounded-2xl px-4 py-6">
            <Text className="mb-2 text-base font-semibold text-[--text-primary]">
              {t('vird:session.completedTitle', { slot: sessionLabel })}
            </Text>
            {nextSession ? (
              <PrimaryCtaButton
                label={t('vird:session.nextSlotCta', { slot: sessionLabelFor(nextSession, t) })}
                onPress={goNextSession}
                className="mb-3 w-full"
                style={SESSION_CTA_STYLE}
                textClassName="text-base"
              />
            ) : (
              <>
                <Text className="mb-1 text-base font-semibold text-[--text-primary]">
                  {t('vird:session.dayCompletedTitle')}
                </Text>
                <Text className="mb-4 text-xs font-semibold text-[--success]">
                  {streak.currentStreak > 0
                    ? t('vird:home.streakLabel', { count: streak.currentStreak })
                    : t('vird:home.streakStart')}
                </Text>
              </>
            )}
            {nextSession ? (
              <Pressable onPress={close} className="items-center self-center px-4 py-2">
                <Text className="text-sm font-semibold text-[--text-muted]">{t('vird:session.close')}</Text>
              </Pressable>
            ) : (
              <PrimaryCtaButton label={t('vird:session.close')} onPress={close} className="w-full" style={SESSION_CTA_STYLE} textClassName="text-base" />
            )}
          </ThemedCard>
        ) : (
          <>
            {counterStyle === 'tesbih' && isPremium ? (
              <TesbihCounterView model={model} controls="reset-only" />
            ) : (
              <AppleWatchView model={model} controls="reset-only" />
            )}
            <Text className="-mt-4 mb-3 text-center text-xs text-[--text-muted]">
              {`${position} · ${t('vird:session.remaining', { count: remainingReps(items) })}`}
            </Text>
            {current && current.count >= current.target && nextIndex != null ? (
              <>
                <PrimaryCtaButton
                  label={t('vird:session.next')}
                  onPress={goNext}
                  className="mb-1.5 w-full"
                  style={SESSION_CTA_STYLE}
                  textClassName="text-base"
                />
                <Text className="mb-4 text-center text-xs text-[--text-muted]">
                  {t('vird:session.nextName', { name: nextName })}
                </Text>
              </>
            ) : null}
            {current && current.count < current.target && nextIndex != null ? (
              <Pressable onPress={goNext} className="mb-4 items-center self-center px-4 py-1">
                <Text className="text-sm font-semibold text-[--text-muted]">{t('vird:session.skip')}</Text>
              </Pressable>
            ) : null}
            <Text className="mb-1 text-lg font-semibold text-[--text-primary]">{name}</Text>
            <DhikrContentStack arabic={snapshot?.nameArabic} transliteration={transliteration} meaning={meaning} />

          </>
        )}
      </PageScrollView>
    </PageLayout>
  )
}
