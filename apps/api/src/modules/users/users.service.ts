import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { User, type UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(payload: CreateUserDto) {
    const normalizedEmail = payload.email?.trim().toLowerCase();

    if (normalizedEmail) {
      const existing = await this.userModel.exists({ email: normalizedEmail });
      if (existing) {
        throw new ConflictException(
          'Bu e-posta ile kayıtlı bir kullanıcı zaten var.',
        );
      }
    }

    const created = await this.userModel.create({
      ...payload,
      email: normalizedEmail,
      isPremium: false,
      lastSeenAt: new Date(),
    });

    return this.toPublic(created.toObject());
  }

  async getUserById(userId: string) {
    const user = await this.userModel
      .findById(this.asObjectId(userId))
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    return this.toPublic(user);
  }

  async saveOnboarding(userId: string, payload: UpdateOnboardingDto) {
    const now = new Date();
    const user = await this.userModel
      .findByIdAndUpdate(
        this.asObjectId(userId),
        {
          $set: {
            ...(payload.city ? { city: payload.city } : {}),
            onboarding: {
              ...payload,
              completedAt: now,
            },
            lastSeenAt: now,
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(
        'Onboarding kaydı için kullanıcı bulunamadı.',
      );
    }

    return this.toPublic(user);
  }

  async savePreferences(userId: string, payload: UpdateUserPreferencesDto) {
    const now = new Date();
    const notifSettingsUpdates: Record<string, unknown> = {};
    if (typeof payload.dailyReminder === 'boolean') {
      notifSettingsUpdates['notifSettings.dailyReminder'] =
        payload.dailyReminder;
    }
    if (typeof payload.reminderTime === 'string') {
      notifSettingsUpdates['notifSettings.reminderTime'] = payload.reminderTime;
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        this.asObjectId(userId),
        {
          $set: {
            ...(typeof payload.theme === 'string'
              ? { theme: payload.theme }
              : {}),
            ...(payload.fontFamily ? { fontFamily: payload.fontFamily } : {}),
            ...(typeof payload.hapticsEnabled === 'boolean'
              ? { hapticsEnabled: payload.hapticsEnabled }
              : {}),
            ...notifSettingsUpdates,
            lastSeenAt: now,
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(
        'Tercih güncellemesi için kullanıcı bulunamadı.',
      );
    }

    return this.toPublic(user);
  }

  async findOrCreateFromAuth(input: {
    provider: 'google' | 'apple' | 'email';
    email?: string;
    displayName?: string;
    profileImageUrl?: string;
  }) {
    const normalizedEmail = input.email?.trim().toLowerCase();
    const now = new Date();

    if (normalizedEmail) {
      const existing = await this.userModel
        .findOne({ email: normalizedEmail })
        .exec();
      if (existing) {
        existing.lastSeenAt = now;
        if (!existing.displayName && input.displayName) {
          existing.displayName = input.displayName;
        }
        if (input.profileImageUrl) {
          existing.profileImageUrl = input.profileImageUrl;
        }
        existing.authProvider = input.provider;
        await existing.save();
        return existing;
      }
    }

    return this.userModel.create({
      email: normalizedEmail,
      displayName: input.displayName ?? 'Misafir Kullanıcı',
      profileImageUrl: input.profileImageUrl,
      authProvider: input.provider,
      isPremium: false,
      lastSeenAt: now,
    });
  }

  async touchAuthUser(
    userId: string,
    updates?: {
      displayName?: string;
      profileImageUrl?: string;
    },
  ) {
    const existing = await this.userModel
      .findById(this.asObjectId(userId))
      .select({
        _id: 1,
        displayName: 1,
        email: 1,
        profileImageUrl: 1,
        lastSeenAt: 1,
      })
      .exec();
    if (!existing) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    existing.lastSeenAt = new Date();
    if (!existing.displayName && updates?.displayName) {
      existing.displayName = updates.displayName;
    }
    if (updates?.profileImageUrl) {
      existing.profileImageUrl = updates.profileImageUrl;
    }
    await existing.save();

    return {
      id: existing._id.toString(),
      displayName: existing.displayName,
      email: existing.email,
      profileImageUrl: existing.profileImageUrl,
    };
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz kullanıcı kimliği.');
    }

    return new Types.ObjectId(rawId);
  }

  private toPublic(user: unknown) {
    if (!user || typeof user !== 'object') {
      return user;
    }

    const safe = { ...(user as Record<string, unknown>) };
    delete safe.password;
    return safe;
  }
}
