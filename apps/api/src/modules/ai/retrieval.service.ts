import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { canonicalKeyFromArabic } from '../dhikrs/utils/canonical-key';
import { EmbeddingService } from '../embedding/embedding.service';
import { AiRuntimeService } from './ai-runtime.service';
import { AiRetrievalError } from './ai-errors';
import { AiUsageService } from './ai-usage.service';
import { rrfFuse, type RankedItem } from './retrieval-fusion';
import {
  SourcePassage,
  type SourcePassageDocument,
} from './schemas/source-passage.schema';
import type { SupportedAiLocale } from './utils/locale';

type DhikrLean = Dhikr & { _id: Types.ObjectId };
type SourcePassageLean = SourcePassage & { _id: Types.ObjectId };

// Hibrit modda tek bir aday, vektör listesinde ve/veya metin listesinde
// bulunabilir — ikisi de bulunmayan alan opsiyoneldir.
type DhikrHybridLean = DhikrLean & {
  _vectorScore?: number;
  _textScore?: number;
};
type SourcePassageHybridLean = SourcePassageLean & {
  _vectorScore?: number;
  _textScore?: number;
};

const DEFAULT_PASSAGE_MIN_SCORE = 0.68;

// Hibrit modda zayıf full-text eşleşmelerini elemek için göreli eşik —
// bir metin skoru, o aramanın EN İYİ skorunun bu orandan daha azıysa
// atılır (örn. sadece "duası" gibi ortak bir kelimeyi paylaşan zayıf
// eşleşmeleri bastırır). Bkz. applyTextRelativeFloor.
const DEFAULT_TEXT_MIN_REL_SCORE = 0.35;

// Kaynak pasajı $vectorSearch numCandidates — bu bacak ENN'e (exact: true)
// GEÇMEDİ (zikir bacağının aksine); yalnızca aday havuzu 100 → 200'e
// büyütüldü (bkz. worker brief, madde 2).
const PASSAGE_VECTOR_NUM_CANDIDATES = 200;

export type MatchedBy = 'vector' | 'text' | 'both';

// Ajanın LLM'e döndürdüğü zikir adayı — retrieval katmanı artık locale'e göre
// tek dilde düz string döner (eski SearchResult LocalizedText+virtue.tr
// karışımı yerine); bu Faz 2'nin bilinçli küçük iyileştirmesidir.
export type DhikrCandidate = {
  id: string;
  name: string;
  virtue: string;
  meaning: string;
  tags: string[];
  categories: string[];
  suitableFor: string[];
  timeOfDay: string[];
  // Seed'deki stabil anahtar ve orijinal Arapça metin — LLM prompt'unda
  // KULLANILMAZ, yalnızca eval harness'inin (scripts/eval/run-retrieval-eval.ts)
  // altın veri (`expectedKeys`) eşleştirmesi ve near-duplicate tespiti için
  // eklendi (bkz. docs/ai-mimari.md retrieval eval notu). Additive alanlar.
  key?: string;
  nameArabic?: string;
  score?: number;
  // Hibrit arama (AI_HYBRID_SEARCH=1) alanları — vektör-only modda hiç
  // dolmaz (bkz. searchDhikrsByText).
  textScore?: number;
  fusedScore?: number;
  matchedBy?: MatchedBy;
  // Kullanıcının son 7 günde zaten çektiği bir zikirse true — sert bir
  // excludeIds elemesi yerine bir işaret (bkz. RecommendationAgentService.run
  // ve buildRecommendationSystemPrompt'taki seçim kuralı). Retrieval katmanı
  // bu alanı KENDİSİ doldurmaz; ajan initialCandidates üzerinde işaretler.
  recentlyPracticed?: boolean;
  // Dhikr şemasındaki statik tekrar hedefi (bkz. docs/ai-mimari.md §6 —
  // sıralama/popülerlik sinyali OLARAK kullanılmaz). AI Vird Programı
  // ajanı bunu "target aday satırındaki sayıyı aşmaz" doğrulama kapısı için
  // okur (bkz. vird-program-agent.service.ts). runDhikrTextSearch'ün $project
  // aşaması bu alanı içermediği için hibrit modun metin-bacağı eşleşmelerinde
  // undefined kalabilir — bu durumda ilgili doğrulama kuralı basitçe
  // uygulanmaz (bkz. "varsa" koşulu).
  recommendedCount?: number;
};

// Kaynak pasajı (kitap RAG) araması sonucu. AiChatService 'bilgi' modunda ve
// AiService'in RAG turunda kullanır.
export type SourcePassageResult = {
  sourceId: string;
  text: string;
  sourceTitle: string;
  // Pasajın kitap içindeki bölüm başlığı (varsa). Prompt'a gömüldüğünde
  // modelin pasajı doğru bağlamda okumasına yardım eder.
  sectionHeading?: string;
  pageStart: number;
  pageEnd: number;
  type: string;
  score?: number;
  // Hibrit arama (AI_HYBRID_SEARCH=1) alanları — vektör-only modda hiç
  // dolmaz (bkz. searchSourcePassages).
  textScore?: number;
  fusedScore?: number;
  matchedBy?: MatchedBy;
};

