import { useEffect, useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useThemeTokens } from '@zikirmatik/ui'
import { toDateKey, type VirdSlotKey, withAlpha} from "@zikirmatik/shared";
import { useLocaleUpper } from '../../../hooks/use-locale-upper'
import { trackEvent } from '../../../lib/analytics'
import { useAuthStore } from '../../../store/auth-store'
import { useVirdStore } from '../../../store/vird-store'
import { useHydrateVirdSnapshots } from '../hooks/use-hydrate-vird-snapshots'
import {
  dayIndexFor,
  expectedItemsForDay,
  isDayComplete,
  slotProgress,
  VIRD_SLOT_KEYS,
  type VirdSlotProgressView
} from '../services/vird-day'
import { getPrayerTimes } from '../services/prayer-times'
import { resolveNowSlot } from '../services/vird-now'
import { calculateVirdStreak } from '../services/vird-streak'
import type { VirdProgramLocal } from '../types'
import { TEST_IDS } from '../../../test-ids'

// Ana ekranda VE hub'da (vird-hub-screen.tsx) ortak kullanılan Bugünkü Vird
// kartı. Salt veri katmanı (vird-day.ts, vird-now.ts, vird-streak.ts)
// üzerine ince bir görünüm — kart artık home-context'e bağımlı DEĞİL,
// satıra dokunma davranışını çağıran belirler (bkz. props).
// İki ayrı ekranda (ana ekran + hub) mount olabildiğinden, "gün tamamlandı"
// analitik olayının BİR KEZ (program+gün başına) atılmasını sağlamak için
// modül düzeyinde (bileşen örneğine değil) bir guard kullanılır.
const dayCompletedFired = new Set<string>()

export type TodaysVirdCardProps = {
  /** Kartın kendisine (başlık alanına) dokunma — hub'a/karta gitmek için. */
  onPressCard?: () => void
  /** Search param'dan (slot/prayerIndex) gelen, "Şimdi" hesabını override eden dilim. */
  highlightSlot?: VirdSlotKey | null
}

