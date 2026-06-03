import { View } from "react-native";
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
          title="Zikri Güncelle"
          description="Zikir adını, okunuşunu, anlamını ve hedefini güncelleyebilirsin."
          submitLabel="Güncelle"
          savingLabel="Güncelleniyor"
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
