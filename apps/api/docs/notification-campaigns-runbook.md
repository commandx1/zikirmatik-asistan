# Bildirim Kampanyaları — Runbook

Sunucu tetikli push kampanyaları: geri kazanım (**winback**), **kandil arifesi**
+ **kandil günü** ve **haftalık özet**. Kod: `apps/api/src/modules/push-campaigns/`.

## 0. Mimari özeti

- **In-process `@Cron` YOK.** Render Free plan'da API instance boşta uyur ve
  zamanlanmış tick'ler kaçar. Bunun yerine GitHub Actions cron'u
  (`.github/workflows/campaign-triggers.yml`) dışarıdan, secret korumalı bir
  iç uç noktayı tetikler: `POST /internal/campaigns/:campaign`.
- `campaign` ∈ `winback` | `kandil-eve` | `kandil-day` | `weekly-summary`.
- Header: `x-campaign-secret: <CAMPAIGN_TRIGGER_SECRET>`.
- Body (opsiyonel, JSON): `{ "dryRun"?: boolean, "force"?: boolean }`.
- Yanıt (`CampaignRunResult`):
  ```json
  {
    "campaign": "winback",
    "dayKey": "2026-09-12",
    "candidates": 12,
    "sent": 9,
    "skipped": { "dedupe": 2, "quietHours": 0, "noToken": 0, "prefs": 1, "error": 0 },
    "dryRun": false
  }
  ```

## 1. Cron tetiklendi mi? (GitHub Actions)

```bash
gh run list --workflow=campaign-triggers.yml --limit 10
gh run view <run-id> --log
```

- Cron'lar (UTC; TR = UTC+3, yaz/kış saati yok — Türkiye kalıcı UTC+3):
  - `0 7 * * *`  → 10:00 TR → **winback**
  - `0 15 * * *` → 18:00 TR → **kandil-eve**
  - `0 6 * * *`  → 09:00 TR → **kandil-day**
  - `0 6 * * 1`  → Pazartesi 09:00 TR → **weekly-summary**
  - Pazartesi günleri `kandil-day` ve `weekly-summary` aynı UTC dakikasında
    tetiklenir; bu iki AYRI workflow run'ıdır (çakışma değil).
- Cron hiç tetiklenmediyse: repo 60+ gün inaktifse GitHub scheduled
  workflow'ları otomatik devre dışı bırakır — Actions sekmesinden
  "Enable workflow" ile aç.

## 2. Endpoint'i manuel tetikle

```bash
# dryRun: hiçbir push gönderilmez, push_dispatches'a hiç yazılmaz — yalnızca
# "kaç tanesi gönderilirdi" önizlenir (dedupe salt-okunur kontrol edilir).
curl -X POST "$API_URL/internal/campaigns/winback" \
  -H "x-campaign-secret: $CAMPAIGN_TRIGGER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' -i

# Gerçek gönderim
curl -X POST "$API_URL/internal/campaigns/kandil-eve" \
  -H "x-campaign-secret: $CAMPAIGN_TRIGGER_SECRET" -i

# Sessiz saat (22:00-08:00 İstanbul) içinde test etmek için force gerekir:
curl -X POST "$API_URL/internal/campaigns/kandil-day" \
  -H "x-campaign-secret: $CAMPAIGN_TRIGGER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"force": true}' -i
```

- `401` → secret uyuşmazlığı: GitHub Secrets'taki `CAMPAIGN_TRIGGER_SECRET` ile
  Render env'i karşılaştır. Production'da secret hiç tanımlı değilse de 401
  döner (fail-closed); development'ta tanımsızsa uyarı loglanıp istek geçer.
- `400` → bilinmeyen `campaign` değeri (yazım hatası olabilir).
- `200` → yanıttaki `skipped` alanlarına bak (adım 3).

## 3. Yanıttaki `skipped` alanları

| Alan | Anlamı | Aksiyon |
| --- | --- | --- |
| `quietHours` | 22:00–08:00 İstanbul arasında tetiklendi, `force` verilmedi → hiç gönderim yapılmadı | Beklenen davranış; gerekiyorsa `force: true` ile tekrar tetikle |
| `dedupe` | Cihaz o gün (İstanbul günü) zaten bir push aldı (bu kampanyadan veya başka bir kampanyadan) | `push_dispatches` sorgusuna bak (adım 4) |
| `prefs` | Cihaz/kullanıcı bu kampanya türünü kapatmış (`prefs.streak` / `prefs.specialDays`) | Beklenen davranış |
| `noToken` | Aday sorgusu zaten yalnız token'lı cihazları döndürür; bu alan yalnızca savunma amaçlıdır, normalde 0 | 0'dan büyükse bir aday-seçim sorgusu regresyonuna işaret eder |
| `error` | Rezervasyon (`push_dispatches` insert) başarılı ama gerçek gönderim (`PushSenderService.sendToDevices`) throw etti | O kaydın `meta.error` alanına bak (adım 4); rezervasyon kasıtlı olarak silinmez — aynı gün için retry yapılmaz |
| `candidates: 0` | `kandil-eve`/`kandil-day` için: hedeflenen tarihte `type: 'kandil'` kaydı yok | `special_days` verisini kontrol et (adım 6) |

