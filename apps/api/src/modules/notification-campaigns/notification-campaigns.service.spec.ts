// The service transitively imports push-sender.service.ts, which pulls in
// expo-server-sdk (ESM) — mock it out before the import chain is evaluated,
// mirroring push-sender.service.spec.ts.
jest.mock('expo-server-sdk', () => {
  class MockExpo {
    static isExpoPushToken(token: unknown) {
      return typeof token === 'string' && token.startsWith('ExponentPushToken');
    }
  }

  return { __esModule: true, default: MockExpo, Expo: MockExpo };
});

import { Types } from 'mongoose';
import {
  NotificationCampaignsService,
  addDaysToDateKey,
  getIstanbulParts,
  isInQuietHours,
} from './notification-campaigns.service';

describe('NotificationCampaignsService', () => {
  const dispatchModel = {
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  const specialDayModel = {
    find: jest.fn(),
  };
  const devicesService = {
    findActiveByPref: jest.fn(),
  };
  const pushSenderService = {
    sendToDevices: jest.fn(),
  };

  const specialDayId = new Types.ObjectId();

  // 2026-01-15T17:00:00Z === 2026-01-15 20:00 Istanbul (UTC+3).
  const eveAt2000Istanbul = new Date('2026-01-15T17:00:00Z');
  // 2026-01-16 is a Friday; 06:30Z === 09:30 Istanbul.
  const fridayAt0930Istanbul = new Date('2026-01-16T06:30:00Z');
  // 20:00Z === 23:00 Istanbul — inside quiet hours.
  const insideQuietHours = new Date('2026-01-15T20:00:00Z');

  let service: NotificationCampaignsService;

  const mockSpecialDaysFound = (days: unknown[]) => {
    specialDayModel.find.mockReturnValue({
      sort: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(days) }),
      }),
    });
  };

  beforeEach(() => {
    dispatchModel.create.mockReset();
    dispatchModel.updateOne.mockReset();
    dispatchModel.deleteOne.mockReset();
    specialDayModel.find.mockReset();
    devicesService.findActiveByPref.mockReset();
    pushSenderService.sendToDevices.mockReset();

    dispatchModel.create.mockResolvedValue({});
    dispatchModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    dispatchModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
    mockSpecialDaysFound([
      {
        _id: specialDayId,
        name: 'Berat Kandili',
        description: 'Bu gece Berat Kandili, bu duayı oku.',
        date: '2026-01-16',
        priority: 80,
      },
    ]);
    devicesService.findActiveByPref.mockResolvedValue([
      { deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' },
      { deviceId: 'd2', expoPushToken: undefined },
    ]);
    pushSenderService.sendToDevices.mockResolvedValue({
      sentCount: 1,
      skippedCount: 0,
      ticketErrorCount: 0,
      deactivatedDeviceIds: [],
    });

    service = new NotificationCampaignsService(
      dispatchModel as never,
      specialDayModel as never,
      devicesService as never,
      pushSenderService as never,
    );
  });

  describe('runSpecialDayEveCampaign', () => {
    it('queries the eve+1 date (tomorrow in Istanbul) and sends the push', async () => {
      const result = await service.runSpecialDayEveCampaign(eveAt2000Istanbul);

      expect(specialDayModel.find).toHaveBeenCalledWith({
        isActive: true,
        date: '2026-01-16',
      });
      expect(devicesService.findActiveByPref).toHaveBeenCalledWith(
        'specialDays',
      );
      expect(pushSenderService.sendToDevices).toHaveBeenCalledWith(
        [{ deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' }],
        expect.objectContaining({
          title: 'Bu Gece Berat Kandili 🌙',
          data: { route: `/special-days/${specialDayId.toString()}` },
        }),
      );
      expect(result).toEqual({ status: 'sent', sentCount: 1 });
    });

    it('claims the dedup key with the eve date before sending', async () => {
      await service.runSpecialDayEveCampaign(eveAt2000Istanbul);

      expect(dispatchModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'special-day:2026-01-15',
          type: 'special-day',
        }),
      );
    });

    it('does nothing when tomorrow is not a special day', async () => {
      mockSpecialDaysFound([]);

      const result = await service.runSpecialDayEveCampaign(eveAt2000Istanbul);

      expect(dispatchModel.create).not.toHaveBeenCalled();
      expect(pushSenderService.sendToDevices).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'no-special-day' });
    });

    it('skips sending when the campaign was already dispatched (duplicate key)', async () => {
      dispatchModel.create.mockRejectedValue({ code: 11000 });

      const result = await service.runSpecialDayEveCampaign(eveAt2000Istanbul);

      expect(pushSenderService.sendToDevices).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'already-sent' });
    });

    it('never dispatches inside quiet hours (22:00–09:00 Istanbul)', async () => {
      const result = await service.runSpecialDayEveCampaign(insideQuietHours);

      expect(specialDayModel.find).not.toHaveBeenCalled();
      expect(dispatchModel.create).not.toHaveBeenCalled();
      expect(pushSenderService.sendToDevices).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'quiet-hours' });
    });

    it('releases the claim when there are no targets, so a retry is possible', async () => {
      devicesService.findActiveByPref.mockResolvedValue([]);

      const result = await service.runSpecialDayEveCampaign(eveAt2000Istanbul);

      expect(dispatchModel.create).toHaveBeenCalled();
      expect(pushSenderService.sendToDevices).not.toHaveBeenCalled();
      expect(dispatchModel.deleteOne).toHaveBeenCalledWith({
        key: 'special-day:2026-01-15',
      });
      expect(result).toEqual({ status: 'no-targets', sentCount: 0 });
    });

    it('releases the claim when the send throws, so the next run can retry', async () => {
      pushSenderService.sendToDevices.mockRejectedValue(
        new Error('expo unreachable'),
      );

      await expect(
        service.runSpecialDayEveCampaign(eveAt2000Istanbul),
      ).rejects.toThrow('expo unreachable');

      expect(dispatchModel.deleteOne).toHaveBeenCalledWith({
        key: 'special-day:2026-01-15',
      });
      expect(dispatchModel.updateOne).not.toHaveBeenCalled();
    });

    it('records the dispatch result on the claim row after sending', async () => {
      await service.runSpecialDayEveCampaign(eveAt2000Istanbul);

      expect(dispatchModel.updateOne).toHaveBeenCalledWith(
        { key: 'special-day:2026-01-15' },
        {
          $set: {
            result: expect.objectContaining({
              targetCount: 1,
              sentCount: 1,
              ticketErrorCount: 0,
            }),
          },
        },
      );
    });
  });

  describe('runFridayCampaign', () => {
    it('sends the Friday reminder to devices with the friday pref', async () => {
      const result = await service.runFridayCampaign(fridayAt0930Istanbul);

      expect(dispatchModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'friday:2026-01-16', type: 'friday' }),
      );
      expect(devicesService.findActiveByPref).toHaveBeenCalledWith('friday');
      expect(pushSenderService.sendToDevices).toHaveBeenCalledWith(
        [{ deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' }],
        expect.objectContaining({
          data: { route: '/(tabs)/special-days' },
        }),
      );
      expect(result).toEqual({ status: 'sent', sentCount: 1 });
    });

    it('skips when already dispatched for this Friday', async () => {
      dispatchModel.create.mockRejectedValue({ code: 11000 });

      const result = await service.runFridayCampaign(fridayAt0930Istanbul);

      expect(pushSenderService.sendToDevices).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'already-sent' });
    });

    it('never dispatches inside quiet hours', async () => {
      const result = await service.runFridayCampaign(insideQuietHours);

      expect(dispatchModel.create).not.toHaveBeenCalled();
      expect(pushSenderService.sendToDevices).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'quiet-hours' });
    });
  });
});

