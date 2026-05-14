import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { PageHeader } from "../../../components/ui/page-header";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedInput } from "../../../components/ui/themed-input";
import { useDhikrStore } from "../../../store/dhikr-store";

export function ZikirlerimHeader() {
  const addCustomDhikr = useDhikrStore((state) => state.addCustomDhikr);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [arabicDraft, setArabicDraft] = useState("");
  const [targetDraft, setTargetDraft] = useState("33");
  const [error, setError] = useState<string | null>(null);

  const isSaveDisabled = useMemo(() => nameDraft.trim().length === 0, [nameDraft]);

  const closeCreate = () => {
    setCreateOpen(false);
    setNameDraft("");
    setArabicDraft("");
    setTargetDraft("33");
    setError(null);
  };

  const saveCreate = () => {
    const trimmedName = nameDraft.trim();
    if (!trimmedName) {
      setError("Zikir adı zorunlu.");
      return;
    }

    const parsedTarget = Number.parseInt(targetDraft, 10);
    addCustomDhikr({
      name: trimmedName,
      arabicOrPronunciation: arabicDraft,
      target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
    });
    closeCreate();
  };

  return (
    <>
      <PageHeader
        title="Zikirlerim"
        rightAccessory={
          <Pressable
            onPress={() => setCreateOpen(true)}
            className="h-9 w-9 items-center justify-center rounded-full bg-[--accent] shadow-sm shadow-black/30"
          >
            <FontAwesome6 name="plus" size={14} color="#111827" />
          </Pressable>
        }
      />

      <Modal visible={isCreateOpen} transparent animationType="fade" onRequestClose={closeCreate}>
        <View className="flex-1 justify-end bg-black/55">
          <View className="rounded-t-3xl border-t border-white/10 bg-[--card] px-5 pb-8 pt-5">
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-white/20" />
            <Text className="mb-1 text-lg font-semibold text-[--text-primary]">Yeni Zikir</Text>
            <Text className="mb-4 text-xs text-[--text-muted]">Kendi zikrini ekle ve Ana Sayfa sayacında başlat.</Text>

            <Text className="mb-1.5 text-xs font-medium text-[--text-primary]">Zikir adı</Text>
            <ThemedInput
              value={nameDraft}
              onChangeText={(text) => {
                setNameDraft(text);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Örn. Salavat"
              className="mb-3 rounded-xl bg-[--bg] px-3"
              autoFocus
            />

            <Text className="mb-1.5 text-xs font-medium text-[--text-primary]">Arapça / okunuş (opsiyonel)</Text>
            <ThemedInput
              value={arabicDraft}
              onChangeText={setArabicDraft}
              placeholder="Örn. اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ"
              className="mb-3 rounded-xl bg-[--bg] px-3"
            />

            <Text className="mb-1.5 text-xs font-medium text-[--text-primary]">Hedef</Text>
            <ThemedInput
              value={targetDraft}
              onChangeText={(value) => setTargetDraft(value.replace(/\D+/g, ""))}
              keyboardType="number-pad"
              placeholder="33"
              className="mb-2 rounded-xl bg-[--bg] px-3"
            />

            {error ? <Text className="mb-3 text-xs text-[#F97373]">{error}</Text> : null}

            <View className="mt-1 flex-row items-center justify-end gap-2 pb-8">
              <Pressable onPress={closeCreate} className="rounded-full border border-white/20 px-4 py-2">
                <Text className="text-sm font-medium text-[--text-primary]">İptal</Text>
              </Pressable>
              <PrimaryCtaButton
                label="Kaydet"
                onPress={saveCreate}
                disabled={isSaveDisabled}
                className={`px-4 !py-2 ${isSaveDisabled ? "opacity-50" : ""}`}
                textClassName="text-sm font-semibold"
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
