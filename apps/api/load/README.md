# k6 yük testi

Kurulum: `brew install k6`. Önce yerel Mongo (`pnpm db:test`) ve prod build API
başlat (`pnpm --filter api build && MONGODB_URI='mongodb://127.0.0.1:27018/zikir_load?directConnection=true' AUTH_ALLOW_INSECURE_TEST_TOKENS=1 AI_RUNTIME_MOCK=1 PORT=3010 node apps/api/dist/main`).

Seed (kurucu+halka+üyeler+vird — `test:load:circle` bunu otomatik çalıştırır,
diğer profillerden önce elle bir kez çalıştırın): `MONGODB_URI=... BASE_URL=http://127.0.0.1:3010 node load/seed.mjs`.

Komutlar: `pnpm --filter api test:load:smoke|load|spike|circle`. `SCENARIO=dhikr|circle|vird|auth|ai` ile tek senaryo, `PROFILE=smoke|load|spike` ile profil seçilir.

Profiller: smoke 5 VU/1dk, load 0→50→50→0 VU (1dk/3dk/1dk), spike 0→200→200→0 VU
(10s/20s/10s). Eşikler: p95<500ms, hata oranı <%1.

Circle doğrulaması Mongo'dan yapılır (k6 VU'ları izole çalıştığı için
k6 içinde paylaşılan "beklenen toplam" tutulmuyor): `circles.totalCount`
`dhikr_logs.count` toplamına, belge sayısı üye sayısına eşit olmalı.

Sonuçlar `load/out/summary.json`'a yazılır. Bu sayılar **yerel makine
üzerindeki bir regresyon göstergesidir** — Render Free planının gerçek
kapasitesini temsil etmez (CPU/bellek farklı) ve asla prod'a karşı
çalıştırılmaz.
