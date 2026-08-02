# AI Kredi Birim Ekonomi Takibi

Bu dosya, AI Rehber kredi modelinin karlilik takibini tek yerden yapmak icin kullanilir.

## Durum

- Model: Hibrit (flow bazli tek kesim)
- Kesim: Basarili oneride 1 kredi
- Clarification/off-topic/hata: 0 kredi
- Premium grant: 50 kredi / UTC ay
- Free grant: 1 kredi / UTC gun
- Top-up: RevenueCat `NON_SUBSCRIPTION_PURCHASE`

## Guncelleme Rutini

- Siklik: Gunluk kisa rapor + haftalik detayli rapor
- Veri kaynagi: MongoDB (`ai_credit_wallets`, `ai_credit_ledger`, `ai_recommendations`)
- Zaman referansi: UTC

## KPI'lar (Zorunlu)

1. `active_users_7d`
2. `successful_recommendations_7d`
3. `credits_debited_7d`
4. `credits_granted_free_7d`
5. `credits_granted_premium_30d`
6. `credits_topup_30d`
7. `avg_credits_per_success`
8. `topup_share = credits_topup / credits_debited`
9. `premium_share = premium_users / active_users`
10. `estimated_cost_per_success_usd`
11. `estimated_revenue_per_credit_usd`
12. `estimated_gross_margin`

## Mongo Sorgu Sablonlari

Not: Asagidaki sorgulari `mongosh` ile calistir.

### 1) Son 7 gunde kredi kesimleri

```javascript
const since = new Date(Date.now() - 7*24*60*60*1000);
db.ai_credit_ledger.aggregate([
  { $match: { reason: "RECOMMENDATION_DEBIT", createdAt: { $gte: since } } },
  { $group: { _id: null, count: { $sum: 1 }, credits: { $sum: "$delta" } } }
]);
```

### 2) Son 7 gunde basarili oneriler

```javascript
const since = new Date(Date.now() - 7*24*60*60*1000);
db.ai_recommendations.countDocuments({ createdAt: { $gte: since } });
```

### 3) Son 7 gunde free grant

```javascript
const since = new Date(Date.now() - 7*24*60*60*1000);
db.ai_credit_ledger.aggregate([
  { $match: { reason: "FREE_DAILY_GRANT", createdAt: { $gte: since } } },
  { $group: { _id: null, credits: { $sum: "$delta" }, users: { $addToSet: "$userId" } } },
  { $project: { _id: 0, credits: 1, users: { $size: "$users" } } }
]);
```

### 4) Son 30 gunde premium grant

```javascript
const since = new Date(Date.now() - 30*24*60*60*1000);
db.ai_credit_ledger.aggregate([
  { $match: { reason: "PREMIUM_MONTHLY_GRANT", createdAt: { $gte: since } } },
  { $group: { _id: null, credits: { $sum: "$delta" }, users: { $addToSet: "$userId" } } },
  { $project: { _id: 0, credits: 1, users: { $size: "$users" } } }
]);
```

### 5) Son 30 gunde top-up

```javascript
const since = new Date(Date.now() - 30*24*60*60*1000);
db.ai_credit_ledger.aggregate([
  { $match: { reason: "TOPUP_PURCHASE", createdAt: { $gte: since } } },
  { $group: { _id: "$metadata.productId", credits: { $sum: "$delta" }, events: { $sum: 1 } } },
  { $sort: { credits: -1 } }
]);
```

### 6) Cuzdan dagilimi (anlik)

```javascript
db.ai_credit_wallets.aggregate([
  {
    $bucket: {
      groupBy: "$balance",
      boundaries: [0, 1, 3, 5, 10, 25, 50, 100, 999999],
      default: "100+",
      output: { users: { $sum: 1 } }
    }
  }
]);
```

## Haftalik Rapor Formati

- Tarih (UTC):
- Active users (7d):
- Successful recommendations (7d):
- Credits debited (7d):
- Credits granted free (7d):
- Credits granted premium (30d):
- Credits topup (30d):
- Avg credits per success:
- Estimated cost per success (USD):
- Estimated revenue per credit (USD):
- Estimated gross margin:
- Aksiyon:

## Marj Aksiyon Kurallari

- Gross margin < %45: Token limit dusur + ucuz model katmani artir
- Gross margin %45-%60: Paket fiyatlarini gozden gecir
- Gross margin > %60: Buyume testi (kampanya / daha buyuk top-up)

## Notlar

- `AI_CREDIT_TOPUP_PRODUCTS` config'i guncel tutulmali.
- Tum grant/debit/top-up islemleri idempotent index'lerle korunur.
- Clarification akisi ayni `flowId` ile tek kesimdir.

## Baseline Raporu #1 (Pre-launch)

- Rapor tarihi (UTC): 2026-07-08T15:05:13Z
- Ortam: `test` veritabani
- Not: Bu rapor, model canli trafikte yaygin kullanilmadan onceki teknik baseline'dir.

### KPI Sonuclari

- `active_users_7d`: 1
- `successful_recommendations_7d`: 12
- `credits_debited_7d`: 0
- `credits_granted_free_7d`: 0
- `credits_granted_premium_30d`: 0
- `credits_topup_30d`: 0
- `avg_credits_per_success`: 0
- `topup_share_30d`: null
- `premium_share_active_7d`: 0

### Altyapi Kontrolu

- `ai_credit_wallets` count: 0
- `ai_credit_ledger` count: 0
- Wallet indexleri: `_id_`, `userId_1`
- Ledger indexleri:
  - `_id_`
  - `userId_1`
  - `reason_1`
  - `userId_1_reason_1_dayKey_1`
  - `userId_1_reason_1_monthKey_1`
  - `userId_1_reason_1_flowId_1`
  - `reason_1_providerEventId_1`

### Yorum

- Kredi koleksiyonlari olusmus ve idempotency indexleri aktif.
- Son 7 gunde 12 AI onerisi gorunuyor ancak kredi kesim kaydi yok.
- Bu tablo, mevcut 12 onerinin kredi modelinden once olustugu veya yeni endpoint akisinin henuz trafikte kullanilmadigi anlamina gelir.
- Bu asamada finansal karar cikarmak icin veri yetersiz; rapor teknik dogrulama/baseline olarak gecerlidir.

### Sonraki Esik (Anlamli Fiyat Karari Icin)

- En az 100-200 basarili oneride kredi kesimi gozlenmeli.
- En az 10+ top-up olayi gorulmeli.
- Sonra `estimated_cost_per_success` ve `estimated_gross_margin` alanlari dolu sekilde haftalik fiyat optimizasyonuna gecilmeli.
