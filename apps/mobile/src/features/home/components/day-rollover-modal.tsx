import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { TEST_IDS } from '../../../test-ids'
import { useHomeUi } from '../home-context'

/** M-01: "Dünkü N'i kaydet / at" — asked once when a member's unsaved count is from an earlier day. */
export function DayRolloverModal() {
  const home = useHomeUi()
  const { t } = useTranslation('home')
  const count = home.dayRolloverCount

  return (
    <ConfirmModal
      visible={home.isDayRolloverOpen}
      title={t('home:dayRollover.title')}
      message={t('home:dayRollover.message', { name: home.dayRolloverDhikrName, count })}
      confirmLabel={t('home:dayRollover.save', { count })}
      cancelLabel={t('home:dayRollover.discard')}
      confirmTestID={TEST_IDS.home.dayRolloverSave}
      cancelTestID={TEST_IDS.home.dayRolloverDiscard}
      onConfirm={home.onDayRolloverSave}
      onCancel={home.onDayRolloverDiscard}
      // Android back must not discard yesterday's count: the question stays open until answered.
      onRequestClose={() => {}}
    />
  )
}
