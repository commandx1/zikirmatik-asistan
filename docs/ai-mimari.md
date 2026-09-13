# AI Mimarisi (Salt-AI Pipeline)

Bu doküman Zikirmatik API'sindeki **AI Rehber** (zikir önerisi), **AI Sohbet**
(kaynak asistanı) ve **AI Vird Programı** (fazlı zikir rutini üretimi,
bkz. §2.5) akışlarının güncel mimarisini anlatır. Üçü de aynı alt yapıyı
(`AiRuntimeService`, `RetrievalService`, `AiCreditsService`,
`AiUsageService`, `AiPipelineExceptionFilter`) paylaşır ama ayrı ajanlardır.

İlgili kod: `apps/api/src/modules/ai/*`, `apps/api/src/modules/ai-chat/*`,
`apps/api/src/modules/vird/*` (AI taslağının kalıcılaştırıldığı yer).

---

## 1. Amaç ve İlkeler

- **Salt-AI, fallback YOK.** Eski kategori/keyword eşleştirme, `recommendation_cache`
  ve "fallback modeli" akışları tamamen kaldırıldı. Öneri de, sohbet cevabı da
  yalnızca LLM çağrısının başarılı sonucudur.
- **Hata → açık 503, kredi yok.** `RecommendationAgentService`, `AiService` veya
  `AiChatService` içindeki herhangi bir adım (embedding, `$vectorSearch`,
  `generateObject`/`generateText`/`streamText`) başarısız olursa akış
  `AiPipelineError` fırlatır; bu hata hiçbir yerde yutulup sessiz bir cevaba
  dönüştürülmez. Kullanıcı her zaman aynı güven verici mesajla 503
  `AI_UNAVAILABLE` alır ve **kredisi düşülmez**.
- **Sessiz uydurma cevap yok.** AI Rehber'de model yalnızca kendisine verilen
  aday referanslarını (`C1`, `C2`, …) kullanabilir; ham ObjectId veya
  referans kodu kullanıcıya asla sızmaz (`stripModelRefs`). AI Sohbet'in
  `bilgi` modunda cevap yalnızca gömülü kaynak pasajlarına dayanabilir;
  pasaj yoksa/ilgisizse model bunu açıkça söylemek zorundadır (`coverage:'none'`).

---

## 2. AI Rehber Akışı

Giriş noktası: `AiService.createRecommendation` (`POST /v1/ai/recommendations`).
LLM/agent mantığının tamamı `RecommendationAgentService.run`'da.

```mermaid
flowchart TD
    A["POST /v1/ai/recommendations"] --> B{"Kredi var mı?\n(ensureCreditAccessForFlow)"}
    B -- Hayır --> B1["403 AI_CREDIT_INSUFFICIENT"]
    B -- Evet --> C{"freeText var mı?"}
    C -- Evet --> D["expandIntent\ngenerateObject (offTopic + TR expandedQuery)"]
    D --> E{"offTopic?"}
    E -- Evet --> E1["kind=offTopic — 0 kredi"]
    E -- Hayır --> F["searchSourcePassages\n(RAG bağlamı, source_passages)"]
    F --> G["searchDhikrsByText\n$vectorSearch dhikr_vector_index"]
    C -- Hayır --> H["searchDhikrsByTimeOfDay\n$sample"]
    G --> I["Seçim turu: generateText + tools\n(searchDhikrs / selectRecommendations / askClarification)"]
    H --> I
    I --> J{"Sonuç"}
    J -- clarification --> J1["kind=clarification — 0 kredi"]
    J -- selected --> K["DB ikinci kapı: loadDhikrsByIds\n(yalnızca isVerified && isActive)"]
    K --> L["persist: AiRecommendation + lastSeenAt"]
    L --> M["debitCreditForFlow — 1 kredi"]
```

Herhangi bir adımda `AiPipelineError` fırlarsa (embedding hatası, boş aday
listesi, model geçersiz çıktı vb.) akış `AiPipelineExceptionFilter`'a düşer →
**503 `AI_UNAVAILABLE`, 0 kredi** (diyagrama ayrıca çizilmedi, her kutudan
çıkabilir).

### 2.1 Niyet genişletme (`expandIntent`)

- Yalnızca `freeText` doluysa çalışır. `generateObject` + `expandIntentSchema`
  (`{ offTopic: boolean, expandedQuery: string }`).
- `expandedQuery` **her zaman Türkçe** üretilir (kullanıcı İngilizce yazsa
  bile) — arama korpusu (zikir kataloğu + kaynak pasajları) Türkçe olduğu için.
- `offTopic=true` ise agent hiçbir aday aramadan `kind:'offTopic'` döner.

### 2.2 Aday zikir + kaynak pasajı çekme (deterministik, LLM'siz)

- `freeText` varsa: sorgu metni `RetrievalService.embedQuery` ile **bir kez**
  embed edilir; dönen `queryVector` hem `searchSourcePassages` (RAG bağlamı,
  `AI_RAG_PASSAGE_LIMIT`) hem `searchDhikrsByText` (`$vectorSearch`
  `dhikr_vector_index`, `AI_CANDIDATE_LIMIT`) çağrısına geçirilir — eskiden
  aynı metin iki kez embed ediliyordu. Kullanıcının son 7 günde zaten
  çektiği zikirler (`getRecentDhikrIds`) artık aday havuzundan
  **dışlanmıyor**; bunun yerine her aday üzerinde `recentlyPracticed:true`
  ile işaretlenir ve prompt'a `[son 7 günde çekildi]` etiketiyle geçilir —
  model eşit derecede uygun işaretsiz bir alternatifi tercih eder, ama niyete
  en uygun aday işaretliyse yine onu önerir (isabet çeşitlilikten önce
  gelir, bkz. §6 ve `prompts.ts`).
- `freeText` yoksa (zaman tabanlı genel öneri): `searchDhikrsByTimeOfDay`
  (`$sample` ile rastgele örnekleme — **artık `recommendedCount`'a göre
  sıralanmıyor**, bkz. §6).
