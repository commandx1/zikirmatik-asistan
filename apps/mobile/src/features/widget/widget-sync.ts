import { useEffect, useRef, type JSX } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestWidgetUpdate } from "react-native-android-widget";
import { toDateKey } from "@zikirmatik/shared";
import { useDhikrStore } from "../../store/dhikr-store";
import { useVirdStore } from "../../store/vird-store";
import { useCircleStore } from "../../store/circle-store";
import { useProfileStore } from "../../store/profile-store";
import { useThemeStore } from "../../store/theme-store";
import { useAuthStore } from "../../store/auth-store";
import { WIDGET_STORAGE_KEYS, buildWidgetSnapshot } from "./widget-snapshot";
import { readWidgetRaw } from "./widget-task-handler";
import { WIDGET_NAMES, renderWidgetByName } from "./widgets";

// Bu dosya yalnızca uygulama İÇİNDE çalışır (store import edebilir) — headless
// widget-task-handler.tsx bunu ASLA import etmemeli (o dosya store'ları
// çekemez, bkz. oradaki yorum).

export async function syncWidgets(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    const raw = await readWidgetRaw();
    const snapshot = buildWidgetSnapshot(raw, new Date());

    for (const widgetName of WIDGET_NAMES) {
      // WIDGET_NAMES yalnızca renderWidgetByName'in tanıdığı adları içerir,
      // dolayısıyla burada sonuç asla null olmaz.
      const widget = renderWidgetByName(widgetName, snapshot) as JSX.Element;
      await requestWidgetUpdate({
        widgetName,
        renderWidget: () => widget,
        widgetNotFound: () => {}
      });
    }
  } catch {
    // Widget güncellemesi asla uygulamayı düşürmemeli.
  }
}

async function readWidgetState(): Promise<Record<string, unknown>> {
  try {
    const existingJson = await AsyncStorage.getItem(WIDGET_STORAGE_KEYS.widgetState);
    if (!existingJson) {
      return {};
    }
    const parsed = JSON.parse(existingJson) as { state?: Record<string, unknown> };
    return parsed?.state && typeof parsed.state === "object" ? parsed.state : {};
  } catch {
    return {};
  }
}

async function writeWidgetState(nextState: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(WIDGET_STORAGE_KEYS.widgetState, JSON.stringify({ state: nextState, version: 0 }));
}

export async function cacheServerStreak(value: number, lastActiveDate?: string): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    const existingState = await readWidgetState();
    const nextState = {
      ...existingState,
      serverStreak: { value, fetchedOn: toDateKey(new Date()), lastActiveDate }
    };
    await writeWidgetState(nextState);
  } catch {
    // AsyncStorage yazımı başarısız olursa sessizce vazgeç, widget bir sonraki
    // syncWidgets çağrısında yerel veriye düşer.
  }

  await syncWidgets();
}

// Çıkışta/hesap değişiminde önceki kullanıcının seri önbelleğini temizler
// (K5) — yoksa sonraki kullanıcı öncekinin serisini görür. widgetState'in
// diğer alanlarına dokunmaz.
export async function clearCachedServerStreak(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    const existingState = await readWidgetState();
    if (!("serverStreak" in existingState)) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- serverStreak intentionally dropped
    const { serverStreak, ...rest } = existingState;
    await writeWidgetState(rest);
  } catch {
    // Sessizce vazgeç; widget bir sonraki syncWidgets'ta yerel veriye düşer.
  }
}

const DEBOUNCE_MS = 2000;

export function useWidgetSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dhikrItems = useDhikrStore((state) => state.items);
  const dhikrFreeModeCount = useDhikrStore((state) => state.freeModeCount);
  const virdDayProgress = useVirdStore((state) => state.dayProgress);
  const virdActiveProgramId = useVirdStore((state) => state.activeProgramId);
  const circleTodayCounts = useCircleStore((state) => state.todayCounts);
  const profileLocale = useProfileStore((state) => state.locale);
  const profileStreakDays = useProfileStore((state) => state.streakDays);
  const themeName = useThemeStore((state) => state.themeName);
  const sessionUserId = useAuthStore((state) => state.session?.userId);
  const sessionUserIdRef = useRef<string | undefined>(sessionUserId);
  const isFirstSessionCheckRef = useRef(true);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void syncWidgets();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    // zustand persist AsyncStorage'a ASENKRON yazar; store değişimi anında
    // AsyncStorage'a yansımaz. Bu yüzden burada de debounce ile bekleyip
    // syncWidgets'ı persist yazımından SONRA tetikliyoruz.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void syncWidgets();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    dhikrItems,
    dhikrFreeModeCount,
    virdDayProgress,
    virdActiveProgramId,
    circleTodayCounts,
    profileLocale,
    profileStreakDays,
    themeName
  ]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    // İlk mount hariç: oturum kimliği değiştiğinde (null'a düşmek dahil)
    // önceki kullanıcının seri önbelleğini temizle (K5).
    if (isFirstSessionCheckRef.current) {
      isFirstSessionCheckRef.current = false;
      sessionUserIdRef.current = sessionUserId;
      return;
    }

    if (sessionUserIdRef.current === sessionUserId) {
      return;
    }
    sessionUserIdRef.current = sessionUserId;

    void clearCachedServerStreak().then(() => syncWidgets());
  }, [sessionUserId]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        void syncWidgets();
      }
    });

    return () => subscription.remove();
  }, []);
}
