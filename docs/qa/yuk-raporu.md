# Yük Raporu (Render Starter + Atlas M0/Flex)

Tarih: 2026-10-07. Hazırlayan: otomatik yük testi (k6). Tüm koşular yerel makinede yapıldı; Render ve Atlas'a (prod) hiçbir istek gönderilmedi.

Bu rapordaki **ölçüm** ifadeleri gerçek koşu sonuçlarıdır. **Tahmin** diye işaretlenenler ölçüm değil, varsayımlarla yapılmış hesaptır.

## 1. Kısa özet (kurucu için)

- **Önce Atlas M0 sıkışır, sonra Render Starter.** M0'ın 100 işlem/sn sınırı yaklaşık **70-75 aynı anda aktif kullanıcıda** doluyor. Render Starter (0.5 CPU) ise yaklaşık **185 aynı anda aktif kullanıcıda** yavaşlamaya başlıyor (p95 > 1 sn).
- **Atlas Flex'e geçmek (500 işlem/sn) doğru ilk adım.** Flex'te Mongo sınırı artık darboğaz olmuyor: Render Starter, Mongo'yu 500 işlem/sn'ye ulaştıramadan kendi CPU'sunda tıkanıyor (en fazla yaklaşık 250 işlem/sn üretebildi).
- **Bellek sorun değil.** 512 MB'ın yalnızca 140-180 MB'ı kullanıldı. 20 dakikalık soak testinde bellek sızıntısı ve yeniden başlatma yok.
- **Zikir Halkası en pahalı özellik.** Aynı halkada eşzamanlı çalışan her üye saniyede yaklaşık 5 Mongo işlemi üretiyor. Aynı anda aktif **yaklaşık 20 halka üyesi M0'ı doldurur**, yaklaşık 100 üye hem Flex'i hem Starter'ın CPU'sunu zorlar.
- **Veri doğruluğu: 5 doğrulayıcının 5'i de PASS** (halka toplamı, kredi, vird, yinelenen log, seri). Yük altında veri bozulması bulunmadı.
- **Bulunan gerçek hata:** Node'un varsayılan 5 sn "keep-alive" süresi yüzünden POST isteklerinin yaklaşık %0.1-0.4'ü düşüyordu. `apps/api/src/main.ts` içinde düzeltildi; aynı yükte hata %0'a indi (bölüm 9).

## 2. Kurulum

| Parça | Ayar |
|---|---|
| API | Docker, `node:22`, **0.5 CPU / 512 MB** (Render Starter ile aynı). `docker inspect` doğrulaması: NanoCpus=500000000, Memory=536870912 |
| Veritabanı | `mongo:7` tek düğüm replica set (docker `mongo-test`, 127.0.0.1:27018), db `zikir_load`. **Sınırsız**: Atlas'ın 100 işlem/sn sınırı burada yok; bu yüzden işlem/sn'yi ayrıca ölçtük |
| Yük aracı | k6 v2.3.0 (Mac üzerinde) |
| Ortam | NODE_ENV=development (AI sahte modu üretimde kapalı olduğu için), LOG_LEVEL=info (prod varsayılanı), AI_RUNTIME_MOCK=1, log drain/Slack kapalı |
| Başlangıç verisi | 5.000 arka plan kullanıcısı, 100.000 zikir logu, 120 özel gün (uzun makale metinli), 5 zikir, 1 halka, 1 vird. Koşular sonunda: 7.049 kullanıcı, 107.275 log, 1.746 seri belgesi, ~27 MB veri |
| Örnekleme | Docker CPU/bellek ve Mongo `opcounters` her 5 sn'de bir; işlem/sn = iki örnek arası fark / süre. Boşta taban yaklaşık 2.7 işlem/sn (tablolarda çıkarıldı) |

Notlar:
- Mongo ve k6 aynı makinede çalışıyor, Mongo Docker VM'inde API ile CPU paylaşıyor. API ile Atlas arasındaki ağ gecikmesi (Render Frankfurt - Atlas) bu testte yok; gerçekte her istek biraz daha yavaş olur (**tahmin**: istek başına 5-20 ms).
- Render'ın gerçek CPU hızı bu Mac/Docker'dan farklı olabilir. Aşağıdaki "kırılma noktası" için **±%30 belirsizlik** payı bırakın.

### Senaryolar

