import type {
  AuthProviderVerifyRequest,
  AuthProviderVerifyResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

// This file IS the refresh implementation, so it must never pass `auth: true`
// (that would recurse into client.ts's own refresh-and-retry flow) and must
// not import the auth-bridge/auth-store.
export const AuthApiError = ApiError;
export type AuthApiError = ApiError;

const errors = () => ({
  failed: i18n.t("auth:errors.requestFailed"),
  unreachable: i18n.t("auth:errors.serverUnreachable")
});

export async function verifyProvider(payload: AuthProviderVerifyRequest): Promise<AuthProviderVerifyResponse> {
  return request<AuthProviderVerifyResponse>("/v1/auth/provider/verify", {
    method: "POST",
    body: payload,
    emptyValue: {} as AuthProviderVerifyResponse,
    errors: errors()
  });
}

export async function refreshSession(payload: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return request<RefreshTokenResponse>("/v1/auth/refresh", {
    method: "POST",
    body: payload,
    emptyValue: {} as RefreshTokenResponse,
    errors: errors()
  });
}

/** Çıkışta refresh token'ı sunucuda iptal eder (Bearer gerekmez, idempotent 204). */
export async function logoutSession(payload: RefreshTokenRequest): Promise<void> {
  await request<unknown>("/v1/auth/logout", {
    method: "POST",
    body: payload,
    emptyValue: undefined,
    errors: errors()
  });
}
