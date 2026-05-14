import { Pressable, Text, View } from "react-native";
import { AppSelectBox } from "../../../components/ui/app-selectbox";
import { cities } from "../../../lib/cities";
import { PURPOSE_OPTIONS } from "../../onboarding/onboarding-data";

type ProfilePersonalInfoModalProps = {
  visible: boolean;
  purpose: string;
  city: string;
  isSaving: boolean;
  error?: string;
  canSave: boolean;
  onChangePurpose: (value: string) => void;
  onChangeCity: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function ProfilePersonalInfoModal({
  visible,
  purpose,
  city,
  isSaving,
  error,
  canSave,
  onChangePurpose,
  onChangeCity,
  onSave,
  onClose
}: ProfilePersonalInfoModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 justify-end">
      <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
      <View className="rounded-t-[28px] border-t border-white/10 bg-[--card] p-5">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-white/20" />
        <Text className="text-[20px] font-semibold text-[--text-primary]">Kişisel Bilgiler</Text>
        <Text className="mt-1 text-[13px] text-[--text-muted]">
          Amaç ve şehir bilgini güncelleyebilirsin.
        </Text>

        <View className="mt-4 gap-3">
          <AppSelectBox
            value={purpose}
            placeholder="Amaç seç..."
            title="Amaç"
            options={PURPOSE_OPTIONS.map((item) => ({ label: item.title, value: item.id }))}
            onChange={onChangePurpose}
            disabled={isSaving}
          />
          <AppSelectBox
            value={city}
            placeholder="Şehir seç..."
            title="Şehir"
            options={cities.map((item) => {
              const label = toDisplayCity(item);
              return { label, value: label };
            })}
            onChange={onChangeCity}
            disabled={isSaving}
          />
        </View>

        {error ? (
          <View className="mt-3 rounded-xl border border-[#f97316]/40 bg-[#f97316]/12 px-3 py-2">
            <Text className="text-xs text-[#fed7aa]">{error}</Text>
          </View>
        ) : null}

        <View className="mt-5 flex-row gap-3">
          <Pressable
            onPress={onClose}
            disabled={isSaving}
            className={`flex-1 rounded-xl border border-white/15 py-3 ${isSaving ? "opacity-60" : ""}`}
          >
            <Text className="text-center text-[14px] font-semibold text-[--text-muted]">Vazgeç</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={!canSave || isSaving}
            className={`flex-1 rounded-xl bg-[--accent] py-3 ${!canSave || isSaving ? "opacity-60" : ""}`}
          >
            <Text className="text-center text-[14px] font-semibold text-[#0F1B2D]">
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
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
