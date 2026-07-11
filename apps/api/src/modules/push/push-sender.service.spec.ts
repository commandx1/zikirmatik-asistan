const sendPushNotificationsAsync = jest.fn();
const getPushNotificationReceiptsAsync = jest.fn();

jest.mock('expo-server-sdk', () => {
  class MockExpo {
    static isExpoPushToken(token: unknown) {
      return typeof token === 'string' && token.startsWith('ExponentPushToken');
    }

    chunkPushNotifications(messages: unknown[]) {
      return [messages];
    }

    chunkPushNotificationReceiptIds(ids: string[]) {
      return [ids];
    }

    sendPushNotificationsAsync(...args: unknown[]): unknown {
      return sendPushNotificationsAsync(...args) as unknown;
    }

    getPushNotificationReceiptsAsync(...args: unknown[]): unknown {
      return getPushNotificationReceiptsAsync(...args) as unknown;
    }
  }

  return { __esModule: true, default: MockExpo, Expo: MockExpo };
});

import { PushSenderService } from './push-sender.service';

describe('PushSenderService', () => {
  const devicesService = {
    deactivateByIds: jest.fn(),
  };

  let service: PushSenderService;

  beforeEach(() => {
    sendPushNotificationsAsync.mockReset();
    getPushNotificationReceiptsAsync.mockReset();
    devicesService.deactivateByIds.mockReset();
    devicesService.deactivateByIds.mockResolvedValue({ modifiedCount: 0 });

    service = new PushSenderService(devicesService as never);
  });

  it('skips targets with an invalid expo push token', async () => {
    sendPushNotificationsAsync.mockResolvedValue([]);

    const result = await service.sendToDevices(
      [{ deviceId: 'd1', expoPushToken: 'not-a-real-token' }],
      { title: 'Hi', body: 'Body' },
    );

    expect(sendPushNotificationsAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      sentCount: 0,
      skippedCount: 1,
      deactivatedDeviceIds: [],
    });
  });

  it('sends chunked messages and returns the ticket count', async () => {
    sendPushNotificationsAsync.mockResolvedValue([
      { status: 'ok', id: 'receipt-1' },
    ]);
    getPushNotificationReceiptsAsync.mockResolvedValue({
      'receipt-1': { status: 'ok' },
    });

    const result = await service.sendToDevices(
      [{ deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' }],
      { title: 'Hi', body: 'Body', data: { kind: 'streak' } },
    );

    expect(sendPushNotificationsAsync).toHaveBeenCalledWith([
      expect.objectContaining({
        to: 'ExponentPushToken[abc]',
        title: 'Hi',
        body: 'Body',
        data: { kind: 'streak' },
      }),
    ]);
    expect(result.sentCount).toBe(1);
    expect(result.deactivatedDeviceIds).toEqual([]);
    expect(devicesService.deactivateByIds).not.toHaveBeenCalled();
  });

  it('deactivates a device whose ticket reports DeviceNotRegistered', async () => {
    sendPushNotificationsAsync.mockResolvedValue([
      {
        status: 'error',
        message: 'not registered',
        details: { error: 'DeviceNotRegistered' },
      },
    ]);

    const result = await service.sendToDevices(
      [{ deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' }],
      { title: 'Hi', body: 'Body' },
    );

    expect(getPushNotificationReceiptsAsync).not.toHaveBeenCalled();
    expect(devicesService.deactivateByIds).toHaveBeenCalledWith(['d1']);
    expect(result.deactivatedDeviceIds).toEqual(['d1']);
  });

  it('deactivates a device whose receipt reports DeviceNotRegistered', async () => {
    sendPushNotificationsAsync.mockResolvedValue([
      { status: 'ok', id: 'receipt-1' },
    ]);
    getPushNotificationReceiptsAsync.mockResolvedValue({
      'receipt-1': {
        status: 'error',
        message: 'not registered',
        details: { error: 'DeviceNotRegistered' },
      },
    });

    const result = await service.sendToDevices(
      [{ deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' }],
      { title: 'Hi', body: 'Body' },
    );

    expect(devicesService.deactivateByIds).toHaveBeenCalledWith(['d1']);
    expect(result.deactivatedDeviceIds).toEqual(['d1']);
  });

  it('does not fail the send when the receipt lookup errors', async () => {
    sendPushNotificationsAsync.mockResolvedValue([
      { status: 'ok', id: 'receipt-1' },
    ]);
    getPushNotificationReceiptsAsync.mockRejectedValue(
      new Error('receipts not ready'),
    );

    const result = await service.sendToDevices(
      [{ deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' }],
      { title: 'Hi', body: 'Body' },
    );

    expect(result.sentCount).toBe(1);
    expect(result.deactivatedDeviceIds).toEqual([]);
  });
});
