import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { AppSelectBox } from "../../../../components/ui/app-selectbox";
import {
  BackgroundPattern,
  BottomCta,
  ProgressDots,
  StepHeading
} from "../onboarding-primitives";
import { cities } from "../../../../lib/cities";
import { useOnboardingFlowContext } from "../../context/onboarding-flow-context";

export function LocationStep() {
  const flow = useOnboardingFlowContext();
  const hasCity = flow.city.trim().length > 0;
  const cityOptions = useMemo(
    () =>
      cities.map((item) => {
        const label = toDisplayCity(item);
        return { label, value: label };
      }),
    []
  );

  return (
    <>
      <BackgroundPattern />
      <View className="px-6 pb-6 pt-12">
        <ProgressDots activeIndex={2} count={3} />
        <StepHeading
          title={"Namaz vakitleri için\nşehrini seç"}
          subtitle="Ezan bildirimleri ve özel gün hatırlatmaları için"
        />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 144 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3">
          <AppSelectBox
            value={flow.city}
            placeholder="Şehir seç..."
            title="Şehirler"
            options={cityOptions}
            onChange={flow.setCity}
          />
        </View>

        <Text className="text-sm leading-[18px] text-[#9A9080]">
          Namaz vakti ve hatırlatmalar bu şehir üzerinden planlanır.
        </Text>

        {flow.submitError ? <Text className="mt-3 text-sm text-[#ffb4b4]">{flow.submitError}</Text> : null}
      </ScrollView>

      <BottomCta label="Devam" onPress={flow.onNext} disabled={!hasCity} />
    </>
  );
}

function toDisplayCity(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((part) => (part ? `${part[0].toLocaleUpperCase("tr-TR")}${part.slice(1)}` : part))
    .join(" ");
}
