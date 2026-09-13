import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useThemeTokens } from '@zikirmatik/ui'
import { useHomeContext } from '../home-context'
import { MAX_DHIKR_TARGET } from '../../../store/dhikr-store'

const QUICK_LAP_SIZES = [33, 99] as const

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

/**
 * "Tur boyu" (lap size) picker: 33 / 99 / custom.
 *
 * Meant to be dropped into the home target-edit modal (see home-view.tsx's
 * `TargetModal`) — kept as its own standalone component here rather than
 * edited directly into home-view.tsx, which is out of scope for this task
 * (owned by another concurrent worker). Reads/writes home-context's
 * `lapSize`/`setLapSize`, so it can be rendered by any screen inside
 * `HomeProvider` once wired in.
 *
 * Unlike the target field, changing the lap size has no destructive
 * side-effect (it never truncates progress), so selections apply
 * immediately instead of going through a draft/submit flow.
 */
export function LapSizeSelector() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const { t } = useTranslation('home')
  const isQuickValue = (QUICK_LAP_SIZES as readonly number[]).includes(home.lapSize)
  const [customDraft, setCustomDraft] = useState(isQuickValue ? '' : String(home.lapSize))
  const [isCustomActive, setIsCustomActive] = useState(!isQuickValue)

  useEffect(() => {
    if ((QUICK_LAP_SIZES as readonly number[]).includes(home.lapSize)) {
      setIsCustomActive(false)
      return
    }

    setIsCustomActive(true)
    setCustomDraft(String(home.lapSize))
  }, [home.lapSize])

  return (
    <View className='mb-4'>
      <Text className='mb-2 text-xs font-semibold tracking-[0.9px]' style={{ color: tokens.textMuted }}>
        {t('home:targetModal.lapSizeLabel')}
      </Text>
      <View className='flex-row gap-2'>
        {QUICK_LAP_SIZES.map(size => {
          const active = !isCustomActive && home.lapSize === size
          return (
            <Pressable
              key={size}
              onPress={() => {
                setIsCustomActive(false)
                home.setLapSize(size)
              }}
              className='flex-1 items-center justify-center rounded-xl py-2'
              style={{
                borderWidth: 1,
                borderColor: active ? tokens.accent : withAlpha(tokens.textPrimary, 0.15),
                backgroundColor: active ? withAlpha(tokens.accent, 0.15) : 'transparent'
              }}
            >
              <Text className='text-sm font-semibold' style={{ color: active ? tokens.accent : tokens.textPrimary }}>
                {size}
              </Text>
            </Pressable>
          )
        })}
        <Pressable
          onPress={() => setIsCustomActive(true)}
          className='flex-1 items-center justify-center rounded-xl py-2'
          style={{
            borderWidth: 1,
            borderColor: isCustomActive ? tokens.accent : withAlpha(tokens.textPrimary, 0.15),
            backgroundColor: isCustomActive ? withAlpha(tokens.accent, 0.15) : 'transparent'
          }}
        >
          <Text className='text-sm font-semibold' style={{ color: isCustomActive ? tokens.accent : tokens.textPrimary }}>
            {t('home:targetModal.lapSizeCustomOption')}
          </Text>
        </Pressable>
      </View>
      {isCustomActive ? (
        <TextInput
          value={customDraft}
          onChangeText={next => {
            const digits = next.replace(/\D+/g, '').slice(0, String(MAX_DHIKR_TARGET).length)
            setCustomDraft(digits)
            const parsed = Number.parseInt(digits, 10)
            if (!Number.isNaN(parsed) && parsed > 0) {
              home.setLapSize(parsed)
            }
          }}
          keyboardType='number-pad'
          placeholder={t('home:targetModal.lapSizeCustomPlaceholder')}
          placeholderTextColor={tokens.textMuted}
          className='mt-2 rounded-xl px-3 py-2 text-sm'
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.accent, 0.4),
            backgroundColor: withAlpha(tokens.bg, 0.9),
            color: tokens.textPrimary
          }}
        />
      ) : null}
    </View>
  )
}
