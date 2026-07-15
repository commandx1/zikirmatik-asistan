import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useZikirlerim } from "../context/zikirlerim-context";
import { ZikirItemCard } from "./zikir-item-card";

export function ZikirListSection() {
  const { t } = useTranslation("focus");
  const { items, selectedDhikrId, deletingDhikrId, editingDhikr, isUpdatingDhikr } = useZikirlerim();

  if (items.length === 0) {
    return (
      <View className="px-5 pb-6">
        <View className="items-center rounded-2xl border border-white/5 bg-[--card] p-6">
          <Text className="text-sm text-[--text-muted]">{t("focus:list.empty")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3 px-5 pb-6">
      {items.map((item) => (
        <ZikirItemCard
          key={item.id}
          item={item}
          isSelected={selectedDhikrId === item.id}
          isDeleting={deletingDhikrId === item.id}
          isUpdatingThisItem={isUpdatingDhikr && editingDhikr?.id === item.id}
        />
      ))}
    </View>
  );
}