- Aday listesi boşsa `AiRetrievalError('retrieval_failed')` → 503.

### 2.3 Tek seçim turu (`runSelectionStep`)

`generateText` + üç araç, `withAiRetry('select', …)` ile sarılı (varsayılan
2 deneme = 1 tekrar, yalnızca retryable hatada).

| Araç | Sınır | Ne zaman aktif |
|---|---|---|
| `searchDhikrs` | en fazla **1 kez** | yalnızca ilk adımda (`searchUsed=false`) |
| `selectRecommendations` | — | her zaman |
| `askClarification` | — | yalnızca `searchDhikrs` **kullanıldıktan sonra** |

`prepareStep` bu kapılamayı uygular: ilk adımda `{searchDhikrs,
selectRecommendations}` (`toolChoice:'required'`); `searchDhikrs`
çağrıldıktan sonra `{selectRecommendations, askClarification}`. Yani
`askClarification` yalnızca "arama sonrası da hiçbir aday uymuyorsa"
erişilebilir bir araçtır — ilk turda modelin doğrudan netleştirme sorması
mümkün değildir. `stopWhen: [stepCountIs(3), () => outcome !== null]`.

- **Halüsinasyon reddi:** Model yalnızca aday listesindeki `C#` referanslarını
  kullanabilir (`selectRecommendations.items[].ref`); ham ObjectId üretmesi
  prompt'ta açıkça yasaklanır. `AiService.stripModelRefs` metne sızan
  ObjectId/`C#` kalıntılarını ikinci bir savunma hattı olarak temizler.
- **DB ikinci kapı:** Seçilen `ref → id` eşlemesi sonrası `loadDhikrsByIds`
  yalnızca `isVerified && isActive` kayıtları döner; hiçbiri doğrulanamazsa
  `AiInvalidOutputError`.

### 2.4 Cevap türleri ve kredi

| `kind` | Açıklama | Kredi |
|---|---|---|
| `offTopic` | Niyet İslami zikir/dua bağlamıyla ilgisiz | **0** |
| `clarification` | Model tek netleştirme sorusu sordu (`suggestedCategories:[]` legacy alanla birlikte) | **0** |
| `recommendations` | Seçim başarılı, persist edildi | **1** |
| AI hatası (`AiPipelineError`) | 503 `AI_UNAVAILABLE` | **0** |

---

## 2.5 AI Vird Programı Akışı

Giriş noktası: `AiVirdService.createVirdProgram` (`POST /v1/ai/vird-programs`).
Ajan mantığının tamamı `VirdProgramAgentService.run`'da. Niyet + süre
(7/14/30 gün) + istenen dilimler (morning/prayer/evening/night/free) → fazlı
bir vird rutini. AI Rehber ile aynı temel ilkeleri paylaşır (salt-AI, fallback
yok, hata → 503 kredi yok) ama **3 kredi** tüketir (AI Rehber/Sohbet 1 kredi).

```mermaid
flowchart TD
    A["POST /v1/ai/vird-programs"] --> B{"3 kredi var mı?\n(ensureCreditAccessForFlow, amount=3)"}
    B -- Hayır --> B1["403 AI_CREDIT_INSUFFICIENT"]
    B -- Evet --> C{"ai.flowId ile taslak var mı?"}
    C -- Evet --> C1["mevcut taslağı dön — 0 kredi"]
    C -- Hayır --> D["VirdProgramAgentService.run\n(expandIntent'i yeniden kullanır)"]
    D --> E{"offTopic?"}
    E -- Evet --> E1["kind=offTopic — 0 kredi"]
    E -- Hayır --> F["Aday havuzu: genel + dilim bazlı aramalar\n(dedupeByCanonicalKey)"]
    F --> G["runBuildStep: generateText + tools\n(searchDhikrs ≤1 / buildProgram)"]
    G --> H["DB ikinci kapı: loadDhikrsByIds"]
    H --> I["VirdProgramsService.createAiDraft\n(source:'ai', status:'draft')"]
    I --> J["debitCreditForFlow — 3 kredi"]
```

### 2.5.1 Niyet genişletme (yeniden kullanım)

`VirdProgramAgentService`, `RecommendationAgentService.expandIntent`'i
(public) doğrudan enjekte edilen bağımlılık üzerinden çağırır — kendi bir
kopyasını TUTMAZ. `offTopic=true` ise agent hiçbir aday aramadan
`{kind:'offTopic'}` döner (kredi yok).

### 2.5.2 Aday zikir havuzu (deterministik, LLM'siz)

- Genel havuz: `searchDhikrsByText(expandedQuery, 15)`.
- İstenen her dilim için ek bir hedefli arama: `morning`/`evening`/`night` →
  `searchDhikrsByTimeOfDay` (6'şar); `prayer` → "namaz sonrası" sabit metin
  sorgusuyla `searchDhikrsByText` (6); `free` için ek arama YAPILMAZ (genel
  havuz yeterli çeşitliliği sağladığı kabul edilir).
- Tüm listeler birleştirilip `RetrievalService.dedupeByCanonicalKey` (export
  edildi) ile tekilleştirilir — `DhikrCandidate`'ta ham `canonicalKey` alanı
  olmadığı için `canonicalKeyFromArabic(candidate.nameArabic)` ile türetilir.
- `getRecentDhikrIds` işaretlemesi AI Rehber'deki ile **aynen** aynıdır: sert
  bir dışlama değil, `recentlyPracticed:true` işareti.
- Havuz boşsa `AiRetrievalError('retrieval_failed')` → 503.

### 2.5.3 İnşa (build) turu ve doğrulama kapıları

`generateText` + iki araç (`searchDhikrs` en fazla 1 kez, `buildProgram`),
`prepareStep` ile aktif araç kapısı (AI Rehber'deki `searchDhikrs`/
`selectRecommendations` gatingiyle aynı desen, yalnızca `askClarification`
YOKTUR — vird üretiminde netleştirme sorusu dalı yoktur), `stopWhen:
[stepCountIs(3), () => outcome !== null]`.

`buildProgram.execute` beş kapıyı sırayla doğrular; herhangi biri ihlal
edilirse `{ok:false, error}` ile model'e geri döner (kredi düşülmeden, aynı
turda yeniden dener):

