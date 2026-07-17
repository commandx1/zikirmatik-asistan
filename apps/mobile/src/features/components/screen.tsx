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
import { resolveLocalizedText } from "../../store/dhikr-store";

export function ComponentsScreen() {
  const { t, i18n } = useTranslation("components");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
  const dhikrMock = DHIKR_MOCKS[0];
  return (
    <ScreenFrame>
      <SectionHeader title={t("components:screen.title")} subtitle={t("components:screen.subtitle")} />
      {dhikrMock ? (
        <DhikrCard
          nameArabic={dhikrMock.nameArabic}
          name={resolveLocalizedText(dhikrMock.name, locale)}
          meaning={resolveLocalizedText(dhikrMock.meaning, locale)}
        />
      ) : null}
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
