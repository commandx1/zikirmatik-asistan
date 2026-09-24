import type { StatsSummary } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

export const StatsApiError = ApiError;
export type StatsApiError = ApiError;

export async function getStatsSummary(): Promise<StatsSummary> {
  return request<StatsSummary>("/v1/stats/summary", {
    method: "GET",
    auth: true,
    errors: {
      failed: i18n.t("stats:errors.fetchFailed"),
      unreachable: i18n.t("stats:errors.serverUnreachable")
    }
  });
}
