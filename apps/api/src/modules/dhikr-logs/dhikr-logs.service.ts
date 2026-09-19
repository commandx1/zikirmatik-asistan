import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { CirclesService } from '../circles/circles.service';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { StreaksService } from '../streaks/streaks.service';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { VirdProgressService } from '../vird/vird-progress.service';
import type { VirdSlotKey } from '../vird/vird.types';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { DeleteDhikrLogsByDhikrDto } from './dto/delete-dhikr-logs-by-dhikr.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { SetDhikrFavoriteDto } from './dto/set-dhikr-favorite.dto';
import { DhikrLog, type DhikrLogDocument } from './schemas/dhikr-log.schema';

/** createBulk'un ürettiği updateOne op'u — bulkWrite'ın beklediği tipin aynısı. */
type BulkLogOperation = Parameters<
  Model<DhikrLogDocument>['bulkWrite']
>[0][number];

type VirdLogRef = {
  virdProgramId: Types.ObjectId;
  virdSlot: VirdSlotKey;
  virdPrayerIndex?: number;
};

@Injectable()
export class DhikrLogsService {
  private readonly logger = new Logger(DhikrLogsService.name);

  constructor(
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
    private readonly streaksService: StreaksService,
    private readonly virdProgressService: VirdProgressService,
    private readonly circlesService: CirclesService,
  ) {}

