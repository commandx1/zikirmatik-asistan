import type { Model, Types } from 'mongoose';
import type { VirdProgramDocument } from '../schemas/vird-program.schema';

/**
 * Lazy journey auto-complete: bir cron yerine, aktivasyon ve /today
 * çağrılarının başında çağrılır. `endDate` bugünden ÖNCE olan aktif
 * journey'ler 'completed'e çevrilir. `endDate`'i olmayan journey'ler
 * (veya routine'ler) hiçbir zaman bu yolla tamamlanmaz.
 */
export async function completeExpiredJourneys(
  model: Model<VirdProgramDocument>,
  userId: Types.ObjectId,
  todayKey: string,
): Promise<void> {
  await model
    .updateMany(
      {
        userId,
        status: 'active',
        kind: 'journey',
        endDate: { $lt: todayKey },
      },
      { $set: { status: 'completed' } },
    )
    .exec();
}
