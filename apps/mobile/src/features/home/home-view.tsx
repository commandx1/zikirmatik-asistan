import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useThemeTokens } from '@zikirmatik/ui'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Animated, InteractionManager, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { DhikrContentStack } from '../../components/ui/dhikr-content-stack'
import { DhikrResumeModal } from '../../components/ui/dhikr-resume-modal'
import { KeyboardAwareBottomSheetModal } from '../../components/ui/keyboard-aware-bottom-sheet-modal'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { UnsavedDhikrTransitionModal } from '../../components/ui/unsaved-dhikr-transition-modal'
import { useHomeContext } from './home-context'
import { AppleWatch } from './components/apple-watch'
import { useHomeNavigationIntentStore } from './services/home-navigation-intent-store'

const EsmaulHusnaSection = lazy(() =>
  import('./components/esmaul-husna-section').then((m) => ({ default: m.EsmaulHusnaSection }))
)
const DailyEsmaWelcomeModal = lazy(() =>
  import('./components/daily-esma-welcome-modal').then((m) => ({ default: m.DailyEsmaWelcomeModal }))
)

function TapAnywhereToggle({ onPress }: { onPress: () => void }) {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const active = home.tapAnywhereEnabled

  return (
    <Pressable
      onPress={onPress}
      className='h-9 w-9 items-center justify-center rounded-full border'
      style={{
        borderColor: active ? tokens.accent : withAlpha(tokens.textPrimary, 0.12),
        backgroundColor: active ? withAlpha(tokens.accent, 0.15) : 'transparent'
      }}
    >
      <FontAwesome6
        name='hand-pointer'
        size={14}
        color={active ? tokens.accent : tokens.textMuted}
      />
    </Pressable>
  )
}

function TapAnywhereToast({ message }: { message: string | null }) {
  const { tokens } = useThemeTokens()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(12)).current
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null)
  const [displayMessage, setDisplayMessage] = useState('')

  useEffect(() => {
    runningAnim.current?.stop()

    if (message) {
      setDisplayMessage(message)
      opacity.setValue(0)
      translateY.setValue(12)
      runningAnim.current = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true })
      ])
      runningAnim.current.start()
    } else {
      runningAnim.current = Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 180, useNativeDriver: true })
      ])
      runningAnim.current.start()
    }
  }, [message, opacity, translateY])

  return (
    <Animated.View
      pointerEvents='none'
      style={{
        position: 'absolute',
        top: 128,
        alignSelf: 'center',
        opacity,
        transform: [{ translateY }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: withAlpha(tokens.textPrimary, 0.12),
        backgroundColor: tokens.card
      }}
    >
      <FontAwesome6 name='hand-pointer' size={12} color={tokens.accent} />
      <Text className="text-sm" style={{ color: tokens.textPrimary, fontWeight: '500' }}>
        {displayMessage}
      </Text>
    </Animated.View>
  )
}

function TopBar({ onToggleTapAnywhere }: { onToggleTapAnywhere: () => void }) {
  const home = useHomeContext()

  return (
    <PageHeader
      title='Zikirmatik Asistan'
      subtitle={`${home.greeting} • Seri ${home.streakLabel}`}
      rightAccessory={<TapAnywhereToggle onPress={onToggleTapAnywhere} />}
    />
  )
}

function SelectedDhikrMeaning() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const title = (home.mainDhikr.nameTurkish || home.mainDhikr.transliteration || '').trim()
  const transliteration = home.mainDhikr.transliteration?.trim()
  const arabic = home.mainDhikr.arabic?.trim()
  const meaning = home.mainDhikr.meaning?.trim()
  const shouldShowTitleOnly = home.mainDhikr.source === 'personal' && !arabic && !meaning && Boolean(title)

  if (!title && !transliteration && !meaning && !arabic) {
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
        <Text className='mb-1 text-xs font-semibold uppercase tracking-[1.1px]' style={{ color: tokens.textMuted }}>
          Zikir Detayı
        </Text>
        {shouldShowTitleOnly ? (
          <View className='mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2'>
            <Text className='mb-1 text-xs font-semibold uppercase tracking-[0.9px] text-[--text-muted]'>
              Başlık
            </Text>
            <Text className='text-sm leading-5 text-[--text-primary]'>{title}</Text>
          </View>
        ) : (
          <DhikrContentStack
            arabic={arabic}
            transliteration={transliteration}
            meaning={meaning}
            order={['transliteration', 'meaning', 'arabic']}
          />
        )}
      </View>
    </View>
  )
}

