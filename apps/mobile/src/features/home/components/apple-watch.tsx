import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { useThemeTokens } from '@zikirmatik/ui'
import type { ThemeTokens } from '@zikirmatik/shared'
import { THEME_STRAP_COLORS } from '../../../theme/strap-colors'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { useHomeContext } from '../home-context'
import { useThemePreferences } from '../../../hooks/use-theme-preferences'

const WATCH_WIDTH = 234
const WATCH_HEIGHT = 278
const SCREEN_RADIUS = 44
const RING_SIZE = 128
const RING_STROKE = 8
const INNER_RING_SIZE = 122

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type AppleWatchProps = {
  previewTokens?: ThemeTokens;
  spotlightRef?: RefObject<View | null>;
}

function ProgressRing({ progress, accent, trackColor }: { progress: number; accent: string; trackColor: string }) {
  const clamped = Math.max(0, Math.min(1, progress))
  const radius = (RING_SIZE - RING_STROKE * 2) / 2
  const circumference = 2 * Math.PI * radius
  const center = RING_SIZE / 2
  const progressValue = useSharedValue(clamped)

  useEffect(() => {
    progressValue.value = withTiming(clamped, {
      duration: 260,
      easing: Easing.out(Easing.cubic)
    })
  }, [clamped, progressValue])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - progressValue.value * circumference
  }))

  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle cx={center} cy={center} r={radius} fill='none' stroke={trackColor} strokeWidth={RING_STROKE} />
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        stroke={accent}
        strokeWidth={RING_STROKE}
        strokeDasharray={circumference}
        strokeLinecap='round'
        origin={`${center}, ${center}`}
        rotation={-90}
        animatedProps={animatedProps}
      />
    </Svg>
  )
}

