import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { EmbeddingService } from '../embedding/embedding.service';
import { CreateDhikrDto } from './dto/create-dhikr.dto';
import { QueryDhikrsDto } from './dto/query-dhikrs.dto';
import { UpdateDhikrDto } from './dto/update-dhikr.dto';
import { Dhikr, type DhikrDocument } from './schemas/dhikr.schema';

type EmbeddingFields = {
  embedding: number[];
  embeddingSourceHash: string;
  embeddingModel: string;
  embeddingUpdatedAt: Date;
};

@Injectable()
export class DhikrsService {
  private readonly logger = new Logger(DhikrsService.name);

  constructor(
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async create(payload: CreateDhikrDto) {
    const embeddingFields = await this.buildEmbeddingFields(payload);
    const created = await this.dhikrModel.create({
      ...payload,
      ...(embeddingFields ?? {}),
    });
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
    const objectId = this.asObjectId(id);
    const dhikr = await this.dhikrModel
      .findByIdAndUpdate(
        objectId,
        { $set: payload },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!dhikr) {
      throw new NotFoundException('Güncellenecek zikir bulunamadı.');
    }

    // Embedding kaynağı (name.tr/suitableFor/tags/categories/virtue.tr)
    // değiştiyse vektörü yenile. Hash aynıysa gereksiz embedding maliyeti yok.
    const sourceText = this.embeddingService.buildSourceText(dhikr);
    const hash = this.embeddingService.sourceHash(sourceText);
    if (hash !== dhikr.embeddingSourceHash) {
      const embeddingFields = await this.buildEmbeddingFields(dhikr);
      if (embeddingFields) {
        await this.dhikrModel
          .updateOne({ _id: objectId }, { $set: embeddingFields })
          .exec();
        return { ...dhikr, ...embeddingFields };
      }
    }

    return dhikr;
  }

  /**
   * Bir zikir kaydı için embedding alanlarını üretir. OpenAI erişilemezse
   * null döner ve CRUD embedding'siz devam eder (akış bloklanmaz).
   */
  private async buildEmbeddingFields(
    source: Parameters<EmbeddingService['buildSourceText']>[0],
  ): Promise<EmbeddingFields | null> {
    const sourceText = this.embeddingService.buildSourceText(source);
    const embedding = await this.embeddingService.embed(sourceText);

    if (!embedding) {
      this.logger.warn(
        'Zikir için embedding üretilemedi; embedding alanları boş bırakıldı.',
      );
      return null;
    }

    return {
      embedding,
      embeddingSourceHash: this.embeddingService.sourceHash(sourceText),
      embeddingModel: this.embeddingService.model,
      embeddingUpdatedAt: new Date(),
    };
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

    const pattern = new RegExp(`^${escapeRegExp(normalized)}$`, 'i');
    const dhikr = await this.dhikrModel
      .findOne({
        $or: [
          { 'transliteration.tr': pattern },
          { 'transliteration.en': pattern },
        ],
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