function resolveLocalizedText(
  text: { tr: string; en: string } | undefined,
  locale: SupportedAiLocale,
): string {
  if (!text) return '';
  if (locale === 'en') {
    return (text.en?.trim() || text.tr?.trim() || '') ?? '';
  }
  return (text.tr?.trim() || text.en?.trim() || '') ?? '';
}

function toDhikrCandidate(
  item: DhikrHybridLean,
  locale: SupportedAiLocale,
  extra?: { textScore?: number; fusedScore?: number; matchedBy?: MatchedBy },
): DhikrCandidate {
  return {
    id: item._id.toString(),
    name: resolveLocalizedText(item.name, locale),
    virtue: resolveLocalizedText(item.virtue, locale),
    meaning: resolveLocalizedText(item.meaning, locale),
    tags: item.tags,
    categories: item.categories,
    suitableFor: item.suitableFor,
    timeOfDay: item.timeOfDay,
    ...(item.key ? { key: item.key } : {}),
    ...(item.nameArabic ? { nameArabic: item.nameArabic } : {}),
    ...(typeof item._vectorScore === 'number'
      ? { score: item._vectorScore }
      : {}),
    ...(typeof extra?.textScore === 'number'
      ? { textScore: extra.textScore }
      : {}),
    ...(typeof extra?.fusedScore === 'number'
      ? { fusedScore: extra.fusedScore }
      : {}),
    ...(extra?.matchedBy ? { matchedBy: extra.matchedBy } : {}),
    ...(typeof item.recommendedCount === 'number'
      ? { recommendedCount: item.recommendedCount }
      : {}),
  };
}

// Adayın canonicalKey'i — seed'de zaten hesaplanmış alan varsa onu kullanır,
// yoksa (reseed öncesi eski kayıtlar) Arapça metinden aynı algoritmayla
// türetir (bkz. canonicalKeyFromArabic). Her iki alan da yoksa undefined
// döner — böyle adaylar dedupe'a dahil edilmez (tekil kabul edilir).
function resolveCanonicalKey(doc: {
  canonicalKey?: string;
  nameArabic?: string;
}): string | undefined {
  return doc.canonicalKey ?? canonicalKeyFromArabic(doc.nameArabic);
}

/**
 * Aynı duanın (harekeli/harekesiz varyantlar dahil) birden fazla kayıt
 * olarak adaylar arasında görünmesini engeller — sıralamadaki İLK (en
 * yüksek rank'lı) kayıt tutulur, sonrakiler elenir. `keyOf` çağırana göre
 * ham dhikr dokümanını ya da fused/candidate sarmalayıcısını okur.
 *
 * `export`: AI Vird Programı ajanı (vird-program-agent.service.ts) birden
 * fazla retrieval çağrısından (genel havuz + dilim bazlı aramalar) gelen
 * `DhikrCandidate[]` listelerini BİRLEŞTİRDİKTEN sonra aynı genel dedupe
 * mantığını yeniden kullanmak için bunu dışa aktarır (keyOf olarak
 * `canonicalKeyFromArabic(candidate.nameArabic)` verir — DhikrCandidate'ta
 * ham `canonicalKey` alanı yoktur, bkz. resolveCanonicalKey). Bu dosyanın
 * kendi iç çağrıları (searchDhikrsByText/searchDhikrsByTimeOfDay/hibrit
 * yollar) davranışsal olarak DEĞİŞMEDİ.
 */
export function dedupeByCanonicalKey<T>(
  items: T[],
  keyOf: (item: T) => string | undefined,
  debug: (message: string) => void,
  label: string,
): T[] {
  const seen = new Set<string>();
  const kept: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    kept.push(item);
  }
  const dropped = items.length - kept.length;
  if (dropped > 0) {
    debug(
      `${label}: canonicalKey dedupe ${dropped}/${items.length} adayı eledi`,
    );
  }
  return kept;
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'bilinmeyen hata';
}

// RRF fusion'da liste sırası sabit sözleşme: 0=vektör, 1=metin. Bir öğe
// ikisinde de geçiyorsa 'both' — bu doğal bir boost'tur (rrfFuse skorları
// toplar), burada ekstra bir ağırlıklandırma YAPILMAZ.
function matchedByFromSourceLists(sourceLists: number[]): MatchedBy {
  const hasVector = sourceLists.includes(0);
  const hasText = sourceLists.includes(1);
  if (hasVector && hasText) return 'both';
  return hasVector ? 'vector' : 'text';
}

