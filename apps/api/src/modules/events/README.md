# Events (product analytics)

Sıfır maliyetli, kendi veritabanımıza yazan minimal ürün-olayı altyapısı.
Üçüncü taraf bir analytics servisi kullanmaz; `app_events` koleksiyonuna
doğrudan yazar.

## Uç nokta

`POST /v1/events`

```
{ "deviceId": "...", "events": [{ "name": "dhikr_completed", "props": { "count": 33 }, "ts": "2026-09-12T10:00:00.000Z" }] }
```

- Guard: `OptionalJwtAuthGuard` — misafirler için de çalışır; geçerli bir
  bearer token varsa olaylar o kullanıcıya (`userId`) bağlanır.
- En fazla 50 olay/istek (`MAX_EVENTS_PER_REQUEST`).
- Geçersiz tekil olaylar (kural dışı `name`, geçersiz `ts`, sınırı aşan
  `props`) tek tek atlanır; istek her zaman `200` ile `{ accepted: number }`
  döner — analitik ana akışı asla bozulmaz.

## Olay adı kuralı

`name` alanı `^[a-z_]{2,48}$` ile eşleşmelidir: kısa, `snake_case`, sabit bir
sözlük gibi davranmalı (ör. `dhikr_completed`), serbest metin olmamalı.

## TTL

`app_events` M0 (ücretsiz, 512MB) cluster kotası nedeniyle sınırsız
büyüyemez: belgeler `createdAt` üzerinden 180 gün (`expireAfterSeconds:
15552000`) sonra otomatik silinir.
