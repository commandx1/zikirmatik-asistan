// Tek kaynak React Query anahtarları. Kullanıcıya özgü veriler userId'yi
// anahtarda taşır; böylece oturum değişince eski kullanıcının cache'i
// yenisine asla görünmez.
export const qk = {
  user: (userId: string | undefined) => ["user", userId] as const,
  aiCredits: () => ["ai", "credits"] as const,
  aiQuota: () => ["ai", "quota"] as const,
  dhikrCatalog: () => ["dhikrs", "catalog"] as const,
  userDhikrs: (userId: string | undefined) => ["dhikrs", "user", userId] as const,
  aiRecommendations: (userId: string | undefined) => ["ai", "recommendations", userId] as const,
  dhikrLogs: (userId: string | undefined) => ["dhikr-logs", userId] as const,
  streak: (userId: string | undefined) => ["streak", userId] as const,
  circles: (userId: string | undefined) => ["circles", userId] as const,
  circle: (id: string) => ["circle", id] as const,
  stats: (userId: string | undefined, period: string) => ["stats", userId, period] as const,
  specialDays: () => ["special-days"] as const,
  collections: () => ["collections"] as const
} as const;