/**
 * `$search` (Atlas Search, kaynak pasajı bacağı) veya `$text` (standart
 * Mongo text index, zikir bacağı) hatasının, index henüz
 * oluşturulmamış/queryable değil gibi bir ALTYAPI durumundan mı yoksa
 * gerçek bir sorgu/servis hatasından mı kaynaklandığını ayırt etmeye
 * çalışır. İlki (bu fonksiyon true dönerse) vektör-only'e sessiz düşüş
 * nedenidir — AI hatası SAYILMAZ.
 *
 * Not: Atlas'ın gözlemlenen gerçek davranışı, var olmayan/queryable olmayan
 * bir `$search` index'i için genellikle HATA FIRLATMAK YERİNE boş sonuç
 * döndürmesidir (bkz. docs/ai-mimari.md §6) — bu durumda bu fonksiyon hiç
 * çağrılmaz, akış zaten doğal biçimde vektör-only'e düşer. Bu fonksiyon,
 * bazı ortamlarda/hata yollarında gerçekten bir exception fırlatıldığında
 * (örn. "index not found", "Unrecognized pipeline stage name: '$search'",
 * standart Mongo'nun "text index required for $text query" hatası) ek bir
 * güvenlik ağıdır.
 */
function isSearchIndexMissingError(error: unknown, indexName: string): boolean {
  const message = describeError(error).toLowerCase();
  const name = indexName.toLowerCase();

  if (
    message.includes('unrecognized pipeline stage') ||
    message.includes('$search is not allowed') ||
    message.includes('atlas search is not enabled') ||
    message.includes('text index required')
  ) {
    return true;
  }

  const mentionsMissing =
    message.includes('not found') ||
    message.includes('does not exist') ||
    message.includes('not queryable');
  return (
    mentionsMissing && (message.includes(name) || message.includes('index'))
  );
}

/**
 * AI Rehber / AI sohbet için tüm zikir + kaynak pasajı retrieval'ini
 * (embedding araması, Atlas $vectorSearch, zaman-tabanlı örnekleme, son
 * gösterilen id'lerin ve id-bazlı yüklemenin çözümü) tek yerde toplar.
 * Eskiden ai.service.ts içinde dağınık duran bu mantık, Faz 3'te agent'ın
 * yeniden yazılabilmesi için buraya taşındı — davranış (bugfix'ler hariç)
 * korunur.
 *
 * Faz 4 (hibrit arama): `searchSourcePassages` (bayrak: `AI_HYBRID_SEARCH`,
 * varsayılan açık) ve `searchDhikrsByText` (bayrak: `AI_DHIKR_HYBRID_SEARCH`,
 * varsayılan KAPALI — bkz. docs/ai-mimari.md §6), Atlas $vectorSearch'e ek
 * olarak bir full-text sorgusu çalıştırıp iki listeyi Reciprocal Rank Fusion
 * (`retrieval-fusion.ts`) ile birleştirir. Kaynak pasajı bacağı Atlas
 * Search (`lucene.turkish`) kullanır; zikir bacağı ise standart Mongo
 * `$text` (`dhikr_text_idx`) kullanır — Atlas FTS index kotası dolu olduğu
 * için (bkz. metod yorumları). Her iki bacakta da zayıf metin eşleşmeleri
 * `AI_TEXT_MIN_REL_SCORE` göreli eşiğiyle elenir (bkz.
 * `applyTextRelativeFloor`).
 */
@Injectable()
export class RetrievalService {
  // "index henüz queryable değil" uyarısını process başına EN FAZLA bir kez
  // basmak için — flowLog her çağrıda yeni bir logger döner, bu Set instance
  // düzeyinde (singleton provider) kalıcıdır.
  private readonly warnedMissingTextIndexes = new Set<string>();

  constructor(
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(SourcePassage.name)
    private readonly sourcePassageModel: Model<SourcePassageDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    private readonly embeddingService: EmbeddingService,
    private readonly usageService: AiUsageService,
    private readonly configService: ConfigService,
    private readonly aiRuntime: AiRuntimeService,
  ) {}

