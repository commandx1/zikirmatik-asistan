export type Dhikr = {
  id: string;
  nameArabic: string;
  nameTurkish: string;
  transliteration: string;
  meaning: string;
  source: string;
  tags: string[];
  recommendedCount: number;
};

export type DhikrLog = {
  id: string;
  userId: string;
  dhikrId: string;
  count: number;
  targetCount: number;
  date: string;
  isCompleted: boolean;
};

export type AiRecommendation = {
  id: string;
  reason: string;
  dhikrId: string;
  confidence: number;
};

export type SpecialDay = {
  id: string;
  title: string;
  startsAtIso: string;
  category: "kandil" | "ramazan" | "cuma" | "bayram";
  featuredDhikrIds: string[];
};

export type AuthProvider = "apple" | "google";
export type ClientPlatform = "ios" | "android";

export type AuthProviderVerifyRequest = {
  provider: AuthProvider;
  idToken: string;
  platform: ClientPlatform;
  deviceId: string;
};

export type AuthSession = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  displayName?: string;
  isNewUser: boolean;
};

export type AuthProviderVerifyResponse = AuthSession;

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = Omit<AuthSession, "isNewUser">;
