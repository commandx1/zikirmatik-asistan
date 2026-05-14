import { ScrollView, View } from "react-native";
import {
  BackgroundPattern,
  BottomCta,
  CardOption,
  ProgressDots,
  StepHeading
} from "../onboarding-primitives";
import { PURPOSE_OPTIONS } from "../../onboarding-data";
import { useOnboardingFlowContext } from "../../context/onboarding-flow-context";

export function PurposeStep() {
  const flow = useOnboardingFlowContext();

  return (
    <>
      <BackgroundPattern />
      <View className="px-6 pb-6 pt-12">
        <ProgressDots activeIndex={0} count={3} />
        <StepHeading title="Amacın nedir?" subtitle="Sana daha iyi rehberlik edebilmek için" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 144 }} showsVerticalScrollIndicator={false}>
        {PURPOSE_OPTIONS.map((item) => (
          <CardOption
            key={item.id}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            active={flow.purpose === item.id}
            onPress={() => flow.setPurpose(item.id)}
          />
        ))}
      </ScrollView>

      <BottomCta label="Devam" onPress={flow.onNext} />
    </>
  );
}
