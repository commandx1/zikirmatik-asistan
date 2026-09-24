import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { PageLayout } from "../../components/ui/page-layout";
import { UnsavedDhikrTransitionModal } from "../../components/ui/unsaved-dhikr-transition-modal";
import { resolveLocalizedText } from "@zikirmatik/shared";
import { ZikirFormModal } from "./components/zikir-form-modal";
import { ZikirListSection } from "./components/zikir-list-section";
import { ZikirlerimHeader } from "./components/zikirlerim-header";
import { useZikirlerimActions, useZikirlerimState, ZikirlerimProvider } from "./context/zikirlerim-context";
import { useAppLocale } from "../../i18n";

export function FocusScreen() {
  return (
    <ZikirlerimProvider>
      <FocusContent />
    </ZikirlerimProvider>
  );
}

function FocusContent() {
  const { t } = useTranslation("focus");
  const locale = useAppLocale();
  const {
    editingDhikr,
    isUpdateOpen,
    isUpdatingDhikr,
    updateError,
    isUnsavedTransitionOpen,
    isSavingUnsavedTransition,
    unsavedTransitionDhikrName,
    unsavedTransitionCount,
    unsavedTransitionError
  } = useZikirlerimState();
  const {
    closeUpdateModal,
    clearUpdateError,
    saveDhikrUpdate,
    cancelUnsavedTransition,
    saveAndContinueUnsavedTransition,
    continueWithoutSavingUnsavedTransition
  } = useZikirlerimActions();
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const { t: tVird } = useTranslation("vird");

  const initialValues = {
    name: (editingDhikr?.name ? resolveLocalizedText(editingDhikr.name, locale) : "") ||
      (editingDhikr?.transliteration ? resolveLocalizedText(editingDhikr.transliteration, locale) : ""),
    transliteration: editingDhikr?.transliteration ? resolveLocalizedText(editingDhikr.transliteration, locale) : "",
    meaning: editingDhikr?.meaning ? resolveLocalizedText(editingDhikr.meaning, locale) : "",
    target: editingDhikr?.target ?? 33
  };

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <ZikirlerimHeader />
        <Pressable
          // TODO(B1): /vird rotası eklenince (app/vird/index.tsx) typed route olarak düzelt.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push("/vird" as any)}
          className="mx-5 mb-4 flex-row items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3.5"
        >
          <View className="flex-row items-center gap-2.5">
            <FontAwesome6 name="calendar-check" iconStyle="solid" size={14} color={tokens.accent} />
            <Text className="text-sm font-semibold text-text-primary">{tVird("vird:hub.entryRow")}</Text>
          </View>
          <FontAwesome6 name="chevron-right" size={12} color={tokens.textMuted} />
        </Pressable>
        <ZikirListSection />
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
