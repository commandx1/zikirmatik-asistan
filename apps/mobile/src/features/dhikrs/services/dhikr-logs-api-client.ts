import { Platform } from "react-native";

export type BackendDhikrLog = {
  _id: string;
  userId: string;
  dhikrId: string;
  count: number;
  targetCount: number;
  date: string;
  isCompleted: boolean;
  createdAt?: string;
};

export type CreateDhikrLogPayload = {
  userId: string;
  dhikrId: string;
  count: number;
  targetCount: number;
  date: string;
  source?: "manual" | "ai" | "kandil" | "notification";
  isCompleted?: boolean;
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

export async function listDhikrLogsByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<BackendDhikrLog[]> {
  const params = new URLSearchParams({ userId });
  if (dateFrom) {
    params.set("dateFrom", dateFrom);
  }
  if (dateTo) {
    params.set("dateTo", dateTo);
  }

  return requestJson<BackendDhikrLog[]>(`/v1/dhikr-logs?${params.toString()}`, {
    method: "GET"
  });
}

export async function createDhikrLog(payload: CreateDhikrLogPayload): Promise<BackendDhikrLog> {
  return requestJson<BackendDhikrLog>("/v1/dhikr-logs", {
    method: "POST",
    body: payload
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
  options: { method: "GET" | "POST"; body?: unknown }
): Promise<TResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        "content-type": "application/json"
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, "Zikir log işlemi başarısız oldu.");
      throw new DhikrLogsApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof DhikrLogsApiError) {
      throw error;
    }

    throw new DhikrLogsApiError("transient", "Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
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
