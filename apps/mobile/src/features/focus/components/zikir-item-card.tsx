import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useThemeTokens } from '@zikirmatik/ui'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
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
  const { tokens } = useThemeTokens()
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const {
    toggleFavorite,
    selectDhikr,
    startDhikrOnHome,
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
  const title = item.nameTurkish || item.transliteration
  const updateBorderColor = withAlpha(tokens.accent, 0.42)
  const updateBackgroundColor = withAlpha(tokens.accent, 0.12)
  const updateTextColor = tokens.accent
  const dangerBase = '#EF4444'
  const deleteBorderColor = withAlpha(dangerBase, 0.58)
  const deleteBackgroundColor = withAlpha(dangerBase, 0.2)
  const deleteTextColor = deleteBorderColor
  const selectIdleBorderColor = withAlpha(tokens.textPrimary, 0.14)
  const selectIdleBackgroundColor = withAlpha(tokens.bg, 0.85)
  const selectIdleTextColor = tokens.textPrimary
  const selectActiveBorderColor = withAlpha(tokens.accent, 0.42)
  const selectActiveBackgroundColor = withAlpha(tokens.accent, 0.18)
  const selectActiveTextColor = tokens.accent

  return (
    <ThemedCard
      className='rounded-2xl p-4'
      accent={accent.cardAccent}
      elevated
      style={isSelected ? { boxShadow: '0 0 0 1px rgba(214,169,61,0.55)' } : undefined}
    >
      <View className='mb-3 flex-row items-start justify-between'>
        <View className='flex-1 pr-3'>
          <Text className='mb-2 text-sm font-medium text-[--text-primary]'>{title}</Text>
          {item.transliteration ? (
            <Text className='mb-1 text-xs text-[--text-muted]'>{item.transliteration}</Text>
          ) : null}
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
              className={`rounded-full border px-3 py-2 ${isUpdatingThisItem ? 'opacity-60' : ''}`}
              style={{ borderColor: updateBorderColor, backgroundColor: updateBackgroundColor }}
            >
              <Text className='text-xs font-semibold' style={{ color: updateTextColor }}>
                {isUpdatingThisItem ? 'Güncelleniyor' : 'Güncelle'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            disabled={isDeleting}
            onPress={() => setIsDeleteConfirmVisible(true)}
            className={`rounded-full border px-3 py-2 ${isDeleting ? 'opacity-60' : ''}`}
            style={{ borderColor: deleteBorderColor, backgroundColor: deleteBackgroundColor }}
          >
            <Text className='text-xs font-semibold' style={{ color: deleteTextColor }}>
              {isDeleting ? 'Siliniyor' : 'Sil'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => selectDhikr(item.id)}
            className='rounded-full border px-3 py-2'
            style={{
              borderColor: isSelected ? selectActiveBorderColor : selectIdleBorderColor,
              backgroundColor: isSelected ? selectActiveBackgroundColor : selectIdleBackgroundColor
            }}
          >
            <Text className={`text-xs ${isSelected ? 'font-semibold' : 'font-medium'}`} style={{ color: isSelected ? selectActiveTextColor : selectIdleTextColor }}>
              {isSelected ? 'Seçili' : 'Seç'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            startDhikrOnHome(item.id)
          }}
          className='rounded-full bg-[--accent] px-3 py-2'
        >
          <Text className='text-xs font-semibold text-[#111827]'>Ana Sayfa'da Başlat</Text>
        </Pressable>
      </View>
      <ConfirmModal
        visible={isDeleteConfirmVisible}
        title='Zikri Sil'
        message='Bu zikri Zikirlerim listesinden kaldırmak istediğine emin misin?'
        confirmLabel='Sil'
        cancelLabel='Vazgeç'
        destructive
        onConfirm={() => {
          setIsDeleteConfirmVisible(false)
          void deleteDhikr(item)
        }}
        onCancel={() => setIsDeleteConfirmVisible(false)}
      />
    </ThemedCard>
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
