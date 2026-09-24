import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { listDhikrLogsByUser } from "./dhikr-logs-api-client";
import { listVerifiedActiveDhikrs } from "./dhikrs-api-client";
import { listUserDhikrs } from "./user-dhikrs-api-client";

// Doğrulanmış katalog yalnızca yönetim tarafında değişir → 6 çağıran 5 dk
// boyunca aynı yanıtı paylaşır.
const CATALOG_STALE_MS = 5 * 60_000;

export function fetchDhikrCatalog() {
  return queryClient.fetchQuery({
    queryKey: qk.dhikrCatalog(),
    queryFn: listVerifiedActiveDhikrs,
    staleTime: CATALOG_STALE_MS,
    retry: false
  });
}

// Kullanıcıya ait listeler başka yerlerde cache'e yansımadan yazılır →
// her çağrı taze fetch (staleTime 0); cache yalnızca tekilleştirir.
export function fetchUserDhikrs(userId: string | undefined) {
  return queryClient.fetchQuery({ queryKey: qk.userDhikrs(userId), queryFn: listUserDhikrs, staleTime: 0, retry: false });
}

export function dhikrLogsQueryFn(userId: string) {
  return () => listDhikrLogsByUser(userId);
}

export function fetchDhikrLogs(userId: string) {
  return queryClient.fetchQuery({
    queryKey: qk.dhikrLogs(userId),
    queryFn: dhikrLogsQueryFn(userId),
    staleTime: 0,
    retry: false
  });
}