function FreeModeButton() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  if (!home.selectedDhikrId) {
    return null
  }

  return (
    <View className='mb-4 px-5'>
      <Pressable
        onPress={home.onStartFreeMode}
        className='rounded-full border px-4 py-3'
        style={{ borderColor: withAlpha(tokens.textPrimary, 0.2), backgroundColor: withAlpha(tokens.card, 0.72) }}
      >
        <Text className='text-center text-sm font-semibold' style={{ color: tokens.textPrimary }}>
          Serbest Moda Geç
        </Text>
      </Pressable>
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

function TargetDowngradeWarningModal() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <Modal
      visible={home.isTargetDowngradeWarningOpen}
      transparent
      animationType='fade'
      onRequestClose={home.onTargetDowngradeCancel}
    >
      <View className='flex-1 items-center justify-center bg-black/55 px-6'>
        <View
          className='w-full max-w-[340px] rounded-2xl p-5'
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.12), backgroundColor: tokens.card }}
        >
          <Text className='mb-2 text-base font-semibold' style={{ color: tokens.textPrimary }}>
            Sayım kırpılacak
          </Text>
          <Text className='text-sm leading-5' style={{ color: tokens.textMuted }}>
            Mevcut sayımın{' '}
            <Text className='font-semibold' style={{ color: tokens.textPrimary }}>
              {home.targetDowngradeCurrentCount}
            </Text>{' '}
            adet. Yeni hedef{' '}
            <Text className='font-semibold' style={{ color: tokens.textPrimary }}>
              {home.targetDowngradePendingTarget}
            </Text>{' '}
            olarak uygulandığında sayımın{' '}
            <Text className='font-semibold' style={{ color: tokens.textPrimary }}>
              {home.targetDowngradePendingTarget}
            </Text>{' '}
            adede indirilecek.
          </Text>
          <View className='mt-5 gap-2'>
            <Pressable
              onPress={home.onTargetDowngradeConfirm}
              className='h-11 items-center justify-center rounded-full px-4'
              style={{ backgroundColor: tokens.accent }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.bg }}>
                Yine de Uygula
              </Text>
            </Pressable>
            <Pressable
              onPress={home.onTargetDowngradeCancel}
              className='h-10 items-center justify-center rounded-full px-4'
            >
              <Text className='text-sm font-medium' style={{ color: tokens.textMuted }}>
                İptal
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function FreeSaveNameModal() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <KeyboardAwareBottomSheetModal
      visible={home.isFreeSaveNameModalOpen}
      onRequestClose={home.onFreeSaveNameCancel}
      animationType='slide'
      showHandle
      overlayClassName='flex-1 justify-end bg-black/55'
      sheetClassName='rounded-t-3xl border-t border-white/10 bg-[--card] p-5 pb-10'
      scrollContentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className='mb-2 text-base font-semibold' style={{ color: tokens.textPrimary }}>
        Zikir Kaydet
      </Text>
      <Text className='mb-3 text-xs' style={{ color: tokens.textMuted }}>
        Serbest çektiğin zikri kaydetmek için bir isim yaz.
      </Text>
      <TextInput
        value={home.freeSaveNameDraft}
        onChangeText={home.onFreeSaveNameChange}
        autoFocus
        placeholder='Örn. Sessiz tesbih'
        placeholderTextColor={tokens.textMuted}
        className='mb-2 rounded-xl px-3 py-3 text-sm'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.accent, 0.4),
          backgroundColor: withAlpha(tokens.bg, 0.9),
          color: tokens.textPrimary
        }}
        onSubmitEditing={home.onFreeSaveNameSubmit}
      />
      <Text className='mb-1 mt-1 text-xs font-medium' style={{ color: tokens.textPrimary }}>
        Okunuş (opsiyonel)
      </Text>
      <TextInput
        value={home.freeSaveTransliterationDraft}
        onChangeText={home.onFreeSaveTransliterationChange}
        placeholder='Örn. Allahumme salli ala Muhammed'
        placeholderTextColor={tokens.textMuted}
        className='mb-2 rounded-xl px-3 py-3 text-sm'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.2),
          backgroundColor: withAlpha(tokens.bg, 0.9),
          color: tokens.textPrimary
        }}
      />
      <Text className='mb-1 mt-1 text-xs font-medium' style={{ color: tokens.textPrimary }}>
        Anlamı (opsiyonel)
      </Text>
      <TextInput
        value={home.freeSaveMeaningDraft}
        onChangeText={home.onFreeSaveMeaningChange}
        placeholder="Örn. Allah'ım Muhammed'e salat et"
        placeholderTextColor={tokens.textMuted}
        className='mb-2 rounded-xl px-3 py-3 text-sm'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.2),
          backgroundColor: withAlpha(tokens.bg, 0.9),
          color: tokens.textPrimary
        }}
      />
      <Text className='mb-1 mt-1 text-xs font-medium' style={{ color: tokens.textPrimary }}>
        Hedef (opsiyonel)
      </Text>
      <TextInput
        value={home.freeSaveTargetDraft}
        onChangeText={home.onFreeSaveTargetChange}
        keyboardType='number-pad'
        placeholder='Boş bırakırsan sonsuz'
        placeholderTextColor={tokens.textMuted}
        className='mb-2 rounded-xl px-3 py-3 text-sm'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.2),
          backgroundColor: withAlpha(tokens.bg, 0.9),
          color: tokens.textPrimary
        }}
        onSubmitEditing={home.onFreeSaveNameSubmit}
      />
      {home.freeSaveNameError ? <Text className='mb-3 text-xs text-[#F97373]'>{home.freeSaveNameError}</Text> : null}
      <View className='flex-row justify-end gap-2'>
        <Pressable
          onPress={home.onFreeSaveNameCancel}
          className='rounded-full px-4 py-2'
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.2) }}
        >
          <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
            İptal
          </Text>
        </Pressable>
        <Pressable
          onPress={home.onFreeSaveNameSubmit}
          className='rounded-full px-4 py-2'
          style={{ backgroundColor: tokens.accent }}
        >
          <Text className='text-sm font-semibold' style={{ color: tokens.bg }}>
            Kaydet
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareBottomSheetModal>
  )
}

