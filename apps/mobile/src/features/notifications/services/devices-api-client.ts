import { Platform } from "react-native";

export type DevicePrefs = {
  specialDays?: boolean;
  friday?: boolean;
  streak?: boolean;
  badges?: boolean;
};

export type RegisterDevicePayload = {
  deviceId: string;
  expoPushToken?: string;
  platform: "ios" | "android";
  prefs?: DevicePrefs;
};

export class DevicesApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "DevicesApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

// Public: works for guests too. When accessToken is provided the API links
// the device to that user; omit it to register/keep a guest device.
export async function registerDevice(
  payload: RegisterDevicePayload,
  accessToken?: string
): Promise<void> {
  await requestJson("/v1/devices/register", payload, accessToken);
}

// Public: called right as the local session is torn down on logout, so it
// intentionally does not require a bearer token.
export async function unlinkDevice(deviceId: string): Promise<void> {
  await requestJson("/v1/devices/unlink", { deviceId });
}

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || "3000";
  const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return `http://${host}:${port}`;
}

async function requestJson(
  path: string,
  body: unknown,
  accessToken?: string
): Promise<unknown> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (accessToken?.trim()) {
      headers.authorization = `Bearer ${accessToken.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, "Cihaz kaydı yapılamadı.");
      throw new DevicesApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof DevicesApiError) {
      throw error;
    }

    throw new DevicesApiError("transient", "Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
  }
}

function safeParseJson(payload: string): unknown {
  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

function unwrapDataEnvelope(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    return payload;
  }

  return (payload as { data: unknown }).data;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { message?: unknown; error?: unknown };
  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  return fallback;
}
