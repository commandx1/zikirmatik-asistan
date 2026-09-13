import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import type { LocalizedText } from '../../common/types/localized-text';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import {
  SpecialDay,
  type SpecialDayDocument,
} from '../special-days/schemas/special-day.schema';
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

// sourceEventKey (aile) -> özel günden çözülen anchorDate eşlemesi de aynı
// desenle (bkz. yukarı) 10 dk bellekte tutulur — özel gün verisi yılda bir
// güncellenir, bu yüzden kısa TTL'li basit bir Map fazlasıyla yeterlidir.
const SPECIAL_DAY_ANCHOR_CACHE_TTL_MS = 10 * 60 * 1000;

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
  private specialDayAnchorCache?: {
    expiresAt: number;
    byFamily: Map<string, string | null>;
  };

  constructor(
    @InjectModel(VirdTemplate.name)
    private readonly virdTemplateModel: Model<VirdTemplateDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(SpecialDay.name)
    private readonly specialDayModel: Model<SpecialDayDocument>,
  ) {}

  /**
   * Aktif şablonların meta listesi. `sourceEventKey` taşıyan şablonlarda
   * anchorDate special_days'ten dinamik çözülür (bkz. resolveAnchorDate);
   * özel günden gelecekte bir kayıt bulunamazsa şablon gizlenir. Diğer
   * şablonlarda (statik anchorDate ya da hiç anchorDate'siz) eski davranış
   * korunur: `anchorDate + dayCount` bugünden (İstanbul) önceyse gizlenir —
   * klasik (routine, anchorDate'siz) şablonlar bu kurala hiç tabi değildir.
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
        sourceEventKey: 1,
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const todayKey = istanbulDateKey(new Date());
    const visible: VirdTemplateSummary[] = [];
    for (const template of templates) {
      const anchorDate = await this.resolveAnchorDate(template, todayKey);
      if (template.sourceEventKey && !anchorDate) {
        // Özel güne bağlı şablon, ama gelecekte/sürmekte olan bir kaydı yok.
        continue;
      }
      const effective = { ...template, anchorDate };
      if (this.isPastAnchor(effective, todayKey)) {
        continue;
      }
      visible.push(this.toSummary(effective));
    }
    return visible;
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
    // Süresi geçmiş (anchorDate + dayCount bugünden önce) ya da özel güne
    // bağlı olup gelecekte bir kaydı bulunamayan bir şablon listeden
    // gizlendiği gibi, ondan yeni bir program oluşturmak da engellenir — bkz.
    // resolveActiveTemplateDoc / findAllActive.
    const template = await this.resolveActiveTemplateDoc(key);
    if (!template) {
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
    const template = await this.resolveActiveTemplateDoc(key);
    if (!template) {
      throw new NotFoundException('Vird şablonu bulunamadı.');
    }
    return template;
  }

  /**
   * `key` + isActive:true şablonunu bulur ve dinamik anchorDate'i çözer
   * (bkz. resolveAnchorDate) — dönen doküman, `sourceEventKey`'i varsa
   * `anchorDate` alanı ÇÖZÜLMÜŞ değerle değiştirilmiş bir kopyadır. Şablon
   * yoksa, özel güne bağlı olup gelecekte/sürmekte olan bir kaydı
   * bulunamıyorsa, ya da (statik anchorDate'li klasik durumda) süresi
   * geçmişse null döner — ASLA fırlatmaz; 404'e çevirmek/null olarak kabul
   * etmek çağıranın işidir (bkz. findActiveTemplateDocByKey / resolveForProgram).
   */
  private async resolveActiveTemplateDoc(
    key: string,
  ): Promise<VirdTemplate | null> {
    const template = await this.virdTemplateModel
      .findOne({ key, isActive: true })
      .lean()
      .exec();
    if (!template) {
      return null;
    }

    const todayKey = istanbulDateKey(new Date());
    const anchorDate = await this.resolveAnchorDate(template, todayKey);
    if (template.sourceEventKey && !anchorDate) {
      return null;
    }

    const effective = { ...template, anchorDate };
    if (this.isPastAnchor(effective, todayKey)) {
      return null;
    }
    return effective;
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

  /** `sourceEventKey`'i olmayan şablonlarda `anchorDate` aynen döner
   * (geriye uyumluluk: statik anchorDate'li ya da hiç anchorDate'siz klasik
   * şablonlar eskisi gibi davranır). `sourceEventKey`'i olan şablonlarda
   * anchor special_days'ten DİNAMİK çözülür (bkz. findUpcomingAnchorDate) ve
   * 10 dk bellek cache'te tutulur (dhikrCache ile aynı desen — bkz. dosya
   * başı yorumu); cache anahtarı `sourceEventKey`'in kendisidir, bulunamayan
   * bir aile de `null` olarak cache'lenir (her istekte tekrar sorgulanmaz). */
  private async resolveAnchorDate(
    template: { anchorDate?: string; sourceEventKey?: string },
    todayKey: string,
  ): Promise<string | undefined> {
    if (!template.sourceEventKey) {
      return template.anchorDate;
    }

    const cache = this.freshSpecialDayAnchorCache();
    if (cache.has(template.sourceEventKey)) {
      return cache.get(template.sourceEventKey) ?? undefined;
    }

    const anchorDate = await this.findUpcomingAnchorDate(
      template.sourceEventKey,
      todayKey,
    );
    cache.set(template.sourceEventKey, anchorDate ?? null);
    this.specialDayAnchorCache = {
      expiresAt: Date.now() + SPECIAL_DAY_ANCHOR_CACHE_TTL_MS,
      byFamily: cache,
    };
    return anchorDate;
  }

  private freshSpecialDayAnchorCache(): Map<string, string | null> {
    if (
      this.specialDayAnchorCache &&
      this.specialDayAnchorCache.expiresAt > Date.now()
    ) {
      return this.specialDayAnchorCache.byFamily;
    }
    return new Map();
  }

  /** `familyKey` (ör. 'ramazan-gunleri', yıl eki YOK) ile başlayıp bir yıl
   * sonekiyle biten (`^familyKey-\d{4}$`) special_days kayıtları arasından,
   * HENÜZ bitmemiş en erken "1. gün" kaydının tarihini bulur. Çok günlü
   * ailelerde (Ramazan) her günün kendi satırı vardır — bu yüzden yalnız
   * `dayIndex:1` (ya da dayIndex'i hiç olmayan/`null` olan, kandil gecesi
   * gibi tek günlük aileler — `$in:[1,null]` her ikisini de yakalar) adaydır;
   * aksi halde bir yolculuğun ORTASINDA (dayIndex:1 tarihi geçmiş ama bitişi
   * henüz gelmemiş) anchor yanlışlıkla bir sonraki yıla kayardı. "Henüz
   * bitmemiş" kaydın kendi `dayCount`'una göre hesaplanan bitiş günü
   * (`date + dayCount - 1`) >= bugün demektir — dayCount yoksa (tek günlük
   * kandil) bitiş = kaydın kendi tarihidir. Uygun kayıt yoksa (aile hiç
   * seed'lenmemiş ya da tüm tekrarları bitmiş) undefined döner — şablon
   * çağıran tarafından (findAllActive/resolveActiveTemplateDoc) gizlenir. */
  private async findUpcomingAnchorDate(
    familyKey: string,
    todayKey: string,
  ): Promise<string | undefined> {
    const pattern = new RegExp(`^${escapeRegExp(familyKey)}-\\d{4}$`);
    const candidates = await this.specialDayModel
      .find({
        eventKey: pattern,
        isActive: true,
        // $in:[1,null] hem alanı hiç yazılmamış (undefined/yok) hem de
        // özel gün seed'inin bilerek `dayIndex: null` yazdığı tek günlük
        // (kandil) kayıtları yakalar.
        dayIndex: { $in: [1, null] },
      })
      .select({ date: 1, dayCount: 1 })
      .sort({ date: 1 })
      .lean()
      .exec();

    for (const candidate of candidates) {
      const endKey =
        typeof candidate.dayCount === 'number'
          ? shiftDateKey(candidate.date, candidate.dayCount - 1)
          : candidate.date;
      if (endKey >= todayKey) {
        return candidate.date;
      }
    }
    return undefined;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
