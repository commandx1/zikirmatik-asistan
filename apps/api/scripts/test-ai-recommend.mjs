/* global console, process */
/**
 * AI Rehber öneri pipeline'ını (Stage A embedding retrieval + Stage B LLM rerank)
 * DB'ye yazmadan, terminalden test etmek için araç. Prod akışıyla (ai.service.ts)
 * birebir aynı sistem prompt'u, modeli ve parametreleri kullanır.
 *
 * Kullanım:
 *   node scripts/test-ai-recommend.mjs "kaygılıyım huzur bulmak istiyorum"
 *   node scripts/test-ai-recommend.mjs "şükür" "tövbe etmek istiyorum"   # birden çok sorgu
 *   node scripts/test-ai-recommend.mjs                                   # hazır örnek set
 *
 * Ayarlanabilir (env veya .env):
 *   OPENAI_MODEL (vars: gpt-5.4-mini) | AI_RETRIEVAL_TOP_K (20) | AI_MAX_REC (5)
 *   SHOW_CANDIDATES=1  -> getirilen tüm adayları skorlarıyla göster
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { embed } from './lib/embedding.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// Sistem prompt'u — ai.service.ts:574-588 ile BİREBİR aynı tutulmalı.
// İyileştirmeleri burada deneyip beğenince ai.service.ts'e taşıyacağız.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = [
  'Sen bir İslami zikir öneri asistanısın.',
  'İLK ADIM — konu tespiti: freeText zikir, dua, manevi hal, niyet veya İslami yaşamla (huzur, şükür, bağışlanma, kaygı, rızık, şifa, koruma, sabır, tövbe vb.) alakalı mı?',
  'Aşağıdaki durumlarda off_topic: true döndür, recommendations dizisini boş bırak, summary yazma: (1) anlamsız/rastgele karakter dizisi (ör. "sllsd", "asdfg", "123abc"), (2) genel sohbet veya selamlama, (3) model/sistem/teknik soru, (4) İslami yaşamla hiç ilgisi olmayan herhangi bir içerik.',
  'Konu ilgiliyse → off_topic: false yap ve devam et.',
  'YALNIZCA verilen candidateDhikrs listesinden seçim yap; liste dışından ID üretme.',
  'Niyeti adayların fazilet (virtue), etiket (tags) ve kategori (categories) alanlarıyla eşleştirerek en uygunları seç.',
  'Niyete EN DOĞRUDAN hitap eden duaları öncele (ör. şifa isteyene doğrudan şifa/afiyet duaları). İstiğfar, tövbe veya genel zikir gibi yalnızca dolaylı/teğet ilgili olanları üst sıralara koyma; ancak doğrudan adaylar yetersizse ve alt sıralarda ekle.',
  'Duanın kime yönelik olduğuna dikkat et: kullanıcı kendisi için istiyorsa kendine yönelik (birinci şahıs) duaları tercih et; başkası ya da hasta ziyareti için olanları kullanıcı bunu açıkça belirtmedikçe önceleme.',
  'Zaman bağlamını (timeOfDay, suitableFor) ikincil kriter olarak kullan.',
  'En fazla {MAX} zikir seç ve en uygundan başlayarak sırala. {MAX} bir üst sınırdır, doldurulması gereken bir hedef değildir: niyetle gerçekten alakalı yeterli aday yoksa daha az öner (ör. yalnızca 2-3).',
  'Sırf listeyi doldurmak için alakası zayıf ya da niyetle çelişen bir duayı EKLEME. Bir adayın reason\'ını yazarken niyetten farklı/uzak olduğunu ifade ediyorsan, o adayı hiç ekleme (ör. sınav niyetine rızık/borç duası ekleme).',
  'Her seçtiğin zikir için recommendations dizisine bir nesne ekle: id (candidate id) ve reason (o zikrin neden seçildiği).',
  "ÇOK ÖNEMLİ: recommendations içinde aynı candidate id birden fazla kez ASLA yer almamalı; her öğe farklı bir id olmalı. Aynı duayı iki kez yazma.",
  'Her reason yalnızca o id\'nin kendi fazilet/etiket/kategori içeriğinden türemeli; başka bir duanın özelliğini o reason\'a yazma.',
  "Yalnızca recommendations dizisindeki id'lerden bahset; listede olmayan bir zikri reason veya summary içinde anma.",
  'reason ve summary doğrudan kullanıcıya gösterilecek; insanî, sıcak ve empatik bir dil kullan; id veya teknik alan adı yazma.',
  'summary, kullanıcının niyetini anlayan 2-3 cümlelik sıcak bir girişdir: önce niyeti/hissi kabul et, sonra bu seçimlerin neden yardımcı olabileceğini kısaca belirt. Belirli zikir/dua isimleri içermez.',
  'Yalnızca JSON döndür.',
];

const DEFAULT_QUERIES = [
  'çok kaygılıyım, içim huzursuz',
  'Allah’a şükretmek istiyorum',
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

function cosineSimilarity(a, b) {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function toCandidate(item) {
  return {
    id: item._id.toString(),
    nameTurkish: item.nameTurkish,
    virtue: item.virtue,
    tags: item.tags,
    categories: item.categories,
    timeOfDay: item.timeOfDay,
    suitableFor: item.suitableFor,
  };
}

function modelSupportsTemperature(model) {
  return !/^(gpt-5|o\d)/i.test(model);
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const queries = process.argv.slice(2);
  const finalQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.4-mini';
  const topK = Number(process.env.AI_RETRIEVAL_TOP_K) || 20;
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
    `\nModel: ${model}  |  topK: ${topK}  |  maxRec: ${maxRec}  |  temperature: ${
      modelSupportsTemperature(model) ? '0.2' : '(gönderilmiyor)'
    }\n`,
  );

  try {
    const dhikrs = mongoose.connection.collection('dhikrs');
    const catalog = await dhikrs
      .find(
        { isVerified: true, isActive: true },
        {
          projection: {
            nameTurkish: 1,
            nameArabic: 1,
            transliteration: 1,
            meaning: 1,
            virtue: 1,
            source: 1,
            tags: 1,
            categories: 1,
            timeOfDay: 1,
            suitableFor: 1,
            embedding: 1,
          },
        },
      )
      .toArray();

    const withVectors = catalog.filter(
      (d) => Array.isArray(d.embedding) && d.embedding.length > 0,
    );
    console.log(
      `Katalog: ${catalog.length} aktif/doğrulanmış, ${withVectors.length} embedding'li.\n`,
    );

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

      // ── Stage A: embedding retrieval ──
      const queryVector = await embed(freeText);
      if (!queryVector) {
        console.log('  ⚠ Sorgu embedding üretilemedi, atlanıyor.\n');
        continue;
      }

      const scored = withVectors
        .map((d) => ({ doc: d, score: cosineSimilarity(queryVector, d.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      if (showCandidates) {
        console.log(`\n  [Stage A] Getirilen ${scored.length} aday (skorla):`);
        scored.forEach((s, idx) => {
          console.log(
            `    ${String(idx + 1).padStart(2)}. ${s.score.toFixed(4)}  ${s.doc.nameTurkish}`,
          );
        });
      }

      const candidateDhikrs = scored.map((s) => toCandidate(s.doc));
      // Görüntüleme için tam döküman (LLM'e gönderilen sade candidate'tan ayrı).
      const fullById = new Map(scored.map((s) => [s.doc._id.toString(), s.doc]));

      // ── Stage B: LLM rerank ──
      const systemInstruction = SYSTEM_INSTRUCTION.join(' ').replace(
        '{MAX}',
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
        console.log(`  ⚠ LLM çağrısı başarısız: ${error.message}\n`);
        continue;
      }

      const elapsed = Date.now() - started;

      // ── Sonuç ──
      if (parsed.off_topic === true) {
        console.log('\n  🚫 off_topic: true (öneri yok)');
      } else {
        console.log(`\n  📝 ÖZET: ${parsed.summary ?? '(yok)'}`);
        console.log('\n  ✅ ÖNERİLER:');
        const recs = Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [];
        recs.forEach((r, idx) => {
          const doc = fullById.get(r.id);
          const name = doc ? doc.nameTurkish : `⚠ LİSTE DIŞI ID (${r.id})`;
          console.log(`  ${'─'.repeat(74)}`);
          console.log(`  ${idx + 1}. ${name}`);
          console.log(`     💡 Neden: ${r.reason ?? ''}`);
          if (doc) {
            if (doc.nameArabic) console.log(`     ﷽  ${doc.nameArabic}`);
            if (doc.transliteration)
              console.log(`     🔤 Okunuş: ${doc.transliteration}`);
            if (doc.meaning) console.log(`     📖 Anlam: ${doc.meaning}`);
            if (doc.virtue) console.log(`     ✨ Fazilet: ${doc.virtue}`);
            if (doc.source) console.log(`     📚 Kaynak: ${doc.source}`);
          }
        });
        if (recs.length === 0) console.log('    (boş)');
      }

      console.log(
        `\n  ⏱ ${elapsed}ms  |  token: ${usage?.prompt_tokens ?? '?'} in / ${
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
