import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

export type DevicePrefs = {
  specialDays?: boolean;
  friday?: boolean;
  streak?: boolean;
  badges?: boolean;
};

export type RegisterDevicePayload = {
  deviceId: string;
  expoPushToken?: string;
  platform: "ios" | "android";
  prefs?: DevicePrefs;
};

export const DevicesApiError = ApiError;
export type DevicesApiError = ApiError;

const errors = () => ({
  failed: i18n.t("notifications:errors.registerFailed"),
  unreachable: i18n.t("notifications:errors.serverUnreachable")
});

// Public: works for guests too. When accessToken is provided the API links
// the device to that user; omit it to register/keep a guest device.
export async function registerDevice(
  payload: RegisterDevicePayload,
  accessToken?: string
): Promise<void> {
  // emptyValue: undefined preserves the legacy behavior of returning the raw
  // (possibly undefined) body instead of falling back to `{}`.
  await request<unknown>("/v1/devices/register", {
    method: "POST",
    body: payload,
    auth: accessToken ?? false,
    emptyValue: undefined,
    errors: errors()
  });
}

// Public: called right as the local session is torn down on logout, so it
// intentionally does not require a bearer token.
export async function unlinkDevice(deviceId: string): Promise<void> {
  await request<unknown>("/v1/devices/unlink", {
    method: "POST",
    body: { deviceId },
    emptyValue: undefined,
    errors: errors()
  });
}
