import { ScrollView, View } from "react-native";
import {
  BackgroundPattern,
  BottomCta,
  MoodTile,
  ProgressDots,
  StepHeading
} from "../onboarding-primitives";
import { MOOD_OPTIONS } from "../../onboarding-data";
import { useOnboardingFlowContext } from "../../context/onboarding-flow-context";

export function MoodStep() {
  const flow = useOnboardingFlowContext();

  return (
    <>
      <BackgroundPattern />
      <View className="px-6 pb-6 pt-12">
        <ProgressDots activeIndex={1} count={4} />
        <StepHeading title="Şu an nasıl hissediyorsun?" subtitle="Asistan önerilerin buna göre şekillenecek" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 144 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row flex-wrap justify-between gap-y-3">
          {MOOD_OPTIONS.map((item) => (
            <MoodTile
              key={item.id}
              emoji={item.emoji}
              label={item.label}
              active={flow.mood === item.id}
              onPress={() => flow.setMood(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomCta label="Devam" onPress={flow.onNext} />
    </>
  );
}
