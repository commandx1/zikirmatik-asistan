import { useLocalSearchParams } from 'expo-router'
import { VirdSessionScreen } from '../../src/features/vird/screens/vird-session-screen'

export default function VirdSessionRoute() {
  const { programId, slot, prayerIndex } = useLocalSearchParams<{
    programId?: string
    slot?: string
    prayerIndex?: string
  }>()
  const parsedPrayerIndex = typeof prayerIndex === 'string' ? Number.parseInt(prayerIndex, 10) : NaN
  return (
    <VirdSessionScreen
      programId={typeof programId === 'string' ? programId : undefined}
      slot={typeof slot === 'string' ? slot : undefined}
      prayerIndex={Number.isFinite(parsedPrayerIndex) ? parsedPrayerIndex : null}
    />
  )
}
