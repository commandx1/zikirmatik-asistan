import { Pressable, Text, View } from "react-native";
import { ProfileLinkRow } from "./profile-link-row";
import { ProfileLogoutRow } from "./profile-logout-row";
import { ProfileSectionTitle } from "./profile-section-title";
import { ProfileSettingsCard } from "./profile-settings-card";
import { ProfileTimeRow } from "./profile-time-row";
import { ProfileToggleRow } from "./profile-toggle-row";

type ProfileSettingsSectionsProps = {
  reminderTime: string;
  dailyReminderEnabled: boolean;
  hapticsEnabled: boolean;
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
  onToggleDailyReminder: (value: boolean) => void;
  onToggleHaptics: (value: boolean) => void;
};

export function ProfileSettingsSections({
  reminderTime,
  dailyReminderEnabled,
  hapticsEnabled,
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
  onToggleDailyReminder,
  onToggleHaptics
}: ProfileSettingsSectionsProps) {
  return (
    <View className="gap-6">
      <View>
        <ProfileSectionTitle label="Kişiselleştirme" />
        <ProfileSettingsCard>
          <ProfileLinkRow label="Tema Seçimi" iconName="moon" onPress={onPressTheme} bottomBorder />
          <ProfileLinkRow label="Yazı Tipi" iconName="font" onPress={onPressFont} bottomBorder />
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
            value={dailyReminderEnabled}
            onChange={onToggleDailyReminder}
            bottomBorder
          />
          <ProfileTimeRow label="Hatırlatma Saati" value={reminderTime} onPress={onPressReminderTime} />
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
          <ProfileLinkRow label="Uygulamayı Tanıt" iconName="circle-question" bottomBorder onPress={onPressTourReplay} />
          <ProfileLinkRow label="Uygulamayı Oyla" iconName="star" rightIconRegular bottomBorder onPress={onPressRateApp} />
          <ProfileLinkRow label="Geri Bildirim Gönder" iconName="comment-dots" rightIconRegular bottomBorder onPress={onPressSendFeedback} />
          <ProfileLogoutRow onPress={onPressLogout} />
        </ProfileSettingsCard>
      </View>

      <View>
        <ProfileSectionTitle label="Hesap" />
        <ProfileSettingsCard>
          <Pressable onPress={onPressDeleteAccount} className="flex-row items-center justify-start p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8" />
              <Text className="text-base font-medium" style={{ color: "#EF4444" }}>Hesabı Sil</Text>
            </View>
          </Pressable>
        </ProfileSettingsCard>
      </View>

    </View>
  );
}
