import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

export type BackendUserDhikr = {
  _id: string;
  userId: string;
  clientId: string;
  name: string;
  transliteration?: string;
  arabic?: string;
  meaning?: string;
  target: number;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserDhikrPayload = {
  clientId?: string;
  name?: string;
  transliteration?: string;
  arabic?: string;
  meaning?: string;
  target?: number;
  isFavorite?: boolean;
};

export type UpdateUserDhikrPayload = {
  name?: string;
  transliteration?: string;
  arabic?: string;
  meaning?: string;
  target?: number;
  isFavorite?: boolean;
};

export const UserDhikrsApiError = ApiError;
export type UserDhikrsApiError = ApiError;

const errors = () => ({
  failed: i18n.t("dhikrs:errors.actionFailed"),
  unreachable: i18n.t("dhikrs:errors.serverUnreachable")
});

function options(method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown) {
  return {
    method,
    body,
    auth: true as const,
    errors: errors()
  };
}

export async function listUserDhikrs(): Promise<BackendUserDhikr[]> {
  return request<BackendUserDhikr[]>("/v1/user-dhikrs", options("GET"));
}

export async function createUserDhikr(payload: CreateUserDhikrPayload): Promise<BackendUserDhikr> {
  return request<BackendUserDhikr>("/v1/user-dhikrs", options("POST", payload));
}

export async function updateUserDhikrByClientId(
  clientId: string,
  payload: UpdateUserDhikrPayload
): Promise<BackendUserDhikr> {
  return request<BackendUserDhikr>(
    `/v1/user-dhikrs/${encodeURIComponent(clientId)}`,
    options("PATCH", payload)
  );
}

export async function deleteUserDhikrByClientId(clientId: string): Promise<{ deleted: boolean; clientId: string }> {
  return request<{ deleted: boolean; clientId: string }>(
    `/v1/user-dhikrs/${encodeURIComponent(clientId)}`,
    options("DELETE")
  );
}
