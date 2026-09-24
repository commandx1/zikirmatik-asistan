import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { getUserStreak } from "../../home/services/streaks-api-client";

// Kullanıcının serisi başka yerlerde cache'e yazılmadan okunur → her çağrı
// taze fetch (staleTime 0); cache yalnızca aynı anda gelen çağrıları tekilleştirir.
export function fetchUserStreak(userId: string) {
  return queryClient.fetchQuery({
    queryKey: qk.streak(userId),
    queryFn: () => getUserStreak(userId),
    staleTime: 0,
    retry: false
  });
}