## 4. `push_dispatches` (dedupe / rezervasyon kayıtları)

```js
// mongosh
use zikirmatik
db.push_dispatches.find({ campaignKey: 'winback' }).sort({ sentAt: -1 }).limit(10)
db.push_dispatches.find({ deviceId: '<deviceId>' }).sort({ sentAt: -1 })
// Bugün bir cihaz hangi kampanyadan push aldı:
db.push_dispatches.findOne({ deviceId: '<deviceId>', dayKey: '2026-09-12' })
// Gönderimi hata veren rezervasyonlar:
db.push_dispatches.find({ 'meta.error': { $exists: true } }).sort({ sentAt: -1 }).limit(20)
```

- Şema: `{ campaignKey, deviceId, dayKey ('YYYY-MM-DD', İstanbul), sentAt, meta? }`.
- Unique index'ler: `{ deviceId, dayKey }` (cihaz başına günde en fazla 1
  sunucu push'u — kampanyadan bağımsız birincil kısıt) ve
  `{ campaignKey, deviceId, dayKey }` (kampanya bazlı sorgu/denetim için).
- TTL: `sentAt` alanı üzerinden 30 gün sonra otomatik silinir — eski kayıt
  aramıyorsan bu normaldir.
- Bir cihazın bugünkü push'unu "sıfırlayıp" tekrar test etmek istersen (yalnız
  **staging/local**'da, kullanıcıyı gerçekten tekrar rahatsız eder):
  `db.push_dispatches.deleteOne({ deviceId: '<deviceId>', dayKey: '2026-09-12' })`

## 5. Cihaz hedefleme

```js
db.devices.find({ isActive: true, expoPushToken: { $exists: true, $nin: [null, ''] } }).count()
db.devices.find({ 'prefs.streak': true }).count()
db.devices.find({ 'prefs.specialDays': true }).count()
// Bir kullanıcının cihazları (haftalık özet için):
db.devices.find({ userId: ObjectId('...'), isActive: true })
```

- Sayı 0 ise sorun istemci tarafında olabilir: cihaz kaydı / push token
  senkronu (uygulama açılışında) çalışmıyor olabilir.
- Winback yalnızca `lastSeenAt` [3,4) veya [7,8) gün önce olan cihazları
  hedefler; `prefs.streak === false` ise atlanır.

## 6. Özel gün verisi (kandil-eve / kandil-day)

```js
db.special_days.find({ type: 'kandil', isActive: true }).sort({ date: 1 })
db.special_days.find({ type: 'kandil', date: '2026-05-26' })
```

- Format `YYYY-MM-DD` olmalı (`istanbulDateKey` ile birebir eşleşir).
- `isActive: false` olan bir kandil kaydı hedeflenmez (kasıtlı: taslak/gizli
  özel günler bildirim tetiklemez).