- **mix (gerçekçi karışım):** Her sanal kullanıcı (VU) bir kişi gibi davranır: uygulamayı açar (kullanıcı, app-config, özel günler, seri, istatistik, AI kredisi, cihaz kaydı), 2-5 zikir kaydı yapar (artan sayım), vird bugün'e bakar, %5 ihtimalle AI öneri ister (sahte model; %25'inde aynı flowId tekrar), 2-10 sn düşünme süresi. Kullanıcıların %30'u vird kurar (iki program aynı anda aktifleştirilmeye çalışılır). Farklı saat dilimleri (`x-client-timezone`). Bir kullanıcı yaklaşık **0.38 istek/sn** üretir.
- **circle-heavy:** Aynı halkada N üye; gerçek uygulama deseni: 3 sn'de bir katkı gönderme + 5 sn'de bir detay yoklama.
- **Kırılma noktası:** VU sayısı adım adım artırıldı (her adım 80-100 sn).
- **Ani yük (spike):** 10 sn'de 0'dan 400 VU'ya.
- **Soak:** 20 dakika, 130 VU (kırılma noktasının yaklaşık %70'i).
- **Yerel (sınırsız) karşılaştırma:** aynı senaryolar, Mac üzerinde sınırsız API, daha kısa süre.

## 3. Sonuçlar (Render Starter limitli konteyner)

Tablolardaki "Mongo işlem/sn" boşta tabanı çıkarılmış toplamdır. CPU sütunu tek çekirdeğin yüzdesidir; konteyner sınırı **%50**'dir (0.5 CPU). Bu yüzden CPU ortalaması/maksimumu %50'ye yaklaşınca konteyner tıkanmış demektir. Gecikmeler milisaniyedir.

### 3.1 Kırılma noktası (mix) - kaba tarama

| Eşzamanlı kullanıcı | İstek/sn | p50 | p95 | p99 | Hata % | CPU ort/maks | Bellek maks (MiB) | Mongo işlem/sn |
|---|---|---|---|---|---|---|---|---|
| 25 | 7.0 | 16 | 103 | 274 | 0.00 | 13/26 | 103 | 31 |
| 50 | 16.3 | 15 | 185 | 530 | 0.08 | 19/33 | 107 | 63 |
| 100 | 32.5 | 16 | 268 | 1465 | 0.08 | 30/46 | 122 | 136 |
| 150 | 47.4 | 35 | 819 | 4546 | 0.13 | 40/50 | 129 | 200 |
| 200 | 58.2 | 194 | 4179 | 12655 | 0.41 | 47/51 | 135 | 250 |
| 300 | 56.5 | 353 | 13445 | 19802 | 0.44 | 50/55 | 144 | 260 |
| 400 | 55.0 | 324 | 21982 | 25631 | 0.39 | 50/51 | 150 | 264 |
| 500 | 51.2 | 203 | 17926 | 24748 | 0.37 | 51/54 | 146 | 257 |

Bu tarama keep-alive düzeltmesinden önce yapıldı; hata sütunundaki 0.1-0.4% o hatadır (bölüm 9).

### 3.2 Kırılma noktası - ince tarama (aynı konfigürasyon)

| Eşzamanlı kullanıcı | İstek/sn | p50 | p95 | p99 | Hata % | CPU ort/maks | Bellek maks | Mongo işlem/sn |
|---|---|---|---|---|---|---|---|---|
| 100 | 28.9 | 15 | 164 | 409 | 0.10 | 26/40 | 142 | 141 |
| 125 | 41.4 | 19 | 365 | 773 | 0.17 | 34/48 | 140 | 169 |
| 150 | 49.8 | 26 | 384 | 835 | 0.10 | 39/52 | 142 | 205 |
| 175 | 58.3 | 92 | 743 | 1355 | 0.17 | 45/52 | 144 | 235 |
| 200 | 62.2 | 192 | 1270 | 1961 | 0.43 | 49/53 | 148 | 249 |

**Diz noktası (knee), Render Starter:** p95 1 sn'yi **175 ile 200 VU arasında** (~**185**) geçiyor. Hata oranı hiçbir adımda %1'e ulaşmadı (en fazla %0.44); yani önce **gecikme** bozuluyor, hata değil. 200 VU'dan sonra CPU %50 tavanına dayanıyor, istek/sn yaklaşık 55-62'de **platoluyor**, fazla kullanıcı sıraya giriyor (p95 400-500 VU'da 18-22 sn). Çökme/yeniden başlatma olmadı.

### 3.3 Zikir Halkası (circle-heavy), tek halka, N üye

| Aynı anda aktif üye | İstek/sn | p50 | p95 | p99 | Hata % | CPU ort/maks | Bellek maks | Mongo işlem/sn |
|---|---|---|---|---|---|---|---|---|
| 50 | 25.1 | 27 | 153 | 291 | 0.00 | 24/32 | 122 | 257 |
| 100 | 47.8 | 119 | 851 | 1700 | 0.00 | 42/50 | 130 | 492 |
| 150 | 50.4 | 1018 | 1666 | 1834 | 0.00 | 50/51 | 135 | 525 |

Üye başına yaklaşık **5 Mongo işlem/sn** (3 sn'de bir katkı yazımı ~12 işlem + 5 sn'de bir detay okuma ~6 işlem). Starter'da halka için sınır yaklaşık **100 eşzamanlı üye** (p95 0.85 sn).

### 3.4 Ani yük (spike): 10 sn'de 400 kullanıcı

| Varyant | Tutma aşaması (400 VU) | Toparlanma (50 VU) | Tüm koşu hata % |
|---|---|---|---|
| Mevcut kullanıcılar aynı anda açıyor (önceden giriş yapmış) | 26 istek/sn, p50 1024, p95 4461, p99 5136 ms, hata %0.06, CPU %50, bellek maks 181 MiB | p95 100 ms, hata %0 (anında toparlandı) | %0.97 (60 sn'yi aşan istekler) |
| 400 yepyeni kullanıcı kayıt oluyor (kayıt fırtınası) | 21.6 istek/sn, p50 879, p95 3423, p99 4044 ms | p95 98 ms | %1.35 (62 giriş isteği 60 sn'de zaman aşımı) |

Yorum: Ani yükte sunucu **çökmüyor** ve yük gidince hemen toparlanıyor; ancak 400 kişi aynı 10 saniyede uygulamayı açarsa ilk dakika boyunca ekranlar 1-5 sn (bazıları çok daha uzun) gecikir. (Örnek: Kandil gecesi bildirimi.) Mobil uygulamanın zaman aşımı 60 sn'den kısaysa bu kullanıcılar hata görür.

### 3.5 Soak: 20 dk, 130 kullanıcı (knee'nin ~%70'i)

| Ölçüt | Sonuç |
|---|---|
| İstek | 56.039 istek, 44.8 istek/sn |
| p50 / p95 / p99 | 21 / 261 / 435 ms (tutma aşaması), tüm koşu 21 / 290 / 607 ms |
| Hata | **%0.00** (0 başarısız istek) |
| CPU | ort. %36, maks %53 (limit %50: kısa süreli sıçramalar) |
| Bellek | 134 MiB (1. dk) → 142 MiB (15. dk) → 137 MiB (20. dk). **Sızıntı yok** (dalgalanıyor, artmıyor) |
| OOM / yeniden başlatma | **Yok** (OOMKilled=false, RestartCount=0) |
| Token yenileme | 130 yenileme (15 dk access token süresi); tek kullanımlık rotasyon sorunsuz |
| Mongo | 182 işlem/sn (sabit: dakika dakika 175-194 arası) → M0'ın 100 sınırının ~1.8 katı |

## 4. Mongo işlem/sn eğrisi: M0 (100) ve Flex (500)

Mix senaryosunda eşzamanlı kullanıcı başına yaklaşık **1.4 işlem/sn** (ölçüm: 130 VU → 182 işlem/sn). İstek başına ortalama **4.0-4.4 Mongo işlemi**.

| Eşzamanlı kullanıcı (mix) | Mongo işlem/sn (Starter konteyneri) | Mongo işlem/sn (sınırsız Mac API) |
|---|---|---|
| 50 | 63 | 65 |
| 100 | 136 | 128 |
| 150 | 200 | 189 |
| 200 | 250 (Starter CPU tavanı) | 257 |
| 300 | 260 (tavan) | 387 |
| 400 | 264 (tavan) | 528 |

- **M0 (100 işlem/sn):** yaklaşık **70-75 eşzamanlı kullanıcıda** doluyor (ölçüm: 50 VU = 63, 100 VU = 136, aradaki ara değer hesabıyla). Starter'ın CPU sınırından (~185) **çok önce**.
- **Flex (500 işlem/sn):** Starter konteyneri bu seviyeye **hiç ulaşamadı** (en çok ~264 işlem/sn). Sınırsız Mac'te ~**380 eşzamanlı kullanıcıda** aşıldı (ölçüm: 300 VU = 387, 400 VU = 528). Yani Flex, bu uygulama mimarisi ve Starter ile **yeterli**; Flex ancak API tarafı yaklaşık 2 kat güçlenirse (Standard/çok örnek) sınır olur.
- **Halka senaryosunda:** 100 üye = 492 işlem/sn. M0 yaklaşık **20 eşzamanlı halka üyesinde**, Flex yaklaşık **100 üyede** doluyor.

**M0 sınırı aşılınca ne olur?** Atlas M0 sınırı aşan işlemleri yavaşlatır/geciktirir (hata değil, gecikme). Bu davranışı yerelde ölçemedik (yerel Mongo sınırsız). Pratikte 70+ eşzamanlı kullanıcıda istek süreleri uzayacaktır (**tahmin**).

## 5. Eşzamanlı kullanıcıdan günlük aktif kullanıcıya (DAU) çeviri (TAHMİN)

Varsayımlar (hepsi tahmindir; kendi verinle değiştir):
- Bir kullanıcı günde **2 oturum x 4 dk = 8 dk** uygulamada.
- "Eşzamanlı aktif kullanıcı" = o an uygulama açık ve kullanılıyor (testteki sanal kullanıcı böyle davranıyor).
- Tepe saat, günün ortalamasının **pf** katı: sabah/akşam namaz saatleri için pf = 2-4; Kandil/Ramazan gecesi pf = 10 gibi.
- Eşzamanlı kullanıcı ≈ DAU x 8 dk x pf / 1440 dk.

| | Eşzamanlı | pf=2 | pf=4 (tipik) | pf=10 (Kandil) |
|---|---|---|---|---|
| Atlas M0 sınırı (100 işlem/sn) | ~72 | ~6.500 DAU | **~3.200 DAU** | ~1.300 DAU |
| Render Starter diz noktası (p95 = 1 sn) | ~185 | ~16.600 DAU | **~8.300 DAU** | ~3.300 DAU |
| Starter'da rahat bölge (diz noktasının %70'i) | ~130 | ~11.700 DAU | **~5.800 DAU** | ~2.300 DAU |

Okuma: tipik bir günde M0 ile **~3 bin DAU**, Flex'e geçince Starter ile **~6-8 bin DAU**. Kandil gibi yoğun gecelerde bu sayılar **3-4 kat daha düşük** değerlere iner; yani 1-2 bin DAU'da bile bir Kandil gecesi M0'ı doldurabilir. Halka kullanan kullanıcılar bu hesabın dışında ekstra yük bindirir (bölüm 3.3).

## 6. Yerel (sınırsız) Mac API ile karşılaştırma

Aynı senaryolar, daha kısa süre, tek Node süreci, sınırsız CPU/bellek. Tutma aşamaları.

| Senaryo | VU | İstek/sn | p50 | p95 | p99 | Hata % | Süreç CPU (tek çekirdek %) ort/maks | Bellek maks MiB | Mongo işlem/sn |
|---|---|---|---|---|---|---|---|---|---|
| mix | 100 | 30.8 | 8 | 33 | 43 | 0 | 24/52 | 227 | 128 |
| mix | 200 | 64.6 | 7 | 29 | 39 | 0 | 26/33 | 247 | 257 |
| mix | 300 | 97.7 | 7 | 30 | 44 | 0 | 43/56 | 268 | 387 |
| mix | 400 | 135.0 | 8 | 30 | 44 | 0 | 45/73 | 279 | 528 |
| circle-heavy | 100 | 53.0 | 22 | 45 | 58 | 0 | 22/30 | 267 | 534 |
| circle-heavy | 150 | 79.7 | 24 | 59 | 83 | 0 | 29/43 | 488 | 794 |
| spike (önceden girişli 400 VU) | 400 | 92.1 | 6 | 30 | 47 | 0 | 44/52 | 383 | 500 |

Karşılaştırma: Sınırsız API'de 400 VU'da bile p95 30 ms; kırılma yok. Aynı yükte 0.5 CPU'luk konteyner 175-200 VU'da tıkandı. İstek başına CPU süresi: Mac'te yaklaşık **3.3 ms**, 0.5 CPU konteynerde yaklaşık **8.6 ms** (hem konteyner CPU kotası hem Docker VM yükü). Render'ın gerçek işlemcisi bu iki uçun arasında bir yerde olacaktır (**belirsiz**), bu yüzden Starter kırılma noktasını ±%30 okuyun. Mac'te Mongo işlem sayıları aynı çıktı: işlem/istek uygulamanın özelliğidir, donanımın değil.

## 7. Uç nokta maliyetleri (ardışık 100 istek, tek kullanıcı, konteyner)

Mongo işlem/istek ve konteyner CPU ms/istek (cgroup ölçümü). Başka yükün olmadığı sırada ölçüldü.

| Uç nokta | Mongo işlem/istek | CPU ms/istek |
|---|---|---|
| GET /app-config | 0.0 | 1.2 |
| GET users/:id | 1.0 | 2.6 |
| GET streaks/:id | 2.0 | 2.7 |
| GET ai/credits | 3.0 | 4.0 |
| GET stats/summary | 4.0 | 6.0 |
| GET vird/today | 5.1 | 5.7 |
| GET circles/:id | 6.0 | 5.0 |
| POST devices/register | 1.0 | 3.4 |
| **GET special-days/home** | 2.0 | **37.0** |
| **POST dhikr-logs (sade)** | **8.0** | 8.8 |
| **POST dhikr-logs (vird)** | **14.1** | 15.7 |
| **POST dhikr-logs (halka)** | **12.0** | 10.4 |
| POST auth/verify (yeni kullanıcı) | 6.2 | 7.1 |
| auth + AI öneri (yeni kullanıcı) | 26.9 | 40.5 |

(Aynı test 365 günlük geçmişi olan bir kullanıcıyla tekrarlandı: sade zikir kaydı 8.8 → 11.6 ms CPU, işlem sayısı aynı.)

## 8. API sıcak noktaları ve ucuz çözümler

1. **Zikir kaydı (`POST /v1/dhikr-logs`) her kayıtta seriyi baştan hesaplıyor.** Her kayıtta kullanıcının tüm log günlerini tarayan 2 `distinct` sorgusu + seri güncelleme çalışıyor (8 işlemin yaklaşık yarısı). Geçmiş uzadıkça CPU artıyor (365 günde +%32, ölçüm). Halkada bu 3 sn'de bir tekrarlanıyor. **Ucuz çözüm (öneri, yapılmadı):** o gün için zaten sayımı > 0 bir log varsa seri yeniden hesaplanmasın (yalnız günün ilk kaydında hesapla). Tahmini kazanç: kayıt başına ~4 Mongo işlemi (%50), halka maliyetinin yaklaşık yarısı.
2. **`GET /v1/special-days/home` 37 ms CPU** (diğer okumaların 4-10 katı; ölçüm). Gelecekteki tüm aktif günleri makale ve ibadet metinleriyle birlikte okuyor, ama yanıt bunları kullanmıyor. **Ucuz çözüm (öneri, yapılmadı):** sorguya `.select('-article -practices')` ve/veya 60 sn bellek önbelleği (herkese aynı veri). Not: burada kullandığım 120 günlük veri sentetik; gerçek prod boyutu farklıysa kazanç da değişir.
3. **Zikir Halkası yazım/okuma sıklığı.** Üye başına ~5 Mongo işlem/sn. Büyük halkalarda (20+ üye aynı anda) M0'ı tek başına doldurur. **Çözüm (öneri):** katkı gönderme aralığını 3 sn'den 5-10 sn'ye çıkarmak veya yoklamayı 5 sn'den 10 sn'ye çıkarmak maliyeti doğrudan yarıya düşürür (**tahmin**).
4. **Oturum açma ağır:** 6 Mongo işlemi ve ~7 ms CPU. 130 yeni kullanıcı 20 sn'de gelince giriş isteği p95 ~5 sn oldu. Büyük bir kampanya sonrası kayıt dalgası bu noktada yavaşlar; ilk açılış ekranında "yükleniyor" sabrı gerekir.
5. **Uygulama açılışı ~7 istek / ~17 Mongo işlemi.** Tek "açılış" uç noktasında birleştirmek işlem sayısını düşürmez ama istek/bağlantı yükünü azaltır; şu an öncelik değil.

## 9. Yük altında bulunan hatalar

1. **POST isteklerinin ~%0.1-0.4'ü düşüyordu (DÜZELTİLDİ).** Node'un HTTP sunucusu boşta kalan bağlantıyı 5 sn sonra kapatıyor; istemci (veya Render'ın ara proxy'si) tam o anda bağlantıyı yeniden kullanınca POST `EOF` ile düşüyordu (GET'ler otomatik yeniden denendiği için görünmüyordu). Tüm hatalar `POST /v1/dhikr-logs` ve `/v1/ai/recommendations` idi (176 olay). Düzeltme: `apps/api/src/main.ts` içinde `keepAliveTimeout = 65 sn`, `headersTimeout = 66 sn`. Doğrulama: aynı yük (150 VU, 3.5 dk) sonrası **0 hatalı istek** (öncesi aynı yükte %0.10). Birim testleri yeşil (62 suite / 683 test). Render'ın prod'da yaşadığı sporadik 502'lerin olası bir sebebi de budur (**tahmin**).
2. **Eşzamanlı vird aktifleştirmede iki yarışan isteğin ikisi de geri alınabiliyor (hata değil, belgelenmiş tasarım).** Sınır (ücretsiz: en fazla 1 aktif program) hiçbir zaman aşılmadı (bölüm 10). Yalnızca iki *farklı* programın milisaniye içinde aynı anda aktifleştirilmesi durumunda 0 aktif kalabiliyor (Starter konteynerde %6, hızlı Mac'te çoğu). Gerçek kullanıcı bunu yapmaz; bir şey yapılmadı.
3. **Aşırı yükte istekler reddedilmiyor, kuyrukta bekliyor.** 300-500 VU'da p95 13-22 sn'ye çıkıyor ve bazıları 60 sn'de zaman aşımına uğruyor, 503 dönmüyor. Çözüm gerekmiyor, ama mobil istemci zaman aşımlarının buna göre ayarlı olması iyi olur.

## 10. Veri doğruluğu doğrulayıcıları

Starter konteyneri veritabanı (`zikir_load`) ve Mac veritabanı (`zikir_load_native`) üzerinde, tüm koşulardan sonra çalıştırıldı. Komutlar: `node apps/api/load/verify-{circle,credits,vird,logs,streaks}.mjs`.

| Doğrulayıcı | Kontrol | Starter DB | Mac DB |
|---|---|---|---|
| verify-circle | Halka `totalCount` = üyelerin son (en yüksek) sayımlarının toplamı; üye başına tek log; üye dışı log yok | **PASS** totalCount = Σ = 112.625; 151 katkı veren üye | **PASS** 78.573 = 78.573; 150 üye |
| verify-credits | Bakiye hiç negatif değil; bakiye = hibeler - borçlar = ledger toplamı; tekrar eden flowId bir kez ücretlendi; her başarılı öneri tam 1 borç | **PASS** 1.657 cüzdan, 2.224 ledger satırı, 405 borçlu kullanıcı; negatif 0, uyumsuz 0, çift flowId 0, öneri/borç uyumsuz 0 | **PASS** 800 cüzdan, 921 satır; hepsi 0 |
| verify-vird | Kullanıcı başına en fazla 1 aktif vird programı | **PASS** 377 aktif programlı kullanıcı, 804 program; >1 aktif: 0 | **PASS** 14 / 241 program; 0 |
| verify-logs | (kullanıcı, zikir, tarih, vird dilimi, halka) için yinelenen log yok | **PASS** 107.275 log; yinelenen 0; negatif 0 | **PASS** 103.515 log; 0 |
| verify-streaks | Seri belgeleri log günleriyle tutarlı (kural: sayımı > 0 olan gün sayılır): toplam gün, son aktif gün, son tamamlanan gün, mevcut ve en uzun seri | **PASS** 1.746 kullanıcı kontrol, seri belgesi eksik 0, tutarsız 0 | **PASS** 950 kullanıcı; 0 |

Doğrulayıcıların hata yakaladığı kontrol edildi: bir cüzdan bakiyesi elle +1 yapılınca `verify-credits` FAIL verdi (sonra geri alındı).

Kapsam dışı: doğrulayıcılar yalnızca k6 kullanıcılarını (`@k6.local`) kontrol eder; 5.000 arka plan kullanıcısı hariçtir (log yinelenme kontrolü hepsini kapsar).

## 11. Öneriler

1. **Atlas M0 → Flex'e geçişi (planlanan gece geçişi) bu rapora göre doğru ve acil.** M0 yaklaşık 70-75 eşzamanlı kullanıcıda doluyor; tipik bir günde ~3 bin DAU, Kandil gecesi 1-2 bin DAU. Flex (500 işlem/sn) Starter'ın üretebildiği en yüksek Mongo yükünün (~260 işlem/sn) neredeyse 2 katı.
2. **Render Starter'ı Standard'a (1 CPU) alma zamanı:** eşzamanlı kullanıcı sayın **~130'a** (diz noktasının %70'i) veya günlük aktif kullanıcı **~6.000'e (tipik gün)** yaklaştığında. Belirti: tepe saatlerde `docker stats` benzeri CPU grafiği (Render metrics) %80-100 civarında dolanması ve istek süresi p95'in 1 sn'yi geçmesi. Bellek bu kararı belirlemiyor (180 MB tepe). CPU'yu ikiye katlamak, ölçülen verimle diz noktasını yaklaşık 350-400 eşzamanlı kullanıcıya taşır (**tahmin**, Standard ile ölçmedik). Birden fazla örnek açarsan cron işlerinin (ör. abonelik mutabakatı, `@Cron` 30 dk) ve socket.io ilerleme kanalının her örnekte çalışacağını unutma.
3. **Atlas M10 ihtiyacı:** Flex'in 500 işlem/sn sınırı, API tarafı en az 2 kat güçlenince (yaklaşık ~380 eşzamanlı kullanıcı, tipik gün ~15-18 bin DAU, **tahmin**) veya bir halkada ~100 üye aynı anda aktifken dolar. Ondan önce M10 gerekmez. Daha önce ele alınması gereken: yukarıdaki sıcak noktalar 1 ve 3 (seri hesabını azaltmak Mongo yükünü ~%25-30 düşürür, **tahmin**), böylece Flex daha uzun yeter.
4. **Ucuz iyileştirmeler (öncelik sırası):** (a) seri yeniden hesaplamayı günün ilk kaydıyla sınırla; (b) `special-days/home` için `.select` ve kısa önbellek; (c) halka katkı/yoklama aralıklarını gevşet; (d) keep-alive düzeltmesini (`main.ts`, yapıldı) deploy et.
5. **Kandil/Ramazan gecesi öncesi:** bildirim ile ani yük gelebilir (bölüm 3.4); kampanya bildirimini 10-15 dk'ya yayarak göndermek, 400 kişinin aynı 10 saniyede açmasını önler.

## 12. Bu testin kapsamadığı şeyler

AI sohbet/akış (SSE), olay günlüğü (`/v1/events`), toplu log (`/bulk`), kişisel zikirler, koleksiyonlar, push gönderimi, socket.io, gerçek AI/embedding maliyeti (AI sahte modda). Atlas M0'ın sınırı aşıldığında gerçek yavaşlama davranışı ve Render-Atlas ağ gecikmesi. Bunlar gerçek yükü bir miktar artırır; dolayısıyla bu rapor **iyimser alt sınırdır**.

## 13. Nasıl yeniden çalıştırılır

Ayrıntı: `apps/api/load/README.md`, "Prod benzeri kapasite testi". Özet (`apps/api` dizininden):

```bash
pnpm db:test && pnpm build
docker compose -f load/docker-compose.load.yml --profile install run --rm api-install   # bir kez
docker compose -f load/docker-compose.load.yml up -d api-load
export MONGODB_URI='mongodb://127.0.0.1:27018/zikir_load?directConnection=true' CONTAINER=load-api-load-1
node load/seed.mjs && node load/seed-bulk.mjs
load/run.sh breakpoint mix STAGES=25:10s,25:80s,50:10s,50:80s,100:10s,100:80s,150:10s,150:80s,200:10s,200:80s
load/run.sh circle circle-heavy STAGES=50:10s,50:80s,100:10s,100:80s
load/run.sh spike mix PRESIGN=400 STAGES=400:10s,400:60s,50:5s,50:75s
load/run.sh soak mix STAGES=130:20s,130:1200s
node load/probe-ops.mjs
for v in circle credits vird logs streaks; do node load/verify-$v.mjs; done
docker compose -f load/docker-compose.load.yml stop api-load
```
