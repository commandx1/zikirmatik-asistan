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

Sonuçlar `load/out/summary.json`'a yazılır. Yukarıdaki profiller **yerel
makinede (sınırsız) regresyon göstergesidir**; kapasite ölçümü için aşağıdaki
"Prod benzeri kapasite testi" bölümünü kullanın. Hiçbir şey prod'a (Render/Atlas)
karşı çalıştırılmaz.

## Prod benzeri kapasite testi (Render Starter: 0.5 CPU / 512 MB)

Rapor: `docs/qa/yuk-raporu.md`. Tüm komutlar `apps/api` dizininden.

```bash
pnpm db:test                                   # kökten; mongo-test :27018 (rs0)
pnpm build                                     # dist/ (konteynere salt-okunur bağlanır)
docker compose -f load/docker-compose.load.yml --profile install run --rm api-install  # bir kez: linux node_modules volume'u
docker compose -f load/docker-compose.load.yml up -d api-load   # :3010, --cpus=0.5 --memory=512m
docker inspect -f '{{.HostConfig.NanoCpus}} {{.HostConfig.Memory}}' load-api-load-1  # 500000000 536870912
export MONGODB_URI='mongodb://127.0.0.1:27018/zikir_load?directConnection=true'
node load/seed.mjs && node load/seed-bulk.mjs  # zikirler/halka/vird + 5000 kullanıcı, 100k log, 120 özel gün
```

Temiz başlangıç: `mongosh --port 27018 zikir_load --eval 'db.dropDatabase()'`, API konteynerini
yeniden başlat (indeksler açılışta kurulur), sonra seed.

Koşu = `load/run.sh <ad> <senaryo> [KEY=VALUE...]` (monitor + k6 + analiz; çıktı `load/out/<ad>/`).
`CONTAINER=load-api-load-1` (docker stats) veya `PID=<pid>` (yerel süreç) ile kaynak ölçülür; monitor
her 5 sn'de `serverStatus().opcounters` örnekler (ops/sn = fark / süre).

| Senaryo | Komut |
|---|---|
| Kırılma noktası (adım adım VU) | `load/run.sh breakpoint mix STAGES=25:10s,25:80s,50:10s,50:80s,100:10s,100:80s,150:10s,150:80s,200:10s,200:80s` |
| Halka yoğun (N üye, 3 sn flush + 5 sn poll) | `load/run.sh circle circle-heavy STAGES=50:10s,50:80s,100:10s,100:80s` |
| Ani yük | `load/run.sh spike mix PRESIGN=400 STAGES=400:10s,400:60s,50:5s,50:75s` (PRESIGN yoksa kayıt fırtınası da dahil) |
| Soak | `load/run.sh soak mix STAGES=130:20s,130:1200s` |
| Uç nokta başına Mongo işlemi + CPU ms | `CONTAINER=load-api-load-1 node load/probe-ops.mjs` |

`STAGES` = `hedefVU:süre` listesi; aynı hedefin tekrarı "bekleme" aşamasıdır, tabloya yalnız onlar girer.
Her istek `stage` ve `ep` (uç nokta) etiketi taşır. Access token 15 dk — senaryolar 401'de
refresh eder (tek kullanımlık rotasyon: dönen refreshToken hep saklanır).

Doğrulayıcılar (koşulardan sonra, hepsi PASS/FAIL basar, FAIL → exit 1):
`node load/verify-circle.mjs`, `verify-credits.mjs`, `verify-vird.mjs`, `verify-logs.mjs`, `verify-streaks.mjs`.

Yerel (sınırsız) karşılaştırma: `cd $(mktemp -d)` (apps/api/.env YÜKLENMESİN) sonra
`NODE_ENV=development LOG_LEVEL=info PORT=3011 MONGODB_URI=…/zikir_load_native?directConnection=true AUTH_ALLOW_INSECURE_TEST_TOKENS=1 AI_RUNTIME_MOCK=1 AUTH_ACCESS_TOKEN_SECRET=x AUTH_REFRESH_TOKEN_SECRET=y … node <repo>/apps/api/dist/main.js`;
`BASE_URL=http://127.0.0.1:3011`, `SEED_FILE=<mutlak yol>` ve `PID=<pid>` ile aynı senaryolar.

Notlar: Mongo (limitsiz) ve k6 aynı makinede koşar; Mongo Docker VM'inde API ile CPU paylaşır, bu yüzden
API tarafı kapasitesi hafif iyimser/kötümser sapabilir. `NODE_ENV=production` AI mock'unu kapattığı
için konteyner `development` ile koşar (`LOG_LEVEL=info` = prod varsayılanı). Docker `CPU %` = tek çekirdeğin
yüzdesi; 0.5 CPU sınırı = %50.
