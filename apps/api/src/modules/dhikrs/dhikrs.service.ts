import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { CreateDhikrDto } from './dto/create-dhikr.dto';
import { QueryDhikrsDto } from './dto/query-dhikrs.dto';
import { UpdateDhikrDto } from './dto/update-dhikr.dto';
import { Dhikr, type DhikrDocument } from './schemas/dhikr.schema';

@Injectable()
export class DhikrsService {
  constructor(
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
  ) {}

  async create(payload: CreateDhikrDto) {
    const created = await this.dhikrModel.create(payload);
    return created.toObject();
  }

  async findAll(query: QueryDhikrsDto) {
    const filter: Record<string, unknown> = {};

    if (query.timeOfDay) {
      filter.timeOfDay = query.timeOfDay;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    if (query.category) {
      filter.categories = query.category;
    }

    if (query.isVerified !== undefined) {
      filter.isVerified = query.isVerified === 'true';
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    return this.dhikrModel.find(filter).sort({ createdAt: -1 }).lean().exec();
  }

  async findById(id: string) {
    const dhikr = await this.dhikrModel
      .findById(this.asObjectId(id))
      .lean()
      .exec();
    if (!dhikr) {
      throw new NotFoundException('Zikir bulunamadı.');
    }

    return dhikr;
  }

  async update(id: string, payload: UpdateDhikrDto) {
    const dhikr = await this.dhikrModel
      .findByIdAndUpdate(
        this.asObjectId(id),
        { $set: payload },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!dhikr) {
      throw new NotFoundException('Güncellenecek zikir bulunamadı.');
    }

    return dhikr;
  }

  async remove(id: string) {
    const result = await this.dhikrModel
      .findByIdAndDelete(this.asObjectId(id))
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException('Silinecek zikir bulunamadı.');
    }

    return {
      deleted: true,
      id,
    };
  }

  async listVerifiedActive() {
    return this.dhikrModel
      .find({ isVerified: true, isActive: true })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findVerifiedActiveByTransliteration(transliteration: string) {
    const normalized = transliteration.trim();
    if (!normalized) {
      throw new NotFoundException('Zikir bulunamadı.');
    }

    const dhikr = await this.dhikrModel
      .findOne({
        transliteration: new RegExp(`^${escapeRegExp(normalized)}$`, 'i'),
        isVerified: true,
        isActive: true,
      })
      .lean()
      .exec();

    if (!dhikr) {
      throw new NotFoundException('Zikir bulunamadı.');
    }

    return dhikr;
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz zikir kimliği.');
    }

    return new Types.ObjectId(rawId);
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
