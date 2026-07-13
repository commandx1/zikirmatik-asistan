import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { Device, type DeviceDocument } from './schemas/device.schema';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  // Upserts by deviceId. When called with a valid userId (request carried a
  // bearer token), the device is linked to that user; guest calls leave any
  // existing link untouched instead of unsetting it.
  async register(payload: RegisterDeviceDto, userId?: string) {
    const set: Record<string, unknown> = {
      platform: payload.platform,
      lastSeenAt: new Date(),
      isActive: true,
    };

    if (payload.expoPushToken) {
      set.expoPushToken = payload.expoPushToken;
    }

    if (userId && Types.ObjectId.isValid(userId)) {
      set.userId = new Types.ObjectId(userId);
    }

    const setOnInsert: Record<string, unknown> = {
      deviceId: payload.deviceId,
      userId: userId && Types.ObjectId.isValid(userId) ? undefined : null,
    };

    // Mongo rejects a single update that targets both the whole `prefs` path
    // ($setOnInsert) and a `prefs.<key>` subpath ($set) — "would create a
    // conflict at 'prefs'". Each pref key must go to exactly one operator:
    // provided keys to $set (applies on both insert and update), defaults
    // for the rest to $setOnInsert (insert only), both via dotted paths.
    const prefDefaults = {
      specialDays: true,
      friday: true,
      streak: true,
      badges: true,
    } as const;
    for (const key of Object.keys(prefDefaults) as Array<
      keyof typeof prefDefaults
    >) {
      const value = payload.prefs?.[key];
      if (value !== undefined) {
        set[`prefs.${key}`] = value;
      } else {
        setOnInsert[`prefs.${key}`] = prefDefaults[key];
      }
    }

    const updated = await this.deviceModel
      .findOneAndUpdate(
        { deviceId: payload.deviceId },
        {
          $set: set,
          $setOnInsert: setOnInsert,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean()
      .exec();

    return updated;
  }

  // Called on login: associates the device that authenticated with the
  // signed-in user, regardless of any previous (or missing) link.
  async linkUser(deviceId: string, userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.deviceModel
      .findOneAndUpdate(
        { deviceId },
        {
          $set: { userId: new Types.ObjectId(userId), lastSeenAt: new Date() },
        },
        { new: true },
      )
      .lean()
      .exec();
  }

  // Called on logout: unlinks the device from the user without deleting it,
  // so guests keep receiving pushes after signing out.
  async unlinkUser(deviceId: string) {
    return this.deviceModel
      .findOneAndUpdate({ deviceId }, { $set: { userId: null } }, { new: true })
      .lean()
      .exec();
  }

  async findActiveByIds(deviceIds: string[]) {
    if (deviceIds.length === 0) {
      return [];
    }

    return this.deviceModel
      .find({ deviceId: { $in: deviceIds }, isActive: true })
      .lean()
      .exec();
  }

  async findActiveByUserIds(userIds: string[]) {
    const objectIds = userIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return [];
    }

    return this.deviceModel
      .find({ userId: { $in: objectIds }, isActive: true })
      .lean()
      .exec();
  }

  // Campaign targeting: all active devices (guests included) that opted in
  // to the given notification preference and still carry a push token.
  async findActiveByPref(pref: 'specialDays' | 'friday') {
    return this.deviceModel
      .find({
        isActive: true,
        [`prefs.${pref}`]: true,
        expoPushToken: { $exists: true, $nin: [null, ''] },
      })
      .lean()
      .exec();
  }

  // Used by the push sender after Expo reports DeviceNotRegistered — the
  // token is stale (uninstalled app, revoked permission, etc).
  async deactivateByIds(deviceIds: string[]) {
    if (deviceIds.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await this.deviceModel
      .updateMany(
        { deviceId: { $in: deviceIds } },
        { $set: { isActive: false }, $unset: { expoPushToken: '' } },
      )
      .exec();

    return { modifiedCount: result.modifiedCount ?? 0 };
  }
}
