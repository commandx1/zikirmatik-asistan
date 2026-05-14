import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useState } from 'react'
import { useThemeTokens } from '@zikirmatik/ui'
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { DhikrContentStack } from '../../components/ui/dhikr-content-stack'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { useHomeContext } from './home-context'
import { AppleWatch } from './components/apple-watch'
import { StyleSheet } from 'react-native-css-interop'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function TopBar() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <PageHeader
      title='Ana Sayfa'
      subtitle={`${home.greeting} • Seri ${home.streakLabel}`}
      rightAccessory={
        <Pressable className='h-8 w-8 items-center justify-center'>
          <FontAwesome6 name='bell' size={16} color={tokens.textMuted} iconStyle='regular' />
          <View
            className='absolute right-[6px] top-[4px] h-2 w-2 rounded-full border bg-[#ef4444]'
            style={{ borderColor: tokens.bg }}
          />
        </Pressable>
      }
    />
  )
}

function RecommendationCard() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const insets = useSafeAreaInsets()
  const [isOpen, setIsOpen] = useState(false)
  const HIDDEN_TRANSLATE_Y = -520

  const translateY = useSharedValue(HIDDEN_TRANSLATE_Y)
  const overlayOpacity = useSharedValue(0)

  const open = () => {
    setIsOpen(true)
    home.onRecommendationOpen()
    translateY.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) })
    overlayOpacity.value = withTiming(1, { duration: 300 })
  }

  const close = () => {
    translateY.value = withTiming(HIDDEN_TRANSLATE_Y, { duration: 320, easing: Easing.in(Easing.cubic) }, finished => {
      if (finished) runOnJS(setIsOpen)(false)
    })
    overlayOpacity.value = withTiming(0, { duration: 280 })
  }

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value
  }))

  return (
    <>
      {/* Bubble — her zaman görünür, absolute */}
      <Pressable
        onPress={open}
        className='animate-pulse'
        style={{
          position: 'absolute',
          top: 0,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.card,
          borderWidth: 1,
          borderColor: withAlpha(tokens.accent, 0.35),
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
        }}
      >
        <FontAwesome6 name='circle-question' size={16} color={tokens.accent} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType='none' onRequestClose={close}>
        <View style={{ flex: 1 }}>
          <Animated.View
            pointerEvents='none'
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)' }, overlayStyle]}
          />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />

          {/* Kart — üstten iner */}
          <Animated.View
            style={[cardStyle, { position: 'absolute', top: insets.top + 48, left: 20, right: 20 }]}
            pointerEvents='box-none'
          >
            <View
              style={{
                borderRadius: 20,
                padding: 16,
                backgroundColor: tokens.card,
                borderLeftWidth: 3,
                borderLeftColor: tokens.accent,
                overflow: 'hidden'
              }}
            >
              {/* Dekoratif daire */}
              <View
                className='absolute -left-16 -bottom-16 h-32 w-32 rounded-full'
                style={{ backgroundColor: withAlpha(tokens.accent, 0.08) }}
              />
              <View
                className='absolute -right-16 -top-16 h-32 w-32 rounded-full'
                style={{ backgroundColor: withAlpha(tokens.accent, 0.08) }}
              />

              <View className='flex-row items-start gap-3'>
                <View className='mt-1'>
                  <FontAwesome6 name='sparkles' iconStyle='solid' size={12} color={tokens.accent} />
                </View>
                <View className='flex-1'>
                  <Text className='mb-3 pr-2 text-sm leading-relaxed' style={{ color: tokens.textPrimary }}>
                    {home.recommendation}
                  </Text>
                    <View className='items-end'>
                      <View className='flex-row items-center gap-2'>
                        <Pressable
                          onPress={close}
                          className='rounded-full px-4 py-1.5'
                          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.2) }}
                        >
                          <Text className='text-xs font-semibold' style={{ color: tokens.textMuted }}>
                            Kapat
                          </Text>
                        </Pressable>
                      <Pressable
                        onPress={() => {
                          home.onApplyRecommendation()
                          close()
                        }}
                        disabled={!home.hasApplicableRecommendation}
                        className={`rounded-full px-4 py-1.5 ${!home.hasApplicableRecommendation ? 'opacity-50' : ''}`}
                        style={{ borderWidth: 1, borderColor: withAlpha(tokens.accent, 0.4) }}
                      >
                        <Text className='text-xs font-semibold' style={{ color: tokens.accent }}>
                          {home.hasApplicableRecommendation ? 'Uygula' : 'Hazırlanıyor'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  )
}

