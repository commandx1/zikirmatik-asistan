import { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppButton } from "@zikirmatik/ui";
import { PageLayout } from "../../components/ui/page-layout";
import { useAuthStore } from "../../store/auth-store";

export function AuthScreen() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.authError);
  const signInWithRequiredProvider = useAuthStore((s) => s.signInWithRequiredProvider);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  const primaryCta = useMemo(() => {
    if (status === "authenticating") {
      return t("auth:screen.connecting");
    }

    return Platform.OS === "ios" ? t("auth:screen.signInApple") : t("auth:screen.signInGoogle");
  }, [status, t]);

  if (status === "authenticated") {
    return <Redirect href="/" />;
  }

  return (
    <PageLayout>
      <View className="flex-1 justify-center px-6">
        <View className="rounded-3xl border border-[--card-border] bg-[--card] p-6">
          <Text className="text-3xl font-bold text-[--text-primary]">{t("auth:screen.appName")}</Text>
          <Text className="mt-3 text-base leading-6 text-[--text-muted]">
            {t("auth:screen.subtitle")}
          </Text>

          <View className="mt-6 gap-3">
            <AppButton label={primaryCta} size="lg" disabled={status === "authenticating"} onPress={() => void signInWithRequiredProvider()} />
            <AppButton
              label={t("auth:screen.continueAsGuest")}
              variant="ghost"
              size="lg"
              disabled={status === "authenticating"}
              onPress={() => {
                continueAsGuest();
                router.replace("/(tabs)/home");
              }}
            />
          </View>

          {authError ? <Text className="mt-4 text-sm leading-5 text-[#F97316]">{authError}</Text> : null}
        </View>
      </View>
    </PageLayout>
  );
}
