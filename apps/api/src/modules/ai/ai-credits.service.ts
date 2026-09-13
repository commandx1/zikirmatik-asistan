import { createHash } from 'node:crypto';
import {
  ForbiddenException,
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
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return { applied: true as const, reason: 'ok', credits };
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
  ) {
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
      return;
    }

    const creditState = await this.ensureCreditState(userId, isPremium);
    if (creditState.balance >= amount) {
      return;
    }

    throw new ForbiddenException({
      code: AI_CREDIT_INSUFFICIENT_CODE,
      message:
        'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
    });
  }

  async debitCreditForFlow(
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
    reason: AiCreditReason = AI_CREDIT_REASONS.RECOMMENDATION_DEBIT,
    amount = 1,
  ): Promise<{ balance: number }> {
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
      return { balance: wallet?.balance ?? 0 };
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
        return { balance: currentWallet?.balance ?? 0 };
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
    let updatedWallet: { balance: number } | null = null;
    try {
      updatedWallet = await this.aiCreditWalletModel
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
          { new: true, updatePipeline: true },
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

    if (!updatedWallet) {
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

    // balanceAfter bilgilendirme amaçlı; başarısız olsa da akışı bozmasın.
    try {
      await this.aiCreditLedgerModel
        .updateOne(
          {
            userId,
            reason,
            flowId,
          },
          { $set: { balanceAfter: updatedWallet.balance } },
        )
        .exec();
    } catch (error) {
      this.logger.warn(
        `Ledger balanceAfter güncellenemedi (flow ${flowId}): ${this.describeError(error)}`,
      );
    }

    return { balance: updatedWallet.balance };
  }

  async ensureCreditState(
    userId: Types.ObjectId,
    isPremium: boolean,
  ): Promise<CreditState> {
    const initialWallet =
      (await this.aiCreditWalletModel.findOne({ userId }).exec()) ??
      (await this.aiCreditWalletModel.create({ userId }));

    const grant = await this.resolveGrantStatus(userId, isPremium);
    let wallet = initialWallet;

    if (
      wallet.grantReason !== grant.reason ||
      wallet.grantCycleKey !== grant.cycleKey
    ) {
      // Grant yalnızca ledger insert'i başarılıysa uygulanır: unique index
      // (dayKey/monthKey) aynı döngüde ikinci grant'i engeller. Böylece
      // premium⇄free toggle'ında aylık grant tekrar verilmez ve mevcut
      // bakiye korunur (downgrade'de krediler sıfırlanmaz). Yeni döngüde
      // grant uygulandığında ise grantCredits BİRİKMEZ: kullanılmayan
      // önceki grant döngü değişince sıfırlanır ($set), topupCredits'e
      // dokunulmaz.
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

      wallet =
        (await this.aiCreditWalletModel
          .findOneAndUpdate(
            { userId },
            {
              $set: {
                grantReason: grant.reason,
                grantCycleKey: grant.cycleKey,
                ...(grantApplied
                  ? {
                      grantCredits: grant.amount,
                      balance: Math.max(0, wallet.topupCredits) + grant.amount,
                    }
                  : {}),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
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
              {
                $set: {
                  topupCredits: Math.max(0, wallet.topupCredits),
                  grantCredits: Math.max(0, wallet.grantCredits),
                  balance: nextBalance,
                },
              },
              { new: true },
            )
            .exec()) ?? wallet;
      }
    }

    return {
      balance: wallet.balance,
      isPremium,
      dailyGrant: isPremium ? 0 : Math.max(0, wallet.grantCredits),
      monthlyGrant: isPremium ? PREMIUM_MONTHLY_CREDIT_AMOUNT : 0,
      wallet,
    };
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
