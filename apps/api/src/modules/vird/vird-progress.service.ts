import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { StreaksService } from '../streaks/streaks.service';
import {
  VirdDayProgress,
  type VirdDayProgressDocument,
} from './schemas/vird-day-progress.schema';
import {
  VirdProgram,
  type VirdProgramDocument,
} from './schemas/vird-program.schema';
import { completeExpiredJourneys } from './utils/complete-expired-journeys';
import {
  dayIndexFor,
  daysBetween,
  expectedItemsForDay,
  isDayComplete,
} from './utils/vird-day';
import {
  buildVirdItemKey,
  resolveDhikrRef,
  VIRD_SLOT_KEYS,
  type VirdSlotKey,
} from './vird.types';

const HISTORY_DEFAULT_DAYS = 30;
// vird_day_progress'in kendi TTL'i (400 gün) ile hizalı — bu pencerenin
// ötesinde zaten veri yok, dolayısıyla history yanıtı da bununla sınırlanır.
const HISTORY_MAX_DAYS = 400;

type VirdSlotItemView = {
  itemKey: string;
  prayerIndex: number | null;
  dhikrId?: string;
  customDhikrId?: string;
  count: number;
  target: number;
  completed: boolean;
};

type VirdSlotView = {
  items: VirdSlotItemView[];
  done: boolean;
};

@Injectable()
export class VirdProgressService {
  constructor(
    @InjectModel(VirdProgram.name)
    private readonly virdProgramModel: Model<VirdProgramDocument>,
    @InjectModel(VirdDayProgress.name)
    private readonly virdDayProgressModel: Model<VirdDayProgressDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    private readonly streaksService: StreaksService,
  ) {}

