/* global console, process */
/**
 * READ-ONLY (by default) audit of the free-text `tags` / `suitableFor` /
 * `categories` string arrays across apps/api/scripts/data/*.mjs (aggregated
 * by scripts/data/sourceDataset.mjs → SOURCE_DATASETS[].dhikrItems[]).
 *
 * Amaç: bu alanlarda Türkçe ve İngilizce terimlerin karışık olarak yer
 * alması (örn. "ramazan" / "ramadan") arama kalitesini bozuyor — sorgular
 * her zaman Türkçe. Bu betik önce sadece RAPORLAR (--report); İngilizce
 * terimlerin kaldırılması ayrı bir onaylı adımdır (--apply).
 *
 * Kullanım:
 *   node scripts/audit-dataset-terms.mjs --report [--out <path>] [--dir <dataDir>]
 *   node scripts/audit-dataset-terms.mjs --apply --terms <terms.json> [--dir <dataDir>]
 *   node scripts/audit-dataset-terms.mjs --check [--dir <dataDir>]
 *
 * --terms <path> için beklenen format: { "remove": ["english term", ...] }
 *
 * --dir, hedef `scripts/data` dizinini değiştirmek için vardır (varsayılan:
 * gerçek `scripts/data`). --apply'ı gerçek dosyalar üzerinde çalıştırmadan
 * önce geçici bir kopya üzerinde test etmek için kullanılır.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = join(__dirname, 'data');
const FIELDS = ['tags', 'suitableFor', 'categories'];

function parseArgs(argv) {
  const args = {
    report: argv.includes('--report'),
    apply: argv.includes('--apply'),
    check: argv.includes('--check'),
    out: null,
    terms: null,
    dir: DEFAULT_DATA_DIR,
  };
  const outIndex = argv.indexOf('--out');
  if (outIndex !== -1 && argv[outIndex + 1]) {
    args.out = resolve(process.cwd(), argv[outIndex + 1]);
  }
  const termsIndex = argv.indexOf('--terms');
  if (termsIndex !== -1 && argv[termsIndex + 1]) {
    args.terms = resolve(process.cwd(), argv[termsIndex + 1]);
  }
  const dirIndex = argv.indexOf('--dir');
  if (dirIndex !== -1 && argv[dirIndex + 1]) {
    args.dir = resolve(process.cwd(), argv[dirIndex + 1]);
  }
  return args;
}

function listDataFiles(dataDir) {
  return readdirSync(dataDir)
    .filter((name) => name.endsWith('.mjs') && name !== 'sourceDataset.mjs')
    .sort();
}

/**
 * dataDir içindeki sourceDataset.mjs'i (varsayılan olmayan bir dizinde bile)
 * dinamik olarak import eder. Cache-busting query param ile, aynı process
 * içinde birden çok kez farklı içerikle import edilebilmesini sağlar.
 */
async function loadSourceDatasets(dataDir) {
  const entryPath = join(dataDir, 'sourceDataset.mjs');
  const url = `${pathToFileURL(entryPath).href}?t=${Date.now()}-${Math.random()}`;
  const mod = await import(url);
  return mod.SOURCE_DATASETS;
}

function readAllDataFileContents(dataDir) {
  const files = listDataFiles(dataDir);
  const contents = new Map();
  for (const file of files) {
    contents.set(file, readFileSync(join(dataDir, file), 'utf8'));
  }
  return contents;
}

/**
 * SOURCE_DATASETS üzerinde gezinip her field (tags/suitableFor/categories)
 * için görülen her terimin sayısını ve geçtiği dataset key'lerini toplar.
 */
function collectTermStats(datasets) {
  const stats = { tags: new Map(), suitableFor: new Map(), categories: new Map() };
  for (const dataset of datasets) {
    if (!Array.isArray(dataset.dhikrItems)) continue;
    for (const item of dataset.dhikrItems) {
      for (const field of FIELDS) {
        const values = Array.isArray(item[field]) ? item[field] : [];
        for (const term of values) {
          if (typeof term !== 'string' || !term.trim()) continue;
          const map = stats[field];
          const entry = map.get(term) ?? { count: 0, datasets: new Set() };
          entry.count += 1;
          entry.datasets.add(dataset.key);
          map.set(term, entry);
        }
      }
    }
  }
  return stats;
}

