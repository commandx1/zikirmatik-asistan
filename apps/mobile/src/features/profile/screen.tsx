import { View } from "react-native";
import { ConfirmModal } from "../../components/ui/confirm-modal";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { ProfileHeader } from "./components/profile-header";
import { ProfileDeleteAccountModal } from "./components/profile-delete-account-modal";
import { ProfilePremiumSheet } from "./components/profile-premium-sheet";
import { ProfileReminderTimeModal } from "./components/profile-reminder-time-modal";
import { ProfileSettingsSections } from "./components/profile-settings-sections";
import { ProfileUserCard } from "./components/profile-user-card";
import { useProfile } from "./hooks/use-profile";

export function ProfileScreen() {
  const profile = useProfile();

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <ProfileHeader />
        <PageScrollView
          contentInnerClassName="w-full px-5"
          bottomPadding={24}
          onRefresh={profile.refresh}
          refreshing={profile.isRefreshing}
        >
          <View className="gap-6">
            <ProfileUserCard
              displayName={profile.displayName}
              profileImageUrl={profile.profileImageUrl}
              memberSinceLabel={profile.memberSinceLabel}
              isPremium={profile.isPremium}
              onPressUpgrade={profile.openPremiumSheet}
            />
            <ProfileSettingsSections
              reminderTime={profile.reminderTime}
              dailyReminderEnabled={profile.dailyReminderEnabled}
              hapticsEnabled={profile.hapticsEnabled}
              onPressTheme={profile.goThemeSelector}
              onPressFont={profile.goFontSelector}
              onPressReminderTime={profile.openReminderTimeModal}
              onPressPremium={profile.openPremiumSheet}
              onPressManageSubscription={profile.manageSubscription}
              onPressRateApp={profile.rateApp}
              onPressSendFeedback={profile.sendFeedback}
              onPressTourReplay={profile.tourReplay}
              onPressLogout={profile.onLogout}
              onPressDeleteAccount={profile.openDeleteAccountModal}
              onToggleDailyReminder={profile.onToggleDailyReminder}
              onToggleHaptics={profile.onToggleHaptics}
            />
            {/* <ProfileAppVersion /> */}
          </View>
        </PageScrollView>
        <ProfilePremiumSheet
          visible={profile.isPremiumSheetOpen}
          selectedPlan={profile.premiumPlan}
          isActivating={profile.isActivatingPremium}
          error={profile.premiumError}
          onSelectPlan={profile.setPremiumPlan}
          onStartPremium={profile.activatePremium}
          onClose={profile.closePremiumSheet}
          topupProducts={profile.topupProducts}
          purchasingTopupId={profile.purchasingTopupId}
          topupError={profile.topupError}
          onPurchaseTopup={(productId) => {
            void profile.purchaseTopup(productId).then((purchased) => {
              if (purchased) profile.closePremiumSheet();
            });
          }}
        />
        <ProfileReminderTimeModal
          visible={profile.isReminderTimeModalOpen}
          hourDraft={profile.reminderHourDraft}
          minuteDraft={profile.reminderMinuteDraft}
          isSaving={profile.isSavingReminderTime}
          canSave={profile.canSaveReminderTime}
          error={profile.reminderTimeError}
          onChangeHour={profile.onReminderHourChange}
          onChangeMinute={profile.onReminderMinuteChange}
          onSave={profile.saveReminderTime}
          onClose={profile.closeReminderTimeModal}
        />
        <ConfirmModal
          visible={!!profile.feedbackError}
          title="E-posta uygulaması açılamadı"
          message={profile.feedbackError ?? ""}
          confirmLabel="Tamam"
          onConfirm={profile.clearFeedbackError}
          onCancel={profile.clearFeedbackError}
        />
        <ProfileDeleteAccountModal
          visible={profile.isDeleteAccountModalOpen}
          isDeleting={profile.isDeletingAccount}
          onConfirm={profile.deleteAccount}
          onCancel={profile.closeDeleteAccountModal}
        />
      </View>
    </PageLayout>
  );
}
