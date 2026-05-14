export type AuthProvider = 'apple' | 'google';
export type ClientPlatform = 'ios' | 'android';

export type AuthProviderVerifyResponse = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  displayName?: string;
  isNewUser: boolean;
};

export type RefreshTokenResponse = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  displayName?: string;
};
