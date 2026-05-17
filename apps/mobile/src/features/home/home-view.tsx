import { useThemeTokens } from '@zikirmatik/ui'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { DhikrContentStack } from '../../components/ui/dhikr-content-stack'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { useHomeContext } from './home-context'
import { AppleWatch } from './components/apple-watch'

function TopBar() {
  const home = useHomeContext()

  return <PageHeader title='Zikirmatik Asistan' subtitle={`${home.greeting} • Seri ${home.streakLabel}`} />
}

function QuickAccessList() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <View className='mb-1 w-full'>
      <Text className='mb-3 px-6 text-xs font-semibold uppercase tracking-[1.3px]' style={{ color: tokens.textMuted }}>
        Bugünkü Zikirler
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      >
        <View className='flex-row gap-2.5'>
          {home.quickDhikrs.map(item => {
            const active = item === home.activeQuickDhikr
            return (
              <Pressable
                key={item}
                onPress={() => home.onQuickDhikrSelect(item)}
                className={active ? 'rounded-full px-4 py-2.5' : 'rounded-full border px-4 py-2.5'}
                style={
                  active
                    ? { backgroundColor: tokens.accent }
                    : { borderColor: withAlpha(tokens.textPrimary, 0.08), backgroundColor: tokens.card }
                }
              >
                <Text className='text-sm font-medium' style={{ color: active ? tokens.bg : tokens.textPrimary }}>
                  {item}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

function SelectedDhikrMeaning() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const transliteration = home.mainDhikr.turkish?.trim()
  const arabic = home.mainDhikr.arabic?.trim()
  const meaning = home.mainDhikr.meaning?.trim()

  if (!transliteration && !meaning && !arabic) {
    return null
  }

  return (
    <View className='mb-5 px-5'>
      <View
        className='rounded-2xl px-4 py-3'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: withAlpha(tokens.card, 0.92)
        }}
      >
        <Text className='mb-1 text-[11px] font-semibold uppercase tracking-[1.1px]' style={{ color: tokens.textMuted }}>
          Zikir Detayı
        </Text>
        <DhikrContentStack
          arabic={arabic}
          transliteration={transliteration}
          meaning={meaning}
          order={['transliteration', 'meaning', 'arabic']}
        />
      </View>
    </View>
  )
}

function TargetModal() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <Modal visible={home.isEditingTarget} transparent animationType='fade' onRequestClose={home.onTargetCancel}>
      <View className='flex-1 items-center justify-center bg-black/50 px-6'>
        <View
          className='w-full max-w-[320px] rounded-2xl p-5'
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.1), backgroundColor: tokens.card }}
        >
          <Text className='mb-3 text-base font-semibold' style={{ color: tokens.textPrimary }}>
            Yeni hedef belirle
          </Text>
          <TextInput
            value={home.targetDraft}
            onChangeText={home.onTargetDraftChange}
            keyboardType='number-pad'
            autoFocus
            selectTextOnFocus
            placeholder='Hedef sayısı'
            placeholderTextColor={tokens.textMuted}
            className='mb-4 rounded-xl px-3 py-3 text-sm'
            style={{
              borderWidth: 1,
              borderColor: withAlpha(tokens.accent, 0.4),
              backgroundColor: withAlpha(tokens.bg, 0.9),
              color: tokens.textPrimary
            }}
            onSubmitEditing={home.onTargetSubmit}
          />
          <View className='flex-row justify-end gap-2'>
            <Pressable
              onPress={home.onTargetCancel}
              className='rounded-full px-4 py-2'
              style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.2) }}
            >
              <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
                İptal
              </Text>
            </Pressable>
            <Pressable
              onPress={home.onTargetSubmit}
              className='rounded-full px-4 py-2'
              style={{ backgroundColor: tokens.accent }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.bg }}>
                Kaydet
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function FreeSaveNameModal() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  return (
    <Modal visible={home.isFreeSaveNameModalOpen} transparent animationType='fade' onRequestClose={home.onFreeSaveNameCancel}>
      <View className='flex-1 items-center justify-center bg-black/50 px-6'>
        <View
          className='w-full max-w-[320px] rounded-2xl p-5'
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.1), backgroundColor: tokens.card }}
        >
          <Text className='mb-2 text-base font-semibold' style={{ color: tokens.textPrimary }}>
            Zikir Kaydet
          </Text>
          <Text className='mb-3 text-xs' style={{ color: tokens.textMuted }}>
            Serbest çektiğin zikri kaydetmek için bir isim yaz.
          </Text>
          <TextInput
            value={home.freeSaveNameDraft}
            onChangeText={home.onFreeSaveNameChange}
            autoFocus
            placeholder='Örn. Sessiz tesbih'
            placeholderTextColor={tokens.textMuted}
            className='mb-2 rounded-xl px-3 py-3 text-sm'
            style={{
              borderWidth: 1,
              borderColor: withAlpha(tokens.accent, 0.4),
              backgroundColor: withAlpha(tokens.bg, 0.9),
              color: tokens.textPrimary
            }}
            onSubmitEditing={home.onFreeSaveNameSubmit}
          />
          {home.freeSaveNameError ? (
            <Text className='mb-3 text-xs text-[#F97373]'>{home.freeSaveNameError}</Text>
          ) : null}
          <View className='flex-row justify-end gap-2'>
            <Pressable
              onPress={home.onFreeSaveNameCancel}
              className='rounded-full px-4 py-2'
              style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.2) }}
            >
              <Text className='text-sm font-medium' style={{ color: tokens.textPrimary }}>
                İptal
              </Text>
            </Pressable>
            <Pressable
              onPress={home.onFreeSaveNameSubmit}
              className='rounded-full px-4 py-2'
              style={{ backgroundColor: tokens.accent }}
            >
              <Text className='text-sm font-semibold' style={{ color: tokens.bg }}>
                Kaydet
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function HomeView() {
  const home = useHomeContext()

  return (
    <PageLayout frameClassName='relative flex-1 w-full max-w-[375px]'>
      <TopBar />
      <PageScrollView
        contentInnerClassName='w-full'
        bottomPadding={32}
        onRefresh={home.refresh}
        refreshing={home.isRefreshing}
      >
        <AppleWatch />
        <SelectedDhikrMeaning />
        <QuickAccessList />
      </PageScrollView>
      <TargetModal />
      <FreeSaveNameModal />
    </PageLayout>
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
