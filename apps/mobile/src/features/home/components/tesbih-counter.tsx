import { useRouter } from 'expo-router'
import { memo, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useThemeTokens } from '@zikirmatik/ui'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { useThemePreferences } from '../../../hooks/use-theme-preferences'
import { useCounterStyleStore } from '../../../store/counter-style-store'
import { AppleWatchView, useHomeCounterModel, type AppleWatchProps, type CounterVisualViewProps } from './apple-watch'
import { TesbihStrand } from './tesbih-strand'
import { WatchControlButtons } from './watch-control-buttons'
import { withAlpha } from "@zikirmatik/shared";

const STRAND_SIZE = 224
const MEDALLION_PADDING = 22

/**
 * Premium "tesbih modu" counter visual — same external ref API as
 * AppleWatch (see home-view.tsx, which renders whichever one is active
 * behind the same tour/onboarding refs) so swapping counter styles never
 * touches the tour or lap wiring. Falls back to AppleWatch outright when the
 * active lap size isn't 33 or 99 (a custom lap size has no physical-bead
 * strand to represent it).
 */
export function TesbihCounterView({ model, controls = 'full', ...rest }: CounterVisualViewProps) {
  const { previewTokens, spotlightRef, listBtnRef, targetBtnRef, resetBtnRef, saveBtnRef } = rest
  const { t } = useTranslation('home')
  const router = useRouter()
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false)
  const { tokens: activeTokens } = useThemeTokens()
  const { fontFamily } = useThemePreferences()
  const tokens = previewTokens ?? activeTokens
  const home = model
  const material = useCounterStyleStore(s => s.material)

  const strongTextStyle = useMemo(() => resolveStrongTextStyle(fontFamily), [fontFamily])
  const resetDhikrName = useMemo(
    () => home.mainDhikr.displayName.trim() || home.activeQuickDhikr.trim() || t('home:resetModal.defaultDhikrName'),
    [home.activeQuickDhikr, home.mainDhikr.displayName, t]
  )

  if (home.lapSize !== 33 && home.lapSize !== 99) {
    return <AppleWatchView {...rest} model={model} controls={controls} />
  }

  const compactCount = home.count > 0 ? String(home.count) : '0'
  const compactTarget = home.target > 0 ? String(home.target) : '0'
  const medallionSize = STRAND_SIZE + MEDALLION_PADDING * 2
  const medallionBg = withAlpha(tokens.textPrimary, 0.04)
  const medallionBorder = withAlpha(tokens.textPrimary, 0.1)

  return (
    <View className='mb-8 items-center'>
      <View
        className='items-center justify-center rounded-full'
        style={{
          width: medallionSize,
          height: medallionSize,
          backgroundColor: medallionBg,
          borderWidth: 1,
          borderColor: medallionBorder
        }}
      >
        <Pressable
          ref={spotlightRef}
          onPress={home.onCountPress}
          className='items-center justify-center'
          style={{ width: STRAND_SIZE, height: STRAND_SIZE }}
        >
          <View style={{ position: 'absolute', width: STRAND_SIZE, height: STRAND_SIZE }}>
            <TesbihStrand
              count={home.count}
              lapSize={home.lapSize as 33 | 99}
              material={material}
              accent={tokens.accent}
              size={STRAND_SIZE}
            />
          </View>
          {/* Genişlik boncuk halkasının iç boşluğuyla sınırlı: adjustsFontSizeToFit ancak böyle devreye girer. */}
          <View pointerEvents='none' className='items-center' style={{ width: STRAND_SIZE * 0.58 }}>
            {/* Halka oturumunda count/target 7+ haneye çıkabilir; satır kırılmasın, sığmazsa küçülsün. */}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
              style={[strongTextStyle, { color: tokens.textPrimary }]}
              className='text-3xl font-bold leading-[30px]'
            >
              {home.isTargetMode ? `${compactCount}/${compactTarget}` : compactCount}
            </Text>
          </View>
        </Pressable>
      </View>

      {home.currentLap > 0 ? (
        <Text className='mt-2 text-xs font-semibold' style={{ color: tokens.textMuted }}>
          {t('home:lapIndicator.label', { lap: home.currentLap })}
        </Text>
      ) : null}

      <View className='mt-3'>
        <WatchControlButtons
          tokens={tokens}
          listBtnRef={listBtnRef}
          targetBtnRef={targetBtnRef}
          resetBtnRef={resetBtnRef}
          saveBtnRef={saveBtnRef}
          onListPress={() => router.push('/(tabs)/focus')}
          onTargetPress={home.onTargetPress}
          onResetPress={() => setIsResetConfirmVisible(true)}
          onSavePress={home.onSavePress}
          isSaving={home.isSavingLog}
          variant={controls}
        />
      </View>

      <ConfirmModal
        visible={isResetConfirmVisible}
        title={t('home:resetModal.title')}
        message={t('home:resetModal.message', { name: resetDhikrName })}
        confirmLabel={t('home:resetModal.confirmLabel')}
        cancelLabel={t('home:resetModal.cancelLabel')}
        destructive
        onConfirm={() => {
          setIsResetConfirmVisible(false)
          home.onResetPress()
        }}
        onCancel={() => setIsResetConfirmVisible(false)}
      />
    </View>
  )
}

export const TesbihCounter = memo(function TesbihCounter(props: AppleWatchProps) {
  const model = useHomeCounterModel()
  return <TesbihCounterView {...props} model={model} />
})


function resolveStrongTextStyle(fontFamily: string) {
  if (fontFamily === 'merriweather') {
    return { fontFamily: 'Merriweather_700Bold', fontWeight: 'normal' as const }
  }

  if (fontFamily === 'intel-one-mono') {
    return { fontFamily: 'IntelOneMono_700Bold', fontWeight: 'normal' as const }
  }

  if (fontFamily === 'finlandica-headline') {
    return { fontFamily: 'Finlandica_700Bold', fontWeight: 'normal' as const }
  }

  if (fontFamily === 'indie-flower') {
    return { fontFamily: 'IndieFlower_400Regular', fontWeight: 'normal' as const }
  }

  return undefined
}
