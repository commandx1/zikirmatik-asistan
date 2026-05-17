import { Text, View } from "react-native";
import { BottomCta } from "../onboarding-primitives";
import { useOnboardingFlowContext } from "../../context/onboarding-flow-context";

export function SplashStep() {
  const flow = useOnboardingFlowContext();

  return (
    <>
      <View className="absolute inset-0 bg-[#0F1B2D]" />
      <View className="absolute inset-0 opacity-50">
        <View className="h-full w-full flex-row flex-wrap">
          {Array.from({ length: 90 }).map((_, index) => (
            <View
              key={`splash-pattern-${index}`}
              className={index % 3 === 0 ? "h-[40px] w-[40px] bg-[#C8972A]/5" : "h-[40px] w-[40px]"}
            />
          ))}
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View
          className="mb-8 h-28 w-28 items-center justify-center rounded-full bg-[#C8972A]"
          style={{ boxShadow: "0 0 40px rgba(200,151,42,0.5)" }}
        >
          <Text className="text-[50px] text-[#0F1B2D]">🤲</Text>
        </View>

        <Text className="text-center text-[52px] font-bold leading-[58px] text-[#F0EDE6]">
          Zikirmatik{"\n"}Rehber
        </Text>
        <Text className="mb-16 mt-3 text-center text-[15px] font-medium text-[#9A9080]">
          Akıllı Tesbihat Asistanın
        </Text>
      </View>

      <View className="pb-12">
        <Text className="text-center text-[11px] text-[#9A9080]/50">v1.0.0</Text>
      </View>

      <BottomCta label="Başla" onPress={flow.onNext} />
    </>
  );
}