1. Her `ref`, aday havuzundaki (`refMap`) bir C# referansına karşılık gelmeli.
2. Fazlar `1..durationDays`'i **boşluksuz ve çakışmasız** kaplamalı
   (`fromDay`/`toDay`) — sıralı fazlar arasında her `toDay+1 === nextFromDay`,
   son fazın `toDay === durationDays`.
3. Bir fazda yalnızca **istenen dilimler** kullanılabilir.
4. Dilim başına en fazla `AI_VIRD_MAX_ITEMS_PER_SLOT` (varsayılan 4) zikir.
5. `target` 1..1000 aralığında VE aday satırının `recommendedCount`'u
   (Dhikr şemasının statik tekrar hedefi, varsa) aşılamaz.

Faz sayısı önerisi (7→1-2, 14→2-3, 30→3-4) ve "her faz her istenen dilimde en
az bir zikir" kuralı yalnızca **prompt rehberliğidir** — yukarıdaki 5 kapının
aksine kod seviyesinde sert bir doğrulama YAPILMAZ.

Model geçerli bir program üretemezse (`outcome` null kalır) `withAiRetry`
tüm `runBuildStep`'i (yeni bir `generateText` çağrısıyla) bir kez tekrar
dener; ikinci denemede de başarısızsa `AiInvalidOutputError`.

**DB ikinci kapı:** Programda referans verilen TÜM dhikrId'ler
`loadDhikrsByIds` ile yeniden doğrulanır (`isVerified && isActive`);
doğrulanamayan bir id'nin bulunduğu satır sessizce düşer, program genel
olarak BOŞ kalırsa `AiInvalidOutputError`.

### 2.5.4 Persist, idempotency ve kredi

- `VirdProgramsService.createAiDraft`: `source:'ai'`, `status:'draft'`,
  `kind:'journey'`, `ai:{flowId, intent, durationDays, summary}`,
  `expiresAt: +7 gün` (manuel/şablon taslaklarının 30 günlük TTL'inden farklı
  — bkz. `vird.constants.ts` `VIRD_DRAFT_EXPIRES_AFTER_DAYS`). `title.tr`/
  `title.en` aynı üretilen metinle doldurulur — model yalnızca istenen
  locale'de üretir, şema ikisini de zorunlu kılar.
- İdempotency İKİ katmanlıdır: (1) `AiVirdService`, ajanı ÇALIŞTIRMADAN önce
  `ai.flowId` ile mevcut bir taslak arar (bulursa kredi düşülmez, ajan hiç
  çalışmaz); (2) `createAiDraft` içinde bir E11000 (`ai.flowId` unique
  sparse index, yarış durumu) alınırsa mevcut taslak tekrar okunup döner.
- Kredi: `AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT`, `VIRD_PROGRAM_CREDIT_COST=3`.
  `ensureCreditAccessForFlow`/`debitCreditForFlow` artık genel bir `amount`
  parametresi alır (varsayılan 1 — AI Rehber/Sohbet çağıranları DEĞİŞMEDİ);
  cüzdan düşümü grant/topup kovaları arasında TEK atomik aggregation-pipeline
  `findOneAndUpdate`'iyle bölüşülür (`grantTake=min(grantCredits,amount)`,
  `topupTake=amount-grantTake`). Ayrıntı: [`docs/ai-kredi-birim-ekonomi-takip.md`](ai-kredi-birim-ekonomi-takip.md).

### 2.5.5 Cevap türleri ve kredi

| `kind` | Açıklama | Kredi |
|---|---|---|
| `offTopic` | Niyet İslami zikir/dua bağlamıyla ilgisiz | **0** |
| `program` (mevcut taslak) | Aynı flowId ile idempotent retry | **0** |
| `program` (yeni) | Üretim + persist başarılı | **3** |
| AI hatası (`AiPipelineError`) | 503 `AI_UNAVAILABLE` | **0** |

Uç sözleşmesinin tam özeti (istek/yanıt şekli, `VirdSlotKey`, hata kodları):
[`docs/vird-programi.md`](vird-programi.md).

---

## 3. AI Sohbet Akışı

Giriş noktaları: `AiChatService.createConversation` / `sendMessage` (REST) ve
`streamCreateConversation` / `streamSendMessage` (SSE, `POST
/v1/ai/chat/conversations/stream` ve `.../messages/stream`). Dört metod da
aynı ajan mantığını (`runChatAgent` / `runChatAgentStream`) çağırır.

```mermaid
flowchart TD
    A["POST .../messages (veya /stream)"] --> B{"Kredi var mı?"}
    B -- Hayır --> B1["403 AI_CREDIT_INSUFFICIENT"]
    B -- Evet --> C["classifyIntent\ngenerateObject (mode + searchQuery)"]
    C --> D{"mode"}
    D -- chat --> E["generateText/streamText\nbuildChatPrompt (kaynaksız, sıcak sohbet)"]
    D -- bilgi --> F["searchSourcePassages\n(skor eşiği AI_PASSAGE_MIN_SCORE)"]
    F --> G["generateText/streamText\nknowledgeAnswerSchema (coverage→usedPassages→answer)"]
    G --> H{"coverage"}
    H -- none --> H1["kaynak kartı YOK"]
    H -- "full / partial" --> H2["sourceCitations\n(yalnızca usedPassages'taki pasajlar)"]
    E --> I["persist: conversation + user + assistant mesajı"]
    H1 --> I
    H2 --> I
    I --> J["debitCreditForFlow — 1 kredi"]
```

