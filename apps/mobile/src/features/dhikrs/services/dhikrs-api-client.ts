import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";
import type { LocalizedText } from "@zikirmatik/shared";

export type BackendDhikr = {
  _id: string;
  nameArabic: string;
  name: LocalizedText;
  transliteration: LocalizedText;
  meaning: LocalizedText;
  virtue?: LocalizedText;
  source?: LocalizedText;
  recommendedCount: number;
};

export const DhikrsApiError = ApiError;
export type DhikrsApiError = ApiError;

const errors = () => ({
  failed: i18n.t("dhikrs:errors.listFailed"),
  unreachable: i18n.t("dhikrs:errors.serverUnreachable")
});

export async function listVerifiedActiveDhikrs(): Promise<BackendDhikr[]> {
  return request<BackendDhikr[]>("/v1/dhikrs/verified-active", { emptyValue: [], errors: errors() });
}

export async function findVerifiedActiveDhikrByTransliteration(transliteration: string): Promise<BackendDhikr> {
  // emptyValue [] preserves the legacy shared `?? []` fallback of this file.
  return request<BackendDhikr>(`/v1/dhikrs/lookup?transliteration=${encodeURIComponent(transliteration)}`, {
    emptyValue: [] as unknown as BackendDhikr,
    errors: errors()
  });
}
