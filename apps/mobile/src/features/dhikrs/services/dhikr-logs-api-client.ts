import { Platform } from "react-native";
import { i18n } from "../../../i18n";

export type BackendDhikrLog = {
  _id: string;
  userId: string;
  dhikrId?: string;
  customDhikrId?: string;
  customDhikrName?: string;
  customDhikrArabic?: string;
  count: number;
  targetCount: number;
  date: string;
  source?: "manual" | "ai" | "special-day" | "notification";
  aiRecommendationId?: string;
  aiPrompt?: string;
  aiAssistantNote?: string;
  isCompleted: boolean;
  isFavorite?: boolean;
  createdAt?: string;
};

export type CreateDhikrLogPayload = {
  userId: string;
  dhikrId?: string;
  customDhikrId?: string;
  customDhikrName?: string;
  customDhikrArabic?: string;
  aiRecommendationId?: string;
  aiPrompt?: string;
  aiAssistantNote?: string;
  count: number;
  targetCount: number;
  date: string;
  source?: "manual" | "ai" | "special-day" | "notification";
  isCompleted?: boolean;
  isFavorite?: boolean;
};

export class DhikrLogsApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "DhikrLogsApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function listDhikrLogsByUser(
  userId: string,
  dateFrom?: string,
  dateTo?: string,
  accessToken?: string
): Promise<BackendDhikrLog[]> {
  const params = new URLSearchParams({ userId });
  if (dateFrom) {
    params.set("dateFrom", dateFrom);
  }
  if (dateTo) {
    params.set("dateTo", dateTo);
  }

  return requestJson<BackendDhikrLog[]>(`/v1/dhikr-logs?${params.toString()}`, {
    method: "GET",
    accessToken
  });
}

export async function createDhikrLog(
  payload: CreateDhikrLogPayload,
  accessToken?: string
): Promise<BackendDhikrLog> {
  return requestJson<BackendDhikrLog>("/v1/dhikr-logs", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export async function deleteDhikrLogsByKey(
  payload: { dhikrId?: string; customDhikrId?: string },
  accessToken?: string
): Promise<{ deleted: boolean; deletedCount: number }> {
  const params = new URLSearchParams();
  if (payload.dhikrId?.trim()) {
    params.set("dhikrId", payload.dhikrId.trim());
  }
  if (payload.customDhikrId?.trim()) {
    params.set("customDhikrId", payload.customDhikrId.trim());
  }

  return requestJson<{ deleted: boolean; deletedCount: number }>(
    `/v1/dhikr-logs/by-dhikr?${params.toString()}`,
    {
      method: "DELETE",
      accessToken
    }
  );
}

export async function setDhikrFavoriteByKey(
  payload: { dhikrId?: string; customDhikrId?: string; isFavorite: boolean },
  accessToken?: string
): Promise<{ updated: boolean; matchedCount: number; modifiedCount: number; isFavorite: boolean }> {
  return requestJson<{ updated: boolean; matchedCount: number; modifiedCount: number; isFavorite: boolean }>(
    "/v1/dhikr-logs/favorite/by-dhikr",
    {
      method: "PATCH",
      body: payload,
      accessToken
    }
  );
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
  options: { method: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; accessToken?: string }
): Promise<TResponse> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (options.accessToken?.trim()) {
      headers.authorization = `Bearer ${options.accessToken.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("dhikrs:errors.logActionFailed"));
      throw new DhikrLogsApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof DhikrLogsApiError) {
      throw error;
    }

    throw new DhikrLogsApiError("transient", i18n.t("dhikrs:errors.serverUnreachable"));
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
