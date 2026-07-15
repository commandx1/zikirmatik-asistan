import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { KeyboardAwareBottomSheetModal } from '../../../components/ui/keyboard-aware-bottom-sheet-modal'
import { PrimaryCtaButton } from '../../../components/ui/primary-cta-button'
import { ThemedInput } from '../../../components/ui/themed-input'

type ZikirFormValues = {
  name: string
  transliteration: string
  meaning: string
  target: number
}

type ZikirFormModalProps = {
  visible: boolean
  title: string
  description: string
  submitLabel: string
  savingLabel: string
  isSaving: boolean
  error?: string | null
  initialValues: ZikirFormValues
  onRequestClose: () => void
  onErrorClear?: () => void
  onSubmit: (values: ZikirFormValues) => Promise<void> | void
}

export function ZikirFormModal({
  visible,
  title,
  description,
  submitLabel,
  savingLabel,
  isSaving,
  error,
  initialValues,
  onRequestClose,
  onErrorClear,
  onSubmit
}: ZikirFormModalProps) {
  const { t } = useTranslation('focus')
  const [nameDraft, setNameDraft] = useState(initialValues.name)
  const [transliterationDraft, setTransliterationDraft] = useState(initialValues.transliteration)
  const [meaningDraft, setMeaningDraft] = useState(initialValues.meaning)
  const [targetDraft, setTargetDraft] = useState(initialValues.target > 0 ? String(initialValues.target) : '')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      return
    }

    setNameDraft(initialValues.name)
    setTransliterationDraft(initialValues.transliteration)
    setMeaningDraft(initialValues.meaning)
    setTargetDraft(initialValues.target > 0 ? String(initialValues.target) : '')
    setLocalError(null)
  }, [initialValues.meaning, initialValues.name, initialValues.target, initialValues.transliteration, visible])

  const isSaveDisabled = useMemo(() => nameDraft.trim().length === 0 || isSaving, [isSaving, nameDraft])
  const resolvedError = localError ?? error ?? null

  const handleSubmit = async () => {
    const trimmedName = nameDraft.trim()
    if (!trimmedName) {
      setLocalError(t('focus:form.errors.nameRequired'))
      return
    }

    const parsedTarget = targetDraft.trim().length > 0 ? Number.parseInt(targetDraft, 10) : 0
    if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
      setLocalError(t('focus:form.errors.targetInvalid'))
      return
    }

    setLocalError(null)
    await onSubmit({
      name: trimmedName,
      transliteration: transliterationDraft,
      meaning: meaningDraft,
      target: parsedTarget
    })
  }

  const clearErrors = () => {
    if (localError) {
      setLocalError(null)
    }
    onErrorClear?.()
  }

  return (
    <KeyboardAwareBottomSheetModal
      visible={visible}
      onRequestClose={onRequestClose}
      animationType='slide'
      showHandle
      overlayClassName='flex-1 justify-end bg-black/55'
      sheetClassName='rounded-t-3xl border-t border-white/10 bg-[--card] p-5 pb-10'
      scrollContentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className='mb-1 text-lg font-semibold text-[--text-primary]'>{title}</Text>
      <Text className='mb-4 text-xs text-[--text-muted]'>{description}</Text>

      <Text className='mb-1.5 text-xs font-medium text-[--text-primary]'>{t('focus:form.nameLabel')}</Text>
      <ThemedInput
        value={nameDraft}
        onChangeText={text => {
          setNameDraft(text)
          clearErrors()
        }}
        placeholder={t('focus:form.namePlaceholder')}
        className='mb-3 rounded-xl bg-[--bg] px-3'
        autoFocus
      />

      <Text className='mb-1.5 text-xs font-medium text-[--text-primary]'>{t('focus:form.transliterationLabel')}</Text>
      <ThemedInput
        value={transliterationDraft}
        onChangeText={text => {
          setTransliterationDraft(text)
          clearErrors()
        }}
        placeholder={t('focus:form.transliterationPlaceholder')}
        className='mb-3 rounded-xl bg-[--bg] px-3'
      />

      <Text className='mb-1.5 text-xs font-medium text-[--text-primary]'>{t('focus:form.meaningLabel')}</Text>
      <ThemedInput
        value={meaningDraft}
        onChangeText={text => {
          setMeaningDraft(text)
          clearErrors()
        }}
        placeholder={t('focus:form.meaningPlaceholder')}
        className='mb-3 rounded-xl bg-[--bg] px-3'
      />

      <Text className='mb-1.5 text-xs font-medium text-[--text-primary]'>{t('focus:form.targetLabel')}</Text>
      <ThemedInput
        value={targetDraft}
        onChangeText={value => {
          setTargetDraft(value.replace(/\D+/g, ''))
          clearErrors()
        }}
        keyboardType='number-pad'
        placeholder={t('focus:form.targetPlaceholder')}
        className='mb-2 rounded-xl bg-[--bg] px-3'
      />

      {resolvedError ? <Text className='mb-3 text-xs text-[#F97373]'>{resolvedError}</Text> : null}

      <View className='mt-1 mb-2 flex-row items-center justify-end gap-2'>
        <Pressable onPress={onRequestClose} disabled={isSaving} className='rounded-full border border-white/20 px-4 py-2'>
          <Text className='text-sm font-medium text-[--text-primary]'>{t('common:actions.cancel')}</Text>
        </Pressable>
        <PrimaryCtaButton
          label={isSaving ? savingLabel : submitLabel}
          onPress={() => {
            void handleSubmit()
          }}
          disabled={isSaveDisabled}
          className={`px-4 !py-2 ${isSaveDisabled ? 'opacity-50' : ''}`}
          textClassName='text-sm font-semibold'
        />
      </View>
    </KeyboardAwareBottomSheetModal>
  )
}
