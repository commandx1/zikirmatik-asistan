import { Platform } from "react-native";
import { i18n } from "../../../i18n";
import type { LocalizedText } from "@zikirmatik/shared";

export type CollectionCategory =
  | "gunluk"
  | "namaz"
  | "koruma"
  | "dua"
  | "hayat"
  | "ibadet";

export type BackendCollection = {
  _id: string;
  key: string;
  label: string;
  description?: string;
  category: CollectionCategory;
  dhikrCount: number;
};

export type BackendCollectionDhikr = {
  _id: string;
  key?: string;
  nameArabic: string;
  name: LocalizedText;
  transliteration: LocalizedText;
  meaning: LocalizedText;
  virtue?: LocalizedText;
  source?: LocalizedText;
  recommendedCount: number;
  timeOfDay?: string;
};

export type BackendCollectionDetail = BackendCollection & {
  dhikrs: BackendCollectionDhikr[];
};

export class CollectionsApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "CollectionsApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function listCollections(
  category?: CollectionCategory,
): Promise<BackendCollection[]> {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }

  const query = params.toString();
  const path = query
    ? `/v1/dhikr-collections?${query}`
    : "/v1/dhikr-collections";
  return requestJson<BackendCollection[]>(path);
}

export async function getCollectionDetail(
  key: string,
): Promise<BackendCollectionDetail> {
  return requestJson<BackendCollectionDetail>(`/v1/dhikr-collections/${key}`);
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

async function requestJson<TResponse>(path: string): Promise<TResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("collections:errors.fetchFailed"));
      throw new CollectionsApiError(
        response.status >= 500 ? "transient" : "terminal",
        message,
        response.status,
      );
    }

    return (data ?? []) as TResponse;
  } catch (error) {
    if (error instanceof CollectionsApiError) {
      throw error;
    }

    throw new CollectionsApiError(
      "transient",
      i18n.t("collections:errors.serverUnreachable"),
    );
  }
}

function safeParseJson(payload: string): unknown {
  if (!payload) return undefined;
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
  if (typeof payload === "string" && payload.trim()) return payload;
  if (!payload || typeof payload !== "object") return fallback;
  const c = payload as { message?: unknown; error?: unknown };
  if (typeof c.message === "string" && c.message.trim()) return c.message;
  if (typeof c.error === "string" && c.error.trim()) return c.error;
  return fallback;
}
