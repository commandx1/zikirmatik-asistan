import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import type { RefObject } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import type { ThemeTokens } from '@zikirmatik/shared'

type WatchControlButtonsProps = {
  tokens: ThemeTokens
  onListPress: () => void
  onTargetPress: () => void
  onResetPress: () => void
  onSavePress: () => void
  isSaving?: boolean
  listBtnRef?: RefObject<View | null>
  targetBtnRef?: RefObject<View | null>
  resetBtnRef?: RefObject<View | null>
  saveBtnRef?: RefObject<View | null>
  variant?: 'full' | 'reset-only'
}

/**
 * The list/target/reset/save icon-button row shared by both counter visuals
 * (apple-watch.tsx and tesbih-counter.tsx) — extracted so the two stay
 * visually identical without duplicating the markup. Purely presentational:
 * callers own their own handlers (router navigation, confirm modals, etc.).
 */
export function WatchControlButtons({
  tokens,
  onListPress,
  onTargetPress,
  onResetPress,
  onSavePress,
  isSaving = false,
  listBtnRef,
  targetBtnRef,
  resetBtnRef,
  saveBtnRef,
  variant = 'full'
}: WatchControlButtonsProps) {
  const controlButtonBorder = withAlpha(tokens.textPrimary, 0.12)
  const controlButtonBg = withAlpha(tokens.textPrimary, 0.06)

  if (variant === 'reset-only') {
    return (
      <View className='mt-3 flex-row gap-3'>
        <Pressable
          ref={resetBtnRef}
          onPress={onResetPress}
          className='h-9 w-9 items-center justify-center rounded-full border'
          style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
        >
          <FontAwesome6 name='arrow-rotate-left' size={12} color={tokens.textPrimary} />
        </Pressable>
      </View>
    )
  }

  return (
    <View className='mt-3 flex-row gap-3'>
      <Pressable
        ref={listBtnRef}
        onPress={onListPress}
        className='h-9 w-9 items-center justify-center rounded-full border'
        style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
      >
        <FontAwesome6 name='list-ul' size={12} color={tokens.textPrimary} />
      </Pressable>
      <Pressable
        ref={targetBtnRef}
        onPress={onTargetPress}
        className='h-9 w-9 items-center justify-center rounded-full border'
        style={{
          borderColor: controlButtonBorder,
          backgroundColor: controlButtonBg
        }}
      >
        <FontAwesome6 name='bullseye' size={12} color={tokens.textPrimary} />
      </Pressable>
      <Pressable
        ref={resetBtnRef}
        onPress={onResetPress}
        className='h-9 w-9 items-center justify-center rounded-full border'
        style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
      >
        <FontAwesome6 name='arrow-rotate-left' size={12} color={tokens.textPrimary} />
      </Pressable>
      <Pressable
        ref={saveBtnRef}
        onPress={onSavePress}
        disabled={isSaving}
        className={`h-9 w-9 items-center justify-center rounded-full border ${isSaving ? 'opacity-50' : ''}`}
        style={{ borderColor: controlButtonBorder, backgroundColor: controlButtonBg }}
      >
        {isSaving ? (
          <ActivityIndicator size='small' color={tokens.textPrimary} />
        ) : (
          <FontAwesome6 name='floppy-disk' size={12} color={tokens.textPrimary} />
        )}
      </Pressable>
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
