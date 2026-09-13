import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import type { LocalizedText } from '../../common/types/localized-text';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import type {
  VirdProgramItem,
  VirdProgramPhase,
  VirdProgramPhaseSlots,
} from './schemas/vird-program.schema';
import {
  VirdTemplate,
  type VirdTemplateDocument,
  type VirdTemplateItem,
  type VirdTemplatePhase,
  type VirdTemplatePhaseSlots,
} from './schemas/vird-template.schema';
import {
  VIRD_SLOT_KEYS,
  type VirdProgramKind,
  type VirdSlotKey,
} from './vird.types';

// dhikrKey -> katalog alanları eşlemesi 10 dk boyunca bellekte tutulur (bkz.
// auth.service.ts appleKeyCache ile aynı desen). Şablon içerikleri (Ramazan/
// Esma/Kandil dahil, ileride) statik seed verisidir ve dakikalar içinde
// değişmez; bu yüzden sabit TTL'li basit bir Map yeterlidir.
const DHIKR_CACHE_TTL_MS = 10 * 60 * 1000;

type DhikrCacheEntry = {
  dhikrId: string;
  key: string;
  name: LocalizedText;
  nameArabic: string;
  transliteration: LocalizedText;
  meaning: LocalizedText;
};

export type VirdTemplateSummary = {
  key: string;
  kind: VirdProgramKind;
  title?: LocalizedText;
  description?: LocalizedText;
  isPremium: boolean;
  dayCount?: number;
  anchorDate?: string;
};

export type VirdTemplateResolvedItem = {
  dhikrId: string;
  key: string;
  name: LocalizedText;
  nameArabic: string;
  transliteration: LocalizedText;
  meaning: LocalizedText;
  target: number;
};

export type VirdTemplateResolvedPhase = {
  fromDay: number;
  toDay: number | null;
  note?: string;
  slots: Partial<Record<VirdSlotKey, VirdTemplateResolvedItem[]>>;
};

export type VirdTemplateDetail = VirdTemplateSummary & {
  phases: VirdTemplateResolvedPhase[];
};

export type ResolvedTemplateForProgram = {
  template: {
    key: string;
    kind: VirdProgramKind;
    title?: LocalizedText;
    isPremium: boolean;
    dayCount?: number;
    anchorDate?: string;
  };
  phases: VirdProgramPhase[];
};

/**
 * Şablon (vird_templates) okuma servisi. İki tüketicisi var: 1) VirdTemplatesController
 * (misafir de dahil, salt-okunur liste/detay — bkz. GET /v1/vird/templates[/:key]),
 * 2) VirdProgramsService.create (source:'template' — şablonu bir kullanıcı
 * programına çözümler, bkz. resolveForProgram). Her iki tüketici de aynı
 * dhikrKey->katalog çözümleme/cache mekanizmasını paylaşır.
 */
@Injectable()
export class VirdTemplatesService {
  private readonly logger = new Logger(VirdTemplatesService.name);
  private dhikrCache?: {
    expiresAt: number;
    byKey: Map<string, DhikrCacheEntry>;
  };

  constructor(
    @InjectModel(VirdTemplate.name)
    private readonly virdTemplateModel: Model<VirdTemplateDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
  ) {}

