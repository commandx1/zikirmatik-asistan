import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  CreateVirdProgramDto,
  VirdPhaseDto,
} from './dto/create-vird-program.dto';
import { UpdateVirdProgramDto } from './dto/update-vird-program.dto';
import {
  VirdProgram,
  type VirdProgramDocument,
  type VirdProgramPhase,
} from './schemas/vird-program.schema';
import { completeExpiredJourneys } from './utils/complete-expired-journeys';
import { VirdTemplatesService } from './vird-templates.service';
import {
  PREMIUM_MAX_ACTIVE_PROGRAMS,
  VIRD_ARCHIVE_MAX,
  VIRD_DRAFT_EXPIRES_AFTER_DAYS,
  VIRD_ERROR_CODE,
  VIRD_ERROR_MESSAGE,
  VIRD_FREE_LIMIT_ACTIVE,
  VIRD_FREE_LIMIT_DHIKRS,
} from './vird.constants';
import { resolveDhikrRef, type VirdSlotKey } from './vird.types';

// AI Vird Programı taslakları (source:'ai') diğer taslaklardan (manuel/
// şablon, 30 gün — VIRD_DRAFT_EXPIRES_AFTER_DAYS) daha kısa yaşar: kullanıcı
// AI önizlemesini görüp ya aktifleştirir ya da vazgeçer, +7 gün sonra TTL
// index'i (schema: expiresAt, expireAfterSeconds:0) otomatik siler.
const AI_DRAFT_EXPIRES_AFTER_DAYS = 7;

@Injectable()
export class VirdProgramsService {
  constructor(
    @InjectModel(VirdProgram.name)
    private readonly virdProgramModel: Model<VirdProgramDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly templatesService: VirdTemplatesService,
  ) {}

