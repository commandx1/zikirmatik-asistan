# AI Rehber / AI Sohbet Eval Harness

Bu klasör, AI Rehber (`RecommendationAgentService`) ve AI Sohbet
(`AiChatService`) pipeline'larını **gerçek** kodla — HTTP katmanı, kredi
düşümü veya conversation/message persist'i OLMADAN — Nest DI konteyneri
üzerinden çalıştırıp golden dataset'ler üzerinde değerlendiren bir eval
harness'idir.

`apps/api/scripts/test-ai-recommend.mjs` ve `apps/api/scripts/test-ai-http.mjs`
adlı eski script'lerin YERİNE geçer — onlar prod pipeline'ından bağımsız,
kendi kopyaladıkları prompt/mantıkla çalışıyordu (drift etmişlerdi) ve
kaldırıldılar. Bu harness ise gerçek `RecommendationAgentService.run()` ve
`AiChatService.evaluateReply()` metodlarını çağırır — pipeline'da yapılan her
değişiklik otomatik olarak eval'a yansır.

## Nasıl çalışır

```
datasets/rehber-intents.json   ~40 kullanıcı niyeti (freeText + beklenen sonuç)
datasets/chat-questions.json   ~40 sohbet sorusu (message + beklenen mode/coverage)

lib/bootstrap.ts    NestFactory.createApplicationContext(AppModule) → { app, agent, chat, usageLogModel }
lib/judge.ts        LLM hakem (createOpenAI doğrudan, AiUsageService'i BYPASS eder)
lib/report.ts       reports/<kind>-<ISO>.json + .md üretir
lib/metrics.ts      (gerçek konumu: src/modules/ai/eval/metrics.ts — jest rootDir=src)
lib/args.ts         CLI bayrak ayrıştırma
lib/pool.ts         basit eşzamanlılık havuzu
lib/util.ts         git sha, timeOfDay derive, hata formatlama, userId validasyonu

run-rehber-eval.ts  AI Rehber runner
run-chat-eval.ts    AI Sohbet runner
```

`AiChatService`'e yalnızca eval için eklenen **`evaluateReply()`** public
metodu (bkz. `src/modules/ai-chat/ai-chat.service.ts`), mevcut `runChatAgent`
private metodunu REST/SSE'den bağımsız çalıştırır: classify → (gerekirse)
retrieval → agent. Konuşma/mesaj **persist etmez**, kredi **düşmez** —
yalnızca normal akışta da olduğu gibi `ai_usage_log`'a fire-and-forget bir
kayıt düşülür (bu sayede gerçek maliyet raporlanabilir).

## Kurulum

`apps/api/.env` içinde şunlar tanımlı olmalı (bkz. `.env.example`):

| Değişken | Açıklama |
| --- | --- |
| `OPENAI_API_KEY` | Pipeline + judge için gerekli |
| `MONGODB_URI` | Gerçek Atlas cluster'ı (dhikr/source_passages vector index'leri burada) |
| `AI_EVAL_USER_ID` | **Zorunlu.** Gerçek, var olan bir kullanıcının MongoDB ObjectId'si (24 hex karakter). `RecommendationAgentService`/`AiChatService` bazı yollarda kullanıcıyı doğrular; test/sahte bir id KULLANMAYIN. |
| `AI_EVAL_JUDGE_MODEL` | Opsiyonel, varsayılan `gpt-5`. Hakem modeli — pipeline modelinden (`AI_SELECT_MODEL`/`AI_CHAT_MODEL`) farklı olabilir. |

`AI_EVAL_USER_ID` bulmak için: Mongo'da `users` koleksiyonundan gerçek (test
amaçlı oluşturulmuş olsa bile var olan) bir kullanıcının `_id`'sini kopyalayın.

## Çalıştırma

```bash
# 1) Dataset'i doğrula — HİÇBİR AI/Mongo çağrısı yapmaz, ücretsizdir.
pnpm --filter api eval:rehber -- --dry-run
pnpm --filter api eval:chat -- --dry-run

# 2) Gerçek çalıştırma (AI_EVAL_USER_ID .env'de tanımlıysa doğrudan; değilse
#    komut satırında geçirin). Maliyetli — bkz. aşağıdaki tahmini maliyet.
pnpm --filter api eval:rehber
pnpm --filter api eval:chat

# Bayraklar (her ikisinde de aynı):
pnpm --filter api eval:rehber -- --limit 5              # ilk 5 vakayla sınırla
pnpm --filter api eval:rehber -- --ids r001,r005,r022    # yalnızca bu id'ler
pnpm --filter api eval:rehber -- --no-judge              # LLM hakemini atla (yalnızca pipeline)
pnpm --filter api eval:rehber -- --concurrency 5         # varsayılan 3
pnpm --filter api eval:rehber -- --locale en             # dataset'i tek locale'e indir
```

