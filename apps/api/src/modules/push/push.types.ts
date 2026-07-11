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
  deactivatedDeviceIds: string[];
};
