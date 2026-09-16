# Vird Programı — Sunucu Sözleşmesi

Bu doküman Vird Programı özelliğinin (günlük zikir rutini) sunucu tarafı
uçlarını, veri şeklini, sınırlarını ve hata kodlarını tek yerde özetler.
Üç oluşturma kaynağı vardır: **manuel** (kullanıcı kendi kurar), **şablon**
(hazır bir `vird_templates` kaydından türetilir) ve **AI** (bkz. aşağıdaki
"AI Vird Programı" bölümü ve [`docs/ai-mimari.md`](ai-mimari.md) §2.5).

İlgili kod: `apps/api/src/modules/vird/*`, AI akışı için
`apps/api/src/modules/ai/ai-vird.service.ts` +
`apps/api/src/modules/ai/vird-program-agent.service.ts`.

---

## 1. Uçlar

| Uç | Guard | Açıklama |
|---|---|---|
| `GET /v1/vird/programs` | JWT | Kullanıcının tüm programları (`updatedAt` azalan) |
| `POST /v1/vird/programs` | JWT | Manuel/şablon/(ham) AI program oluşturma — `CreateVirdProgramDto` |
| `GET /v1/vird/programs/:id` | JWT | Tek program |
| `PATCH /v1/vird/programs/:id` | JWT | Güncelleme (fazlar, hatırlatıcı, prayerSelection, status — `active` HARİÇ) |
| `DELETE /v1/vird/programs/:id` | JWT | Silme |
| `POST /v1/vird/programs/:id/activate` | JWT | Taslak/duraklatılmış → aktif |
| `GET /v1/vird/today` | JWT | Bugünün programı/ilerlemesi |
| `GET /v1/vird/history` | JWT | Tarih aralığı geçmişi |
| `GET /v1/vird/templates` | Opsiyonel JWT (misafir dahil) | Aktif şablon listesi |
| `GET /v1/vird/templates/:key` | Opsiyonel JWT (misafir dahil) | Şablon detayı (zikirler çözülmüş) |
| `POST /v1/ai/vird-programs` | JWT | **AI Vird Programı** üretimi (bkz. §3) |

