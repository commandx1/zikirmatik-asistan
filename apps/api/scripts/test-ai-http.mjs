/* global console, process, fetch */
/**
 * AI Rehber endpoint'ini gerçek HTTP isteğiyle test eder — kullanıcının
 * gördüğü ham API yanıtını terminale basar.
 *
 * Kullanım:
 *   API_TOKEN=<jwt> node scripts/test-ai-http.mjs "kaygılıyım huzur bulmak istiyorum"
 *   API_TOKEN=<jwt> node scripts/test-ai-http.mjs            # hazır örnek sorgular
 *   API_TOKEN=<jwt> API_BASE_URL=http://localhost:3001 node scripts/test-ai-http.mjs "şükür"
 *
 * Token nereden alınır:
 *   Mobil uygulamada __DEV__ modunda network isteğine bakarak Authorization
 *   header'ındaki "Bearer <token>" kısmını kopyala; ya da .env dosyasına
 *   API_TOKEN=... olarak ekle.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const DEFAULT_QUERIES = [
  'çok kaygılıyım, içim huzursuz',
  "Allah'a şükretmek istiyorum",
  'günahlarımdan tövbe etmek istiyorum',
  'sınavım var, başarı ve kolaylık için dua',
  'asdfgh123',
];

async function recommend(baseUrl, token, freeText) {
  const body = {
    ...(freeText ? { freeText } : {}),
    maxRecommendations: 5,
    timeContext: {
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isSpecialDay: false,
    },
  };

  const res = await fetch(`${baseUrl}/v1/ai/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  return { status: res.status, body: json };
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const token = process.env.API_TOKEN?.trim();
  if (!token) {
    console.error(
      'Hata: API_TOKEN bulunamadı.\n' +
        'Kullanım: API_TOKEN=<jwt> node scripts/test-ai-http.mjs "<sorgu>"',
    );
    process.exitCode = 1;
    return;
  }

  const baseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const queries = process.argv.slice(2);
  const finalQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;

  console.log(`\nAPI: ${baseUrl}  |  Sorgu sayısı: ${finalQueries.length}\n`);

  for (const freeText of finalQueries) {
    console.log('═'.repeat(78));
    console.log(`SORGU: "${freeText}"`);
    console.log('─'.repeat(78));

    const started = Date.now();
    let result;
    try {
      result = await recommend(baseUrl, token, freeText);
    } catch (err) {
      console.error(`  ✗ İstek başarısız: ${err.message}\n`);
      continue;
    }

    const elapsed = Date.now() - started;
    const data = result.body?.data ?? result.body;

    if (result.status !== 200 && result.status !== 201) {
      console.log(`\n  ✗ HTTP ${result.status}`);
      console.log(JSON.stringify(result.body, null, 2));
      console.log();
      continue;
    }

    if (data?.offTopic) {
      console.log(`\n  🚫 Off-topic — kullanıcı görecek mesaj:`);
      console.log(`  "${data.message}"`);
    } else {
      console.log(`\n  📝 ÖZET (summary):`);
      console.log(`  ${data?.reasoning ?? '(yok)'}`);
      console.log(`\n  ✅ ÖNERİLER (${data?.items?.length ?? 0} adet):`);
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const [idx, item] of items.entries()) {
        console.log(`  ${'─'.repeat(74)}`);
        console.log(`  ${idx + 1}. ${item.name?.tr ?? item.dhikrId ?? item.id}`);
        if (item.reason) console.log(`     💡 Neden: ${item.reason}`);
        if (item.nameArabic) console.log(`     ﷽  ${item.nameArabic}`);
        if (item.transliteration?.tr) console.log(`     🔤 Okunuş: ${item.transliteration.tr}`);
        if (item.meaning?.tr) console.log(`     📖 Anlam: ${item.meaning.tr}`);
        if (item.virtue?.tr) console.log(`     ✨ Fazilet: ${item.virtue.tr}`);
      }
      if (items.length === 0) console.log('    (boş)');
    }

    console.log(`\n  ⏱ ${elapsed}ms  |  model: ${data?.usedModel ?? '?'}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
