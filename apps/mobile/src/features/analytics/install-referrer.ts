import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { trackEvent } from "../../lib/analytics";
import { INSTALL_REFERRER_SENT_KEY } from "../../lib/storage/keys";

const MAX_LEN = 100;

// Play install referrer'ı kurulum başına bir kez `install_referrer` olayı
// olarak yollar (ücretli/organik ayrımı için). Ham string ve gclid değeri
// ASLA gönderilmez. Hata = sessiz; bayrak set edilmez, sonraki soğuk
// açılışta tekrar denenir.
export async function captureInstallReferrer(): Promise<void> {
  try {
    if (Platform.OS !== "android") return;
    if (await AsyncStorage.getItem(INSTALL_REFERRER_SENT_KEY)) return;

    const params = new URLSearchParams(await Application.getInstallReferrerAsync());
    const props: Record<string, string | boolean> = { hasGclid: params.has("gclid") };
    for (const [prop, utm] of [["source", "utm_source"], ["medium", "utm_medium"], ["campaign", "utm_campaign"]] as const) {
      const value = params.get(utm);
      if (value) props[prop] = value.slice(0, MAX_LEN);
    }
    void trackEvent("install_referrer", props);
    await AsyncStorage.setItem(INSTALL_REFERRER_SENT_KEY, "1");
  } catch {
    // Play Store yok / emülatör vb.: yut.
  }
}
