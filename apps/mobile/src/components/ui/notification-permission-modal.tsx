import { useThemeTokens } from '@zikirmatik/ui'
import { Modal, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNotificationPromptStore } from '../../store/notification-prompt-store'
import { TEST_IDS } from '../../test-ids'
import { withAlpha } from "@zikirmatik/shared";

export function NotificationPermissionModal() {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('components')
  const visible = useNotificationPromptStore((s) => s.visible)
  const confirm = useNotificationPromptStore((s) => s.confirm)
  const dismiss = useNotificationPromptStore((s) => s.dismiss)
  const reminder = useNotificationPromptStore((s) => s.reason) === 'dailyReminder'
  const k = reminder ? 'dailyReminderOffer' : 'notificationPermissionModal'

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
            {t(`components:${k}.title`)}
          </Text>
          <Text className='mb-5 text-sm leading-5' style={{ color: tokens.textMuted }}>
            {t(`components:${k}.message`)}
          </Text>

          <View className='gap-2'>
            <Pressable
              onPress={confirm}
              testID={TEST_IDS.notifications.offerConfirm}
              className='h-11 items-center justify-center rounded-full border px-4'
              style={{
                borderColor: withAlpha(tokens.accent, 0.42),
                backgroundColor: withAlpha(tokens.accent, 0.12)
              }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.accent }}>
                {t(`components:${k}.allow`)}
              </Text>
            </Pressable>

            <Pressable onPress={dismiss} testID={TEST_IDS.notifications.offerDismiss} className='h-10 items-center justify-center rounded-full px-4'>
              <Text className='text-sm font-medium' style={{ color: tokens.textMuted }}>
                {t(`components:${k}.notNow`)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

