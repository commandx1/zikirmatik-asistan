import { useThemeTokens } from '@zikirmatik/ui'
import { Linking, Modal, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNotificationPromptStore } from '../../store/notification-prompt-store'
import { withAlpha } from "@zikirmatik/shared";

export function NotificationPermissionDeniedModal() {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('components')
  const visible = useNotificationPromptStore((s) => s.deniedVisible)
  const hideDenied = useNotificationPromptStore((s) => s.hideDenied)

  const openSettings = () => {
    void Linking.openSettings()
    hideDenied()
  }

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={hideDenied}>
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
            {t('components:notificationPermissionDeniedModal.title')}
          </Text>
          <Text className='mb-5 text-sm leading-5' style={{ color: tokens.textMuted }}>
            {t('components:notificationPermissionDeniedModal.message')}
          </Text>

          <View className='gap-2'>
            <Pressable
              onPress={openSettings}
              className='h-11 items-center justify-center rounded-full border px-4'
              style={{
                borderColor: withAlpha(tokens.accent, 0.42),
                backgroundColor: withAlpha(tokens.accent, 0.12)
              }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.accent }}>
                {t('components:notificationPermissionDeniedModal.openSettings')}
              </Text>
            </Pressable>

            <Pressable onPress={hideDenied} className='h-10 items-center justify-center rounded-full px-4'>
              <Text className='text-sm font-medium' style={{ color: tokens.textMuted }}>
                {t('components:notificationPermissionDeniedModal.close')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

