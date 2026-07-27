import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import type { LocalizedText } from '../../common/types/localized-text';
import { CreateSpecialDayDto } from './dto/create-special-day.dto';
import { QuerySpecialDaysDto } from './dto/query-special-days.dto';
import { QuerySpecialDaysHomeDto } from './dto/query-special-days-home.dto';
import { UpdateSpecialDayDto } from './dto/update-special-day.dto';
import {
  SpecialDay,
  type SpecialDayDocument,
  type SpecialDayPractice,
} from './schemas/special-day.schema';

type SpecialDayLean = {
  _id: Types.ObjectId;
  name: LocalizedText;
  type: 'kandil' | 'ramazan' | 'bayram' | 'özel gün';
  date: string;
  hijriDate: string;
  description?: LocalizedText;
  eventKey?: string;
  dayIndex?: number;
  dayCount?: number;
  priority?: number;
  article?: LocalizedText;
  practices?: SpecialDayPractice[];
  hasSpecialFlow?: boolean;
  notifyBeforeMinutes?: number[];
  isActive?: boolean;
};

@Injectable()
export class SpecialDaysService {
  constructor(
    @InjectModel(SpecialDay.name)
    private readonly specialDayModel: Model<SpecialDayDocument>,
  ) {}

  async create(payload: CreateSpecialDayDto) {
    const created = await this.specialDayModel.create({
      ...payload,
      eventKey: normalizeEventKey(payload.eventKey),
      notifyBeforeMinutes: payload.notifyBeforeMinutes ?? [1440, 60],
      hasSpecialFlow: payload.hasSpecialFlow ?? false,
      priority: payload.priority ?? resolveDefaultPriority(payload.type),
      isActive: payload.isActive ?? true,
    });

    return created.toObject();
  }

  async findAll(query: QuerySpecialDaysDto) {
    const filter: Record<string, unknown> = {};

    if (query.type) {
      filter.type = query.type;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {
        ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
        ...(query.dateTo ? { $lte: query.dateTo } : {}),
      };
    }

    return this.specialDayModel.find(filter).sort({ date: 1 }).lean().exec();
  }

  async getHome(query: QuerySpecialDaysHomeDto) {
    const date = query.date ?? toDateKey(new Date());

    const activeDays = await this.specialDayModel
      .find({
        isActive: true,
        date: { $gte: date },
      })
      .sort({ date: 1, priority: -1, createdAt: 1 })
      .lean()
      .exec();

    const todayItems = activeDays
      .filter((item) => item.date === date)
      .sort(compareSpecialDaysForHero);
    const heroSource = todayItems.length > 0 ? 'today' : 'upcoming';
    const hero = todayItems[0] ?? activeDays[0] ?? null;

    const upcoming = activeDays
      .filter((item) => item.date > date)
      .slice(0, 18)
      .map((item) => this.mapUpcoming(item as SpecialDayLean));

    return {
      referenceDate: date,
      hero: hero ? this.mapHero(hero, heroSource) : null,
      action: hero ? this.mapAction(hero) : null,
      upcoming,
    };
  }

  async getDetail(id: string) {
    // Mobil lokal bildirimleri ObjectId'yi bilmez; payload'da `eventKey`
    // taşırlar (`/special-days/<eventKey>`). Bu yüzden detay her iki
    // tanımlayıcıyı da kabul eder. Çok fazlı olaylarda ilk gün döner.
    const specialDay = Types.ObjectId.isValid(id)
      ? await this.specialDayModel
          .findById(new Types.ObjectId(id))
          .lean()
          .exec()
      : await this.specialDayModel
          .findOne({ eventKey: id })
          .sort({ dayIndex: 1, date: 1 })
          .lean()
          .exec();

    if (!specialDay) {
      throw new NotFoundException('Özel gün kaydı bulunamadı.');
    }

    // Zikir önerisi artık AI Rehber'in işi; detay ekranı yalnızca okuma
    // içeriği (article + practices) döner. İçerik metinleri editoryal olarak
    // sonradan doldurulduğu için boş dönmesi geçerli bir durumdur.
    return {
      ...this.mapSpecialDayBase(specialDay),
      article: specialDay.article,
      practices: specialDay.practices ?? [],
    };
  }

  async findById(id: string) {
    const specialDay = await this.specialDayModel
      .findById(this.asObjectId(id))
      .lean()
      .exec();

    if (!specialDay) {
      throw new NotFoundException('Özel gün kaydı bulunamadı.');
    }

    return specialDay;
  }