### 3.1 Niyet sınıflandırma (`classifyIntent`)

- `generateObject` + `classifyIntentSchema` (`{mode:'chat'|'bilgi',
  searchQuery}`), son 5 turluk konuşma kuyruğuna bakar.
- `mode`: kararsız kalınca **`bilgi`** seçilir (gereksiz arama zararsız, eksik
  arama cevabı zayıflatır).
- `searchQuery`: takip sorularını ("peki ya sigara?") bağlamdan bağımsız
  anlaşılır bir sorguya çevirir; boş/eksik dönerse ham son kullanıcı mesajına
  düşülür (yalnızca retrieval kalitesi için — hata toleransı DEĞİL).

### 3.2 `bilgi` modu — kaynak araması + yapılandırılmış cevap

- `RetrievalService.searchSourcePassages(searchQuery, AI_CHAT_PASSAGE_LIMIT)`
  — `source_passages_vector_index` üzerinde salt vektör arama, skor
  `AI_PASSAGE_MIN_SCORE` (varsayılan 0.68) altındakiler elenir.
- Cevap artık serbest metin değil, `knowledgeAnswerSchema` ile yapılandırılmış:
  `coverage` (`full`/`partial`/`none`) → `usedPassages` (`["P2","P4"]`) →
  `answer`. **Alan sırası bilinçli**: `answer` en son dolduğu için
  `streamText().partialOutputStream` üzerinden token-token akıtılabilir.
- **Kaynak kartı yalnızca kullanılan pasajlardan** kurulur
  (`buildSourceCitations`): modelin `usedPassages` alanında işaretlediği
  ref'ler dışındakiler asla karta girmez; tanınmayan ref'ler (`P9` gibi
  uydurma) sessizce düşürülüp loglanır. `coverage==='none'` ise kart hiç
  yok. `coverage!=='none'` ama geçerli ref bulunamazsa (model tutarsız
  davranmışsa) `coverage` `'none'`'a düşürülür — dayanaksız bir "full"
  asla gösterilmez.

### 3.3 `chat` modu

- Kaynak araması yapılmaz. `buildChatPrompt` modelin dini bilgi/hüküm/
  zikir-dua içeriği **uydurmasını açıkça yasaklar**; kullanıcı bir bilgi
  sorusu sorarsa bir sonraki turda `bilgi` moduna düşecek şekilde soruyu
  netleştirmesini ister.

### 3.4 Persist ve kredi

- Persist sırası kritik: konuşma/mesaj kayıtları **agent BAŞARIYLA
  tamamlanmadan hiç yaratılmaz**. Hata olursa yarım kalmış kayıt olmaz.
- Kredi yalnızca persist başarılıysa düşülür (`debitCreditForFlow`,
  `AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT`) — `chat` ve `bilgi` modları
  arasında kredi farkı yoktur (ikisi de 1 kredi); AI Rehber'deki
  offTopic/clarification gibi "0 kredi" ara durumu AI Sohbet'te yok, çünkü
  sınıflandırma/arama başarısızlığı zaten `AiPipelineError` olarak üst
  katmana çıkar.

### 3.5 SSE event sözleşmesi

`streamCreateConversation` / `streamSendMessage`:

- `event: token` × N — `{ delta }` (yalnızca `answer` alanının büyüyen kısmı;
  `bilgi` modunda `partialOutputStream`, `chat` modunda ham `textStream`).
- `event: done` — `{ messageId, content, remainingCredits, conversationId,
  mode, coverage, sourceCitations }`.
- `event: error` — `{ code, reason?, requestId, message }`; `code` her zaman
  `AI_UNAVAILABLE` (`AiPipelineError`) veya `INTERNAL` (beklenmeyen hata),
  mesaj her zaman `AI_UNAVAILABLE_MESSAGE[locale]` (gerçek neden sızmaz).
- İstemci bağlantıyı keserse (`abortSignal`) hata sınıflandırılır ama
  yalnızca loglanır, `error` event'i yazılmaz ve persist/debit atlanır.

---

## 4. Hata Sınıflandırması ve Retry Politikası

`apps/api/src/modules/ai/ai-errors.ts` — tüm AI hataları tek bir
`AiPipelineError` ailesine normalize edilir (`classifyAiError`).

| `AiFailureReason` | Retryable | Örnek kaynak |
|---|---|---|
| `not_configured` | Hayır | `OPENAI_API_KEY` eksik |
| `timeout` | Evet | `AbortError`/`TimeoutError`/mesajda "timeout" |
| `rate_limited` | Evet | `APICallError` statusCode 429 |
| `provider_error` | Değişken | 5xx → evet; 401/403/diğer 4xx → hayır; statusCode yoksa SDK'nın kendi `isRetryable`'ı |
| `invalid_output` | Evet | `NoObjectGeneratedError`, `InvalidToolInputError`, `JSONParseError`, `TypeValidationError`, boş/şemasız model çıktısı |
| `embedding_failed` / `retrieval_failed` | Evet | embed veya `$vectorSearch` hatası |
| `stream_interrupted` | Hayır | ilk token akıtıldıktan SONRA stream koptu |

**Retry politikası (`AiRuntimeService.withAiRetry`):** varsayılan 2 deneme
(= 1 tekrar), yalnızca `error.retryable && canRetry()` ise. Bu, her
`generateText`/`generateObject`/`streamText` çağrısının kendi SDK-seviyeli
`maxRetries:1` ayarının (bkz. §5) **üzerine** eklenen ayrı bir agent/adım
seviyeli tekrar katmanıdır. Stream'lerde `canRetry = () => !anyTokenSent` —
**kullanıcıya en az bir token akıtıldıktan sonra asla tekrar denenmez**;
böyle bir kopma `AiStreamInterruptedError` (retryable=false) olarak
fırlatılır.

