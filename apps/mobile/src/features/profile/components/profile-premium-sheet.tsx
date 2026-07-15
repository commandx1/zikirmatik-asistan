import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useThemePreferences } from '../../../hooks/use-theme-preferences'

type CreditTopupItem = {
  productId: string
  credits: number
  priceString: string
}

type ProfilePremiumSheetProps = {
  visible: boolean
  selectedPlan: 'monthly' | 'annual'
  isActivating?: boolean
  error?: string
  onSelectPlan: (plan: 'monthly' | 'annual') => void
  onStartPremium: () => void
  onClose: () => void
  topupProducts?: CreditTopupItem[]
  purchasingTopupId?: string
  topupError?: string
  onPurchaseTopup?: (productId: string) => void
}

function BenefitItem({ title, description }: { title: string; description: string }) {
  return (
    <View className='flex-row items-start gap-3'>
      <View className='mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[--accent]/20'>
        <FontAwesome6 name='check' size={12} color='#C8972A' />
      </View>
      <View className='flex-1'>
        <Text className='text-base font-semibold text-[--text-primary]'>{title}</Text>
        <Text className='mt-0.5 text-sm text-[--text-muted]'>{description}</Text>
      </View>
    </View>
  )
}

export function ProfilePremiumSheet({
  visible,
  selectedPlan,
  isActivating = false,
  error,
  onSelectPlan,
  onStartPremium,
  onClose,
  topupProducts,
  purchasingTopupId,
  topupError,
  onPurchaseTopup
}: ProfilePremiumSheetProps) {
  const { fontFamily } = useThemePreferences()
  const { t } = useTranslation('profile')
  const insets = useSafeAreaInsets()
  const MONTHLY_PRICE = 59.99
  const YEARLY_PRICE = 479.99

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
      <View className='rounded-t-[32px] border-t border-[--accent]/30 bg-[--card]' style={{ maxHeight: '90%' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 24 + insets.bottom }}
        >
          <View className='mb-6 h-1.5 w-12 self-center rounded-full bg-white/20' />

          <View className='mb-6 items-center'>
            <View className='mb-4 h-16 w-16 items-center justify-center rounded-full bg-[--accent]'>
              <FontAwesome6 name='crown' size={24} color='#0F1B2D' />
            </View>
            <Text className='mb-2 text-2xl font-bold text-[--text-primary]' style={strongTextStyle}>
              {t('profile:premiumSheet.title')}
            </Text>
            <Text className='text-center text-base text-[--text-muted]' style={regularTextStyle}>
              {t('profile:premiumSheet.subtitle')}
            </Text>
          </View>

          <View className='mb-8 gap-4'>
            <BenefitItem title={t('profile:premiumSheet.benefits.aiCredits.title')} description={t('profile:premiumSheet.benefits.aiCredits.description')} />
            <BenefitItem title={t('profile:premiumSheet.benefits.collections.title')} description={t('profile:premiumSheet.benefits.collections.description')} />
            <BenefitItem title={t('profile:premiumSheet.benefits.stats.title')} description={t('profile:premiumSheet.benefits.stats.description')} />
            <BenefitItem title={t('profile:premiumSheet.benefits.specialDays.title')} description={t('profile:premiumSheet.benefits.specialDays.description')} />
            <BenefitItem title={t('profile:premiumSheet.benefits.themes.title')} description={t('profile:premiumSheet.benefits.themes.description')} />
          </View>

          <View className='mb-6 flex-row rounded-xl border border-white/5 bg-[--bg] p-1'>
            <Pressable
              onPress={() => onSelectPlan('monthly')}
              disabled={isActivating}
              className={`flex-1 rounded-lg py-2.5 ${selectedPlan === 'monthly' ? 'bg-[--accent]' : ''}`}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  selectedPlan === 'monthly' ? 'text-[#0F1B2D]' : 'text-[--text-muted]'
                }`}
                style={strongTextStyle}
              >
                {t('profile:premiumSheet.monthlyPlan', { price: MONTHLY_PRICE })}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSelectPlan('annual')}
              disabled={isActivating}
              className={`flex-1 rounded-lg py-2.5 ${selectedPlan === 'annual' ? 'bg-[--accent]' : ''}`}
            >
              <Text
                className={`text-center text-sm font-bold ${
                  selectedPlan === 'annual' ? 'text-[#0F1B2D]' : 'text-[--text-muted]'
                }`}
                style={strongTextStyle}
              >
                {t('profile:premiumSheet.yearlyPlan', { price: YEARLY_PRICE })}
              </Text>
            </Pressable>
          </View>

          <Text className='mb-3 text-center text-xs text-[--text-muted]' style={regularTextStyle}>
            {t('profile:premiumSheet.creditsRenewNote')}
          </Text>

          {error ? <Text className='mb-3 text-center text-sm text-[#fca5a5]'>{error}</Text> : null}

          <Pressable
            onPress={onStartPremium}
            disabled={isActivating}
            className={`mb-3 rounded-xl bg-[--accent] py-4 ${isActivating ? 'opacity-60' : ''}`}
          >
            <Text className='text-center text-lg font-bold text-[#0F1B2D]' style={strongTextStyle}>
              {isActivating ? t('profile:premiumSheet.activating') : t('profile:premiumSheet.startButton')}
            </Text>
          </Pressable>

          {topupProducts && topupProducts.length > 0 && onPurchaseTopup ? (
            <View className='mb-3'>
              <View className='mb-4 flex-row items-center gap-3'>
                <View className='h-px flex-1 bg-white/10' />
                <Text className='text-xs font-semibold uppercase text-[--text-muted]' style={strongTextStyle}>
                  {t('profile:premiumSheet.orBuyCredits')}
                </Text>
                <View className='h-px flex-1 bg-white/10' />
              </View>

              <Text className='mb-2 text-center text-xs text-[--text-muted]' style={regularTextStyle}>
                {t('profile:premiumSheet.creditsKeptNote')}
              </Text>

              <View className='gap-2'>
                {topupProducts.map((item) => {
                  const isPurchasing = purchasingTopupId === item.productId
                  return (
                    <Pressable
                      key={item.productId}
                      onPress={() => onPurchaseTopup(item.productId)}
                      disabled={Boolean(purchasingTopupId) || isActivating}
                      className={`flex-row items-center justify-between rounded-xl border border-white/10 bg-[--bg] px-4 py-3 ${
                        isPurchasing ? 'opacity-60' : ''
                      }`}
                    >
                      <View className='flex-row items-center gap-3'>
                        <View className='h-9 w-9 items-center justify-center rounded-full bg-[--accent]/20'>
                          <FontAwesome6 name='bolt' size={14} color='#C8972A' />
                        </View>
                        <Text className='text-base font-semibold text-[--text-primary]' style={strongTextStyle}>
                          {t('profile:premiumSheet.creditsLabel', { count: item.credits })}
                        </Text>
                      </View>
                      <Text className='text-base font-bold text-[--accent]' style={strongTextStyle}>
                        {isPurchasing ? t('profile:premiumSheet.purchasing') : item.priceString}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {topupError ? (
                <Text className='mt-3 text-center text-sm text-[#fca5a5]' style={regularTextStyle}>
                  {topupError}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text className='mb-2 text-center text-xs text-[--text-muted]/70' style={regularTextStyle}>
            {t('profile:premiumSheet.dailyFreeCreditNote')}
          </Text>

          <Pressable onPress={onClose} className='py-2'>
            <Text className='text-center text-sm font-medium text-[--text-muted]' style={regularTextStyle}>
              {t('profile:premiumSheet.maybeLater')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  )
}