  /**
   * Vird alanlı bir dhikr_logs yazımından sonra çağrılır: programı bulur,
   * o günkü beklenen item'ları hesaplar, o günkü vird loglarını okuyup
   * vird_day_progress'i türetir/upsert eder. Gün tamamlanınca vird serisini
   * günceller. Çağıran taraf (DhikrLogsService) bunu best-effort (try/catch)
   * sarmalar; bu metodun kendisi de programı/veriyi bulamazsa sessizce döner.
   */
  async applyLogWrite(input: {
    userId: string;
    virdProgramId: string;
    date: string;
  }): Promise<void> {
    const userObjectId = this.asObjectId(input.userId);
    const programObjectId = this.asObjectId(input.virdProgramId);

    const program = await this.virdProgramModel
      .findOne({ _id: programObjectId, userId: userObjectId })
      .lean()
      .exec();
    if (!program) {
      return;
    }

    const dayIndex = dayIndexFor(program, input.date);
    const expected = expectedItemsForDay(program, dayIndex);
    const countByItemKey = await this.countsByItemKey(
      userObjectId,
      programObjectId,
      input.date,
    );

    const completedItemKeys = expected
      .filter((item) => (countByItemKey.get(item.itemKey) ?? 0) >= item.target)
      .map((item) => item.itemKey);
    const completedSet = new Set(completedItemKeys);
    const completedSlots = VIRD_SLOT_KEYS.filter((slot) => {
      const slotExpected = expected.filter((item) => item.slot === slot);
      return (
        slotExpected.length > 0 &&
        slotExpected.every((item) => completedSet.has(item.itemKey))
      );
    });
    const dayComplete = isDayComplete(expected, countByItemKey);

    await this.virdDayProgressModel
      .findOneAndUpdate(
        {
          userId: userObjectId,
          programId: programObjectId,
          date: input.date,
        },
        {
          $set: {
            dayIndex,
            completedItemKeys,
            completedSlots,
            isDayComplete: dayComplete,
          },
          $setOnInsert: {
            userId: userObjectId,
            programId: programObjectId,
            date: input.date,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    if (dayComplete) {
      await this.streaksService.recalculateVirdForUser(input.userId);
    }
  }

  /**
   * "Bugün" ekranı: kullanıcının en güncel AKTİF programı + o günün dilim
   * bazlı ilerlemesi + vird serisi. Not: bir kullanıcının (premium) birden
   * fazla aktif programı olabilir; bu uç şimdilik yalnızca en son güncellenen
   * TEK programı döner (bkz. worker raporu — çok programlı "today" görünümü
   * sonraki bir iterasyonun kapsamı).
   */
  async getToday(userId: string, date?: string, programId?: string) {
    const objectId = this.asObjectId(userId);
    const dateKey = date ?? istanbulDateKey(new Date());
    const virdStreak = await this.getVirdStreakSnapshot(userId);

    await completeExpiredJourneys(
      this.virdProgramModel,
      objectId,
      istanbulDateKey(new Date()),
    );

    const filter: Record<string, unknown> = {
      userId: objectId,
      status: 'active',
    };
    if (programId) {
      filter._id = this.asObjectId(programId);
    }
    const program = await this.virdProgramModel
      .findOne(filter)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    if (!program) {
      return {
        program: null,
        dayIndex: 0,
        slots: {} as Partial<Record<VirdSlotKey, VirdSlotView>>,
        isDayComplete: false,
        virdStreak,
      };
    }

    const dayIndex = dayIndexFor(program, dateKey);
    const expected = expectedItemsForDay(program, dayIndex);
    const countByItemKey = await this.countsByItemKey(
      objectId,
      program._id,
      dateKey,
    );

    const slots: Partial<Record<VirdSlotKey, VirdSlotView>> = {};
    for (const slot of VIRD_SLOT_KEYS) {
      const slotExpected = expected.filter((item) => item.slot === slot);
      if (slotExpected.length === 0) {
        continue;
      }
      const items: VirdSlotItemView[] = slotExpected.map((item) => {
        const count = countByItemKey.get(item.itemKey) ?? 0;
        return {
          itemKey: item.itemKey,
          prayerIndex: item.prayerIndex,
          dhikrId: item.dhikrId,
          customDhikrId: item.customDhikrId,
          count,
          target: item.target,
          completed: count >= item.target,
        };
      });
      slots[slot] = { items, done: items.every((item) => item.completed) };
    }

    return {
      program,
      dayIndex,
      slots,
      isDayComplete: isDayComplete(expected, countByItemKey),
      virdStreak,
    };
  }

  /**
   * Gün bazlı isDayComplete listesi (tüm programlar genelinde — vird serisiyle
   * aynı global anlayış). from/to opsiyoneldir; verilmezse son 30 gün
   * (bugün dahil) döner. Aralık 400 günü (vird_day_progress TTL'i) aşarsa
   * `to`'ya göre kırpılır.
   */
  async getHistory(userId: string, from?: string, to?: string) {
    const objectId = this.asObjectId(userId);
    const todayKey = istanbulDateKey(new Date());
    const toKey = to ?? todayKey;
    let fromKey = from ?? shiftDateKey(toKey, -(HISTORY_DEFAULT_DAYS - 1));
    if (daysBetween(fromKey, toKey) > HISTORY_MAX_DAYS) {
      fromKey = shiftDateKey(toKey, -(HISTORY_MAX_DAYS - 1));
    }

    const rows = await this.virdDayProgressModel
      .find({ userId: objectId, date: { $gte: fromKey, $lte: toKey } })
      .select({ date: 1, isDayComplete: 1, _id: 0 })
      .lean()
      .exec();

    const completeDates = new Set(
      rows.filter((row) => row.isDayComplete).map((row) => row.date),
    );

    const items: { date: string; isDayComplete: boolean }[] = [];
    let cursor = fromKey;
    while (cursor <= toKey) {
      items.push({ date: cursor, isDayComplete: completeDates.has(cursor) });
      cursor = shiftDateKey(cursor, 1);
    }

    return { items };
  }

  private async getVirdStreakSnapshot(userId: string) {
    const streak = await this.streaksService.getByUser(userId);
    return {
      currentStreak: streak.virdCurrentStreak ?? 0,
      longestStreak: streak.virdLongestStreak ?? 0,
    };
  }

  private async countsByItemKey(
    userId: Types.ObjectId,
    programId: Types.ObjectId,
    date: string,
  ): Promise<Map<string, number>> {
    const logs = await this.dhikrLogModel
      .find({ userId, virdProgramId: programId, date })
      .select({
        virdSlot: 1,
        virdPrayerIndex: 1,
        dhikrId: 1,
        customDhikrId: 1,
        count: 1,
      })
      .lean()
      .exec();

    const countByItemKey = new Map<string, number>();
    for (const log of logs) {
      if (!log.virdSlot) {
        continue;
      }
      const dhikrRef = resolveDhikrRef(log);
      if (!dhikrRef) {
        continue;
      }
      const itemKey = buildVirdItemKey(
        log.virdSlot,
        log.virdPrayerIndex,
        dhikrRef,
      );
      countByItemKey.set(itemKey, log.count ?? 0);
    }
    return countByItemKey;
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz kimlik.');
    }
    return new Types.ObjectId(rawId);
  }
}