- Eksikse: `pnpm --filter api seed:special-days` (bkz. `apps/api/package.json`
  seed script'leri).

## 7. Expo push zinciri

- Servis logunda `PushCampaignsService` ve `PushSenderService` etiketlerini
  filtrele: rezervasyon/dedupe kararları ilkinde, gönderim ticket'ları ve
  `DeviceNotRegistered` deaktivasyonları ikincisinde loglanır.
- `deactivatedDeviceIds` (PushSenderService içinde) doluysa Expo
  `DeviceNotRegistered` dönmüştür — kullanıcı uygulamayı silmiş/yeniden kurmuş
  olabilir; cihaz `devices.isActive=false` olur ve bir sonraki kampanyada
  otomatik hedeflenmez.

## 8. Bilinen kısıtlar

1. **Dil yok, yalnız TR.** `Device` şemasında bir dil alanı bulunmuyor; tüm
   kampanya metinleri (`push-campaigns/templates.ts`) sabit Türkçe. Cihaz
   bazlı dil desteği eklenirse şema + template seçimi birlikte güncellenmeli.
2. **Mobil yerel bildirimlerle çift bildirim riski — mobil tarafta ele
   alındı.** Mobil uygulama kandil/özel gün için kendi yerel (on-device)
   bildirimini de zamanlar (`features/notifications/services/event-notifications.ts`).
   Çift bildirimi önlemek için mobil taraf artık bu API'nin sunucu push'unu
   hesaba katıyor: cihazın sunucu push kaydı doğrulanmışsa (`push-registration-store.ts`)
   VE `GET /app-config`'in `serverPushEnabled` bayrağı açıksa
   (`resolveServerPushActive`, bkz. § 10 "Devreye alma sırası"), yerel özel
   gün zamanlaması atlanır; aksi halde (bayrak kapalı/erişilemedi) yerel
   zamanlama aynen sürer. Cuma hatırlatması sunucu eşleniği olmadığı için bu
   mantığın dışındadır, her zaman yereldir.
3. **Winback pencere genişliği ~1 gün.** Cron günde bir kez çalıştığından her
   cihaz [3,4) ve [7,8) pencerelerine pratikte birer kez denk gelir; cron
   saati kayarsa (GH gecikmesi) bir pencere teorik olarak hiç yakalanmadan
   atlanabilir — kritik değil, sonraki pencerede (gün 7) tekrar denenir.
4. **Sessiz saat kontrolü tüm-veya-hiç.** `quietHours` kapısı tüm adayları
   birlikte es geçer (kısmi gönderim yapılmaz); `force: true` ile atlanabilir
   (yalnızca manuel/test tetiklemede kullanılmalı).

## 9. Test / doğrulama

```bash
cd apps/api
pnpm test -- push-campaigns
```

Kapsanan senaryolar: dedupe (E11000 → skip), sessiz saat, winback pencere
seçimi, kandil tarih eşleşmesi (eve/day), haftalık özet premium/ücretsiz
metni + sıfır aktivite atlama, secret doğrulama (401 / dev bypass), `dryRun`
modunda hiç gönderim yapılmaması.

## 10. Devreye alma sırası (mobil yerel → sunucu push devri)

Mobil, bir cihazın kandil/özel gün bildirimini yerelden bu API'nin sunucu
push'una devretmesi için İKİ koşulun BİRDEN sağlanmasını ister
(`resolveServerPushActive(registered, enabled)`,
`apps/mobile/src/features/notifications/services/event-notifications.ts`):

1. Cihazın sunucu push kaydı doğrulanmış olmalı (`registered` —
   `push-registration-store.ts`'teki `serverPushActive`, `POST
   /v1/devices/register` başarılı VE bir Expo push token alınmış).
2. `GET /app-config`'in döndürdüğü `serverPushEnabled` bayrağı `true` olmalı
   (mobilde `app-config-store.ts`'e yazılır) — bu da bu API'deki
   `SERVER_PUSH_ENABLED` ortam değişkenine bağlıdır (`app.controller.ts`,
   varsayılan `false`).

Koşullardan biri bile sağlanmazsa (ya da `/app-config` isteği ağ
hatası/timeout ile başarısız olursa) mobil SON BİLİNEN değeri korur ve yerel
zamanlama aynen devam eder. Bu yüzden `SERVER_PUSH_ENABLED`'ı Render'da `1`
yapmadan ÖNCE şu sıra izlenmeli:

(a) **Secret'lar** — Render'da `CAMPAIGN_TRIGGER_SECRET` tanımlı ve GitHub
    Actions repo secret'ıyla (`API_URL`, `CAMPAIGN_TRIGGER_SECRET`) birebir
    eşleştiğini doğrula (bkz. §1-2).
(b) **`dryRun` ile önizle, sonra `workflow_dispatch` ile gerçek tetikleme
    dene.** `campaign-triggers.yml`'in `workflow_dispatch`'i şu an bir
    `dryRun` input'u SUNMUYOR (yalnızca `campaign` seçimi) — önce §2'deki
    doğrudan `curl ... -d '{"dryRun": true}'` ile her kampanya için
    `candidates`/`sent`/`skipped` alanlarının beklendiği gibi göründüğünü
    doğrula; ardından `workflow_dispatch` ile (Actions sekmesi veya `gh
    workflow run campaign-triggers.yml -f campaign=kandil-eve`) gerçek
    (dryRun olmayan) bir tetikleme yapıp §4'teki `push_dispatches`
    koleksiyonunda beklenen kaydın oluştuğunu ve Expo push'un cihaza
    gerçekten ulaştığını doğrula.
(c) **`SERVER_PUSH_ENABLED=1` yap.** (a) ve (b) doğrulandıktan SONRA
    Render'da bu değeri `1` yapıp deploy et. Yeni değer mobil tarafta bir
    sonraki `GET /app-config` çağrısında (uygulama açılışı — zorunlu
    güncelleme kontrolüyle aynı yerde, bkz. `app/_layout.tsx`) etkili olur;
    mevcut açık oturumlar anında etkilenmez.

Bayrak kapalıyken (varsayılan `SERVER_PUSH_ENABLED=0` veya tanımsız) ya da
mobil `/app-config`'e hiç ulaşamadığında mobil cihazlar yerel kandil/özel gün
bildirimlerini zamanlamaya HER ZAMAN aynen devam eder — hiçbir bildirim
kaybolmaz; en kötü ihtimalle (bayrak yeni açıldığında, cihaz henüz
senkronlanmadan) kısa bir süre iki bildirim birden gelebilir. Geçiş kademeli
ve geri alınabilir: `SERVER_PUSH_ENABLED` tekrar `0`'a çekilirse mobil
cihazlar bir sonraki `/app-config` çağrısında yerel zamanlamaya geri döner.
