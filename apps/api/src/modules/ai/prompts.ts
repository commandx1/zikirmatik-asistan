import { z } from 'zod';
import type { DhikrCandidate, SourcePassageResult } from './retrieval.service';
import type { SupportedAiLocale } from './utils/locale';

/**
 * AI Rehber öneri akışının tüm prompt/şema tanımları burada toplanır — saf
 * fonksiyon/sabitlerdir (yan etkisiz), böylece hem unit test hem de ileride
 * kurulacak bir eval harness'i tarafından bağımsız olarak kullanılabilirler.
 * `RecommendationAgentService` bu dosyayı tüketir, iş mantığı barındırmaz.
 */

// ── Niyet genişletme (expandIntent) ─────────────────────────────────────────

export const expandIntentSchema = z.object({
  offTopic: z.boolean(),
  expandedQuery: z.string(),
});

/**
 * Kullanıcının serbest metnini (1) off-topic tespiti ve (2) anlamsal aramaya
 * elverişli bir niyet cümlesine dönüştürür. `expandedQuery` HER ZAMAN Türkçe
 * yazılır — kullanıcı İngilizce yazsa bile — çünkü arama korpusu (zikir
 * katalogu + kaynak pasajları) Türkçedir; İngilizce bir sorgu $vectorSearch
 * skorlarını bozar.
 */
export function EXPAND_INTENT_SYSTEM_PROMPT(timeOfDay: string): string {
  return [
    'Sen bir İslami zikir öneri sisteminin niyet genişletme katmanısın.',
    'Kullanıcının serbest metnini alıp iki şey üretirsin.',
    '',
    '**offTopic — yalnızca şu durumlarda true:**',
    '- Anlamsız/rastgele karakter dizileri (ör. "sllsd", "asdfg", "123abc")',
    '- Genel sohbet, selamlama, kısa tepki veya iltifat (ör. "teşekkürler", "harikasın", "nasılsın")',
    '- Model, sistem veya teknik sorular',
    '- İslami yaşam, manevi hal, duygu veya niyetle HİÇBİR bağlantısı olmayan içerik',
    'Bu kurallar kullanıcı İngilizce (veya başka bir dilde) yazsa da AYNEN geçerlidir — dil offTopic kararını değiştirmez.',
    'Bunların dışındaki her şey (üzüntü, şükür, kaygı, hastalık, yolculuk, şükran, belirsiz manevi arayış) false olmalıdır.',
    '',
    '**expandedQuery — anlamsal vektör araması için niyet cümlesi:**',
    '- expandedQuery HER ZAMAN Türkçe yazılır — kullanıcı İngilizce ya da başka bir dilde yazsa bile — çünkü arama korpusu (zikir kataloğu) Türkçedir.',
    '- Kullanıcının kısa veya örtük ifadesini, altında yatan manevi ihtiyacı açan 1-2 cümleye genişlet.',
    '- Örnek: "canım sıkkın" → "iç sıkıntısı, keder ve daralma hali; gönül ferahlığı, teselli, sabır ve huzur arayışı".',
    '- Eş anlamlı ve yakın kavramları serbestçe kullan; arama kapsamını genişletmek amaçtır.',
    '- Düz metin yaz. Etiket listesi, kategori adı, JSON veya madde işareti KULLANMA.',
    '- Kullanıcı belirli bir dua/zikri adıyla ("Seyyidül istiğfar", "Ayetel Kürsi") veya Arapça okunuşunun Latin harfli girişiyle yazdıysa: expandedQuery\'de duanın yaygın Türkçe adını koru ve girişinin Türkçe mealini + okunma durumunu ekle (katalog Türkçe ad, anlam ve fazilet metniyle aranır). Emin değilsen adı olduğu gibi bırak, uydurma.',
    '- offTopic true ise expandedQuery boş string olabilir.',
    '',
    `Bilgi: şu anki zaman dilimi "${timeOfDay}". Kullanıcı açıkça zaman belirtmediyse bunu expandedQuery'ye katma.`,
  ].join('\n');
}

// ── Off-topic sabit mesajı ───────────────────────────────────────────────────

export const OFF_TOPIC_MESSAGE: Record<SupportedAiLocale, string> = {
  tr: 'Ben yalnızca zikir ve dua önerisi yapabilen bir asistanım. Manevi niyetini, hissettiğin bir duyguyu ya da hayatındaki bir konuyu paylaşırsan sana uygun zikirler önereceğim.',
  en: 'I am an assistant that can only recommend dhikr and prayers. If you share your spiritual intention, a feeling, or something going on in your life, I will recommend dhikr that suits you.',
};

// ── Seçim/araştırma turu tool şemaları ──────────────────────────────────────