function findFilesContainingTerm(term, fileContents) {
  const singleQuoted = `'${term.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const doubleQuoted = `"${term.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const files = [];
  for (const [file, content] of fileContents) {
    if (content.includes(singleQuoted) || content.includes(doubleQuoted)) {
      files.push(file);
    }
  }
  return files;
}

async function runReport(args) {
  const datasets = await loadSourceDatasets(args.dir);
  const stats = collectTermStats(datasets);
  const fileContents = readAllDataFileContents(args.dir);

  const fields = {};
  const summary = {};
  for (const field of FIELDS) {
    const entries = [...stats[field].entries()]
      .map(([term, { count, datasets: datasetSet }]) => ({
        term,
        count,
        datasets: [...datasetSet].sort(),
        files: findFilesContainingTerm(term, fileContents).sort(),
      }))
      .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
    fields[field] = entries;
    summary[field] = entries.length;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dataDir: args.dir,
    datasetCount: datasets.length,
    fields,
  };

  const json = JSON.stringify(report, null, 2);
  if (args.out) {
    writeFileSync(args.out, `${json}\n`, 'utf8');
    console.log(`Rapor yazıldı: ${args.out}`);
  } else {
    console.log(json);
  }

  console.log('--- Özet (distinct terim sayısı) ---');
  for (const field of FIELDS) {
    console.log(`${field}: ${summary[field]}`);
  }
  return report;
}

/**
 * inner (bir dizi literalinin `[` ile `]` arasındaki metni) içindeki string
 * elemanlarını sırayla çıkarır. Her eleman: { raw (tırnaklar dahil), value
 * (unescaped) }.
 */
function parseStringArrayElements(inner) {
  const regex = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g;
  const elements = [];
  let match;
  while ((match = regex.exec(inner)) !== null) {
    const raw = match[0];
    const body = raw.slice(1, -1);
    elements.push({ raw, value: unescapeLiteral(body) });
  }
  return elements;
}