function QuickAccessList() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <View className='mb-1 w-full'>
      <Text className='mb-3 px-6 text-xs font-semibold uppercase tracking-[1.3px]' style={{ color: tokens.textMuted }}>
        Bugünkü Zikirler
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      >
        <View className='flex-row gap-2.5'>
          {home.quickDhikrs.map(item => {
            const active = item === home.activeQuickDhikr
            return (
              <Pressable
                key={item}
                onPress={() => home.onQuickDhikrSelect(item)}
                className={active ? 'rounded-full px-4 py-2.5' : 'rounded-full border px-4 py-2.5'}
                style={
                  active
                    ? { backgroundColor: tokens.accent }
                    : { borderColor: withAlpha(tokens.textPrimary, 0.08), backgroundColor: tokens.card }
                }
              >
                <Text className='text-sm font-medium' style={{ color: active ? tokens.bg : tokens.textPrimary }}>
                  {item}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

function SelectedDhikrMeaning() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const transliteration = home.mainDhikr.turkish?.trim()
  const arabic = home.mainDhikr.arabic?.trim()
  const meaning = home.mainDhikr.meaning?.trim()

  if (!transliteration && !meaning && !arabic) {
    return null
  }

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
        <Text className='mb-1 text-[11px] font-semibold uppercase tracking-[1.1px]' style={{ color: tokens.textMuted }}>
          Zikir Detayı
        </Text>
        <DhikrContentStack
          arabic={arabic}
          transliteration={transliteration}
          meaning={meaning}
          order={['transliteration', 'meaning', 'arabic']}
        />
      </View>
    </View>
  )
}

function TargetModal() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <Modal visible={home.isEditingTarget} transparent animationType='fade' onRequestClose={home.onTargetCancel}>
      <View className='flex-1 items-center justify-center bg-black/50 px-6'>
        <View
          className='w-full max-w-[320px] rounded-2xl p-5'
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.1), backgroundColor: tokens.card }}
        >
          <Text className='mb-3 text-base font-semibold' style={{ color: tokens.textPrimary }}>
            Yeni hedef belirle
          </Text>
          <TextInput
            value={home.targetDraft}
            onChangeText={home.onTargetDraftChange}
            keyboardType='number-pad'
            autoFocus
            selectTextOnFocus
            placeholder='Hedef sayısı'
            placeholderTextColor={tokens.textMuted}
            className='mb-4 rounded-xl px-3 py-3 text-sm'
            style={{
              borderWidth: 1,
              borderColor: withAlpha(tokens.accent, 0.4),
              backgroundColor: withAlpha(tokens.bg, 0.9),
              color: tokens.textPrimary
            }}
            onSubmitEditing={home.onTargetSubmit}
          />
          <View className='flex-row justify-end gap-2'>
            <Pressable
              onPress={home.onTargetCancel}
              className='rounded-full px-4 py-2'
              style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.2) }}
            >
              <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
                İptal
              </Text>
            </Pressable>
            <Pressable
              onPress={home.onTargetSubmit}
              className='rounded-full px-4 py-2'
              style={{ backgroundColor: tokens.accent }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.bg }}>
                Kaydet
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function HomeView() {
  const home = useHomeContext()

  return (
    <PageLayout frameClassName='relative flex-1 w-full max-w-[375px]'>
      <TopBar />
      <PageScrollView
        contentInnerClassName='w-full'
        bottomPadding={32}
        onRefresh={home.refresh}
        refreshing={home.isRefreshing}
      >
        {home.isRecommendationVisible ? <RecommendationCard /> : null}
        <AppleWatch />
        <SelectedDhikrMeaning />
        <QuickAccessList />
      </PageScrollView>
      <TargetModal />
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