Bayraklar birleştirilebilir: `pnpm --filter api eval:chat -- --limit 10 --no-judge --concurrency 5`.

`--dry-run`, `AppModule`/Nest/Mongo'yu **import bile etmeden** çalışmaz demek
değildir — dosyalar statik olarak import edilir (bu güvenlidir: `@Module()`
dekoratörleri yalnızca DynamicModule TANIMI döndürür), ama
`NestFactory.createApplicationContext()` (gerçek Mongo bağlantısı + env
validasyonu) yalnızca `--dry-run` OLMAYAN dalda çağrılır. Yani `--dry-run`
sırasında `MONGODB_URI`/`OPENAI_API_KEY` hiç gerekmez.

## Maliyet

Tam bir run (40+42 vaka, judge açık, gpt-5/gpt-5-mini fiyatlarıyla) tahmini
**~$1.5** civarındadır (pipeline + judge toplamı). Her runner, çalıştırma
sonunda `ai_usage_log` koleksiyonundan `flowId` öneki `eval-<runId>-` olan
satırları toplayıp gerçek pipeline maliyetini basar; judge maliyeti ayrı
hesaplanır (judge `ai_usage_log`'a YAZMAZ — `--no-judge` ile tamamen
atlanabilir, bu durumda yalnızca pipeline maliyeti oluşur, ~$0.3-0.5).

Maliyeti düşürmek için önce `--limit 5 --no-judge` ile küçük bir deneme
yapın, sonra tam run'ı judge açık çalıştırın.

## Raporlar

Her çalıştırma `reports/<rehber|chat>-<ISO-tarih>.json` (ham veri, programatik
işleme için) ve aynı isimde `.md` (insan tarafından okunacak özet) üretir.
`.md` dosyası şunları içerir:

- **Başlık**: tarih, git sha, kullanılan modeller, `AI_PASSAGE_MIN_SCORE`,
  dataset boyutu, toplam maliyet, judge modeli.
- **Özet tablosu**: kind/mode eşleşme oranları, hata oranı, gecikme p50/p95,
  judge ortalamaları.
- **Vaka tablosu**: her vaka için girdi (kısaltılmış), sonuç, beklenen,
  ✓/✗ kontrolleri, judge verdict/skor, gecikme.
- **Başarısızlıklar**: hatalı/eşleşmeyen/judge'ın `weak`|`fail` dediği HER
  vaka için tam cevap/gerekçe + judge notu (kök neden analizi için).
- **Kalibrasyon** (yalnızca chat): retrieval'in döndürdüğü TÜM pasajların
  (eşik uygulanmadan önceki) vectorSearch skor persentilleri (p10/p50/p90) —
  `AI_PASSAGE_MIN_SCORE`'u ayarlarken kullanılır: p10 eşiğe çok yakın/altındaysa
  eşik çok sıkı olabilir; kalitesiz sonuçlar sık geliyorsa eşiği yükseltin.

`reports/` git'e commitlenmez (bkz. kök `.gitignore`) — yalnızca `.gitkeep`
takip edilir.

## Dataset'leri güncelleme

`datasets/rehber-intents.json` ve `datasets/chat-questions.json` düz JSON
dizileridir, elle düzenlenebilir. Yeni bir vaka eklerken:

- `id` benzersiz olmalı (ör. `r043`, `c041`).
- Rehber: `expect.kind` — `recommendations` | `offTopic` | `clarification` | `any`
  (`any` yalnızca gerçekten belirsiz/tek kelimelik girdiler için kullanılır).
  `expect.tagsAny` verilirse, seçilen zikirlerden EN AZ birinin bu etiketlerden
  birine sahip olması beklenir (gevşek bir sinyal — dhikr.tags serbest metin
  olduğu için %100 garanti değildir, judge daha güvenilir bir sinyaldir).
- Chat: `expectMode` — `chat` | `bilgi`. `expectCoverage` yalnızca `bilgi`
  beklenen vakalarda anlamlıdır. `history` follow-up (bağlama yaslanan) sorular
  için opsiyoneldir.

## Kod konumları (neden burada değil)

