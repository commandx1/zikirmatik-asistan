import { useThemeTokens } from '@zikirmatik/ui'
import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import { withAlpha } from "@zikirmatik/shared";
import { ESMAUL_HUSNA } from '../../focus/data'

const ROW_COUNT = Math.ceil(ESMAUL_HUSNA.length / 2)

function useSkeletonPulse() {
  const opacity = useSharedValue(0.35)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true)
    return () => cancelAnimation(opacity)
  }, [opacity])

  return useAnimatedStyle(() => ({ opacity: opacity.value }))
}

export function EsmaulHusnaSectionSkeleton() {
  const { tokens } = useThemeTokens()
  const pulseStyle = useSkeletonPulse()

  return (
    <View className='px-5 pb-1'>
      <View
        className='rounded-2xl px-4 py-3'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: withAlpha(tokens.card, 0.92)
        }}
      >
        <Animated.View style={[{ height: 12, width: 96 }, pulseStyle]} className='mb-3 rounded-full bg-white/15' />
        <View className='overflow-hidden rounded-xl' style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.1) }}>
          {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => {
            const isLastRow = rowIndex === ROW_COUNT - 1

            return (
              <View
                key={rowIndex}
                className='min-h-10 flex-row'
                style={{
                  borderBottomWidth: isLastRow ? 0 : 1,
                  borderBottomColor: withAlpha(tokens.textPrimary, 0.08),
                  backgroundColor:
                    rowIndex % 2 === 0 ? withAlpha(tokens.textPrimary, 0.035) : withAlpha(tokens.textPrimary, 0.015)
                }}
              >
                {[0, 1].map((cellIndex) => (
                  <View
                    key={cellIndex}
                    className='flex-1 flex-row items-center px-3 py-2'
                    style={{
                      borderRightWidth: cellIndex === 0 ? 1 : 0,
                      borderRightColor: withAlpha(tokens.textPrimary, 0.08)
                    }}
                  >
                    <Animated.View style={[{ height: 10, width: 90 }, pulseStyle]} className='rounded-full bg-white/12' />
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

