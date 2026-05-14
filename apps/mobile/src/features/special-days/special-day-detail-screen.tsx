import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useThemeTokens } from '@zikirmatik/ui'
import { DhikrContentStack } from '../../components/ui/dhikr-content-stack'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { ThemedCard } from '../../components/ui/themed-card'
import { useDhikrStore } from '../../store/dhikr-store'
import { useSpecialDayDetail } from './hooks/use-special-day-detail'

type SpecialDayDetailScreenProps = {
  id: string
}

export function SpecialDayDetailScreen({ id }: SpecialDayDetailScreenProps) {
  const router = useRouter()
  const { tokens } = useThemeTokens()
  const dhikrItems = useDhikrStore(state => state.items)
  const selectDhikr = useDhikrStore(state => state.selectDhikr)
  const setSelectedTarget = useDhikrStore(state => state.setSelectedTarget)
  const setSelectedCount = useDhikrStore(state => state.setSelectedCount)
  const detail = useSpecialDayDetail(id)

  return (
    <PageLayout>
      <View className='flex-1 w-full'>
        <PageHeader title='Özel Gün Detayı' />

        <PageScrollView
          contentInnerClassName='w-full px-5'
          bottomPadding={56}
          onRefresh={detail.refresh}
          refreshing={detail.isLoading}
        >
          {detail.error ? (
            <View className='mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3'>
              <Text className='text-[12px] text-[#fecaca]'>{detail.error}</Text>
            </View>
          ) : null}

          {!detail.detail ? null : (
            <>
              <ThemedCard className='rounded-2xl p-5' borderClassName='border-white/5' elevated>
                <Text className='text-xs font-semibold uppercase tracking-[1.1px] text-[--text-muted]'>
                  Özel Gün Detayı
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
                    Tamamlanan: {detail.detail.progress.completedCount}/{detail.detail.progress.totalCount}
                  </Text>
                </View>
              </ThemedCard>

              <ThemedCard className='mt-4 rounded-2xl p-4' borderClassName='border-white/5'>
                <Text className='text-[11px] font-semibold uppercase tracking-[1px] text-[--text-muted]'>
                  Günün Teması
                </Text>
                <Text className='mt-1 text-base font-semibold text-[--text-primary]'>{detail.detail.themeTitle}</Text>
                <Text className='mt-1 text-sm leading-6 text-[--text-muted]'>{detail.detail.themeSummary}</Text>
              </ThemedCard>

              <View className='mt-6 gap-3'>
                <Text className='px-1 text-sm font-semibold text-[--text-primary]'>Önerilen Zikirler</Text>
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
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isCompleted ? 'bg-[--success]/15 text-[--success]' : 'bg-[--accent]/15 text-[--accent]'
                          }`}
                        >
                          {isCompleted ? 'Tamamlandı' : `${progressCount}/${target}`}
                        </Text>
                      </View>

                      <DhikrContentStack
                        arabic={item.nameArabic}
                        transliteration={item.transliteration}
                        meaning={item.meaning}
                      />

                      <View className='mt-4'>
                        <View className='mb-2 flex-row items-center justify-between'>
                          <Text className='text-xs text-[--text-muted]'>Hedef: {target} tekrar</Text>
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
                          onPress={() => {
                            selectDhikr(item.id)
                            setSelectedTarget(target)
                            setSelectedCount(progressCount)
                            router.push('/(tabs)/home')
                          }}
                          className='rounded-full bg-[--accent] px-4 py-2'
                        >
                          <Text className='text-xs font-semibold' style={{ color: tokens.bg }}>
                            Başla
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
