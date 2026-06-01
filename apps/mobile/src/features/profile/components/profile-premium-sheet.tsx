import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { Pressable, Text, View } from 'react-native'
import { useThemePreferences } from '../../../hooks/use-theme-preferences'

type ProfilePremiumSheetProps = {
  visible: boolean
  selectedPlan: 'monthly' | 'annual'
  isActivating?: boolean
  isRestoring?: boolean
  error?: string
  onSelectPlan: (plan: 'monthly' | 'annual') => void
  onStartPremium: () => void
  onRestorePremium: () => void
  onClose: () => void
}

function BenefitItem({ title, description }: { title: string; description: string }) {
  return (
    <View className='flex-row items-start gap-3'>
      <View className='mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[--accent]/20'>
        <FontAwesome6 name='check' size={12} color='#C8972A' />
      </View>
      <View className='flex-1'>
        <Text className='text-[14px] font-semibold text-[--text-primary]'>{title}</Text>
        <Text className='mt-0.5 text-[12px] text-[--text-muted]'>{description}</Text>
      </View>
    </View>
  )
}

export function ProfilePremiumSheet({
  visible,
  selectedPlan,
  isActivating = false,
  isRestoring = false,
  error,
  onSelectPlan,
  onStartPremium,
  onRestorePremium,
  onClose
}: ProfilePremiumSheetProps) {
  const { fontFamily } = useThemePreferences()
  const MONTHLY_PRICE = 94.99
  const YEARLY_PRICE = 949.99

  if (!visible) {
    return null
  }

  const regularTextStyle =
    fontFamily === 'merriweather'
      ? { fontFamily: 'Merriweather_400Regular', fontWeight: 'normal' as const }
      : fontFamily === 'intel-one-mono'
        ? { fontFamily: 'IntelOneMono_400Regular', fontWeight: 'normal' as const }
        : fontFamily === 'finlandica-headline'
          ? { fontFamily: 'Finlandica_400Regular', fontWeight: 'normal' as const }
          : fontFamily === 'indie-flower'
            ? { fontFamily: 'IndieFlower_400Regular', fontWeight: 'normal' as const }
        : undefined
  const strongTextStyle =
    fontFamily === 'merriweather'
      ? { fontFamily: 'Merriweather_700Bold', fontWeight: 'normal' as const }
      : fontFamily === 'intel-one-mono'
        ? { fontFamily: 'IntelOneMono_700Bold', fontWeight: 'normal' as const }
        : fontFamily === 'finlandica-headline'
          ? { fontFamily: 'Finlandica_700Bold', fontWeight: 'normal' as const }
          : fontFamily === 'indie-flower'
            ? { fontFamily: 'IndieFlower_400Regular', fontWeight: 'normal' as const }
        : undefined

  return (
    <View className='absolute inset-0 z-50 justify-end'>
      <Pressable className='absolute inset-0 bg-black/60' onPress={onClose} />
      <View className='rounded-t-[32px] border-t border-[--accent]/30 bg-[--card] p-6'>
        <View className='mb-6 h-1.5 w-12 self-center rounded-full bg-white/20' />

        <View className='mb-6 items-center'>
          <View className='mb-4 h-16 w-16 items-center justify-center rounded-full bg-[--accent]'>
            <FontAwesome6 name='crown' size={24} color='#0F1B2D' />
          </View>
          <Text className='mb-2 text-[24px] font-bold text-[--text-primary]' style={strongTextStyle}>
            Premium'a Geç
          </Text>
          <Text className='text-center text-[14px] text-[--text-muted]' style={regularTextStyle}>
            Manevi yolculuğunuzu Asistan destekli rehberlik ve özel içeriklerle derinleştirin.
          </Text>
        </View>

        <View className='mb-8 gap-4'>
          <BenefitItem title='Reklamsız Asistan Rehberliği' description='Ödüllü reklam beklemeden anında öneri al.' />
          <BenefitItem title='Detaylı İstatistikler' description='Geçmişe dönük tüm manevi kayıtlarınıza erişim.' />
          <BenefitItem title='Tüm Temaların Kilidini Aç' description='Tüm görünüm seçeneklerini sınırsız kullan.' />
        </View>

        <View className='mb-6 flex-row rounded-xl border border-white/5 bg-[--bg] p-1'>
          <Pressable
            onPress={() => onSelectPlan('monthly')}
            disabled={isActivating || isRestoring}
            className={`flex-1 rounded-lg py-2.5 ${selectedPlan === 'monthly' ? 'bg-[--accent]' : ''}`}
          >
            <Text
              className={`text-center text-[13px] font-semibold ${
                selectedPlan === 'monthly' ? 'text-[#0F1B2D]' : 'text-[--text-muted]'
              }`}
              style={strongTextStyle}
            >
              {`Aylık (₺${MONTHLY_PRICE})`}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSelectPlan('annual')}
            disabled={isActivating || isRestoring}
            className={`flex-1 rounded-lg py-2.5 ${selectedPlan === 'annual' ? 'bg-[--accent]' : ''}`}
          >
            <Text
              className={`text-center text-[13px] font-bold ${
                selectedPlan === 'annual' ? 'text-[#0F1B2D]' : 'text-[--text-muted]'
              }`}
              style={strongTextStyle}
            >
              {`Yıllık (₺${YEARLY_PRICE}) `}
            </Text>
          </Pressable>
        </View>

        {error ? <Text className='mb-3 text-center text-[12px] text-[#fca5a5]'>{error}</Text> : null}

        <Pressable
          onPress={onStartPremium}
          disabled={isActivating || isRestoring}
          className={`mb-3 rounded-xl bg-[--accent] py-4 ${isActivating || isRestoring ? 'opacity-60' : ''}`}
        >
          <Text className='text-center text-[16px] font-bold text-[#0F1B2D]' style={strongTextStyle}>
            {isActivating ? 'Aktifleştiriliyor...' : 'Hemen Başla'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onRestorePremium}
          disabled={isActivating || isRestoring}
          className={`mb-2 py-2 ${isActivating || isRestoring ? 'opacity-60' : ''}`}
        >
          <Text className='text-center text-[13px] font-medium text-[--text-muted]' style={regularTextStyle}>
            {isRestoring ? 'Geri Yükleniyor...' : 'Satın Alımı Geri Yükle'}
          </Text>
        </Pressable>

        <Pressable onPress={onClose} className='py-2'>
          <Text className='text-center text-[13px] font-medium text-[--text-muted]' style={regularTextStyle}>
            Belki Daha Sonra
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