  /**
   * Serbest metin sorgusunu embed edip Atlas $vectorSearch (dhikr_vector_index)
   * ile anlamsal olarak en yakın zikirleri getirir. Eski koddaki tag/kategori
   * rerank katmanı ("_tagScore") kasıtlı olarak KALDIRILDI: freeText akışında
   * bu parametreler zaten hiç dolmuyordu, yani etkisizdi (bkz. eski
   * buildIntersectionScoreFields çağrısı — hasAnySignal her zaman false'du).
   *
   * `AI_DHIKR_HYBRID_SEARCH` ('1'/'true' iken açık; VARSAYILAN KAPALI) açıkken
   * bu vektör aramaya paralel olarak standart Mongo `$text` (`dhikr_text_idx`)
   * full-text araması da çalışır ve iki liste RRF ile birleştirilir (bkz.
   * `retrieval-fusion.ts`). Atlas Search DEĞİL — bu bacak için Atlas FTS
   * index kotası dolu olduğu için `$text`'e geçildi. Varsayılan kapatıldı:
   * retrieval eval'inde (33 altın etiketli intent) bu bacak vektör-only'nin
   * altında kaldı (0.677/0.562 ve altı vs. 0.763/0.650) — isim/transliterasyon
   * sorguları zaten `expandIntent` sayesinde vektör-only ile üst sırada
   * çıkıyor (bkz. docs/ai-mimari.md §6). Kapalıyken davranış eskisiyle bayt
   * bazında aynıdır. Kaynak pasajı bacağı ayrı bayrakla (`AI_HYBRID_SEARCH`,
   * varsayılan açık) yönetilir ve etkilenmez.
   */
  async searchDhikrsByText(params: {
    query: string;
    limit: number;
    excludeIds: string[];
    locale: SupportedAiLocale;
    flowId?: string;
    userId?: string;
    // Önceden hesaplanmış sorgu vektörü — verilirse embedding atlanır (bkz.
    // embedQuery). Ajan aynı sorgu metnini iki kez embed etmemek için ilk
    // aramada bunu kullanır; searchDhikrs tool'u kendi yeni sorgusu için
    // vermez (yeniden embed edilir).
    queryVector?: number[];
  }): Promise<DhikrCandidate[]> {
    const { warn, debug } = this.aiRuntime.flowLog(params.flowId);
    const trimmedQuery = params.query?.trim();
    // Tavan 20: $vectorSearch.limit = limit*3 = 60 olur.
    const limit = Math.min(params.limit ?? 10, 20);

    const excludeObjectIds = params.excludeIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const baseMatch: Record<string, unknown> = {
      isVerified: true,
      isActive: true,
      ...(excludeObjectIds.length > 0
        ? { _id: { $nin: excludeObjectIds } }
        : {}),
    };

    const queryVector =
      params.queryVector ??
      (
        await this.embedQuery(trimmedQuery ?? '', {
          flowId: params.flowId,
          userId: params.userId,
        })
      ).vector;

    if (!this.dhikrHybridSearchEnabled()) {
      return this.searchDhikrsVectorOnly(
        queryVector,
        limit,
        baseMatch,
        params.locale,
        warn,
        debug,
      );
    }

    return this.searchDhikrsHybrid(
      trimmedQuery ?? '',
      queryVector,
      limit,
      baseMatch,
      excludeObjectIds,
      params.locale,
      warn,
      debug,
    );
  }

  /**
   * Bir sorgu metnini bir kez embed eder ve kullanım kaydını tek yerde
   * tutar (`ai_usage_log` kind:'embedding'). `searchSourcePassages` ve
   * `searchDhikrsByText` çağıranı (RecommendationAgentService.run) aynı
   * `searchQuery` metnini hem pasaj hem zikir aramasına vermek için bunu
   * BİR KEZ çağırır ve döndürülen vektörü her iki çağrıya `queryVector`
   * olarak geçirir — eskiden aynı metin iki kez embed ediliyordu.
   */
  async embedQuery(
    text: string,
    ctx: { flowId?: string; userId?: string },
  ): Promise<{ vector: number[]; usage?: { inputTokens: number } }> {
    const trimmed = text?.trim() ?? '';
    const { vector, usage: embeddingUsage } =
      await this.embeddingService.embedWithUsage(trimmed);
    if (embeddingUsage) {
      void this.usageService.record({
        kind: 'embedding',
        model: this.embeddingService.model,
        usage: embeddingUsage,
        flowId: ctx.flowId,
        userId: ctx.userId,
      });
    }
    if (!vector) {
      throw new AiRetrievalError('embedding_failed');
    }
    return { vector, usage: embeddingUsage };
  }

  /** Vektör-only yol — AI_DHIKR_HYBRID_SEARCH kapalıyken (varsayılan) davranış budur. */
  private async searchDhikrsVectorOnly(
    queryVector: number[],
    limit: number,
    baseMatch: Record<string, unknown>,
    locale: SupportedAiLocale,
    warn: (message: string) => void,
    debug: (message: string) => void,
  ): Promise<DhikrCandidate[]> {
    try {
      const results = await this.dhikrModel
        .aggregate<DhikrLean & { _vectorScore: number }>([
          {
            $vectorSearch: {
              index: 'dhikr_vector_index',
              path: 'embedding',
              queryVector,
              exact: true,
              limit: limit * 3,
            },
          },
          { $match: baseMatch },
          { $addFields: { _vectorScore: { $meta: 'vectorSearchScore' } } },
          { $sort: { _vectorScore: -1 } },
        ])
        .exec();

      const deduped = dedupeByCanonicalKey(
        results,
        (item) => resolveCanonicalKey(item),
        debug,
        'searchDhikrsByText(vector-only)',
      ).slice(0, limit);

      debug(`searchDhikrsByText: ${deduped.length} aday döndü`);
      return deduped.map((item) => toDhikrCandidate(item, locale));
    } catch (error) {
      warn(`Dhikr vector search başarısız: ${describeError(error)}`);
      throw new AiRetrievalError('retrieval_failed', undefined, error);
    }
  }

