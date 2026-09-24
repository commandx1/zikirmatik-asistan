import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { fetchCircles } from "./circle-api-client";

// use-circle-sync.ts (arka plan senkronu) ve circle-hub-screen.tsx (odak
// tazelemesi) aynı listeyi çeker — tek anahtar (qk.circles) üzerinden
// tekilleştirilir (staleTime 0: her çağrı taze fetch, cache yalnız dedupe eder).
export function fetchCirclesForUser(userId: string | undefined) {
  return queryClient.fetchQuery({
    queryKey: qk.circles(userId),
    queryFn: fetchCircles,
    staleTime: 0,
    retry: false
  });
}
