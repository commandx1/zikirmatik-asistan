import { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { AppButton } from "@zikirmatik/ui";
import { PageLayout } from "../../components/ui/page-layout";
import { useAuthStore } from "../../store/auth-store";

export function AuthScreen() {
  const status = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.authError);
  const signInWithRequiredProvider = useAuthStore((s) => s.signInWithRequiredProvider);

  const primaryCta = useMemo(() => {
    if (status === "authenticating") {
      return "Bağlanıyor...";
    }

    return Platform.OS === "ios" ? "Apple ile Giriş Yap" : "Google ile Giriş Yap";
  }, [status]);

  if (status === "authenticated") {
    return <Redirect href="/" />;
  }

  return (
    <PageLayout>
      <View className="flex-1 justify-center px-6">
        <View className="rounded-3xl border border-[--card-border] bg-[--card] p-6">
          <Text className="text-[28px] font-bold text-[--text-primary]">Zikirmatik Asistan</Text>
          <Text className="mt-3 text-[15px] leading-6 text-[--text-muted]">
            Hesabını güvenle bağla, zikir verilerin cihazlar arasında senkron kalsın.
          </Text>

          <View className="mt-6 gap-3">
            <AppButton label={primaryCta} size="lg" disabled={status === "authenticating"} onPress={() => void signInWithRequiredProvider()} />
          </View>

          {authError ? <Text className="mt-4 text-[13px] leading-5 text-[#F97316]">{authError}</Text> : null}
        </View>
      </View>
    </PageLayout>
  );
}
