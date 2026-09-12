# docs/eval/ — Eval Çıktıları ve Referans Dosyaları

Bu klasör, AI Rehber retrieval kalitesiyle ilgili elle gözden geçirilen ve
commit'e alınan eval çıktılarını barındırır. Eval'i **çalıştıran** kod ve
komutlar için bkz.
[`apps/api/scripts/eval/README.md`](../../apps/api/scripts/eval/README.md).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `rehber-expected-keys-review.md` | `apps/api/scripts/eval/datasets/rehber-intents.json` içindeki her vakaya elle atanmış `expectedKeys` (altın veri) için gözden geçirme tablosu — niyet, seçilen key'ler, kısa gerekçe. `pnpm --filter api eval:retrieval` bu `expectedKeys`'e göre recall@15/hit@5/MRR hesaplar. |
| `dataset-terms-report.json` | `scripts/audit-dataset-terms.mjs --report` çıktısı — `apps/api/scripts/data/*.mjs` genelinde `tags`/`suitableFor`/`categories` alanlarındaki TÜM benzersiz terimlerin ham dökümü (alan/dataset bazlı sayımlarla). Programatik/ham veri; elle okumak için `dataset-en-terms-review.md`'ye bakın. |
| `dataset-en-terms.json` | `dataset-terms-report.json`'dan türetilmiş, kaldırılacak İngilizce terimlerin listesi (`{"remove": [...]}` formatı) — `audit-dataset-terms.mjs --apply --terms docs/eval/dataset-en-terms.json` ile uygulanır. |
| `dataset-en-terms-review.md` | `dataset-en-terms.json`'daki 31 terimin (391 kullanım) insan tarafından okunacak gözden geçirme tablosu — her terim hangi alan(lar)da kaç kez geçiyor. Sorgular her zaman Türkçe olduğu için bu terimler saf arama gürültüsüdür. |
| `retrieval-baseline-2026-09-12.json` / `.md` | Embedding şablonu v2 + BSON float32 (BinData) vektör depolamaya geçişten hemen sonra alınmış referans retrieval eval raporu (`pnpm --filter api eval:retrieval`). `.json` ham veridir (`--baseline` bayrağıyla delta karşılaştırması için); `.md` insan tarafından okunacak özettir. Sonraki retrieval değişiklikleri bu taban çizgisiyle karşılaştırılır. |

## Ne zaman güncellenir

- `rehber-expected-keys-review.md` — `rehber-intents.json`'a yeni vaka
  eklendiğinde veya mevcut bir `expectedKeys` düzeltildiğinde elle
  güncellenir (üretilen bir dosya değildir).
- `dataset-terms-report.json` / `dataset-en-terms*.{json,md}` —
  `apps/api/scripts/data/*.mjs`'e büyük bir toplu veri eklemesi/değişikliği
  sonrası `node scripts/audit-dataset-terms.mjs --report --out
  ../../docs/eval/dataset-terms-report.json` ile yeniden üretilebilir; rutin
  her seed'de gerekmez.
- `retrieval-baseline-*.{json,md}` — retrieval pipeline'ında (embedding
  şablonu, skor eşiği, hibrit füzyon, dedupe mantığı vb.) kasıtlı bir
  değişiklik yapılıp sonuçlar kabul edildiğinde yeni bir tarihli çift
  eklenir; eskisi silinmez (tarihsel karşılaştırma için tutulur).
