import { View } from "react-native";
import { ProfileLinkRow } from "./profile-link-row";
import { ProfileLogoutRow } from "./profile-logout-row";
import { ProfileSectionTitle } from "./profile-section-title";
import { ProfileSettingsCard } from "./profile-settings-card";
import { ProfileTimeRow } from "./profile-time-row";
import { ProfileToggleRow } from "./profile-toggle-row";

type ProfileSettingsSectionsProps = {
  purposeLabel: string;
  personalCityLabel: string;
  themeLabel: string;
  fontLabel: string;
  reminderTime: string;
  dailyReminderEnabled: boolean;
  kandilNotificationsEnabled: boolean;
  hapticsEnabled: boolean;
  onPressPersonalInfo: () => void;
  onPressTheme: () => void;
  onPressFont: () => void;
  onPressReminderTime: () => void;
  onPressPremium: () => void;
  onPressManageSubscription: () => void;
  onPressRateApp: () => void;
  onPressSendFeedback: () => void;
  onPressLogout: () => void;
  onToggleDailyReminder: (value: boolean) => void;
  onToggleKandilNotification: (value: boolean) => void;
  onToggleHaptics: (value: boolean) => void;
};

export function ProfileSettingsSections({
  purposeLabel,
  personalCityLabel,
  themeLabel,
  fontLabel,
  reminderTime,
  dailyReminderEnabled,
  kandilNotificationsEnabled,
  hapticsEnabled,
  onPressPersonalInfo,
  onPressTheme,
  onPressFont,
  onPressReminderTime,
  onPressPremium,
  onPressManageSubscription,
  onPressRateApp,
  onPressSendFeedback,
  onPressLogout,
  onToggleDailyReminder,
  onToggleKandilNotification,
  onToggleHaptics
}: ProfileSettingsSectionsProps) {
  return (
    <View className="gap-6">
      <View>
        <ProfileSectionTitle label="Kişisel Bilgiler" />
        <ProfileSettingsCard>
          <ProfileLinkRow
            label="Amaç"
            iconName="bullseye"
            value={purposeLabel}
            onPress={onPressPersonalInfo}
            bottomBorder
          />
          <ProfileLinkRow
            label="Şehir"
            iconName="location-dot"
            value={personalCityLabel}
            onPress={onPressPersonalInfo}
          />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label="Kişiselleştirme" />
        <ProfileSettingsCard>
          <ProfileLinkRow label="Tema Seçimi" iconName="moon" value={themeLabel} onPress={onPressTheme} bottomBorder />
          <ProfileLinkRow label="Yazı Tipi" iconName="font" value={fontLabel} onPress={onPressFont} bottomBorder />
          <ProfileToggleRow
            label="Titreşim"
            iconName="mobile-screen"
            value={hapticsEnabled}
            onChange={onToggleHaptics}
          />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label="Bildirimler" />
        <ProfileSettingsCard>
          <ProfileToggleRow
            label="Günlük Zikir Hatırlatması"
            iconName="bell"
            iconContainerClassName="bg-[--accent]/10"
            iconColor="#C8972A"
            value={dailyReminderEnabled}
            onChange={onToggleDailyReminder}
            bottomBorder
          />
          <ProfileTimeRow label="Hatırlatma Saati" value={reminderTime} bottomBorder onPress={onPressReminderTime} />
          <ProfileToggleRow
            label="Kandil Bildirimleri"
            iconName="star-and-crescent"
            value={kandilNotificationsEnabled}
            onChange={onToggleKandilNotification}
            bottomBorder={false}
          />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label="Premium" accent />
        <ProfileSettingsCard premium>
          <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[--accent]/5" />
          <ProfileLinkRow
            label="Premium Özellikleri"
            iconName="star"
            iconContainerClassName="bg-[--accent]"
            iconColor="#0F1B2D"
            bottomBorder
            onPress={onPressPremium}
          />
          <ProfileLinkRow
            label="Aboneliği Yönet"
            iconName="clipboard"
            rightIconName="arrow-up-right-from-square"
            rightIconRegular
            onPress={onPressManageSubscription}
          />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label="Diğer" />
        <ProfileSettingsCard>
          {/*<ProfileLinkRow label="Dini Danışman Notu" iconName="book-open" value="İçeriklerimiz hakkında" bottomBorder />
          <ProfileLinkRow label="Gizlilik Politikası" iconName="shield-halved" bottomBorder />*/}
          <ProfileLinkRow label="Uygulamayı Oyla" iconName="star" rightIconRegular bottomBorder onPress={onPressRateApp} />
          <ProfileLinkRow label="Geri Bildirim Gönder" iconName="comment-dots" rightIconRegular bottomBorder onPress={onPressSendFeedback} />
          <ProfileLogoutRow onPress={onPressLogout} />
        </ProfileSettingsCard>
      </View>

    </View>
  );
}
