# QA Turu Kapanış Raporu — 2026-10-06 → 2026-10-08

Amaç: uygulamanın her modülünü ve davranışını **koda göre değil davranışa göre**, gerçek backend ile (yerel NestJS + Docker Mongo; yalnız AI, RevenueCat ve Google OAuth sahte) test etmek; bulunan bug'ları düzeltmek; eşzamanlı kullanıcı yükünü ölçmek.

Kaynaklar: davranış kataloğu `docs/qa/davranis-katalogu.md` (911 davranış), kullanıcı kararları `docs/qa/kararlar.md`, yük raporu `docs/qa/yuk-raporu.md`, Detox listesi `docs/qa/detox-todo.md`.

---

## 1. Son durum — bütün katmanlar yeşil

| Katman | Sonuç |
|---|---|
| API birim (jest) | **775 / 775** |
| API e2e (gerçek Mongo, 32 suite) | **836 / 836** — 12 ardışık koşu kararlı |
| Ortak paket | 16 / 16 |
| Mobil (vitest) | **1018 / 1018** |
| Web (Playwright) | 20 / 20 |
| Detox Android (23 dosya, 6 persona yolculuğu dahil) | **143 / 144 — art arda 2 kez** (1 test bilinçli atlanıyor: API yeniden başlatma gerektiren zorunlu güncelleme) |
| Detox iOS @smoke | 8 / 8 |
| Tip kontrolü, lint | temiz |

**Davranış kataloğu:** son sayım `f460d6d`'de yapıldı (API ✅ 241→354, ❌ 158→61; Mobil/Web ✅ 140→194, ❌ 183→131; karar bekleyen 65→5). Sonraki dalgalarda kalan **61 API ❌'nin 60'ı testle kapandı** (1 ⛔), **131 mobil/web ❌'nin büyük kısmı** Detox/Playwright/vitest ile kapandı (≈12 ⛔: OS diyaloğu, widget, satın alma arayüzü, paylaşım menüsü; birkaç satır ayrı işe bağlı), kalan 5 karar soruldu ve uygulandı. Kataloğun satır satır son hali bir sonraki güncellemede işlenecek.

**Kapsam (kritik servisler, dal):** abonelik %97 · kullanıcı %96 · giriş %95 · zikir kaydı %98 · kredi %81+ · halka %90 · mobil satın alma istemcisi %99 · mobil zikir deposu %96.

---

## 2. Bulunan ve düzeltilen bug'lar (60'tan fazla — her biri önce kırmızı yanan testle)

### Güvenlik / para
- **Kendine premium:** `PATCH /v1/subscriptions/:id` ile eski kayıt "aktif, 2099" yapılıp kalıcı premium alınabiliyordu → rota kaldırıldı.
- **Oturum anahtarı:** kullanılmış refresh token tekrar kabul ediliyordu → tek kullanımlık + aile iptali + çıkışta iptal; kayıp-yanıt tekrarı 60 sn ile sınırlı (sızan eski token oturum ele geçiremez).
- **AI ücretsiz üretim açıkları:** silinen AI vird taslağıyla kredisiz program; çökme sonrası sınırsız ücretsiz ajan çalıştırma; iade yoluyla kredi basma; teslim edilmiş programın iadesi → teslim fişi + tek seferlik kurtarma + güvenli iade (property test eski kodda kredi basan karşı örnek buldu).
- **AI kötüye kullanım sınırı:** kullanıcı başı aynı anda tek AI isteği + günde 20 ücretsiz çalışma (429).
- Önce kaydet sonra kredi düş sırası (sohbet, Rehber, AI vird): eşzamanlı tükenmede bedava içerik → debit → kayıt.
- Sohbet tekrar gönderiminde çift ücret → `clientMessageId`; bağlantısı kopan sohbet yine ücretleniyordu; aynı Rehber isteği ikinci öneri yaratıyordu; kullanıcı metni loglara yazılıyordu (PII).
- Ödeme: kart sorununda premium hemen düşüyordu (grace), sırasız EXPIRATION yeni aboneliği düşürüyordu, kredi paketi iadesi işlenmiyordu, cüzdan oluşturma yarışı 500.

### Veri doğruluğu / veri kaybı
- **Bayat seri:** 5 gün zikir çekmeyen kullanıcı eski serisini görüyordu.
- **Halka:** kurucunun batısındaki üye ilk saatlerde sayımını kaybediyordu (saat dilimi); süresi dolmuş halka yanlış paywall gösteriyor/katılım kabul ediyordu; ilk veri öncesi dokunuşlar eziliyordu; çevrimdışı açılan oturum hiç göndermiyordu.
- **Kayıt:** 0 sayım tamamlanmış kaydı eziyordu; bulk uç 500 veriyordu; takvimde olmayan/gelecek tarih kabul ediliyordu; kaydetme hataları kullanıcıya hiç gösterilmiyordu; kayıt sırasındaki dokunuşlar kayboluyordu; çift dokunuş iki zikir yaratıyordu.
- **Misafir → hesap:** taşınan veri başka hesaba sızabiliyordu / tekrarlanıyordu; giriş sonrası başlık "Seri 0" kalıyordu.
- **Vird:** sıfırlama ön plana dönünce geri geliyordu; tamamlanan gün sonradan düşebiliyordu; vird serisi düşmesi gerekirken düşmüyordu.
- **Eski uygulama uyumu:** boş kişisel zikir adı Play'deki sürümün senkronunu her açılışta düşürüyordu.
- Günlük hatırlatma ayarı kaydedilmiyordu; hedef sessizce 9.999'a kırpılıyordu; Android geri tuşu dünkü sayımı silebiliyordu.

