export type PushTarget = {
  deviceId: string;
  expoPushToken: string;
};

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type PushSendResult = {
  sentCount: number;
  skippedCount: number;
  // Tickets Expo returned with status "error" (includes whole chunks that
  // failed to send). Surfaced so campaign dispatch records can persist it.
  ticketErrorCount: number;
  deactivatedDeviceIds: string[];
};