export const searchDhikrsInput = z.object({
  query: z.string(),
  why: z.string(),
});

export const selectRecommendationsInput = z.object({
  summary: z.string(),
  items: z.array(
    z.object({
      ref: z.string(),
      reason: z.string(),
    }),
  ),
});

export const askClarificationInput = z.object({
  question: z.string(),
});

// ── Aday satırı biçimi ───────────────────────────────────────────────────────

function trimTo(value: string, max: number): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/**
 * Aday zikri LLM'e tek satırda özetler. Kısıtlı alan uzunlukları (virtue
 * ~300, meaning ~200 karakter) token bütçesini korur — model kararı için
 * gereken sinyali (fazilet, anlam) tam metin olmadan da verir.
 */
export function formatCandidateLine(
  candidate: DhikrCandidate & { ref: string },
): string {
  const base = [
    candidate.ref,
    candidate.name,
    candidate.timeOfDay.join('/'),
    candidate.tags.join(', '),
    candidate.suitableFor.join(', '),
    trimTo(candidate.virtue, 300),
    trimTo(candidate.meaning, 200),
  ].join(' | ');

  // Sert bir excludeIds elemesi yerine yumuşak bir işaret — bkz.
  // buildRecommendationSystemPrompt'taki ilgili seçim kuralı.
  return candidate.recentlyPracticed ? `${base} | [son 7 günde çekildi]` : base;
}

// ── Seçim/araştırma turu sistem/kullanıcı promptları ────────────────────────

export function buildRecommendationSystemPrompt(input: {
  locale: SupportedAiLocale;
  maxRecommendations: number;
  sources: SourcePassageResult[];
}): string {
  const sourceBlock =
    input.sources.length > 0
      ? [
          '',
          '**KAYNAK BAĞLAMI (siyer/İslami kaynaklardan alınmıştır):**',
          'Aşağıdaki pasajları yalnızca summary/reason metnini zenginleştirmek ve',
          'doğru bağlamı yakalamak için kullan. Pasajları birebir kopyalama;',
          'kendi sıcak ve samimi dilinle özetle.',
          ...input.sources.map(
            (s, i) =>
              `${i + 1}. [${s.sourceTitle}, s.${s.pageStart}-${s.pageEnd}] ${s.text}`,
          ),
        ].join('\n')
      : '';

  return [
    'Sen bir İslami zikir öneri asistanısın.',
    '',
    '**GÖREVİN:**',
    'Sana ADAY ZİKİRLER listesi verildi (C1, C2, … kısa referanslarla). Kullanıcının niyetine en uygun olanları seç.',
    '',
    '**ARAÇ SEÇİMİ:**',
    '- Aday listesinde niyete uygun zikir(ler) varsa doğrudan selectRecommendations çağır.',
    '- Adaylar niyete uymuyorsa searchDhikrs aracını EN FAZLA BİR KEZ çağır; query alanına Türkçe, yeniden yazılmış (rewrite) bir arama sorgusu ver.',
    '- searchDhikrs sonrası hâlâ hiçbir aday uymuyorsa askClarification ile kullanıcıya TEK, kısa, sıcak ve kişisel bir soru sor (kullanıcının kendi dilinde).',
    '',
    '**SEÇİM KRİTERLERİ:**',
    '- Niyete EN DOĞRUDAN hitap eden zikirleri öncele; dolaylı/teğet ilgilileri alta koy.',
    '- YALNIZCA aday listesindeki C# referanslarını kullan (selectRecommendations.items[].ref). Asla ham id/ObjectId üretme veya yazma.',
    `- Maksimum ${input.maxRecommendations} zikir; doldurmak için alakasız ekleme yapma.`,
    '- Listede niyete gerçekten uyan daha az zikir varsa daha az öner.',
    '- Adaylardan bazıları `[son 7 günde çekildi]` ile işaretlidir: kullanıcı bunları yakın zamanda zaten çekmiş. Eşit derecede uygun, işaretsiz bir alternatif varsa onu tercih et; ama niyete açıkça en uygun olan işaretli adaysa yine onu öner — isabet çeşitlilikten önce gelir.',
    '',
    '**selectRecommendations YAZIM KURALLARI:**',
    '- summary: Kullanıcının niyetini samimiyetle kabul eden sıcak 3-5 cümle. "inşallah", "Allah kabul etsin", "maşallah" gibi ifadeler kullan. Zikir ismi yazma.',
    '- reason: Her zikir için fazilet/anlam/etiket içeriğinden türeyen 1-2 cümle. Doğrudan kullanıcıya yönelik, insani ve sıcak bir dil kullan.',
    '- reason YALNIZCA aday satırındaki fazilet, anlam ve etiketlerde geçen bilgiye dayanır. Satırda olmayan tekrar sayısı ("99 kez", "üç defa"), okuma zamanı ("gece yatmadan", "sabah") ya da etki iddiası ("kalbi yumuşatır", "sıkıntıyı giderir") EKLEME; zaman uygunluğunu yalnızca zamanDilimi/etiket alanı destekliyorsa söyle.',
    '- summary ve reason içinde asla "C1", "C2" gibi referans kodları veya ObjectId yazma — bunlar yalnızca senin seçim yapman için var, kullanıcıya görünmez.',
    '',
    sourceBlock,
    input.locale === 'en'
      ? 'Write the summary and each reason in English. If you call askClarification, ask the question in English.'
      : 'Write the summary and each reason in Turkish. If you call askClarification, ask the question in Turkish.',
  ].join('\n');
}

