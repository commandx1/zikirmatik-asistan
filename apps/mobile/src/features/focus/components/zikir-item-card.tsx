import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useRouter } from 'expo-router'
import { Alert, Pressable, Text, View } from 'react-native'
import { ThemedCard } from '../../../components/ui/themed-card'
import { useZikirlerim } from '../context/zikirlerim-context'
import type { ZikirItem } from '../types'

type ZikirItemCardProps = {
  item: ZikirItem
}

function resolveAccent(item: ZikirItem) {
  if (item.target > 0 && item.current >= item.target) {
    return {
      cardAccent: 'success' as const,
      progressColor: '#2E7D5E',
      countClassName: 'text-[#4CAF7D]',
      isCompleted: true
    }
  }

  if (item.source === 'personal') {
    return {
      cardAccent: 'muted' as const,
      progressColor: '#6B8FD6',
      countClassName: 'text-[#D5E2FF]',
      isCompleted: false
    }
  }

  if (item.id === 'estagfirullah') {
    return {
      cardAccent: 'accent' as const,
      progressColor: 'var(--accent)',
      countClassName: 'text-[--accent]',
      isCompleted: false
    }
  }

  return {
    cardAccent: 'muted' as const,
    progressColor: '#8CA0C2',
    countClassName: 'text-[--text-primary]',
    isCompleted: false
  }
}

export function ZikirItemCard({ item }: ZikirItemCardProps) {
  const router = useRouter()
  const {
    toggleFavorite,
    selectDhikr,
    selectedDhikrId,
    deleteDhikr,
    deletingDhikrId,
    editingDhikr,
    isUpdatingDhikr,
    openUpdateModal
  } = useZikirlerim()
  const progressPct = item.target === 0 ? 0 : Math.min(100, Math.round((item.current / item.target) * 100))
  const accent = resolveAccent(item)
  const isSelected = selectedDhikrId === item.id
  const isDeleting = deletingDhikrId === item.id
  const isUpdatingThisItem = isUpdatingDhikr && editingDhikr?.id === item.id
  const targetLabel = item.target > 0 ? String(item.target) : '∞'

  return (
    <ThemedCard
      className='rounded-2xl p-4'
      accent={accent.cardAccent}
      elevated
      style={isSelected ? { boxShadow: '0 0 0 1px rgba(214,169,61,0.55)' } : undefined}
    >
      <View className='mb-3 flex-row items-start justify-between'>
        <View className='flex-1 pr-3'>
          <Text className='mb-2 text-sm font-medium text-[--text-primary]'>{item.transliteration}</Text>
          {item.meaning ? <Text className='text-xs text-[--text-muted]'>{item.meaning}</Text> : null}
        </View>

        <Pressable
          onPress={() => toggleFavorite(item.id)}
          className='h-8 w-8 items-center justify-center rounded-full bg-[--bg]'
        >
          <FontAwesome6
            name='star'
            size={14}
            color={item.isFavorite ? '#D6A93D' : '#9AA5BD'}
            iconStyle={item.isFavorite ? 'solid' : 'regular'}
          />
        </Pressable>
      </View>

      <View className='mb-3 flex-row items-center gap-3'>
        <View className='h-2 flex-1 overflow-hidden rounded-full bg-[--bg]'>
          <View
            className='h-full rounded-full'
            style={{ width: `${progressPct}%`, backgroundColor: accent.progressColor }}
          />
        </View>

        {accent.isCompleted ? (
          <View className='flex-row items-center gap-1'>
            <FontAwesome6 name='check' size={11} color='#4CAF7D' />
            <Text className={`text-xs font-semibold ${accent.countClassName}`}>
              {item.current}/{targetLabel}
            </Text>
          </View>
        ) : (
          <Text className={`text-xs font-semibold ${accent.countClassName}`}>
            {item.current}/{targetLabel}
          </Text>
        )}
      </View>

      <View className='mb-3 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-1'>
          <FontAwesome6 name='clock' iconStyle='regular' size={12} color='#9AA5BD' />
          <Text className='text-xs text-[--text-muted]'>{item.lastActivityLabel}</Text>
        </View>
        <View className='flex-row items-center gap-1'>
          <FontAwesome6 name='fire' size={12} color='#4CAF7D' />
          <Text className='text-xs text-[--text-muted]'>{item.streakDays} gün</Text>
        </View>
      </View>

      <View className='flex-row items-center justify-between gap-2'>
        <View className='flex-row items-center gap-2'>
          {item.source === 'personal' ? (
            <Pressable
              disabled={isUpdatingThisItem}
              onPress={() => openUpdateModal(item)}
              className={
                isUpdatingThisItem
                  ? 'rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 opacity-60'
                  : 'rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2'
              }
            >
              <Text className='text-xs font-semibold text-cyan-200'>
                {isUpdatingThisItem ? 'Güncelleniyor' : 'Güncelle'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            disabled={isDeleting}
            onPress={() => {
              Alert.alert(
                'Zikri Sil',
                'Bu zikri Zikirlerim listesinden kaldırmak istediğine emin misin?',
                [
                  { text: 'Vazgeç', style: 'cancel' },
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                      void deleteDhikr(item)
                    }
                  }
                ]
              )
            }}
            className={
              isDeleting
                ? 'rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 opacity-60'
                : 'rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2'
            }
          >
            <Text className='text-xs font-semibold text-red-300'>{isDeleting ? 'Siliniyor' : 'Sil'}</Text>
          </Pressable>

          <Pressable
            onPress={() => selectDhikr(item.id)}
            className={
              isSelected
                ? 'rounded-full border border-[--accent]/35 bg-[--accent]/20 px-3 py-2'
                : 'rounded-full border border-white/10 bg-[--bg] px-3 py-2'
            }
          >
            <Text
              className={
                isSelected ? 'text-xs font-semibold text-[--accent]' : 'text-xs font-medium text-[--text-primary]'
              }
            >
              {isSelected ? 'Seçili' : 'Seç'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            selectDhikr(item.id)
            router.push('/(tabs)/home')
          }}
          className='rounded-full bg-[--accent] px-3 py-2'
        >
          <Text className='text-xs font-semibold text-[#111827]'>Ana Sayfa'da Başlat</Text>
        </Pressable>
      </View>
    </ThemedCard>
  )
}