Saf metrik hesaplama (`percentile`, `rate`, `summarizeRehber`, `summarizeChat`)
`scripts/eval/` yerine `apps/api/src/modules/ai/eval/metrics.ts` altındadır —
jest'in `rootDir`'i `src/` olduğu için (bkz. `apps/api/package.json`
`jest.rootDir`) unit testlerin (`metrics.spec.ts`) `pnpm --filter api test`
kapsamına girmesi için burası gerekliydi. Runner script'leri bu modülü
relative import ile kullanır.

## Retrieval eval (LLM-free)

`run-retrieval-eval.ts`, `AI Rehber`/`AI Sohbet` judge'lı harness'lerinden
FARKLI bir amaç güder: `RetrievalService.searchDhikrsByText()`'in KENDİSİNİ
— hiçbir LLM hakem olmadan — golden dataset'teki `datasets/rehber-intents.json`
`expectedKeys` altın verisine göre değerlendirir. `expectedKeys`, ilgili
vakada döndürülmesi beklenen zikirlerin `dhikr.key`'leridir (seed'deki stabil
tanımlayıcı); bazı vakalarda henüz boş/eksik olabilir — bu vakalar
key-metrikleri (rank/hit@5/recall@15) için ATLANIR, yine de raporda görünür.
`expectedKeys` etiketlemesinin nasıl/neden yapıldığı ve vaka bazlı gerekçeler
için bkz. [`docs/eval/rehber-expected-keys-review.md`](../../../../docs/eval/rehber-expected-keys-review.md)
(bkz. ayrıca [`docs/eval/README.md`](../../../../docs/eval/README.md)).

Sorgu metni: dataset'te `case.expandedQuery` varsa DOĞRUDAN kullanılır (LLM
çağrısı YOK); yoksa `RecommendationAgentService.expandIntentForEval()`
(gerçek `expandIntent`'in eval'a açılmış public wrapper'ı) ile GERÇEK niyet
genişletme çağrılır. `--write-expanded` verilirse üretilen `expandedQuery`
(ve `offTopic` true ise o da) dataset JSON'ına geri yazılır — sonraki run'lar
aynı sorguyu ücretsiz tekrar kullanır.

Metrikler (vaka başına): ilk beklenen key'in rank'ı (`firstRank`, yoksa
`null`), `hit@5`, `recall@15` (= beklenen ∩ ilk 15 / |beklenen|), gecikme, ve
`dupCount` — adayların `nameArabic`'i harakat/tatvil/boşluk temizlenerek
normalize edilip near-duplicate (aynı normalize metne sahip birden fazla
aday) sayısı. Özet: mean recall@15, hit@5 oranı, MRR, ortalama dupCount,
gecikme p50/p95.

```bash
pnpm --filter api eval:retrieval -- --dry-run           # ücretsiz, ağ çağrısı yok
pnpm --filter api eval:retrieval -- --limit 5            # gerçek çalıştırma (embedding + gerekirse expand)
pnpm --filter api eval:retrieval -- --write-expanded      # üretilen expandedQuery'leri dataset'e yaz
pnpm --filter api eval:retrieval -- --baseline scripts/eval/reports/retrieval-<ISO>.json  # delta karşılaştırması
```

Referans bir taban çizgisi raporu `docs/eval/retrieval-baseline-2026-09-12.{json,md}` altında
commit'lidir (embedding şablonu v2 + BinData depolamaya geçişten hemen sonra
alınmıştır) — sonraki retrieval değişikliklerini bununla karşılaştırmak için:

```bash
pnpm --filter api eval:retrieval -- --baseline docs/eval/retrieval-baseline-2026-09-12.json
```

Aynı `--limit`/`--ids`/`--locale`/`--concurrency` bayrakları burada da
geçerlidir (`--no-judge` retrieval eval'ında anlamsızdır, hiç judge yoktur).
`AI_EVAL_USER_ID` set değilse (diğer eval'lerin aksine) sabit bir sahte
ObjectId kullanılır — retrieval, kullanıcıyı hiçbir yolda doğrulamaz, yalnızca
fire-and-forget usage log kaydında kullanılır.

## Doğrulama komutları

```bash
pnpm --filter api eval:rehber -- --dry-run
pnpm --filter api eval:chat -- --dry-run
pnpm --filter api eval:retrieval -- --dry-run
pnpm --filter api test
pnpm --filter api lint
pnpm --filter api exec tsc --noEmit -p tsconfig.json   # scripts/eval/** de bu tsconfig'e dahildir (ayrı tsconfig gerekmedi)
```