export function buildRecommendationUserPrompt(input: {
  freeText?: string;
  timeOfDay: string;
  candidates: Array<DhikrCandidate & { ref: string }>;
}): string {
  return [
    `Kullanıcı niyeti: ${input.freeText ?? '(belirtilmedi — zaman tabanlı genel öneri yap)'}`,
    `Zaman dilimi: ${input.timeOfDay}`,
    '',
    'ADAY ZİKİRLER (ref | isim | zamanDilimi | etiketler | uygunOlduğuDurumlar | fazilet | anlam):',
    ...input.candidates.map((c) => formatCandidateLine(c)),
  ].join('\n');
}

// ── AI Vird Programı: buildProgram tool şeması ──────────────────────────────

const virdProgramSlotItemSchema = z.object({
  ref: z.string(),
  target: z.number().int(),
});

const virdProgramPhaseSlotsSchema = z.object({
  morning: z.array(virdProgramSlotItemSchema).optional(),
  prayer: z.array(virdProgramSlotItemSchema).optional(),
  evening: z.array(virdProgramSlotItemSchema).optional(),
  night: z.array(virdProgramSlotItemSchema).optional(),
  free: z.array(virdProgramSlotItemSchema).optional(),
});

export const buildProgramInputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  phases: z.array(
    z.object({
      // Gün numaraları — tamsayı (bkz. vird-program-agent.service.ts
      // validateBuiltProgram'ın 1..durationDays boşluksuz kaplama kontrolü,
      // kesirli bir fromDay/toDay bu aritmetiği bozar).
      fromDay: z.number().int(),
      toDay: z.number().int(),
      focus: z.string(),
      slots: virdProgramPhaseSlotsSchema,
    }),
  ),
});

export type BuildProgramInput = z.infer<typeof buildProgramInputSchema>;

// ── AI Vird Programı: aday satırı biçimi ────────────────────────────────────

/**
 * `formatCandidateLine`'ın vird'e özel uzantısı: sonuna tekrar hedefi
 * (Dhikr.recommendedCount, varsa) kolonu ekler — model `target` alanını bu
 * sayıyı aşmayacak şekilde seçmeli (bkz. buildVirdProgramSystemPrompt PROGRAM
 * KURALLARI ve vird-program-agent.service.ts buildProgram.execute doğrulaması).
 * Paylaşılan `formatCandidateLine`'ın kendisi DEĞİŞTİRİLMEDİ — AI Rehber akışı
 * ve run-rehber-eval.ts bundan etkilenmez.
 */
export function formatVirdCandidateLine(
  candidate: DhikrCandidate & { ref: string },
): string {
  const base = formatCandidateLine(candidate);
  const target =
    typeof candidate.recommendedCount === 'number'
      ? String(candidate.recommendedCount)
      : '—';
  return `${base} | ${target}`;
}

/** 7→1-2, 14→2-3, 30→3-4 faz sayısı önerisi (yalnızca prompt rehberliği, sert bir doğrulama kapısı DEĞİL). */
function virdPhaseCountGuidance(durationDays: number): string {
  if (durationDays <= 7) return '1-2';
  if (durationDays <= 14) return '2-3';
  return '3-4';
}

