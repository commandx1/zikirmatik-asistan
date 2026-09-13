import { useEffect, useMemo, useRef } from 'react'
import { Text, View } from 'react-native'
import { Canvas, Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia'
import {
  Easing,
  Extrapolation,
  interpolate,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue
} from 'react-native-reanimated'
import type { TesbihMaterial } from '../../../store/counter-style-store'
import { TESBIH_LIGHT_OFFSET, TESBIH_MATERIALS, type TesbihMaterialPalette } from '../../../theme/tesbih-materials'
import {
  computeBeadCenter,
  computeBeadLayout,
  PHYSICAL_BEAD_COUNT,
  resolveBeadFill,
  resolveSubLapLabel,
  type BeadLayout,
  type SubLapLabel
} from './tesbih-strand.math'

const DEFAULT_SIZE = 220
// How much of the wave's total 0→1 sweep a single bead occupies — keeps the
// ripple short-lived per bead while still visibly travelling around the ring.
const WAVE_WINDOW = 0.18

type TesbihStrandProps = {
  count: number
  lapSize: 33 | 99
  material: TesbihMaterial
  accent: string
  size?: number
  onLapComplete?: (lap: number) => void
}

/**
 * Pure presentation: a 33-bead tesbih strand driven entirely by Reanimated
 * shared values passed straight into Skia props (never `.value` reads in
 * render), so ticking the animation never triggers a React re-render. No tap
 * handling here — the wrapping Pressable (tesbih-counter.tsx) owns that.
 */
export function TesbihStrand({ count, lapSize, material, accent, size = DEFAULT_SIZE, onLapComplete }: TesbihStrandProps) {
  const palette = TESBIH_MATERIALS[material]
  const layout = useMemo(() => computeBeadLayout(size), [size])
  const fill = resolveBeadFill(count)
  const subLap = resolveSubLapLabel(count, lapSize)

  const beadProgress = useSharedValue(fill)
  const ringComplete = useSharedValue(0)
  const waveProgress = useSharedValue(0)
  const prevFillRef = useRef(fill)

  useEffect(() => {
    beadProgress.value = withTiming(fill, { duration: 180, easing: Easing.out(Easing.cubic) })

    const prevFill = prevFillRef.current
    if (fill === PHYSICAL_BEAD_COUNT && prevFill !== PHYSICAL_BEAD_COUNT) {
      ringComplete.value = 0
      ringComplete.value = withSequence(
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) })
      )
      waveProgress.value = 0
      waveProgress.value = withTiming(1, { duration: 640, easing: Easing.out(Easing.cubic) })
      onLapComplete?.(Math.ceil(Math.max(1, count) / PHYSICAL_BEAD_COUNT))
    }
    prevFillRef.current = fill
  }, [fill, count, beadProgress, ringComplete, waveProgress, onLapComplete])

  const beadIndices = useMemo(() => Array.from({ length: PHYSICAL_BEAD_COUNT }, (_, index) => index), [])

  return (
    <View style={{ width: size, height: size }} pointerEvents='none'>
      <Canvas style={{ width: size, height: size }}>
        <RingCompleteHalo layout={layout} progress={ringComplete} accent={accent} />
        {beadIndices.map(index => (
          <Bead
            key={index}
            index={index}
            layout={layout}
            palette={palette}
            accent={accent}
            beadProgress={beadProgress}
            waveProgress={waveProgress}
          />
        ))}
      </Canvas>
      {subLap ? (
        <View style={{ position: 'absolute', bottom: size * 0.07, width: size, alignItems: 'center' }}>
          <Text style={{ color: withAlpha(accent, 0.9), fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
            {renderSubLapDots(subLap)}  {subLap.index}/{subLap.total}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

type BeadProps = {
  index: number
  layout: BeadLayout
  palette: TesbihMaterialPalette
  accent: string
  beadProgress: SharedValue<number>
  waveProgress: SharedValue<number>
}

function Bead({ index, layout, palette, accent, beadProgress, waveProgress }: BeadProps) {
  const center = computeBeadCenter(index, PHYSICAL_BEAD_COUNT, layout)
  const highlightCenter = {
    x: center.x + layout.beadRadius * TESBIH_LIGHT_OFFSET.x,
    y: center.y + layout.beadRadius * TESBIH_LIGHT_OFFSET.y
  }
  const secondaryHighlightCenter = {
    x: highlightCenter.x - layout.beadRadius * 0.12,
    y: highlightCenter.y - layout.beadRadius * 0.12
  }
  const glowRadius = layout.beadRadius * 1.7
  const highlightRadius = layout.beadRadius * 0.42
  const secondaryHighlightRadius = layout.beadRadius * 0.16
  const waveWindowStart = index / PHYSICAL_BEAD_COUNT
  const waveWindowEnd = Math.min(1, waveWindowStart + WAVE_WINDOW)

  // 0 at rest, ramps 0→1 while this bead is the one currently filling in.
  const localProgress = useDerivedValue(() => clamp(beadProgress.value - index, 0, 1))

  const opacity = useDerivedValue(() => interpolate(localProgress.value, [0, 1], [0.32, 1], Extrapolation.CLAMP))

  const scaleTransform = useDerivedValue(() => {
    const pop = interpolate(localProgress.value, [0, 0.2, 0.45, 1], [1, 1.4, 1.05, 1], Extrapolation.CLAMP)
    const waveLocal = interpolate(waveProgress.value, [waveWindowStart, waveWindowEnd], [0, 1], Extrapolation.CLAMP)
    const waveBump = localProgress.value >= 1 ? interpolate(waveLocal, [0, 0.5, 1], [1, 1.22, 1], Extrapolation.CLAMP) : 1
    return [{ scale: pop * waveBump }]
  })

  // Low-opacity glow behind whichever bead is actively filling right now.
  const glowOpacity = useDerivedValue(() => (localProgress.value > 0 && localProgress.value < 1 ? 0.5 : 0))

  return (
    <Group>
      <Circle c={vec(center.x, center.y)} r={glowRadius} opacity={glowOpacity}>
        <RadialGradient c={vec(center.x, center.y)} r={glowRadius} colors={[withAlpha(accent, 0.55), withAlpha(accent, 0)]} />
      </Circle>
      <Group origin={vec(center.x, center.y)} transform={scaleTransform}>
        <Circle c={vec(center.x, center.y)} r={layout.beadRadius} opacity={opacity}>
          <RadialGradient c={vec(highlightCenter.x, highlightCenter.y)} r={layout.beadRadius * 1.35} colors={palette.colors} />
        </Circle>
        <Circle c={vec(highlightCenter.x, highlightCenter.y)} r={highlightRadius} opacity={opacity}>
          <RadialGradient
            c={vec(highlightCenter.x, highlightCenter.y)}
            r={highlightRadius}
            colors={[withAlpha(palette.highlightColor, palette.highlightOpacity), withAlpha(palette.highlightColor, 0)]}
          />
        </Circle>
        {palette.secondaryHighlightColor ? (
          <Circle c={vec(secondaryHighlightCenter.x, secondaryHighlightCenter.y)} r={secondaryHighlightRadius} opacity={opacity}>
            <RadialGradient
              c={vec(secondaryHighlightCenter.x, secondaryHighlightCenter.y)}
              r={secondaryHighlightRadius}
              colors={[
                withAlpha(palette.secondaryHighlightColor, palette.secondaryHighlightOpacity ?? 0.4),
                withAlpha(palette.secondaryHighlightColor, 0)
              ]}
            />
          </Circle>
        ) : null}
      </Group>
    </Group>
  )
}

function RingCompleteHalo({
  layout,
  progress,
  accent
}: {
  layout: BeadLayout
  progress: SharedValue<number>
  accent: string
}) {
  const radius = useDerivedValue(() =>
    layout.ringRadius + interpolate(progress.value, [0, 1], [0, layout.beadRadius * 2.2], Extrapolation.CLAMP)
  )
  const opacity = useDerivedValue(() => interpolate(progress.value, [0, 0.15, 1], [0, 0.55, 0], Extrapolation.CLAMP))
  const strokeWidth = Math.max(2, layout.beadRadius * 0.35)

  return (
    <Circle c={vec(layout.cx, layout.cy)} r={radius} style='stroke' strokeWidth={strokeWidth} color={accent} opacity={opacity} />
  )
}

function renderSubLapDots(subLap: SubLapLabel) {
  return Array.from({ length: subLap.total }, (_, i) => (i + 1 === subLap.index ? '●' : '○')).join('')
}

// Reanimated worklet'lerinden (useDerivedValue) çağrıldığı için worklet olmalı;
// aksi halde UI thread'de "Tried to synchronously call a non-worklet function" ile çöker.
function clamp(value: number, min: number, max: number) {
  'worklet'
  return Math.min(max, Math.max(min, value))
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
