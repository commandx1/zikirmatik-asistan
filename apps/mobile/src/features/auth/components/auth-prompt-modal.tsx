import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { useAuthPromptStore } from '../../../store/auth-prompt-store'
import { TEST_IDS } from '../../../test-ids'

export function AuthPromptModal() {
  const { t } = useTranslation('auth')
  const router = useRouter()
  const visible = useAuthPromptStore((s) => s.visible)
  const reason = useAuthPromptStore((s) => s.reason)
  const close = useAuthPromptStore((s) => s.close)

  return (
    <ConfirmModal
      visible={visible}
      title={t('auth:promptModal.title')}
      message={reason === 'save' ? t('auth:promptModal.saveMessage') : t('auth:promptModal.message')}
      confirmLabel={t('auth:promptModal.confirm')}
      cancelLabel={t('auth:promptModal.cancel')}
      confirmTestID={TEST_IDS.auth.promptConfirm}
      cancelTestID={TEST_IDS.auth.promptCancel}
      onConfirm={() => {
        close()
        router.push('/auth')
      }}
      onCancel={close}
    />
  )
}
