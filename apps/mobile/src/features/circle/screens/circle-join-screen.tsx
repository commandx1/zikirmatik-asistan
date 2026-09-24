import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import type { CirclePreview } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedCard } from "../../../components/ui/themed-card";
import { useCircleStore } from "../../../store/circle-store";
import { useAuthStore } from "../../../store/auth-store";
import { resolveLocalizedText } from "@zikirmatik/shared";
import { useRequireAuth } from "../../auth/hooks/use-require-auth";
import { trackEvent } from "../../../lib/analytics";
import { CircleApiError, fetchCirclePreview, joinCircle, resolveCircleErrorMessage } from "../services/circle-api-client";
import { parseCircleCode } from "../services/circle-share";
import { useAppLocale } from "../../../i18n";

export function CircleJoinScreen({ code: rawCode }: { code: string }) {
  const router = useRouter();
  const { t } = useTranslation("circle");
  const { tokens } = useThemeTokens();
  const locale = useAppLocale();
  const { requireAuth } = useRequireAuth();

  const authStatus = useAuthStore((state) => state.status);
  const upsertCircle = useCircleStore((state) => state.upsertCircle);

  const code = parseCircleCode(rawCode ?? "");

  const [preview, setPreview] = useState<CirclePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!code) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchCirclePreview(code)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Bilinen kod (ör. CIRCLE_NOT_FOUND) kendi mesajıyla; ağ/sunucu hatası genel metinle.
        const code = error instanceof CircleApiError ? error.code : undefined;
        setLoadError(code ? resolveCircleErrorMessage(code, t("circle:join.loadError")) : t("circle:join.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, t]);

  const handleJoin = () => {
    if (!code) return;
    requireAuth(() => {
      void (async () => {
        if (authStatus !== "authenticated") return;
        setIsJoining(true);
        try {
          const circle = await joinCircle(code);
          upsertCircle(circle);
          void trackEvent("circle_joined");
          router.replace(`/circle/${circle.id}` as Href);
        } catch (error) {
          const message = error instanceof CircleApiError ? resolveCircleErrorMessage(error.code, error.message) : t("circle:errors.serviceUnavailable");
          setLoadError(message);
        } finally {
          setIsJoining(false);
        }
      })();
    });
  };

  return (
    <PageLayout>
      <PageHeader title={t("circle:join.title")} leftIconName="arrow-left" onPressLeft={() => router.back()} />

      <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={40}>
        {!code ? (
          <Text className="text-sm text-text-muted">{t("circle:join.invalidCode")}</Text>
        ) : isLoading ? (
          <Text className="text-sm text-text-muted">…</Text>
        ) : loadError && !preview ? (
          <Text className="text-sm" style={{ color: "#ef4444" }}>{loadError}</Text>
        ) : preview ? (
          <>
            <ThemedCard className="mb-4 rounded-2xl p-4">
              <Text className="mb-1 text-lg font-semibold text-text-primary">{preview.name}</Text>
              <Text className="mb-3 text-xs text-text-muted">{resolveLocalizedText(preview.dhikr.name, locale)}</Text>
              <Text className="text-xs text-text-muted">
                {t("circle:home.progress", { total: preview.totalCount, goal: preview.goalCount })}
              </Text>
              <Text className="mt-1 text-xs text-text-muted">{t("circle:hub.membersCount", { count: preview.memberCount })}</Text>
              <Text className="mt-2 text-xs font-semibold" style={{ color: preview.status === "active" ? tokens.success : tokens.textMuted }}>
                {t(`circle:status.${preview.status}`)}
              </Text>
            </ThemedCard>

            {preview.status !== "active" ? (
              <Text className="mb-3 text-xs" style={{ color: "#ef4444" }}>{t("circle:join.notActive")}</Text>
            ) : null}

            {loadError ? <Text className="mb-3 text-xs" style={{ color: "#ef4444" }}>{loadError}</Text> : null}

            <PrimaryCtaButton
              label={t("circle:join.joinCta")}
              onPress={handleJoin}
              disabled={preview.status !== "active" || isJoining}
              className="w-full"
            />
          </>
        ) : (
          <View />
        )}
      </PageScrollView>
    </PageLayout>
  );
}