  async findAllForUser(userId: string) {
    const objectId = this.asObjectId(userId);
    return this.virdProgramModel
      .find({ userId: objectId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async findOne(userId: string, id: string) {
    const program = await this.virdProgramModel
      .findOne({ _id: this.asObjectId(id), userId: this.asObjectId(userId) })
      .lean()
      .exec();
    if (!program) {
      throw new NotFoundException('Vird programı bulunamadı.');
    }
    return program;
  }

  async create(userId: string, payload: CreateVirdProgramDto) {
    const objectId = this.asObjectId(userId);
    const isPremium = await this.isPremiumUser(objectId);
    const source = payload.source ?? 'manual';

    this.assertRemindersAllowed(isPremium, payload.reminders?.enabled);

    // Şablon çözümlemesi: yalnız templateKey fiilen verilmişse bu yola girer
    // (premium kontrolü şablonun KENDİ isPremium'ına göre yapılır — bkz.
    // createFromTemplate). templateKey'siz bir 'template'/'ai' isteği eskisi
    // gibi (blanket premium zorunluluğu) aşağı düşer.
    if (source === 'template' && hasNonEmptyString(payload.templateKey)) {
      return this.createFromTemplate(
        objectId,
        isPremium,
        payload.templateKey,
        payload,
      );
    }

    if (source !== 'manual') {
      this.assertPremiumFeatureAllowed(isPremium);
    }
    if (!hasNonEmptyString(payload.startDate)) {
      throw new BadRequestException('startDate zorunludur.');
    }

    const phases = this.normalizePhases(source, payload.phases);
    if (source === 'manual') {
      this.assertDhikrLimit(isPremium, phases);
    }

    const { dayCount, endDate } = this.deriveDayCountAndEndDate(
      payload.kind,
      payload.startDate,
      phases,
    );

    try {
      const created = await this.virdProgramModel.create({
        userId: objectId,
        clientId: this.resolveClientId(payload.clientId),
        kind: payload.kind,
        status: 'draft',
        source,
        templateKey: payload.templateKey,
        title: payload.title,
        startDate: payload.startDate,
        endDate,
        dayCount,
        phases,
        prayerSelection:
          payload.prayerSelection && payload.prayerSelection.length > 0
            ? payload.prayerSelection
            : [1, 2, 3, 4, 5],
        reminders: payload.reminders ?? {
          enabled: false,
          slots: {
            morning: false,
            prayer: false,
            evening: false,
            night: false,
          },
        },
        expiresAt: this.draftExpiryDate(),
      });
      return created.toObject();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Bu clientId ile bir vird programı zaten var.',
        );
      }
      throw error;
    }
  }

  /**
   * source:'template' + templateKey akışı. Şablon/AI kaynaklı programlar 3
   * zikir sınırından muaftır — assertDhikrLimit yalnız source==='manual' için
   * çağrılır (yukarıdaki create() ve update()), bu metod ona hiç dokunmaz.
   */
  private async createFromTemplate(
    objectId: Types.ObjectId,
    isPremium: boolean,
    templateKey: string,
    payload: CreateVirdProgramDto,
  ) {
    const resolved = await this.templatesService.resolveForProgram(
      templateKey.trim(),
    );
    if (!resolved) {
      throw new NotFoundException('Vird şablonu bulunamadı.');
    }
    if (resolved.template.isPremium && !isPremium) {
      throw new ForbiddenException({
        code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
        message: VIRD_ERROR_MESSAGE[VIRD_ERROR_CODE.PREMIUM_REQUIRED],
      });
    }
    if (resolved.phases.length === 0) {
      throw new UnprocessableEntityException(
        'Şablondaki zikirlerin hiçbiri katalogda çözümlenemedi.',
      );
    }

    const startDate = hasNonEmptyString(payload.startDate)
      ? payload.startDate
      : (resolved.template.anchorDate ?? istanbulDateKey(new Date()));
    const { dayCount, endDate } = this.deriveDayCountAndEndDate(
      resolved.template.kind,
      startDate,
      resolved.phases,
    );

    try {
      const created = await this.virdProgramModel.create({
        userId: objectId,
        clientId: this.resolveClientId(payload.clientId),
        kind: resolved.template.kind,
        status: 'draft',
        source: 'template',
        templateKey: resolved.template.key,
        title: resolved.template.title ?? payload.title,
        startDate,
        endDate,
        dayCount: resolved.template.dayCount ?? dayCount,
        phases: resolved.phases,
        prayerSelection:
          payload.prayerSelection && payload.prayerSelection.length > 0
            ? payload.prayerSelection
            : [1, 2, 3, 4, 5],
        reminders: payload.reminders ?? {
          enabled: false,
          slots: {
            morning: false,
            prayer: false,
            evening: false,
            night: false,
          },
        },
        expiresAt: this.draftExpiryDate(),
      });
      return created.toObject();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Bu clientId ile bir vird programı zaten var.',
        );
      }
      throw error;
    }
  }

  /**
   * AI Vird Programı akışının (AiVirdService) tek yazma noktası. Çağıran
   * taraf, ajanın ürettiği fazları ÖNCEDEN `dhikrId` çözülmüş
   * `VirdProgramPhase[]` şekline getirmiş olmalıdır (bkz. AiVirdService
   * toProgramPhases) — bu metod yalnızca persist eder, LLM/retrieval
   * mantığı barındırmaz.
   *
   * İdempotency iki katmanlıdır: (1) yazmadan ÖNCE `ai.flowId` ile mevcut
   * bir taslak aranır (kredi düşülmeden erken dönüş — bkz. AiVirdService),
   * (2) `create` sırasında bir E11000 alınırsa (yarış durumu — aynı flowId
   * ile eşzamanlı iki istek) `ai.flowId` unique sparse index'i sayesinde
   * mevcut taslak tekrar okunup döndürülür; hiçbir zaman ikinci bir program
   * yaratılmaz.
   */
  async createAiDraft(input: {
    userId: Types.ObjectId;
    flowId: string;
    intent: string;
    durationDays: number;
    summary: string;
    title: string;
    phases: VirdProgramPhase[];
    prayerSelection?: number[];
    slots: VirdSlotKey[];
  }) {
    const existing = await this.findAiDraftByFlowId(
      input.userId.toString(),
      input.flowId,
    );
    if (existing) {
      return existing;
    }

    // Savunma derinliği: agent'ın kendi buildProgram doğrulama kapısına
    // (bkz. vird-program-agent.service.ts validateBuiltProgram) EK olarak,
    // persist etmeden önce hiçbir fazın istenmeyen bir dilim taşımadığını
    // burada da doğrula — çağıran taraf (AiVirdService) ileride farklı bir
    // ajan/çözümleme yoluyla çağırırsa bile bu kapı geçerli kalır.
    this.assertPhasesOnlyUseSlots(input.phases, input.slots);

    const startDate = istanbulDateKey(new Date());
    const endDate = shiftDateKey(startDate, input.durationDays - 1);

    try {
      const created = await this.virdProgramModel.create({
        userId: input.userId,
        clientId: this.resolveClientId(undefined),
        kind: 'journey',
        status: 'draft',
        source: 'ai',
        // Model yalnızca istenen locale'de ÜRETİR — şema title.tr/title.en
        // ikisini de zorunlu kıldığı için aynı metin ikisine de yazılır (bkz.
        // docs/vird-programi.md "AI taslağı title/summary" notu).
        title: { tr: input.title, en: input.title },
        startDate,
        endDate,
        dayCount: input.durationDays,
        phases: input.phases,
        prayerSelection:
          input.prayerSelection && input.prayerSelection.length > 0
            ? input.prayerSelection
            : [1, 2, 3, 4, 5],
        reminders: {
          enabled: false,
          slots: {
            morning: false,
            prayer: false,
            evening: false,
            night: false,
          },
        },
        ai: {
          flowId: input.flowId,
          intent: input.intent,
          durationDays: input.durationDays,
          summary: input.summary,
        },
        expiresAt: this.aiDraftExpiryDate(),
      });
      return created.toObject();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        const race = await this.findAiDraftByFlowId(
          input.userId.toString(),
          input.flowId,
        );
        if (race) {
          return race;
        }
      }
      throw error;
    }
  }

  /** `ai.flowId` (+ userId, savunma amaçlı) ile mevcut bir AI taslağını arar — yoksa null. */
  async findAiDraftByFlowId(userId: string, flowId: string) {
    return this.virdProgramModel
      .findOne({ userId: this.asObjectId(userId), 'ai.flowId': flowId })
      .lean()
      .exec();
  }

  private aiDraftExpiryDate(): Date {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + AI_DRAFT_EXPIRES_AFTER_DAYS);
    return date;
  }

  private assertPhasesOnlyUseSlots(
    phases: VirdProgramPhase[],
    allowedSlots: VirdSlotKey[],
  ): void {
    const allowed = new Set(allowedSlots);
    for (const phase of phases) {
      for (const slotKey of Object.keys(phase.slots ?? {})) {
        if (!allowed.has(slotKey as VirdSlotKey)) {
          throw new BadRequestException(
            `Faz, istenmeyen bir dilim içeriyor: '${slotKey}'.`,
          );
        }
      }
    }
  }

  async update(userId: string, id: string, payload: UpdateVirdProgramDto) {
    const objectId = this.asObjectId(userId);
    const programObjectId = this.asObjectId(id);
    const isPremium = await this.isPremiumUser(objectId);

    const existing = await this.virdProgramModel
      .findOne({ _id: programObjectId, userId: objectId })
      .exec();
    if (!existing) {
      throw new NotFoundException('Vird programı bulunamadı.');
    }

    if (payload.status === 'active') {
      throw new BadRequestException(
        'Programı aktifleştirmek için POST /v1/vird/programs/:id/activate kullanın.',
      );
    }

    this.assertRemindersAllowed(isPremium, payload.reminders?.enabled);

    const nextPhases = payload.phases
      ? this.normalizePhases(existing.source, payload.phases)
      : undefined;
    if (nextPhases && existing.source === 'manual') {
      this.assertDhikrLimit(isPremium, nextPhases);
    }

    const set: Record<string, unknown> = {};
    if (payload.title) {
      set.title = payload.title;
    }
    if (nextPhases) {
      set.phases = nextPhases;
      const { dayCount, endDate } = this.deriveDayCountAndEndDate(
        existing.kind,
        existing.startDate,
        nextPhases,
      );
      set.dayCount = dayCount;
      set.endDate = endDate;
    }
    if (payload.prayerSelection) {
      set.prayerSelection = payload.prayerSelection;
    }
    if (payload.reminders) {
      set.reminders = payload.reminders;
    }
    if (payload.status) {
      set.status = payload.status;
    }

    const unset: Record<string, 1> = {};
    if (payload.status && payload.status !== 'draft' && existing.expiresAt) {
      unset.expiresAt = 1;
    }

    const updated = await this.virdProgramModel
      .findOneAndUpdate(
        { _id: programObjectId, userId: objectId },
        {
          $set: set,
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (payload.status === 'archived') {
      await this.enforceArchiveCap(objectId);
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const result = await this.virdProgramModel
      .deleteOne({ _id: this.asObjectId(id), userId: this.asObjectId(userId) })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Vird programı bulunamadı.');
    }
    return { deleted: true };
  }

  async activate(userId: string, id: string) {
    const objectId = this.asObjectId(userId);
    const programObjectId = this.asObjectId(id);
    const isPremium = await this.isPremiumUser(objectId);

    await completeExpiredJourneys(
      this.virdProgramModel,
      objectId,
      istanbulDateKey(new Date()),
    );

    const program = await this.virdProgramModel
      .findOne({ _id: programObjectId, userId: objectId })
      .lean()
      .exec();
    if (!program) {
      throw new NotFoundException('Vird programı bulunamadı.');
    }
    if (program.status !== 'draft' && program.status !== 'paused') {
      throw new BadRequestException(
        'Yalnızca taslak veya duraklatılmış bir program aktifleştirilebilir.',
      );
    }

    const limit = isPremium
      ? PREMIUM_MAX_ACTIVE_PROGRAMS
      : VIRD_FREE_LIMIT_ACTIVE;
    const code = isPremium
      ? VIRD_ERROR_CODE.PREMIUM_MAX_ACTIVE_PROGRAMS
      : VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE;
    const countOtherActive = () =>
      this.virdProgramModel.countDocuments({
        userId: objectId,
        status: 'active',
        _id: { $ne: programObjectId },
      });
    if ((await countOtherActive()) >= limit) {
      throw new ForbiddenException({ code, message: VIRD_ERROR_MESSAGE[code] });
    }

    // Eşzamanlılık: sayım ile yazım arasında başka bir activate araya
    // girebilir. Transaction yerine iyimser yazım + telafi: önce koşullu
    // (status hâlâ okunan değerse) aktifleştir, sonra yeniden say; limit
    // aşıldıysa önceki durumu geri yükle. İki yarışan istek ikisi de geri
    // alabilir (0 aktif) — güvenli; istemci çakışma modalını gösterir.
    // $unset ile temizlenir: bir hydrated doc üzerinde `expiresAt = undefined`
    // atayıp .save() çağırmak Mongoose'da alanı güvenilir şekilde silmez.
    const activated = await this.virdProgramModel
      .findOneAndUpdate(
        { _id: programObjectId, userId: objectId, status: program.status },
        { $set: { status: 'active' }, $unset: { expiresAt: 1 } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!activated) {
      // Okuma ile yazım arasında durum değişti. Aynı programa çift dokunuşta
      // diğer istek onu zaten aktifleştirdiyse eski davranış gibi onu döndür.
      const current = await this.virdProgramModel
        .findOne({ _id: programObjectId, userId: objectId, status: 'active' })
        .lean()
        .exec();
      if (current) {
        return current;
      }
      throw new BadRequestException(
        'Yalnızca taslak veya duraklatılmış bir program aktifleştirilebilir.',
      );
    }

    if ((await countOtherActive()) >= limit) {
      await this.virdProgramModel
        .updateOne(
          { _id: programObjectId, userId: objectId, status: 'active' },
          {
            $set: {
              status: program.status,
              ...(program.expiresAt ? { expiresAt: program.expiresAt } : {}),
            },
          },
        )
        .exec();
      throw new ForbiddenException({ code, message: VIRD_ERROR_MESSAGE[code] });
    }

    return activated;
  }

  // --- helpers ---

  private async isPremiumUser(objectId: Types.ObjectId): Promise<boolean> {
    const user = await this.userModel
      .findById(objectId)
      .select('isPremium')
      .lean()
      .exec();
    return Boolean(user?.isPremium);
  }

  private assertRemindersAllowed(isPremium: boolean, enabled?: boolean) {
    if (!isPremium && enabled === true) {
      throw new ForbiddenException({
        code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
        message: VIRD_ERROR_MESSAGE[VIRD_ERROR_CODE.PREMIUM_REQUIRED],
      });
    }
  }

  private assertPremiumFeatureAllowed(isPremium: boolean) {
    if (!isPremium) {
      throw new ForbiddenException({
        code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
        message: VIRD_ERROR_MESSAGE[VIRD_ERROR_CODE.PREMIUM_REQUIRED],
      });
    }
  }

  private assertDhikrLimit(isPremium: boolean, phases: VirdProgramPhase[]) {
    if (isPremium) {
      return;
    }
    const distinct = new Set<string>();
    for (const phase of phases) {
      for (const items of Object.values(phase.slots ?? {})) {
        for (const item of items ?? []) {
          const ref = resolveDhikrRef(item);
          if (ref) {
            distinct.add(ref);
          }
        }
      }
    }
    if (distinct.size > VIRD_FREE_LIMIT_DHIKRS) {
      throw new ForbiddenException({
        code: VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS,
        message: VIRD_ERROR_MESSAGE[VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS],
      });
    }
  }

  /** DTO şeklindeki (string dhikrId) fazları şema şekline (ObjectId dhikrId)
   * dönüştürür. Manuel olmayan kaynaklarda phases boş/atlanmış olabilir;
   * manuel kaynakta boşsa hata fırlatır (şablon/AI çözümlemesi sonraki
   * görevdedir). */
  private normalizePhases(
    source: string,
    phases?: VirdPhaseDto[],
  ): VirdProgramPhase[] {
    if (!phases || phases.length === 0) {
      if (source === 'manual') {
        throw new BadRequestException(
          'Manuel vird programı için en az bir faz gereklidir.',
        );
      }
      return [];
    }

    return phases.map((phase) => ({
      fromDay: phase.fromDay,
      toDay: phase.toDay ?? null,
      note: phase.note,
      slots: {
        morning: this.mapItems(phase.slots?.morning),
        prayer: this.mapItems(phase.slots?.prayer),
        evening: this.mapItems(phase.slots?.evening),
        night: this.mapItems(phase.slots?.night),
        free: this.mapItems(phase.slots?.free),
      },
    }));
  }

  private mapItems(
    items?: { dhikrId?: string; customDhikrId?: string; target: number }[],
  ) {
    if (!items || items.length === 0) {
      return undefined;
    }
    // Aynı dilimde aynı zikir iki kez gelirse (AI/şablon/istemci hatası)
    // itemKey (`slot:prayerIndex:ref`) çakışır ve ilerleme birbirini gölgeler;
    // ilk kayıt tutulur, tekrarlar atılır.
    const seen = new Set<string>();
    return items
      .filter((item) => {
        const ref = item.dhikrId ?? item.customDhikrId ?? '';
        if (seen.has(ref)) {
          return false;
        }
        seen.add(ref);
        return true;
      })
      .map((item) => ({
        dhikrId: item.dhikrId ? new Types.ObjectId(item.dhikrId) : undefined,
        customDhikrId: item.customDhikrId,
        target: item.target,
      }));
  }

  private deriveDayCountAndEndDate(
    kind: string,
    startDate: string,
    phases: VirdProgramPhase[],
  ): { dayCount?: number; endDate?: string } {
    if (kind !== 'journey') {
      return {};
    }
    const finiteDays = phases
      .map((phase) => phase.toDay ?? phase.fromDay)
      .filter((value): value is number => typeof value === 'number');
    if (finiteDays.length === 0) {
      return {};
    }
    const dayCount = Math.max(...finiteDays);
    const endDate = shiftDateKey(startDate, dayCount - 1);
    return { dayCount, endDate };
  }

  private draftExpiryDate(): Date {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + VIRD_DRAFT_EXPIRES_AFTER_DAYS);
    return date;
  }

  private async enforceArchiveCap(userId: Types.ObjectId) {
    const archived = await this.virdProgramModel
      .find({ userId, status: 'archived' })
      .sort({ updatedAt: 1 })
      .select('_id')
      .lean()
      .exec();
    if (archived.length <= VIRD_ARCHIVE_MAX) {
      return;
    }
    const toDelete = archived
      .slice(0, archived.length - VIRD_ARCHIVE_MAX)
      .map((doc) => doc._id);
    await this.virdProgramModel.deleteMany({ _id: { $in: toDelete } }).exec();
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return Boolean(
      error &&
      typeof error === 'object' &&
      (error as { code?: unknown }).code === 11000,
    );
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz kimlik.');
    }
    return new Types.ObjectId(rawId);
  }

  /**
   * Her programın benzersiz bir clientId'si olur: istemci göndermediyse
   * sunucu üretir. Neden: {userId, clientId} unique index'i (eski sparse
   * tanımı dahil) bileşik sparse davranışı gereği clientId eksik belgeleri de
   * null olarak indeksler; iki "clientId'siz" program E11000 ile çakışırdı.
   * Sunucu üretimli anahtar bu çakışmayı index göçü gerektirmeden kapatır.
   */
  private resolveClientId(clientId: string | undefined | null): string {
    const trimmed = typeof clientId === 'string' ? clientId.trim() : '';
    return trimmed || `srv-${new Types.ObjectId().toHexString()}`;
  }
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