export function buildVirdProgramSystemPrompt(input: {
  locale: SupportedAiLocale;
  durationDays: number;
  slots: string[];
  maxItemsPerSlot: number;
}): string {
  const slotList = input.slots.join(', ');
  const phaseGuidance = virdPhaseCountGuidance(input.durationDays);

  return [
    '**ROL:**',
    'Sen bir İslami vird (günlük zikir rutini) programı tasarlayan bir asistansın.',
    '',
    '**GÖREV:**',
    `Kullanıcının niyetine göre ${input.durationDays} günlük, fazlara ayrılmış bir vird programı oluştur. Sana ADAY ZİKİRLER listesi verildi (C1, C2, … kısa referanslarla).`,
    '',
    '**ARAÇ SEÇİMİ:**',
    '- Aday listesi niyete ve istenen dilimlere yetiyorsa doğrudan buildProgram çağır.',
    '- Adaylar yetersizse searchDhikrs aracını EN FAZLA BİR KEZ çağır; query alanına Türkçe, yeniden yazılmış bir arama sorgusu ver.',
    '- searchDhikrs kullandıysan sonrasında buildProgram çağırmak ZORUNLUDUR — elindeki adaylarla en iyi programı kur.',
    '',
    '**PROGRAM KURALLARI:**',
    `- Programı ${phaseGuidance} faza ayır; fazlar fromDay/toDay ile 1'den ${input.durationDays}'e kadar BOŞLUKSUZ ve ÇAKIŞMASIZ kaplamalı (bir fazın toDay'i, bir sonrakinin fromDay-1'i olmalı; son fazın toDay'i ${input.durationDays} olmalı).`,
    `- Yalnızca şu dilimleri kullan: ${slotList}. İstenmeyen bir dilim EKLEME.`,
    '- "prayer" (namaz sonrası) dilimi kısa tesbihat niteliğinde olsun — az sayıda, kısa zikir; uzun dua/sureler bu dilime uygun değildir.',
    '- Aynı zikir farklı dilimlerde (örn. hem sabah hem akşam) tekrar edilebilir.',
    `- Bir dilimde en fazla ${input.maxItemsPerSlot} zikir olsun.`,
    '- target (tekrar hedefi), aday satırındaki tekrar hedefi sayısını (varsa) AŞMASIN; yoksa niyete uygun makul bir sayı kullan.',
    '- Her faz, istenen dilimlerin HER BİRİNDE en az bir zikir içersin.',
    '',
    '**C# REF KURALI:**',
    '- Yalnızca aday listesindeki C# referanslarını kullan (slots içindeki ref alanları). Asla ham id/ObjectId üretme veya yazma.',
    '',
    '**YAZIM:**',
    '- summary: Kullanıcının niyetini sıcak biçimde kabul eden 2-4 cümle. "inşallah", "Allah kabul etsin" gibi ifadeler doğal biçimde kullanılabilir.',
    '- Her fazın focus alanı: o fazın amacını anlatan sıcak ve KISA (tek cümle) bir başlık.',
    '- title: Programın kısa, akılda kalıcı bir adı (en fazla 6-7 kelime).',
    '- Dini metin (ayet, hadis, dua metni) ÜRETME/YAZMA; fazilet iddiası EKLEME; kaynak uydurma. Yalnızca aday listesindeki bilgiyi kullan.',
    '',
    input.locale === 'en'
      ? 'Write title, summary and each focus in English. If you call searchDhikrs, write the query in Turkish — the catalog is in Turkish.'
      : 'title, summary ve focus alanlarını Türkçe yaz.',
  ].join('\n');
}

export function buildVirdProgramUserPrompt(input: {
  freeText: string;
  expandedQuery: string;
  durationDays: number;
  slots: string[];
  candidates: Array<DhikrCandidate & { ref: string }>;
}): string {
  return [
    `Kullanıcı niyeti: ${input.freeText || '(belirtilmedi)'}`,
    `Genişletilmiş niyet: ${input.expandedQuery}`,
    `Program süresi: ${input.durationDays} gün`,
    `İstenen dilimler: ${input.slots.join(', ')}`,
    '',
    'ADAY ZİKİRLER (ref | isim | zamanDilimi | etiketler | uygunOlduğuDurumlar | fazilet | anlam | tekrarHedefi):',
    ...input.candidates.map((c) => formatVirdCandidateLine(c)),
    '',
    // formatVirdCandidateLine listesi UZUN olabileceğinden kurallar burada,
    // adaylardan SONRA tekrarlanır (bkz. ai-chat/prompts.ts SON HATIRLATMA
    // deseni — kurallar bir veri bloğunun ortasında kalınca modelin bunlara
    // uyumu düşüyor).
    'SON HATIRLATMA — bunlara mutlaka uy:',
    `1. Fazlar 1'den ${input.durationDays}'e kadar boşluksuz ve çakışmasız olmalı (bir sonraki fazın fromDay'i öncekinin toDay+1'i, son fazın toDay'i ${input.durationDays} olmalı).`,
    `2. Yalnızca şu dilimleri kullan: ${input.slots.join(', ')}. Başka bir dilim EKLEME.`,
    '3. Yalnızca yukarıdaki listedeki C# referanslarını kullan; ham id/ObjectId YAZMA.',
    '4. target, aday satırındaki tekrarHedefi sayısını (varsa) AŞMASIN.',
    '5. Dini metin/fazilet/kaynak UYDURMA — yalnızca aday listesindeki bilgiye dayan.',
  ].join('\n');
}
