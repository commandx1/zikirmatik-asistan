import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model } from 'mongoose';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { QueryDhikrCollectionsDto } from './dto/query-dhikr-collections.dto';
import {
  DhikrCollection,
  type DhikrCollectionDocument,
} from './schemas/dhikr-collection.schema';

@Injectable()
export class DhikrCollectionsService {
  constructor(
    @InjectModel(DhikrCollection.name)
    private readonly collectionModel: Model<DhikrCollectionDocument>,
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
  ) {}

  async findAll(query: QueryDhikrCollectionsDto) {
    const filter: Record<string, unknown> = { isActive: true };

    if (query.category) {
      filter.category = query.category;
    }

    return this.collectionModel
      .find(filter, {
        key: 1,
        label: 1,
        description: 1,
        category: 1,
        dhikrCount: 1,
      })
      .sort({ category: 1, label: 1 })
      .lean()
      .exec();
  }

  async getDetail(key: string) {
    const col = await this.collectionModel
      .findOne({ key, isActive: true })
      .lean()
      .exec();

    if (!col) {
      throw new NotFoundException('Koleksiyon bulunamadı.');
    }

    const dhikrDocs = await this.dhikrModel
      .find(
        { _id: { $in: col.dhikrIds } },
        {
          key: 1,
          nameArabic: 1,
          nameTurkish: 1,
          transliteration: 1,
          meaning: 1,
          virtue: 1,
          source: 1,
          recommendedCount: 1,
          timeOfDay: 1,
        },
      )
      .lean()
      .exec();

    // Restore seed ordering (MongoDB $in does not guarantee order)
    const idOrder = new Map(col.dhikrIds.map((id, i) => [id.toString(), i]));
    const orderedDhikrs = dhikrDocs.sort(
      (a, b) =>
        (idOrder.get(a._id.toString()) ?? 0) -
        (idOrder.get(b._id.toString()) ?? 0),
    );

    return { ...col, dhikrs: orderedDhikrs };
  }
}
