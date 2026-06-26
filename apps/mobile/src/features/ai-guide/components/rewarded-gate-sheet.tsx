import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

type RewardedGateSheetProps = {
  visible: boolean;
  isRunning?: boolean;
  freeUsedToday: number;
  freeLimit: number;
  onConfirm: () => void;
  onClose: () => void;
};

export function RewardedGateSheet({ visible, isRunning = false, freeUsedToday, freeLimit, onConfirm, onClose }: RewardedGateSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 justify-end">
      <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

      <View className="rounded-t-[32px] border-t border-[--accent]/30 bg-[--card] p-6">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-white/20" />

        <View className="mb-6 items-center">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-[--accent]/15">
            <FontAwesome6 name="gift" size={18} color="#C8972A" />
          </View>
          <Text className="text-center text-xl font-bold text-[--text-primary]">Öneriyi Aç</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-[--text-muted]">
            Asistan önerilerini görmek için ödüllü reklamı izle.
          </Text>
          <View className="mt-3 flex-row items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
            <FontAwesome6 name="circle-check" size={11} color="#C8972A" />
            <Text className="text-sm font-medium text-[--text-muted]">
              Bugün {freeLimit - freeUsedToday}/{freeLimit} ücretsiz hakkın kaldı
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onConfirm}
          disabled={isRunning}
          className={`mb-3 rounded-xl bg-[--accent] py-3.5 ${isRunning ? "opacity-60" : ""}`}
        >
          <Text className="text-center text-base font-bold text-[#0F1B2D]">
            {isRunning ? "Hazırlanıyor..." : "Reklam İzle ve Devam Et"}
          </Text>
        </Pressable>

        <Pressable onPress={onClose} disabled={isRunning} className={`rounded-xl border border-white/10 py-3 ${isRunning ? "opacity-50" : ""}`}>
          <Text className="text-center text-base font-semibold text-[--text-muted]">Vazgeç</Text>
        </Pressable>
      </View>
    </View>
  );
}
