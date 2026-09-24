import { i18n } from "../../../i18n";
import type { LocalizedText } from "@zikirmatik/shared";
import { ApiError, request } from "../../../lib/http/client";

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

export const SpecialDaysApiError = ApiError;
export type SpecialDaysApiError = ApiError;

const errors = () => ({
  failed: i18n.t("special-days:errors.fetchFailed"),
  unreachable: i18n.t("special-days:errors.serverUnreachable")
});

export async function getSpecialDaysHome(date?: string): Promise<BackendSpecialDayHomeResponse> {
  const params = new URLSearchParams();
  if (date) {
    params.set("date", date);
  }

  const query = params.toString();
  const path = query ? `/v1/special-days/home?${query}` : "/v1/special-days/home";
  return request<BackendSpecialDayHomeResponse>(path, {
    method: "GET",
    auth: true,
    errors: errors()
  });
}

export async function getSpecialDayDetail(id: string): Promise<BackendSpecialDayDetail> {
  return request<BackendSpecialDayDetail>(`/v1/special-days/${id}/detail`, {
    method: "GET",
    auth: true,
    errors: errors()
  });
}