function EmptyVirdCard({ onPressCard }: { onPressCard?: () => void }) {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('vird')
  const upper = useLocaleUpper()
  const router = useRouter()

  const handlePress = () => {
    if (onPressCard) {
      onPressCard()
      return
    }
    router.push('/vird')
  }

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
        <Pressable onPress={handlePress} testID={TEST_IDS.vird.emptyCta} className='self-start rounded-full px-4 py-2' style={{ backgroundColor: tokens.accent }}>
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
  isNow,
  onStart
}: {
  slot: VirdSlotKey
  view: VirdSlotProgressView
  isNow: boolean
  onStart: (prayerIndex?: number) => void
}) {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('vird')
  const isComplete = view.done >= view.total
  const rowStyle = isNow ? { backgroundColor: withAlpha(tokens.accent, 0.08), borderRadius: 12 } : undefined

  if (slot === 'prayer') {
    const byPrayerIndex = new Map<number, typeof view.items>()
    for (const item of view.items) {
      if (item.prayerIndex == null) continue
      const list = byPrayerIndex.get(item.prayerIndex) ?? []
      list.push(item)
      byPrayerIndex.set(item.prayerIndex, list)
    }
    const prayerIndexes = Array.from(byPrayerIndex.keys()).sort((a, b) => a - b)
    const donePrayers = prayerIndexes.filter((prayerIndex) => {
      const items = byPrayerIndex.get(prayerIndex) ?? []
      return items.length > 0 && items.every((item) => item.completed)
    }).length

    return (
      <View className='flex-row items-center justify-between px-2 py-2' style={rowStyle}>
        <View className='flex-1 pr-3'>
          <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
            {t('slots.prayer')}
          </Text>
          <Text className='text-xs' style={{ color: tokens.textMuted }}>
            {t('home.prayerCount', { done: donePrayers, total: prayerIndexes.length })}
          </Text>
        </View>
        <View className='flex-row gap-2.5'>
          {prayerIndexes.map((prayerIndex) => {
            const items = byPrayerIndex.get(prayerIndex) ?? []
            const complete = items.length > 0 && items.every((item) => item.completed)
            return (
              <Pressable
                key={prayerIndex}
                accessibilityLabel={`${t('slots.prayer')} ${t(`prayerIndexShort.${prayerIndex}`)}`}
                onPress={() => onStart(prayerIndex)}
                className='items-center justify-center gap-0.5'
              >
                <FontAwesome6
                  name={complete ? 'circle-check' : 'circle'}
                  iconStyle={complete ? 'solid' : 'regular'}
                  size={20}
                  color={complete ? tokens.success : withAlpha(tokens.textPrimary, 0.3)}
                />
                <Text className='text-[10px] font-medium' style={{ color: tokens.textMuted }}>
                  {t(`prayerIndexShort.${prayerIndex}`)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <Pressable
      onPress={() => onStart()}
      testID={`${TEST_IDS.vird.todayStart}-${slot}`}
      className='flex-row items-center justify-between px-2 py-2'
      style={rowStyle}
    >
      <View className='flex-1 pr-3'>
        <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
          {t(`slots.${slot}`)}
        </Text>
        <Text className='text-xs' style={{ color: tokens.textMuted }}>
          {t('home.dhikrCount', { done: view.done, total: view.total })}
        </Text>
      </View>
      {isComplete ? (
        <View className='flex-row items-center gap-1.5'>
          <FontAwesome6 name='circle-check' iconStyle='solid' size={16} color={tokens.success} />
          <Text className='text-xs font-semibold' style={{ color: tokens.success }}>
            {t('home.rowCompleted')}
          </Text>
        </View>
      ) : (
        <FontAwesome6 name='circle' iconStyle='regular' size={18} color={withAlpha(tokens.textPrimary, 0.3)} />
      )}
    </Pressable>
  )
}

export function TodaysVirdCard({ onPressCard, highlightSlot }: TodaysVirdCardProps) {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('vird')
  const upper = useLocaleUpper()
  const router = useRouter()

  const authStatus = useAuthStore((state) => state.status)
  const virdStreak = useVirdStore((state) => state.virdStreak)
  const programs = useVirdStore((state) => state.programs)
  const activeProgramId = useVirdStore((state) => state.activeProgramId)
  const dayProgress = useVirdStore((state) => state.dayProgress)
  const reminderCoords = useVirdStore((state) => state.reminderPrefs.coords)

  const activeProgram = useMemo<VirdProgramLocal | null>(
    () => programs.find((program) => program.id === activeProgramId) ?? null,
    [programs, activeProgramId]
  )

  // Sunucudan taze gelmiş bir programda `dhikrs` boş olabilir (bkz.
  // features/vird/README.md) — bu tembel hidrasyon, kart açıldığında eksik
  // ref'leri doldurur ki oturum ekranı genel vird:home.itemFallbackName yer
  // tutucusuna DÜŞMESİN.
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

  // reminderCoords varsa (GPS izni verilip konum alınmışsa) "şimdi" hesabı
  // gerçek namaz vakitlerine göre yapılır (bkz. services/vird-now.ts) —
  // yoksa resolveNowSlot kendi saat aralığı sezgisine düşer.
  const prayerTimes = useMemo(() => (reminderCoords ? getPrayerTimes(reminderCoords, new Date()) : undefined), [reminderCoords])

  const nowSlot = useMemo(
    () => highlightSlot ?? resolveNowSlot(progress, new Date(), prayerTimes),
    [highlightSlot, progress, prayerTimes]
  )

  const streak = useMemo(() => {
    if (authStatus === 'authenticated' && virdStreak) {
      return virdStreak
    }
    return activeProgram ? calculateVirdStreak(activeProgram, dayProgress) : { currentStreak: 0, longestStreak: 0 }
  }, [authStatus, virdStreak, activeProgram, dayProgress])

  useEffect(() => {
    if (!activeProgram || !dayComplete) {
      return
    }
    const fireKey = `${activeProgram.id}:${todayKey}`
    if (dayCompletedFired.has(fireKey)) {
      return
    }
    dayCompletedFired.add(fireKey)
    void trackEvent('vird_day_completed')
  }, [activeProgram, dayComplete, todayKey])

  if (!activeProgram) {
    return <EmptyVirdCard onPressCard={onPressCard} />
  }

  const handleStart = (slot: VirdSlotKey) => (prayerIndex?: number) => {
    void trackEvent('vird_slot_started', { slot })
    router.push({
      pathname: '/vird/session',
      params: {
        programId: activeProgram.id,
        slot,
        ...(prayerIndex != null ? { prayerIndex: String(prayerIndex) } : {})
      }
    })
  }

  const totals = Object.values(progress).reduce(
    (acc, view) => ({ done: acc.done + (view?.done ?? 0), total: acc.total + (view?.total ?? 0) }),
    { done: 0, total: 0 }
  )
  const completionPercent = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0

  return (
    <View className='mb-5 px-5'>
      <Pressable
        onPress={onPressCard}
        disabled={!onPressCard}
        testID={TEST_IDS.vird.todayCard}
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
          <Text testID={TEST_IDS.vird.todayDone} className='mb-2 text-xs font-semibold' style={{ color: tokens.success }}>
            {t('home.dayCompleteBadge')}
          </Text>
        ) : totals.total > 0 ? (
          <Text className='mb-2 text-xs' style={{ color: tokens.textMuted }}>
            {t('home.completionPercent', { percent: completionPercent })}
            {nowSlot ? ` · ${t('home.nowLabel', { slot: t(`slots.${nowSlot}`) })}` : ''}
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
            return <SlotRow key={slot} slot={slot} view={view} isNow={slot === nowSlot} onStart={handleStart(slot)} />
          })
        )}
      </Pressable>
    </View>
  )
}

