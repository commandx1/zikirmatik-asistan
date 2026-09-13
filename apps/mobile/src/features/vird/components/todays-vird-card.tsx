import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { useThemeTokens } from '@zikirmatik/ui'
import { toDateKey, type VirdSlotKey } from '@zikirmatik/shared'
import { useLocaleUpper } from '../../../hooks/use-locale-upper'
import { trackEvent } from '../../../lib/analytics'
import { useVirdStore } from '../../../store/vird-store'
import { useHomeContext } from '../../home/home-context'
import { useHydrateVirdSnapshots } from '../hooks/use-hydrate-vird-snapshots'
import {
  dayIndexFor,
  expectedItemsForDay,
  isDayComplete,
  slotProgress,
  VIRD_SLOT_KEYS,
  type ExpectedVirdItem,
  type VirdSlotProgressView
} from '../services/vird-day'
import { calculateVirdStreak } from '../services/vird-streak'
import type { VirdProgramLocal } from '../types'

// Ana ekranda (SelectedDhikrMeaning sonrası, Esma bölümünden önce) aktif vird
// programının bugünkü ilerlemesini gösteren kart. Salt veri katmanı (vird-day.ts,
// vird-streak.ts) üzerine ince bir görünüm — ilerleme kaydı/hesap mantığı
// burada YOK, tamamı zaten test edilmiş saf fonksiyonlardan gelir.
// Ekranlar (segment/editör/şablon rafı) bu görevde YOK; boş durumun CTA'sı
// yalnızca focus sekmesine yönlendirip focusSegment'i 'vird' yapar.

const RING_SIZE = 40
const RING_STROKE = 4
const MINI_RING_SIZE = 28
const MINI_RING_STROKE = 3

function ringProgress(done: number, total: number): number {
  return total > 0 ? done / total : 0
}

function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  trackColor
}: {
  size: number
  strokeWidth: number
  progress: number
  color: string
  trackColor: string
}) {
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))
  const dashOffset = circumference * (1 - clamped)

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill='none' />
      {clamped > 0 ? (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill='none'
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap='round'
          transform={`rotate(-90 ${center} ${center})`}
        />
      ) : null}
    </Svg>
  )
}

