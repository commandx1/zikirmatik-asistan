import { useRouter } from 'expo-router'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { useAuthPromptStore } from '../../../store/auth-prompt-store'

export function AuthPromptModal() {
  const router = useRouter()
  const visible = useAuthPromptStore((s) => s.visible)
  const close = useAuthPromptStore((s) => s.close)

  return (
    <ConfirmModal
      visible={visible}
      title='Bu özellik için üye olun'
      message='AI özellikleri, satın alma ve senkronizasyon için giriş gerekli.'
      confirmLabel='Üye ol'
      cancelLabel='Vazgeç'
      onConfirm={() => {
        close()
        router.push('/auth')
      }}
      onCancel={close}
    />
  )
}
