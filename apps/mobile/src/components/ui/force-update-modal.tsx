import { Linking, Modal, Pressable, Text, View } from "react-native";
import { STORE_URL } from "../../lib/app-config";

type ForceUpdateModalProps = {
  visible: boolean;
};

export function ForceUpdateModal({ visible }: ForceUpdateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-[340px] rounded-2xl bg-[#0F1B2D] p-6" style={{ borderWidth: 1, borderColor: "rgba(200,151,42,0.25)" }}>
          <Text className="mb-1 text-center text-[22px] font-bold text-white">Güncelleme Gerekli</Text>
          <Text className="mb-6 mt-2 text-center text-[14px] leading-5 text-white/60">
            Bu sürüm artık desteklenmiyor. Uygulamayı kullanmaya devam etmek için lütfen mağazadan güncelleyin.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(STORE_URL)}
            className="items-center rounded-full bg-[#C8972A] py-4"
            style={{ boxShadow: "0 0 20px rgba(200,151,42,0.35)" }}
          >
            <Text className="text-[15px] font-bold text-[#0F1B2D]">Güncelle</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
