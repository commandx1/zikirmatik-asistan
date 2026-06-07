import { useThemeTokens } from '@zikirmatik/ui'
import { Modal, Pressable, Text, View } from 'react-native'

const DANGER_COLOR = '#EF4444'

type ConfirmModalProps = {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Tamam',
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const { tokens } = useThemeTokens()
  const confirmColor = destructive ? DANGER_COLOR : tokens.accent
  const confirmBg = withAlpha(confirmColor, 0.16)
  const confirmBorder = withAlpha(confirmColor, 0.42)

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onCancel}>
      <View className='flex-1 items-center justify-center bg-black/55 px-6'>
        <View
          className='w-full max-w-[360px] rounded-2xl p-5'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textPrimary, 0.12),
            backgroundColor: tokens.card
          }}
        >
          <Text className='mb-2 text-base font-semibold' style={{ color: tokens.textPrimary }}>
            {title}
          </Text>
          <Text className='text-sm leading-5' style={{ color: tokens.textMuted }}>
            {message}
          </Text>

          <View className='mt-5 gap-2'>
            <Pressable
              onPress={onConfirm}
              className='h-11 items-center justify-center rounded-full border px-4'
              style={{ borderColor: confirmBorder, backgroundColor: confirmBg }}
            >
              <Text className='text-sm font-semibold' style={{ color: confirmColor }}>
                {confirmLabel}
              </Text>
            </Pressable>
            {cancelLabel ? (
              <Pressable
                onPress={onCancel}
                className='h-10 items-center justify-center rounded-full px-4'
              >
                <Text className='text-sm font-medium' style={{ color: tokens.textMuted }}>
                  {cancelLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
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
