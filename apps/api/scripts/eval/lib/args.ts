/**
 * Minik, bağımlılıksız CLI argüman ayrıştırıcı — hem `run-rehber-eval.ts`
 * hem `run-chat-eval.ts` aynı bayrak setini kullanır:
 *   --limit N          ilk N vakayla sınırla
 *   --ids a,b,c         yalnızca bu id'leri çalıştır
 *   --no-judge          LLM hakemini atla (yalnızca pipeline çalışır)
 *   --concurrency N     eşzamanlı vaka sayısı (varsayılan 3)
 *   --locale tr|en      dataset'i yalnızca bu locale ile sınırla
 *   --dry-run           dataset'i yükle, ÖZET yazdır, hiçbir AI/Mongo çağrısı yapma
 *
 * Yalnızca `run-retrieval-eval.ts` tarafından kullanılan ek bayraklar (diğer
 * runner'lar bunları basitçe hiç set etmez, zararsızdır):
 *   --write-expanded    üretilen expandedQuery'yi dataset JSON'ına geri yaz
 *   --baseline <path>   önceki bir JSON rapor ile delta karşılaştırması yap
 */
export type EvalArgs = {
  limit?: number;
  ids?: string[];
  noJudge: boolean;
  concurrency: number;
  locale?: 'tr' | 'en';
  dryRun: boolean;
  writeExpanded: boolean;
  baseline?: string;
};

function readValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} bir değer bekliyor.`);
  }
  return value;
}

export function parseArgs(rawArgv: string[]): EvalArgs {
  const args: EvalArgs = {
    noJudge: false,
    concurrency: 3,
    dryRun: false,
    writeExpanded: false,
  };

  // pnpm ("pnpm --filter api eval:rehber -- --dry-run") bazı sürümlerde
  // ayırıcı "--"yı script argv'sine OLDUĞU GİBİ ekliyor (npm bunu yutar).
  // Anlamsız bir token olduğu için burada güvenle filtrelenir.
  const argv = rawArgv.filter((token) => token !== '--');

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    switch (token) {
      case '--limit': {
        const value = readValue(argv, i, '--limit');
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error(`--limit geçersiz sayı: ${value}`);
        }
        args.limit = Math.floor(n);
        i++;
        break;
      }
      case '--ids': {
        const value = readValue(argv, i, '--ids');
        args.ids = value
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        i++;
        break;
      }
      case '--no-judge':
        args.noJudge = true;
        break;
      case '--concurrency': {
        const value = readValue(argv, i, '--concurrency');
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error(`--concurrency geçersiz sayı: ${value}`);
        }
        args.concurrency = Math.floor(n);
        i++;
        break;
      }
      case '--locale': {
        const value = readValue(argv, i, '--locale');
        if (value !== 'tr' && value !== 'en') {
          throw new Error(
            `--locale yalnızca 'tr' veya 'en' olabilir, verilen: ${value}`,
          );
        }
        args.locale = value;
        i++;
        break;
      }
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--write-expanded':
        args.writeExpanded = true;
        break;
      case '--baseline': {
        const value = readValue(argv, i, '--baseline');
        args.baseline = value;
        i++;
        break;
      }
      default:
        throw new Error(`Bilinmeyen argüman: ${token}`);
    }
  }

  return args;
}