export function HomeView() {
  const home = useHomeContext()
  const scrollRef = useRef<ScrollView>(null)
  const esmaSectionYRef = useRef(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMessage(
      home.tapAnywhereEnabled
        ? 'Ekranın her yerine dokunarak sayabilirsin'
        : 'Sadece yuvarlağa basınca sayar'
    )
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500)
  }, [home.tapAnywhereEnabled])
  const pendingDailyEsmaStart = useHomeNavigationIntentStore(state => state.pendingDailyEsmaStart)
  const consumeDailyEsmaStart = useHomeNavigationIntentStore(state => state.consumeDailyEsmaStart)
  const esmaListFocusRequestId = useHomeNavigationIntentStore(state => state.esmaListFocusRequestId)
  const consumeEsmaListFocus = useHomeNavigationIntentStore(state => state.consumeEsmaListFocus)
  const hasDhikrDetail =
    hasContent(home.mainDhikr.nameTurkish) ||
    hasContent(home.mainDhikr.transliteration) ||
    hasContent(home.mainDhikr.meaning) ||
    hasContent(home.mainDhikr.arabic)

  const showAllEsma = () => {
    home.onDailyEsmaShowAll()
    scrollToEsmaSection()
  }

  const scrollToEsmaSection = () => {
    InteractionManager.runAfterInteractions(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, esmaSectionYRef.current - 12),
        animated: true
      })
    })
  }

  useFocusEffect(useCallback(() => {
    if (!pendingDailyEsmaStart) {
      return
    }

    home.onEsmaPress(pendingDailyEsmaStart)
    consumeDailyEsmaStart()
  }, [consumeDailyEsmaStart, home, pendingDailyEsmaStart]))

  useFocusEffect(useCallback(() => {
    if (esmaListFocusRequestId <= 0) {
      return
    }

    scrollToEsmaSection()
    consumeEsmaListFocus(esmaListFocusRequestId)
  }, [consumeEsmaListFocus, esmaListFocusRequestId]))

  return (
    <PageLayout frameClassName='relative flex-1 w-full'>
      <TopBar onToggleTapAnywhere={home.toggleTapAnywhere} />
      <PageScrollView
        scrollRef={scrollRef}
        contentInnerClassName='w-full'
        contentContainerStyle={!hasDhikrDetail ? { flexGrow: 1, justifyContent: 'center' } : undefined}
        bottomPadding={hasDhikrDetail ? 32 : 0}
        onRefresh={home.refresh}
        refreshing={home.isRefreshing}
      >
        <Pressable onPress={home.tapAnywhereEnabled ? home.onCountPress : undefined} style={{ flex: 1 }}>
          <AppleWatch />
          <SelectedDhikrMeaning />
          <FreeModeButton />
          <View onLayout={event => {
            esmaSectionYRef.current = event.nativeEvent.layout.y
          }}>
            <Suspense fallback={null}>
              <EsmaulHusnaSection
                disabled={home.isSelectingEsmaDhikr}
                selectedTransliteration={home.mainDhikr.transliteration}
                onSelect={home.onEsmaPress}
              />
            </Suspense>
          </View>
        </Pressable>
      </PageScrollView>
      <DhikrResumeModal
        visible={home.isEsmaResumeGuardOpen}
        dhikrName={home.esmaResumeGuardDhikrName}
        currentCount={home.esmaResumeGuardCurrentCount}
        onContinue={home.onEsmaResumeGuardContinue}
        onFresh={home.onEsmaResumeGuardFresh}
        onCancel={home.onEsmaResumeGuardCancel}
      />
      <Suspense fallback={null}>
        <DailyEsmaWelcomeModal
          visible={home.isDailyEsmaWelcomeOpen}
          items={home.dailyEsmaSuggestions}
          onDismiss={home.onDailyEsmaDismiss}
          onShowAll={showAllEsma}
          onStart={home.onDailyEsmaStart}
        />
      </Suspense>
      <TargetModal />
      <TargetDowngradeWarningModal />
      <FreeSaveNameModal />
      <UnsavedDhikrTransitionModal
        visible={home.isUnsavedTransitionModalOpen}
        dhikrName={home.unsavedTransitionDhikrName}
        count={home.unsavedTransitionCount}
        isSaving={home.isSavingLog}
        error={home.unsavedTransitionError}
        onSaveAndContinue={home.onUnsavedTransitionSaveAndContinue}
        onContinueWithoutSaving={home.onUnsavedTransitionContinueWithoutSaving}
        onCancel={home.onUnsavedTransitionCancel}
      />
      <TapAnywhereToast message={toastMessage} />
    </PageLayout>
  )
}

function hasContent(value: string | undefined) {
  return Boolean(value?.trim())
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