  /** Hibrit yol — $vectorSearch + $text (dhikr_text_idx), RRF ile birleştirilir. */
  private async searchDhikrsHybrid(
    query: string,
    queryVector: number[],
    limit: number,
    baseMatch: Record<string, unknown>,
    excludeObjectIds: Types.ObjectId[],
    locale: SupportedAiLocale,
    warn: (message: string) => void,
    debug: (message: string) => void,
  ): Promise<DhikrCandidate[]> {
    let vectorResults: DhikrHybridLean[];
    try {
      vectorResults = await this.dhikrModel
        .aggregate<DhikrHybridLean>([
          {
            $vectorSearch: {
              index: 'dhikr_vector_index',
              path: 'embedding',
              queryVector,
              exact: true,
              limit: limit * 3,
            },
          },
          { $match: baseMatch },
          { $addFields: { _vectorScore: { $meta: 'vectorSearchScore' } } },
          { $sort: { _vectorScore: -1 } },
          { $limit: limit * 2 },
        ])
        .exec();
    } catch (error) {
      warn(`Dhikr vector search başarısız: ${describeError(error)}`);
      throw new AiRetrievalError('retrieval_failed', undefined, error);
    }

    const textResults = await this.runDhikrTextSearch(
      query,
      limit,
      excludeObjectIds,
      warn,
      debug,
    );

    const vectorRanked: RankedItem<DhikrHybridLean>[] = vectorResults.map(
      (item) => ({ id: item._id.toString(), item }),
    );
    const textRanked: RankedItem<DhikrHybridLean>[] = textResults.map(
      (item) => ({ id: item._id.toString(), item }),
    );

    const fused = rrfFuse([vectorRanked, textRanked]);
    const dedupedFused = dedupeByCanonicalKey(
      fused,
      (entry) => resolveCanonicalKey(entry.item),
      debug,
      'searchDhikrsByText(hybrid)',
    );
    const top = dedupedFused.slice(0, limit);

    debug(
      `searchDhikrsByText(hybrid): vector=${vectorResults.length} text=${textResults.length} fused=${fused.length}` +
        (top.length > 0
          ? ` top=${top[0].id} matchedBy=${matchedByFromSourceLists(top[0].sourceLists)}`
          : ''),
    );

    return top.map((entry) => {
      const matchedBy = matchedByFromSourceLists(entry.sourceLists);
      return toDhikrCandidate(entry.item, locale, {
        textScore: entry.item._textScore,
        fusedScore: entry.fusedScore,
        matchedBy,
      });
    });
  }

  /**
   * Standart Mongo `$text` sorgusu (`dhikr_text_idx`, bkz. dhikr.schema.ts).
   * Atlas Search DEĞİL — cluster'ın FTS index kotası dolu olduğu için bu
   * bacak $text'e geçirildi (bkz. docs/ai-mimari.md §6). `$text`, aggregate
   * pipeline'ında yalnızca İLK `$match` aşamasında kullanılabilir.
   */
  private async runDhikrTextSearch(
    query: string,
    limit: number,
    excludeObjectIds: Types.ObjectId[],
    warn: (message: string) => void,
    debug: (message: string) => void,
  ): Promise<DhikrHybridLean[]> {
    const indexName = 'dhikr_text_idx';
    try {
      const results = await this.dhikrModel
        .aggregate<DhikrHybridLean>([
          {
            $match: {
              $text: { $search: query, $language: 'turkish' },
              isActive: true,
              isVerified: true,
              ...(excludeObjectIds.length > 0
                ? { _id: { $nin: excludeObjectIds } }
                : {}),
            },
          },
          { $addFields: { _textScore: { $meta: 'textScore' } } },
          { $sort: { _textScore: -1 } },
          { $limit: limit * 2 },
          {
            $project: {
              name: 1,
              transliteration: 1,
              virtue: 1,
              meaning: 1,
              tags: 1,
              categories: 1,
              suitableFor: 1,
              timeOfDay: 1,
              canonicalKey: 1,
              nameArabic: 1,
              _textScore: 1,
            },
          },
        ])
        .exec();

      return this.applyTextRelativeFloor(results, debug, 'dhikr $text');
    } catch (error) {
      if (isSearchIndexMissingError(error, indexName)) {
        this.warnMissingTextIndexOnce(indexName, warn);
        return [];
      }
      warn(`Dhikr text search başarısız: ${describeError(error)}`);
      throw new AiRetrievalError('retrieval_failed', undefined, error);
    }
  }

