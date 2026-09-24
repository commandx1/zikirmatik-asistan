import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { useAuthStore } from "../../../store/auth-store";
import { getUserById } from "../services/users-api-client";

// GET /users/:id için tek okuma noktası. İstemci açıkça verilir: kök sync
// hook'ları QueryClientProvider'ın ÜSTÜNDE (RootProviders) çalışır.
export function useBackendUser() {
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);

  return useQuery(
    {
      queryKey: qk.user(userId),
      queryFn: () => getUserById(userId as string),
      enabled: authStatus === "authenticated" && !!userId,
      staleTime: 60_000
    },
    queryClient
  );
}
