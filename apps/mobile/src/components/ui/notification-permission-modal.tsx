import { useThemeTokens } from '@zikirmatik/ui'
import { Modal, Pressable, Text, View } from 'react-native'
import { useNotificationPromptStore } from '../../store/notification-prompt-store'

export function NotificationPermissionModal() {
  const { tokens } = useThemeTokens()
  const visible = useNotificationPromptStore((s) => s.visible)
  const confirm = useNotificationPromptStore((s) => s.confirm)
  const dismiss = useNotificationPromptStore((s) => s.dismiss)

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={dismiss}>
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
            Günlük hatırlatma bildirimleri
          </Text>
          <Text className='mb-5 text-sm leading-5' style={{ color: tokens.textMuted }}>
            Zikir alışkanlığını sürdürmen için günlük hatırlatma bildirimleri göndermemize izin verir misin?
          </Text>

          <View className='gap-2'>
            <Pressable
              onPress={confirm}
              className='h-11 items-center justify-center rounded-full border px-4'
              style={{
                borderColor: withAlpha(tokens.accent, 0.42),
                backgroundColor: withAlpha(tokens.accent, 0.12)
              }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.accent }}>
                İzin ver
              </Text>
            </Pressable>

            <Pressable onPress={dismiss} className='h-10 items-center justify-center rounded-full px-4'>
              <Text className='text-sm font-medium' style={{ color: tokens.textMuted }}>
                Şimdi değil
              </Text>
            </Pressable>
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
