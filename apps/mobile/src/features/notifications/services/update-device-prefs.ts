import { registerDevice, type DevicePrefs } from "./devices-api-client";
import { getOrCreateDeviceId, resolvePlatform } from "./push-device-registration";

// Push-campaign preference toggles (special days, Friday) are device-scoped,
// not user-scoped: they work for guests too. Reuses the same
// /v1/devices/register upsert the app already calls on every start — the
// backend only $sets the prefs keys that are present, so this never
// clobbers the push token or platform already stored for this device.
export async function updateDevicePrefs(prefs: DevicePrefs, accessToken?: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  await registerDevice({ deviceId, platform: resolvePlatform(), prefs }, accessToken);
}
