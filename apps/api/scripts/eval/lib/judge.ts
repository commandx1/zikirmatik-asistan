/**
 * LLM hakem (judge) katmanı — eval harness'inin ürettiği AI Rehber/AI Sohbet
 * çıktılarını, aynı OpenAI hesabı üzerinden AMA ayrı, doğrudan bir
 * `createOpenAI` çağrısıyla (AiRuntimeService/AiUsageService KULLANILMAZ)
 * değerlendirir. Bilinçli olarak `ai_usage_log`'a HİÇBİR ŞEY YAZMAZ — judge
 * maliyeti runner tarafından ayrıca (dönen `usage` alanından) hesaplanıp
 * raporda "judge cost" olarak ayrı gösterilir.
 *
 * Model: `AI_EVAL_JUDGE_MODEL` env'i (varsayılan 'gpt-5'), reasoningEffort
 * 'low' — hakem kararının hızlı ve ucuz olması, ama rastgele/gevşek
 * olmaması hedeflenir. Zaman aşımı 60sn.
 */
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const JUDGE_TIMEOUT_MS = 90_000;
const JUDGE_MAX_OUTPUT_TOKENS = 4000;

function judgeModelName(): string {
  return process.env.AI_EVAL_JUDGE_MODEL?.trim() || 'gpt-5';
}

function judgeProvider() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY tanımlı değil — judge çalıştırmak için gerekli (bkz. apps/api/scripts/eval/README.md).',
    );
  }
  return createOpenAI({ apiKey });
}

/**
 * Strict İslami içerik hakemi sistem promptu. Kasıtlı olarak sert: akıcı
 * ama kaynaksız/uydurma bir cevabı ödüllendirmemesi, her iddiayı pasajlarla
 * doğrulaması istenir.
 */
const JUDGE_SYSTEM_PROMPT = [
  'Sen katı bir İslami içerik değerlendiricisisin (LLM-as-judge).',
  'Görevin, bir AI asistanının ürettiği çıktıyı objektif ve şüpheci biçimde puanlamak.',
  '',
  'TEMEL KURALLAR:',
  '- Akıcı, sıcak veya hoş bir üslubu ASLA ödüllendirme — yalnızca doğruluk, kaynak sadakati ve alaka önemlidir.',
  '- Verilen kaynak pasajlarda/aday listesinde AÇIKÇA yer almayan her iddia "unsupported" (dayanaksız) sayılır, ne kadar makul görünürse görünsün.',
  '- Kıyas/çıkarım yaparak pasajlarda olmayan bir hükme ulaşan cevaplar düşük puan almalı.',
  '- Şüphe duyduğunda cömert değil, sıkı puanla.',
  '- YALNIZCA istenen JSON şemasına uygun çıktı üret; şema dışına hiçbir metin ekleme.',
].join('\n');

export type RehberJudgeItemInput = {
  /** Aday referansı (C1, C2, ...) — modelin selectRecommendations çağrısındaki ref. */
  ref: string;
  /** formatCandidateLine tarzı özet: isim | zamanDilimi | etiketler | uygunOlduğuDurumlar | fazilet | anlam */
  line: string;
  /** Modelin bu öğe için ürettiği reason metni. */
  reason: string;
};

export const rehberJudgeSchema = z.object({
  items: z.array(
    z.object({
      ref: z.string(),
      relevance: z.number().int().min(1).max(5),
      reasonGroundedInVirtue: z.boolean(),
      note: z.string(),
    }),
  ),
  overall: z.number().int().min(1).max(5),
  summaryTone: z.number().int().min(1).max(5),
  verdict: z.enum(['pass', 'weak', 'fail']),
});

export type RehberJudgeOutput = z.infer<typeof rehberJudgeSchema>;

export type JudgeUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type JudgeResult<T> = {
  output: T;
  usage: JudgeUsage;
  model: string;
};

/**
 * AI Rehber çıktısını değerlendirir: seçilen zikirlerin kullanıcı niyetiyle
 * alakası (`relevance`), reason'ın fazilet/etiket içeriğinden türeyip
 * türemediği (`reasonGroundedInVirtue`) ve genel özet tonu.
 */
