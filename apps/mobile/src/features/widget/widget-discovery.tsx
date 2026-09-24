import { useEffect, useState } from "react";
import { AppState, Modal, Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeTokens } from "@zikirmatik/ui";
import { toDateKey } from "@zikirmatik/shared";
import { getWidgetInfo } from "react-native-android-widget";
import { useVirdStore } from "../../store/vird-store";
import { dayIndexFor, expectedItemsForDay, isDayComplete } from "../vird/services/vird-day";
import { trackEvent } from "../../lib/analytics";
import { WIDGET_NAMES } from "./widgets";
import { WIDGET_DISCOVERY_KEY } from "../../lib/storage/keys";

// Ana ekran widget'ı için keşif yüzeyleri: ana ekrandaki tek seferlik kart +
// Profil'deki kalıcı satırın açtığı ortak "nasıl eklenir" modalı. Kendi
// AsyncStorage anahtarını kullanır — widget-snapshot.ts'teki `widget-state-v1`
// (widget'ın kendi görüntü verisi) ile KARIŞTIRILMAMALI.

type DiscoveryState = {
  dismissed?: boolean;
  installed?: string[];
};

function isDiscoveryState(value: unknown): value is DiscoveryState {
  return !!value && typeof value === "object";
}

export async function readDiscoveryState(): Promise<DiscoveryState> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DISCOVERY_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return isDiscoveryState(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeDiscoveryState(patch: Partial<DiscoveryState>): Promise<void> {
  try {
    const current = await readDiscoveryState();
    const next = { ...current, ...patch };
    await AsyncStorage.setItem(WIDGET_DISCOVERY_KEY, JSON.stringify(next));
  } catch {
    // Depolama başarısız olursa keşif yüzeyi sonraki mount'ta yeniden dener.
  }
}

/** Bugünkü vird gününün tamamlanıp tamamlanmadığını, todays-vird-card.tsx ile
 * aynı saf hesabı (vird-day.ts) kullanarak döner. Aktif program yoksa false. */
function useIsVirdDayCompleteToday(): boolean {
  const programs = useVirdStore((state) => state.programs);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);
  const dayProgress = useVirdStore((state) => state.dayProgress);

  const activeProgram = programs.find((program) => program.id === activeProgramId) ?? null;
  if (!activeProgram) {
    return false;
  }

  const todayKey = toDateKey(new Date());
  const dayIndex = dayIndexFor(activeProgram, todayKey);
  const expected = expectedItemsForDay(activeProgram, dayIndex);
  return isDayComplete(expected, dayProgress[todayKey]);
}

export function WidgetGuideModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("home");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <View
          className="w-full max-w-[360px] rounded-2xl p-5"
          style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.12), backgroundColor: tokens.card }}
        >
          <Text className="mb-3 text-base font-semibold" style={{ color: tokens.textPrimary }}>
            {t("home:widgetGuide.title")}
          </Text>
          <View className="gap-3">
            {[t("home:widgetGuide.step1"), t("home:widgetGuide.step2"), t("home:widgetGuide.step3")].map((step, index) => (
              <View key={index} className="flex-row items-start gap-2.5">
                <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(tokens.accent, 0.16) }}>
                  <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-sm leading-5" style={{ color: tokens.textMuted }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("home:widgetGuide.done")}
            className="mt-5 h-11 items-center justify-center rounded-full"
            style={{ backgroundColor: tokens.accent }}
          >
            <Text className="text-sm font-semibold" style={{ color: tokens.bg }}>
              {t("home:widgetGuide.done")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function WidgetDiscoveryCard({ streakDays, isVirdDayComplete }: { streakDays: number; isVirdDayComplete?: boolean }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("home");
  const virdDayCompleteFallback = useIsVirdDayCompleteToday();
  const dayComplete = isVirdDayComplete ?? virdDayCompleteFallback;

  const [guideVisible, setGuideVisible] = useState(false);
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [hasWidgetInstalled, setHasWidgetInstalled] = useState<boolean | null>(null);
  const [shownFired, setShownFired] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    let cancelled = false;

    const check = async () => {
      const state = await readDiscoveryState();
      if (!cancelled) {
        setDismissed(!!state.dismissed);
      }

      try {
        const results = await Promise.all(WIDGET_NAMES.map((name) => getWidgetInfo(name)));
        const anyInstalled = results.some((infos) => infos.length > 0);
        if (!cancelled) {
          setHasWidgetInstalled(anyInstalled);
        }
      } catch {
        if (!cancelled) {
          setHasWidgetInstalled(false);
        }
      }
    };

    void check();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void check();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const eligible = (dayComplete || streakDays >= 3) && dismissed === false && hasWidgetInstalled === false;

  useEffect(() => {
    if (eligible && !shownFired) {
      setShownFired(true);
      void trackEvent("widget_card_shown");
    }
  }, [eligible, shownFired]);

  if (Platform.OS !== "android") {
    return null;
  }
  // Yükleme sırasında (henüz dismissed/hasWidgetInstalled okunmadıysa) titremeyi
  // önlemek için hiçbir şey gösterme.
  if (dismissed === null || hasWidgetInstalled === null) {
    return null;
  }
  if (!eligible) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    void writeDiscoveryState({ dismissed: true });
    void trackEvent("widget_card_dismissed");
  };

  const handleOpenGuide = () => {
    setGuideVisible(true);
    void trackEvent("widget_guide_opened", { from: "card" });
  };

  return (
    <View className="mb-5 px-5">
      <View
        className="rounded-2xl px-4 py-4"
        style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.12), backgroundColor: withAlpha(tokens.card, 0.92) }}
      >
        <View className="flex-row items-start justify-between">
          <Text className="mb-1 flex-1 text-sm font-semibold" style={{ color: tokens.textPrimary }}>
            {t("home:widgetCard.title")}
          </Text>
          <Pressable onPress={handleDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel={t("home:widgetCard.dismissLabel")} className="p-1">
            <FontAwesome6 name="xmark" size={14} color={tokens.textMuted} />
          </Pressable>
        </View>
        <Text className="mb-3 text-xs leading-4" style={{ color: tokens.textMuted }}>
          {t("home:widgetCard.body")}
        </Text>
        <Pressable
          onPress={handleOpenGuide}
          accessibilityRole="button"
          accessibilityLabel={t("home:widgetCard.cta")}
          className="self-start rounded-full px-4 py-2"
          style={{ backgroundColor: tokens.accent }}
        >
          <Text className="text-xs font-semibold" style={{ color: tokens.bg }}>
            {t("home:widgetCard.cta")}
          </Text>
        </Pressable>
      </View>
      <WidgetGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </View>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
