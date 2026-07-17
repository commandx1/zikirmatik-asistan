import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import type { ThemeTokens } from '@zikirmatik/shared'
import { useThemeTokens } from '@zikirmatik/ui'
import { memo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
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
import { resolveLocalizedText } from '../../../store/dhikr-store'
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
  const { t, i18n } = useTranslation('focus')
  const locale = (i18n.language === 'en' ? 'en' : 'tr') as 'tr' | 'en'
  const meaningText = item.meaning ? resolveLocalizedText(item.meaning, locale) : ''
  const virtueText = item.virtue ? resolveLocalizedText(item.virtue, locale) : ''
  const contentSourceText = item.contentSource ? resolveLocalizedText(item.contentSource, locale) : ''
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

      {meaningText ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='mb-1 text-xs font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.textMuted }}
          >
            {t('focus:card.meaning')}
          </Text>
          <Text className='text-xs leading-5' style={{ color: tokens.textPrimary, textAlign: 'justify' }}>
            {meaningText}
          </Text>
        </View>
      ) : null}

      {virtueText ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='mb-1 text-xs font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.textMuted }}
          >
            {t('focus:card.virtue')}
          </Text>
          <Text className='text-xs leading-5' style={{ color: tokens.textMuted, textAlign: 'justify' }}>
            {virtueText}
          </Text>
        </View>
      ) : null}

      {contentSourceText ? (
        <View
          className='rounded-xl px-3 py-2.5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textMuted, 0.15),
            backgroundColor: withAlpha(tokens.textMuted, 0.05)
          }}
        >
          <Text
            className='mb-1 text-xs font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.textMuted }}
          >
            {t('focus:card.source')}
          </Text>
          <Text className='text-xs leading-5' style={{ color: tokens.textMuted, textAlign: 'justify' }}>
            {contentSourceText}
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
            className='text-xs font-medium'
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
            className='mb-1.5 text-xs font-semibold uppercase tracking-[0.9px]'
            style={{ color: tokens.accent }}
          >
            {t('focus:card.assistantNote')}
          </Text>
          <MarkdownRenderer markdown={item.aiAssistantNote} />
        </View>
      ) : null}
    </View>
  )
})

