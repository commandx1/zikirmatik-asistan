import { Text, View } from "react-native";
import {
  AppCard,
  AppChip,
  CounterButton,
  DhikrCard,
  KandilCountdownCard,
  SectionHeader
} from "@zikirmatik/ui";
import { DHIKR_MOCKS } from "@zikirmatik/shared";
import { ScreenFrame } from "../../components/ui/screen-frame";

export function ComponentsScreen() {
  return (
    <ScreenFrame>
      <SectionHeader title="Bileşen Kütüphanesi" subtitle="Reusable UI envanteri" />
      <DhikrCard dhikr={DHIKR_MOCKS[0]} />
      <View className="flex-row flex-wrap gap-2">
        <AppChip label="Huzurlu" active />
        <AppChip label="Stresli" />
        <AppChip label="Yorgun" />
      </View>
      <CounterButton value={87} target={100} />
      <KandilCountdownCard title="Mevlid Kandili" countdownLabel="4 gün kaldı" />
      <AppCard>
        <Text className="text-xs text-[--text-muted]">Bu ekran docs/design/components parity referansıdır.</Text>
      </AppCard>
    </ScreenFrame>
  );
}
