import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useThemeTokens } from '@zikirmatik/ui'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { withAlpha } from '@zikirmatik/shared'

// Shown on the home screen for a lapsed member: a guest whose last session
// ended in a terminal refresh failure (auth-store.ts), not a fresh guest.
// See services/lapsed-session-banner.ts for the (tested) visibility rule.
export function LapsedSessionBanner({ onSignIn, onClose }: { onSignIn: () => void; onClose: () => void }) {
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('auth')

  return (
    <View
      className='mx-5 mb-3 flex-row items-center gap-2 rounded-2xl px-4 py-3'
      style={{ borderWidth: 1, borderColor: withAlpha(tokens.accent, 0.4), backgroundColor: withAlpha(tokens.accent, 0.1) }}
    >
      <Text className='flex-1 text-xs leading-4' style={{ color: tokens.textPrimary }}>
        {t('auth:lapsedBanner.message')}
      </Text>
      <Pressable onPress={onSignIn} className='rounded-full px-3 py-1.5' style={{ backgroundColor: tokens.accent }}>
        <Text className='text-xs font-semibold' style={{ color: tokens.bg }}>
          {t('auth:lapsedBanner.signIn')}
        </Text>
      </Pressable>
      <Pressable onPress={onClose} accessibilityRole='button' accessibilityLabel={t('auth:screen.close')} hitSlop={8}>
        <FontAwesome6 name='xmark' size={14} color={tokens.textMuted} />
      </Pressable>
    </View>
  )
}
