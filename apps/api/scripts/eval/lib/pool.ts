/**
 * En basit haliyle bir eşzamanlılık (concurrency) havuzu: `items`'ı en fazla
 * `concurrency` kadar paralel `worker` çağrısıyla işler. Bağımsız bir npm
 * paketi (`p-limit` vb.) eklemek yerine burada ~20 satırlık bir yardımcı
 * yeterli — tek kullanım yeri bu eval runner'ları.
 *
 * `worker` içindeki hatalar YUTULMAZ — çağıran taraf (run-*-eval.ts) her
 * vaka için kendi try/catch'ini yapar; burası yalnızca zamanlamayı yönetir.
 */
export async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const effectiveConcurrency = Math.max(
    1,
    Math.min(concurrency, items.length || 1),
  );
  let cursor = 0;

  async function runNext(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  }

  const workers = Array.from({ length: effectiveConcurrency }, () => runNext());
  await Promise.all(workers);
}
