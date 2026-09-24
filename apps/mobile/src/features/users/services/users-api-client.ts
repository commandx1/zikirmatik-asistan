import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";
import type { HapticsPattern } from "../../../services/haptics-pattern";

type UserNotifSettings = {
  dailyReminder?: boolean;
  reminderTime?: string;
  kandilNotifications?: boolean;
};

export type BackendUser = {
  _id: string;
  displayName?: string;
  profileImageUrl?: string;
  theme?: string;
  fontFamily?: "default" | "merriweather" | "intel-one-mono" | "finlandica-headline" | "indie-flower";
  hapticsEnabled?: boolean;
  hapticsPattern?: HapticsPattern;
  isPremium?: boolean;
  createdAt?: string;
  onboarding?: {
    purpose?: string;
    completedAt?: string;
  };
  notifSettings?: UserNotifSettings;
};

export type UpdateOnboardingPayload = {
  purpose?: string;
};

export type UpdateUserPreferencesPayload = {
  theme?: string;
  fontFamily?: "default" | "merriweather" | "intel-one-mono" | "finlandica-headline" | "indie-flower";
  hapticsEnabled?: boolean;
  hapticsPattern?: HapticsPattern;
  dailyReminder?: boolean;
  reminderTime?: string;
};

export const UsersApiError = ApiError;
export type UsersApiError = ApiError;

// The API can cold-start, so requests need an upper bound instead of hanging forever.
const REQUEST_TIMEOUT_MS = 20_000;

function options(method: "GET" | "PATCH" | "DELETE", accessToken: string | undefined, body?: unknown) {
  return {
    method,
    body,
    auth: accessToken ?? false,
    timeoutMs: REQUEST_TIMEOUT_MS,
    errors: {
      failed: i18n.t("users:errors.fetchFailed"),
      unreachable: i18n.t("users:errors.serverUnreachable")
    }
  };
}

export async function getUserById(userId: string, accessToken?: string): Promise<BackendUser> {
  return request<BackendUser>(`/v1/users/${userId}`, options("GET", accessToken));
}

export async function saveUserOnboarding(
  userId: string,
  payload: UpdateOnboardingPayload,
  accessToken?: string
): Promise<BackendUser> {
  return request<BackendUser>(`/v1/users/${userId}/onboarding`, options("PATCH", accessToken, payload));
}

export async function saveUserPreferences(
  userId: string,
  payload: UpdateUserPreferencesPayload,
  accessToken?: string
): Promise<BackendUser> {
  return request<BackendUser>(`/v1/users/${userId}/preferences`, options("PATCH", accessToken, payload));
}

export async function deleteUser(userId: string, accessToken?: string): Promise<void> {
  await request<unknown>(`/v1/users/${userId}`, options("DELETE", accessToken));
}
