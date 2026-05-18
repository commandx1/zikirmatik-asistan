import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Linking, Platform } from "react-native";
import { listDhikrLogsByUser } from "../../dhikrs/services/dhikr-logs-api-client";
import { getUserStreak } from "../../stats/services/streaks-api-client";
import {
  getUserById,
  saveUserPreferences,
  saveUserOnboarding,
  type BackendUser,
  UsersApiError
} from "../../users/services/users-api-client";
import {
  isRevenueCatConfigured,
  purchasePremiumWithRevenueCat,
  restorePremiumWithRevenueCat,
  syncPremiumStatusWithRevenueCat,
  toRevenueCatMessage
} from "../../subscriptions/services/revenuecat-client";
import { syncDailyReminderNotification } from "../services/daily-reminder-notifications";
import { useThemePreferences } from "../../../hooks/use-theme-preferences";
import { useAuthStore } from "../../../store/auth-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { useProfileStore } from "../../../store/profile-store";
import { FONT_LABELS } from "../../../theme/fonts";
import { THEME_LABELS } from "../../../theme/labels";
import { PURPOSE_OPTIONS } from "../../onboarding/onboarding-data";

type PremiumPlan = "monthly" | "annual";

export function useProfile() {
  const router = useRouter();
  const { themeName, fontFamily, hydrateAppearance } = useThemePreferences();

  const fallbackDisplayName = useProfileStore((s) => s.displayName);
  const memberSinceLabel = useProfileStore((s) => s.memberSinceLabel);
  const totalDhikr = useProfileStore((s) => s.totalDhikr);
  const streakDays = useProfileStore((s) => s.streakDays);
  const activeDays = useProfileStore((s) => s.activeDays);
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
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const onboardingPurpose = useOnboardingStore((s) => s.purpose);
  const onboardingCity = useOnboardingStore((s) => s.city);
  const setOnboardingPurpose = useOnboardingStore((s) => s.setPurpose);
  const setOnboardingCity = useOnboardingStore((s) => s.setCity);

  const [isPremiumSheetOpen, setPremiumSheetOpen] = useState(false);
  const [backendUser, setBackendUser] = useState<BackendUser>();
  const [backendQuickStats, setBackendQuickStats] = useState<{
    totalDhikr: number;
    streakDays: number;
    activeDays: number;
  }>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivatingPremium, setIsActivatingPremium] = useState(false);
  const [isRestoringPremium, setIsRestoringPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState<PremiumPlan>("annual");
  const [premiumError, setPremiumError] = useState<string>();
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [draftPurpose, setDraftPurpose] = useState(onboardingPurpose);
  const [draftCity, setDraftCity] = useState(onboardingCity || city || "");
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false);
  const [personalInfoError, setPersonalInfoError] = useState<string>();
  const [isReminderTimeModalOpen, setIsReminderTimeModalOpen] = useState(false);
  const [reminderHourDraft, setReminderHourDraft] = useState("08");
  const [reminderMinuteDraft, setReminderMinuteDraft] = useState("00");
  const [isSavingReminderTime, setIsSavingReminderTime] = useState(false);
  const [reminderTimeError, setReminderTimeError] = useState<string>();

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

  const syncBackendQuickStats = useCallback(async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setBackendQuickStats(undefined);
      return;
    }

    const [logs, streak] = await Promise.all([
      listDhikrLogsByUser(session.userId, undefined, undefined, session.accessToken),
      getUserStreak(session.userId, session.accessToken)
    ]);

    const completedLogCount = logs.reduce(
      (sum, item) => sum + (item.isCompleted ? 1 : 0),
      0
    );

    setBackendQuickStats({
      totalDhikr: completedLogCount,
      streakDays: Math.max(0, streak.currentStreak ?? 0),
      activeDays: Math.max(0, streak.totalDaysActive ?? 0)
    });
  }, [authStatus, session?.userId]);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([syncBackendUser(), syncBackendQuickStats()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [authStatus, session?.userId, syncBackendQuickStats, syncBackendUser]);

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

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setBackendQuickStats(undefined);
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        await syncBackendQuickStats();
        if (isCancelled) {
          return;
        }
      } catch {
        if (!isCancelled) {
          setBackendQuickStats(undefined);
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, session?.userId, syncBackendQuickStats]);

  const quickStats = useMemo(
    () => [
      {
        id: "total-dhikr",
        value: (backendQuickStats?.totalDhikr ?? totalDhikr).toLocaleString("tr-TR"),
        label: "Toplam Zikir"
      },
      { id: "streak-days", value: String(backendQuickStats?.streakDays ?? streakDays), label: "Gün Seri" },
      { id: "active-days", value: String(backendQuickStats?.activeDays ?? activeDays), label: "Gün Aktif" }
    ],
    [activeDays, backendQuickStats?.activeDays, backendQuickStats?.streakDays, backendQuickStats?.totalDhikr, streakDays, totalDhikr]
  );

  const openPremiumSheet = () => setPremiumSheetOpen(true);
  const closePremiumSheet = () => {
    setPremiumError(undefined);
    setPremiumSheetOpen(false);
  };
  const goThemeSelector = () => router.push("/theme-selector");
  const goFontSelector = () => router.push("/font-selector");
  const onLogout = async () => {
    await signOut();
    router.replace("/auth");
  };
  const onRestartOnboarding = () => {
    resetOnboarding();
    router.replace("/onboarding");
  };
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
      Alert.alert(
        "E-posta uygulaması açılamadı",
        "Cihazında varsayılan e-posta uygulaması yok gibi görünüyor."
      );
    }
  };

  const activatePremium = async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setPremiumError("Premium aktivasyonu için önce giriş yapmalısın.");
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
      setPremiumError(toRevenueCatMessage(error));
    } finally {
      setIsActivatingPremium(false);
    }
  };

  const restorePremium = async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setPremiumError("Satın alma geri yükleme için önce giriş yapmalısın.");
      return;
    }

    setIsRestoringPremium(true);
    setPremiumError(undefined);
    try {
      const synced = await restorePremiumWithRevenueCat(session.userId, session.accessToken);
      hydrateFromBackend({ isPremium: synced.isPremium });
      setBackendUser((current) => (current ? { ...current, isPremium: synced.isPremium } : current));
      if (synced.isPremium) {
        closePremiumSheet();
      } else {
        setPremiumError("Aktif abonelik bulunamadı.");
      }
    } catch (error) {
      setPremiumError(toRevenueCatMessage(error));
    } finally {
      setIsRestoringPremium(false);
    }
  };

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId || !isRevenueCatConfigured()) {
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        const synced = await syncPremiumStatusWithRevenueCat(session.userId, session.accessToken);
        if (!isCancelled) {
          if (synced.isPremium) {
            hydrateFromBackend({ isPremium: true });
            setBackendUser((current) => (current ? { ...current, isPremium: true } : current));
          }
        }
      } catch {
        // Keep existing backend premium status when RevenueCat sync fails.
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, hydrateFromBackend, session?.accessToken, session?.userId]);

  const purposeValue = backendUser?.onboarding?.purpose ?? onboardingPurpose;
  const personalCityValue =
    backendUser?.onboarding?.city ??
    backendUser?.city ??
    (onboardingCity || city);
  const purposeLabel = getPurposeLabel(purposeValue);
  const hasPersonalInfoChanges =
    draftPurpose !== purposeValue ||
    draftCity.trim() !== personalCityValue.trim();
  const canSavePersonalInfo = draftCity.trim().length > 0 && hasPersonalInfoChanges && !isSavingPersonalInfo;

  const openPersonalInfoModal = () => {
    setDraftPurpose(purposeValue);
    setDraftCity(personalCityValue);
    setPersonalInfoError(undefined);
    setIsPersonalInfoModalOpen(true);
  };

  const closePersonalInfoModal = () => {
    if (isSavingPersonalInfo) {
      return;
    }
    setPersonalInfoError(undefined);
    setIsPersonalInfoModalOpen(false);
  };

  const savePersonalInfo = async () => {
    const trimmedCity = draftCity.trim();
    if (!trimmedCity) {
      setPersonalInfoError("Lütfen şehir seç.");
      return;
    }

    setPersonalInfoError(undefined);
    setIsSavingPersonalInfo(true);

    try {
      if (authStatus === "authenticated" && session?.userId) {
        const updatedUser = await saveUserOnboarding(
          session.userId,
          {
            purpose: draftPurpose,
            city: trimmedCity
          },
          session.accessToken
        );
        setBackendUser(updatedUser);
      }

      setOnboardingPurpose(draftPurpose);
      setOnboardingCity(trimmedCity);
      hydrateFromBackend({ city: trimmedCity });
      setIsPersonalInfoModalOpen(false);
    } catch (error) {
      if (error instanceof UsersApiError) {
        setPersonalInfoError(error.message);
      } else {
        setPersonalInfoError("Kişisel bilgiler güncellenemedi. Lütfen tekrar dene.");
      }
    } finally {
      setIsSavingPersonalInfo(false);
    }
  };

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
    setReminderHourDraft(value.replace(/\D+/g, "").slice(0, 2));
    if (reminderTimeError) {
      setReminderTimeError(undefined);
    }
  };

  const onReminderMinuteChange = (value: string) => {
    setReminderMinuteDraft(value.replace(/\D+/g, "").slice(0, 2));
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

      void syncDailyReminderNotification({
        enabled,
        reminderTime,
        requestPermission: enabled
      })
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
    void syncDailyReminderNotification({
      enabled: dailyReminderEnabled,
      reminderTime,
      requestPermission: false
    }).catch(() => {
      // Keep user preference as-is when background sync fails.
    });
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
    purposeLabel,
    personalCityLabel: personalCityValue,
    isPersonalInfoModalOpen,
    isReminderTimeModalOpen,
    draftPurpose,
    draftCity,
    reminderHourDraft,
    reminderMinuteDraft,
    isSavingPersonalInfo,
    isSavingReminderTime,
    personalInfoError,
    reminderTimeError,
    canSavePersonalInfo,
    canSaveReminderTime,
    language,
    reminderTime,
    dailyReminderEnabled,
    kandilNotificationsEnabled,
    adhanNotificationsEnabled,
    hapticsEnabled,
    themeLabel: THEME_LABELS[themeName],
    fontLabel: FONT_LABELS[fontFamily],
    quickStats,
    isPremiumSheetOpen,
    isActivatingPremium,
    isRestoringPremium,
    premiumPlan,
    isRefreshing,
    premiumError,
    refresh,
    onToggleDailyReminder,
    setKandilNotificationsEnabled,
    setAdhanNotificationsEnabled,
    onToggleHaptics,
    goThemeSelector,
    goFontSelector,
    openPersonalInfoModal,
    closePersonalInfoModal,
    setDraftPurpose,
    setDraftCity,
    savePersonalInfo,
    openReminderTimeModal,
    closeReminderTimeModal,
    onReminderHourChange,
    onReminderMinuteChange,
    saveReminderTime,
    manageSubscription,
    rateApp,
    sendFeedback,
    openPremiumSheet,
    closePremiumSheet,
    setPremiumPlan,
    activatePremium,
    restorePremium,
    onRestartOnboarding,
    onLogout
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

function getPurposeLabel(value: string) {
  return PURPOSE_OPTIONS.find((item) => item.id === value)?.title ?? "Belirtilmedi";
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
