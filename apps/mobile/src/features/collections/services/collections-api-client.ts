import { i18n } from "../../../i18n";
import type { LocalizedText } from "@zikirmatik/shared";
import { ApiError, request } from "../../../lib/http/client";

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
  label: LocalizedText;
  description?: LocalizedText;
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
  timeOfDay?: string[] | string;
};

export type BackendCollectionDetail = BackendCollection & {
  dhikrs: BackendCollectionDhikr[];
};

export const CollectionsApiError = ApiError;
export type CollectionsApiError = ApiError;

const errors = () => ({
  failed: i18n.t("collections:errors.fetchFailed"),
  unreachable: i18n.t("collections:errors.serverUnreachable")
});

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
  return request<BackendCollection[]>(path, { emptyValue: [], errors: errors() });
}

export async function getCollectionDetail(
  key: string,
): Promise<BackendCollectionDetail> {
  return request<BackendCollectionDetail>(`/v1/dhikr-collections/${key}`, {
    emptyValue: [] as unknown as BackendCollectionDetail,
    errors: errors()
  });
}
