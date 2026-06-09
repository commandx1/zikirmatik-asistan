import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import type { ThemeTokens } from '@zikirmatik/shared'
import { useThemeTokens } from '@zikirmatik/ui'
import { memo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { MarkdownRenderer } from '../../../components/ui/markdown-renderer'
import { ThemedCard } from '../../../components/ui/themed-card'
import { useZikirlerim } from '../context/zikirlerim-context'
import type { ZikirItem } from '../types'

type ZikirItemCardProps = {
  item: ZikirItem
  isSelected: boolean
  isDeleting: boolean
  isUpdatingThisItem: boolean
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

const EXPAND_DURATION = 280
const COLLAPSE_DURATION = 220

const AccordionContent = memo(function AccordionContent({ item, tokens }: { item: ZikirItem; tokens: ThemeTokens }) {
  return (
    <View
      className='pb-3 gap-2 pt-1'
      style={{ borderTopWidth: 1, borderTopColor: withAlpha(tokens.textMuted, 0.12) }}
    >
      {item.arabic ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='text-xl leading-9'
            style={{ color: tokens.textPrimary, textAlign: 'right', writingDirection: 'rtl' }}
          >
            {item.arabic}
          </Text>
        </View>
      ) : null}

      {item.meaning ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='mb-1 text-[10px] font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.textMuted }}
          >
            Anlam
          </Text>
          <Text className='text-xs leading-5' style={{ color: tokens.textPrimary, textAlign: 'justify' }}>
            {item.meaning}
          </Text>
        </View>
      ) : null}

      {item.virtue ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='mb-1 text-[10px] font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.textMuted }}
          >
            Fazilet
          </Text>
          <Text className='text-xs leading-5' style={{ color: tokens.textMuted, textAlign: 'justify' }}>
            {item.virtue}
          </Text>
        </View>
      ) : null}

      {item.contentSource ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='mb-1 text-[10px] font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.textMuted }}
          >
            Kaynak
          </Text>
          <Text className='text-xs leading-5' style={{ color: tokens.textMuted, textAlign: 'justify' }}>
            {item.contentSource}
          </Text>
        </View>
      ) : null}

      {item.aiPrompt ? (
        <View
          className='flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.accent, 0.3),
            backgroundColor: withAlpha(tokens.accent, 0.1)
          }}
        >
          <FontAwesome6 name='sparkles' iconStyle='solid' size={9} color={tokens.accent} />
          <Text
            className='text-[10px] font-medium'
            style={{ color: tokens.accent, maxWidth: 220 }}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {item.aiPrompt}
          </Text>
        </View>
      ) : null}

      {item.aiAssistantNote ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.accent, 0.2),
            backgroundColor: withAlpha(tokens.accent, 0.06)
          }}
        >
          <Text
            className='mb-1.5 text-[10px] font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.accent }}
          >
            Asistan Notu
          </Text>
          <MarkdownRenderer markdown={item.aiAssistantNote} />
        </View>
      ) : null}
    </View>
  )
})

export const ZikirItemCard = memo(function ZikirItemCard({ item, isSelected, isDeleting, isUpdatingThisItem }: ZikirItemCardProps) {
  const { tokens } = useThemeTokens()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const animMaxHeight = useSharedValue(0)
  const animOpacity = useSharedValue(0)
  const animChevron = useSharedValue(0)

  const { toggleFavorite, selectDhikr, startDhikrOnHome, deleteDhikr, openUpdateModal } = useZikirlerim()

  const progressPct = item.target === 0 ? 0 : Math.min(100, Math.round((item.current / item.target) * 100))
  const accent = resolveAccent(item)
  const targetLabel = item.target > 0 ? String(item.target) : '∞'
  const title = item.nameTurkish || item.transliteration
  const showTransliteration = item.transliteration && item.transliteration !== title

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

  const hasDetails = !!(item.arabic || item.meaning || item.virtue || item.contentSource || item.aiPrompt || item.aiAssistantNote)

  const accordionStyle = useAnimatedStyle(() => ({
    maxHeight: animMaxHeight.value,
    opacity: animOpacity.value,
    overflow: 'hidden'
  }))

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animChevron.value * 180}deg` }]
  }))

  const toggle = () => {
    const next = !isExpanded
    setIsExpanded(next)
    animMaxHeight.value = withTiming(next ? 4000 : 0, {
      duration: next ? EXPAND_DURATION : COLLAPSE_DURATION,
      easing: Easing.out(Easing.cubic)
    })
    animOpacity.value = withTiming(next ? 1 : 0, {
      duration: next ? EXPAND_DURATION : COLLAPSE_DURATION - 40
    })
    animChevron.value = withTiming(next ? 1 : 0, {
      duration: next ? EXPAND_DURATION : COLLAPSE_DURATION,
      easing: Easing.out(Easing.cubic)
    })
  }

  return (
    <ThemedCard
      className='rounded-2xl p-4'
      accent={accent.cardAccent}
      elevated
      style={isSelected ? { boxShadow: '0 0 0 1px rgba(214,169,61,0.55)' } : undefined}
    >
      {/* Header */}
      <View className='mb-3 flex-row items-start justify-between'>
        <View className='flex-1 pr-3'>
          <Text className='text-sm font-medium text-[--text-primary]'>{title}</Text>
          {showTransliteration ? (
            <Text className='mt-1 text-xs text-[--text-muted]'>{item.transliteration}</Text>
          ) : null}
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

      {/* Progress */}
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

      {/* Meta */}
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

      {/* Detaylar toggle */}
      {hasDetails ? (
        <View className='mb-3 flex-row items-center gap-2'>
          <Pressable
            onPress={toggle}
            className='flex-row items-center gap-1.5 rounded-full border px-3 py-1.5'
            style={{
              borderColor: withAlpha(tokens.textMuted, 0.25),
              backgroundColor: withAlpha(tokens.textMuted, 0.07)
            }}
          >
            <Text className='text-[11px]' style={{ color: tokens.textMuted }}>Detaylar</Text>
            <Animated.View style={chevronStyle}>
              <FontAwesome6 name='chevron-down' size={8} color={tokens.textMuted} />
            </Animated.View>
          </Pressable>

          {item.aiPrompt ? (
            <View
              className='flex-row items-center gap-1 rounded-full border px-2.5 py-1.5'
              style={{
                borderColor: withAlpha(tokens.accent, 0.35),
                backgroundColor: withAlpha(tokens.accent, 0.1)
              }}
            >
              <FontAwesome6 name='sparkles' iconStyle='solid' size={9} color={tokens.accent} />
              <Text className='text-[10px] font-semibold' style={{ color: tokens.accent }}>
                AI Önerisi
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Accordion */}
      <Animated.View style={accordionStyle}>
        <AccordionContent item={item} tokens={tokens} />
      </Animated.View>

      {/* Action buttons */}
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
            <Text
              className={`text-xs ${isSelected ? 'font-semibold' : 'font-medium'}`}
              style={{ color: isSelected ? selectActiveTextColor : selectIdleTextColor }}
            >
              {isSelected ? 'Seçili' : 'Seç'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => startDhikrOnHome(item.id)}
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
})

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