  /**
   * Aktif şablonların meta listesi. `anchorDate` dolu VE `anchorDate + dayCount`
   * bugünden (İstanbul) önceyse (özel güne bağlı bir şablonun günü geçmişse)
   * listeden gizlenir — klasik (routine, anchorDate'siz) şablonlar bu kurala
   * hiç tabi değildir.
   */
  async findAllActive(): Promise<VirdTemplateSummary[]> {
    const templates = await this.virdTemplateModel
      .find({ isActive: true })
      .select({
        key: 1,
        kind: 1,
        title: 1,
        description: 1,
        isPremium: 1,
        dayCount: 1,
        anchorDate: 1,
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const todayKey = istanbulDateKey(new Date());
    return templates
      .filter((template) => !this.isPastAnchor(template, todayKey))
      .map((template) => this.toSummary(template));
  }

  /**
   * Fazlar + her item için çözülmüş zikir içeriği (misafir çevrimdışı
   * kullanabilsin diye dhikrId + tüm görüntülenebilir alanlar birlikte döner).
   * Bilinmeyen dhikrKey'ler (katalogda bulunamayan) atlanır ve loglanır.
   */
  async findByKey(key: string): Promise<VirdTemplateDetail> {
    const template = await this.findActiveTemplateDocByKey(key);
    const dhikrByKey = await this.resolveDhikrsByKey(
      this.collectDhikrKeys(template.phases),
    );

    return {
      ...this.toSummary(template),
      phases: template.phases.map((phase) =>
        this.resolvePhaseForDetail(phase, dhikrByKey, key),
      ),
    };
  }

  /**
   * VirdProgramsService.create için: şablonu bulur (yoksa/aktif değilse null
   * — 404'e çevirmek çağıranın işi) ve fazlarını VirdProgram şekline
   * (dhikrKey -> ObjectId dhikrId) çözümler. Çözülemeyen item'lar atlanır;
   * bir slot/faz item'sız kalırsa sonuçtan tamamen çıkarılır.
   */
  async resolveForProgram(
    key: string,
  ): Promise<ResolvedTemplateForProgram | null> {
    const template = await this.virdTemplateModel
      .findOne({ key, isActive: true })
      .lean()
      .exec();
    // Süresi geçmiş (anchorDate + dayCount bugünden önce) bir şablon listeden
    // gizlendiği gibi, ondan yeni bir program oluşturmak da engellenir — bkz.
    // isPastAnchor / findAllActive.
    if (!template || this.isPastAnchor(template, istanbulDateKey(new Date()))) {
      return null;
    }

    const dhikrByKey = await this.resolveDhikrsByKey(
      this.collectDhikrKeys(template.phases),
    );

    const phases: VirdProgramPhase[] = [];
    for (const phase of template.phases) {
      const slots = this.resolveSlotsForProgram(phase.slots, dhikrByKey, key);
      if (Object.keys(slots).length === 0) {
        continue;
      }
      phases.push({
        fromDay: phase.fromDay,
        toDay: phase.toDay,
        note: phase.note,
        slots,
      });
    }

    return {
      template: {
        key: template.key,
        kind: template.kind,
        title: template.title,
        isPremium: template.isPremium,
        dayCount: this.resolveDayCount(template),
        anchorDate: template.anchorDate,
      },
      phases,
    };
  }

  // --- helpers ---

  private async findActiveTemplateDocByKey(key: string): Promise<VirdTemplate> {
    const template = await this.virdTemplateModel
      .findOne({ key, isActive: true })
      .lean()
      .exec();
    if (!template || this.isPastAnchor(template, istanbulDateKey(new Date()))) {
      throw new NotFoundException('Vird şablonu bulunamadı.');
    }
    return template;
  }

  private toSummary(template: {
    key: string;
    kind: VirdProgramKind;
    title?: LocalizedText;
    description?: LocalizedText;
    isPremium: boolean;
    dayCount?: number;
    anchorDate?: string;
    phases?: VirdTemplatePhase[];
  }): VirdTemplateSummary {
    return {
      key: template.key,
      kind: template.kind,
      title: template.title,
      description: template.description,
      isPremium: template.isPremium,
      dayCount: this.resolveDayCount(template),
      anchorDate: template.anchorDate,
    };
  }

  /** anchorDate/dayCount ikisi de tanımlıysa (bkz. resolveDayCount) ve
   * anchorDate+dayCount bugünden önceyse true. anchorDate'siz (klasik/
   * routine) şablonlar hiçbir zaman "geçmiş" sayılmaz. */
  private isPastAnchor(
    template: {
      kind: VirdProgramKind;
      anchorDate?: string;
      dayCount?: number;
      phases?: VirdTemplatePhase[];
    },
    todayKey: string,
  ): boolean {
    const dayCount = this.resolveDayCount(template);
    if (!template.anchorDate || typeof dayCount !== 'number') {
      return false;
    }
    const endKey = shiftDateKey(template.anchorDate, dayCount);
    return endKey < todayKey;
  }

  /** journey şablonlarında `dayCount` alanı DB'de eksikse fazlardan
   * (`max(toDay)`) geri hesaplanır. `phases` yüklenmemişse (ör.
   * findAllActive'in dar `.select()` projeksiyonu) ya da `kind` 'routine'
   * ise saklanan değer aynen döner — routine şablonların toDay:null tek fazı
   * bu hesaba hiç girmez. */
  private resolveDayCount(template: {
    kind: VirdProgramKind;
    dayCount?: number;
    phases?: VirdTemplatePhase[];
  }): number | undefined {
    if (typeof template.dayCount === 'number') {
      return template.dayCount;
    }
    if (template.kind !== 'journey' || !template.phases) {
      return template.dayCount;
    }
    const toDays = template.phases
      .map((phase) => phase.toDay)
      .filter((toDay): toDay is number => typeof toDay === 'number');
    return toDays.length > 0 ? Math.max(...toDays) : undefined;
  }

  private collectDhikrKeys(phases: VirdTemplatePhase[]): string[] {
    const keys: string[] = [];
    for (const phase of phases) {
      for (const slotKey of VIRD_SLOT_KEYS) {
        const items = phase.slots?.[slotKey];
        if (!items) {
          continue;
        }
        for (const item of items) {
          keys.push(item.dhikrKey);
        }
      }
    }
    return keys;
  }

  private resolvePhaseForDetail(
    phase: VirdTemplatePhase,
    dhikrByKey: Map<string, DhikrCacheEntry>,
    templateKey: string,
  ): VirdTemplateResolvedPhase {
    const slots: Partial<Record<VirdSlotKey, VirdTemplateResolvedItem[]>> = {};
    for (const slotKey of VIRD_SLOT_KEYS) {
      const items = phase.slots?.[slotKey];
      if (!items || items.length === 0) {
        continue;
      }
      const resolved = this.resolveItemsForDetail(
        items,
        dhikrByKey,
        templateKey,
      );
      if (resolved.length > 0) {
        slots[slotKey] = resolved;
      }
    }
    return {
      fromDay: phase.fromDay,
      toDay: phase.toDay,
      note: phase.note,
      slots,
    };
  }

  private resolveItemsForDetail(
    items: VirdTemplateItem[],
    dhikrByKey: Map<string, DhikrCacheEntry>,
    templateKey: string,
  ): VirdTemplateResolvedItem[] {
    const resolved: VirdTemplateResolvedItem[] = [];
    for (const item of items) {
      const dhikr = dhikrByKey.get(item.dhikrKey);
      if (!dhikr) {
        this.warnUnknownDhikrKey(templateKey, item.dhikrKey);
        continue;
      }
      resolved.push({
        dhikrId: dhikr.dhikrId,
        key: dhikr.key,
        name: dhikr.name,
        nameArabic: dhikr.nameArabic,
        transliteration: dhikr.transliteration,
        meaning: dhikr.meaning,
        target: item.target,
      });
    }
    return resolved;
  }

  private resolveSlotsForProgram(
    slots: VirdTemplatePhaseSlots,
    dhikrByKey: Map<string, DhikrCacheEntry>,
    templateKey: string,
  ): VirdProgramPhaseSlots {
    const resolved: VirdProgramPhaseSlots = {};
    for (const slotKey of VIRD_SLOT_KEYS) {
      const items = slots?.[slotKey];
      if (!items || items.length === 0) {
        continue;
      }
      const resolvedItems: VirdProgramItem[] = [];
      for (const item of items) {
        const dhikr = dhikrByKey.get(item.dhikrKey);
        if (!dhikr) {
          this.warnUnknownDhikrKey(templateKey, item.dhikrKey);
          continue;
        }
        resolvedItems.push({
          dhikrId: new Types.ObjectId(dhikr.dhikrId),
          target: item.target,
        });
      }
      if (resolvedItems.length > 0) {
        resolved[slotKey] = resolvedItems;
      }
    }
    return resolved;
  }

  private warnUnknownDhikrKey(templateKey: string, dhikrKey: string) {
    this.logger.warn(
      `Vird şablonu '${templateKey}': bilinmeyen dhikrKey='${dhikrKey}' katalogda bulunamadı, atlandı.`,
    );
  }

  /** dhikrKey -> katalog alanları eşlemesini (10 dk TTL'li bellek cache
   * üzerinden) döner. Cache'te olmayan key'ler için tek bir `$in` sorgusu
   * yapılır; süresi geçmiş cache tamamen atılır (bkz. dosya başı yorumu). */
  private async resolveDhikrsByKey(
    dhikrKeys: string[],
  ): Promise<Map<string, DhikrCacheEntry>> {
    const uniqueKeys = Array.from(new Set(dhikrKeys));
    const cache = this.freshCacheMap();
    const missingKeys = uniqueKeys.filter((key) => !cache.has(key));

    if (missingKeys.length > 0) {
      const docs = await this.dhikrModel
        .find({ key: { $in: missingKeys } })
        .select({
          key: 1,
          name: 1,
          nameArabic: 1,
          transliteration: 1,
          meaning: 1,
        })
        .lean()
        .exec();
      for (const doc of docs) {
        if (!doc.key) {
          continue;
        }
        cache.set(doc.key, {
          dhikrId: doc._id.toString(),
          key: doc.key,
          name: doc.name,
          nameArabic: doc.nameArabic,
          transliteration: doc.transliteration,
          meaning: doc.meaning,
        });
      }
      this.dhikrCache = {
        expiresAt: Date.now() + DHIKR_CACHE_TTL_MS,
        byKey: cache,
      };
    }

    return cache;
  }

  private freshCacheMap(): Map<string, DhikrCacheEntry> {
    if (this.dhikrCache && this.dhikrCache.expiresAt > Date.now()) {
      return this.dhikrCache.byKey;
    }
    return new Map();
  }
}