`POST /v1/vird/programs` içindeki `source:'ai'` dalı (templateKey'siz) yalnızca
premium kontrolü yapar, phases'i AI ile DOLDURMAZ — gerçek AI üretimi
YALNIZCA `POST /v1/ai/vird-programs` üzerindendir. Bu iki uç KARIŞTIRILMAMALI.

---

## 2. Veri şekli (`VirdProgram`)

```ts
{
  userId, clientId?,
  kind: 'routine' | 'journey',        // routine: tek faz (fromDay:1,toDay:null); journey: gün bazlı fazlar
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived',
  source: 'manual' | 'template' | 'ai',
  templateKey?,
  title: { tr, en },                   // İKİSİ DE ZORUNLU (bkz. §3 AI notu)
  startDate, endDate?, dayCount?,
  phases: [{
    fromDay, toDay,                    // null = bir sonraki faza/sonsuza dek
    note?,
    slots: {
      morning?, prayer?, evening?, night?, free?: [{ dhikrId?, customDhikrId?, target }]
    }
  }],
  prayerSelection: number[],           // 1..5 (sabah/öğle/ikindi/akşam/yatsı), varsayılan hepsi
  reminders: { enabled, slots: { morning, prayer, evening, night } },
  ai?: { flowId, intent, durationDays, summary },   // yalnız source:'ai'
  expiresAt?,                          // yalnız status:'draft' iken set; TTL index (expireAfterSeconds:0)
}
```

`VirdSlotKey` = `'morning' | 'prayer' | 'evening' | 'night' | 'free'`.
`prayer` dilimi vakit başına (1..5) tekrar eder, diğerleri günde tek örnektir.

---

## 3. AI Vird Programı — `POST /v1/ai/vird-programs`

3 kredi (`AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT`, `VIRD_PROGRAM_CREDIT_COST`).
Salt-AI: fallback yok, hata → 503 `AI_UNAVAILABLE`, kredi düşmez (bkz.
`docs/ai-mimari.md` §1, §2.5).

### İstek gövdesi (`CreateAiVirdProgramDto`)

```ts
{
  flowId: string;           // UUID v4 — idempotency anahtarı, ZORUNLU
  freeText?: string;        // niyet metni; boşsa expandIntent yine çalışır ("" ile)
  durationDays: 7 | 14 | 30;
  slots: VirdSlotKey[];     // en az 1, 'free' dahil olabilir
  prayerSelection?: number[]; // 1..5
  locale?: 'tr' | 'en';     // verilmezse Accept-Language'dan çözülür, o da yoksa 'tr'
}
```

`userId` **body'de YOKTUR** — yalnızca JWT'den (`@CurrentUserId()`) alınır.
Bu, AI Rehber'in eski (`CreateAiRecommendationDto.userId`) deseninden
BİLİNÇLİ bir sapmadır — mobil istemcinin bu uca `userId` göndermesi gerekmez.

### Yanıt

```ts
// Başarı (yeni üretim VEYA aynı flowId ile idempotent retry):
{
  kind: 'program';
  programId: string;
  program: {
    title: string;
    summary: string;
    durationDays: number;
    phases: Array<{
      fromDay: number;
      toDay: number | null;
      note?: string;               // ajanın ürettiği "focus" metni
      slots: Partial<Record<VirdSlotKey, Array<{
        dhikrId: string;
        name: string;               // dhikr.name.tr — DB'den o an okunur
        target: number;
      }>>>;
    }>;
  };
  remainingCredits: number;
}

// Niyet İslami zikir/dua bağlamıyla ilgisizse (kredi YOK):
{ kind: 'offTopic'; message: string }
```

Üretilen program her zaman **taslak** (`status:'draft'`, `source:'ai'`,
`kind:'journey'`) olarak kaydedilir; kullanıcı mobil tarafta inceleyip
`POST /v1/vird/programs/:id/activate` ile aktifleştirir ya da hiç
dokunmazsa **7 gün** sonra TTL ile otomatik silinir (manuel/şablon
taslaklarının 30 günlük süresinden farklı — bkz. `vird.constants.ts`
`VIRD_DRAFT_EXPIRES_AFTER_DAYS` vs. `vird-programs.service.ts`
`AI_DRAFT_EXPIRES_AFTER_DAYS`).

### Idempotency

Aynı `flowId` ile ikinci bir istek **agent'ı yeniden çalıştırmaz ve kredi
düşmez** — mevcut taslak aynı `{kind:'program', ...}` şeklinde döner. Bu,
`ensureCreditAccessForFlow`/`debitCreditForFlow`'un flowId bazlı ledger
idempotency'sinden AYRI, ikinci bir katmandır (bkz. `docs/ai-mimari.md`
§2.5.4).

### Sınırlar / davranış notları