describe('getIstanbulParts', () => {
  it('converts UTC instants to Istanbul wall-clock parts', () => {
    expect(getIstanbulParts(new Date('2026-01-15T17:00:00Z'))).toEqual({
      dateKey: '2026-01-15',
      hour: 20,
      minute: 0,
      weekday: 'Thu',
    });
    // 22:30Z rolls over to the next Istanbul calendar day (01:30).
    expect(getIstanbulParts(new Date('2026-01-15T22:30:00Z'))).toEqual({
      dateKey: '2026-01-16',
      hour: 1,
      minute: 30,
      weekday: 'Fri',
    });
  });
});

describe('addDaysToDateKey', () => {
  it('adds calendar days, crossing month and year boundaries', () => {
    expect(addDaysToDateKey('2026-01-15', 1)).toBe('2026-01-16');
    expect(addDaysToDateKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToDateKey('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('isInQuietHours', () => {
  it('blocks 22:00–09:00 and allows 09:00–22:00', () => {
    expect(isInQuietHours(22)).toBe(true);
    expect(isInQuietHours(23)).toBe(true);
    expect(isInQuietHours(0)).toBe(true);
    expect(isInQuietHours(8)).toBe(true);
    expect(isInQuietHours(9)).toBe(false);
    expect(isInQuietHours(20)).toBe(false);
    expect(isInQuietHours(21)).toBe(false);
  });
});