**HTTP karşılığı** (`AiPipelineExceptionFilter`, `@Catch(AiPipelineError)`):
her zaman **503**, gövde `{ code:'AI_UNAVAILABLE', reason, requestId,
message }`. SSE akışı zaten başlamışsa (`res.headersSent`) gövde
değiştirilemez, yalnızca loglanır — bu durumda hata bilgisi SSE
`event:error` üzerinden gider (bkz. §3.5).

---

## 5. Modeller ve Env Değişkenleri

Kaynak: `apps/api/src/modules/ai/ai-runtime.service.ts`,
`apps/api/.env.example`.

| Değişken | Varsayılan | Ne için |
|---|---|---|
| `AI_SELECT_MODEL` | `gpt-5` | AI Rehber seçim/araştırma turu |
| `AI_CHAT_MODEL` | `gpt-5` | AI Sohbet `chat` + `bilgi` üretimi |
| `AI_CLASSIFY_MODEL` | `gpt-5-mini` | Sohbet `classifyIntent` |
| `AI_EXPAND_MODEL` | `gpt-5-mini` | Rehber `expandIntent` |
| `AI_PROGRAM_MODEL` | `gpt-5` | AI Vird Programı `runBuildStep` |
| `AI_SELECT_REASONING_EFFORT` | `minimal` | yalnız `select` reasoning modeliyse |
| `AI_CHAT_REASONING_EFFORT` | `low` | yalnız `chat` reasoning modeliyse |
| `AI_PROGRAM_REASONING_EFFORT` | `low` | yalnız `program` reasoning modeliyse |
| *(classify/expand reasoning effort)* | `minimal` | env'den değil, sabit |
| `AI_SELECT_TIMEOUT_MS` | `30000` | |
| `AI_CHAT_TIMEOUT_MS` | `45000` | |
| `AI_CLASSIFY_TIMEOUT_MS` | `8000` | |
| `AI_EXPAND_TIMEOUT_MS` | `8000` | |
| `AI_PROGRAM_TIMEOUT_MS` | `45000` | |
| `AI_PASSAGE_MIN_SCORE` | `0.68` | `source_passages` vektör arama alt eşiği (`0` = eşik kapalı) |
| `AI_CANDIDATE_LIMIT` | `15` (kod tavanı 20) | Rehber aday zikir sayısı |
| `AI_RAG_PASSAGE_LIMIT` | `4` | Rehber bağlamı için pasaj sayısı |
| `AI_CHAT_PASSAGE_LIMIT` | `6` | Sohbet `bilgi` modu pasaj sayısı |
| `AI_VIRD_MAX_ITEMS_PER_SLOT` | `4` | Vird Programı — dilim başına en fazla zikir |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-large` | tüm embedding'ler (dhikr + pasaj, `EmbeddingService`) |
| `AI_MODEL_PRICES_JSON` | *(boş)* | `ai-cost-report.mjs` için liste fiyatı override'ı |

Maksimum çıktı token'ları (`AiRuntimeService`, env'den değil sabit):
`select`=3000, `chat`=2500, `classify`=800, `expand`=800, `program`=4000.

**Not — reasoning model ayrımı:** `gpt-5*` (`gpt-5-chat` hariç) ve
`o1`/`o3`/`o4` "reasoning model" sayılır (`isReasoningModel`). Bu modellerde
`temperature` **desteklenmez**; onun yerine
`providerOptions.openai.reasoningEffort` + `textVerbosity:'low'` gönderilir.
Reasoning modeli olmayanlarda ise `temperature: 0` kullanılır — ikisi asla
birlikte gönderilmez.

---

## 6. Veri

- **Zikir kataloğu:** 541 doğrulanmış zikir/dua (`isVerified && isActive`
  filtresiyle sorgulanır). Anlamsal arama `dhikr_vector_index` Atlas
  $vectorSearch index'i üzerinden yapılır — **index tanımı kodda değil,
  yalnızca Atlas'ta** (manuel oluşturulur/güncellenir). Zikir bacağı
  `exact: true` (ENN — Exact Nearest Neighbor) ile sorgulanır, `numCandidates`
  **verilmez**; koleksiyon boyutu (~541 kayıt) yaklaşık aramayı (ANN)
  gereksiz kılıyor. Kaynak pasajı bacağı ise `numCandidates: 200` ile
  yaklaşık aramaya devam eder (bkz. `PASSAGE_VECTOR_NUM_CANDIDATES`,
  `retrieval.service.ts`).
- **Embedding kaynak metni (şablon v3, `EMBEDDING_TEXT_VERSION`):** hem
  `EmbeddingService.buildSourceText` (API) hem `scripts/lib/embedding.mjs#
  buildSourceText` (script) aynı byte-byte metni üretir — etiketli, salt
  Türkçe satırlar (`Zikir` / `Ne zaman / kim için` / `Konular` / `Anlam` /
  `Fazilet`), boş alan satırı tamamen düşer. **v3'te `Okunuş`
  (transliterasyon) satırı YOK** — v2'de vardı, eval kanıtı aşağıdaki
  "Hibrit arama" notunda. Kaynak pasajları için
  embedding girdisi salt `text` değil, `"{sourceTitle} — {sectionHeading}\n
  {text}"` (`buildPassageEmbeddingText`) — hangi kaynağın/bölümün parçası
  olduğunu gömerek bağlamsal benzerliği iyileştirir; depolanan `text` alanı
  bundan etkilenmez, yalnız embedding girdisi değişir. Şablon değiştiğinde
  iki dosya birlikte artırılmalı, aksi halde script/API embedding'leri
  karşılaştırılamaz hale gelir.
