import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { CreateUserDhikrDto } from './dto/create-user-dhikr.dto';
import { UpdateUserDhikrDto } from './dto/update-user-dhikr.dto';
import { UserDhikr, type UserDhikrDocument } from './schemas/user-dhikr.schema';

@Injectable()
export class UserDhikrsService {
  constructor(
    @InjectModel(UserDhikr.name)
    private readonly userDhikrModel: Model<UserDhikrDocument>,
  ) {}

  async createOrUpdate(userId: string, payload: CreateUserDhikrDto) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const clientId = payload.clientId?.trim() || this.buildAutoClientId();
    const name =
      payload.name?.trim() || (await this.buildNextAutoTitle(userObjectId));

    const next = await this.userDhikrModel
      .findOneAndUpdate(
        { userId: userObjectId, clientId },
        {
          $set: {
            name,
            transliteration: payload.transliteration?.trim() || name,
            arabic: payload.arabic?.trim() || undefined,
            meaning: payload.meaning?.trim() || undefined,
            target: typeof payload.target === 'number' ? payload.target : 0,
            isFavorite: payload.isFavorite ?? false,
          },
          $setOnInsert: {
            userId: userObjectId,
            clientId,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    return next;
  }

  async findAll(userId: string) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');

    return this.userDhikrModel
      .find({ userId: userObjectId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async updateByClientId(
    userId: string,
    clientId: string,
    payload: UpdateUserDhikrDto,
  ) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');

    const updated = await this.userDhikrModel
      .findOneAndUpdate(
        { userId: userObjectId, clientId: clientId.trim() },
        {
          $set: {
            ...(payload.name !== undefined
              ? { name: payload.name.trim() }
              : {}),
            ...(payload.transliteration !== undefined
              ? { transliteration: payload.transliteration.trim() || undefined }
              : {}),
            ...(payload.arabic !== undefined
              ? { arabic: payload.arabic.trim() || undefined }
              : {}),
            ...(payload.meaning !== undefined
              ? { meaning: payload.meaning.trim() || undefined }
              : {}),
            ...(payload.target !== undefined ? { target: payload.target } : {}),
            ...(payload.isFavorite !== undefined
              ? { isFavorite: payload.isFavorite }
              : {}),
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Güncellenecek kullanıcı zikri bulunamadı.');
    }

    return updated;
  }

  async removeByClientId(userId: string, clientId: string) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');

    const deleted = await this.userDhikrModel
      .findOneAndDelete({ userId: userObjectId, clientId: clientId.trim() })
      .lean()
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek kullanıcı zikri bulunamadı.');
    }

    return {
      deleted: true,
      clientId,
    };
  }

  private asObjectId(rawId: string, message: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException(message);
    }

    return new Types.ObjectId(rawId);
  }

  private buildAutoClientId() {
    return `auto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private async buildNextAutoTitle(userId: Types.ObjectId) {
    const items = await this.userDhikrModel
      .find({ userId }, { name: 1 })
      .lean()
      .exec();

    let max = 0;
    for (const item of items) {
      const text = typeof item.name === 'string' ? item.name.trim() : '';
      const match = /^Başlık\s+(\d+)$/i.exec(text);
      if (!match) {
        continue;
      }

      const value = Number.parseInt(match[1] ?? '', 10);
      if (Number.isFinite(value) && value > max) {
        max = value;
      }
    }

    return `Başlık ${max + 1}`;
  }
}
