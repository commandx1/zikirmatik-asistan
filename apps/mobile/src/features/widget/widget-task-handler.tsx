import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestWidgetUpdate, type WidgetTaskHandlerProps } from "react-native-android-widget";
import { WIDGET_STORAGE_KEYS, buildWidgetSnapshot, type WidgetRawInput } from "./widget-snapshot";
import { WIDGET_NAMES, renderWidgetByName } from "./widgets";

// Headless task: uygulama kapalıyken de OS tarafından tetiklenebilir. Bu
// yüzden store'ları (auth-store -> api istemcisi/push/RevenueCat zincirini,
// dhikr-store -> i18n'i çeker), src/i18n'i, api istemcisini ve
// expo-notifications'ı İMPORT ETMEZ — yalnızca AsyncStorage'daki ham JSON
// string'lerini okuyup saf buildWidgetSnapshot'a verir. AĞ ÇAĞRISI YOK.
export async function readWidgetRaw(): Promise<WidgetRawInput> {
  try {
    const keys = Object.values(WIDGET_STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(keys);
    const byKey = new Map(pairs);
    return {
      dhikrStore: byKey.get(WIDGET_STORAGE_KEYS.dhikrStore) ?? null,
      virdStore: byKey.get(WIDGET_STORAGE_KEYS.virdStore) ?? null,
      circleStore: byKey.get(WIDGET_STORAGE_KEYS.circleStore) ?? null,
      profileStore: byKey.get(WIDGET_STORAGE_KEYS.profileStore) ?? null,
      themeStore: byKey.get(WIDGET_STORAGE_KEYS.themeStore) ?? null,
      widgetState: byKey.get(WIDGET_STORAGE_KEYS.widgetState) ?? null
    };
  } catch {
    return {
      dhikrStore: null,
      virdStore: null,
      circleStore: null,
      profileStore: null,
      themeStore: null,
      widgetState: null
    };
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (
    props.widgetAction !== "WIDGET_ADDED" &&
    props.widgetAction !== "WIDGET_UPDATE" &&
    props.widgetAction !== "WIDGET_RESIZED"
  ) {
    return;
  }

  const raw = await readWidgetRaw();
  const snapshot = buildWidgetSnapshot(raw, new Date());
  const widget = renderWidgetByName(props.widgetInfo.widgetName, snapshot);
  if (widget === null) {
    return;
  }

  props.renderWidget(widget);

  // Süreç soğukken sistem iki sağlayıcıya aynı anda APPWIDGET_UPDATE yollar;
  // New Architecture altında ikinci headless görev "CatalystInstance not
  // available" ile hiç koşmadan düşer (emülatör QA'sında doğrulandı) ve o
  // widget bayat kalır. Yarışı kazanan görev diğer widget'ları da tazeler.
  for (const otherName of WIDGET_NAMES) {
    if (otherName === props.widgetInfo.widgetName) {
      continue;
    }
    const other = renderWidgetByName(otherName, snapshot);
    if (other === null) {
      continue;
    }
    try {
      await requestWidgetUpdate({ widgetName: otherName, renderWidget: () => other, widgetNotFound: () => {} });
    } catch {
      // Diğer widget'ın tazelenememesi bu widget'ın çizimini etkilememeli.
    }
  }
}
