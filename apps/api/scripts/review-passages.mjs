/* global console, process */
/**
 * Passage review yardımcı aracı — `docs/kaynaklar/<source>.passages.jsonl`
 * dosyasını okuyup gözden geçirme raporu üretir ve `review` alanını toplu/tekil
 * olarak günceller.
 *
 * Bu betik `seed-source-passages.mjs --extract` (veya Yol B'de
 * `build-passages-from-verified.mjs`) ile `seed-source-passages.mjs --seed`
 * arasına girer: jsonl üretildikten sonra, seed edilmeden önce pasajlar burada
 * gözden geçirilir. MongoDB'ye bağlanmaz, hiçbir embedding/seed işlemi yapmaz.
 *
 * Kullanım:
 *   node review-passages.mjs --source <source_id> --report
 *   node review-passages.mjs --source <source_id> --approve-all [--except 3,7,9]
 *   node review-passages.mjs --source <source_id> --approve 1,2
 *   node review-passages.mjs --source <source_id> --reject 5,9
 *   node review-passages.mjs --help
 *
 * Ortak seçenek:
 *   --file <path>   jsonl dosyasının varsayılan konumunu
 *                   (docs/kaynaklar/<source>.passages.jsonl) geçersiz kılar.
 *                   Test/deneme amaçlı geçici bir kopya üzerinde çalışmak için
 *                   kullanılır; gerçek dosyayı etkilemez.
 *
 * Yalnızca `review` alanı değiştirilir; passageId, key sırası ve diğer bütün
 * alanlar olduğu gibi korunur. `.passages.jsonl` elle düzenlenmez kuralına
 * aykırı değildir çünkü bu betik "elle düzenleme" yerine kontrollü,
 * chunkIndex adresli tek bir alan güncellemesi yapar.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KAYNAKLAR_DIR = resolve(__dirname, '../../../docs/kaynaklar');
const MANIFEST_PATH = resolve(KAYNAKLAR_DIR, 'manifest.json');

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const FRONT_MATTER_MAX_PAGE = 12;
const SHORT_CHUNK_MAX_LENGTH = 200;
const ARABIC_RATIO_THRESHOLD = 10; // yüzde

const HELP_TEXT = `
review-passages.mjs — pasaj gözden geçirme raporu ve review alanı güncelleyici

Konum: seed-source-passages.mjs --extract (veya build-passages-from-verified.mjs)
ile seed-source-passages.mjs --seed arasında kullanılır. MongoDB'ye bağlanmaz.

Kullanım:
  node scripts/review-passages.mjs --source <source_id> --report
  node scripts/review-passages.mjs --source <source_id> --approve-all [--except 3,7,9]
  node scripts/review-passages.mjs --source <source_id> --approve 1,2
  node scripts/review-passages.mjs --source <source_id> --reject 5,9
  node scripts/review-passages.mjs --help

Seçenekler:
  --source <id>     manifest.json'daki source_id (zorunlu; --help hariç)
  --report          docs/kaynaklar/<id>.review-subset.md raporunu üretir
  --approve-all     tüm chunk'ları approved yapar
  --except <liste>  --approve-all ile birlikte: virgülle ayrılmış chunkIndex
                     listesi, bunlar approve edilmez (mevcut durumunda kalır)
  --approve <liste> virgülle ayrılmış chunkIndex listesini approved yapar
  --reject <liste>  virgülle ayrılmış chunkIndex listesini rejected yapar
  --file <path>     jsonl dosyasının yolunu geçersiz kılar (varsayılan:
                     docs/kaynaklar/<id>.passages.jsonl). Test amaçlı geçici
                     bir kopya üzerinde çalışmak için kullanılır.

Notlar:
  - --report hiçbir şeyi değiştirmez, yalnızca rapor dosyası yazar.
  - --approve-all / --approve / --reject yalnızca "review" alanını değiştirir;
    passageId, key sırası ve metin aynen korunur.
  - jsonl dosyası yoksa betik hata verip durur, hiçbir şey üretmez.
`;

function printHelp() {
  console.log(HELP_TEXT.trim());
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const read = (flag) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : undefined;
  };
  return {
    help: args.includes('--help') || args.includes('-h'),
    source: read('--source'),
    file: read('--file'),
    report: args.includes('--report'),
    approveAll: args.includes('--approve-all'),
    except: read('--except'),
    approve: read('--approve'),
    reject: read('--reject'),
  };
}

function parseChunkList(raw, flagName) {
  if (raw === undefined) {
    return [];
  }
  const items = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const parsed = items.map((part) => {
    const n = Number.parseInt(part, 10);
    if (!Number.isInteger(n) || n < 0 || String(n) !== part) {
      throw new Error(`${flagName} için geçersiz chunkIndex: "${part}"`);
    }
    return n;
  });

  return parsed;
}

function jsonlPathFor(source, fileOverride) {
  if (fileOverride) {
    return resolve(process.cwd(), fileOverride);
  }
  return resolve(KAYNAKLAR_DIR, `${source}.passages.jsonl`);
}

function reportPathFor(source) {
  return resolve(KAYNAKLAR_DIR, `${source}.review-subset.md`);
}

function loadManifestTitle(source) {
  try {
    if (!existsSync(MANIFEST_PATH)) {
      return source;
    }
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    const entry = manifest.sources?.find((s) => s.source_id === source);
    return entry?.title ?? source;
  } catch {
    return source;
  }
}

function loadRecords(jsonlPath) {
  if (!existsSync(jsonlPath)) {
    throw new Error(
      `jsonl dosyası bulunamadı: ${jsonlPath}\n` +
        'Önce "node scripts/seed-source-passages.mjs --extract --source <id>" ' +
        '(ya da Yol B için build-passages-from-verified.mjs) çalıştırılmalı.',
    );
  }
  const raw = readFileSync(jsonlPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line, i) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`jsonl satır ${i + 1} parse edilemedi: ${error.message}`);
    }
  });
}

function writeRecords(jsonlPath, records) {
  const lines = records.map((record) => JSON.stringify(record));
  writeFileSync(jsonlPath, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf8');
}

function countByReview(records) {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const record of records) {
    if (counts[record.review] === undefined) {
      counts[record.review] = 0;
    }
    counts[record.review] += 1;
  }
  return counts;
}

function formatCounts(counts) {
  return Object.entries(counts)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

function arabicRatio(text) {
  if (!text) {
    return 0;
  }
  const matches = text.match(ARABIC_RANGE);
  const arabicCount = matches ? matches.length : 0;
  return (arabicCount / text.length) * 100;
}

function computeFlags(records) {
  const flags = {
    frontMatter: [],
    short: [],
    arabicHeavy: [],
    duplicates: [], // { chunkIndex, duplicateOf: [chunkIndex...] }
  };

  const textToChunkIndexes = new Map();
  for (const record of records) {
    if (!textToChunkIndexes.has(record.text)) {
      textToChunkIndexes.set(record.text, []);
    }
    textToChunkIndexes.get(record.text).push(record.chunkIndex);
  }

  for (const record of records) {
    if (record.pageStart <= FRONT_MATTER_MAX_PAGE) {
      flags.frontMatter.push(record.chunkIndex);
    }
    if (record.text.length < SHORT_CHUNK_MAX_LENGTH) {
      flags.short.push(record.chunkIndex);
    }
    if (arabicRatio(record.text) > ARABIC_RATIO_THRESHOLD) {
      flags.arabicHeavy.push(record.chunkIndex);
    }
    const siblings = textToChunkIndexes.get(record.text);
    if (siblings.length > 1) {
      flags.duplicates.push({
        chunkIndex: record.chunkIndex,
        duplicateOf: siblings.filter((c) => c !== record.chunkIndex),
      });
    }
  }

  return flags;
}

function formatChunkRefs(chunkIndexes) {
  if (chunkIndexes.length === 0) {
    return '-';
  }
  return chunkIndexes.map((c) => `#${c}`).join(', ');
}

function buildReportMarkdown(source, title, records, flags) {
  const counts = countByReview(records);
  const pageMin = records.reduce((min, r) => Math.min(min, r.pageStart), Infinity);
  const pageMax = records.reduce((max, r) => Math.max(max, r.pageEnd), -Infinity);

  const lines = [];
  lines.push(`# ${title} — Review alt kümesi`);
  lines.push('');
  lines.push(
    `> Kaynak: \`docs/kaynaklar/${source}.passages.jsonl\` · toplam **${records.length}** chunk · sayfa ${pageMin}-${pageMax}.`,
  );
  lines.push(
    `> Durum: pending **${counts.pending}** · approved **${counts.approved}** · rejected **${counts.rejected}**.`,
  );
  lines.push('');
  lines.push(
    '> **Talimat:** Aşağıdaki her pasajı oku. Kabul edilmeyecekleri (yanlış/eksik/anlamsız chunk, mükerrer, yanlış sayfa) bana `chunkIndex` numarasıyla bildir; gerisini `approved` işaretleyeceğim. Hepsi uygunsa "hepsi onay" de.',
  );
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Otomatik bayraklar');
  lines.push('');
  lines.push(
    `- Kapak/içindekiler/önsöz olabilir (sayfa ≤ ${FRONT_MATTER_MAX_PAGE}) — **${flags.frontMatter.length}**: ${formatChunkRefs(flags.frontMatter)}`,
  );
  lines.push(
    `- Kısa chunk (<${SHORT_CHUNK_MAX_LENGTH} karakter) — **${flags.short.length}**: ${formatChunkRefs(flags.short)}`,
  );
  lines.push(
    `- Arapça harf oranı yüksek (>%${ARABIC_RATIO_THRESHOLD}) — **${flags.arabicHeavy.length}**: ${formatChunkRefs(flags.arabicHeavy)}`,
  );
  const duplicateChunks = flags.duplicates.map((d) => d.chunkIndex);
  const duplicatePairs = flags.duplicates
    .map((d) => `#${d.chunkIndex}↔${d.duplicateOf.map((c) => `#${c}`).join(',')}`)
    .join('; ');
  lines.push(
    `- Birebir mükerrer metin — **${duplicateChunks.length}**: ${duplicateChunks.length > 0 ? duplicatePairs : '-'}`,
  );
  lines.push('');
  lines.push(
    '> Bayraklar yalnızca önerilerdir; bu rapor hiçbir kaydı değiştirmez, review alanları elle/`--approve`, `--reject`, `--approve-all` ile ayrıca güncellenir.',
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const record of records) {
    const heading = record.sectionHeading ?? '—';
    lines.push(`### #${record.chunkIndex} · s.${record.pageStart}-${record.pageEnd} · ${heading}`);
    lines.push('');
    lines.push(`\`${record.passageId.slice(0, 12)}\``);
    lines.push('');
    lines.push('');
    lines.push(record.text);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Trailing separator already added by the loop; drop the last blank/--- pair
  // duplication by trimming trailing empty lines then ensuring single newline.
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n') + '\n';
}

function runReport({ source, file }) {
  const jsonlPath = jsonlPathFor(source, file);
  const records = loadRecords(jsonlPath);
  const title = loadManifestTitle(source);
  const flags = computeFlags(records);
  const markdown = buildReportMarkdown(source, title, records, flags);

  const outputPath = reportPathFor(source);
  writeFileSync(outputPath, markdown, 'utf8');

  const counts = countByReview(records);
  console.log(`[review] ${source}: ${records.length} chunk okundu (${jsonlPath})`);
  console.log(`[review] durum: ${formatCounts(counts)}`);
  console.log(
    `[review] bayraklar: kapak/önsöz=${flags.frontMatter.length}, kısa=${flags.short.length}, arapça-ağır=${flags.arabicHeavy.length}, mükerrer=${flags.duplicates.length}`,
  );
  console.log(`[review] yazıldı: ${outputPath}`);
}

function applyReviewChange({ source, file }, { mode, chunkIndexes, exceptList }) {
  const jsonlPath = jsonlPathFor(source, file);
  const records = loadRecords(jsonlPath);
  const beforeCounts = countByReview(records);

  const byChunkIndex = new Map(records.map((record) => [record.chunkIndex, record]));
  const changed = [];
  const notFound = [];

  if (mode === 'approve-all') {
    const exceptSet = new Set(exceptList);
    for (const record of records) {
      if (exceptSet.has(record.chunkIndex)) {
        continue;
      }
      if (record.review !== 'approved') {
        record.review = 'approved';
        changed.push(record.chunkIndex);
      }
    }
    for (const c of exceptList) {
      if (!byChunkIndex.has(c)) {
        notFound.push(c);
      }
    }
  } else {
    const targetReview = mode === 'approve' ? 'approved' : 'rejected';
    for (const chunkIndex of chunkIndexes) {
      const record = byChunkIndex.get(chunkIndex);
      if (!record) {
        notFound.push(chunkIndex);
        continue;
      }
      if (record.review !== targetReview) {
        record.review = targetReview;
        changed.push(chunkIndex);
      }
    }
  }

  writeRecords(jsonlPath, records);

  const afterCounts = countByReview(records);
  console.log(`[review] ${source}: ${jsonlPath}`);
  console.log(`[review] öncesi → ${formatCounts(beforeCounts)}`);
  console.log(`[review] değişen chunkIndex sayısı: ${changed.length}${changed.length > 0 ? ` (${changed.join(', ')})` : ''}`);
  if (notFound.length > 0) {
    console.warn(`[review] uyarı: bulunamayan chunkIndex: ${notFound.join(', ')}`);
  }
  console.log(`[review] sonrası → ${formatCounts(afterCounts)}`);
  console.log(`[review] yazıldı: ${jsonlPath}`);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.source) {
    printHelp();
    throw new Error('--source <id> zorunludur (--help hariç).');
  }

  const modes = [
    args.report && 'report',
    args.approveAll && 'approve-all',
    args.approve !== undefined && 'approve',
    args.reject !== undefined && 'reject',
  ].filter(Boolean);

  if (modes.length === 0) {
    printHelp();
    throw new Error('Bir mod belirtilmeli: --report, --approve-all, --approve veya --reject.');
  }
  if (modes.length > 1) {
    throw new Error(`Aynı anda yalnızca bir mod kullanılabilir, verilenler: ${modes.join(', ')}`);
  }

  const [mode] = modes;

  if (mode === 'report') {
    runReport(args);
    return;
  }

  if (mode === 'approve-all') {
    const exceptList = parseChunkList(args.except, '--except');
    applyReviewChange(args, { mode: 'approve-all', chunkIndexes: [], exceptList });
    return;
  }

  if (mode === 'approve') {
    const chunkIndexes = parseChunkList(args.approve, '--approve');
    applyReviewChange(args, { mode: 'approve', chunkIndexes, exceptList: [] });
    return;
  }

  if (mode === 'reject') {
    const chunkIndexes = parseChunkList(args.reject, '--reject');
    applyReviewChange(args, { mode: 'reject', chunkIndexes, exceptList: [] });
  }
}

main();
