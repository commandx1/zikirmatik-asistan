import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { PageLayout } from "../src/components/ui/page-layout";

// "/" (app/index.tsx) zaten onboarding/auth gate'ine göre doğru ana sekmeye
// yönlendiriyor — burada o mantığı tekrar etmek yerine oraya yönlendiriyoruz.
export default function NotFoundScreen() {
  const { t } = useTranslation("common");
  const { tokens } = useThemeTokens();

  return (
    <PageLayout>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-2 text-lg font-semibold text-[--text-primary]">{t("common:notFound.title")}</Text>
        <Text className="mb-6 text-center text-sm text-[--text-muted]">{t("common:notFound.message")}</Text>
        <Link href="/" style={{ color: tokens.accent, fontSize: 14, fontWeight: "600" }}>
          {t("common:notFound.goHome")}
        </Link>
      </View>
    </PageLayout>
  );
}
