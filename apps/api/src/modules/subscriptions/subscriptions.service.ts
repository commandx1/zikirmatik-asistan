import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Types, type Model } from 'mongoose';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { SyncPremiumDto } from './dto/sync-premium.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RevenueCatVerifierService } from './revenuecat-verifier.service';
import {
  Subscription,
  type SubscriptionDocument,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly revenueCatVerifier: RevenueCatVerifierService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * İstemci (mobil) abonelik yazımı. Anahtar varsa RevenueCat doğrular ve
   * değerleri RC'den alır; anahtar yoksa prod'da kapalı (webhook + cron
   * premium'u yine verir), dev/test'te istemciye güvenilir.
   */
  async createFromClient(payload: CreateSubscriptionDto) {
    const mode = this.clientVerificationMode();
    if (mode === 'trust') {
      return this.create(payload);
    }
    if (mode === 'unconfigured') {
      this.logger.error({
        event: 'subscriptions.verifier_unconfigured',
        message:
          'REVENUECAT_SECRET_API_KEY yok: istemci abonelik yazımı reddedildi',
        alert: 'subscriptions.verifier_unconfigured',
      });
      throw new ServiceUnavailableException({
        code: 'SUBSCRIPTION_VERIFIER_UNCONFIGURED',
        message: 'Abonelik doğrulaması şu an yapılamıyor.',
      });
    }

    const premium = await this.revenueCatVerifier.verifyPremium(payload.userId);
    if (premium === null) {
      // RC'ye ulaşılamadı: geçici hata, istemci yeniden dener (5xx = transient).
      throw new ServiceUnavailableException({
        code: 'SUBSCRIPTION_VERIFIER_UNAVAILABLE',
        message:
          'Abonelik doğrulaması şu an yapılamıyor, lütfen tekrar deneyin.',
      });
    }
    if (!premium.active) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_NOT_VERIFIED',
        message: 'Aktif premium abonelik doğrulanamadı.',
      });
    }

    return this.create(
      Object.assign(new CreateSubscriptionDto(), payload, {
        plan: 'premium' as const,
        status: 'active' as const,
        productId: premium.productId ?? 'revenuecat_premium',
        provider: premium.provider ?? payload.provider,
        // ponytail: expires_date null (ömür boyu) ürünümüzde yok; olursa istemci endDate'i kalır.
        endDate: premium.expiresAt ?? payload.endDate,
      }),
    );
  }

  /** İstemci sync-user: bayrak yalnız dev/test'te (anahtar yokken) dikkate alınır. */
  async syncPremiumFromClient(userId: string, payload?: SyncPremiumDto) {
    const mode = this.clientVerificationMode();
    if (mode === 'trust') {
      return this.syncPremiumForUser(userId, payload);
    }
    if (mode === 'unconfigured') {
      return this.syncPremiumForUser(userId);
    }

    this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const premium = await this.revenueCatVerifier.verifyPremium(userId);
    return this.syncPremiumForUser(
      userId,
      premium ? { hasActivePremiumEntitlement: premium.active } : undefined,
    );
  }

  private clientVerificationMode(): 'verify' | 'trust' | 'unconfigured' {
    if (this.configService.get<string>('REVENUECAT_SECRET_API_KEY')?.trim()) {
      return 'verify';
    }
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    return nodeEnv === 'production' ? 'unconfigured' : 'trust';
  }

  /** providerEventId (yalnız webhook) verilirse idempotent: aynı olay tek belge. */
  async create(payload: CreateSubscriptionDto, providerEventId?: string) {
    const userId = this.asObjectId(
      payload.userId,
      'Geçersiz kullanıcı kimliği.',
    );
    await this.ensureUserExists(userId);

    const created = providerEventId
      ? await this.subscriptionModel
          .findOneAndUpdate(
            { providerEventId },
            { $setOnInsert: { ...payload, userId, providerEventId } },
            { upsert: true, returnDocument: 'after' },
          )
          .lean()
          .exec()
      : (
          await this.subscriptionModel.create({ ...payload, userId })
        ).toObject();

    await this.syncUserPremiumStatus(userId);

    return created;
  }

  async findAll(query: QuerySubscriptionsDto) {
    const filter: Record<string, unknown> = {};

    if (query.userId) {
      filter.userId = this.asObjectId(
        query.userId,
        'Geçersiz kullanıcı kimliği.',
      );
    }

    if (query.plan) {
      filter.plan = query.plan;
    }

    if (query.provider) {
      filter.provider = query.provider;
    }

    if (query.status) {
      filter.status = query.status;
    }

    return this.subscriptionModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async findById(id: string, userId?: string) {
    const filter: Record<string, unknown> = {
      _id: this.asObjectId(id, 'Geçersiz abonelik kimliği.'),
    };
    if (userId) {
      filter.userId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    }

    const subscription = await this.subscriptionModel
      .findOne(filter)
      .lean()
      .exec();

    if (!subscription) {
      throw new NotFoundException('Abonelik kaydı bulunamadı.');
    }

    return subscription;
  }

  async update(id: string, payload: UpdateSubscriptionDto, userId?: string) {
    let nextUserId: Types.ObjectId | undefined;

    if (payload.userId) {
      nextUserId = this.asObjectId(
        payload.userId,
        'Geçersiz kullanıcı kimliği.',
      );
      await this.ensureUserExists(nextUserId);
    }

    const targetSubscriptionId = this.asObjectId(
      id,
      'Geçersiz abonelik kimliği.',
    );
    const ownerFilter = userId
      ? {
          _id: targetSubscriptionId,
          userId: this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.'),
        }
      : { _id: targetSubscriptionId };

    const existing = await this.subscriptionModel
      .findOne(ownerFilter)
      .lean()
      .exec();
    if (!existing) {
      throw new NotFoundException('Güncellenecek abonelik kaydı bulunamadı.');
    }

    const subscription = await this.subscriptionModel
      .findByIdAndUpdate(
        targetSubscriptionId,
        {
          $set: {
            ...payload,
            ...(nextUserId ? { userId: nextUserId } : {}),
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!subscription) {
      throw new NotFoundException('Güncellenen abonelik kaydı bulunamadı.');
    }

    await this.syncUserPremiumStatus(existing.userId);
    if (nextUserId && existing.userId.toString() !== nextUserId.toString()) {
      await this.syncUserPremiumStatus(nextUserId);
    }

    return subscription;
  }

  async remove(id: string, userId?: string) {
    const targetSubscriptionId = this.asObjectId(
      id,
      'Geçersiz abonelik kimliği.',
    );
    if (userId) {
      const ownerId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
      const existing = await this.subscriptionModel
        .findOne({ _id: targetSubscriptionId, userId: ownerId }, { _id: 1 })
        .lean()
        .exec();
      if (!existing) {
        throw new NotFoundException('Silinecek abonelik kaydı bulunamadı.');
      }
    }

    const deleted = await this.subscriptionModel
      .findByIdAndDelete(targetSubscriptionId)
      .lean()
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek abonelik kaydı bulunamadı.');
    }

    await this.syncUserPremiumStatus(deleted.userId);

    return {
      deleted: true,
      id,
    };
  }

  /**
   * RevenueCat webhook'undan gelen app_user_id / original_app_user_id
   * adaylarından, veritabanında gerçekten var olan ilk kullanıcıyı bulur.
   * Geçersiz ObjectId'leri (ör. anonim RC kimlikleri) sessizce atlar.
   */
  async resolveExistingUserId(
    ...candidates: Array<string | undefined | null>
  ): Promise<string | null> {
    for (const candidate of candidates) {
      const trimmed = candidate?.trim();
      if (!trimmed || !Types.ObjectId.isValid(trimmed)) {
        continue;
      }

      const objectId = new Types.ObjectId(trimmed);
      const exists = await this.userModel.exists({ _id: objectId });
      if (exists) {
        return objectId.toString();
      }
    }

    return null;
  }

  /**
   * Olay (webhook / client sync) kaçırılsa bile premium durumunu zaman
   * bazında düzelten güvenlik ağı. Süresi dolmuş aktif abonelikleri
   * 'expired' yapar ve isPremium bayrağını gerçek duruma göre iki yönlü
   * eşitler. Tüm işlemler idempotent olduğundan birden fazla instance'ta
   * güvenle çalışır.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcilePremiumStatuses() {
    const now = new Date();

    const expired = await this.subscriptionModel
      .updateMany(
        { status: 'active', endDate: { $lt: now } },
        { $set: { status: 'expired' } },
      )
      .exec();

    if (expired.modifiedCount > 0) {
      this.logger.log(
        `Mutabakat: ${expired.modifiedCount} süresi dolmuş abonelik 'expired' yapıldı.`,
      );
    }

    const activeUserIds = await this.subscriptionModel.distinct('userId', {
      plan: 'premium',
      status: 'active',
      endDate: { $gte: now },
    });

    const downgraded = await this.userModel
      .updateMany(
        { isPremium: true, _id: { $nin: activeUserIds } },
        { $set: { isPremium: false } },
      )
      .exec();

    const upgraded = await this.userModel
      .updateMany(
        { isPremium: false, _id: { $in: activeUserIds } },
        { $set: { isPremium: true } },
      )
      .exec();

    if (downgraded.modifiedCount > 0 || upgraded.modifiedCount > 0) {
      this.logger.log(
        `Mutabakat: ${downgraded.modifiedCount} kullanıcı premium'dan düşürüldü, ` +
          `${upgraded.modifiedCount} kullanıcı premium'a yükseltildi.`,
      );
    }
  }

  async syncPremiumForUser(userId: string, payload?: SyncPremiumDto) {
    const objectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    await this.ensureUserExists(objectId);

    if (payload?.hasActivePremiumEntitlement === false) {
      await this.expireActivePremiumSubscriptions(objectId, payload.provider);
    }

    await this.syncUserPremiumStatus(objectId);

    const user = await this.userModel.findById(objectId).lean().exec();

    return {
      userId,
      isPremium: user?.isPremium ?? false,
    };
  }

  private async syncUserPremiumStatus(userId: Types.ObjectId) {
    const now = new Date();
    const activePremiumSubscriptionExists =
      (await this.subscriptionModel.exists({
        userId,
        plan: 'premium',
        status: 'active',
        endDate: { $gte: now },
      })) !== null;

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { isPremium: activePremiumSubscriptionExists } },
    );
  }

  private async expireActivePremiumSubscriptions(
    userId: Types.ObjectId,
    provider?: 'apple' | 'google',
  ) {
    await this.subscriptionModel
      .updateMany(
        {
          userId,
          plan: 'premium',
          status: 'active',
          ...(provider ? { provider } : {}),
        },
        {
          $set: {
            status: 'expired',
            endDate: new Date(),
          },
        },
      )
      .exec();
  }

  private async ensureUserExists(userId: Types.ObjectId) {
    const exists = await this.userModel.exists({ _id: userId });
    if (!exists) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
  }

  private asObjectId(rawId: string, message: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException(message);
    }

    return new Types.ObjectId(rawId);
  }
}
