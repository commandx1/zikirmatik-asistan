import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import { getOrCreateDeviceId } from "../features/notifications/services/push-device-registration";
import { useAuthStore } from "../store/auth-store";
import { ANALYTICS_QUEUE_KEY } from "./storage/keys";
import { API_BASE_URL } from "./env";

// Sıfır maliyetli, kendi API'mize yazan minimal ürün-olayı (analytics)
// istemcisi. Olayları bellek + AsyncStorage kuyruğunda tutar, en fazla
// 50'lik parçalar halinde POST /v1/events'e gönderir. Ağ/istek hataları asla
// throw etmez — analitik akışı uygulama akışını hiçbir zaman bozmamalı.

export type AnalyticsEventProps = Record<string, string | number | boolean>;

type QueuedAnalyticsEvent = {
  name: string;
  props?: AnalyticsEventProps;
  ts: string;
};

const MAX_QUEUE_SIZE = 200;
const MAX_BATCH_SIZE = 50;
const AUTO_FLUSH_THRESHOLD = 20;
const MIN_FLUSH_INTERVAL_MS = 30_000;

let memoryQueue: QueuedAnalyticsEvent[] = [];
let hydrationPromise: Promise<void> | null = null;
let isFlushing = false;
let lastFlushAttemptAt = 0;
let appStateSubscription: { remove: () => void } | null = null;

function isQueuedAnalyticsEvent(value: unknown): value is QueuedAnalyticsEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<QueuedAnalyticsEvent>;
  return typeof candidate.name === "string" && typeof candidate.ts === "string";
}

// Kuyruğu AsyncStorage'dan bir kez belleğe okur (önceki oturumdan kalan,
// henüz gönderilmemiş olaylar dahil). Sonraki çağrılar aynı promise'i
// paylaşır; bozuk/okunamayan veri boş kuyrukla devam eder.
async function ensureHydrated(): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
        if (!raw) {
          return;
        }
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryQueue = parsed.filter(isQueuedAnalyticsEvent).slice(-MAX_QUEUE_SIZE);
        }
      } catch {
        // Bozuk/erişilemeyen depolama: analitiği sonsuza kadar bloklamak
        // yerine boş kuyrukla devam et.
      }
    })();
  }

  return hydrationPromise;
}

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(memoryQueue));
  } catch {
    // Best effort: bellek kuyruğu bu oturumda flush için yine de yeterli.
  }
}

// Bir ürün olayını kuyruğa ekler (bellek + kalıcı AsyncStorage). Asla throw
// etmez. Kuyruk 200 olayı aşarsa en eski olay(lar) düşürülür. Kuyruk 20
// olaya ulaşınca otomatik flush tetiklenir (best-effort, beklenmez).
export async function trackEvent(name: string, props?: AnalyticsEventProps): Promise<void> {
  try {
    await ensureHydrated();

    memoryQueue.push({ name, props, ts: new Date().toISOString() });
    if (memoryQueue.length > MAX_QUEUE_SIZE) {
      memoryQueue = memoryQueue.slice(memoryQueue.length - MAX_QUEUE_SIZE);
    }

    await persistQueue();

    if (memoryQueue.length >= AUTO_FLUSH_THRESHOLD) {
      void flushEvents();
    }
  } catch (error) {
    console.warn("[analytics] trackEvent başarısız", error);
  }
}

// Kuyruktaki olayları en fazla 50'lik parçalar halinde POST /v1/events'e
// gönderir. Bir parça başarısız olursa kalan kuyruk (o parça dahil)
// korunur ve bir sonraki flush'ta tekrar denenir. Art arda çağrılarda 30
// saniye içinde tekrar ağ denemesi yapmaz. Asla throw etmez.
export async function flushEvents(): Promise<void> {
  try {
    await ensureHydrated();

    if (isFlushing || memoryQueue.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastFlushAttemptAt < MIN_FLUSH_INTERVAL_MS) {
      return;
    }

    isFlushing = true;
    lastFlushAttemptAt = now;

    try {
      while (memoryQueue.length > 0) {
        const batch = memoryQueue.slice(0, MAX_BATCH_SIZE);
        // Parçalar kasıtlı olarak sırayla (paralel değil) gönderilir: bir
        // parça başarısız olduğunda kuyruğu doğru noktada durdurabilmek için.
        const ok = await sendBatch(batch);
        if (!ok) {
          break;
        }
        memoryQueue = memoryQueue.slice(batch.length);
        await persistQueue();
      }
    } finally {
      isFlushing = false;
    }
  } catch (error) {
    console.warn("[analytics] flushEvents başarısız", error);
  }
}

async function sendBatch(batch: QueuedAnalyticsEvent[]): Promise<boolean> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const accessToken = useAuthStore.getState().session?.accessToken;

    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (accessToken?.trim()) {
      headers.authorization = `Bearer ${accessToken.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}/v1/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({ deviceId, events: batch })
    });

    return response.ok;
  } catch (error) {
    console.warn("[analytics] event gönderimi başarısız", error);
    return false;
  }
}

// Uygulama arka plana/inaktif duruma geçtiğinde kuyruğu flush eder. Kök
// layout'ta bir kez çağrılır (bkz. app/_layout.tsx). Yeniden çağrılırsa
// önceki dinleyiciyi kaldırıp yenisini kurar (çift kayıt olmaz).
export function initAnalytics(): void {
  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
    if (nextState === "background" || nextState === "inactive") {
      void flushEvents();
    }
  });
}
