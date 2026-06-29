/* global console, process */
/**
 * AI Rehber öneri pipeline'ını (Stage A: LLM intent extraction + MongoDB score,
 * Stage B: LLM rerank) DB'ye yazmadan, terminalden test etmek için araç.
 *
 * Kullanım:
 *   node scripts/test-ai-recommend.mjs "kaygılıyım huzur bulmak istiyorum"
 *   node scripts/test-ai-recommend.mjs "şükür" "tövbe etmek istiyorum"   # birden çok sorgu
 *   node scripts/test-ai-recommend.mjs                                   # hazır örnek set
 *
 * Ayarlanabilir (env veya .env):
 *   OPENAI_MODEL (varsayılan: gpt-4.1-mini) | AI_MAX_REC (5)
 *   SHOW_CANDIDATES=1  → Stage A'dan gelen adayları skorlarıyla göster
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// ai.service.ts:KNOWN_CATEGORIES ile BİREBİR aynı tutulmalı.
// ─────────────────────────────────────────────────────────────────────────────
const KNOWN_CATEGORIES = [
  'acil dua', 'adab', 'adalet', 'afet', 'ahlak', 'aile', 'aile ilişkisi',
  'akşam', 'arefe', 'ayet', 'basiret', 'bayram', 'başarı', 'bereket', 'cami',
  'cemaat', 'cenaze', 'cennet', 'dua', 'egitim', 'esma', 'esmaul husna', 'ev',
  'ev hayatı', 'evlat', 'evlilik', 'ezan', 'eğitim', 'farz', 'gece namazı',
  'gelecek kaygısı', 'genel', 'günlük', 'günlük hayat', 'günlük sünnet',
  'güzel ahlak', 'hac', 'hacet', 'haksızlık', 'hamd', 'hastalık', 'hidayet',
  'hikmet', 'huzur', 'ibadet', 'ilim', 'ilişkiler', 'iman', 'ismi azam',
  'istiaze', 'istikamet', 'istiğfar', 'itibar', 'iş hayatı', 'iş kariyer',
  'kalp', 'kandil', 'kapsamlı', 'karakter', 'kariyer', 'kaygı yönetimi',
  'koruma', 'korunma', 'koruyucu', 'kulluk', "kur'an", 'kuran', 'kuran duası',
  'kurân', 'liderlik', 'manevi arınma', 'manevi destek', 'manevi gelişim',
  'maneviyat', 'muhabbet', 'muharrem', 'mülk', 'nafile', 'namaz', 'nazar',
  'nefis terbiyesi', 'oruç', 'rahmet', 'ramazan', 'rukye', 'rızık',
  'rızık bereket', 'sabah akşam', 'sabır', 'salavat', 'sevgi', 'sinav',
  'sosyal', 'sure', 'sünnet duaları', 'sıkıntı', 'sınav', 'tefekkür',
  'teheccüd', 'temel', 'tesbih', 'teselli', 'tevbe', 'tevekkül', 'tevhid',
  'tövbe', 'umut', 'uyku uyanış', 'vesvese', 'vitir', 'yardım', 'yemek',
  'yolculuk', 'zikir', 'zilhicce', 'âfiyet', 'ölüm', 'özel gün', 'özel günler',
  'özlü dualar', 'şifa', 'şükür',
];

// ─────────────────────────────────────────────────────────────────────────────
// Sistem prompt'ları — ai.service.ts ile BİREBİR aynı tutulmalı.
// ─────────────────────────────────────────────────────────────────────────────
const INTENT_SYSTEM_PROMPT = [
  'Sen bir İslami zikir arama asistanısın.',
  'Kullanıcının Türkçe metninden zikir arama niyetini çıkar.',
  `categories için yalnızca şu listeden eşleşenleri kullan: ${KNOWN_CATEGORIES.join(', ')}.`,
  'suitableFor: zikrin uygun olduğu durumlar (ör. "hasta", "yolcu", "anne").',
  'timeOfDay: sabah (05-12) → "morning", öğle-akşam (12-19) → "evening", gece (19-05) → "night", belirsiz → null.',
  'tags için metinde geçen İslami temaları Türkçe yaz (ör. "şükür", "namaz", "hac").',
  'Yalnızca JSON döndür: { "suitableFor": string[], "tags": string[], "categories": string[], "timeOfDay": string|null }',
].join(' ');

const RERANK_SYSTEM_INSTRUCTION = [
  'Sen bir İslami zikir öneri asistanısın.',
  'İLK ADIM — konu tespiti: freeText zikir, dua, manevi hal, niyet veya İslami yaşamla (huzur, şükür, bağışlanma, kaygı, rızık, şifa, koruma, sabır, tövbe vb.) alakalı mı?',
  'Aşağıdaki durumlarda off_topic: true döndür, recommendations dizisini boş bırak, summary yazma: (1) anlamsız/rastgele karakter dizisi (ör. "sllsd", "asdfg", "123abc"), (2) genel sohbet, selamlama veya asistana yönelik iltifat/kısa tepki (ör. "harikasın", "teşekkürler", "süper", "iyi iş", "nasılsın"), (3) model/sistem/teknik soru, (4) İslami yaşamla hiç ilgisi olmayan herhangi bir içerik. Adayların içeriğinden bağlam çıkarıp freeText\'i İslami niyet gibi yorumlama; karar her zaman freeText\'e göre verilmeli.',
  'Konu ilgiliyse → off_topic: false yap ve devam et.',
  'YALNIZCA verilen candidateDhikrs listesinden seçim yap; liste dışından ID üretme.',
  'Niyeti adayların fazilet (virtue), etiket (tags) ve kategori (categories) alanlarıyla eşleştirerek en uygunları seç.',
  'Niyete EN DOĞRUDAN hitap eden duaları öncele (ör. şifa isteyene doğrudan şifa/afiyet duaları). İstiğfar, tövbe veya genel zikir gibi yalnızca dolaylı/teğet ilgili olanları üst sıralara koyma; ancak doğrudan adaylar yetersizse alt sıralarda ekle.',
  'Duanın kime yönelik olduğuna dikkat et: kullanıcı kendisi için istiyorsa birinci şahıs duaları tercih et; başkası için olanları kullanıcı bunu açıkça belirtmedikçe önceleme.',
  'Zaman bağlamını (timeOfDay, suitableFor) ikincil kriter olarak kullan.',
  'En fazla {MAX} zikir seç ve en uygundan başlayarak sırala. {MAX} bir üst sınırdır, doldurulması gereken bir hedef değildir.',
  'Sırf listeyi doldurmak için alakası zayıf bir duayı EKLEME.',
  'Her seçtiğin zikir için recommendations dizisine bir nesne ekle: id (candidate id) ve reason.',
  "Her reason yalnızca o id'nin kendi fazilet/etiket/kategori içeriğinden türemeli.",
  'reason ve summary doğrudan kullanıcıya gösterilecek; insanî, sıcak ve empatik bir dil kullan; id veya teknik alan adı yazma.',
  'summary, kullanıcının niyetini anlayan 2-3 cümlelik sıcak ve destekleyici bir girişdir: önce niyeti veya hissi samimiyetle kabul et; uygun yerlerde "inşallah", "Allah kabul etsin", "maşallah", "Allah kolaylık versin" gibi İslami ifadeler kullan; ardından bu seçimlerin neden yardımcı olabileceğini umut verici ve dua dolu bir dille belirt. Belirli zikir/dua isimleri içermez.',
  'Yalnızca JSON döndür.',
];

const DEFAULT_QUERIES = [
  'çok kaygılıyım, içim huzursuz',
  "Allah'a şükretmek istiyorum",
  'günahlarımdan tövbe etmek istiyorum',
  'sınavım var, başarı ve kolaylık için dua',
  'asdfgh123', // off-topic kontrolü
];

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const i = trimmed.indexOf('=');
      if (i <= 0) continue;
      const key = trimmed.slice(0, i).trim();
      let value = trimmed.slice(i + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function modelSupportsTemperature(model) {
  return !/^(gpt-5|o\d)/i.test(model);
}

function toCandidate(doc) {
  return {
    id: doc._id.toString(),
    nameTurkish: doc.nameTurkish,
    virtue: doc.virtue,
    tags: doc.tags ?? [],
    categories: doc.categories ?? [],
    timeOfDay: doc.timeOfDay,
    suitableFor: doc.suitableFor ?? [],
  };
}

async function extractIntent(openai, model, freeText) {
  try {
    const response = await openai.chat.completions.create({
      model,
      ...(modelSupportsTemperature(model) ? { temperature: 0 } : {}),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTENT_SYSTEM_PROMPT },
        { role: 'user', content: freeText },
      ],
    });
    const text = response.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text);
    return {
      suitableFor: Array.isArray(parsed.suitableFor) ? parsed.suitableFor : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      timeOfDay: typeof parsed.timeOfDay === 'string' ? parsed.timeOfDay : null,
      _tokens: response.usage,
    };
  } catch (err) {
    console.log(`  ⚠ Intent extraction başarısız: ${err.message}`);
    return null;
  }
}

async function getMongodbCandidates(dhikrs, intent, timeContext) {
  if (
    intent &&
    (intent.suitableFor.length > 0 ||
      intent.tags.length > 0 ||
      intent.categories.length > 0 ||
      intent.timeOfDay)
  ) {
    const scored = dhikrs.map((doc) => {
      const sfMatch = (doc.suitableFor ?? []).filter((v) =>
        intent.suitableFor.includes(v),
      ).length;
      const tagMatch = (doc.tags ?? []).filter((v) =>
        intent.tags.includes(v),
      ).length;
      const catMatch = (doc.categories ?? []).filter((v) =>
        intent.categories.includes(v),
      ).length;
      const timeMatch =
        intent.timeOfDay && doc.timeOfDay === intent.timeOfDay ? 2 : 0;
      const score = catMatch * 3 + tagMatch * 2 + sfMatch * 1 + timeMatch;
      return { doc, score };
    });

    scored.sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : (b.doc.recommendedCount ?? 0) - (a.doc.recommendedCount ?? 0),
    );

    return scored.slice(0, 10);
  }

  // Zaman tabanlı fallback
  const hour = timeContext.hour;
  const timeOfDay =
    hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 19 ? 'evening' : 'night';

  const filtered = dhikrs
    .filter(
      (d) => d.timeOfDay === timeOfDay || d.timeOfDay === 'any',
    )
    .sort((a, b) => (b.recommendedCount ?? 0) - (a.recommendedCount ?? 0))
    .slice(0, 10);

  return filtered.map((doc) => ({ doc, score: 0 }));
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const queries = process.argv.slice(2);
  const finalQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini';
  const maxRec = Number(process.env.AI_MAX_REC) || 5;
  const showCandidates = process.env.SHOW_CANDIDATES === '1';

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('OPENAI_API_KEY bulunamadı.');
  }
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error('MONGODB_URI bulunamadı.');
  }

  const { default: mongoose } = await import('mongoose');
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() });

  await mongoose.connect(process.env.MONGODB_URI.trim(), { autoIndex: false });

  console.log(
    `\nModel: ${model}  |  maxRec: ${maxRec}  |  temperature: ${
      modelSupportsTemperature(model) ? '0.2 (rerank) / 0 (intent)' : '(gönderilmiyor)'
    }\n`,
  );

  try {
    const dhikrsColl = mongoose.connection.collection('dhikrs');
    const catalog = await dhikrsColl
      .find(
        { isVerified: true, isActive: true },
        {
          projection: {
            nameTurkish: 1, nameArabic: 1, transliteration: 1,
            meaning: 1, virtue: 1, source: 1,
            tags: 1, categories: 1, timeOfDay: 1, suitableFor: 1,
            recommendedCount: 1,
          },
        },
      )
      .toArray();

    console.log(`Katalog: ${catalog.length} aktif/doğrulanmış dhikr.\n`);

    const now = new Date();
    const timeContext = {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      isSpecialDay: false,
    };

    for (const freeText of finalQueries) {
      console.log('═'.repeat(78));
      console.log(`SORGU: "${freeText}"`);
      console.log('─'.repeat(78));

      const started = Date.now();

      // ── Stage A-1: Intent extraction ──
      const intent = await extractIntent(openai, model, freeText);
      if (intent) {
        console.log(`\n  [Stage A-1] Intent: suitableFor=[${intent.suitableFor.join(', ')}] tags=[${intent.tags.join(', ')}] categories=[${intent.categories.join(', ')}] timeOfDay=${intent.timeOfDay ?? 'null'}`);
        console.log(`              Tokens: ${intent._tokens?.prompt_tokens ?? '?'} in / ${intent._tokens?.completion_tokens ?? '?'} out`);
      } else {
        console.log('\n  [Stage A-1] Intent extraction başarısız → zaman tabanlı fallback');
      }

      // ── Stage A-2: MongoDB score ──
      const scoredCandidates = await getMongodbCandidates(catalog, intent, timeContext);

      if (showCandidates) {
        console.log(`\n  [Stage A-2] Top ${scoredCandidates.length} aday (skor):`);
        scoredCandidates.forEach((s, idx) => {
          console.log(
            `    ${String(idx + 1).padStart(2)}. score=${s.score}  ${s.doc.nameTurkish}  [${(s.doc.suitableFor ?? []).join(', ')}]`,
          );
        });
      }

      const candidateDhikrs = scoredCandidates.map((s) => toCandidate(s.doc));
      const fullById = new Map(scoredCandidates.map((s) => [s.doc._id.toString(), s.doc]));

      // ── Stage B: LLM rerank ──
      const systemInstruction = RERANK_SYSTEM_INSTRUCTION.join(' ').replace(
        /\{MAX\}/g,
        String(maxRec),
      );
      const promptPayload = {
        freeText,
        timeContext,
        recentDhikrIds: [],
        candidateDhikrs,
        outputFormat: {
          off_topic: 'boolean',
          recommendations: [{ id: 'string (candidate id)', reason: 'string' }],
          summary: 'string',
        },
      };

      const request = {
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: JSON.stringify(promptPayload) },
        ],
      };
      if (modelSupportsTemperature(model)) {
        request.temperature = Number(process.env.OPENAI_TEMPERATURE) || 0.2;
      }

      let parsed;
      let usage;
      try {
        const response = await openai.chat.completions.create(request);
        usage = response.usage;
        parsed = JSON.parse(response.choices?.[0]?.message?.content ?? '{}');
      } catch (error) {
        console.log(`  ⚠ LLM rerank başarısız: ${error.message}\n`);
        continue;
      }

      const elapsed = Date.now() - started;

      // ── Sonuç ──
      if (parsed.off_topic === true) {
        console.log('\n  🚫 off_topic: true (öneri yok)');
      } else {
        console.log(`\n  📝 ÖZET: ${parsed.summary ?? '(yok)'}`);
        console.log('\n  ✅ ÖNERİLER:');
        const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
        recs.forEach((r, idx) => {
          const doc = fullById.get(r.id);
          const name = doc ? doc.nameTurkish : `⚠ LİSTE DIŞI ID (${r.id})`;
          console.log(`  ${'─'.repeat(74)}`);
          console.log(`  ${idx + 1}. ${name}`);
          console.log(`     💡 Neden: ${r.reason ?? ''}`);
          if (doc) {
            if (doc.nameArabic) console.log(`     ﷽  ${doc.nameArabic}`);
            if (doc.transliteration) console.log(`     🔤 Okunuş: ${doc.transliteration}`);
            if (doc.meaning) console.log(`     📖 Anlam: ${doc.meaning}`);
            if (doc.virtue) console.log(`     ✨ Fazilet: ${doc.virtue}`);
            if (doc.source) console.log(`     📚 Kaynak: ${doc.source}`);
          }
        });
        if (recs.length === 0) console.log('    (boş)');
      }

      console.log(
        `\n  ⏱ ${elapsed}ms  |  rerank token: ${usage?.prompt_tokens ?? '?'} in / ${
          usage?.completion_tokens ?? '?'
        } out\n`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
