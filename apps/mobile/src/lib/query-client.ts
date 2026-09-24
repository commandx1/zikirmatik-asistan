import { QueryClient } from "@tanstack/react-query";

// Modül tekili: kök layout'un QueryClientProvider'ı ve hook olmayan kod
// (sync hook'ları, servisler) aynı cache'i paylaşır.
// RN'de pencere odağı yok → refetchOnWindowFocus kapalı; staleTime 0 ilk
// mount'ta bugünkü gibi hemen fetch eder.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 0 }
  }
});
