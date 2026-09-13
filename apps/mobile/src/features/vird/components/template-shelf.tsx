import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import type { VirdTemplateSummary } from "@zikirmatik/shared";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { useAuthStore } from "../../../store/auth-store";
import { fetchVirdTemplates } from "../services/vird-api-client";

// collections/screen.tsx'in "all" sayfasının üstünde (ListHeaderComponent
// olarak) gösterilen yatay vird programı şablonları rafı. Şablonlar misafir
// dahil herkese görünür (GET v1/vird/templates OptionalJwtAuthGuard) —
// premium şablonlar rozetle işaretlenir, gerçek erişim kontrolü şablon
// detay ekranında ("Programı başlat" basılınca) yapılır.
export function TemplateShelf() {
  const { t, i18n } = useTranslation("vird");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
  const { tokens } = useThemeTokens();
  const router = useRouter();
  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken);

  const [templates, setTemplates] = useState<VirdTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(undefined);

    fetchVirdTemplates(sessionAccessToken)
      .then((data) => {
        if (!isCancelled) {
          setTemplates(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError(t("vird:templates.loadError"));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionAccessToken, t]);

  if (!isLoading && !error && templates.length === 0) {
    return null;
  }

  return (
    <View className="mb-3 mt-2">
      <Text className="mb-2 px-4 text-xs font-semibold tracking-[0.8px] text-[--text-muted]">
        {t("vird:templates.shelfTitle")}
      </Text>

      {isLoading ? (
        <View className="h-28 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : error ? (
        <Text className="px-4 text-xs text-[--text-muted]">{error}</Text>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => router.push(`/vird/template/${item.key}` as any)}
              className="w-40 rounded-2xl border border-white/8 bg-[--card] p-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              {item.isPremium ? (
                <View className="mb-2 self-start rounded-full bg-[--accent]/15 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-[--accent]">{t("vird:templates.premiumBadge")}</Text>
                </View>
              ) : null}
              <Text className="mb-1 text-sm font-semibold leading-5 text-[--text-primary]" numberOfLines={2}>
                {item.title ? resolveLocalizedText(item.title, locale) : t("vird:templates.untitledFallback")}
              </Text>
              {typeof item.dayCount === "number" ? (
                <Text className="text-xs text-[--text-muted]">
                  {t("vird:templates.dayCountLabel", { count: item.dayCount })}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
