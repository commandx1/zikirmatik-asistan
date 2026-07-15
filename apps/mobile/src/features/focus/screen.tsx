import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { UnsavedDhikrTransitionModal } from "../../components/ui/unsaved-dhikr-transition-modal";
import { ZikirFilterTabs } from "./components/zikir-filter-tabs";
import { ZikirFormModal } from "./components/zikir-form-modal";
import { ZikirListSection } from "./components/zikir-list-section";
import { ZikirlerimHeader } from "./components/zikirlerim-header";
import { useZikirlerim, ZikirlerimProvider } from "./context/zikirlerim-context";

export function FocusScreen() {
  return (
    <ZikirlerimProvider>
      <FocusContent />
    </ZikirlerimProvider>
  );
}

function FocusContent() {
  const { t } = useTranslation("focus");
  const {
    refresh,
    isRefreshing,
    editingDhikr,
    isUpdateOpen,
    isUpdatingDhikr,
    updateError,
    isUnsavedTransitionOpen,
    isSavingUnsavedTransition,
    unsavedTransitionDhikrName,
    unsavedTransitionCount,
    unsavedTransitionError,
    closeUpdateModal,
    clearUpdateError,
    saveDhikrUpdate,
    cancelUnsavedTransition,
    saveAndContinueUnsavedTransition,
    continueWithoutSavingUnsavedTransition
  } = useZikirlerim();

  const initialValues = {
    name: editingDhikr?.nameTurkish || editingDhikr?.transliteration || "",
    transliteration: editingDhikr?.transliteration ?? "",
    meaning: editingDhikr?.meaning ?? "",
    target: editingDhikr?.target ?? 33
  };

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <ZikirlerimHeader />
        <PageScrollView contentInnerClassName="w-full" bottomPadding={32} onRefresh={refresh} refreshing={isRefreshing}>
          <ZikirFilterTabs />
          <ZikirListSection />
        </PageScrollView>
        <ZikirFormModal
          visible={isUpdateOpen}
          title={t("focus:editModal.title")}
          description={t("focus:editModal.description")}
          submitLabel={t("focus:editModal.submitLabel")}
          savingLabel={t("focus:editModal.savingLabel")}
          isSaving={isUpdatingDhikr}
          error={updateError}
          initialValues={initialValues}
          onRequestClose={closeUpdateModal}
          onErrorClear={clearUpdateError}
          onSubmit={saveDhikrUpdate}
        />
        <UnsavedDhikrTransitionModal
          visible={isUnsavedTransitionOpen}
          dhikrName={unsavedTransitionDhikrName}
          count={unsavedTransitionCount}
          isSaving={isSavingUnsavedTransition}
          error={unsavedTransitionError}
          onSaveAndContinue={saveAndContinueUnsavedTransition}
          onContinueWithoutSaving={continueWithoutSavingUnsavedTransition}
          onCancel={cancelUnsavedTransition}
        />
      </View>
    </PageLayout>
  );
}
