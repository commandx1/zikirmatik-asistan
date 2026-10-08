import { createHash, randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  AiCreditWallet,
  type AiCreditWalletDocument,
} from './schemas/ai-credit-wallet.schema';
import {
  AiCreditLedger,
  type AiCreditLedgerDocument,
} from './schemas/ai-credit-ledger.schema';
import {
  AI_CREDIT_DEFAULT_TOPUP_PRODUCTS,
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_CREDIT_REASONS,
  AI_DAILY_FREE_LIMIT_CODE,
  AI_DAILY_FREE_RUN_LIMIT,
  AI_REQUEST_IN_FLIGHT_CODE,
  AI_REQUEST_LEASE_MS,
  type AiCreditReason,
  FREE_DAILY_CREDIT_AMOUNT,
  FREE_SIGNUP_BONUS_CREDIT_AMOUNT,
  PREMIUM_MONTHLY_CREDIT_AMOUNT,
} from './credits.constants';

type CreditGrantStatus = {
  dailyGrant: number;
  monthlyGrant: number;
};

type CreditState = CreditGrantStatus & {
  balance: number;
  isPremium: boolean;
  wallet: AiCreditWalletDocument;
};

/**
 * AI kredi cüzdanı (AiCreditWallet) ve defteri (AiCreditLedger) üzerinde
 * çalışan tüm mantık burada toplanır: günlük/aylık grant, top-up satın alma
 * ve flowId bazlı idempotent debit. AiService ve AiChatService bu servisi
 * enjekte ederek kendi akışlarında (öneri / sohbet) kullanır.
 */
@Injectable()
export class AiCreditsService {
  private readonly logger = new Logger(AiCreditsService.name);
  private topupCatalogCache?: Map<string, number>;
  private topupCatalogCacheRaw?: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(AiCreditWallet.name)
    private readonly aiCreditWalletModel: Model<AiCreditWalletDocument>,
    @InjectModel(AiCreditLedger.name)
    private readonly aiCreditLedgerModel: Model<AiCreditLedgerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getDailyQuota(userId: string) {
    const credits = await this.getCredits(userId);
    if (credits.isPremium) {
      return { used: 0, limit: null, isPremium: true, deprecated: true };
    }

    const grantWindow = Math.max(0, credits.dailyGrant);
    const used = Math.max(
      0,
      grantWindow - Math.min(credits.balance, grantWindow),
    );

    return {
      used,
      limit: grantWindow,
      isPremium: false,
      deprecated: true,
    };
  }

  async getCredits(userId: string) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const user = await this.ensureUserExists(userObjectId);
    const creditState = await this.ensureCreditState(
      userObjectId,
      user.isPremium,
    );

