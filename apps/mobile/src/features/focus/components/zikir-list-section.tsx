import { useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { useZikirlerimActions, useZikirlerimState } from "../context/zikirlerim-context";
import type { ZikirItem } from "../types";
import { ZikirItemCard } from "./zikir-item-card";

export function ZikirListSection() {
  const { t } = useTranslation("focus");
  const { items, selectedDhikrId, deletingDhikrId, editingDhikr, isUpdatingDhikr } = useZikirlerimState();
  const { deleteDhikr } = useZikirlerimActions();
  // One delete confirmation for the whole list (was one ConfirmModal per card).
  const [pendingDelete, setPendingDelete] = useState<ZikirItem | null>(null);

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
          onDeletePress={setPendingDelete}
        />
      ))}
      <ConfirmModal
        visible={pendingDelete !== null}
        title={t("focus:card.deleteModal.title")}
        message={t("focus:card.deleteModal.message")}
        confirmLabel={t("focus:card.deleteModal.confirmLabel")}
        cancelLabel={t("focus:card.deleteModal.cancelLabel")}
        destructive
        onConfirm={() => {
          const item = pendingDelete;
          setPendingDelete(null);
          if (item) {
            void deleteDhikr(item);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