### Kullanıcı deneyimi
- Hesap silme butonları sekme çubuğunun altında kalıyordu; bildirim izni açıklamasız ilk açılışta isteniyordu; premium kullanıcıya widget'tan paywall açılıyordu; sohbet zaman aşımı yoktu / yarıda kalan mesaj askıda kalıyordu; uzun sohbette son mesajlar görünmüyordu; çift dokunuş çift kredi; 429 oturumu düşürüyordu; hesap silme hatası gösterilmiyordu.

### Altyapı
- Yük altında POST'ların %0.1–0.4'ü bağlantı hatası (Node keep-alive 5 sn) → 65 sn.
- Kararsız e2e kökü: test sunucusu yerel adrese bağlanmıyordu, emülatör portu kapıyordu.
- Commit kancası API dosyalarını yanlış lint ayarıyla denetliyordu; Mongoose deprecation log gürültüsü (~30 bin satır).

---

## 3. Kapasite (Render Starter 0.5 CPU / 512 MB benzeri Docker, ölçüm)

| | Sonuç |
|---|---|
| Genel kullanım kırılma noktası (p95 > 1 sn) | **~340 eşzamanlı aktif kullanıcı** (tur başında ~185) |
| Atlas M0 (100 işlem/sn) doluyor | **~97 eşzamanlı** → ilk darboğaz |
| Atlas Flex (500 işlem/sn) | Starter bu yüke ulaşamıyor |
| Halka (buton modeli) | M0 ~270 üye, Starter ~1.050 üye (önce ~20 / ~100) |
| Zikir kaydı maliyeti | 8 → 5 veritabanı işlemi |
| 10 dk dayanıklılık (240 eşzamanlı) | %0 hata, bellek düz, çökme yok |
| Veri doğrulayıcıları (halka toplamı, kredi, tekil vird, mükerrer log, seri) | **5/5 PASS** |

**Tahmini günlük kullanıcı (varsayımlı):** M0 ile ~4.400, Flex + Starter ile ~15.000 (rahat bölge ~10.800). Kandil gecesi gibi yoğun günlerde 3–4 kat düşük.

---

## 4. Yayın öncesi kontrol listesi

> **Sıra zorunlu: önce API, sonra mobil.** Yeni uygulama eski API ile özel günler ekranını açamaz.

1. **Deploy öncesi (salt-okur, Atlas `test` DB):**
   ```js
   db.ai_messages.countDocuments({ clientMessageId: { $type: "string" } })   // 0
   db.ai_recommendations.aggregate([{$match:{flowId:{$type:"string"}}},{$group:{_id:{u:"$userId",f:"$flowId"},n:{$sum:1}}},{$match:{n:{$gt:1}}},{$count:"dups"}])  // boş
   db.ai_credit_ledger.aggregate([{$match:{reason:"REFUND",providerEventId:{$type:"string"}}},{$group:{_id:"$providerEventId",n:{$sum:1}}},{$match:{n:{$gt:1}}},{$count:"dups"}])  // boş
   db.ai_credit_wallets.aggregate([{$group:{_id:"$userId",n:{$sum:1}}},{$match:{n:{$gt:1}}},{$count:"dups"}])  // boş
   ```
   Render servisi Starter'da (self-ping cron kaldırıldı). **Yeni ortam değişkeni gerekmiyor.**
2. **Atlas Flex geçişi** (planlandı, gece; ~10 dk kesinti) — API deploy'undan önce ya da ayrı bir gecede.
3. **`git push` → Render API deploy.** Hemen: `/health` mongo=up; gerçek cihazda **build 102** ile oturum düşmüyor mu, Zikirlerim senkronu, halka, istatistik, AI sohbet.
4. **24–48 saat izleme (Better Stack):** `/v1/auth/refresh` 401 oranı, kayıt/vird 400'leri, AI 429'lar, açılışta "Index build failed"/E11000.
5. **Mobil build 103+** (API canlıyken) — Play'e gönderim.
6. **Benimseme sonrası:** istenirse `APP_MIN_VERSION=103` ile zorunlu güncelleme.
7. Geri alma: API eski haline dönebilir (refresh token'lar uyumlu); ama mobil 103 yayındayken API'yi geri almak özel günler ekranını bozar.

---

## 5. Açık kalanlar / ayrı işler

- **Ayrı iş (karar):** M-16 satın alımları geri yükle · M-17 girişten sonra eylemin devamı · M-18 misafir aktarım uyarı bandı · M-20 çevrimdışı kayıt kuyruğu (veri kaybını önler — öncelikli).
- **Bilinçli kalan küçük riskler:** sohbet cevabını okuyup akış bitmeden kopan kullanıcı ücretlenmiyor (günlük 20 sınırı içinde); 60 sn'den uzun ağ kopukluğu yaşayan cihaz yeniden giriş yapar; deploy öncesi süresi dolarak kapanmış eski halkalar geç katkıyı reddeder.
- **Öneri:** mobil `x-app-version` başlığı göndersin (ileride sürüme bağlı uyumluluk için); genel istek sınırlayıcı (throttler) büyümeyle birlikte.
- **Otomatikleşemeyenler (elle kontrol):** satın alma arayüzü (lisans test hesabı), işletim sistemi izin diyalogları, widget, paylaşım menüsü, ses.

---

## 6. Testleri yeniden çalıştırma

```bash
pnpm db:test                       # Docker Mongo (27018)
pnpm test                          # birim (API + mobil + ortak)
pnpm test:e2e                      # API e2e (gerçek Mongo) — pre-push'ta da koşar
pnpm test:web                      # Playwright
pnpm test:full                     # hepsi + Detox Android
pnpm --filter @zikirmatik/mobile test:detox:ios:smoke
# Yük: apps/api/load/README.md "Prod benzeri kapasite testi"
```