  async update(id: string, payload: UpdateSpecialDayDto) {
    const specialDay = await this.specialDayModel
      .findByIdAndUpdate(
        this.asObjectId(id),
        {
          $set: {
            ...payload,
            ...(payload.eventKey !== undefined
              ? { eventKey: normalizeEventKey(payload.eventKey) }
              : {}),
            ...(payload.priority === undefined && payload.type
              ? { priority: resolveDefaultPriority(payload.type) }
              : {}),
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!specialDay) {
      throw new NotFoundException('Güncellenecek özel gün kaydı bulunamadı.');
    }

    return specialDay;
  }

  async remove(id: string) {
    const deleted = await this.specialDayModel
      .findByIdAndDelete(this.asObjectId(id))
      .lean()
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek özel gün kaydı bulunamadı.');
    }

    return {
      deleted: true,
      id,
    };
  }

  private mapHero(item: SpecialDayLean, source: 'today' | 'upcoming') {
    const diff = calculateDateDiff(item.date);

    return {
      ...this.mapSpecialDayBase(item),
      source,
      isToday: source === 'today',
      // Ham sayısal geri sayım; etiketler (Gün/Sa/Dk) ve "Bugün/X gün"
      // metni mobil i18n katmanında kullanıcının seçili diline göre üretilir.
      countdown: {
        days: Math.max(diff.days, 0),
        hours: Math.max(diff.hours, 0),
        minutes: Math.max(diff.minutes, 0),
      },
    };
  }

  private mapAction(item: SpecialDayLean) {
    // Sabit başlık/CTA ("Bugün Ne Yapabilirim?", "Detaya git") mobil i18n
    // katmanında üretilir. API yalnızca ham çok dilli içeriği döner; alt metin
    // mobilde description || name ile kurulur.
    return {
      specialDayId: item._id.toString(),
      name: item.name,
      description: item.description,
    };
  }

  private mapUpcoming(item: SpecialDayLean) {
    const diff = calculateDateDiff(item.date);
    return {
      ...this.mapSpecialDayBase(item),
      isToday: diff.totalMs <= 0,
      countdown: {
        days: Math.max(diff.days, 0),
        hours: Math.max(diff.hours, 0),
        minutes: Math.max(diff.minutes, 0),
      },
    };
  }

  private mapSpecialDayBase(item: SpecialDayLean) {
    const theme = resolveSpecialDayTheme(item);
    return {
      id: item._id.toString(),
      name: item.name,
      type: item.type,
      // Ham ISO tarih (YYYY-MM-DD); okunur tarih etiketi mobilde kullanıcının
      // seçili diline göre formatlanır (dateLabel API'den gönderilmez).
      date: item.date,
      hijriDate: item.hijriDate,
      description: item.description,
      eventKey: item.eventKey,
      dayIndex: item.dayIndex,
      dayCount: item.dayCount,
      hasSpecialFlow: Boolean(item.hasSpecialFlow),
      themeTitle: theme.title,
      themeSummary: theme.summary,
    };
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz ObjectId değeri.');
    }

    return new Types.ObjectId(rawId);
  }
}

function resolveDefaultPriority(type: SpecialDayLean['type']) {
  if (type === 'bayram') {
    return 100;
  }
  if (type === 'kandil') {
    return 80;
  }
  if (type === 'ramazan') {
    return 70;
  }
  return 60;
}

function normalizeEventKey(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  return value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDateDiff(isoDate: string) {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  const totalMs = target.getTime() - now.getTime();

  const totalMinutes = Math.floor(totalMs / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { totalMs, days, hours, minutes };
}

function compareSpecialDaysForHero(a: SpecialDayLean, b: SpecialDayLean) {
  const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return resolveTypeRank(b.type) - resolveTypeRank(a.type);
}

function resolveTypeRank(type: SpecialDayLean['type']) {
  if (type === 'bayram') {
    return 4;
  }
  if (type === 'kandil') {
    return 3;
  }
  if (type === 'ramazan') {
    return 2;
  }
  return 1;
}

function resolveSpecialDayTheme(item: SpecialDayLean): {
  title: LocalizedText;
  summary: LocalizedText;
} {
  if (item.eventKey === 'kurban-bayrami-2026') {
    if (item.name.tr.toLocaleLowerCase('tr-TR').includes('arefe')) {
      return {
        title: { tr: 'Arefe Hazırlığı', en: 'Preparing for Arafah' },
        summary: {
          tr: 'Tevbe, istiğfar ve yoğun tefekkür ile bayrama kalbi hazırlama günü.',
          en: 'A day of readying the heart for the feast through repentance, seeking forgiveness, and deep reflection.',
        },
      };
    }

    if (item.dayIndex === 1) {
      return {
        title: { tr: 'Bayram Başlangıcı', en: 'Start of the Feast' },
        summary: {
          tr: 'Teşrik tekbirleri ve şükür merkezli bir başlangıç akışı.',
          en: 'An opening flow centred on the takbir of Tashriq and gratitude.',
        },
      };
    }
    if (item.dayIndex === 2) {
      return {
        title: { tr: 'Tevhid ve Tevekkül', en: 'Tawhid and Trust in God' },
        summary: {
          tr: 'Salavat, tevhid ve hasbiye ile iç dengeyi koruma günü.',
          en: 'A day of preserving inner balance through salawat, tawhid, and hasbiya.',
        },
      };
    }
    if (item.dayIndex === 3) {
      return {
        title: { tr: 'Sabır ve Arınma', en: 'Patience and Purification' },
        summary: {
          tr: 'Dua, istiğfar ve teslimiyet vurgusuyla manevi arınma günü.',
          en: 'A day of spiritual purification emphasising supplication, seeking forgiveness, and submission.',
        },
      };
    }
    if (item.dayIndex === 4) {
      return {
        title: { tr: 'Kapanış ve Sabitleme', en: 'Closing and Consolidation' },
        summary: {
          tr: 'Bayram ritmini tamamlayıp kazanımları günlük hayata taşıma günü.',
          en: 'A day of completing the rhythm of the feast and carrying its gains into daily life.',
        },
      };
    }
  }

  if (item.eventKey === 'mevlid-kandili-2026') {
    return {
      title: { tr: 'Mevlid Kandili', en: 'Mawlid al-Nabi' },
      summary: {
        tr: 'Salavat, tevhid, istiğfar ve dua ile Peygamber sevgisini tazeleme gecesi.',
        en: 'A night of renewing love for the Prophet through salawat, tawhid, seeking forgiveness, and supplication.',
      },
    };
  }

  return {
    title: { tr: 'Günün Teması', en: "Today's Theme" },
    summary: {
      tr:
        item.description?.tr?.trim() ||
        `${item.name.tr} hakkında bilmen gerekenleri bu sayfada bulabilirsin.`,
      en:
        item.description?.en?.trim() ||
        `Everything you need to know about ${item.name.en} is on this page.`,
    },
  };
}
