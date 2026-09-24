import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { getAiCredits, getAiDailyQuota, listAiRecommendations } from "../../ai-guide/services/ai-api-client";

// Kredi/kota harcama kararından hemen önce okunur → her çağrı taze fetch
// (staleTime 0); cache yalnızca eşzamanlı çağrıları tekilleştirir.
// retry:false — bugünkü gibi hata doğrudan çağıranın fallback'ine düşer.
export function fetchAiCredits() {
  return queryClient.fetchQuery({ queryKey: qk.aiCredits(), queryFn: getAiCredits, staleTime: 0, retry: false });
}

export function fetchAiQuota() {
  return queryClient.fetchQuery({ queryKey: qk.aiQuota(), queryFn: getAiDailyQuota, staleTime: 0, retry: false });
}

export function fetchAiRecommendations(userId: string) {
  return queryClient.fetchQuery({
    queryKey: qk.aiRecommendations(userId),
    queryFn: listAiRecommendations,
    staleTime: 0,
    retry: false
  });
}