- Fazlar her zaman `1..durationDays`'i boşluksuz ve çakışmasız kaplar.
- Bir fazda yalnızca istekte gönderilen `slots` kullanılır.
- Dilim başına en fazla `AI_VIRD_MAX_ITEMS_PER_SLOT` (varsayılan 4, env) zikir.
- `target`, katalogdaki zikrin statik tekrar hedefini (varsa) aşmaz.
- `title`/`summary` yalnızca istenen `locale`'de üretilir; DB şeması
  `title.tr`/`title.en` ikisini de zorunlu kıldığı için AYNI metin ikisine de
  yazılır (tek locale'de üretim, çift alanlı şema — bilinçli basitleştirme).
- `AI Vird Programı`'nın `source:'ai'` programları, manuel programlardaki
  3-zikir ücretsiz sınırından (`VIRD_FREE_LIMIT_DHIKRS`) muaftır (şablon
  kaynaklı programlarla aynı muafiyet).
- İlerleme/ilan (progress) soketi (`ai:step`, `expand → retrieve → build`)
  ajan tarafında YAYINLANIR ama bu uç şu an bir `socketId` ALMAZ (DTO'da yok)
  — mobil bu akış için canlı ilerleme göstermek isterse DTO'ya `socketId`
  eklenmesi ayrı bir görevdir (bkz. AiVirdService.createVirdProgram).

### Hata kodları

| Durum | HTTP | `code` |
|---|---|---|
| Kredi yetersiz (bakiye < 3) | 403 | `AI_CREDIT_INSUFFICIENT` |
| Aynı flowId farklı gövdeyle yeniden kullanılmış | 403 | (mesaj: "flowId zaten kullanılmış") |
| AI/retrieval hatası (herhangi bir adımda) | 503 | `AI_UNAVAILABLE` |
| Geçersiz gövde (DTO doğrulama) | 400 | Nest `ValidationPipe` varsayılanı |

---

## 4. Şablon/manuel sınırları (değişmedi)

| Sınır | Değer | Kod |
|---|---|---|
| Ücretsiz planda manuel programda en fazla distinct zikir | 3 | `VIRD_FREE_LIMIT_DHIKRS` |
| Ücretsiz planda en fazla aktif program | 1 | `VIRD_FREE_LIMIT_ACTIVE` |
| Premium planda en fazla aktif program | 10 | `PREMIUM_MAX_ACTIVE_PROGRAMS` |
| Kullanıcı başına saklanan arşiv tavanı | 20 | `VIRD_ARCHIVE_MAX` (aşılınca en eski silinir) |
| Manuel/şablon taslak TTL'i | 30 gün | `VIRD_DRAFT_EXPIRES_AFTER_DAYS` |
| Hatırlatıcı / şablon / AI ile oluşturma | premium gerektirir | `VIRD_PREMIUM_REQUIRED` |

---

## 5. Eval

`pnpm --filter api eval:vird` (bkz. `apps/api/scripts/eval/datasets/vird-intents.json`,
`run-vird-eval.ts`) — 15 golden vaka (13 program + 2 offTopic), LLM-free
yapısal kontroller (kind eşleşmesi, faz sayısı aralığı, dilim kapsamı, etiket
isabeti). **Bir LLM hakem (judge) katmanı bu iterasyonda eklenmedi** —
AI Rehber/Sohbet eval'lerindeki `lib/judge.ts` genişletilmedi; ileride
eklenmek istenirse `judgeVird`-benzeri bir fonksiyon oraya eklenip
`run-vird-eval.ts`'e bağlanabilir.

`--dry-run` hiçbir Mongo/OpenAI çağrısı yapmaz (yalnızca dataset özetini
yazdırır); gerçek çalıştırma `AI_EVAL_USER_ID` ortam değişkeni ve geçerli bir
`OPENAI_API_KEY` gerektirir.

## Operasyon notu: `vird_programs` clientId index'i (2026-09-13)

- Eski tanım `{userId, clientId}` unique + sparse idi; istemci `clientId: null` gönderdiğinde sparse index null'ı
  indekslediği için ikinci şablon/AI programı `E11000` ile 500 dönüyordu.
- Yeni tanım: `uniq_user_clientId` — unique, `partialFilterExpression: { clientId: { $type: 'string' } }`; servis boş/null
  clientId'yi hiç yazmaz.
- DURUM (2026-09-13): `test` veritabaninda yapildi; uretim veritabani farkliysa orada tekrarlanmali.
- Yapılacak (bir kez, Atlas mongosh): `db.vird_programs.dropIndex('userId_1_clientId_1')` → API yeniden başlayınca
  `autoIndex` yeni index'i oluşturur. Doğrulama: `db.vird_programs.getIndexes()` içinde `uniq_user_clientId`.

## Operasyon notu: Şablon `anchorDate` artık dinamik (2026-09-13)

- Ramazan/kandil (`vird_templates`, `kind:'journey'`) şablonları artık seed'de sabit bir `anchorDate` TAŞIMAZ.
  Bunun yerine yıl eki OLMAYAN bir "olay ailesi" anahtarı taşırlar (`sourceEventKey`, ör. `ramazan-gunleri`,
  `kadir-gecesi`, `regaib-kandili`, `mirac-kandili`, `berat-kandili`, `mevlid-kandili`).
- `VirdTemplatesService` (`findAllActive`/`findByKey`/`resolveForProgram`) `anchorDate`'i OKUMA ANINDA çözer:
  `special_days` içinde bu aileyle eşleşen (`^<aile>-\d{4}$`), henüz bitmemiş (kaydın kendi `dayCount`'una göre
  bitiş günü ≥ bugün/İstanbul) EN ERKEN kaydı bulur; Ramazan gibi çok günlü ailelerde bu her zaman `dayIndex:1`
  kaydıdır. Uygun kayıt yoksa şablon listede/detayda GİZLENİR. Çözüm 10 dk bellek cache'lidir (dhikr cache ile
  aynı desen, bkz. `vird-templates.service.ts` `resolveAnchorDate`).
- Sonuç: özel gün verisi (`special_days`) yıllık güncellendiğinde bu şablonlar kendiliğinden bir sonraki yıla/
  tekrara kayar — seed'in tekrar çalıştırılması gerekmez.
- `anchorDate` alanı şemada GERİYE UYUMLULUK için durur: `sourceEventKey`'i olmayan (statik anchorDate'li ya da
  hiç anchorDate'siz klasik) şablonlarda eski davranış birebir korunur.

## Seri ve /today program seçimi (Faz A, 2026-09-16)

- **Seri (vird streak):** `vird_day_progress` içindeki distinct `date` değerleri,
  `isDayComplete:true` olmak kaydıyla, kullanıcının TÜM programları genelinde
  sayılır — günün herhangi bir aktif programı tamamlandıysa o gün seri için
  sayılır (programa özel değil, kullanıcıya özeldir; bkz. `StreaksService.
  recalculateVirdForUser`).
- **`GET /v1/vird/today` program seçimi:** `programId` query parametresi
  verilirse (Mongo ObjectId, `@IsMongoId()`), yalnız o program `status:'active'`
  ise döner. Verilmezse eskisi gibi kullanıcının en son güncellenen (`updatedAt`
  azalan) aktif programı döner. Mobil istemci `programId`'yi yalnızca aktif
  program sunucuda zaten var olduğunda (`origin:'server'`) gönderir — yerel
  (henüz senkronize edilmemiş) `clientId`'ler Mongo ObjectId formatında
  olmadığından sunucu bunları 400 ile reddeder.
- **Journey otomatik tamamlama:** `endDate` bugünden (İstanbul takvim günü)
  ÖNCE olan aktif journey programları `status:'completed'`e çevrilir. Bir cron
  YOKTUR — bu kontrol `POST /v1/vird/programs/:id/activate` ve
  `GET /v1/vird/today` çağrılarının başında lazy olarak çalışır (bkz.
  `utils/complete-expired-journeys.ts`). `endDate`'i olmayan journey'ler
  (ve routine'ler, ki onların zaten `endDate`'i yoktur) hiçbir zaman bu yolla
  otomatik tamamlanmaz.
- **`clientId` çakışması:** `POST /v1/vird/programs` (manuel ve şablon
  yollarının ikisinde de) aynı `{userId, clientId}` ile ikinci bir yazım
  denemesi artık `409 Conflict` döner (öncesinde `400 Bad Request`'ti).
- **Hatırlatıcı (reminders) kapısı:** `PATCH /v1/vird/programs/:id` yalnızca
  payload AÇIKÇA `reminders.enabled === true` gönderdiğinde premium kapısına
  takılır — var olan (kayıtlı) `reminders.enabled` değeri artık bu kontrole
  dahil edilmez. Bu, premium'dan düşürülmüş bir kullanıcının hatırlatıcıları
  zaten açık bir programda başlık/durum gibi ilgisiz alanları PATCH
  edebilmesini sağlar.
