import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("components");
  return (
    <ScreenFrame>
      <SectionHeader title={t("components:screen.title")} subtitle={t("components:screen.subtitle")} />
      <DhikrCard dhikr={DHIKR_MOCKS[0]} />
      <View className="flex-row flex-wrap gap-2">
        <AppChip label={t("components:screen.moodCalm")} active />
        <AppChip label={t("components:screen.moodStressed")} />
        <AppChip label={t("components:screen.moodTired")} />
      </View>
      <CounterButton value={87} target={100} />
      <KandilCountdownCard title={t("components:screen.countdownTitle")} countdownLabel={t("components:screen.countdownLabel")} />
      <AppCard>
        <Text className="text-xs text-[--text-muted]">{t("components:screen.footerNote")}</Text>
      </AppCard>
    </ScreenFrame>
  );
}
