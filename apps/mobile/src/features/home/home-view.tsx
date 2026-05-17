import { useThemeTokens } from '@zikirmatik/ui'
import { Modal, Pressable, Text, TextInput, View } from 'react-native'
import { DhikrContentStack } from '../../components/ui/dhikr-content-stack'
import { PageLayout, PageScrollView } from '../../components/ui/page-layout'
import { PageHeader } from '../../components/ui/page-header'
import { useHomeContext } from './home-context'
import { AppleWatch } from './components/apple-watch'

function TopBar() {
  const home = useHomeContext()

  return <PageHeader title='Zikirmatik Asistan' subtitle={`${home.greeting} • Seri ${home.streakLabel}`} />
}

function SelectedDhikrMeaning() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()
  const transliteration = home.mainDhikr.turkish?.trim()
  const arabic = home.mainDhikr.arabic?.trim()
  const meaning = home.mainDhikr.meaning?.trim()
  const shouldShowTitleOnly = home.mainDhikr.source === 'personal' && !arabic && !meaning && Boolean(transliteration)

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
        {shouldShowTitleOnly ? (
          <View className='mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2'>
            <Text className='mb-1 text-[10px] font-semibold uppercase tracking-[0.9px] text-[--text-muted]'>Başlık</Text>
            <Text className='text-sm leading-5 text-[--text-primary]'>{transliteration}</Text>
          </View>
        ) : (
          <DhikrContentStack
            arabic={arabic}
            transliteration={transliteration}
            meaning={meaning}
            order={['transliteration', 'meaning', 'arabic']}
          />
        )}
      </View>
    </View>
  )
}

function FreeModeButton() {
  const home = useHomeContext()
  const { tokens } = useThemeTokens()

  if (!home.selectedDhikrId) {
    return null
  }

  return (
    <View className='mb-4 px-5'>
      <Pressable
        onPress={home.onStartFreeMode}
        className='rounded-full border px-4 py-3'
        style={{ borderColor: withAlpha(tokens.textPrimary, 0.2), backgroundColor: withAlpha(tokens.card, 0.72) }}
      >
        <Text className='text-center text-sm font-semibold' style={{ color: tokens.textPrimary }}>
          Serbest Moda Geç
        </Text>
      </Pressable>
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
          <Text className='mb-1 mt-1 text-xs font-medium' style={{ color: tokens.textPrimary }}>
            Hedef (opsiyonel)
          </Text>
          <TextInput
            value={home.freeSaveTargetDraft}
            onChangeText={home.onFreeSaveTargetChange}
            keyboardType='number-pad'
            placeholder='Boş bırakırsan sonsuz'
            placeholderTextColor={tokens.textMuted}
            className='mb-2 rounded-xl px-3 py-3 text-sm'
            style={{
              borderWidth: 1,
              borderColor: withAlpha(tokens.textPrimary, 0.2),
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
  const hasDhikrDetail = hasContent(home.mainDhikr.turkish) || hasContent(home.mainDhikr.meaning) || hasContent(home.mainDhikr.arabic)

  return (
    <PageLayout frameClassName='relative flex-1 w-full max-w-[375px]'>
      <TopBar />
      <PageScrollView
        contentInnerClassName='w-full'
        contentContainerStyle={!hasDhikrDetail ? { flexGrow: 1, justifyContent: 'center' } : undefined}
        bottomPadding={hasDhikrDetail ? 32 : 0}
        onRefresh={home.refresh}
        refreshing={home.isRefreshing}
      >
        <AppleWatch />
        <SelectedDhikrMeaning />
        <FreeModeButton />
      </PageScrollView>
      <TargetModal />
      <FreeSaveNameModal />
    </PageLayout>
  )
}

function hasContent(value: string | undefined) {
  return Boolean(value?.trim())
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
