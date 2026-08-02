# Bildirim Kampanyaları — Teşhis Runbook'u

Cuma / özel gün kampanya bildirimleri gelmediğinde bu adımları sırayla uygula.

## 1. Cron tetiklendi mi? (GitHub Actions)

```bash
# Son campaign-trigger çalıştırmaları
gh run list --workflow=campaign-triggers.yml --limit 10

# Belirli bir çalıştırmanın logları
gh run view <run-id> --log
```

- Cron: `35 6 * * 5` (Cuma 09:35 TR) ve `05 17 * * *` (her gün 20:05 TR — özel gün arifesi).
- **Dikkat:** GitHub cron UTC'dedir; TR = UTC+3. Yaz/kış saati yok (Türkiye kalıcı UTC+3).
- Cron hiç tetiklenmediyse: repo 60+ gün inaktifse GitHub scheduled workflow'ları otomatik devre dışı bırakır — Actions sekmesinden "Enable workflow" ile aç.

## 2. Endpoint'i manuel tetikle

```bash
# Cuma kampanyası (dry-run yok; quiet-hours ve claim korumaları devrede)
curl -X POST "$API_URL/internal/campaigns/friday" \
  -H "x-campaign-secret: $CAMPAIGN_TRIGGER_SECRET" -i

# Özel gün arifesi
curl -X POST "$API_URL/internal/campaigns/special-day-eve" \
  -H "x-campaign-secret: $CAMPAIGN_TRIGGER_SECRET" -i
```

- `401` → secret uyuşmazlığı: GitHub Secrets'taki `CAMPAIGN_TRIGGER_SECRET` ile Render env'i karşılaştır.
- `200` + `{"skipped": "..."}` → aşağıdaki skip nedenlerine bak.

## 3. Yanıttaki skip nedenleri (CampaignRunResult)

| `skipped` değeri | Anlamı | Aksiyon |
| --- | --- | --- |
| `not-friday` | İstanbul saatine göre Cuma değil | Cron saatini / sunucu saatini kontrol et |
| `quiet-hours` | 23:00–08:00 İstanbul arası | Tetikleme saatini düzelt |
| `already-sent` | Bugün için dispatch claim'i zaten var | `notification_dispatches` koleksiyonuna bak (aşağıda) |
| `no-targets` | Uygun cihaz yok | Cihaz kayıtlarını ve prefs'i kontrol et (adım 5) |
| `no-special-day` | Yarın için özel gün kaydı yok | Seed verisini kontrol et (adım 6) |

## 4. Dispatch kayıtları (çift gönderim kilidi)

```js
// mongosh
use zikirmatik
db.notification_dispatches.find({ key: /^friday:/ }).sort({ createdAt: -1 }).limit(5)
db.notification_dispatches.find({ key: /^special-day:/ }).sort({ createdAt: -1 }).limit(5)
```

- `status: 'claimed'` olarak takılı kalmış kayıt → process gönderim sırasında öldü demektir; kaydı silip yeniden tetikle:
  `db.notification_dispatches.deleteOne({ key: 'friday:2026-01-16' })`
- `status: 'sent'` ise `sentCount` / `deactivatedDeviceIds` alanlarına bak.

## 5. Cihaz hedefleme

```js
db.push_devices.find({ 'prefs.friday': true }).count()
db.push_devices.find({ 'prefs.specialDays': true }).count()
// Bir kullanıcının cihazı:
db.push_devices.find({ userId: ObjectId('...') })
```

- Sayı 0 ise sorun istemci tarafında: `useDeviceNotificationPrefsStore` senkronu ve `registerPushDevice` çağrısı (uygulama açılışında) çalışmıyor olabilir.
- `deactivatedDeviceIds` doluysa Expo `DeviceNotRegistered` dönmüştür — kullanıcı uygulamayı silmiş/yeniden kurmuş olabilir; yeniden açınca cihaz tekrar kaydolur.

## 6. Özel gün verisi

```js
db.special_days.find({ date: '2026-05-26' })
db.special_days.find({ date: { $gte: '2026-01-01' } }).sort({ date: 1 }).limit(10)
```

- Format `YYYY-MM-DD` olmalı (getIstanbulParts `dateKey` ile birebir eşleşir; spec'te kilitli).
- Eksikse: `node scripts/seed-special-days-master-2026.mjs`

## 7. Expo push zinciri

- Servis logunda `push-sender` satırlarını ara: gönderim ticket'ları, receipt hataları ve `DeviceNotRegistered` deaktivasyonları loglanır.
- Render loglarında `NotificationCampaignsService` ve `PushSenderService` etiketlerini filtrele.

## 8. Bilinen kök nedenler (bu incelemede bulunanlar)

1. **Fix A:** Cuma cron'u yalnızca zikir hatırlatmasını tetikliyordu; kampanya endpoint'i workflow'a eklendi.
2. **Fix B:** `x-campaign-secret` header adı guard ile uyuşmuyordu.
3. **Fix C:** Quiet-hours kontrolü UTC saatine bakıyordu; İstanbul saatine çevrildi (`getIstanbulParts`).
4. **Fix D:** Claim `sent` durumuna geçmeden hata alınca sonsuza dek kilitli kalıyordu; hata yolunda `releaseDispatchClaim` eklendi.
5. **Fix E:** Seed `date` formatı ile `dateKey` eşleşmesi birim testiyle kilitlendi.
