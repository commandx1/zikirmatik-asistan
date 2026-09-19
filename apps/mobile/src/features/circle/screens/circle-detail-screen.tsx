import { useCallback, useEffect, useMemo, useState } from "react";
import { Share, Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { toDateKey } from "@zikirmatik/shared";
import type { CircleDetail } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { useAuthStore } from "../../../store/auth-store";
import { useCircleStore } from "../../../store/circle-store";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { trackEvent } from "../../../lib/analytics";
import { closeCircle, fetchCircle, leaveCircle } from "../services/circle-api-client";
import { buildCircleShareMessage } from "../services/circle-share";

const POLL_INTERVAL_MS = 15_000;

export function CircleDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { t, i18n } = useTranslation("circle");
  const { tokens } = useThemeTokens();
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";

  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken);
  const circles = useCircleStore((state) => state.circles);
  const upsertCircle = useCircleStore((state) => state.upsertCircle);
  const removeCircle = useCircleStore((state) => state.removeCircle);
  const todayCount = useCircleStore((state) => state.todayCounts[id]);

  const storedCircle = useMemo(() => circles.find((circle) => circle.id === id), [circles, id]);
  const detail = storedCircle as CircleDetail | undefined;

  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!sessionAccessToken) {
      return;
    }
    try {
      const fresh = await fetchCircle(id, sessionAccessToken, toDateKey(new Date()));
      upsertCircle(fresh);
    } catch (error) {
      console.warn("[circle-detail] fetch başarısız", error);
    }
  }, [id, sessionAccessToken, upsertCircle]);

  useEffect(() => {
    void loadDetail();
    // Yalnız mount'ta (id değişince) — polling aşağıdaki useFocusEffect'te.
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        void loadDetail();
      }, POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }, [loadDetail])
  );

  if (!storedCircle) {
    return (
      <PageLayout>
        <PageHeader title="" leftIconName="arrow-left" onPressLeft={() => router.back()} />
      </PageLayout>
    );
  }

  const percent = storedCircle.goalCount > 0 ? Math.min(100, Math.round((storedCircle.totalCount / storedCircle.goalCount) * 100)) : 0;
  const title = storedCircle.name || resolveLocalizedText(storedCircle.dhikr.name, locale);

  const handleShare = async () => {
    void trackEvent("circle_share_pressed");
    try {
      await Share.share({ message: buildCircleShareMessage({ name: title, code: storedCircle.code, locale: i18n.language }) });
    } catch {
      // Kullanıcı paylaşımı iptal etti ya da platform hatası — sessizce yut.
    }
  };

  const handleLeave = async () => {
    if (!sessionAccessToken) return;
    setIsBusy(true);
    try {
      await leaveCircle(id, sessionAccessToken);
      removeCircle(id);
      router.back();
    } catch (error) {
      console.warn("[circle-detail] ayrılma başarısız", error);
    } finally {
      setIsBusy(false);
      setLeaveConfirmVisible(false);
    }
  };

  const handleClose = async () => {
    if (!sessionAccessToken) return;
    setIsBusy(true);
    try {
      await closeCircle(id, sessionAccessToken);
      upsertCircle({ ...storedCircle, status: "closed" });
    } catch (error) {
      console.warn("[circle-detail] kapatma başarısız", error);
    } finally {
      setIsBusy(false);
      setCloseConfirmVisible(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader title={title} leftIconName="arrow-left" onPressLeft={() => router.back()} />

      <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={40}>
        <ThemedCard className="mb-4 rounded-2xl p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold" style={{ color: storedCircle.status === "active" ? tokens.success : tokens.textMuted }}>
              {t(`circle:status.${storedCircle.status}`)}
            </Text>
            <Text className="text-xs text-[--text-muted]">{t("circle:hub.membersCount", { count: storedCircle.memberCount })}</Text>
          </View>

          <View className="mb-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <View className="h-2 rounded-full" style={{ width: `${percent}%`, backgroundColor: tokens.accent }} />
          </View>
          <Text className="mb-3 text-sm font-semibold text-[--text-primary]">
            {t("circle:home.progress", { total: storedCircle.totalCount, goal: storedCircle.goalCount })}
          </Text>

          <Text className="text-xs text-[--text-muted]">
            {t("circle:detail.myContribution", {
              total: storedCircle.myTotal,
              today: Math.max(detail?.myTodayCount ?? 0, todayCount?.dateKey === toDateKey(new Date()) ? todayCount.count : 0)
            })}
          </Text>
          {storedCircle.endDate ? (
            <Text className="mt-0.5 text-xs text-[--text-muted]">{t("circle:detail.endDate", { date: storedCircle.endDate })}</Text>
          ) : null}
        </ThemedCard>

        {storedCircle.status === "completed" ? (
          <ThemedCard className="mb-4 items-center rounded-2xl px-4 py-6">
            <Text className="mb-1 text-base font-semibold text-[--text-primary]">{t("circle:detail.completedTitle")}</Text>
            <Text className="text-xs text-[--text-muted]">{t("circle:detail.completedHint")}</Text>
          </ThemedCard>
        ) : storedCircle.status === "active" ? (
          <PrimaryCtaButton
            label={t("circle:detail.start")}
            onPress={() => router.push({ pathname: "/circle/session", params: { id } } as unknown as Href)}
            className="mb-4 w-full"
          />
        ) : null}

        {detail?.members && detail.members.length > 0 ? (
          <View className="mb-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-[--text-muted]">{t("circle:detail.members")}</Text>
              {typeof detail.activeTodayCount === "number" ? (
                <Text className="text-xs text-[--text-muted]">
                  {t("circle:detail.activeToday", { active: detail.activeTodayCount, total: detail.members.length })}
                </Text>
              ) : null}
            </View>
            {detail.members.map((member, index) => (
              <View key={`${member.displayName}-${index}`} className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm text-[--text-primary]">{member.displayName}</Text>
                {member.activeToday === true ? (
                  <FontAwesome6
                    name="check"
                    size={12}
                    color={tokens.success}
                    accessibilityLabel={t("circle:detail.activeTodayA11y")}
                  />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <ThemedCard className="mb-4 flex-row items-center justify-between rounded-2xl p-4">
          <View>
            <Text className="text-xs text-[--text-muted]">{t("circle:detail.code")}</Text>
            <Text className="text-base font-semibold tracking-[2px] text-[--text-primary]">{storedCircle.code}</Text>
          </View>
          <PrimaryCtaButton label={t("circle:detail.share")} onPress={() => void handleShare()} style={{ paddingVertical: 10, paddingHorizontal: 18 }} textClassName="text-sm" />
        </ThemedCard>

        {!storedCircle.isCreator ? (
          <PrimaryCtaButton
            label={t("circle:detail.leave")}
            onPress={() => setLeaveConfirmVisible(true)}
            disabled={isBusy}
            className="w-full"
            style={{ backgroundColor: "transparent", borderWidth: 1, borderColor: "#ef4444" }}
            textClassName="text-[#ef4444]"
          />
        ) : storedCircle.status === "active" ? (
          <PrimaryCtaButton
            label={t("circle:detail.close")}
            onPress={() => setCloseConfirmVisible(true)}
            disabled={isBusy}
            className="w-full"
            style={{ backgroundColor: "transparent", borderWidth: 1, borderColor: "#ef4444" }}
            textClassName="text-[#ef4444]"
          />
        ) : null}
      </PageScrollView>

      <ConfirmModal
        visible={leaveConfirmVisible}
        title={t("circle:detail.leaveConfirmTitle")}
        message={t("circle:detail.leaveConfirmMessage")}
        confirmLabel={t("circle:detail.leave")}
        cancelLabel={t("circle:detail.cancel")}
        destructive
        onConfirm={() => void handleLeave()}
        onCancel={() => setLeaveConfirmVisible(false)}
      />
      <ConfirmModal
        visible={closeConfirmVisible}
        title={t("circle:detail.closeConfirmTitle")}
        message={t("circle:detail.closeConfirmMessage")}
        confirmLabel={t("circle:detail.close")}
        cancelLabel={t("circle:detail.cancel")}
        destructive
        onConfirm={() => void handleClose()}
        onCancel={() => setCloseConfirmVisible(false)}
      />
    </PageLayout>
  );
}
