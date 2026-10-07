import { useThemeTokens } from '@zikirmatik/ui'
import { Modal, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { withAlpha } from "@zikirmatik/shared";

const DANGER_COLOR = '#EF4444'

type ConfirmModalProps = {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  confirmTestID?: string
  cancelTestID?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  confirmTestID,
  cancelTestID,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const { t } = useTranslation()
  const { tokens } = useThemeTokens()
  const okLabel = confirmLabel ?? t('common:actions.ok')
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
              testID={confirmTestID}
              accessibilityRole='button'
              accessibilityLabel={okLabel}
              className='h-11 items-center justify-center rounded-full border px-4'
              style={{ borderColor: confirmBorder, backgroundColor: confirmBg }}
            >
              <Text className='text-sm font-semibold' style={{ color: confirmColor }}>
                {okLabel}
              </Text>
            </Pressable>
            {cancelLabel ? (
              <Pressable
                onPress={onCancel}
                testID={cancelTestID}
                accessibilityRole='button'
                accessibilityLabel={cancelLabel}
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