export async function judgeRehber(input: {
  freeText: string;
  timeOfDay: string;
  summary: string;
  items: RehberJudgeItemInput[];
}): Promise<JudgeResult<RehberJudgeOutput>> {
  const model = judgeModelName();
  const provider = judgeProvider();

  const prompt = [
    `Kullanıcı niyeti: ${input.freeText || '(belirtilmedi)'}`,
    `Zaman dilimi: ${input.timeOfDay}`,
    '',
    'MODELİN SEÇTİĞİ ÖNERİLER (ref | isim | zamanDilimi | etiketler | uygunOlduğuDurumlar | fazilet | anlam):',
    ...input.items.map((item) => `${item.ref} → ${item.line}`),
    '',
    'HER ÖNERİ İÇİN MODELİN ÜRETTİĞİ GEREKÇE (reason):',
    ...input.items.map((item) => `${item.ref}: ${item.reason}`),
    '',
    'ÖZET (summary):',
    input.summary || '(boş)',
    '',
    'Her öneri için: relevance (1-5, niyetle alaka), reasonGroundedInVirtue (reason gerçekten',
    'o zikrin fazilet/etiket/uygunOlduğuDurumlar içeriğinden mi türemiş, yoksa uydurma/genel mi),',
    'note (kısa açıklama) üret. Ardından overall (1-5 genel kalite), summaryTone (1-5, summary',
    'sıcak+samimi+niyeti doğru yansıtıyor mu) ve verdict (pass/weak/fail) ver.',
  ].join('\n');

  const result = await generateObject({
    model: provider(model),
    schema: rehberJudgeSchema,
    system: JUDGE_SYSTEM_PROMPT,
    prompt,
    abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
    maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
    providerOptions: {
      openai: { reasoningEffort: 'low', textVerbosity: 'low' },
    },
  });

  return { output: result.object, usage: result.usage, model };
}

export const chatJudgeSchema = z.object({
  groundedness: z.number().int().min(1).max(5),
  faithfulness: z.number().int().min(1).max(5),
  citationCorrectness: z.enum(['correct', 'missing', 'extra', 'wrong']),
  coverageLabelCorrect: z.boolean(),
  unsupportedClaims: z.array(z.string()),
  verdict: z.enum(['pass', 'weak', 'fail']),
});

export type ChatJudgeOutput = z.infer<typeof chatJudgeSchema>;

/**
 * AI Sohbet ('bilgi' modu) çıktısını değerlendirir: cevabın pasajlara
 * dayanma derecesi (`groundedness`), sadakati (`faithfulness` — pasajı
 * çarpıtmadan mı aktarmış), atıf doğruluğu (`citationCorrectness`),
 * coverage etiketinin (full/partial/none) tutarlılığı ve dayanaksız iddia
 * listesi.
 */
export async function judgeChat(input: {
  question: string;
  passageLines: string[];
  coverage: string;
  usedPassages: string[];
  answer: string;
}): Promise<JudgeResult<ChatJudgeOutput>> {
  const model = judgeModelName();
  const provider = judgeProvider();

  const prompt = [
    `Kullanıcı sorusu: ${input.question}`,
    '',
    input.passageLines.length > 0
      ? `RETRIEVAL'DEN GELEN KAYNAK PASAJLARI:\n${input.passageLines.join('\n\n')}`
      : "RETRIEVAL'DEN GELEN KAYNAK PASAJLARI: (yok)",
    '',
    `Modelin bildirdiği coverage: ${input.coverage}`,
    `Modelin işaretlediği usedPassages: [${input.usedPassages.join(', ')}]`,
    '',
    `MODELİN CEVABI:\n${input.answer}`,
    '',
    'Değerlendir: groundedness (1-5, cevap gerçekten pasajlara mı dayanıyor),',
    'faithfulness (1-5, pasajları çarpıtmadan/uydurmadan mı aktarmış),',
    'citationCorrectness (correct: doğru pasajlara atıf yapılmış | missing: dayanması gereken',
    'bir pasaj atlanmış | extra: alakasız/gereksiz pasaj kullanılmış | wrong: yanlış pasaja atıf',
    'yapılmış), coverageLabelCorrect (bildirilen coverage etiketi pasajlarla cevap arasındaki',
    'gerçek örtüşmeyi doğru mu yansıtıyor), unsupportedClaims (pasajlarda dayanağı olmayan',
    'somut iddiaların listesi — yoksa boş dizi) ve verdict (pass/weak/fail).',
    '',
    'ÖZEL KURAL — coverage "none": Model coverage "none" bildirmiş ve cevabı YALNIZCA',
    '"kaynaklarımda bu konu geçmiyor" + "alime/fetva merciine danış" içeriyorsa bu İSTENEN',
    'davranıştır: groundedness=5, faithfulness=5, citationCorrectness=correct,',
    'unsupportedClaims=[] ve verdict=pass ver. "Kaynak yok" ifadesini ve yönlendirmeyi',
    'dayanaksız iddia SAYMA. Ancak cevap buna ek olarak hafızadan dini hüküm/ilke/kriter',
    "eklemişse o cümleleri unsupportedClaims'e yaz ve verdict'i düşür.",
  ].join('\n');

  const result = await generateObject({
    model: provider(model),
    schema: chatJudgeSchema,
    system: JUDGE_SYSTEM_PROMPT,
    prompt,
    abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
    maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
    providerOptions: {
      openai: { reasoningEffort: 'low', textVerbosity: 'low' },
    },
  });

  return { output: result.object, usage: result.usage, model };
}
