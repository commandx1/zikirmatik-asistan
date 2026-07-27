import { Platform } from "react-native";
import { i18n } from "../../../i18n";
import type { LocalizedText } from "@zikirmatik/shared";

export type SpecialDayType = "kandil" | "ramazan" | "bayram" | "özel gün";

// API artık çok dilli ham içerik döner; okunur etiketler (dateLabel, badge,
// countdown metni, action başlık/CTA) mobil i18n katmanında üretilir.
export type SpecialDayCountdown = {
  days: number;
  hours: number;
  minutes: number;
};

export type BackendSpecialDayHomeItem = {
  id: string;
  name: LocalizedText;
  type: SpecialDayType;
  date: string;
  hijriDate: string;
  description?: LocalizedText;
  eventKey?: string;
  dayIndex?: number;
  dayCount?: number;
  hasSpecialFlow: boolean;
  themeTitle: LocalizedText;
  themeSummary: LocalizedText;
};

export type BackendSpecialDayHomeResponse = {
  referenceDate: string;
  hero:
    | (BackendSpecialDayHomeItem & {
        source: "today" | "upcoming";
        isToday: boolean;
        countdown: SpecialDayCountdown;
      })
    | null;
  action:
    | {
        specialDayId: string;
        name: LocalizedText;
        description?: LocalizedText;
      }
    | null;
  upcoming: Array<
    BackendSpecialDayHomeItem & {
      isToday: boolean;
      countdown: SpecialDayCountdown;
    }
  >;
};

export type SpecialDayPractice = {
  title: LocalizedText;
  description: LocalizedText;
};

// Zikir önerisi artık AI Rehber'de; detay yalnızca okuma içeriği döner.
// `article` ve `practices` editoryal olarak sonradan doldurulduğu için boş
// gelebilir — UI bu durumda ilgili kartı hiç göstermez.
export type BackendSpecialDayDetail = BackendSpecialDayHomeItem & {
  article?: LocalizedText;
  practices: SpecialDayPractice[];
};

export class SpecialDaysApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SpecialDaysApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function getSpecialDaysHome(
  date?: string,
  accessToken?: string
): Promise<BackendSpecialDayHomeResponse> {
  const params = new URLSearchParams();
  if (date) {
    params.set("date", date);
  }

  const query = params.toString();
  const path = query ? `/v1/special-days/home?${query}` : "/v1/special-days/home";
  return requestJson<BackendSpecialDayHomeResponse>(path, {
    method: "GET",
    accessToken,
  });
}

export async function getSpecialDayDetail(
  id: string,
  accessToken?: string
): Promise<BackendSpecialDayDetail> {
  return requestJson<BackendSpecialDayDetail>(`/v1/special-days/${id}/detail`, {
    method: "GET",
    accessToken,
  });
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

async function requestJson<TResponse>(
  path: string,
  options: { method: "GET"; accessToken?: string },
): Promise<TResponse> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (options.accessToken?.trim()) {
      headers.authorization = `Bearer ${options.accessToken.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("special-days:errors.fetchFailed"));
      throw new SpecialDaysApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof SpecialDaysApiError) {
      throw error;
    }

    throw new SpecialDaysApiError("transient", i18n.t("special-days:errors.serverUnreachable"));
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
