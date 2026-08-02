/* global console, process */
/**
 * source_passages koleksiyonundaki bayat pasajları siler.
 *
 * seed-source-passages.mjs yalnızca upsert yapar, hiç silmez. Kaynak metni
 * yeniden üretildiğinde chunk sayısı azalırsa, eski chunkIndex'ler veritabanında
 * öksüz kalır ve AI Rehber retrieval'ında artık var olmayan metni döndürür.
 *
 * Bu betik her kaynak için jsonl'deki chunkIndex kümesini alır ve o kümede
 * olmayan kayıtları siler. Varsayılan kuru çalışmadır; silmek için --apply ver.
 *
 * Kullanım:
 *   node prune-stale-source-passages.mjs [--source <source_id>] [--apply]
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KAYNAKLAR_DIR = resolve(__dirname, '../../../docs/kaynaklar');
const MANIFEST_PATH = resolve(KAYNAKLAR_DIR, 'manifest.json');

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
    for (const line of readFileSync(absolutePath, 'utf8').split(/\r?\n/)) {
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

function loadChunkIndexes(sourceId) {
  const jsonlPath = resolve(KAYNAKLAR_DIR, `${sourceId}.passages.jsonl`);
  // jsonl yoksa geçerli chunk kümesini bilemeyiz; silme yapmak yerine atlanır.
  if (!existsSync(jsonlPath)) return null;
  const indexes = new Set();
  for (const line of readFileSync(jsonlPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    indexes.add(JSON.parse(line).chunkIndex);
  }
  return indexes;
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const sourceArgIndex = args.indexOf('--source');
  const onlySource = sourceArgIndex !== -1 ? args[sourceArgIndex + 1] : undefined;

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const sources = manifest.sources.filter(
    (entry) => !onlySource || entry.source_id === onlySource,
  );
  if (sources.length === 0) {
    throw new Error(`manifest.json içinde "${onlySource}" bulunamadı.`);
  }

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });

  try {
    const col = mongoose.connection.collection('source_passages');
    console.log(apply ? '=== SİLME UYGULANIYOR ===' : '=== KURU ÇALIŞMA (--apply yok) ===');

    let totalStale = 0;

    for (const source of sources) {
      const sourceId = source.source_id;
      const valid = loadChunkIndexes(sourceId);
      if (!valid) {
        console.log('');
        console.log(`[${sourceId}]`);
        console.log('  atlandı     : passages.jsonl yok, geçerli chunk kümesi bilinmiyor');
        continue;
      }

      const inDb = await col
        .find({ sourceId }, { projection: { chunkIndex: 1, passageId: 1 } })
        .toArray();

      const stale = inDb.filter((doc) => !valid.has(doc.chunkIndex));
      totalStale += stale.length;

      const staleIndexes = stale.map((d) => d.chunkIndex).sort((a, b) => a - b);
      console.log('');
      console.log(`[${sourceId}]`);
      console.log(`  jsonl chunk : ${valid.size}`);
      console.log(`  veritabanı  : ${inDb.length}`);
      console.log(`  bayat kayıt : ${stale.length}${staleIndexes.length ? ` (chunkIndex: ${staleIndexes.join(', ')})` : ''}`);

      if (apply && stale.length > 0) {
        const result = await col.deleteMany({
          passageId: { $in: stale.map((d) => d.passageId) },
        });
        console.log(`  silindi     : ${result.deletedCount}`);
      }
    }

    console.log('');
    console.log(`[özet] toplam bayat kayıt: ${totalStale}${apply ? ' (silindi)' : ' (silinmedi — --apply ver)'}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
