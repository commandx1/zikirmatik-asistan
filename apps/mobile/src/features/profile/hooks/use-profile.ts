import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { AppState, Linking, Platform } from "react-native";
import {
  getUserById,
  saveUserPreferences,
  deleteUser,
  type BackendUser
} from "../../users/services/users-api-client";
import {
  CREDIT_TOPUP_FALLBACK,
  getCreditTopupProducts,
  isRevenueCatConfigured,
  purchaseCreditTopup,
  purchasePremiumWithRevenueCat,
  syncPremiumStatusWithRevenueCat,
  toRevenueCatMessage,
  type CreditTopupProduct
} from "../../subscriptions/services/revenuecat-client";
import { syncDailyReminderNotification } from "../services/daily-reminder-notifications";
import { requestDailyReminderOptIn } from "../services/request-daily-reminder-opt-in";
import { useThemePreferences } from "../../../hooks/use-theme-preferences";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useRequireAuth } from "../../auth/hooks/use-require-auth";
import { THEME_LABELS } from "../../../theme/labels";
import { useOnboardingStore } from "../../../store/onboarding-store";

type PremiumPlan = "monthly" | "annual";

export function useProfile() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const { hydrateAppearance } = useThemePreferences();

  const fallbackDisplayName = useProfileStore((s) => s.displayName);
  const memberSinceLabel = useProfileStore((s) => s.memberSinceLabel);
  const isPremium = useProfileStore((s) => s.isPremium);
  const city = useProfileStore((s) => s.city);
  const language = useProfileStore((s) => s.language);
  const reminderTime = useProfileStore((s) => s.reminderTime);
  const dailyReminderEnabled = useProfileStore((s) => s.dailyReminderEnabled);
  const kandilNotificationsEnabled = useProfileStore((s) => s.kandilNotificationsEnabled);
  const adhanNotificationsEnabled = useProfileStore((s) => s.adhanNotificationsEnabled);
  const hapticsEnabled = useProfileStore((s) => s.hapticsEnabled);
  const setReminderTime = useProfileStore((s) => s.setReminderTime);
  const setDailyReminderEnabled = useProfileStore((s) => s.setDailyReminderEnabled);
  const setKandilNotificationsEnabled = useProfileStore((s) => s.setKandilNotificationsEnabled);
  const setAdhanNotificationsEnabled = useProfileStore((s) => s.setAdhanNotificationsEnabled);
  const setHapticsEnabled = useProfileStore((s) => s.setHapticsEnabled);
  const hydrateFromBackend = useProfileStore((s) => s.hydrateFromBackend);
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const authDisplayName = useAuthStore((s) => s.session?.displayName);
  const signOut = useAuthStore((s) => s.signOut);
  const resetTour = useOnboardingStore((s) => s.resetTour);

  const [isPremiumSheetOpen, setPremiumSheetOpen] = useState(false);
  const [backendUser, setBackendUser] = useState<BackendUser>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivatingPremium, setIsActivatingPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState<PremiumPlan>("annual");
  const [premiumError, setPremiumError] = useState<string>();
  const [topupProducts, setTopupProducts] = useState<CreditTopupProduct[]>(CREDIT_TOPUP_FALLBACK);
  const [purchasingTopupId, setPurchasingTopupId] = useState<string | undefined>();
  const [topupError, setTopupError] = useState<string | undefined>();
  const [isReminderTimeModalOpen, setIsReminderTimeModalOpen] = useState(false);
  const [reminderHourDraft, setReminderHourDraft] = useState("08");
  const [reminderMinuteDraft, setReminderMinuteDraft] = useState("00");
  const [isSavingReminderTime, setIsSavingReminderTime] = useState(false);
  const [reminderTimeError, setReminderTimeError] = useState<string>();
  const [shouldSyncPremiumOnForeground, setShouldSyncPremiumOnForeground] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string>();
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const syncBackendUser = useCallback(async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setBackendUser(undefined);
      return;
    }

    const user = await getUserById(session.userId, session.accessToken);

    setBackendUser(user);
    hydrateFromBackend({
      displayName: user.displayName,
      city: user.city,
      isPremium: user.isPremium,
      reminderTime: user.notifSettings?.reminderTime,
      dailyReminderEnabled: user.notifSettings?.dailyReminder,
      kandilNotificationsEnabled: user.notifSettings?.kandilNotifications,
      adhanNotificationsEnabled: user.notifSettings?.azanNotifications,
      hapticsEnabled: user.hapticsEnabled
    });
    hydrateAppearance({
      themeName:
        typeof user.theme === "string" && user.theme in THEME_LABELS
          ? (user.theme as keyof typeof THEME_LABELS)
          : undefined,
          fontFamily:
            user.fontFamily === "default" ||
            user.fontFamily === "merriweather" ||
            user.fontFamily === "intel-one-mono" ||
            user.fontFamily === "finlandica-headline" ||
            user.fontFamily === "indie-flower"
              ? user.fontFamily
              : undefined
        });
  }, [authStatus, hydrateAppearance, hydrateFromBackend, session?.accessToken, session?.userId]);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await syncBackendUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [authStatus, session?.userId, syncBackendUser]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setBackendUser(undefined);
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        await syncBackendUser();
        if (isCancelled) {
          return;
        }
      } catch {
        if (!isCancelled) {
          setBackendUser(undefined);
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, session?.userId, syncBackendUser]);

  const openPremiumSheet = () => setPremiumSheetOpen(true);
  const closePremiumSheet = () => {
    setPremiumError(undefined);
    setTopupError(undefined);
    setPremiumSheetOpen(false);
  };
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
      await deleteUser(session.userId, session.accessToken);
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

      const synced = await syncPremiumStatusWithRevenueCat(
        session.userId,
        session.accessToken,
        { refreshCustomerInfo }
      );
      hydrateFromBackend({ isPremium: synced.isPremium });
      setBackendUser((current) => (current ? { ...current, isPremium: synced.isPremium } : current));
    },
    [authStatus, hydrateFromBackend, session?.accessToken, session?.userId]
  );

  const manageSubscription = async () => {
    const url =
      Platform.OS === "android"
        ? "https://play.google.com/store/account/subscriptions?package=com.zikirmatik_asistan.app"
        : "https://apps.apple.com/account/subscriptions";

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        setPremiumError("Abonelik yönetim ekranı açılamadı.");
        return;
      }

      setShouldSyncPremiumOnForeground(true);
      await Linking.openURL(url);
    } catch {
      setPremiumError("Abonelik yönetim ekranı açılamadı.");
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
      setPremiumError("Mağaza sayfası açılamadı.");
    }
  };
  const sendFeedback = async () => {
    const subject = encodeURIComponent("Zikirmatik Rehber Geri Bildirimi");
    const body = encodeURIComponent(
      "Merhaba,\n\nGeri bildirimim:\n\n\n---\nCihaz:\nUygulama sürümü:\n"
    );
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
      setFeedbackError("Cihazında varsayılan e-posta uygulaması yok gibi görünüyor.");
    }
  };

  const activatePremiumInner = async () => {
    if (!session?.userId) {
      return;
    }

    setIsActivatingPremium(true);
    setPremiumError(undefined);
    try {
      const synced = await purchasePremiumWithRevenueCat(session.userId, session.accessToken, premiumPlan);
      hydrateFromBackend({ isPremium: synced.isPremium });
      setBackendUser((current) => (current ? { ...current, isPremium: synced.isPremium } : current));
      if (synced.isPremium) {
        closePremiumSheet();
      }
    } catch (error) {
      const msg = toRevenueCatMessage(error);
      if (msg) setPremiumError(msg);
    } finally {
      setIsActivatingPremium(false);
    }
  };

  const activatePremium = () => {
    requireAuth(() => {
      void activatePremiumInner();
    });
  };

  const loadTopupProducts = useCallback(async () => {
    if (!session?.userId) {
      return;
    }
    try {
      setTopupProducts(await getCreditTopupProducts(session.userId));
    } catch {
      // Mağaza fiyatları alınamazsa fallback fiyatlar gösterilir.
    }
  }, [session?.userId]);

  useEffect(() => {
    void loadTopupProducts();
  }, [loadTopupProducts]);

  const purchaseTopup = async (productId: string): Promise<boolean> => {
    if (!session?.userId || purchasingTopupId) {
      return false;
    }
    setPurchasingTopupId(productId);
    setTopupError(undefined);
    try {
      await purchaseCreditTopup(session.userId, productId);
      await syncBackendUser();
      return true;
    } catch (error) {
      const msg = toRevenueCatMessage(error);
      if (msg) setTopupError(msg);
      return false;
    } finally {
      setPurchasingTopupId(undefined);
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

  const normalizedReminderDraft = `${normalizeTimeUnit(reminderHourDraft)}:${normalizeTimeUnit(reminderMinuteDraft)}`;
  const canSaveReminderTime = normalizedReminderDraft !== reminderTime && !isSavingReminderTime;

  const openReminderTimeModal = () => {
    const parsed = parseReminderTime(reminderTime);
    setReminderHourDraft(String(parsed.hour).padStart(2, "0"));
    setReminderMinuteDraft(String(parsed.minute).padStart(2, "0"));
    setReminderTimeError(undefined);
    setIsReminderTimeModalOpen(true);
  };

  const closeReminderTimeModal = () => {
    if (isSavingReminderTime) {
      return;
    }
    setReminderTimeError(undefined);
    setIsReminderTimeModalOpen(false);
  };

  const onReminderHourChange = (value: string) => {
    setReminderHourDraft(value);
    if (reminderTimeError) {
      setReminderTimeError(undefined);
    }
  };

  const onReminderMinuteChange = (value: string) => {
    setReminderMinuteDraft(value);
    if (reminderTimeError) {
      setReminderTimeError(undefined);
    }
  };

  const saveReminderTime = async () => {
    const parsed = parseReminderTime(`${normalizeTimeUnit(reminderHourDraft)}:${normalizeTimeUnit(reminderMinuteDraft)}`);
    if (!parsed.isValid) {
      setReminderTimeError("Lütfen geçerli bir saat gir (00-23 / 00-59).");
      return;
    }

    const nextReminderTime = `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
    const previousReminderTime = reminderTime;
    setReminderTime(nextReminderTime);
    setReminderTimeError(undefined);
    setIsSavingReminderTime(true);

    try {
      await syncDailyReminderNotification({
        enabled: dailyReminderEnabled,
        reminderTime: nextReminderTime,
        requestPermission: false
      });

      if (authStatus === "authenticated" && session?.userId) {
        await saveUserPreferences(
          session.userId,
          {
            reminderTime: nextReminderTime,
            dailyReminder: dailyReminderEnabled
          },
          session.accessToken
        );
      }

      setIsReminderTimeModalOpen(false);
    } catch {
      setReminderTime(previousReminderTime);
      setReminderTimeError("Saat güncellenemedi. Lütfen tekrar dene.");
    } finally {
      setIsSavingReminderTime(false);
    }
  };

  const onToggleDailyReminder = useCallback(
    (enabled: boolean) => {
      const previous = dailyReminderEnabled;
      setDailyReminderEnabled(enabled);

      const persistPreference = async (nextEnabled: boolean) => {
        if (authStatus !== "authenticated" || !session?.userId) {
          return;
        }

        await saveUserPreferences(
          session.userId,
          {
            dailyReminder: nextEnabled,
            reminderTime
          },
          session.accessToken
        );
      };

      const syncPromise = enabled
        ? requestDailyReminderOptIn(reminderTime)
        : syncDailyReminderNotification({ enabled: false, reminderTime, requestPermission: false });

      void syncPromise
        .then(async ({ permissionGranted }) => {
          if (!enabled) {
            await persistPreference(false);
            return;
          }

          if (!permissionGranted) {
            setDailyReminderEnabled(false);
            await persistPreference(false);
            return;
          }

          await persistPreference(true);
        })
        .catch(async () => {
          setDailyReminderEnabled(previous);
          await persistPreference(previous);
        });
    },
    [
      authStatus,
      dailyReminderEnabled,
      reminderTime,
      session?.accessToken,
      session?.userId,
      setDailyReminderEnabled
    ]
  );

  const onToggleHaptics = useCallback(
    (enabled: boolean) => {
      setHapticsEnabled(enabled);

      if (authStatus !== "authenticated" || !session?.userId) {
        return;
      }

      void saveUserPreferences(
        session.userId,
        { hapticsEnabled: enabled },
        session.accessToken
      ).catch(() => {
        setHapticsEnabled(!enabled);
      });
    },
    [authStatus, session?.accessToken, session?.userId, setHapticsEnabled]
  );

  useEffect(() => {
    // OS zamanlamasını tercihle senkronize et. İzin yoksa mevcut
    // zamanlamaya dokunma; tercih yalnızca kullanıcı değiştirince değişmeli.
    void syncDailyReminderNotification({
      enabled: dailyReminderEnabled,
      reminderTime,
      requestPermission: false
    }).catch(() => {});
  }, [dailyReminderEnabled, reminderTime]);

  return {
    displayName: backendUser?.displayName ?? authDisplayName ?? fallbackDisplayName,
    profileImageUrl: backendUser?.profileImageUrl,
    memberSinceLabel:
      backendUser?.createdAt
        ? toMemberSinceLabel(backendUser.createdAt)
        : memberSinceLabel,
    isPremium: backendUser?.isPremium ?? isPremium,
    city: backendUser?.city ?? city,
    isReminderTimeModalOpen,
    reminderHourDraft,
    reminderMinuteDraft,
    isSavingReminderTime,
    reminderTimeError,
    canSaveReminderTime,
    language,
    reminderTime,
    dailyReminderEnabled,
    kandilNotificationsEnabled,
    adhanNotificationsEnabled,
    hapticsEnabled,
    isPremiumSheetOpen,
    isActivatingPremium,
    premiumPlan,
    isRefreshing,
    premiumError,
    topupProducts,
    purchasingTopupId,
    topupError,
    purchaseTopup,
    refresh,
    onToggleDailyReminder,
    setKandilNotificationsEnabled,
    setAdhanNotificationsEnabled,
    onToggleHaptics,
    goThemeSelector,
    goFontSelector,
    openReminderTimeModal,
    closeReminderTimeModal,
    onReminderHourChange,
    onReminderMinuteChange,
    saveReminderTime,
    feedbackError,
    clearFeedbackError: () => setFeedbackError(undefined),
    manageSubscription,
    rateApp,
    sendFeedback,
    openPremiumSheet,
    closePremiumSheet,
    setPremiumPlan,
    activatePremium,
    tourReplay,
    onLogout,
    isDeleteAccountModalOpen,
    isDeletingAccount,
    openDeleteAccountModal,
    closeDeleteAccountModal,
    deleteAccount
  };
}

function normalizeTimeUnit(value: string) {
  const trimmedDigits = value.replace(/\D+/g, "").slice(0, 2);
  if (!trimmedDigits) {
    return "00";
  }

  return trimmedDigits.padStart(2, "0");
}

function parseReminderTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return { hour: 8, minute: 0, isValid: false };
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 8, minute: 0, isValid: false };
  }

  return { hour, minute, isValid: true };
}

function toMemberSinceLabel(isoDate: string) {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) {
    return "Yeni üye";
  }

  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
  const formatted = formatter.format(createdAt);
  const withCapitalizedMonth = `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
  return `${withCapitalizedMonth}'ten beri`;
}
