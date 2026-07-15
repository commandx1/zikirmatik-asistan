import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SupportedLocale } from "../../../i18n";
import { ProfileLinkRow } from "./profile-link-row";
import { ProfileLogoutRow } from "./profile-logout-row";
import { ProfileSectionTitle } from "./profile-section-title";
import { ProfileSettingsCard } from "./profile-settings-card";
import { ProfileTimeRow } from "./profile-time-row";
import { ProfileToggleRow } from "./profile-toggle-row";

type ProfileSettingsSectionsProps = {
  reminderTime: string;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  locale: SupportedLocale;
  onChangeLocale: (locale: SupportedLocale) => void;
  onPressTheme: () => void;
  onPressFont: () => void;
  onPressReminderTime: () => void;
  onPressPremium: () => void;
  onPressManageSubscription: () => void;
  onPressRateApp: () => void;
  onPressSendFeedback: () => void;
  onPressTourReplay: () => void;
  onPressLogout: () => void;
  onPressDeleteAccount: () => void;
  onToggleNotifications: (value: boolean) => void;
  onToggleHaptics: (value: boolean) => void;
};

export function ProfileSettingsSections({
  reminderTime,
  notificationsEnabled,
  hapticsEnabled,
  locale,
  onChangeLocale,
  onPressTheme,
  onPressFont,
  onPressReminderTime,
  onPressPremium,
  onPressManageSubscription,
  onPressRateApp,
  onPressSendFeedback,
  onPressTourReplay,
  onPressLogout,
  onPressDeleteAccount,
  onToggleNotifications,
  onToggleHaptics
}: ProfileSettingsSectionsProps) {
  const { t } = useTranslation("profile");
  const languageLabel = locale === "en" ? t("profile:language.english") : t("profile:language.turkish");
  const toggleLocale = () => onChangeLocale(locale === "tr" ? "en" : "tr");

  return (
    <View className="gap-6">
      <View>
        <ProfileSectionTitle label={t("profile:sections.personalization.title")} />
        <ProfileSettingsCard>
          <ProfileLinkRow label={t("profile:sections.personalization.theme")} iconName="moon" onPress={onPressTheme} bottomBorder />
          <ProfileLinkRow label={t("profile:sections.personalization.font")} iconName="font" onPress={onPressFont} bottomBorder />
          <ProfileLinkRow
            label={t("profile:sections.personalization.language")}
            iconName="language"
            value={languageLabel}
            onPress={toggleLocale}
            bottomBorder
          />
          <ProfileToggleRow
            label={t("profile:sections.personalization.haptics")}
            iconName="mobile-screen"
            value={hapticsEnabled}
            onChange={onToggleHaptics}
          />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label={t("profile:sections.notifications.title")} />
        <ProfileSettingsCard>
          <ProfileToggleRow
            label={t("profile:sections.notifications.toggle")}
            iconName="bell"
            value={notificationsEnabled}
            onChange={onToggleNotifications}
            bottomBorder={notificationsEnabled}
          />
          {notificationsEnabled ? (
            <ProfileTimeRow label={t("profile:sections.notifications.reminderTime")} value={reminderTime} onPress={onPressReminderTime} />
          ) : null}
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label={t("profile:sections.premium.title")} accent />
        <ProfileSettingsCard premium>
          <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[--accent]/5" />
          <ProfileLinkRow
            label={t("profile:sections.premium.features")}
            iconName="star"
            iconContainerClassName="bg-[--accent]"
            iconColor="#0F1B2D"
            bottomBorder
            onPress={onPressPremium}
          />
          <ProfileLinkRow
            label={t("profile:sections.premium.manageSubscription")}
            iconName="clipboard"
            rightIconName="arrow-up-right-from-square"
            rightIconRegular
            onPress={onPressManageSubscription}
          />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label={t("profile:sections.other.title")} />
        <ProfileSettingsCard>
          <ProfileLinkRow label={t("profile:sections.other.tourReplay")} iconName="circle-question" bottomBorder onPress={onPressTourReplay} />
          <ProfileLinkRow label={t("profile:sections.other.rateApp")} iconName="star" rightIconRegular bottomBorder onPress={onPressRateApp} />
          <ProfileLinkRow label={t("profile:sections.other.sendFeedback")} iconName="comment-dots" rightIconRegular bottomBorder onPress={onPressSendFeedback} />
          <ProfileLogoutRow onPress={onPressLogout} />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label={t("profile:sections.account.title")} />
        <ProfileSettingsCard>
          <Pressable onPress={onPressDeleteAccount} className="flex-row items-center justify-start p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8" />
              <Text className="text-base font-medium" style={{ color: "#EF4444" }}>{t("profile:sections.account.deleteAccount")}</Text>
            </View>
          </Pressable>
        </ProfileSettingsCard>
      </View>

    </View>
  );
}