  /**
   * freeText yokken (zaman tabanlı genel öneri) kullanılan yol. Eskiden
   * `recommendedCount`'a göre sıralanıyordu (popülerlik) — bu alan artık
   * yalnızca mobil tarafın tekrar hedefi olduğu için sıralama sinyali olarak
   * KULLANILMAMALI; rastgele örnekleme ile değiştirildi.
   */
  async searchDhikrsByTimeOfDay(params: {
    timeOfDay: string;
    limit: number;
    excludeIds: string[];
    locale: SupportedAiLocale;
  }): Promise<DhikrCandidate[]> {
    const { debug } = this.aiRuntime.flowLog();
    const excludeObjectIds = params.excludeIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const results = await this.dhikrModel
      .aggregate<DhikrLean>([
        {
          $match: {
            isVerified: true,
            isActive: true,
            ...(excludeObjectIds.length > 0
              ? { _id: { $nin: excludeObjectIds } }
              : {}),
            timeOfDay: { $in: [params.timeOfDay, 'any'] },
          },
        },
        // canonicalKey dedupe sonrası hâlâ `limit` kadar aday kalabilsin diye
        // örneklem büyütüldü (bkz. dedupeByCanonicalKey).
        { $sample: { size: params.limit * 3 } },
      ])
      .exec();

    const deduped = dedupeByCanonicalKey(
      results,
      (item) => resolveCanonicalKey(item),
      debug,
      'searchDhikrsByTimeOfDay',
    ).slice(0, params.limit);

    return deduped.map((item) => toDhikrCandidate(item, params.locale));
  }

  /**
   * Kaynak pasajı (kitap RAG) koleksiyonunda anlamsal arama yapar.
   * `AI_PASSAGE_MIN_SCORE` (varsayılan 0.68) altındaki zayıf eşleşmeler
   * elenir; 0 verilirse eşik tamamen devre dışı kalır.
   *
   * `AI_HYBRID_SEARCH` (varsayılan '1') açıkken $vectorSearch'e paralel
   * olarak Atlas Search (`source_passages_text_index`) full-text araması da
   * çalışır; iki liste RRF ile birleştirilir. Eşik politikası hibrit modda
   * DEĞİŞİR: bir pasaj metin eşleşmesine sahipse (keyword hit), vektör
   * skoru eşiğin altında olsa bile ELENMEZ — hibrit aramanın amacı tam
   * olarak bu (isim/transliterasyon gibi vektörün kaçırdığı eşleşmeleri
   * yakalamak). `'0'` iken davranış eskisiyle bayt bazında aynıdır.
   */
  async searchSourcePassages(
    query: string,
    limit = 4,
    opts?: {
      minScore?: number;
      flowId?: string;
      userId?: string;
      // Önceden hesaplanmış sorgu vektörü — verilirse embedding atlanır
      // (bkz. embedQuery). Ajan searchQuery'yi tek seferde embed edip
      // hem bu metoda hem searchDhikrsByText'e geçirir.
      queryVector?: number[];
    },
  ): Promise<SourcePassageResult[]> {
    const { warn, debug } = this.aiRuntime.flowLog(opts?.flowId);
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
      return [];
    }

    const queryVector =
      opts?.queryVector ??
      (
        await this.embedQuery(trimmedQuery, {
          flowId: opts?.flowId,
          userId: opts?.userId,
        })
      ).vector;

    const minScore = opts?.minScore ?? this.passageMinScore();

    if (!this.hybridSearchEnabled()) {
      return this.searchSourcePassagesVectorOnly(
        queryVector,
        limit,
        minScore,
        warn,
        debug,
      );
    }