function EmptyVirdCard() {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('vird')
  const upper = useLocaleUpper()
  const router = useRouter()
  const setFocusSegment = useVirdStore((state) => state.setFocusSegment)

  return (
    <View className='mb-5 px-5'>
      <View
        className='rounded-2xl px-4 py-4'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: withAlpha(tokens.card, 0.92)
        }}
      >
        <Text className='mb-1 text-xs font-semibold tracking-[1.1px]' style={{ color: tokens.textMuted }}>
          {upper(t('home.cardTitle'))}
        </Text>
        <Text className='mb-1 text-sm font-semibold' style={{ color: tokens.textPrimary }}>
          {t('home.emptyTitle')}
        </Text>
        <Text className='mb-3 text-xs leading-4' style={{ color: tokens.textMuted }}>
          {t('home.emptySubtitle')}
        </Text>
        <Pressable
          onPress={() => {
            setFocusSegment('vird')
            router.push('/(tabs)/focus')
          }}
          className='self-start rounded-full px-4 py-2'
          style={{ backgroundColor: tokens.accent }}
        >
          <Text className='text-xs font-semibold' style={{ color: tokens.bg }}>
            {t('home.emptyCta')}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function SlotRow({
  slot,
  view,
  accent,
  trackColor,
  onStart
}: {
  slot: VirdSlotKey
  view: VirdSlotProgressView
  accent: string
  trackColor: string
  onStart: (item: ExpectedVirdItem) => void
}) {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('vird')
  const isComplete = view.done >= view.total

  if (slot === 'prayer') {
    const byPrayerIndex = new Map<number, typeof view.items>()
    for (const item of view.items) {
      if (item.prayerIndex == null) continue
      const list = byPrayerIndex.get(item.prayerIndex) ?? []
      list.push(item)
      byPrayerIndex.set(item.prayerIndex, list)
    }
    const prayerIndexes = Array.from(byPrayerIndex.keys()).sort((a, b) => a - b)

    return (
      <View className='flex-row items-center justify-between py-2'>
        <View className='flex-1 pr-3'>
          <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
            {t('slots.prayer')}
          </Text>
          <Text className='text-xs' style={{ color: tokens.textMuted }}>
            {view.done}/{view.total}
          </Text>
        </View>
        <View className='flex-row gap-2'>
          {prayerIndexes.map((prayerIndex) => {
            const items = byPrayerIndex.get(prayerIndex) ?? []
            const complete = items.length > 0 && items.every((item) => item.completed)
            return (
              <Pressable
                key={prayerIndex}
                accessibilityLabel={`${t('slots.prayer')} ${t(`prayerIndex.${prayerIndex}`)}`}
                disabled={complete}
                onPress={() => {
                  const target = items.find((item) => !item.completed)
                  if (target) onStart(target)
                }}
                className='items-center justify-center'
                style={{ width: MINI_RING_SIZE, height: MINI_RING_SIZE }}
              >
                <ProgressRing
                  size={MINI_RING_SIZE}
                  strokeWidth={MINI_RING_STROKE}
                  progress={complete ? 1 : 0}
                  color={accent}
                  trackColor={trackColor}
                />
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <Pressable
      disabled={isComplete}
      onPress={() => {
        const target = view.items.find((item) => !item.completed)
        if (target) onStart(target)
      }}
      className='flex-row items-center justify-between py-2'
    >
      <View className='flex-1 pr-3'>
        <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
          {t(`slots.${slot}`)}
        </Text>
        <Text className='text-xs' style={{ color: tokens.textMuted }}>
          {view.done}/{view.total}
        </Text>
      </View>
      <ProgressRing
        size={RING_SIZE}
        strokeWidth={RING_STROKE}
        progress={ringProgress(view.done, view.total)}
        color={accent}
        trackColor={trackColor}
      />
    </Pressable>
  )
}

export function TodaysVirdCard() {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('vird')
  const upper = useLocaleUpper()
  const home = useHomeContext()
  const dayCompletedFiredRef = useRef<string | null>(null)

  const programs = useVirdStore((state) => state.programs)
  const activeProgramId = useVirdStore((state) => state.activeProgramId)
  const dayProgress = useVirdStore((state) => state.dayProgress)

  const activeProgram = useMemo<VirdProgramLocal | null>(
    () => programs.find((program) => program.id === activeProgramId) ?? null,
    [programs, activeProgramId]
  )

  // Sunucudan taze gelmiş bir programda `dhikrs` boş olabilir (bkz.
  // features/vird/README.md) — bu tembel hidrasyon, kart açıldığında eksik
  // ref'leri doldurur ki startVirdItem (aşağıda handleStart) genel
  // vird:home.itemFallbackName yer tutucusuna DÜŞMESİN.
  useHydrateVirdSnapshots(activeProgram?.id ?? null)

  const todayKey = toDateKey(new Date())

  const dayIndex = useMemo(() => (activeProgram ? dayIndexFor(activeProgram, todayKey) : 0), [activeProgram, todayKey])
  const expected = useMemo(
    () => (activeProgram ? expectedItemsForDay(activeProgram, dayIndex) : []),
    [activeProgram, dayIndex]
  )
  const todayProgress = activeProgram ? dayProgress[todayKey] : undefined
  const progress = useMemo(() => slotProgress(expected, todayProgress), [expected, todayProgress])
  const dayComplete = useMemo(() => isDayComplete(expected, todayProgress), [expected, todayProgress])
  const streak = useMemo(
    () => (activeProgram ? calculateVirdStreak(activeProgram, dayProgress) : { currentStreak: 0, longestStreak: 0 }),
    [activeProgram, dayProgress]
  )

  useEffect(() => {
    if (!activeProgram || !dayComplete) {
      return
    }
    const fireKey = `${activeProgram.id}:${todayKey}`
    if (dayCompletedFiredRef.current === fireKey) {
      return
    }
    dayCompletedFiredRef.current = fireKey
    void trackEvent('vird_day_completed')
  }, [activeProgram, dayComplete, todayKey])

  if (!activeProgram) {
    return <EmptyVirdCard />
  }

  const handleStart = (slot: VirdSlotKey) => (item: ExpectedVirdItem) => {
    home.startVirdItem(activeProgram, item)
    void trackEvent('vird_slot_started', { slot })
  }

  const trackColor = withAlpha(tokens.textPrimary, 0.12)
  const totals = Object.values(progress).reduce(
    (acc, view) => ({ done: acc.done + (view?.done ?? 0), total: acc.total + (view?.total ?? 0) }),
    { done: 0, total: 0 }
  )
  const completionPercent = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0

  return (
    <View className='mb-5 px-5'>
      <View
        className='rounded-2xl px-4 py-3'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: withAlpha(tokens.card, 0.92)
        }}
      >
        <View className='mb-1 flex-row items-center justify-between'>
          <Text className='text-xs font-semibold tracking-[1.1px]' style={{ color: tokens.textMuted }}>
            {upper(t('home.cardTitle'))}
          </Text>
          <Text className='text-xs font-semibold' style={{ color: tokens.success }}>
            {streak.currentStreak > 0 ? t('home.streakLabel', { count: streak.currentStreak }) : t('home.streakStart')}
          </Text>
        </View>

        {dayComplete ? (
          <Text className='mb-2 text-xs font-semibold' style={{ color: tokens.success }}>
            {t('home.dayCompleteBadge')}
          </Text>
        ) : totals.total > 0 ? (
          <Text className='mb-2 text-xs' style={{ color: tokens.textMuted }}>
            {t('home.completionPercent', { percent: completionPercent })}
          </Text>
        ) : null}

        {expected.length === 0 ? (
          <Text className='py-2 text-xs' style={{ color: tokens.textMuted }}>
            {t('home.noItemsToday')}
          </Text>
        ) : (
          VIRD_SLOT_KEYS.map((slot) => {
            const view = progress[slot]
            if (!view) return null
            return (
              <SlotRow
                key={slot}
                slot={slot}
                view={view}
                accent={tokens.accent}
                trackColor={trackColor}
                onStart={handleStart(slot)}
              />
            )
          })
        )}
      </View>
    </View>
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
