import { ForbiddenException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AiService } from './ai.service';

type PrivateAiService = {
  debitCreditForFlow: (
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
  ) => Promise<{ balance: number }>;
  ensureCreditAccessForFlow: (
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
  ) => Promise<void>;
  logger: Logger;
};

type WalletState = {
  userId: Types.ObjectId;
  balance: number;
  grantCredits: number;
  topupCredits: number;
  grantReason?: string;
  grantCycleKey?: string;
};

type LedgerEntry = {
  userId?: Types.ObjectId;
  reason: string;
  delta: number;
  balanceAfter?: number;
  dayKey?: string;
  monthKey?: string;
  flowId?: string;
  promptHash?: string;
  providerEventId?: string;
  metadata?: Record<string, unknown>;
};

type MongoFilter = Record<string, unknown>;

function createService(initialPremium = false) {
  const user = { _id: new Types.ObjectId(), isPremium: initialPremium };
  let wallet: WalletState | null = null;
  const ledger: LedgerEntry[] = [];

  const walletMatches = (filter: MongoFilter): boolean => {
    if (!wallet) return false;
    for (const [key, condition] of Object.entries(filter)) {
      const value = (wallet as unknown as Record<string, unknown>)[key];
      if (key === 'userId') {
        if (!wallet.userId.equals(condition as Types.ObjectId)) return false;
        continue;
      }
      if (
        condition &&
        typeof condition === 'object' &&
        '$gt' in (condition as Record<string, unknown>)
      ) {
        if (!((value as number) > (condition as { $gt: number }).$gt)) {
          return false;
        }
        continue;
      }
      if (value !== condition) return false;
    }
    return true;
  };

  const applyWalletUpdate = (update: {
    $set?: Partial<WalletState>;
    $inc?: Partial<Record<'balance' | 'grantCredits' | 'topupCredits', number>>;
  }) => {
    if (!wallet) return;
    if (update.$set) {
      wallet = { ...wallet, ...update.$set };
    }
    if (update.$inc) {
      for (const [key, amount] of Object.entries(update.$inc)) {
        const target = wallet as unknown as Record<string, number>;
        target[key] = (target[key] ?? 0) + amount;
      }
    }
  };

  const walletModel = {
    findOne: jest.fn((filter: { userId: Types.ObjectId }) => ({
      exec: () =>
        wallet && wallet.userId.equals(filter.userId) ? { ...wallet } : null,
      lean: () => ({
        exec: () =>
          wallet && wallet.userId.equals(filter.userId) ? { ...wallet } : null,
      }),
    })),
    create: jest.fn((payload: { userId: Types.ObjectId }) => {
      wallet = {
        userId: payload.userId,
        balance: 0,
        grantCredits: 0,
        topupCredits: 0,
      };
      return { ...wallet };
    }),
    findOneAndUpdate: jest.fn(
      (
        filter: MongoFilter,
        update: {
          $set?: Partial<WalletState>;
          $inc?: Partial<
            Record<'balance' | 'grantCredits' | 'topupCredits', number>
          >;
        },
        options?: { upsert?: boolean },
      ) => ({
        exec: () => {
          if (!walletMatches(filter)) {
            const onlyUserId = Object.keys(filter).every(
              (key) => key === 'userId',
            );
            if (options?.upsert && onlyUserId) {
              wallet = {
                userId: filter.userId as Types.ObjectId,
                balance: 0,
                grantCredits: 0,
                topupCredits: 0,
              };
            } else {
              return null;
            }
          }
          applyWalletUpdate(update);
          return wallet ? { ...wallet } : null;
        },
      }),
    ),
    updateOne: jest.fn(
      (
        filter: { userId: Types.ObjectId },
        update: { $set?: Partial<WalletState> },
      ) => ({
        exec: () => {
          if (!wallet || !wallet.userId.equals(filter.userId)) {
            wallet = {
              userId: filter.userId,
              balance: 0,
              grantCredits: 0,
              topupCredits: 0,
            };
          }
          applyWalletUpdate(update);
          return { acknowledged: true };
        },
      }),
    ),
  };

  const ledgerMatches = (item: LedgerEntry, filter: MongoFilter): boolean => {
    for (const [key, condition] of Object.entries(filter)) {
      if (key === 'userId') {
        if (!item.userId?.equals(condition as Types.ObjectId)) return false;
        continue;
      }
      if ((item as unknown as Record<string, unknown>)[key] !== condition) {
        return false;
      }
    }
    return true;
  };

  const ledgerModel = {
    create: jest.fn((entry: LedgerEntry) => {
      const duplicate = ledger.some((item) => {
        if (
          entry.reason === 'FREE_DAILY_GRANT' &&
          item.reason === entry.reason &&
          item.userId?.equals(entry.userId ?? '') &&
          item.dayKey === entry.dayKey
        ) {
          return true;
        }

        if (
          entry.reason === 'PREMIUM_MONTHLY_GRANT' &&
          item.reason === entry.reason &&
          item.userId?.equals(entry.userId ?? '') &&
          item.monthKey === entry.monthKey
        ) {
          return true;
        }

        if (
          entry.reason === 'RECOMMENDATION_DEBIT' &&
          item.reason === entry.reason &&
          item.userId?.equals(entry.userId ?? '') &&
          item.flowId === entry.flowId
        ) {
          return true;
        }

        if (
          entry.reason === 'TOPUP_PURCHASE' &&
          item.reason === entry.reason &&
          item.providerEventId === entry.providerEventId
        ) {
          return true;
        }

        return false;
      });

      if (duplicate) {
        throw Object.assign(new Error('E11000 duplicate key error'), {
          code: 11000,
        });
      }

      ledger.push({ ...entry });
      return entry;
    }),
    exists: jest.fn((filter: MongoFilter) => ({
      exec: () => {
        const found = ledger.some((item) => ledgerMatches(item, filter));
        return found ? { _id: 'existing' } : null;
      },
    })),
    findOne: jest.fn((filter: MongoFilter) => ({
      lean: () => ({
        exec: () => ledger.find((item) => ledgerMatches(item, filter)) ?? null,
      }),
    })),
    updateOne: jest.fn(
      (filter: MongoFilter, update: { $set?: Partial<LedgerEntry> }) => ({
        exec: () => {
          const item = ledger.find((entry) => ledgerMatches(entry, filter));
          if (item && update.$set) {
            Object.assign(item, update.$set);
          }
          return { acknowledged: true };
        },
      }),
    ),
    deleteOne: jest.fn((filter: MongoFilter) => ({
      exec: () => {
        const index = ledger.findIndex((entry) => ledgerMatches(entry, filter));
        if (index >= 0) {
          ledger.splice(index, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
    })),
  };

  const userModel = {
    findById: jest.fn(() => ({
      lean: () => ({ exec: () => ({ ...user }) }),
    })),
  };

  const configService = {
    // AI_CREDIT_TOPUP_PRODUCTS env yok → credits.constants.ts'teki
    // AI_CREDIT_DEFAULT_TOPUP_PRODUCTS default kataloğu devrede.
    get: jest.fn(() => undefined),
  };

  const service = new AiService(
    { emitStep: jest.fn() } as never,
    configService as never,
    {} as never,
    {} as never,
    walletModel as never,
    ledgerModel as never,
    {} as never,
    {} as never,
    userModel as never,
    {} as never,
  );

  return {
    service,
    user,
    ledger,
    walletModel,
    ledgerModel,
    setPremium: (value: boolean) => {
      user.isPremium = value;
    },
    seedWallet: (state: Partial<WalletState> & { userId?: Types.ObjectId }) => {
      wallet = {
        userId: state.userId ?? user._id,
        balance: 0,
        grantCredits: 0,
        topupCredits: 0,
        ...state,
      };
    },
  };
}

const USER_ID = '507f1f77bcf86cd799439011';

describe('AiService credits', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('grants a 3-credit welcome bonus on the first ever free grant, then 1/day', async () => {
    jest.setSystemTime(new Date('2026-07-08T10:00:00.000Z'));
    const { service, ledger } = createService(false);

    const first = await service.getCredits(USER_ID);
    const sameDayAgain = await service.getCredits(USER_ID);

    expect(first.balance).toBe(3);
    expect(sameDayAgain.balance).toBe(3);
    expect(
      ledger.filter((entry) => entry.reason === 'FREE_DAILY_GRANT').length,
    ).toBe(1);

    jest.setSystemTime(new Date('2026-07-09T10:00:00.000Z'));
    const nextDay = await service.getCredits(USER_ID);

    expect(nextDay.balance).toBe(1);
    expect(
      ledger.filter((entry) => entry.reason === 'FREE_DAILY_GRANT').length,
    ).toBe(2);
  });

  it('grants premium credits once per UTC month and adds new grant on next month', async () => {
    const { service, ledger } = createService(true);

    jest.setSystemTime(new Date('2026-07-08T10:00:00.000Z'));
    const july = await service.getCredits(USER_ID);
    expect(july.balance).toBe(50);

    jest.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));
    const julyAgain = await service.getCredits(USER_ID);
    expect(julyAgain.balance).toBe(50);

    // Yeni ay: grant $set ile döngüde sıfırlanır, temmuzdan kalan grant
    // birikmez (topupCredits olmadığı için bakiye yalnızca yeni grant kadar).
    jest.setSystemTime(new Date('2026-08-01T00:00:01.000Z'));
    const august = await service.getCredits(USER_ID);
    expect(august.balance).toBe(50);

    expect(
      ledger.filter((entry) => entry.reason === 'PREMIUM_MONTHLY_GRANT').length,
    ).toBe(2);
  });

  it('debits only once for same flowId and same promptHash', async () => {
    jest.setSystemTime(new Date('2026-07-08T10:00:00.000Z'));
    const { service, ledger } = createService(false);

    await service.getCredits(USER_ID);

    const result1 = await (
      service as unknown as PrivateAiService
    ).debitCreditForFlow(
      new Types.ObjectId(USER_ID),
      'flow-1',
      false,
      'hash-a',
    );
    const result2 = await (
      service as unknown as PrivateAiService
    ).debitCreditForFlow(
      new Types.ObjectId(USER_ID),
      'flow-1',
      false,
      'hash-a',
    );

    expect(result1.balance).toBe(2);
    expect(result2.balance).toBe(2);
    expect(
      ledger.filter((entry) => entry.reason === 'RECOMMENDATION_DEBIT').length,
    ).toBe(1);
  });

  it('rejects reused flowId with different promptHash', async () => {
    jest.setSystemTime(new Date('2026-07-08T10:00:00.000Z'));
    const { service } = createService(false);
    const userId = new Types.ObjectId(USER_ID);

    await service.getCredits(USER_ID);
    await (service as unknown as PrivateAiService).debitCreditForFlow(
      userId,
      'flow-1',
      false,
      'hash-a',
    );

    await expect(
      (service as unknown as PrivateAiService).debitCreditForFlow(
        userId,
        'flow-1',
        false,
        'hash-b',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      (service as unknown as PrivateAiService).ensureCreditAccessForFlow(
        userId,
        'flow-1',
        false,
        'hash-b',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resets grant on premium⇄free toggle (new cycle) but does not grant monthly twice in same month', async () => {
    jest.setSystemTime(new Date('2026-07-08T10:00:00.000Z'));
    const { service, ledger, setPremium } = createService(true);

    const premium = await service.getCredits(USER_ID);
    expect(premium.balance).toBe(50);

    // Downgrade: bu kullanıcı hiç FREE_DAILY_GRANT almamıştı (premium'du),
    // bu yüzden ilk free grant'ı karşılama bonusu (3) olarak verilir.
    setPremium(false);
    const free = await service.getCredits(USER_ID);
    expect(free.balance).toBe(3);

    // Aynı ay içinde tekrar premium: aylık grant için ledger kaydı zaten
    // mevcut (E11000) → wallet'a dokunulmaz, mevcut bakiye korunur.
    setPremium(true);
    const premiumAgain = await service.getCredits(USER_ID);
    expect(premiumAgain.balance).toBe(3);

    expect(
      ledger.filter((entry) => entry.reason === 'PREMIUM_MONTHLY_GRANT').length,
    ).toBe(1);
  });

  it('resets grantCredits to full grant amount on new cycle without accumulating, preserving topupCredits', async () => {
    jest.setSystemTime(new Date('2026-07-08T10:00:00.000Z'));
    const { service, walletModel, seedWallet } = createService(true);

    // Önceki döngüden kalan kullanılmayan grant (5) + satın alınmış topup (10).
    seedWallet({
      userId: new Types.ObjectId(USER_ID),
      balance: 15,
      grantCredits: 5,
      topupCredits: 10,
      grantReason: 'PREMIUM_MONTHLY_GRANT',
      grantCycleKey: '2026-06',
    });

    const result = await service.getCredits(USER_ID);
    const walletAfter = walletModel
      .findOne({ userId: new Types.ObjectId(USER_ID) })
      .exec();

    // Yeni cycle grant'i uygulanır: grantCredits tam grant miktarına
    // eşitlenir (5 + 50 birikmez), topupCredits (10) korunur.
    expect(walletAfter?.grantCredits).toBe(50);
    expect(walletAfter?.topupCredits).toBe(10);
    expect(result.balance).toBe(60);
  });

  it('applies topup only once for duplicate provider event', async () => {
    const { service } = createService(false);

    const first = await service.applyTopupPurchase({
      userId: USER_ID,
      productId: 'topupsmall',
      providerEventId: 'rc_evt_1',
    });

    const second = await service.applyTopupPurchase({
      userId: USER_ID,
      productId: 'topupsmall',
      providerEventId: 'rc_evt_1',
    });

    expect(first).toEqual({ applied: true, reason: 'ok', credits: 10 });
    expect(second).toEqual({
      applied: false,
      reason: 'duplicate_event',
      credits: 10,
    });
  });

  it('returns unknown_product with high-visibility error log for unmapped product', async () => {
    const { service, ledger } = createService(false);
    const errorSpy = jest
      .spyOn((service as unknown as PrivateAiService).logger, 'error')
      .mockImplementation(() => undefined);

    const result = await service.applyTopupPurchase({
      userId: USER_ID,
      productId: 'topup_small',
      providerEventId: 'rc_evt_unknown',
    });

    expect(result).toEqual({
      applied: false,
      reason: 'unknown_product',
      credits: 0,
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('topup_small'),
    );
    expect(ledger.length).toBe(0);
  });
});
