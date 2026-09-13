import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useThemeTokens } from '@zikirmatik/ui'
import { trackEvent } from '../../../lib/analytics'
import { playClickSound } from '../../../services/click-sound'
import { useProfileStore } from '../../../store/profile-store'
import {
  useCounterStyleStore,
  type CounterSoundPack,
  type CounterStyle,
  type TesbihMaterial
} from '../../../store/counter-style-store'
import { TESBIH_MATERIALS } from '../../../theme/tesbih-materials'

const MATERIALS: TesbihMaterial[] = ['kehribar', 'oltu-tasi', 'zeytin-cekirdegi', 'gumus']
const SOUND_PACKS: CounterSoundPack[] = ['off', 'tik', 'ahsap']
const SOUND_PACK_ICONS: Record<CounterSoundPack, 'volume-xmark' | 'volume-low' | 'drum'> = {
  off: 'volume-xmark',
  tik: 'volume-low',
  ahsap: 'drum'
}

function materialI18nKey(material: TesbihMaterial): string {
  return material.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

/**
 * "Sayaç görünümü" settings section — halka/tesbih style picker, (when
 * tesbih is active) the 4-material swatch picker, and the tap sound pack
 * picker. The style/material selection here is always free (no premium
 * gate on the setting itself — see counter-style-store); the actual lock
 * only shows up on the home screen's counter visual. The sound pack IS
 * gated here directly: picking "tik"/"ahsap" without premium opens the
 * paywall sheet instead of changing the setting.
 */
export function CounterStyleSection({ onRequestPremium }: { onRequestPremium: () => void }) {
  const { t } = useTranslation('theme-selector')
  const { tokens } = useThemeTokens()
  const isPremium = useProfileStore(s => s.isPremium)
  const counterStyle = useCounterStyleStore(s => s.counterStyle)
  const material = useCounterStyleStore(s => s.material)
  const soundPack = useCounterStyleStore(s => s.soundPack)
  const setCounterStyle = useCounterStyleStore(s => s.setCounterStyle)
  const setMaterial = useCounterStyleStore(s => s.setMaterial)
  const setSoundPack = useCounterStyleStore(s => s.setSoundPack)

  function handleSelectStyle(next: CounterStyle) {
    if (next === 'tesbih' && counterStyle !== 'tesbih') {
      void trackEvent('tesbih_mode_enabled')
    }
    setCounterStyle(next)
  }

  function handleSelectMaterial(next: TesbihMaterial) {
    if (next !== material) {
      void trackEvent('tesbih_material_changed', { material: next })
    }
    setMaterial(next)
  }

  function handleSelectSoundPack(next: CounterSoundPack) {
    if (next !== 'off' && !isPremium) {
      onRequestPremium()
      return
    }

    if (next !== soundPack) {
      void trackEvent('sound_pack_enabled', { pack: next })
    }
    setSoundPack(next)

    if (next !== 'off') {
      playClickSound(next)
    }
  }

  return (
    <View className='gap-3'>
      <Text className='text-sm font-semibold' style={{ color: tokens.textPrimary }}>
        {t('theme-selector:counterStyle.title')}
      </Text>

      <View className='flex-row gap-3'>
        <StyleOption
          label={t('theme-selector:counterStyle.halka')}
          icon='circle-notch'
          active={counterStyle === 'halka'}
          onPress={() => handleSelectStyle('halka')}
        />
        <StyleOption
          label={t('theme-selector:counterStyle.tesbih')}
          icon='circle-dot'
          active={counterStyle === 'tesbih'}
          showPremiumBadge={!isPremium}
          onPress={() => handleSelectStyle('tesbih')}
        />
      </View>

      {counterStyle === 'tesbih' ? (
        <View className='mt-1 gap-2'>
          <Text className='text-xs font-semibold' style={{ color: tokens.textMuted }}>
            {t('theme-selector:counterStyle.materialLabel')}
          </Text>
          <View className='flex-row gap-4'>
            {MATERIALS.map(id => {
              const palette = TESBIH_MATERIALS[id]
              const active = material === id
              return (
                <Pressable key={id} onPress={() => handleSelectMaterial(id)} className='items-center gap-1.5'>
                  <View
                    className='h-11 w-11 overflow-hidden rounded-full'
                    style={{
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? tokens.accent : withAlpha(tokens.textPrimary, 0.15)
                    }}
                  >
                    <LinearGradient
                      colors={palette.colors}
                      start={{ x: 0.25, y: 0.25 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <Text
                    className='text-[10px] font-medium'
                    style={{ color: active ? tokens.accent : tokens.textMuted }}
                  >
                    {t(`theme-selector:counterStyle.materials.${materialI18nKey(id)}`)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}

      <View className='mt-1 gap-2'>
        <Text className='text-xs font-semibold' style={{ color: tokens.textMuted }}>
          {t('theme-selector:counterStyle.soundPack.title')}
        </Text>
        <View className='flex-row gap-3'>
          {SOUND_PACKS.map(pack => (
            <StyleOption
              key={pack}
              label={t(`theme-selector:counterStyle.soundPack.options.${pack}`)}
              icon={SOUND_PACK_ICONS[pack]}
              active={soundPack === pack}
              showPremiumBadge={pack !== 'off' && !isPremium}
              onPress={() => handleSelectSoundPack(pack)}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

function StyleOption({
  label,
  icon,
  active,
  showPremiumBadge,
  onPress
}: {
  label: string
  icon: 'circle-notch' | 'circle-dot' | 'volume-xmark' | 'volume-low' | 'drum'
  active: boolean
  showPremiumBadge?: boolean
  onPress: () => void
}) {
  const { tokens } = useThemeTokens()

  return (
    <Pressable
      onPress={onPress}
      className='flex-1 items-center gap-2 rounded-2xl border px-3 py-4'
      style={{
        borderColor: active ? tokens.accent : withAlpha(tokens.textPrimary, 0.12),
        backgroundColor: active ? withAlpha(tokens.accent, 0.12) : withAlpha(tokens.card, 0.6)
      }}
    >
      <View className='flex-row items-center gap-1.5'>
        <FontAwesome6 name={icon} size={18} color={active ? tokens.accent : tokens.textMuted} />
        {showPremiumBadge ? (
          <View className='h-4 w-4 items-center justify-center rounded-full' style={{ backgroundColor: tokens.accent }}>
            <FontAwesome6 name='crown' size={8} color={tokens.bg} />
          </View>
        ) : null}
      </View>
      <Text className='text-xs font-semibold' style={{ color: active ? tokens.accent : tokens.textPrimary }}>
        {label}
      </Text>
    </Pressable>
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