    return this.searchSourcePassagesHybrid(
      trimmedQuery,
      queryVector,
      limit,
      minScore,
      warn,
      debug,
    );
  }

  /** Vektör-only yol — AI_HYBRID_SEARCH='0' iken davranış eskisiyle aynıdır. */
  private async searchSourcePassagesVectorOnly(
    queryVector: number[],
    limit: number,
    minScore: number,
    warn: (message: string) => void,
    debug: (message: string) => void,
  ): Promise<SourcePassageResult[]> {
    try {
      const results = await this.sourcePassageModel
        .aggregate<SourcePassageLean & { _vectorScore: number }>([
          {
            $vectorSearch: {
              index: 'source_passages_vector_index',
              path: 'embedding',
              queryVector,
              numCandidates: PASSAGE_VECTOR_NUM_CANDIDATES,
              limit,
            },
          },
          { $addFields: { _vectorScore: { $meta: 'vectorSearchScore' } } },
          ...(minScore > 0
            ? [{ $match: { _vectorScore: { $gte: minScore } } }]
            : []),
          { $sort: { _vectorScore: -1 } },
          { $limit: limit },
        ])
        .exec();

      if (results.length > 0) {
        debug(
          `searchSourcePassages: top=${results[0]._vectorScore.toFixed(3)} bottom=${results[results.length - 1]._vectorScore.toFixed(3)} (minScore=${minScore})`,
        );
      }

      return results.map((item) => ({
        sourceId: item.sourceId,
        text: item.text,
        sourceTitle: item.sourceTitle,
        sectionHeading: item.sectionHeading,
        pageStart: item.pageStart,
        pageEnd: item.pageEnd,
        type: item.type,
        score: item._vectorScore,
      }));
    } catch (error) {
      warn(`Source passage vector search başarısız: ${describeError(error)}`);
      throw new AiRetrievalError('retrieval_failed', undefined, error);
    }
  }

  /** Hibrit yol — $vectorSearch + $search (source_passages_text_index), RRF ile birleştirilir. */
  private async searchSourcePassagesHybrid(
    query: string,
    queryVector: number[],
    limit: number,
    minScore: number,
    warn: (message: string) => void,
    debug: (message: string) => void,
  ): Promise<SourcePassageResult[]> {
    let vectorResults: SourcePassageHybridLean[];
    try {
      vectorResults = await this.sourcePassageModel
        .aggregate<SourcePassageHybridLean>([
          {
            $vectorSearch: {
              index: 'source_passages_vector_index',
              path: 'embedding',
              queryVector,
              numCandidates: PASSAGE_VECTOR_NUM_CANDIDATES,
              limit: limit * 2,
            },
          },
          { $addFields: { _vectorScore: { $meta: 'vectorSearchScore' } } },
          { $sort: { _vectorScore: -1 } },
          { $limit: limit * 2 },
        ])
        .exec();
    } catch (error) {
      warn(`Source passage vector search başarısız: ${describeError(error)}`);
      throw new AiRetrievalError('retrieval_failed', undefined, error);
    }

    const textResults = await this.runSourcePassageTextSearch(
      query,
      limit,
      warn,
      debug,
    );

    const vectorRanked: RankedItem<SourcePassageHybridLean>[] =
      vectorResults.map((item) => ({ id: item._id.toString(), item }));
    const textRanked: RankedItem<SourcePassageHybridLean>[] = textResults.map(
      (item) => ({ id: item._id.toString(), item }),
    );

    const fused = rrfFuse([vectorRanked, textRanked]);

    // Eşik politikası: metin eşleşmesi olan bir öğe, vektör skoru eşiğin
    // altında olsa (veya vektör listesinde hiç bulunmasa) bile ELENMEZ.
    const survivors = fused.filter((entry) => {
      const hasText = entry.sourceLists.includes(1);
      if (hasText) return true;
      const vectorScore = entry.item._vectorScore;
      return typeof vectorScore === 'number' && vectorScore >= minScore;
    });

    const top = survivors.slice(0, limit);

    debug(
      `searchSourcePassages(hybrid): vector=${vectorResults.length} text=${textResults.length} fused=${fused.length} survivors=${survivors.length} (minScore=${minScore})` +
        (top.length > 0
          ? ` top=${top[0].id} matchedBy=${matchedByFromSourceLists(top[0].sourceLists)}`
          : ''),
    );

    return top.map((entry) => {
      const matchedBy = matchedByFromSourceLists(entry.sourceLists);
      return {
        sourceId: entry.item.sourceId,
        text: entry.item.text,
        sourceTitle: entry.item.sourceTitle,
        sectionHeading: entry.item.sectionHeading,
        pageStart: entry.item.pageStart,
        pageEnd: entry.item.pageEnd,
        type: entry.item.type,
        ...(typeof entry.item._vectorScore === 'number'
          ? { score: entry.item._vectorScore }
          : {}),
        ...(typeof entry.item._textScore === 'number'
          ? { textScore: entry.item._textScore }
          : {}),
        fusedScore: entry.fusedScore,
        matchedBy,
      };
    });
  }

  private async runSourcePassageTextSearch(
    query: string,
    limit: number,
    warn: (message: string) => void,
    debug: (message: string) => void,
  ): Promise<SourcePassageHybridLean[]> {
    const indexName = 'source_passages_text_index';
    try {
      const results = await this.sourcePassageModel
        .aggregate<SourcePassageHybridLean>([
          {
            $search: {
              index: indexName,
              compound: {
                should: [
                  {
                    text: {
                      query,
                      path: 'text',
                      fuzzy: { maxEdits: 1, prefixLength: 2 },
                    },
                  },
                  {
                    text: {
                      query,
                      path: 'sectionHeading',
                      score: { boost: { value: 2 } },
                    },
                  },
                ],
                minimumShouldMatch: 1,
              },
            },
          },
          {
            $project: {
              sourceId: 1,
              text: 1,
              sourceTitle: 1,
              sectionHeading: 1,
              pageStart: 1,
              pageEnd: 1,
              type: 1,
              _textScore: { $meta: 'searchScore' },
            },
          },
          { $limit: limit * 2 },
        ])
        .exec();

      return this.applyTextRelativeFloor(
        results,
        debug,
        'source_passages $search',
      );
    } catch (error) {
      if (isSearchIndexMissingError(error, indexName)) {
        this.warnMissingTextIndexOnce(indexName, warn);
        return [];
      }
      warn(`Source passage text search başarısız: ${describeError(error)}`);
      throw new AiRetrievalError('retrieval_failed', undefined, error);
    }
  }

  /** Son `days` gün içinde kullanıcının gördüğü zikir id'lerini döner. */
  async getRecentDhikrIds(userId: Types.ObjectId, days = 7): Promise<string[]> {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromDate = toDateString(from);

    const recent = await this.dhikrLogModel.distinct('dhikrId', {
      userId,
      date: { $gte: fromDate },
      dhikrId: { $ne: null },
    });

    return recent.map((value) => value.toString());
  }

  /** Belirli ID'lere sahip, aktif ve doğrulanmış dhikrleri döndürür. */
  async loadDhikrsByIds(ids: string[]): Promise<DhikrLean[]> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    return this.dhikrModel
      .find({ _id: { $in: objectIds }, isVerified: true, isActive: true })
      .lean<DhikrLean[]>()
      .exec();
  }

  private passageMinScore(): number {
    const raw = this.configService.get<string | number>('AI_PASSAGE_MIN_SCORE');
    const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : DEFAULT_PASSAGE_MIN_SCORE;
  }

  /** `AI_TEXT_MIN_REL_SCORE` — bkz. DEFAULT_TEXT_MIN_REL_SCORE. */
  private textMinRelScore(): number {
    const raw = this.configService.get<string | number>(
      'AI_TEXT_MIN_REL_SCORE',
    );
    const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : DEFAULT_TEXT_MIN_REL_SCORE;
  }

  /**
   * Bir full-text (`$search`/`$text`) leg sonuç listesinden, o listenin EN
   * İYİ skorunun `AI_TEXT_MIN_REL_SCORE` oranından daha zayıf skora sahip
   * öğeleri eler. Amaç: sorgunun sadece ortak/yaygın bir kelimeyi (örn.
   * "duası") paylaştığı, anlamsal olarak ilgisiz zayıf eşleşmeleri
   * bastırmak — bu eşleşmeler RRF'ye hiç girmez. Hiç sonuç yoksa no-op.
   */
  private applyTextRelativeFloor<T extends { _textScore?: number }>(
    items: T[],
    debug: (message: string) => void,
    label: string,
  ): T[] {
    if (items.length === 0) return items;

    const topScore = items.reduce(
      (max, item) => Math.max(max, item._textScore ?? 0),
      0,
    );
    if (topScore <= 0) return items;

    const floor = this.textMinRelScore();
    const threshold = floor * topScore;
    const kept = items.filter((item) => (item._textScore ?? 0) >= threshold);

    const dropped = items.length - kept.length;
    if (dropped > 0) {
      debug(
        `${label}: relative floor (${floor} × top=${topScore.toFixed(3)}=${threshold.toFixed(3)}) zayıf ${dropped}/${items.length} metin eşleşmesini eledi`,
      );
    }
    return kept;
  }

  /**
   * `AI_HYBRID_SEARCH` (yalnız kaynak pasajı bacağı) — varsayılan '1'
   * (açık); yalnızca '0' devre dışı bırakır.
   */
  private hybridSearchEnabled(): boolean {
    const raw = this.configService.get<string | number | boolean>(
      'AI_HYBRID_SEARCH',
    );
    if (raw === undefined || raw === null || raw === '') {
      return true;
    }
    return String(raw) !== '0';
  }

  /**
   * `AI_DHIKR_HYBRID_SEARCH` (yalnız zikir `$text` bacağı) — VARSAYILAN
   * KAPALI; yalnızca literal '1' veya 'true' açar (bkz. searchDhikrsByText
   * yorumu ve docs/ai-mimari.md §6 — eval'de bu bacak vektör-only'nin
   * altında kaldı).
   */
  private dhikrHybridSearchEnabled(): boolean {
    const raw = this.configService.get<string | number | boolean>(
      'AI_DHIKR_HYBRID_SEARCH',
    );
    return raw === '1' || raw === 1 || raw === true || raw === 'true';
  }

  private warnMissingTextIndexOnce(
    indexName: string,
    warn: (message: string) => void,
  ): void {
    if (this.warnedMissingTextIndexes.has(indexName)) {
      return;
    }
    this.warnedMissingTextIndexes.add(indexName);
    const script =
      indexName === 'dhikr_text_idx'
        ? 'scripts/create-dhikr-text-index.mjs'
        : 'scripts/create-text-search-indexes.mjs';
    warn(
      `Metin arama index'i '${indexName}' bulunamadı/queryable değil — hibrit arama vektör-only'e düşüyor (altyapı durumu, AI hatası değil). Bkz. ${script}.`,
    );
  }
}