  /**
   * Best-effort streak refresh after a log write. Never throws — a streak
   * recalculation failure must not fail the dhikr log write itself.
   */
  private async safeRecalcStreak(userId?: string) {
    if (!userId) {
      return;
    }
    try {
      await this.streaksService.recalculateForUser(userId);
    } catch (error) {
      this.logger.warn(
        `safeRecalcStreak failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Best-effort vird ilerleme türetimi. safeRecalcStreak ile aynı desen:
   * asla throw etmez — bir vird türetim hatası dhikr log yazımını
   * etkilememelidir.
   */
  private async safeApplyVirdProgress(input?: {
    userId: string;
    virdProgramId: string;
    date: string;
  }) {
    if (!input) {
      return;
    }
    try {
      await this.virdProgressService.applyLogWrite(input);
    } catch (error) {
      this.logger.warn(
        `safeApplyVirdProgress failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Best-effort halka ilerlemesi. safeApplyVirdProgress ile aynı desen:
   * asla throw etmez — halka toplamının tazelenmesindeki bir hata dhikr log
   * yazımını etkilememelidir (toplam bir sonraki yazımda yine türetilir).
   */
  private async safeApplyCircleProgress(
    circleId?: string,
  ): Promise<number | undefined> {
    if (!circleId) {
      return undefined;
    }
    try {
      return await this.circlesService.applyProgress(circleId);
    } catch (error) {
      this.logger.warn(
        `safeApplyCircleProgress failed: ${error instanceof Error ? error.message : error}`,
      );
      return undefined;
    }
  }

  /**
   * dhikr_logs upsert anahtarını kurar. `vird` verilmişse (virdProgramId +
   * virdSlot) filtreye virdProgramId/virdSlot/virdPrayerIndex eklenir — aynı
   * zikrin farklı vird dilimlerinde (veya prayer diliminde farklı vakitlerde)
   * çakışmadan ayrı bir belge olarak tutulmasını sağlar. `vird` verilmezse
   * filtreye AYRICA `virdProgramId: {$exists:false}` eklenir — sade (vird
   * etiketsiz) bir yazımın, aynı gün aynı zikir için önceden yazılmış vird
   * etiketli bir belgeyle eşleşip onun üzerine yazmasını engeller (iki akış
   * her zaman ayrı belge kalır).
   *
   * `circleId` aynı mantığın halka karşılığıdır: verilmişse filtreye eklenir,
   * verilmemişse `circleId: {$exists:false}` eklenir — sade/vird belgeleri
   * halka belgelerinden her zaman ayrık kalır.
   */
  private buildLogFilter(
    userId: Types.ObjectId,
    date: string,
    dhikrRef: { dhikrObjectId?: Types.ObjectId; customDhikrId?: string },
    vird?: VirdLogRef,
    circleId?: Types.ObjectId,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = { userId, date };
    if (dhikrRef.dhikrObjectId) {
      filter.dhikrId = dhikrRef.dhikrObjectId;
    } else if (dhikrRef.customDhikrId) {
      filter.customDhikrId = dhikrRef.customDhikrId;
    }
    if (vird) {
      filter.virdProgramId = vird.virdProgramId;
      filter.virdSlot = vird.virdSlot;
      filter.virdPrayerIndex = vird.virdPrayerIndex ?? null;
    } else {
      filter.virdProgramId = { $exists: false };
    }
    if (circleId) {
      filter.circleId = circleId;
    } else {
      filter.circleId = { $exists: false };
    }
    return filter;
  }

  private resolveVirdRef(payload: {
    virdProgramId?: string;
    virdSlot?: VirdSlotKey;
    virdPrayerIndex?: number;
  }): VirdLogRef | undefined {
    if (!hasNonEmptyString(payload.virdProgramId) || !payload.virdSlot) {
      return undefined;
    }
    return {
      virdProgramId: this.asObjectId(payload.virdProgramId),
      virdSlot: payload.virdSlot,
      virdPrayerIndex: payload.virdPrayerIndex,
    };
  }

  async create(payload: CreateDhikrLogDto) {
    const userObjectId = this.asObjectId(payload.userId);
    const dhikrId = hasNonEmptyString(payload.dhikrId)
      ? payload.dhikrId
      : undefined;
    const dhikrObjectId = dhikrId ? this.asObjectId(dhikrId) : undefined;
    const aiRecommendationObjectId = hasNonEmptyString(
      payload.aiRecommendationId,
    )
      ? this.asObjectId(payload.aiRecommendationId)
      : undefined;
    const customDhikrId: string | undefined = hasNonEmptyString(
      payload.customDhikrId,
    )
      ? payload.customDhikrId.trim()
      : undefined;
    const circleObjectId = hasNonEmptyString(payload.circleId)
      ? this.asObjectId(payload.circleId)
      : undefined;

    if (!dhikrObjectId && !customDhikrId) {
      throw new BadRequestException(
        'dhikrId veya customDhikrId alanlarından biri zorunludur.',
      );
    }

    await this.ensureReferencesExist(
      [userObjectId],
      dhikrObjectId ? [dhikrObjectId] : [],
    );

    const vird = this.resolveVirdRef(payload);
    if (vird && circleObjectId) {
      throw new BadRequestException(
        'Bir kayıt aynı anda hem vird hem halka kaydı olamaz.',
      );
    }

    // Halka yetkisi YAZIMDAN ÖNCE doğrulanır: üye mi, halka aktif mi ve zikir
    // halkanın zikriyle eşleşiyor mu (bkz. CirclesService.assertCanContribute).
    if (circleObjectId) {
      await this.circlesService.assertCanContribute(
        payload.userId,
        circleObjectId.toHexString(),
        dhikrId,
      );
    }

    const filter = this.buildLogFilter(
      userObjectId,
      payload.date,
      { dhikrObjectId, customDhikrId },
      vird,
      circleObjectId,
    );

    // A day holds at most one log per (user, dhikr), so a later write for the
    // same day overwrites the earlier one. `isCompleted` must not follow that
    // rule: once a target was reached that day the streak has been earned, and
    // a subsequent partial session (reset + save 5 of 100) must not revoke it.
    const existing = await this.dhikrLogModel
      .findOne(filter, { isCompleted: 1 })
      .lean()
      .exec();
    const isCompleted =
      existing?.isCompleted === true ? true : (payload.isCompleted ?? false);

    const updateSet: Record<string, unknown> = {
      count: payload.count,
      targetCount: payload.targetCount,
      sessionDuration: payload.sessionDuration ?? 0,
      source: payload.source ?? 'manual',
      isCompleted,
      customDhikrName: payload.customDhikrName?.trim() || undefined,
      customDhikrArabic: payload.customDhikrArabic?.trim() || undefined,
      aiRecommendationId: aiRecommendationObjectId,
      aiPrompt: payload.aiPrompt?.trim() || undefined,
      aiAssistantNote: payload.aiAssistantNote?.trim() || undefined,
    };
    if (typeof payload.isFavorite === 'boolean') {
      updateSet.isFavorite = payload.isFavorite;
    }
    const setOnInsert: Record<string, unknown> = {
      userId: userObjectId,
      date: payload.date,
    };
    if (dhikrObjectId) {
      setOnInsert.dhikrId = dhikrObjectId;
    }
    if (customDhikrId) {
      setOnInsert.customDhikrId = customDhikrId;
    }
    if (vird) {
      // Vird alanları YALNIZ $set'te olmalı: aynı yol hem $set hem $setOnInsert
      // içinde geçerse MongoDB upsert'te "would create a conflict" (kod 40)
      // fırlatır. Filtre zaten insert'te bu alanları tohumlar; $set hepsini
      // (prayerIndex için null dahil, filtreyle aynı değer) açıkça yazar.
      updateSet.virdProgramId = vird.virdProgramId;
      updateSet.virdSlot = vird.virdSlot;
      updateSet.virdPrayerIndex = vird.virdPrayerIndex ?? null;
      if (typeof payload.virdDayIndex === 'number') {
        updateSet.virdDayIndex = payload.virdDayIndex;
      }
    }

    const update: Record<string, unknown> = {
      $set: updateSet,
      $setOnInsert: setOnInsert,
    };
    if (circleObjectId) {
      // circleId YALNIZ $set'te (filtre zaten insert'te tohumlar; aynı yolun
      // $setOnInsert'te de geçmesi MongoDB'de çakışma hatası verirdi).
      updateSet.circleId = circleObjectId;
      // Halka logunda count $set ile DÜŞÜRÜLEMEZ: sayı ortak bir toplamı
      // besliyor, geciken/eski bir istemci yazımı toplamı geri çekmemeli.
      // $max tek atomik adımda "yalnız büyükse yaz" anlamına gelir.
      delete updateSet.count;
      update.$max = { count: payload.count };
    }

    const created = await this.upsertLogOnce(filter, update);

    await this.safeRecalcStreak(payload.userId);
    await this.safeApplyVirdProgress(
      vird
        ? {
            userId: payload.userId,
            virdProgramId: vird.virdProgramId.toString(),
            date: payload.date,
          }
        : undefined,
    );
    const circleTotalCount = await this.safeApplyCircleProgress(
      circleObjectId?.toHexString(),
    );

    return circleObjectId && circleTotalCount !== undefined
      ? { ...created, circleTotalCount }
      : created;
  }

  /**
   * dhikr_logs upsert'i. `upsert` yalnız unique index ile (uniq_log_key, bkz.
   * dhikr-log.schema.ts) atomiktir: aynı anahtara giden iki eşzamanlı yazımda
   * yarışı kaybeden insert E11000 alır. Belge o an artık VAR olduğu için aynı
   * filtre/update ile ikinci deneme insert'e düşmez, mevcut belgeyi günceller
   * ($max dahil). İkinci denemede de E11000 gelirse bu gerçek bir hatadır
   * (anahtar dışı bir unique kısıt) ve yukarı fırlatılır.
   */
  private async upsertLogOnce(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) {
    const run = () =>
      this.dhikrLogModel
        .findOneAndUpdate(filter, update, {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        })
        .lean()
        .exec();

    try {
      return await run();
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      this.logger.debug(
        'dhikr log upsert yarışı (E11000) — aynı filtreyle tekrar deneniyor.',
      );
      return run();
    }
  }

  async createBulk(payload: CreateDhikrLogBulkDto) {
    // Halka logları tek tek yazılır: her yazım kendi yetki kontrolünü ve
    // ilerleme türetimini gerektirir (bkz. create).
    if (payload.items.some((item) => hasNonEmptyString(item.circleId))) {
      throw new BadRequestException('circleId bulk ile gönderilemez.');
    }
    if (payload.items.some((item) => !hasNonEmptyString(item.dhikrId))) {
      throw new BadRequestException(
        'Bulk dhikr log kaydı için tüm itemlarda dhikrId zorunludur.',
      );
    }

    const itemsWithDhikrId = payload.items.filter(hasDhikrId);
    const userObjectIds = payload.items.map((item) =>
      this.asObjectId(item.userId),
    );
    const dhikrObjectIds = itemsWithDhikrId.map((item) =>
      this.asObjectId(item.dhikrId),
    );
    await this.ensureReferencesExist(userObjectIds, dhikrObjectIds);

    const virdRefs = payload.items.map((item) => this.resolveVirdRef(item));
    const filters = payload.items.map((item, index) =>
      this.buildLogFilter(
        userObjectIds[index],
        item.date,
        { dhikrObjectId: dhikrObjectIds[index] },
        virdRefs[index],
      ),
    );

    const operations = payload.items.map((item, index) => {
      const vird = virdRefs[index];
      const set: Record<string, unknown> = {
        count: item.count,
        targetCount: item.targetCount,
        sessionDuration: item.sessionDuration ?? 0,
        source: item.source ?? 'manual',
        isCompleted: item.isCompleted ?? false,
      };
      const setOnInsert: Record<string, unknown> = {
        userId: userObjectIds[index],
        dhikrId: dhikrObjectIds[index],
        date: item.date,
      };
      if (vird) {
        set.virdProgramId = vird.virdProgramId;
        set.virdSlot = vird.virdSlot;
        set.virdPrayerIndex = vird.virdPrayerIndex;
        if (typeof item.virdDayIndex === 'number') {
          set.virdDayIndex = item.virdDayIndex;
        }
        setOnInsert.virdProgramId = vird.virdProgramId;
        setOnInsert.virdSlot = vird.virdSlot;
        setOnInsert.virdPrayerIndex = vird.virdPrayerIndex;
      }
      return {
        updateOne: {
          filter: filters[index],
          update: { $set: set, $setOnInsert: setOnInsert },
          upsert: true,
        },
      };
    });

    const upsertedCount = await this.bulkWriteWithRetry(operations);

    const items = await this.dhikrLogModel.find({ $or: filters }).lean().exec();

    await this.safeRecalcStreak(payload.items[0]?.userId);
    await this.applyVirdProgressForBulk(payload.items, virdRefs);

    return {
      insertedCount: upsertedCount,
      items,
    };
  }

  /**
   * createBulk'un upsertLogOnce karşılığı. `ordered:false` olduğu için
   * yarışı kaybeden op'lar diğerlerini durdurmaz; sürücü hepsini
   * MongoBulkWriteError.writeErrors içinde toplar. Yalnız E11000 alan op'lar
   * bir kez daha gönderilir (belge artık var → update'e düşerler). Kalan
   * herhangi bir hata yukarı fırlatılır.
   */
  private async bulkWriteWithRetry(
    operations: BulkLogOperation[],
  ): Promise<number> {
    const first = await this.runBulk(operations);
    if (first.duplicateIndexes.length === 0) {
      return first.upsertedCount;
    }

    this.logger.debug(
      `bulk dhikr log upsert yarışı (E11000): ${first.duplicateIndexes.length} op tekrar deneniyor.`,
    );
    const retry = await this.runBulk(
      first.duplicateIndexes.map((index) => operations[index]),
    );
    if (retry.duplicateIndexes.length > 0) {
      throw retry.error;
    }
    return first.upsertedCount + retry.upsertedCount;
  }

  private async runBulk(operations: BulkLogOperation[]): Promise<{
    upsertedCount: number;
    duplicateIndexes: number[];
    error?: unknown;
  }> {
    try {
      const result = await this.dhikrLogModel.bulkWrite(operations, {
        ordered: false,
      });
      return { upsertedCount: result.upsertedCount ?? 0, duplicateIndexes: [] };
    } catch (error) {
      const writeErrors = bulkWriteErrors(error);
      // Tek bir op bile E11000 dışı bir sebeple düştüyse yarış değil, gerçek
      // hata: olduğu gibi fırlat.
      if (
        writeErrors.length === 0 ||
        !writeErrors.every((writeError) => writeError.code === 11000)
      ) {
        throw error;
      }
      const partial = (error as { result?: { upsertedCount?: number } }).result;
      return {
        upsertedCount: partial?.upsertedCount ?? 0,
        duplicateIndexes: writeErrors.map((writeError) => writeError.index),
        error,
      };
    }
  }

  /** Bulk yazımdaki distinct (userId, virdProgramId, date) üçlüleri için
   * tek tek (best-effort) vird ilerlemesi türetir. */
  private async applyVirdProgressForBulk(
    items: CreateDhikrLogDto[],
    virdRefs: (VirdLogRef | undefined)[],
  ) {
    const seen = new Set<string>();
    for (let index = 0; index < items.length; index += 1) {
      const vird = virdRefs[index];
      if (!vird) {
        continue;
      }
      const item = items[index];
      const key = `${item.userId}:${vird.virdProgramId.toString()}:${item.date}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      await this.safeApplyVirdProgress({
        userId: item.userId,
        virdProgramId: vird.virdProgramId.toString(),
        date: item.date,
      });
    }
  }

  async findAll(query: QueryDhikrLogsDto) {
    const filter: Record<string, unknown> = {};

    if (query.userId) {
      filter.userId = this.asObjectId(query.userId);
    }

    if (query.dhikrId) {
      filter.dhikrId = this.asObjectId(query.dhikrId);
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {
        ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
        ...(query.dateTo ? { $lte: query.dateTo } : {}),
      };
    }

    return this.dhikrLogModel
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async findById(id: string, userId?: string) {
    const filter: Record<string, unknown> = {
      _id: this.asObjectId(id),
    };
    if (userId) {
      filter.userId = this.asObjectId(userId);
    }

    const log = await this.dhikrLogModel.findOne(filter).lean().exec();
    if (!log) {
      throw new NotFoundException('Zikir kaydı bulunamadı.');
    }

    return log;
  }

  async removeByDhikr(userId: string, payload: DeleteDhikrLogsByDhikrDto) {
    const filter: Record<string, unknown> = {
      userId: this.asObjectId(userId),
    };

    if (hasNonEmptyString(payload.dhikrId)) {
      filter.dhikrId = this.asObjectId(payload.dhikrId);
    } else if (hasNonEmptyString(payload.customDhikrId)) {
      filter.customDhikrId = payload.customDhikrId.trim();
    } else {
      throw new BadRequestException(
        'dhikrId veya customDhikrId alanlarından biri zorunludur.',
      );
    }

    const result = await this.dhikrLogModel.deleteMany(filter).exec();

    return {
      deleted: true,
      deletedCount: result.deletedCount ?? 0,
    };
  }

  async setFavoriteByDhikr(userId: string, payload: SetDhikrFavoriteDto) {
    const filter: Record<string, unknown> = {
      userId: this.asObjectId(userId),
    };

    if (hasNonEmptyString(payload.dhikrId)) {
      filter.dhikrId = this.asObjectId(payload.dhikrId);
    } else if (hasNonEmptyString(payload.customDhikrId)) {
      filter.customDhikrId = payload.customDhikrId.trim();
    } else {
      throw new BadRequestException(
        'dhikrId veya customDhikrId alanlarından biri zorunludur.',
      );
    }

    const result = await this.dhikrLogModel
      .updateMany(filter, { $set: { isFavorite: payload.isFavorite } })
      .exec();

    return {
      updated: true,
      matchedCount: result.matchedCount ?? 0,
      modifiedCount: result.modifiedCount ?? 0,
      isFavorite: payload.isFavorite,
    };
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz ObjectId değeri.');
    }

    return new Types.ObjectId(rawId);
  }

  private async ensureReferencesExist(
    userIds: Types.ObjectId[],
    dhikrIds: Types.ObjectId[],
  ) {
    const uniqueUserIds = uniqueObjectIds(userIds);
    const uniqueDhikrIds = uniqueObjectIds(dhikrIds);

    const userCount = await this.userModel.countDocuments({
      _id: { $in: uniqueUserIds },
    });

    if (userCount !== uniqueUserIds.length) {
      throw new NotFoundException(
        'Dhikr log kaydı için en az bir kullanıcı bulunamadı.',
      );
    }

    if (uniqueDhikrIds.length > 0) {
      const dhikrCount = await this.dhikrModel.countDocuments({
        _id: { $in: uniqueDhikrIds },
      });

      if (dhikrCount !== uniqueDhikrIds.length) {
        throw new NotFoundException(
          'Dhikr log kaydı için en az bir zikir bulunamadı.',
        );
      }
    }
  }
}

/** E11000 (duplicate key). Sürücü sürümüne göre code ya da codeName gelir. */
function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { code?: unknown; codeName?: unknown };
  return candidate.code === 11000 || candidate.codeName === 'DuplicateKey';
}

/**
 * MongoBulkWriteError.writeErrors normalizasyonu. Sürücü tek hatada dizi
 * yerine tek nesne verebilir; index/code kimi sürümlerde getter, kimilerinde
 * iç `err` nesnesindedir.
 */
function bulkWriteErrors(error: unknown): { index: number; code: number }[] {
  const raw = (error as { writeErrors?: unknown }).writeErrors;
  if (raw === undefined) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  return list.flatMap((item) => {
    const source = item as {
      index?: unknown;
      code?: unknown;
      err?: { index?: unknown; code?: unknown };
    };
    const index = source.index ?? source.err?.index;
    const code = source.code ?? source.err?.code;
    return typeof index === 'number' && typeof code === 'number'
      ? [{ index, code }]
      : [];
  });
}

function uniqueObjectIds(values: Types.ObjectId[]) {
  return Array.from(
    new Map(values.map((value) => [value.toHexString(), value])).values(),
  );
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasDhikrId(
  item: CreateDhikrLogDto,
): item is CreateDhikrLogDto & { dhikrId: string } {
  return hasNonEmptyString(item.dhikrId);
}