- **Vektör depolama biçimi:** embedding vektörleri düz `number[]` **değil**,
  BSON float32 (subtype 9, `Binary.fromFloat32Array`) olarak saklanır — hem
  `dhikr.embedding` hem `source_passages.embedding` şema alanı
  `Schema.Types.Mixed` (Mongoose'un Buffer temsili subtype bilgisini
  kaybedip Atlas `$vectorSearch`'ün vektörü tanımasını engellediği için).
  Bu temsil boyut başına ~5 kat daha az yer kaplar (float64 + JSON/BSON
  array overhead yerine 4 byte/boyut) — M0 (512 MB) küme kotası için önemli.
  Sorgu vektörü (`queryVector`) hâlâ düz `number[]`dir; yalnızca depolanan
  alan Binary'dir.
- **`canonicalKey` dedupe:** her zikrin `nameArabic`'i harekesiz/
  noktalamasız normalize edilip sha1'in ilk 12 karakteri alınır
  (`canonicalKeyFromArabic`, seed sırasında hesaplanır ve `dhikr.canonicalKey`
  alanına yazılır). Aynı duanın harekeli/harekesiz birden fazla kopyası
  arama sonuçlarında aday listesine tek seferden fazla girmesin diye
  `RetrievalService.dedupeByCanonicalKey`, tüm arama yollarında (vektör-only,
  hibrit, zaman-tabanlı `$sample`) sıralamadaki İLK kaydı tutup sonrakileri
  eler. `canonicalKey` alanı yoksa (eski kayıt) `nameArabic`'ten aynı
  algoritmayla türetilir; ikisi de yoksa aday dedupe'a dahil edilmez.
- **Kaynak pasajları (`source_passages`):** kitap/siyer/ilmihal RAG
  korpusu. Arama `source_passages_vector_index` ile yapılır, index
  `apps/api/scripts/create-source-passage-index.mjs` ile oluşturulur.
  Aynı `RetrievalService.searchSourcePassages` metodu hem AI Sohbet'in
  `bilgi` modu hem de AI Rehber'in RAG bağlamı tarafından paylaşılır.
  Yeni kaynak ekleme akışı için bkz.
  [`docs/kaynaklar/KAYNAK-EKLEME-REHBERI.md`](kaynaklar/KAYNAK-EKLEME-REHBERI.md).
- **Hibrit arama (`AI_HYBRID_SEARCH` pasaj bacağı varsayılan `'1'`,
  `AI_DHIKR_HYBRID_SEARCH` zikir bacağı VARSAYILAN `'0'` — eval-driven,
  bkz. aşağıdaki not):** Faz 4'ten itibaren `RetrievalService.
  searchSourcePassages` ve `searchDhikrsByText`, `$vectorSearch`'e paralel
  olarak Atlas Search (full-text, `lucene.turkish` analyzer) sorgusu da
  çalıştırır ve iki listeyi **Reciprocal Rank Fusion** (RRF, `k=60`,
  `apps/api/src/modules/ai/retrieval-fusion.ts`) ile birleştirir. RRF her
  listedeki 1-indeksli sıraya göre `1/(k+rank)` katkısı verir; bir öğe
  her iki listede de geçiyorsa katkılar toplanır (doğal "both" boost'u).
  - **2026-09-12 eval notu (zikir bacağı neden varsayılan kapalı):** 33
    altın etiketli intent üzerinde pure-vector ablation, "Okunuş"
    (transliterasyon) satırlı şablonla recall@15 0.732 / MRR 0.614,
    satırsız 0.763 / 0.635, etiketsiz sorguda 0.722 / 0.648 verdi. Aynı
    setle zikir `$text` hibrit bacağı (RRF k=60) genişletilmiş sorguda
    0.677 / 0.562'ye, ham freeText'te 0.672 / 0.517'ye düştü — isim-gated
    varyantlar bile ≤0.717 / 0.605 ile hepsi vektör-only'nin (0.763 /
    0.650) altında kaldı. Sentetik isim/transliterasyon sorguları
    (Seyyidü'l-İstiğfar, "Allahümme ente rabbi…", Hasbünallah, Âyetel
    Kürsî) vektör-only'de zaten 1-2. sırada çıkıyor çünkü `expandIntent`
    dua adını ve Türkçe anlamını genişletilmiş sorguya yazıyor — `$text`
    bacağı ek değer katmıyor, gürültü ekliyor. Kaynak pasajı hibrit bacağı
    (AI Sohbet) bu eval'de YENİDEN DEĞERLENDİRİLMEDİ ve `AI_HYBRID_SEARCH`
    ile açık kalmaya devam ediyor.
  - **İki farklı full-text mekanizması (kasıtlı asimetri):**
    - **Kaynak pasajı bacağı** Atlas Search kullanır:
      `source_passages_text_index` (`source_passages`, alanlar: `text`,
      `sectionHeading`, `sourceTitle`, `sourceId`, analyzer
      `lucene.turkish`), `apps/api/scripts/create-text-search-indexes.mjs`
      ile (idempotent, `--wait` ile queryable olana kadar bekler)
      oluşturulur.
    - **Zikir bacağı** standart Mongo `$text` index kullanır:
      `dhikr_text_idx` (`dhikrs`, alanlar:
      `name.tr`/`transliteration.tr`/`meaning.tr`/`virtue.tr` +
      `tags`/`suitableFor`/`categories`, `default_language: 'turkish'`,
      isim/transliterasyon ağırlıklı `weights`). Index tanımı
      `dhikr.schema.ts`'te `DhikrSchema.index(...)` ile kodda tutulur (app
      `autoIndex:true` ile açılışta da oluşturabilir) ve ayrıca
      `apps/api/scripts/create-dhikr-text-index.mjs` ile idempotent olarak
      garanti edilir. **Neden Atlas Search değil:** cluster'ın Atlas
      Search (FTS) index kotası dolu — 2 mevcut $vectorSearch index'i
      (`dhikr_vector_index`, `source_passages_vector_index`) +
      `source_passages_text_index` kotanın tamamını kullanıyor;
      `dhikr_text_index` (Atlas Search) oluşturma denemesi "The maximum
      number of FTS indexes has been reached for this instance size."
      hatası vermişti. Standart Mongo `$text` index'i bu kotadan tamamen
      bağımsızdır ve `runDhikrTextSearch`'te `$match: { $text: { $search,
      $language: 'turkish' } }` ile sorgulanır (bir aggregate
      pipeline'ında `$text` yalnızca İLK `$match` aşamasında
      kullanılabilir). Kaynak ekleme/kaldırma her iki index tanımını da
      asla etkilemez, ikisi de dinamik değildir (sabit alan listesi), yeni
      bir kaynak/zikir eklemek için ekstra bir adım GEREKMEZ.
  - **Zayıf metin eşleşmesi göreli eşiği (`AI_TEXT_MIN_REL_SCORE`,
    varsayılan `0.35`):** her iki bacakta da, metin leg'i döndükten sonra
    skoru o leg'in EN İYİ skorunun bu orandan daha azı olan öğeler RRF'ye
    girmeden önce elenir (`RetrievalService.applyTextRelativeFloor`).
    Amaç: sorgunun yalnızca ortak/yaygın bir kelimeyi (örn. "duası")
    paylaştığı, anlamsal olarak ilgisiz zayıf eşleşmeleri bastırmak.
    Elenen adet `flowLog.debug` ile loglanır.
  - **Eşik politikası (yalnızca `searchSourcePassages`, minScore/
    `AI_PASSAGE_MIN_SCORE`):** göreli eşikten sağ çıkan bir pasaj metin
    eşleşmesi (keyword hit) taşıyorsa, `AI_PASSAGE_MIN_SCORE` vektör
    eşiğinin altında olsa bile ELENMEZ — hibrit aramanın amacı tam olarak
    vektörün kaçırdığı isim/transliterasyon eşleşmelerini yakalamaktır.
    Metin eşleşmesi olmayan bir öğe eskisi gibi eşiğe tabidir.
  - **Degrade davranışı:** kaynak pasajı bacağında metin index'i henüz
    `queryable` değilse Atlas tipik olarak `$search` aşamasından HATA
    FIRLATMAZ, sessizce boş sonuç döner — akış doğal biçimde vektör-only'e
    düşer. Zikir bacağında (`$text`) index yoksa Mongo "text index
    required for $text query" hatası fırlatır. Her iki durumda da (Atlas'ın
    nadiren fırlattığı "index not found" exception'ı dahil) bu AI hatası
    SAYILMAZ: `RetrievalService` process başına index başına en fazla bir
    kez `flowLog.warn` basar ve vektör-only sonuçla devam eder. Farklı bir
    hata (index eksikliğiyle ilgisiz) her zamanki gibi
    `AiRetrievalError('retrieval_failed')` olarak yükselir.
  - `AI_HYBRID_SEARCH=0` (pasaj) ve `AI_DHIKR_HYBRID_SEARCH` kapalıyken
    (zikir, varsayılan durum) davranış, hibrit kod eklenmeden ÖNCEKİ
    pipeline'larla bayt bazında birebir aynıdır (regresyon güvencesi).
- **`recommendedCount`** (Dhikr şeması): mobilde "bu zikir kaç kez
  çekilecek" statik tekrar hedefi. **Artık bir sıralama/popülerlik sinyali
  DEĞİL** — zaman tabanlı genel öneri artık bu alana göre değil `$sample`
  (rastgele örnekleme) ile seçiliyor.
- **`selectionCount`** (Dhikr şeması): `PATCH
  /v1/ai/recommendations/:id/select` ile artan gerçek kullanıcı seçim
  sayacı — `recommendedCount` ile karıştırılmamalı, salt telemetri amaçlı.
- **`timeOfDay`** (Dhikr şeması): tek değer değil, **dizi**
  (`'morning'|'afternoon'|'evening'|'night'|'any'`, bkz.
  `TIME_OF_DAY_VALUES`). Seed, Türkçe kaynak verisindeki serbest metin
  değerleri (`sabah`, `akşam` vb.) bu enum'a normalize eder
  (`normalizeTimeOfDay`); saat → vakit eşlemesi `searchDhikrsByTimeOfDay`
  çağıranında 05–12 sabah, 12–17 öğleden sonra, 17–21 akşam, geri kalanı
  gece'dir.

### Veri migrasyonu (2026-09-12)

Embedding şablonu v3'e ve BinData vektör depolamaya geçişte izlenen sıra —
şablon/depolama tekrar değiştiğinde aynı sıra tekrarlanır:

```bash
cd apps/api
node scripts/seed-dhikrs.mjs                                    # 1) katalog upsert (canonicalKey + timeOfDay normalize dahil)
node scripts/backfill-dhikr-embeddings.mjs --force               # 2) tüm zikirleri v3 şablonuyla yeniden embed et
node scripts/seed-source-passages.mjs --seed --source <id>       # 3) her kaynak için ayrı ayrı (hash değişen chunk'lar yeniden embed edilir)
pnpm eval:retrieval -- --baseline docs/eval/retrieval-baseline-2026-09-12.json  # 4) regresyon kontrolü
```

**Uygulandı (2026-09-12):** sıra üretim cluster'ında (M0) çalıştırıldı — seed 541
(3 insert/538 update), zikir backfill v3 `--force` (541, 9 istek, ~$0.025, 20 s), 11 kaynak
için pasaj seed (4.114 pasaj, ~$0.20, ~3 dk). Sonuç: tüm vektörler BinData float32 v3,
`db.stats().dataSize` 202.9 MB → 65.4 MB; `eval:retrieval` baseline'a karşı recall@15
0.712 → 0.763, hit@5 %79 → %82, MRR 0.542 → 0.650, tekrar 0.71 → 0
(`docs/eval/retrieval-after-2026-09-12.*`).

`--force` olmadan (2) yalnızca hash/versiyon uyuşmayan kayıtları yeniden
embed eder — normal (rutin) senkronizasyon için `--force` GEREKMEZ, yalnızca
şablon/model değişikliğinde kullanılır. (3) `--seed` her kaynak için ayrı
çalıştırılır (`--source <id>` zorunlu); mevcut bir kaynağı yeniden seed etmek
yalnızca metni (dolayısıyla hash'i) değişen chunk'ları yeniden embed eder.

---

## 7. Gözlemlenebilirlik

- **Log öneki:** `AiRuntimeService.flowLog(flowId)` her satırı
  `[flow=xxxxxxxx]` (flowId'nin ilk 8 karakteri) ile başlatır; AI Rehber ve
  AI Sohbet'teki tüm adım logları bu öneki paylaşır — tek bir isteğin uçtan
  uca izini sürmek için kullanılır.
- **`ai_usage_log` koleksiyonu** (`AiUsageService.record`, asla akışı
  bloklamayan fire-and-forget bir kayıt): her `generateText`/
  `generateObject`/`streamText`/embedding çağrısı için `kind` ∈
  `recommend | chat | chat_stream | classify | expand | embedding | program`,
  `model`, `inputTokens`/`outputTokens`/`totalTokens`, `steps`, ve
  `ai-pricing.constants.ts`'teki liste fiyatlarından hesaplanan
  `estCostUsd`.
- **`apps/api/scripts/ai-cost-report.mjs`** — `ai_usage_log`'dan maliyet
  raporu üretir; kredi ekonomisi takibi için bkz.
  [`docs/ai-kredi-birim-ekonomi-takip.md`](ai-kredi-birim-ekonomi-takip.md).
- **Eval harness (geliştiriliyor):** `pnpm --filter api eval:rehber` /
  `eval:chat` / `eval:vird` (bkz. `apps/api/scripts/eval/README.md`).
  `eval:vird` henüz LLM-free yapısal kontrollerle sınırlı — bir judge katmanı
  YOKTUR (bkz. `docs/vird-programi.md`).

---

## 8. Operasyon Notları

- **`recommendation_cache` koleksiyonu artık kullanılmıyor.** İlgili şema
  (`recommendation-cache.schema.ts`) koddan silindi; Atlas'taki fiziksel
  koleksiyon otomatik silinmez. İsteğe bağlı, manuel temizlik:
  ```javascript
  db.recommendation_cache.drop();
  ```
- **Eski `ai_messages.usedModel:'fallback'` kayıtları** okunabilir kalır —
  kod artık bu değeri hiç yazmıyor (her zaman `'openai'`), ama geçmiş
  kayıtları silen bir migration çalıştırılmadı. Bu alanı okuyan raporlama/
  analiz kodu her iki değeri de göz önünde bulundurmalı.
  `recommendedDhikrIds` (AI Sohbet mesaj şeması) de aynı şekilde
  `@deprecated` — yeni mesajlarda yazılmıyor, yalnızca eski kayıtlar için
  şemada duruyor.
- **`suggestedCategories: []` (AI Rehber `clarification` yanıtı):** eski
  mobil istemcilerin kategori seçim UI'ı için beklediği legacy alan. Yeni
  akışta kategori önerilmiyor, alan her zaman boş dizi döner. Kaldırma
  planı: bu alana bağımlı mobil istemci sürümleri kullanım dışı kaldığında
  DTO'dan çıkarılabilir (şu an için ürün kararı bekliyor, kod tarafında
  ayrılmış bir tarih/flag yok).

---

## İlgili dosyalar

| Dosya | İçerik |
|---|---|
| `apps/api/src/modules/ai/ai.service.ts` | AI Rehber ince orkestrasyon katmanı (kredi, persist) |
| `apps/api/src/modules/ai/recommendation-agent.service.ts` | AI Rehber agent mantığı (expandIntent + seçim turu) |
| `apps/api/src/modules/ai/prompts.ts` | AI Rehber prompt/şema tanımları |
| `apps/api/src/modules/ai/retrieval.service.ts` | Ortak retrieval (dhikr + kaynak pasajı, hibrit $vectorSearch + $search) |
| `apps/api/src/modules/ai/retrieval-fusion.ts` | Saf RRF (Reciprocal Rank Fusion) yardımcı fonksiyonu |
| `apps/api/scripts/create-text-search-indexes.mjs` | `source_passages_text_index` + `dhikr_text_index` oluşturma (idempotent, `--wait`) |
| `apps/api/src/modules/ai/ai-runtime.service.ts` | Model/ayar/retry seçimi (tek kaynak) |
| `apps/api/src/modules/ai/ai-errors.ts` | Hata sınıflandırması, `AI_UNAVAILABLE` sözleşmesi |
| `apps/api/src/modules/ai/ai-pipeline.filter.ts` | `AiPipelineError` → HTTP 503 filtresi |
| `apps/api/src/modules/ai/ai-credits.service.ts` | Kredi cüzdanı/ledger, flow bazlı idempotent kesim |
| `apps/api/src/modules/ai-chat/ai-chat.service.ts` | AI Sohbet orkestrasyonu (REST + SSE) |
| `apps/api/src/modules/ai-chat/prompts.ts` | AI Sohbet prompt/şema tanımları |
| `apps/api/src/modules/ai/ai-vird.service.ts` | AI Vird Programı ince orkestrasyon katmanı (kredi, idempotency, önizleme) |
| `apps/api/src/modules/ai/vird-program-agent.service.ts` | AI Vird Programı agent mantığı (aday havuzu + build turu + doğrulama kapıları) |
| `apps/api/src/modules/vird/vird-programs.service.ts` | `createAiDraft`/`findAiDraftByFlowId` — AI taslağının tek yazma noktası |
| `docs/ai-kredi-birim-ekonomi-takip.md` | Kredi birim ekonomisi takip rutini |
| `docs/vird-programi.md` | AI Vird Programı uç sözleşmesi (istek/yanıt, sınırlar, hata kodları) |
| `docs/kaynaklar/KAYNAK-EKLEME-REHBERI.md` | `source_passages` korpusuna kaynak ekleme akışı |
