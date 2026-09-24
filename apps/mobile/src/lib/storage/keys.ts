// Ad-hoc AsyncStorage keys (outside zustand persist). Changing a string here
// orphans data already on users' devices — treat these as a storage contract.
// Pure constants only: the headless widget task imports this module.

export const TAP_ANYWHERE_ENABLED_KEY = "tap-anywhere-enabled";
export const WIDGET_DISCOVERY_KEY = "widget-discovery-v1";
export const PUSH_DEVICE_ID_KEY = "push-device-id-v1";
export const PUSH_PERMISSION_PROMPTED_KEY = "push-permission-prompted-v1";
export const ANALYTICS_QUEUE_KEY = "analytics-queue-v1";

export const dailyEsmaWelcomeKey = (dateKey: string) => `daily-esma-welcome:${dateKey}`;
export const aiGuideLastKey = (userId: string) => `ai-guide:last:${userId}`;

// Raw keys the headless widget handler reads (persist names of the stores it
// needs + its own display state). Store `name`s must stay in sync with these.
export const WIDGET_STORAGE_KEYS = {
  dhikrStore: "dhikr-store-v1",
  virdStore: "vird-store-v1",
  circleStore: "circle-store-v1",
  profileStore: "profile-store-v1",
  themeStore: "theme-store-v1",
  widgetState: "widget-state-v1"
} as const;

// zustand persist name of the auth store; lives in SecureStore (see
// secure-session-storage.ts), migrated once from AsyncStorage.
export const AUTH_STORE_KEY = "auth-store-v2";

// AsyncStorage marker (see secure-session-storage.ts) used to detect a fresh
// install/reinstall, since Keychain survives uninstall but AsyncStorage doesn't.
export const SECURE_SESSION_INSTALL_MARKER = "secure-session-install-v1";
