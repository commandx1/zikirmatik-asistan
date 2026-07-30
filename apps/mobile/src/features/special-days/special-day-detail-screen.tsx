import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useThemeTokens } from '@zikirmatik/ui'
import { useTranslation } from 'react-i18next'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { ThemedCard } from '../../components/ui/themed-card'
import { resolveLocalizedText } from '../../store/dhikr-store'
import { formatLongDate } from '../../lib/locale-format'
import { useAiGuideNavigationIntentStore } from '../ai-guide/services/ai-guide-navigation-intent-store'
import { useSpecialDayDetail } from './hooks/use-special-day-detail'
import { useLocaleUpper } from '../../hooks/use-locale-upper'

type SpecialDayDetailScreenProps = {
  id: string
}

export function SpecialDayDetailScreen({ id }: SpecialDayDetailScreenProps) {
  const router = useRouter()
  const { tokens } = useThemeTokens()
  const { t, i18n } = useTranslation('special-days')
  const locale = (i18n.language === 'en' ? 'en' : 'tr') as 'tr' | 'en'
  const upper = useLocaleUpper()

  const detail = useSpecialDayDetail(id)
  const requestSpecialDayIntent = useAiGuideNavigationIntentStore(s => s.requestSpecialDayIntent)

  const article = detail.detail?.article ? resolveLocalizedText(detail.detail.article, locale).trim() : ''
  const practices = (detail.detail?.practices ?? []).filter(
    item => resolveLocalizedText(item.title, locale).trim().length > 0
  )

  const handleAiCtaPress = () => {
    if (!detail.detail) return
    // Gün adı ekranda gösterilen hâliyle taşınır; seed'de zikirlerin
    // `suitableFor` alanına yazılan değer de bu addır.
    const specialDayName = resolveLocalizedText(detail.detail.name, locale)
    requestSpecialDayIntent({
      specialDayName,
      freeText: t('special-days:detail.aiCta.prefill', { name: specialDayName })
    })
    router.push('/(tabs)/ai-guide')
  }

  return (
    <PageLayout>
      <View className='flex-1 w-full'>
        <PageHeader
          title={t('special-days:detail.pageTitle')}
          leftIconName='chevron-left'
          onPressLeft={() => {
            router.back()
          }}
        />

        <PageScrollView
          contentInnerClassName='w-full px-5'
          bottomPadding={56}
          onRefresh={detail.refresh}
          refreshing={detail.isLoading}
        >
          {detail.error ? (
            <View className='mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3'>
              <Text className='text-sm text-[#fecaca]'>{detail.error}</Text>
            </View>
          ) : null}

          {!detail.detail ? null : (
            <>
              <ThemedCard className='rounded-2xl p-5' borderClassName='border-white/5' elevated>
                <Text className='text-xs font-semibold tracking-[1.1px] text-[--text-muted]'>
                  {upper(t('special-days:detail.pageTitle'))}
                </Text>
                <Text className='mt-2 text-2xl leading-[34px] font-semibold tracking-tight text-[--text-primary]' numberOfLines={2}>
                  {resolveLocalizedText(detail.detail.name, locale)}
                </Text>
                <Text className='mt-1 text-sm leading-5 text-[--text-muted]'>{formatLongDate(detail.detail.date, locale)}</Text>
                {detail.detail.description ? (
                  <Text className='mt-3 text-sm leading-6 text-[--text-primary]'>{resolveLocalizedText(detail.detail.description, locale)}</Text>
                ) : null}
              </ThemedCard>

              <ThemedCard className='mt-4 rounded-2xl p-4' borderClassName='border-white/5'>
                <Text className='text-xs font-semibold tracking-[1px] text-[--text-muted]'>
                  {upper(t('special-days:detail.themeTitle'))}
                </Text>
                <Text className='mt-1 text-base font-semibold text-[--text-primary]'>{resolveLocalizedText(detail.detail.themeTitle, locale)}</Text>
                <Text className='mt-1 text-sm leading-6 text-[--text-muted]'>{resolveLocalizedText(detail.detail.themeSummary, locale)}</Text>
              </ThemedCard>

              {/* İçerik editoryal olarak sonradan doldurulur; boşken kart hiç
                  render edilmez, ekranda boşluk görünmez. */}
              {article ? (
                <ThemedCard className='mt-4 rounded-2xl p-4' borderClassName='border-white/5'>
                  <Text className='text-sm font-semibold text-[--text-primary]'>{t('special-days:detail.article')}</Text>
                  <Text className='mt-2 text-sm leading-7 text-[--text-muted]'>{article}</Text>
                </ThemedCard>
              ) : null}

              {practices.length > 0 ? (
                <ThemedCard className='mt-4 rounded-2xl p-4' borderClassName='border-white/5'>
                  <Text className='text-sm font-semibold text-[--text-primary]'>{t('special-days:detail.practices')}</Text>
                  <View className='mt-3 gap-4'>
                    {practices.map((item, index) => (
                      <View key={`${index}-${resolveLocalizedText(item.title, locale)}`} className='flex-row gap-3'>
                        <View className='mt-1 h-6 w-6 items-center justify-center rounded-full border border-[--accent]/20 bg-[--bg]'>
                          <FontAwesome6 name='hands-praying' size={11} color={tokens.accent} />
                        </View>
                        <View className='flex-1'>
                          <Text className='text-sm font-semibold text-[--text-primary]'>{resolveLocalizedText(item.title, locale)}</Text>
                          <Text className='mt-1 text-sm leading-6 text-[--text-muted]'>{resolveLocalizedText(item.description, locale)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </ThemedCard>
              ) : null}

              <ThemedCard className='mt-6 rounded-2xl p-5' borderClassName='border-[--accent]/30' elevated>
                <View className='flex-row items-center gap-2'>
                  <FontAwesome6 name='wand-magic-sparkles' size={13} color={tokens.accent} />
                  <Text className='text-sm font-semibold text-[--text-primary]'>{t('special-days:detail.aiCta.title')}</Text>
                </View>
                <Text className='mt-2 text-sm leading-6 text-[--text-muted]'>{t('special-days:detail.aiCta.subtitle')}</Text>
                <Pressable
                  onPress={handleAiCtaPress}
                  className='mt-4 h-11 flex-row items-center justify-center gap-2 rounded-full bg-[--accent]'
                >
                  <Text className='text-sm font-semibold' style={{ color: tokens.bg }}>
                    {t('special-days:detail.aiCta.button')}
                  </Text>
                </Pressable>
              </ThemedCard>
            </>
          )}
        </PageScrollView>
      </View>
    </PageLayout>
  )
}
