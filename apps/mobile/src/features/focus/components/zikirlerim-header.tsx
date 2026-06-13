import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { useThemeTokens } from '@zikirmatik/ui'
import { PageHeader } from '../../../components/ui/page-header'
import { createUserDhikr } from '../../dhikrs/services/user-dhikrs-api-client'
import { useAuthStore } from '../../../store/auth-store'
import { useDhikrStore } from '../../../store/dhikr-store'
import { ZikirFormModal } from './zikir-form-modal'

export function ZikirlerimHeader() {
  const router = useRouter()
  const { tokens } = useThemeTokens()
  const addCustomDhikr = useDhikrStore(state => state.addCustomDhikr)
  const removePersonalDhikr = useDhikrStore(state => state.removePersonalDhikr)
  const authStatus = useAuthStore(state => state.status)
  const sessionAccessToken = useAuthStore(state => state.session?.accessToken)

  const [isCreateOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const closeCreate = () => {
    setCreateOpen(false)
    setError(null)
  }

  const saveCreate = async (values: { name: string; transliteration: string; meaning: string; target: number }) => {
    const trimmedName = values.name.trim()
    const trimmedPronunciation = values.transliteration.trim()
    const createdId = addCustomDhikr({
      name: trimmedName,
      transliteration: trimmedPronunciation || undefined,
      meaning: values.meaning.trim() || undefined,
      target: values.target > 0 ? values.target : 0
    })

    if (authStatus === 'authenticated') {
      setIsSaving(true)
      try {
        await createUserDhikr(
          {
            clientId: createdId,
            name: trimmedName,
            transliteration: trimmedPronunciation || undefined,
            meaning: values.meaning.trim() || undefined,
            target: values.target > 0 ? values.target : 0
          },
          sessionAccessToken
        )
      } catch {
        removePersonalDhikr(createdId)
        setError('Zikir kaydedilemedi. Lütfen tekrar dene.')
        setIsSaving(false)
        return
      } finally {
        setIsSaving(false)
      }
    }

    closeCreate()
  }

  return (
    <>
      <PageHeader
        title='Zikirlerim'
        leftAccessory={
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/collections' as any)}
            className='h-9 w-9 items-center justify-center rounded-full border border-white/10'
          >
            <FontAwesome6 name='border-all' size={14} color={tokens.textMuted} />
          </Pressable>
        }
        rightAccessory={
          <Pressable
            onPress={() => {
              setError(null)
              setCreateOpen(true)
            }}
            className='h-9 w-9 items-center justify-center rounded-full bg-[--accent] shadow-sm shadow-black/30'
          >
            <FontAwesome6 name='plus' size={14} color='#111827' />
          </Pressable>
        }
      />

      <ZikirFormModal
        visible={isCreateOpen}
        title='Yeni Zikir'
        description='Kendi zikrini ekle ve Ana Sayfa sayacında başlat.'
        submitLabel='Kaydet'
        savingLabel='Kaydediliyor'
        isSaving={isSaving}
        error={error}
        initialValues={{
          name: '',
          transliteration: '',
          meaning: '',
          target: 33
        }}
        onRequestClose={closeCreate}
        onErrorClear={() => setError(null)}
        onSubmit={saveCreate}
      />
    </>
  )
}
