import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { useAuthPromptStore } from '../../../store/auth-prompt-store'

export function AuthPromptModal() {
  const { t } = useTranslation('auth')
  const router = useRouter()
  const visible = useAuthPromptStore((s) => s.visible)
  const close = useAuthPromptStore((s) => s.close)

  return (
    <ConfirmModal
      visible={visible}
      title={t('auth:promptModal.title')}
      message={t('auth:promptModal.message')}
      confirmLabel={t('auth:promptModal.confirm')}
      cancelLabel={t('auth:promptModal.cancel')}
      onConfirm={() => {
        close()
        router.push('/auth')
      }}
      onCancel={close}
    />
  )
}