function unescapeLiteral(body) {
  return body.replace(/\\(['"\\])/g, '$1');
}

/**
 * Bir field bloğunu (field: [ ... ]) yeniden yazar. Orijinal tek-satır /
 * çok-satır biçimini korur; sadece kaldırılan elemanlar farklıysa yeniden
 * biçimlendirir.
 */
function rebuildFieldBlock(fieldName, fieldIndent, inner, keptElements) {
  const isMultiline = /\n/.test(inner);
  if (!isMultiline) {
    return `${fieldName}: [${keptElements.map((el) => el.raw).join(', ')}]`;
  }
  const elementIndent = `${fieldIndent}  `;
  const lines = keptElements.map((el) => `${elementIndent}${el.raw},`);
  return `${fieldName}: [\n${lines.join('\n')}\n${fieldIndent}]`;
}

function getLineIndent(content, matchIndex) {
  const lineStart = content.lastIndexOf('\n', matchIndex - 1) + 1;
  const linePrefix = content.slice(lineStart, matchIndex);
  const indentMatch = linePrefix.match(/^\s*/);
  return indentMatch ? indentMatch[0] : '';
}

/**
 * Bir dosya içeriğinde tags/suitableFor/categories dizilerinden removeSet
 * içindeki terimleri çıkarır. String-seviyesinde çalışır; diğer satırlara
 * dokunmaz. Boşalacak diziler DEĞİŞTİRİLMEZ (rapor edilir).
 */
function removeTermsFromContent(content, removeSet) {
  const blockRegex = /\b(tags|suitableFor|categories):\s*\[([\s\S]*?)\]/g;
  let result = '';
  let lastIndex = 0;
  let removedCount = 0;
  const emptiedBlocks = [];
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const [full, fieldName, inner] = match;
    const elements = parseStringArrayElements(inner);
    if (elements.length === 0) {
      result += content.slice(lastIndex, match.index + full.length);
      lastIndex = match.index + full.length;
      continue;
    }
    const kept = elements.filter((el) => !removeSet.has(el.value));
    if (kept.length === elements.length) {
      // Bu blokta çıkarılacak bir şey yok; dokunma.
      result += content.slice(lastIndex, match.index + full.length);
      lastIndex = match.index + full.length;
      continue;
    }
    if (kept.length === 0) {
      emptiedBlocks.push({ fieldName, index: match.index });
      result += content.slice(lastIndex, match.index + full.length);
      lastIndex = match.index + full.length;
      continue;
    }
    removedCount += elements.length - kept.length;
    const fieldIndent = getLineIndent(content, match.index);
    const rebuilt = rebuildFieldBlock(fieldName, fieldIndent, inner, kept);
    result += content.slice(lastIndex, match.index) + rebuilt;
    lastIndex = match.index + full.length;
  }
  result += content.slice(lastIndex);
  return { content: result, removedCount, emptiedBlocks };
}

async function runApply(args) {
  if (!args.terms) {
    console.error('Hata: --apply için --terms <path> zorunlu.');
    process.exitCode = 1;
    return;
  }
  if (!existsSync(args.terms)) {
    console.error(`Hata: terms dosyası bulunamadı: ${args.terms}`);
    process.exitCode = 1;
    return;
  }
  const termsPayload = JSON.parse(readFileSync(args.terms, 'utf8'));
  const removeList = Array.isArray(termsPayload.remove) ? termsPayload.remove : [];
  if (removeList.length === 0) {
    console.log('Kaldırılacak terim yok (remove listesi boş). Hiçbir şey yapılmadı.');
    return;
  }
  const removeSet = new Set(removeList);

  const files = listDataFiles(args.dir);
  let totalRemoved = 0;
  const refused = [];
  for (const file of files) {
    const filePath = join(args.dir, file);
    const original = readFileSync(filePath, 'utf8');
    const { content, removedCount, emptiedBlocks } = removeTermsFromContent(original, removeSet);
    if (emptiedBlocks.length > 0) {
      for (const block of emptiedBlocks) {
        refused.push({ file, field: block.fieldName });
      }
    }
    if (removedCount > 0) {
      writeFileSync(filePath, content, 'utf8');
      totalRemoved += removedCount;
      console.log(`${file}: ${removedCount} terim kaldırıldı.`);
    }
  }

  console.log(`--- Toplam kaldırılan terim: ${totalRemoved} ---`);
  if (refused.length > 0) {
    console.log('--- Boşalacağı için DOKUNULMAYAN diziler (manuel karar gerekli) ---');
    for (const item of refused) {
      console.log(`${item.file}: ${item.field}`);
    }
  }
}

async function runCheck(args) {
  const before = await loadSourceDatasets(args.dir);
  const countItems = (datasets) =>
    datasets.reduce((sum, d) => sum + (Array.isArray(d.dhikrItems) ? d.dhikrItems.length : 0), 0);
  const beforeCount = countItems(before);

  let importOk = true;
  let afterCount = beforeCount;
  try {
    const after = await loadSourceDatasets(args.dir);
    afterCount = countItems(after);
  } catch (error) {
    importOk = false;
    console.error('Import başarısız:', error.message);
  }

  console.log(`Dataset sayısı: ${before.length}`);
  console.log(`Toplam dhikrItems: ${beforeCount}`);
  console.log(`Import başarılı: ${importOk}`);
  console.log(`Item sayısı değişti mi: ${afterCount !== beforeCount}`);

  if (!importOk || afterCount !== beforeCount) {
    process.exitCode = 1;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.apply) {
    await runApply(args);
    return;
  }
  if (args.check) {
    await runCheck(args);
    return;
  }
  if (args.report) {
    await runReport(args);
    return;
  }

  console.log(
    'Kullanım: node scripts/audit-dataset-terms.mjs --report [--out <path>] | --apply --terms <path> | --check [--dir <dir>]',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Test yardımcıları (unit-check için dışa açılır; production akışında kullanılmaz).
export { removeTermsFromContent, collectTermStats, parseStringArrayElements };
