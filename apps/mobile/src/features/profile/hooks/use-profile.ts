import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { AppState, Linking, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import type { HapticsPattern } from "../../../services/haptics-pattern";
import { saveUserPreferences, deleteUser } from "../../users/services/users-api-client";
import { useBackendUser } from "../../users/hooks/use-backend-user";
import {
  isRevenueCatConfigured,
  syncPremiumStatusWithRevenueCat
} from "../../subscriptions/services/revenuecat-client";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { toMemberSinceLabel } from "../services/profile-format";
import { useReminderTimeModal } from "./use-reminder-time-modal";

export function useProfile() {
  const router = useRouter();
  const { t } = useTranslation(["profile", "common"]);

  const fallbackDisplayName = useProfileStore((s) => s.displayName);
  const memberSinceLabel = useProfileStore((s) => s.memberSinceLabel);
  const isPremium = useProfileStore((s) => s.isPremium);
  const locale = useProfileStore((s) => s.locale);
  const setLocale = useProfileStore((s) => s.setLocale);
  const reminderTime = useProfileStore((s) => s.reminderTime);
  const hapticsPattern = useProfileStore((s) => s.hapticsPattern);
  const setHapticsPattern = useProfileStore((s) => s.setHapticsPattern);
  const hydrateFromBackend = useProfileStore((s) => s.hydrateFromBackend);
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const authDisplayName = useAuthStore((s) => s.session?.displayName);
  const signOut = useAuthStore((s) => s.signOut);
  const resetTour = useOnboardingStore((s) => s.resetTour);

  // Sunucu kullanıcı belgesi; store hidrasyonu kökteki useBackendUserSync'te.
  const { data: backendUser, refetch: refetchBackendUser } = useBackendUser();
  const premiumSheet = usePremiumSheet({
    loadTopupOnMount: true,
    onTopupPurchased: refetchBackendUser
  });
  const setPremiumError = premiumSheet.setError;
  const reminderTimeModal = useReminderTimeModal();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldSyncPremiumOnForeground, setShouldSyncPremiumOnForeground] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string>();
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refetchBackendUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [authStatus, refetchBackendUser, session?.userId]);

  const goThemeSelector = () => router.push("/theme-selector");
  const goFontSelector = () => router.push("/font-selector");
  const onLogout = async () => {
    await signOut();
    router.replace("/auth");
  };

  const tourReplay = () => {
    resetTour();
    router.push("/(tabs)/home");
  };

  const openDeleteAccountModal = () => setIsDeleteAccountModalOpen(true);
  const closeDeleteAccountModal = () => setIsDeleteAccountModalOpen(false);
  const deleteAccount = async () => {
    if (!session?.userId) return;
    setIsDeletingAccount(true);
    try {
      await deleteUser(session.userId);
      await signOut();
      router.replace("/auth");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const syncPremiumFromRevenueCat = useCallback(
    async ({ refreshCustomerInfo = false }: { refreshCustomerInfo?: boolean } = {}) => {
      if (authStatus !== "authenticated" || !session?.userId || !isRevenueCatConfigured()) {
        return;
      }

      const synced = await syncPremiumStatusWithRevenueCat(session.userId, {
        refreshCustomerInfo
      });
      hydrateFromBackend({ isPremium: synced.isPremium });
    },
    [authStatus, hydrateFromBackend, session?.userId]
  );

  const manageSubscription = async () => {
    const url =
      Platform.OS === "android"
        ? "https://play.google.com/store/account/subscriptions?package=com.zikirmatik_asistan.app"
        : "https://apps.apple.com/account/subscriptions";

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        setPremiumError(t("profile:errors.manageSubscriptionFailed"));
        return;
      }

      setShouldSyncPremiumOnForeground(true);
      await Linking.openURL(url);
    } catch {
      setPremiumError(t("profile:errors.manageSubscriptionFailed"));
    }
  };
  const rateApp = async () => {
    const androidPackage = "com.zikirmatik_asistan.app";
    const androidNativeUrl = `market://details?id=${androidPackage}`;
    const androidWebUrl = `https://play.google.com/store/apps/details?id=${androidPackage}`;
    const iosUrl = "https://apps.apple.com/tr/search?term=zikirmatik%20rehber";

    try {
      if (Platform.OS === "android") {
        const canOpenNative = await Linking.canOpenURL(androidNativeUrl);
        if (canOpenNative) {
          await Linking.openURL(androidNativeUrl);
          return;
        }
        await Linking.openURL(androidWebUrl);
        return;
      }

      await Linking.openURL(iosUrl);
    } catch {
      setPremiumError(t("profile:errors.storeOpenFailed"));
    }
  };
  const sendFeedback = async () => {
    const subject = encodeURIComponent(t("profile:feedbackEmail.subject"));
    const body = encodeURIComponent(t("profile:feedbackEmail.body"));
    const mailUrl = `mailto:support@zikirmatik.app?subject=${subject}&body=${body}`;
    const webComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=support@zikirmatik.app&su=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
        return;
      }

      await Linking.openURL(webComposeUrl);
    } catch {
      setFeedbackError(t("profile:errors.noEmailApp"));
    }
  };

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId || !isRevenueCatConfigured()) {
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        if (!isCancelled) {
          await syncPremiumFromRevenueCat();
        }
      } catch {
        // Keep existing backend premium status when RevenueCat sync fails.
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, session?.userId, syncPremiumFromRevenueCat]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId || !shouldSyncPremiumOnForeground) {
      return;
    }

    let isSyncing = false;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || isSyncing) {
        return;
      }

      isSyncing = true;
      void syncPremiumFromRevenueCat({ refreshCustomerInfo: true })
        .catch(() => {
          // Keep existing backend premium status when the store sync cannot be refreshed.
        })
        .finally(() => {
          isSyncing = false;
          setShouldSyncPremiumOnForeground(false);
        });
    });

    return () => {
      subscription.remove();
    };
  }, [
    authStatus,
    session?.userId,
    shouldSyncPremiumOnForeground,
    syncPremiumFromRevenueCat
  ]);

  const onChangeHapticsPattern = useCallback(
    (pattern: HapticsPattern) => {
      const previousPattern = hapticsPattern;
      setHapticsPattern(pattern);

      if (authStatus !== "authenticated" || !session?.userId) {
        return;
      }

      void saveUserPreferences(
        session.userId,
        // hapticsEnabled geriye uyumluluk için türetilip birlikte gönderilir
        // (bkz. store/profile-store.ts setHapticsPattern).
        { hapticsPattern: pattern, hapticsEnabled: pattern !== "off" }
      ).catch(() => {
        setHapticsPattern(previousPattern);
      });
    },
    [authStatus, hapticsPattern, session?.userId, setHapticsPattern]
  );

  return {
    displayName: backendUser?.displayName ?? authDisplayName ?? fallbackDisplayName,
    profileImageUrl: backendUser?.profileImageUrl,
    memberSinceLabel:
      backendUser?.createdAt
        ? toMemberSinceLabel(backendUser.createdAt, locale, t)
        : memberSinceLabel,
    // Store, sunucu belgesinin (kök hidrasyon) ve RevenueCat senkronunun en
    // güncelini taşır — eskiden backendUser.isPremium ile birlikte yazılırdı.
    isPremium,
    ...reminderTimeModal,
    locale,
    setLocale,
    reminderTime,
    hapticsPattern,
    isPremiumSheetOpen: premiumSheet.isOpen,
    isActivatingPremium: premiumSheet.isActivating,
    premiumPlan: premiumSheet.plan,
    isRefreshing,
    premiumError: premiumSheet.error,
    topupProducts: premiumSheet.topupProducts,
    purchasingTopupId: premiumSheet.purchasingTopupId,
    topupError: premiumSheet.topupError,
    purchaseTopup: premiumSheet.purchaseTopup,
    subscriptionPrices: premiumSheet.subscriptionPrices,
    refresh,
    onChangeHapticsPattern,
    goThemeSelector,
    goFontSelector,
    feedbackError,
    clearFeedbackError: () => setFeedbackError(undefined),
    manageSubscription,
    rateApp,
    sendFeedback,
    openPremiumSheet: premiumSheet.open,
    closePremiumSheet: premiumSheet.close,
    setPremiumPlan: premiumSheet.setPlan,
    activatePremium: premiumSheet.activate,
    tourReplay,
    onLogout,
    isDeleteAccountModalOpen,
    isDeletingAccount,
    openDeleteAccountModal,
    closeDeleteAccountModal,
    deleteAccount
  };
}
