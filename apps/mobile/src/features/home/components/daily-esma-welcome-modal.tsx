import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { Modal, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeTokens } from '@zikirmatik/ui'
import type { EsmaulHusnaItem } from '../../focus/types'

type DailyEsmaWelcomeModalProps = {
  visible: boolean
  items: EsmaulHusnaItem[]
  onDismiss: () => void
  onShowAll: () => void
  onStart: (item: EsmaulHusnaItem) => void
}

export function DailyEsmaWelcomeModal({
  visible,
  items,
  onDismiss,
  onShowAll,
  onStart
}: DailyEsmaWelcomeModalProps) {
  const { tokens } = useThemeTokens()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onDismiss}>
      <View className='flex-1 justify-end bg-black/55'>
        <View
          className='rounded-t-3xl px-5 pb-8 pt-4'
          style={{
            borderTopWidth: 1,
            borderTopColor: withAlpha(tokens.textPrimary, 0.12),
            backgroundColor: tokens.card,
            paddingBottom: 32 + Math.max(insets.bottom, 0)
          }}
        >
          <View className='mb-4 items-center'>
            <View className='h-1.5 w-12 rounded-full' style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.18) }} />
          </View>

          <View className='mb-4 flex-row items-start gap-3'>
            <View
              className='h-10 w-10 items-center justify-center rounded-2xl'
              style={{ backgroundColor: withAlpha(tokens.accent, 0.16) }}
            >
              <FontAwesome6 name='star-and-crescent' size={16} color={tokens.accent} />
            </View>
            <View className='flex-1'>
              <Text className='text-lg font-semibold' style={{ color: tokens.textPrimary }}>
                Hoş geldin
              </Text>
              <Text className='mt-1 text-sm leading-5' style={{ color: tokens.textMuted }}>
                Bugün için sana 3 Esmaül Hüsna önerdik.
              </Text>
            </View>
          </View>

          <View className='gap-3'>
            {items.map(item => (
              <View
                key={item.transliteration}
                className='rounded-2xl border px-4 py-3'
                style={{
                  borderColor: withAlpha(tokens.textPrimary, 0.1),
                  backgroundColor: withAlpha(tokens.bg, 0.42)
                }}
              >
                <View className='mb-2 flex-row items-start justify-between gap-3'>
                  <View className='flex-1'>
                    <Text className='text-base font-semibold' style={{ color: tokens.textPrimary }} numberOfLines={1}>
                      {item.transliteration}
                    </Text>
                    <Text className='mt-1 text-lg leading-6' style={{ color: tokens.accent }} numberOfLines={1}>
                      {item.nameArabic}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onStart(item)}
                    className='rounded-full px-3 py-2'
                    style={{ backgroundColor: tokens.accent }}
                  >
                    <Text className='text-xs font-semibold' style={{ color: tokens.bg }}>
                      Başla
                    </Text>
                  </Pressable>
                </View>
                <Text className='text-xs leading-5' style={{ color: tokens.textMuted }} numberOfLines={2}>
                  {item.meaning}
                </Text>
              </View>
            ))}
          </View>

          <View className='mt-5 flex-row gap-3'>
            <Pressable
              onPress={onDismiss}
              className='flex-1 rounded-full px-4 py-3'
              style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.18) }}
            >
              <Text className='text-center text-sm font-semibold' style={{ color: tokens.textPrimary }}>
                Sonra bak
              </Text>
            </Pressable>
            <Pressable
              onPress={onShowAll}
              className='flex-1 rounded-full px-4 py-3'
              style={{ backgroundColor: withAlpha(tokens.accent, 0.14) }}
            >
              <Text className='text-center text-sm font-semibold' style={{ color: tokens.accent }}>
                Tümünü gör
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
