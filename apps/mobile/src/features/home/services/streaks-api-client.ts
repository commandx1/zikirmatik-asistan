import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

export type BackendStreak = {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActiveDate?: string;
};

export const StreaksApiError = ApiError;
export type StreaksApiError = ApiError;

export async function getUserStreak(userId: string): Promise<BackendStreak> {
  return request<BackendStreak>(`/v1/streaks/${userId}`, {
    method: "GET",
    auth: true,
    errors: {
      failed: i18n.t("home:streaksApi.fetchFailed"),
      unreachable: i18n.t("home:streaksApi.unreachable")
    }
  });
}
