import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { addEventListener, getInitialURL, parse as parseLinkingUrl } from "expo-linking";
import { getWidgetInfo } from "react-native-android-widget";
import { trackEvent } from "../../lib/analytics";
import { useHomeNavigationIntentStore } from "../home/services/home-navigation-intent-store";
import { readDiscoveryState, writeDiscoveryState } from "./widget-discovery";
import { WIDGET_NAMES } from "./widgets";

// Widget ölçüm olayları: widget_added / widget_removed (kurulu widget adları
// widget-discovery-v1.installed ile karşılaştırılarak) + widget_opened (derin
// bağlantıda ?src=widget varsa, aynı URL için yalnızca bir kez).
// widget-discovery.tsx ile AYNI AsyncStorage anahtarını okur/yazar — oku
// birleştir yaz yapılır, `dismissed` alanı asla ezilmez.

async function diffInstalledWidgets(): Promise<void> {
  try {
    const results = await Promise.all(WIDGET_NAMES.map(async (name) => ({ name, infos: await getWidgetInfo(name) })));
    const nowInstalled: string[] = results.filter((r) => r.infos.length > 0).map((r) => r.name);

    const state = await readDiscoveryState();
    const previouslyInstalled = state.installed ?? [];

    const added = nowInstalled.filter((name) => !previouslyInstalled.includes(name));
    const removed = previouslyInstalled.filter((name) => !nowInstalled.includes(name));

    for (const widget of added) {
      void trackEvent("widget_added", { widget });
    }
    for (const widget of removed) {
      void trackEvent("widget_removed", { widget });
    }

    await writeDiscoveryState({ installed: nowInstalled });
  } catch {
    // Ölçüm asla uygulamayı düşürmemeli.
  }
}

function trackWidgetOpen(url: string | null): void {
  if (!url) {
    return;
  }
  try {
    const parsed = parseLinkingUrl(url);
    if (parsed.queryParams?.src !== "widget") {
      return;
    }
    if (parsed.queryParams?.paywall === "1") {
      useHomeNavigationIntentStore.getState().requestPaywall("widget");
    }
    const widget = typeof parsed.queryParams?.w === "string" ? parsed.queryParams.w : "unknown";
    void trackEvent("widget_opened", { widget, target: parsed.path ?? parsed.hostname ?? "unknown" });
  } catch {
    // Ayrıştırılamayan URL sessizce yok sayılır.
  }
}

export function useWidgetAnalytics(): void {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void diffInstalledWidgets();
    // Widget her dokunuşta AYNI URL'yi gönderir; useURL aynı değerde yeniden
    // tetiklenmediği için her açılışı saymak adına olay dinleyicisi kullanılır.
    void getInitialURL().then(trackWidgetOpen).catch(() => {});
    const urlSubscription = addEventListener("url", ({ url }) => trackWidgetOpen(url));

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void diffInstalledWidgets();
      }
    });

    return () => {
      subscription.remove();
      urlSubscription.remove();
    };
  }, []);
}
