import { Platform } from "react-native";

export type SpecialDayType = "kandil" | "ramazan" | "bayram" | "özel gün";

export type BackendSpecialDayHomeItem = {
  id: string;
  name: string;
  type: SpecialDayType;
  date: string;
  hijriDate: string;
  description?: string;
  eventKey?: string;
  dayIndex?: number;
  dayCount?: number;
  dateLabel: string;
  hasSpecialFlow: boolean;
  recommendedDhikrCount: number;
  themeTitle: string;
  themeSummary: string;
  isLocked: boolean;
};

export type BackendSpecialDayHomeResponse = {
  referenceDate: string;
  hero:
    | (BackendSpecialDayHomeItem & {
        source: "today" | "upcoming";
        badge: string;
        countdown: Array<{ value: string; label: string }>;
        remainingLabel: string;
      })
    | null;
  action:
    | {
        specialDayId: string;
        title: string;
        subtitle: string;
        ctaLabel: string;
        isLocked: boolean;
      }
    | null;
  upcoming: Array<
    BackendSpecialDayHomeItem & {
      remainingLabel: string;
    }
  >;
};

export type BackendSpecialDayDetail = BackendSpecialDayHomeItem & {
  recommendedDhikrs: Array<{
    id: string;
    nameTurkish: string;
    nameArabic: string;
    transliteration: string;
    meaning: string;
    recommendedCount: number;
    progressCount: number;
    progressTarget: number;
    isCompleted: boolean;
  }>;
  progress: {
    completedCount: number;
    totalCount: number;
    isCompleted: boolean;
  };
};

export type UpdateSpecialDayProgressPayload = {
  userId: string;
  dhikrId: string;
  completed?: boolean;
};

export type UpdateSpecialDayProgressResponse = {
  userId: string;
  specialDayId: string;
  completedDhikrIds: string[];
  completedCount: number;
  totalCount: number;
  isCompleted: boolean;
  completedAt?: string;
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
  userId?: string,
  accessToken?: string
): Promise<BackendSpecialDayHomeResponse> {
  const params = new URLSearchParams();
  if (date) {
    params.set("date", date);
  }
  if (userId) {
    params.set("userId", userId);
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
  userId?: string,
  accessToken?: string
): Promise<BackendSpecialDayDetail> {
  const params = new URLSearchParams();
  if (userId) {
    params.set("userId", userId);
  }

  const query = params.toString();
  const path = query ? `/v1/special-days/${id}/detail?${query}` : `/v1/special-days/${id}/detail`;
  return requestJson<BackendSpecialDayDetail>(path, {
    method: "GET",
    accessToken,
  });
}

export async function updateSpecialDayProgress(
  id: string,
  payload: UpdateSpecialDayProgressPayload,
  accessToken?: string
): Promise<UpdateSpecialDayProgressResponse> {
  return requestJson<UpdateSpecialDayProgressResponse>(`/v1/special-days/${id}/progress`, {
    method: "PATCH",
    body: payload,
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
  options: { method: "GET" | "PATCH"; body?: unknown; accessToken?: string },
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
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, "Özel gün verisi alınamadı.");
      throw new SpecialDaysApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof SpecialDaysApiError) {
      throw error;
    }

    throw new SpecialDaysApiError("transient", "Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
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