    return {
      balance: creditState.balance,
      isPremium: creditState.isPremium,
      dailyGrant: creditState.dailyGrant,
      monthlyGrant: creditState.monthlyGrant,
    };
  }

  async applyTopupPurchase(input: {
    userId: string;
    productId: string;
    providerEventId: string;
  }) {
    const userObjectId = this.asObjectId(
      input.userId,
      'Geçersiz kullanıcı kimliği.',
    );
    await this.ensureUserExists(userObjectId);

    const productId = input.productId?.trim();
    const providerEventId = input.providerEventId?.trim();
    if (!productId || !providerEventId) {
      return { applied: false as const, reason: 'missing_fields', credits: 0 };
    }

    const credits = this.resolveTopupCredits(productId);
    if (credits <= 0) {
      this.logger.error(
        `Topup UNKNOWN_PRODUCT: katalogda karşılığı olmayan ürün — ` +
          `productId=${productId} userId=${input.userId} ` +
          `providerEventId=${providerEventId}. Kredi UYGULANMADI; ` +
          `AI_CREDIT_TOPUP_PRODUCTS / AI_CREDIT_DEFAULT_TOPUP_PRODUCTS kataloğunu kontrol et.`,
      );
      return { applied: false as const, reason: 'unknown_product', credits: 0 };
    }

    try {
      await this.aiCreditLedgerModel.create({
        userId: userObjectId,
        reason: AI_CREDIT_REASONS.TOPUP_PURCHASE,
        delta: credits,
        providerEventId,
        metadata: { productId },
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return { applied: false as const, reason: 'duplicate_event', credits };
      }
      throw error;
    }

    await this.aiCreditWalletModel
      .findOneAndUpdate(
        { userId: userObjectId },
        { $inc: { topupCredits: credits, balance: credits } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .exec();

    return { applied: true as const, reason: 'ok', credits };
  }

  /**
   * Kredi paketi iadesi (A-10): paketin kredisi kalan bakiyeden düşülür —
   * önce topup, kalan grant kovasından; bakiye 0'ın altına inmez. Ledger
   * REFUND satırı (providerEventId unique) olay başına tek uygulamayı garantiler.
   * Katalogda olmayan ürün (abonelik) → etkisiz.
   */
  async applyTopupRefund(input: {
    userId: string;
    productId: string;
    providerEventId: string;
  }) {
    const userId = this.asObjectId(input.userId, 'Geçersiz kullanıcı kimliği.');
    const productId = input.productId?.trim();
    const providerEventId = input.providerEventId?.trim();
    const credits = productId ? this.resolveTopupCredits(productId) : 0;
    if (!providerEventId || credits <= 0) {
      return { applied: false as const, reason: 'not_topup', credits: 0 };
    }

    try {
      await this.aiCreditLedgerModel.create({
        userId,
        reason: AI_CREDIT_REASONS.REFUND,
        delta: -credits,
        providerEventId,
        metadata: { productId, kind: 'topup_refund' },
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return {
          applied: false as const,
          reason: 'duplicate_event',
          credits: 0,
        };
      }
      throw error;
    }

    const topupTake = { $min: ['$topupCredits', credits] };
    const before = await this.aiCreditWalletModel
      .findOneAndUpdate(
        { userId },
        [
          {
            $set: {
              topupCredits: { $subtract: ['$topupCredits', topupTake] },
              grantCredits: {
                $subtract: [
                  '$grantCredits',
                  {
                    $min: [
                      '$grantCredits',
                      { $subtract: [credits, topupTake] },
                    ],
                  },
                ],
              },
            },
          },
          { $set: { balance: { $add: ['$grantCredits', '$topupCredits'] } } },
        ],
        { returnDocument: 'before', updatePipeline: true },
      )
      .lean()
      .exec();

    const deducted = Math.min(Math.max(0, before?.balance ?? 0), credits);
    await this.aiCreditLedgerModel
      .updateOne(
        { reason: AI_CREDIT_REASONS.REFUND, providerEventId },
        {
          $set: {
            delta: -deducted,
            balanceAfter: Math.max(0, (before?.balance ?? 0) - deducted),
          },
        },
      )
      .exec();

    return { applied: true as const, reason: 'ok', credits: deducted };
  }

  /**
   * `extra` opsiyoneldir — AI Vird Programı akışı burayı durationDays/slots/
   * prayerSelection ile doldurur (aynı flowId'nin farklı bir program isteğiyle
   * yeniden kullanılmasını da RECOMMENDATION_DEBIT'teki freeText gibi tespit
   * eder). Var olan çağıranlar (yalnızca freeText) hash biçimini değiştirir —
   * bkz. worker notu: bu, deploy anında tam o flowId için yarım kalmış bir
   * retry varsa (çok nadir) "farklı istek içeriği" hatasına yol açabilir.
   */
  computePromptHash(input: {
    freeText?: string;
    extra?: Record<string, unknown>;
  }): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          freeText: input.freeText ?? null,
          extra: input.extra ?? null,
        }),
      )
      .digest('hex');
  }

  private assertPromptHashMatches(
    existingHash: string | undefined,
    promptHash: string,
  ) {
    // Eski kayıtlarda promptHash olmayabilir; yalnızca kayıtlı hash ile
    // gelen hash uyuşmuyorsa flowId yeniden kullanımı olarak reddet.
    if (existingHash && existingHash !== promptHash) {
      throw new ForbiddenException(
        'Bu flowId farklı bir istek içeriğiyle zaten kullanılmış.',
      );
    }
  }

  /**
   * `reason` opsiyoneldir ve varsayılan olarak RECOMMENDATION_DEBIT'tir —
   * mevcut çağrı yerleri (createRecommendation) davranışı değişmeden
   * çalışmaya devam eder. Chat akışı (ai-chat modülü) kendi
   * CHAT_MESSAGE_DEBIT reason'ını geçirerek aynı deseni yeniden kullanır.
   * `amount` da opsiyoneldir (varsayılan 1) — mevcut çağıranlar (hepsi
   * amount'u hiç geçmiyor) davranışı birebir korur. AI Vird Programı akışı
   * `VIRD_PROGRAM_CREDIT_COST` (3) geçirir.
   */
  async ensureCreditAccessForFlow(
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
    reason: AiCreditReason = AI_CREDIT_REASONS.RECOMMENDATION_DEBIT,
    amount = 1,
  ): Promise<{ alreadyDebited: boolean; fulfilled: boolean }> {
    const existingDebit = await this.aiCreditLedgerModel
      .findOne({
        userId,
        reason,
        flowId,
      })
      .lean()
      .exec();

    if (existingDebit) {
      this.assertPromptHashMatches(existingDebit.promptHash, promptHash);
      return {
        alreadyDebited: true,
        fulfilled: Boolean(existingDebit.metadata?.fulfilledRef),
      };
    }

    const creditState = await this.ensureCreditState(userId, isPremium);
    if (creditState.balance >= amount) {
      return { alreadyDebited: false, fulfilled: false };
    }

    throw new ForbiddenException({
      code: AI_CREDIT_INSUFFICIENT_CODE,
      message:
        'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
    });
  }

  /**
   * Debit satırına "karşılığı teslim edildi" makbuzu düşer (ör. AI vird
   * taslağının id'si). Makbuzlu bir debit'in ürünü sonradan kaybolursa
   * (silme, vazgeç, TTL, arşiv sınırı) aynı flowId bir daha kredisiz ürün
   * üretmez; makbuzsuz debit = debit ile yazım arasında çöken istek → retry
   * kredisiz yeniden üretebilir (AIV-06).
   */
  async markFlowFulfilled(
    userId: Types.ObjectId,
    flowId: string,
    reason: AiCreditReason,
    fulfilledRef: string,
  ): Promise<void> {
    await this.aiCreditLedgerModel
      .updateOne(
        { userId, reason, flowId },
        { $set: { 'metadata.fulfilledRef': fulfilledRef } },
      )
      .exec();
  }

  async debitCreditForFlow(
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
    reason: AiCreditReason = AI_CREDIT_REASONS.RECOMMENDATION_DEBIT,
    amount = 1,
  ): Promise<{ balance: number; created: boolean }> {
    const existingDebit = await this.aiCreditLedgerModel
      .findOne({
        userId,
        reason,
        flowId,
      })
      .lean()
      .exec();

    if (existingDebit) {
      this.assertPromptHashMatches(existingDebit.promptHash, promptHash);
      const wallet = await this.aiCreditWalletModel
        .findOne({ userId })
        .lean()
        .exec();
      return { balance: wallet?.balance ?? 0, created: false };
    }

    const creditState = await this.ensureCreditState(userId, isPremium);
    if (creditState.balance < amount) {
      throw new ForbiddenException({
        code: AI_CREDIT_INSUFFICIENT_CODE,
        message:
          'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
      });
    }

    // Önce ledger'a yaz: unique index (userId, reason, flowId) sayesinde
    // eşzamanlı istekler E11000 alır ve idempotent retry yoluna düşer.
    try {
      await this.aiCreditLedgerModel.create({
        userId,
        reason,
        delta: -amount,
        flowId,
        promptHash,
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        const duplicateDebit = await this.aiCreditLedgerModel
          .findOne({
            userId,
            reason,
            flowId,
          })
          .lean()
          .exec();
        this.assertPromptHashMatches(duplicateDebit?.promptHash, promptHash);
        const currentWallet = await this.aiCreditWalletModel
          .findOne({ userId })
          .lean()
          .exec();
        return { balance: currentWallet?.balance ?? 0, created: false };
      }
      throw error;
    }

    // Wallet'ı TEK atomik pipeline update ile düşür: önce grant kovasından
    // (grantTake = min(grantCredits, amount)), kalanı topup kovasından
    // (topupTake = amount - grantTake). amount=1 çağıranlar için bu, eski
    // iki adımlı (önce grant $gt:0, yoksa topup $gt:0) akışla BİREBİR aynı
    // sonucu üretir — yalnızca tek bir atomik komuta indirgenmiş halidir,
    // bu yüzden kısmi bir grant+topup karışık düşüm de (amount>1) race-safe.
    // Her iki alanın yeni değeri de aynı $set aşamasında, orijinal (stage
    // öncesi) grantCredits'e göre hesaplanır — aggregation $set/$addFields
    // semantiğinde bir stage'in alanları birbirinin YENİ değerini görmez.
    // returnDocument:'before' → kesim öncesi cüzdan: kovadan alınan pay (grantTake) iade
    // (refundFlowDebit) için debit satırına yazılır.
    let walletBefore: { balance: number; grantCredits: number } | null = null;
    try {
      walletBefore = await this.aiCreditWalletModel
        .findOneAndUpdate(
          { userId, balance: { $gte: amount } },
          [
            {
              $set: {
                grantCredits: {
                  $subtract: [
                    '$grantCredits',
                    { $min: ['$grantCredits', amount] },
                  ],
                },
                topupCredits: {
                  $subtract: [
                    '$topupCredits',
                    {
                      $subtract: [amount, { $min: ['$grantCredits', amount] }],
                    },
                  ],
                },
                balance: { $subtract: ['$balance', amount] },
              },
            },
          ],
          // Mongoose 9: aggregation pipeline'lı update için updatePipeline zorunlu;
          // eksikse "Cannot pass an array to query updates" fırlatır (canlı testte 500).
          { returnDocument: 'before', updatePipeline: true },
        )
        .exec();
    } catch (error) {
      // Cüzdan güncellemesi fırlatırsa ledger kaydı yetim kalmasın: telafi sil, yeniden fırlat.
      try {
        await this.aiCreditLedgerModel
          .deleteOne({ userId, reason, flowId })
          .exec();
      } catch {
        // telafi başarısız olsa da asıl hata yüzeye çıksın
      }
      throw error;
    }

    if (!walletBefore) {
      // Düşülecek kredi kalmamış: ledger kaydını telafi olarak sil ve reddet.
      await this.aiCreditLedgerModel
        .deleteOne({
          userId,
          reason,
          flowId,
        })
        .exec();
      throw new ForbiddenException({
        code: AI_CREDIT_INSUFFICIENT_CODE,
        message:
          'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
      });
    }

    const balanceAfter = walletBefore.balance - amount;
    const grantTake = Math.min(walletBefore.grantCredits, amount);
    // balanceAfter bilgilendirme amaçlı; başarısız olsa da akışı bozmasın.
    try {
      await this.aiCreditLedgerModel
        .updateOne(
          {
            userId,
            reason,
            flowId,
          },
          { $set: { balanceAfter, 'metadata.grantTake': grantTake } },
        )
        .exec();
    } catch (error) {
      this.logger.warn(
        `Ledger balanceAfter güncellenemedi (flow ${flowId}): ${this.describeError(error)}`,
      );
    }

    return { balance: balanceAfter, created: true };
  }

  /**
   * AIV-06: makbuzsuz debit'in (debit ile teslim arasında çöken istek ya da
   * a801253 öncesi eski satır) kurtarma koşusunu atomik talep eder. Talep
   * zamanını döner (serbest bırakma anahtarı) ya da null → teslim edilmiş,
   * satır yok veya başka bir kurtarma sürüyor (çağıran 409 verir). Kira
   * süresinden eski talep, sahibi öldüğü için yeniden talep edilebilir.
   */
  async claimFlowRecovery(
    userId: Types.ObjectId,
    flowId: string,
    reason: AiCreditReason,
  ): Promise<Date | null> {
    const now = new Date();
    const result = await this.aiCreditLedgerModel
      .updateOne(
        {
          userId,
          reason,
          flowId,
          'metadata.fulfilledRef': { $exists: false },
          $or: [
            { 'metadata.recoveryAt': { $exists: false } },
            {
              'metadata.recoveryAt': {
                $lte: new Date(now.getTime() - AI_REQUEST_LEASE_MS),
              },
            },
          ],
        },
        { $set: { 'metadata.recoveryAt': now } },
      )
      .exec();
    return result.modifiedCount === 1 ? now : null;
  }

  /**
   * Başarısız kurtarma koşusu talebini bırakır (iade YERİNE): satırın teslim
   * durumu bilinmez (eski satır teslim edilmiş olabilir), iade kredi basardı.
   * Kullanıcı aynı flowId ile yeniden dener; her deneme günlük ücretsiz koşu
   * sınırına sayılır.
   */
  async releaseFlowRecovery(
    userId: Types.ObjectId,
    flowId: string,
    reason: AiCreditReason,
    claimedAt: Date,
  ): Promise<void> {
    await this.aiCreditLedgerModel
      .updateOne(
        { userId, reason, flowId, 'metadata.recoveryAt': claimedAt },
        { $unset: { 'metadata.recoveryAt': 1 } },
      )
      .exec();
  }

  /**
   * Teslim (taslak yazımı) ÖNCESİ debit satırına bu isteğin token'ını ekler.
   * refundFlowDebit token'lı satırı silmez: iade ile eşzamanlı bir teslim
   * aynı belgede sıralanır — ya iade önce siler (rezervasyon false → taslak
   * yazılmaz) ya da rezervasyon önce gelir (iade etkisiz). false → debit yok.
   */
  async reserveFlowDelivery(
    userId: Types.ObjectId,
    flowId: string,
    reason: AiCreditReason,
    token: string,
  ): Promise<boolean> {
    const result = await this.aiCreditLedgerModel
      .updateOne(
        { userId, reason, flowId },
        { $addToSet: { 'metadata.delivering': token } },
      )
      .exec();
    return result.matchedCount === 1;
  }

  /** Taslak yazılamadıysa rezervasyonu geri alır (iade yolunu açar). */
  async releaseFlowDelivery(
    userId: Types.ObjectId,
    flowId: string,
    reason: AiCreditReason,
    token: string,
  ): Promise<void> {
    await this.aiCreditLedgerModel
      .updateOne(
        { userId, reason, flowId },
        { $pull: { 'metadata.delivering': token } },
      )
      .exec();
  }

  /**
   * Bu isteğin YAZDIĞI ve teslim edilemeyen debit'i iade eder: satır atomik
   * silinir (makbuz ya da teslim rezervasyonu varsa silinmez; eşzamanlı iki
   * iade tek kez uygular), kesilen kredi alındığı kovalara döner. flowId taze
   * hale gelir: aynı flowId ile yeni deneme normal ücretlendirilir.
   * Kredi basmaz: grant payı yalnız kesimin yapıldığı grant döngüsü (UTC gün /
   * premium ay) hâlâ sürüyorsa döner — döngü sıfırlandıysa o kredi zaten
   * sönmüştü. Kova payı bilinmeyen satırın tamamı grant payı sayılır (kalıcı
   * topup kredisi basılmaz).
   */
  async refundFlowDebit(
    userId: Types.ObjectId,
    flowId: string,
    reason: AiCreditReason,
  ): Promise<boolean> {
    const debit = await this.aiCreditLedgerModel
      .findOneAndDelete({
        userId,
        reason,
        flowId,
        'metadata.fulfilledRef': { $exists: false },
        'metadata.delivering.0': { $exists: false },
      })
      .lean()
      .exec();
    if (!debit || debit.delta >= 0) return false;
    const amount = -debit.delta;
    const recordedGrantTake = debit.metadata?.grantTake;
    const grantTake =
      typeof recordedGrantTake === 'number' ? recordedGrantTake : amount;
    const debitedAt = new Date(debit.createdAt).toISOString();
    const sameGrantCycle = {
      $in: ['$grantCycleKey', [debitedAt.slice(0, 10), debitedAt.slice(0, 7)]],
    };
    await this.aiCreditWalletModel
      .updateOne(
        { userId },
        [
          {
            $set: {
              grantCredits: {
                $add: [
                  '$grantCredits',
                  { $cond: [sameGrantCycle, grantTake, 0] },
                ],
              },
              topupCredits: { $add: ['$topupCredits', amount - grantTake] },
            },
          },
          { $set: WALLET_BALANCE_STAGE },
        ],
        { updatePipeline: true },
      )
      .exec();
    this.logger.warn(
      `Flow debit iade edildi (flow ${flowId}, ${reason}, ${amount} kredi)`,
    );
    return true;
  }

  /**
   * Kötüye kullanım sınırları (AI_REQUEST_IN_FLIGHT / AI_DAILY_FREE_LIMIT):
   * `run`'ı kullanıcının tek AI kirasını tutarak çalıştırır. Kira cüzdan
   * belgesindedir (kullanıcı başına tek, unique) — çok örnekte de geçerli;
   * süresi geçen kira (ölü süreç) devralınır, kira finally'de bırakılır.
   * `run` ücretlendiğini `markCharged()` ile bildirmezse koşu günün kredisiz
   * koşu sayacına yazılır; sayaç sınırdaysa run hiç çalışmaz. Kayıtlı sonucun
   * tekrarı (replay) bu çağrıdan ÖNCE dönmelidir: ne engellenir ne sayılır.
   */
  async runGuarded<T>(
    userId: Types.ObjectId,
    run: (markCharged: () => void) => Promise<T>,
  ): Promise<T> {
    const token = randomUUID();
    const now = new Date();
    const dayKey = toUtcDayKey(now);
    let wallet: Pick<AiCreditWallet, 'freeRunDayKey' | 'freeRunCount'> | null;
    try {
      wallet = await this.aiCreditWalletModel
        .findOneAndUpdate(
          {
            userId,
            $or: [
              { aiLeaseExpiresAt: null },
              { aiLeaseExpiresAt: { $lte: now } },
            ],
          },
          {
            $set: {
              aiLeaseToken: token,
              aiLeaseExpiresAt: new Date(now.getTime() + AI_REQUEST_LEASE_MS),
            },
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        .lean()
        .exec();
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
      throw new HttpException(
        {
          code: AI_REQUEST_IN_FLIGHT_CODE,
          message:
            'Önceki AI isteğin hâlâ işleniyor. Bitince tekrar deneyebilirsin.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      if (
        wallet?.freeRunDayKey === dayKey &&
        (wallet.freeRunCount ?? 0) >= AI_DAILY_FREE_RUN_LIMIT
      ) {
        throw new HttpException(
          {
            code: AI_DAILY_FREE_LIMIT_CODE,
            message:
              'Bugünlük kredi düşmeyen AI deneme sınırına ulaştın. Yarın tekrar deneyebilirsin.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      let charged = false;
      try {
        return await run(() => {
          charged = true;
        });
      } finally {
        // Kira altında: oku-yaz yarışı yok. Pipeline: gün değiştiyse 1'den başlar.
        if (!charged)
          await this.aiCreditWalletModel
            .updateOne(
              { userId },
              [
                {
                  $set: {
                    freeRunCount: {
                      $cond: [
                        { $eq: ['$freeRunDayKey', dayKey] },
                        { $add: [{ $ifNull: ['$freeRunCount', 0] }, 1] },
                        1,
                      ],
                    },
                    freeRunDayKey: dayKey,
                  },
                },
              ],
              { updatePipeline: true },
            )
            .exec()
            .catch((error: unknown) =>
              this.logger.warn(
                `Kredisiz koşu sayacı yazılamadı: ${this.describeError(error)}`,
              ),
            );
      }
    } finally {
      await this.aiCreditWalletModel
        .updateOne(
          { userId, aiLeaseToken: token },
          { $unset: { aiLeaseToken: 1, aiLeaseExpiresAt: 1 } },
        )
        .exec()
        .catch((error: unknown) =>
          this.logger.warn(
            `AI kirası bırakılamadı: ${this.describeError(error)}`,
          ),
        );
    }
  }

  async ensureCreditState(
    userId: Types.ObjectId,
    isPremium: boolean,
  ): Promise<CreditState> {
    let wallet = await this.findOrCreateWallet(userId);
    const grant = await this.resolveGrantStatus(userId, isPremium);

    if (
      wallet.grantReason !== grant.reason ||
      wallet.grantCycleKey !== grant.cycleKey
    ) {
      // Grant yalnızca ledger insert'i başarılıysa uygulanır: unique index
      // (dayKey/monthKey) aynı döngüde ikinci grant'i engeller — premium⇄free
      // toggle'ında aylık grant tekrar verilmez. Yeni döngüde grantCredits
      // BİRİKMEZ (önceki döngünün artığı sıfırlanır), topupCredits'e dokunulmaz.
      let grantApplied = false;
      try {
        await this.aiCreditLedgerModel.create({
          userId,
          reason: grant.reason,
          delta: grant.amount,
          ...(grant.dayKey ? { dayKey: grant.dayKey } : {}),
          ...(grant.monthKey ? { monthKey: grant.monthKey } : {}),
        });
        grantApplied = true;
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }
      }

      if (!grantApplied) {
        const settled = await this.awaitConcurrentGrant(userId, grant);
        if (settled) return this.toCreditState(settled, isPremium);
      }

      // A-08: kova bu ayın aylık premium kredisini taşıyorsa, premium bitince
      // ücretsiz günlük grant onu SİLMEZ (en az günlük miktar kadar kalır);
      // aynı ay yeniden premium olunca (aylık ledger zaten var) kalan hak korunur.
      const monthKey = grant.monthKey ?? grant.cycleKey.slice(0, 7);
      const holdsMonthly =
        wallet.carryMonthKey === monthKey ||
        (wallet.grantReason === AI_CREDIT_REASONS.PREMIUM_MONTHLY_GRANT &&
          wallet.grantCycleKey === monthKey);
      const carryMonthKey =
        isPremium || holdsMonthly
          ? monthKey
          : grantApplied
            ? null
            : (wallet.carryMonthKey ?? null);
      const grantCredits = !grantApplied
        ? '$grantCredits'
        : !isPremium && holdsMonthly
          ? { $max: ['$grantCredits', grant.amount] }
          : grant.amount;

      // Pipeline: bakiye canlı alanlardan hesaplanır — eşzamanlı topup/debit
      // bayat okumayla ezilmez (CRD-18).
      wallet =
        (await this.aiCreditWalletModel
          .findOneAndUpdate(
            { userId },
            [
              {
                $set: {
                  grantReason: grant.reason,
                  grantCycleKey: grant.cycleKey,
                  carryMonthKey,
                  grantCredits,
                },
              },
              { $set: WALLET_BALANCE_STAGE },
            ],
            { returnDocument: 'after', updatePipeline: true },
          )
          .exec()) ?? wallet;
    } else {
      const nextBalance =
        Math.max(0, wallet.topupCredits) + Math.max(0, wallet.grantCredits);
      if (wallet.balance !== nextBalance) {
        wallet =
          (await this.aiCreditWalletModel
            .findOneAndUpdate(
              { userId },
              [
                {
                  $set: {
                    topupCredits: { $max: [0, '$topupCredits'] },
                    grantCredits: { $max: [0, '$grantCredits'] },
                  },
                },
                { $set: WALLET_BALANCE_STAGE },
              ],
              { returnDocument: 'after', updatePipeline: true },
            )
            .exec()) ?? wallet;
      }
    }

    return this.toCreditState(wallet, isPremium);
  }

  private toCreditState(
    wallet: AiCreditWalletDocument,
    isPremium: boolean,
  ): CreditState {
    return {
      balance: wallet.balance,
      isPremium,
      dailyGrant: isPremium ? 0 : Math.max(0, wallet.grantCredits),
      monthlyGrant: isPremium ? PREMIUM_MONTHLY_CREDIT_AMOUNT : 0,
      wallet,
    };
  }

  /**
   * Aynı döngünün grant ledger satırını eşzamanlı başka bir istek az önce
   * yazdıysa (E11000), onun cüzdan güncellemesini bekle — yoksa bu istek grant
   * yazılmadan önceki bakiyeyi (ör. 0) görüp yersiz 403 verir (CRD-11/13).
   * ponytail: 20×25 ms yoklama; uygulayan istek ledger ile cüzdan arasında
   * çökerse grant kaybolur (önceden de böyleydi).
   */
  private async awaitConcurrentGrant(
    userId: Types.ObjectId,
    grant: {
      reason: AiCreditReason;
      cycleKey: string;
      dayKey?: string;
      monthKey?: string;
    },
  ): Promise<AiCreditWalletDocument | null> {
    const row = await this.aiCreditLedgerModel
      .findOne({
        userId,
        reason: grant.reason,
        ...(grant.dayKey ? { dayKey: grant.dayKey } : {}),
        ...(grant.monthKey ? { monthKey: grant.monthKey } : {}),
      })
      .lean()
      .exec();
    const createdAt = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
    if (Date.now() - createdAt > 5_000) return null;

    for (let attempt = 0; attempt < 20; attempt++) {
      const wallet = await this.aiCreditWalletModel.findOne({ userId }).exec();
      if (
        wallet?.grantReason === grant.reason &&
        wallet.grantCycleKey === grant.cycleKey
      ) {
        return wallet;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return null;
  }

  /** B8/CRD-13: eşzamanlı ilk istekler E11000 → 500 vermesin; upsert + yarışı kaybeden yeniden okur. */
  private async findOrCreateWallet(
    userId: Types.ObjectId,
  ): Promise<AiCreditWalletDocument> {
    let wallet: AiCreditWalletDocument | null = null;
    try {
      wallet = await this.aiCreditWalletModel
        .findOneAndUpdate(
          { userId },
          { $setOnInsert: { userId } },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        .exec();
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
    }
    wallet ??= await this.aiCreditWalletModel.findOne({ userId }).exec();
    if (!wallet)
      throw new Error(`AI cüzdanı oluşturulamadı: ${String(userId)}`);
    return wallet;
  }

  private async resolveGrantStatus(
    userId: Types.ObjectId,
    isPremium: boolean,
  ): Promise<{
    reason: AiCreditReason;
    cycleKey: string;
    amount: number;
    dayKey?: string;
    monthKey?: string;
  }> {
    const now = new Date();
    if (isPremium) {
      const monthKey = toUtcMonthKey(now);
      return {
        reason: AI_CREDIT_REASONS.PREMIUM_MONTHLY_GRANT,
        cycleKey: monthKey,
        amount: PREMIUM_MONTHLY_CREDIT_AMOUNT,
        monthKey,
      };
    }

    const dayKey = toUtcDayKey(now);
    // Kullanıcı hiç FREE_DAILY_GRANT almamışsa (ilk kez AI'ya dokunduğu gün)
    // karşılama bonusu olarak FREE_SIGNUP_BONUS_CREDIT_AMOUNT ver; sonraki
    // her gün normal FREE_DAILY_CREDIT_AMOUNT'a döner.
    const hasPriorFreeGrant = Boolean(
      await this.aiCreditLedgerModel
        .exists({ userId, reason: AI_CREDIT_REASONS.FREE_DAILY_GRANT })
        .exec(),
    );

    return {
      reason: AI_CREDIT_REASONS.FREE_DAILY_GRANT,
      cycleKey: dayKey,
      amount: hasPriorFreeGrant
        ? FREE_DAILY_CREDIT_AMOUNT
        : FREE_SIGNUP_BONUS_CREDIT_AMOUNT,
      dayKey,
    };
  }

  private resolveTopupCredits(productId: string): number {
    const raw = this.configService
      .get<string>('AI_CREDIT_TOPUP_PRODUCTS')
      ?.trim();

    if (!raw) {
      // Env override yoksa tek kaynak: credits.constants.ts default kataloğu
      // (mobil CREDIT_TOPUP_CREDITS ile birebir aynı).
      return AI_CREDIT_DEFAULT_TOPUP_PRODUCTS[productId.trim()] ?? 0;
    }

    if (this.topupCatalogCacheRaw !== raw || !this.topupCatalogCache) {
      this.topupCatalogCacheRaw = raw;
      this.topupCatalogCache = parseTopupCatalog(raw);
    }

    const key = productId.trim();
    return this.topupCatalogCache.get(key) ?? 0;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return (error as { code?: unknown }).code === 11000;
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : 'bilinmeyen hata';
  }

  private async ensureUserExists(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user;
  }

  private asObjectId(rawId: string, message: string) {
    if (!Types.ObjectId.isValid(rawId)) throw new NotFoundException(message);
    return new Types.ObjectId(rawId);
  }
}

// İkinci pipeline aşaması: bakiye = grant + topup (ilk aşamanın YENİ değerleriyle).
const WALLET_BALANCE_STAGE = {
  balance: { $add: ['$grantCredits', '$topupCredits'] },
};

function toUtcDayKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toUtcMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseTopupCatalog(raw: string): Map<string, number> {
  const bySku = new Map<string, number>();

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [sku, amount] of Object.entries(parsed)) {
      const normalized = Number(amount);
      if (sku.trim() && Number.isFinite(normalized) && normalized > 0) {
        bySku.set(sku.trim(), Math.floor(normalized));
      }
    }
    return bySku;
  } catch {
    // json değilse csv formatına düş
  }

  raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [skuRaw, amountRaw] = part.split(':');
      const sku = skuRaw?.trim();
      const amount = Number(amountRaw?.trim());
      if (sku && Number.isFinite(amount) && amount > 0) {
        bySku.set(sku, Math.floor(amount));
      }
    });

  return bySku;
}
