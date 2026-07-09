import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useAuthStore } from "../../store/auth-store";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useProfileStore } from "../../store/profile-store";
import { cities } from "../../lib/cities";
import { AppSelectBox } from "../../components/ui/app-selectbox";
import { BottomActionFooter } from "../../components/ui/bottom-action-footer";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../components/ui/primary-cta-button";
import { PURPOSE_OPTIONS } from "../onboarding/onboarding-data";
import { UsersApiError, saveUserOnboarding } from "../users/services/users-api-client";

export function OnboardingPreferencesScreen() {
  const { tokens } = useThemeTokens();
  const authStatus = useAuthStore((s) => s.status);
  const guestMode = useAuthStore((s) => s.guestMode);
  const session = useAuthStore((s) => s.session);
  const storePurpose = useOnboardingStore((s) => s.purpose);
  const storeCity = useOnboardingStore((s) => s.city);
  const profileCity = useProfileStore((s) => s.city);
  const setPurpose = useOnboardingStore((s) => s.setPurpose);
  const setCity = useOnboardingStore((s) => s.setCity);
  const hydrateProfile = useProfileStore((s) => s.hydrateFromBackend);

  const [draftPurpose, setDraftPurpose] = useState(storePurpose);
  const [draftCity, setDraftCity] = useState(storeCity || profileCity || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const purposeOptions = useMemo(
    () => PURPOSE_OPTIONS.map((item) => ({ label: item.title, value: item.id })),
    []
  );
  const cityOptions = useMemo(
    () =>
      cities.map((item) => {
        const label = toDisplayCity(item);
        return { label, value: label };
      }),
    []
  );

  const hasChanges = draftPurpose !== storePurpose || draftCity !== (storeCity || profileCity || "");

  const onSave = async () => {
    if (isSaving) {
      return;
    }

    const trimmedCity = draftCity.trim();
    if (!trimmedCity) {
      setError("Lütfen şehir seç.");
      return;
    }

    setError(undefined);
    setSuccess(undefined);
    setIsSaving(true);

    try {
      if (!guestMode && authStatus === "authenticated" && session?.userId) {
        await saveUserOnboarding(
          session.userId,
          {
            purpose: draftPurpose,
            city: trimmedCity
          },
          session.accessToken
        );
      }

      setPurpose(draftPurpose);
      setCity(trimmedCity);
      hydrateProfile({ city: trimmedCity });
      setSuccess("Onboarding tercihlerin güncellendi.");
    } catch (nextError) {
      if (nextError instanceof UsersApiError) {
        setError(nextError.message);
      } else {
        setError("Tercihler güncellenemedi. Lütfen tekrar dene.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout>
      <View className="flex-1 w-full">
        <PageHeader title="Onboarding Tercihleri" subtitle="Amaç ve şehir bilgini güncelle" />
        <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={24}>
          <View className="gap-4">
            <AppSelectBox
              value={draftPurpose}
              placeholder="Amaç seç..."
              title="Amaç"
              options={purposeOptions}
              onChange={(value) => {
                setDraftPurpose(value);
                setError(undefined);
                setSuccess(undefined);
              }}
            />
            <AppSelectBox
              value={draftCity}
              placeholder="Şehir seç..."
              title="Şehirler"
              options={cityOptions}
              onChange={(value) => {
                setDraftCity(value);
                setError(undefined);
                setSuccess(undefined);
              }}
            />
            <Text className="text-xs leading-5" style={{ color: tokens.textMuted }}>
              Bu tercihler asistan önerilerini ve namaz vakti verilerini kişiselleştirmek için kullanılır.
            </Text>
            {error ? (
              <View className="rounded-xl border border-[#f97316]/40 bg-[#f97316]/12 px-3 py-2">
                <Text className="text-xs text-[#fed7aa]">{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View className="rounded-xl border border-[#16a34a]/40 bg-[#16a34a]/12 px-3 py-2">
                <Text className="text-xs text-[#bbf7d0]">{success}</Text>
              </View>
            ) : null}
          </View>
        </PageScrollView>

        <BottomActionFooter>
          {hasChanges ? (
            <PrimaryCtaButton
              label={isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              onPress={onSave}
              textClassName="text-base"
            />
          ) : null}
        </BottomActionFooter>
      </View>
    </PageLayout>
  );
}

function toDisplayCity(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((part) => (part ? `${part[0].toLocaleUpperCase("tr-TR")}${part.slice(1)}` : part))
    .join(" ");
}
