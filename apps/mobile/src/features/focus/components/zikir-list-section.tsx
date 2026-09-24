import { useCallback, useContext, useState } from "react";
import { FlatList, Platform, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { useZikirlerimActions, useZikirlerimState } from "../context/zikirlerim-context";
import type { ZikirItem } from "../types";
import { ZikirFilterTabs } from "./zikir-filter-tabs";
import { ZikirItemCard } from "./zikir-item-card";

// PageScrollView'ın bottomPadding'i (32) + eski liste sarmalayıcısının
// pb-6'sı (24) toplamı: FlatList artık ekranın tek scroll konteyneri olduğu
// için ikisini burada tek seferde uyguluyoruz (görsel olarak birebir aynı).
const BOTTOM_PADDING = 56;

function ListSeparator() {
  return <View className="h-3" />;
}

export function ZikirListSection() {
  const { t } = useTranslation("focus");
  const { items, selectedDhikrId, deletingDhikrId, editingDhikr, isUpdatingDhikr, isRefreshing } =
    useZikirlerimState();
  const { deleteDhikr, refresh } = useZikirlerimActions();
  // One delete confirmation for the whole list (was one ConfirmModal per card).
  const [pendingDelete, setPendingDelete] = useState<ZikirItem | null>(null);

  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 0) : 0;
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  const renderItem = useCallback(
    ({ item }: { item: ZikirItem }) => (
      <View className="px-5">
        <ZikirItemCard
          item={item}
          isSelected={selectedDhikrId === item.id}
          isDeleting={deletingDhikrId === item.id}
          isUpdatingThisItem={isUpdatingDhikr && editingDhikr?.id === item.id}
          onDeletePress={setPendingDelete}
        />
      </View>
    ),
    [selectedDhikrId, deletingDhikrId, isUpdatingDhikr, editingDhikr?.id]
  );

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={ListSeparator}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        className="flex-1 w-full"
        contentContainerStyle={{
          paddingBottom: BOTTOM_PADDING + androidBottomInset + tabBarHeight
        }}
        onRefresh={refresh}
        refreshing={isRefreshing}
        ListHeaderComponent={ZikirFilterTabs}
        ListEmptyComponent={
          <View className="px-5">
            <View className="items-center rounded-2xl border border-white/5 bg-[--card] p-6">
              <Text className="text-sm text-[--text-muted]">{t("focus:list.empty")}</Text>
            </View>
          </View>
        }
      />
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
    </>
  );
}