export function AppleWatch({ previewTokens, spotlightRef }: AppleWatchProps = {}) {
  const router = useRouter()
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false)
  const { tokens: activeTokens, themeName } = useThemeTokens()
  const { fontFamily } = useThemePreferences()
  const tokens = previewTokens ?? activeTokens
  const home = useHomeContext()
  const isComplete = home.isTargetMode && home.count >= home.target && home.target > 0
  const prevCountRef = useRef(home.count)
  const prevCompleteRef = useRef(isComplete)
  const tapScale = useSharedValue(1)
  const rippleProgress = useSharedValue(1)
  const completeProgress = useSharedValue(isComplete ? 1 : 0)
  const framePulse = useSharedValue(0)
  const innerIdleBg = withAlpha(tokens.textPrimary, 0.05)
  const innerCompleteBg = withAlpha(tokens.success, 0.15)
  const innerIdleBorder = withAlpha(tokens.textPrimary, 0.1)
  const innerCompleteBorder = withAlpha(tokens.success, 0.45)
  const strapColor = THEME_STRAP_COLORS[themeName]
  const watchCaseColor = withAlpha(tokens.border, 0.85)
  const screenColor = withAlpha(tokens.bg, 0.96)
  const sideButtonPrimary = withAlpha(tokens.textMuted, 0.75)
  const sideButtonSecondary = withAlpha(tokens.textMuted, 0.55)
  const controlButtonBorder = withAlpha(tokens.textPrimary, 0.12)
  const controlButtonBg = withAlpha(tokens.textPrimary, 0.06)
  const ringTrackColor = withAlpha(tokens.textPrimary, 0.12)

  useEffect(() => {
    const isIncrement = home.count > prevCountRef.current
    if (isIncrement) {
      tapScale.value = withSequence(
        withTiming(0.95, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 140, easing: Easing.out(Easing.back(2)) })
      )
      rippleProgress.value = 0
      rippleProgress.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
    }

    if (isComplete && !prevCompleteRef.current) {
      completeProgress.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) })
      framePulse.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) })
      )
    } else if (!isComplete && prevCompleteRef.current) {
      completeProgress.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) })
      framePulse.value = 0
    }

    prevCountRef.current = home.count
    prevCompleteRef.current = isComplete
  }, [completeProgress, framePulse, home.count, isComplete, rippleProgress, tapScale])

  const ringTapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }]
  }))

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - rippleProgress.value,
    transform: [{ scale: interpolate(rippleProgress.value, [0, 1], [0.72, 1.16], Extrapolation.CLAMP) }]
  }))

  const innerCircleAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(completeProgress.value, [0, 1], [innerIdleBg, innerCompleteBg]),
    borderColor: interpolateColor(completeProgress.value, [0, 1], [innerIdleBorder, innerCompleteBorder])
  }))

  const counterAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(completeProgress.value, [0, 1], [tokens.textPrimary, tokens.success]),
    transform: [{ scale: interpolate(framePulse.value, [0, 1], [1, 1.06], Extrapolation.CLAMP) }]
  }))

  const watchBodyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(framePulse.value, [0, 1], [1, 1.025], Extrapolation.CLAMP) },
      { rotateZ: `${interpolate(framePulse.value, [0, 0.4, 0.7, 1], [0, -1.5, 1.8, 0], Extrapolation.CLAMP)}deg` }
    ]
  }))

  const compactCount = home.count > 0 ? String(home.count) : '0'
  const compactTarget = home.target > 0 ? String(home.target) : '0'
  const strongTextStyle = useMemo(() => resolveStrongTextStyle(fontFamily), [fontFamily])
  const resetDhikrName = useMemo(
    () => home.mainDhikr.nameTurkish.trim() || home.activeQuickDhikr.trim() || 'Zikir',
    [home.activeQuickDhikr, home.mainDhikr.nameTurkish]
  )

  const onResetConfirmPress = () => setIsResetConfirmVisible(true)

  return (
    <View ref={spotlightRef} className='mb-8 items-center'>
      <View className='h-[64px] w-[168px] rounded-t-[26px]' style={{ backgroundColor: strapColor }} />

      <View className='relative z-10 -mt-5'>
        <View
          style={{
            width: WATCH_WIDTH,
            height: WATCH_HEIGHT,
            borderRadius: 56,
            padding: 7,
            backgroundColor: watchCaseColor
          }}
        >
          <Animated.View
            style={[{ borderRadius: SCREEN_RADIUS, backgroundColor: screenColor }, watchBodyAnimatedStyle]}
            className='h-full w-full overflow-hidden px-4 pt-4'
          >
            <ScrollView
              className='w-full flex-1'
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', flexGrow: 1, justifyContent: 'center', paddingBottom: 12 }}
            >
              <Pressable
                onPress={home.onCountPress}
                className='relative items-center justify-center'
                style={{ width: RING_SIZE, height: RING_SIZE }}
              >
                <Animated.View
                  style={[{ width: RING_SIZE, height: RING_SIZE }, ringTapAnimatedStyle]}
                  className='items-center justify-center'
                >
                  <View className='absolute inset-0'>
                    <ProgressRing progress={home.progress} accent={tokens.accent} trackColor={ringTrackColor} />
                  </View>
                  <Animated.View
                    pointerEvents='none'
                    style={[
                      {
                        position: 'absolute',
                        width: RING_SIZE - 16,
                        height: RING_SIZE - 16,
                        borderRadius: (RING_SIZE - 16) / 2,
                        borderWidth: 2,
                        borderColor: tokens.accent
                      },
                      rippleAnimatedStyle
                    ]}
                  />
                  <Animated.View
                    className='items-center justify-center rounded-full border'
                    style={[
                      {
                        width: INNER_RING_SIZE,
                        height: INNER_RING_SIZE
                      },
                      innerCircleAnimatedStyle
                    ]}
                  >
                    {isComplete ? (
                      <Animated.Text
                        style={[counterAnimatedStyle, strongTextStyle]}
                        className='text-5xl font-bold leading-[42px]'
                      >
                        ✓
                      </Animated.Text>
                    ) : (
                      <FontAwesome6
                        name='fingerprint'
                        iconStyle='solid'
                        size={34}
                        color={tokens.accent}
                        style={{ opacity: 0.55 }}
                      />
                    )}
                  </Animated.View>
                </Animated.View>
              </Pressable>

              <View className='mt-2 mb-0.5 items-center'>
                <Animated.Text style={[counterAnimatedStyle, strongTextStyle]} className='text-3xl font-bold leading-[30px]'>
                  {home.isTargetMode ? `${compactCount}/${compactTarget}` : compactCount}
                </Animated.Text>
              </View>

              <View className='mt-3 flex-row gap-3'>
                <Pressable
                  onPress={() => router.push('/(tabs)/focus')}
                  className='h-9 w-9 items-center justify-center rounded-full border'
                  style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
                >
                  <FontAwesome6 name='list-ul' size={12} color={tokens.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={home.onTargetPress}
                  className='h-9 w-9 items-center justify-center rounded-full border'
                  style={{
                    borderColor: controlButtonBorder,
                    backgroundColor: controlButtonBg
                  }}
                >
                  <FontAwesome6 name='bullseye' size={12} color={tokens.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={onResetConfirmPress}
                  className='h-9 w-9 items-center justify-center rounded-full border'
                  style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
                >
                  <FontAwesome6 name='arrow-rotate-left' size={12} color={tokens.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={home.onSavePress}
                  disabled={home.isSavingLog}
                  className={`h-9 w-9 items-center justify-center rounded-full border ${
                    home.isSavingLog ? 'opacity-50' : ''
                  }`}
                  style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
                >
                  {home.isSavingLog ? (
                    <ActivityIndicator size='small' color={tokens.textPrimary} />
                  ) : (
                    <FontAwesome6 name='floppy-disk' size={12} color={tokens.textPrimary} />
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        <View
          className='absolute -right-2 top-[70px] h-11 w-2 rounded-r'
          style={{ backgroundColor: sideButtonPrimary }}
        />
        <View
          className='absolute -right-2 top-[124px] h-6 w-1.5 rounded-r'
          style={{ backgroundColor: sideButtonSecondary }}
        />
      </View>

      <View className='-mt-5 h-[74px] w-[168px] rounded-b-[26px]' style={{ backgroundColor: strapColor }} />

      <ConfirmModal
        visible={isResetConfirmVisible}
        title='Sayacı Sıfırla'
        message={`${resetDhikrName} sayacınız sıfırlanacak. Bu işlem geri alınamaz.`}
        confirmLabel='Sıfırla'
        cancelLabel='Vazgeç'
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
