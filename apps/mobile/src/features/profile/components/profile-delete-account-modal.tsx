import { ActivityIndicator, Pressable, Text, View } from "react-native";

const DANGER_COLOR = "#ef4444";

const LOST_DATA_ITEMS = [
  "Tüm zikir geçmişin ve istatistiklerin",
  "Kişisel zikirklerin",
  "Profil bilgilerin",
  "Abonelik kaydın",
  "AI Rehber tavsiye geçmişin"
];

type ProfileDeleteAccountModalProps = {
  visible: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ProfileDeleteAccountModal({
  visible,
  isDeleting,
  onConfirm,
  onCancel
}: ProfileDeleteAccountModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 justify-end">
      <Pressable className="absolute inset-0 bg-black/60" onPress={isDeleting ? undefined : onCancel} />
      <View className="rounded-t-[28px] border-t border-white/10 bg-[--card] p-5">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-white/20" />

        <View
          className="mb-4 flex-row items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: `${DANGER_COLOR}18`, borderWidth: 1, borderColor: `${DANGER_COLOR}40` }}
        >
          <Text className="text-sm font-medium" style={{ color: DANGER_COLOR }}>
            ⚠️  Bu işlem geri alınamaz
          </Text>
        </View>

        <Text className="text-xl font-semibold text-[--text-primary]">Hesabını Sil</Text>
        <Text className="mt-1 text-sm text-[--text-muted]">
          Hesabını silersen aşağıdaki veriler kalıcı olarak silinir:
        </Text>

        <View className="mt-3 gap-1.5">
          {LOST_DATA_ITEMS.map((item) => (
            <View key={item} className="flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DANGER_COLOR }} />
              <Text className="text-sm text-[--text-muted]">{item}</Text>
            </View>
          ))}
        </View>

        <View className="mt-6 gap-2">
          <Pressable
            onPress={onConfirm}
            disabled={isDeleting}
            className={`h-12 items-center justify-center rounded-2xl ${isDeleting ? "opacity-60" : ""}`}
            style={{ backgroundColor: `${DANGER_COLOR}20`, borderWidth: 1, borderColor: `${DANGER_COLOR}55` }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={DANGER_COLOR} />
            ) : (
              <Text className="text-sm font-semibold" style={{ color: DANGER_COLOR }}>
                Hesabı Kalıcı Olarak Sil
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={onCancel}
            disabled={isDeleting}
            className={`h-11 items-center justify-center rounded-2xl ${isDeleting ? "opacity-50" : ""}`}
          >
            <Text className="text-sm font-medium text-[--text-muted]">İptal</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