export const ZikirItemCard = memo(function ZikirItemCard({ item, isSelected, isDeleting, isUpdatingThisItem }: ZikirItemCardProps) {
  const { t, i18n } = useTranslation('focus')
  const locale = (i18n.language === 'en' ? 'en' : 'tr') as 'tr' | 'en'
  const { tokens } = useThemeTokens()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const animMaxHeight = useSharedValue(0)
  const animOpacity = useSharedValue(0)
  const animChevron = useSharedValue(0)
  const animMenuHeight = useSharedValue(0)
  const animMenuOpacity = useSharedValue(0)

  const { toggleFavorite, startDhikrOnHome, deleteDhikr, openUpdateModal } = useZikirlerim()

  const progressPct = item.target === 0 ? 0 : Math.min(100, Math.round((item.current / item.target) * 100))
  const accent = resolveAccent(item)
  const targetLabel = item.target > 0 ? String(item.target) : '∞'
  const resolvedTransliteration = resolveLocalizedText(item.transliteration, locale)
  const title = resolveLocalizedText(item.name, locale) || resolvedTransliteration
  const showTransliteration = resolvedTransliteration && resolvedTransliteration !== title
  const hasDetails = !!(item.arabic || item.meaning || item.virtue || item.contentSource || item.aiPrompt || item.aiAssistantNote)

  const dangerBase = '#EF4444'

  const accordionStyle = useAnimatedStyle(() => ({
    maxHeight: animMaxHeight.value,
    opacity: animOpacity.value,
    overflow: 'hidden'
  }))

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animChevron.value * 180}deg` }]
  }))

  const menuStyle = useAnimatedStyle(() => ({
    maxHeight: animMenuHeight.value,
    opacity: animMenuOpacity.value,
    overflow: 'hidden'
  }))

  const toggle = () => {
    const next = !isExpanded
    setIsExpanded(next)
    animMaxHeight.value = withTiming(next ? 4000 : 0, { duration: next ? EXPAND_DURATION : COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
    animOpacity.value = withTiming(next ? 1 : 0, { duration: next ? EXPAND_DURATION : COLLAPSE_DURATION - 40 })
    animChevron.value = withTiming(next ? 1 : 0, { duration: next ? EXPAND_DURATION : COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
  }

  const toggleMenu = () => {
    const next = !isMenuOpen
    setIsMenuOpen(next)
    animMenuHeight.value = withTiming(next ? 200 : 0, { duration: next ? EXPAND_DURATION : COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
    animMenuOpacity.value = withTiming(next ? 1 : 0, { duration: next ? EXPAND_DURATION : COLLAPSE_DURATION - 40 })
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
            <Text className='mt-1 text-xs text-[--text-muted]'>{resolvedTransliteration}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={toggleMenu}
          className='h-8 w-8 items-center justify-center rounded-full bg-[--bg]'
          style={isMenuOpen ? { backgroundColor: withAlpha(tokens.textPrimary, 0.1) } : undefined}
        >
          <FontAwesome6 name='ellipsis' size={14} color={tokens.textMuted} />
        </Pressable>
      </View>

      {/* Overflow menu strip */}
      <Animated.View style={menuStyle}>
        <View
          className='mb-3 flex-row items-center gap-2 rounded-xl px-3 py-2.5'
          style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.04), borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.08) }}
        >
          <Pressable
            onPress={() => { toggleFavorite(item.id) }}
            className='flex-row items-center gap-1.5 rounded-full border px-3 py-1.5'
            style={{
              borderColor: item.isFavorite ? withAlpha('#D6A93D', 0.5) : withAlpha(tokens.textMuted, 0.25),
              backgroundColor: item.isFavorite ? withAlpha('#D6A93D', 0.12) : withAlpha(tokens.textMuted, 0.07)
            }}
          >
            <FontAwesome6 name='star' size={10} color={item.isFavorite ? '#D6A93D' : tokens.textMuted} iconStyle={item.isFavorite ? 'solid' : 'regular'} />
            <Text className='text-xs font-semibold' style={{ color: item.isFavorite ? '#D6A93D' : tokens.textMuted }}>
              {item.isFavorite ? t('focus:card.favorited') : t('focus:card.addToFavorites')}
            </Text>
          </Pressable>
          {item.source === 'personal' ? (
            <Pressable
              disabled={isUpdatingThisItem}
              onPress={() => { toggleMenu(); openUpdateModal(item) }}
              className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${isUpdatingThisItem ? 'opacity-60' : ''}`}
              style={{ borderColor: withAlpha(tokens.accent, 0.42), backgroundColor: withAlpha(tokens.accent, 0.12) }}
            >
              <FontAwesome6 name='pen' size={10} color={tokens.accent} />
              <Text className='text-xs font-semibold' style={{ color: tokens.accent }}>
                {isUpdatingThisItem ? t('focus:card.updating') : t('focus:card.update')}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            disabled={isDeleting}
            onPress={() => { toggleMenu(); setIsDeleteConfirmVisible(true) }}
            className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${isDeleting ? 'opacity-60' : ''}`}
            style={{ borderColor: withAlpha(dangerBase, 0.5), backgroundColor: withAlpha(dangerBase, 0.12) }}
          >
            <FontAwesome6 name='trash' size={10} color={dangerBase} />
            <Text className='text-xs font-semibold' style={{ color: dangerBase }}>
              {isDeleting ? t('focus:card.deleting') : t('focus:card.delete')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>

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
            <Text className={`text-xs font-semibold ${accent.countClassName}`}>{item.current}/{targetLabel}</Text>
          </View>
        ) : (
          <Text className={`text-xs font-semibold ${accent.countClassName}`}>{item.current}/{targetLabel}</Text>
        )}
      </View>

      {/* Meta */}
      <View
        className='mb-3 flex-row items-center justify-between pb-3'
        style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(tokens.textPrimary, 0.07) }}
      >
        <View className='flex-row items-center gap-1'>
          <FontAwesome6 name='clock' iconStyle='regular' size={12} color='#9AA5BD' />
          <Text className='text-xs text-[--text-muted]'>{item.lastActivityLabel}</Text>
        </View>
        <View className='flex-row items-center gap-1'>
          <FontAwesome6 name='fire' size={12} color='#4CAF7D' />
          <Text className='text-xs text-[--text-muted]'>{t('focus:card.streakDays', { count: item.streakDays })}</Text>
        </View>
      </View>

      {/* Accordion */}
      <Animated.View style={accordionStyle}>
        <AccordionContent item={item} tokens={tokens} />
      </Animated.View>

      {/* Footer */}
      <View className='flex-row items-center justify-between gap-2'>
        <View className='flex-row items-center gap-2'>
          {hasDetails ? (
            <Pressable
              onPress={toggle}
              className='flex-row items-center gap-1.5 rounded-full border px-3 py-1.5'
              style={{ borderColor: withAlpha(tokens.textMuted, 0.25), backgroundColor: withAlpha(tokens.textMuted, 0.07) }}
            >
              <Text className='text-xs' style={{ color: tokens.textMuted }}>{t('focus:card.detail')}</Text>
              <Animated.View style={chevronStyle}>
                <FontAwesome6 name='chevron-down' size={8} color={tokens.textMuted} />
              </Animated.View>
            </Pressable>
          ) : null}
          {item.aiPrompt ? (
            <View
              className='flex-row items-center gap-1 rounded-full border px-2.5 py-1.5'
              style={{ borderColor: withAlpha(tokens.accent, 0.35), backgroundColor: withAlpha(tokens.accent, 0.1) }}
            >
              <Text className='text-xs font-semibold' style={{ color: tokens.accent }}>{t('focus:card.assistant')}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => startDhikrOnHome(item.id)}
          className='flex-row items-center gap-1.5 rounded-full bg-[--accent] px-3 py-1.5'
        >
          <Text className='text-xs font-semibold text-[#111827]'>{t('focus:card.start')}</Text>
          <FontAwesome6 name='arrow-right' size={9} color='#111827' />
        </Pressable>
      </View>

      <ConfirmModal
        visible={isDeleteConfirmVisible}
        title={t('focus:card.deleteModal.title')}
        message={t('focus:card.deleteModal.message')}
        confirmLabel={t('focus:card.deleteModal.confirmLabel')}
        cancelLabel={t('focus:card.deleteModal.cancelLabel')}
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
