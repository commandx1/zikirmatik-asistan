import { View } from "react-native";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { ProfileHeader } from "./components/profile-header";
import { ProfilePersonalInfoModal } from "./components/profile-personal-info-modal";
import { ProfilePremiumSheet } from "./components/profile-premium-sheet";
import { ProfileQuickStatsCard } from "./components/profile-quick-stats-card";
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
            <ProfileQuickStatsCard stats={profile.quickStats} />
            <ProfileSettingsSections
              purposeLabel={profile.purposeLabel}
              personalCityLabel={profile.personalCityLabel}
              themeLabel={profile.themeLabel}
              fontLabel={profile.fontLabel}
              reminderTime={profile.reminderTime}
              dailyReminderEnabled={profile.dailyReminderEnabled}
              kandilNotificationsEnabled={profile.kandilNotificationsEnabled}
              hapticsEnabled={profile.hapticsEnabled}
              onPressPersonalInfo={profile.openPersonalInfoModal}
              onPressTheme={profile.goThemeSelector}
              onPressFont={profile.goFontSelector}
              onPressReminderTime={profile.openReminderTimeModal}
              onPressPremium={profile.openPremiumSheet}
              onPressManageSubscription={profile.manageSubscription}
              onPressRateApp={profile.rateApp}
              onPressSendFeedback={profile.sendFeedback}
              onPressRestartOnboarding={profile.onRestartOnboarding}
              onPressLogout={profile.onLogout}
              onToggleDailyReminder={profile.onToggleDailyReminder}
              onToggleKandilNotification={profile.setKandilNotificationsEnabled}
              onToggleHaptics={profile.onToggleHaptics}
            />
            {/* <ProfileAppVersion /> */}
          </View>
        </PageScrollView>
        <ProfilePersonalInfoModal
          visible={profile.isPersonalInfoModalOpen}
          purpose={profile.draftPurpose}
          city={profile.draftCity}
          isSaving={profile.isSavingPersonalInfo}
          error={profile.personalInfoError}
          canSave={profile.canSavePersonalInfo}
          onChangePurpose={profile.setDraftPurpose}
          onChangeCity={profile.setDraftCity}
          onSave={profile.savePersonalInfo}
          onClose={profile.closePersonalInfoModal}
        />
        <ProfilePremiumSheet
          visible={profile.isPremiumSheetOpen}
          selectedPlan={profile.premiumPlan}
          isActivating={profile.isActivatingPremium}
          isRestoring={profile.isRestoringPremium}
          error={profile.premiumError}
          onSelectPlan={profile.setPremiumPlan}
          onStartPremium={profile.activatePremium}
          onRestorePremium={profile.restorePremium}
          onClose={profile.closePremiumSheet}
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
      </View>
    </PageLayout>
  );
}
