# Davranış Kataloğu — Zikirmatik (API + Mobil + Web)

> 2026-10-06 · QA turunun tek spesifikasyonu. Testler koddan değil bu dosyadan yazılır.
> Soru numaraları: **A-NN** = API soruları, **M-NN** = mobil/web soruları (her bölümün sonundaki listede).
> Bölüm 1: API (479 satır) · Bölüm 2: Mobil + Web (432 satır).

## Özet — QA turu sonrası durum (2026-10-07)

| Kapsam | ✅ kanıtlı | 🟡 kısmi | ❌ test yok | ⛔ otomatikleştirilemez | ❓ karar bekliyor | Toplam |
|---|---|---|---|---|---|---|
| API (479 satır) | 241 → **354** | 49 → **60** | 158 → **61** | 0 → **4** | 31 → **0** | 479 |
| Mobil + Web (432 satır) | 140 → **194** | 75 → **100** | 183 → **131** | 0 → **2** | 34 → **5** | 432 |

Notlar: sayım yalnız ID'li satırlardan (API-*, MOB-*, WEB-*). §25 yetki matrisi ve §26 doğrulama sınırları tabloları ID'sizdir; hücreleri güncellendi ama toplamlara girmez. Karar kaynağı: `docs/qa/kararlar.md`. Detox akışları: `apps/mobile/e2e/01..14`; ücretsiz/premium/AI hata modları `docs/qa/detox-todo.md`.

### Hâlâ ❓ (karar eksik — kararlar.md'de karşılığı yok)

- **MOB-SAY-32** — V: elle girilen sayı (setSelectedCount) / misafir / ömür boyu sayaca sayılır mı
- **MOB-VRD-25** — V: şablon rafı / ücretsiz hesap / klasik şablonlar rozetsiz; Ramazan/Esma/Kandil yolculukları "Premium" rozetl…
- **MOB-VSE-12** — V: öğe sıfırlanır / X'ten önce ön plana dönülür / sıfırlama geri alınmamalı
- **MOB-PRM-11** — V: teklif koşulu, kullanıcı başka sekmede / ön plana dönünce / teklif yalnız ana sekmede açılmalı
- **WEB-17** — V: halka sayfası / kaynak / sitemap'te YOK, noindex; canonical ana sayfaya işaret etmemeli

### ⛔ Otomatikleştirilemeyen satırlar

- **API-APP-07** — ⛔ özellik kaldırıldı (ae2dda2)
- **API-APP-08** — ⛔ özellik kaldırıldı (ae2dda2)
- **API-AIR-26** — ⛔ LLM çıktı kalitesi — eval:rehber kapsamı, CI dışı
- **API-CHT-24** — ⛔ LLM çıktı kalitesi — eval kapsamı, CI dışı
- **MOB-VRD-19** — ⛔ satın alma mağaza arayüzü (B-22 kodla düzeltildi, yalnız elle)
- **MOB-PRM-14** — ⛔ Play abonelik sayfası harici uygulama (mağaza UI)

### Ayrı iş (QA turu dışı — kararlar.md "Ayrı iş")
- **M-16** Satın alımları geri yükle düğmesi.
- **M-17** Girişten sonra tetikleyen eylemin (AI gönder, halkaya katıl) devam etmesi (MOB-GIR-13).
- **M-18** Misafir verisi aktarılamazsa uyarı bandı (MOB-GIR-18).
- **M-20** Çevrimdışı kayıt kuyruğu, ayrı işler içinde öncelikli (MOB-HID-09, MOB-VSE-10).
- **A-01 ek** Kurucunun elle kapattığı halka geç katkıyı reddeder (not: kod ve test zaten var, T/race:483, U/circles.service:906; CIR-32/CIR-38 ✅).
- **B-11** Bildirim izni için uygulama içi açıklama kartı (e3756e1 ile uygulandı, MOB-BLD-05 ✅).
- **MOB-AIR-04** AI Rehber boş girdide Gönder pasif (uygulandı, e2e/09 + intent-input testi, ✅).

### Kalan ❌ satırlar (test yok)

**API (61)**

- API-APP-09 — V: prod, kritik secret eksik veya AUTH_ALLOW_INSECURE_TEST_TOKENS=1; O: açılış; Z: süreç DURMAZ, boot.insecure…
- API-APP-11 — O: bilinmeyen rota; Z: 404 + requestId
- API-AUTH-05 — V: idToken boş veya yalnız boşluk; Z: 400
- API-AUTH-08 — V: Google token aud GOOGLE_CLIENT_IDS dışı / iss yanlış / exp geçmiş / tokeninfo 4xx; Z: 401. GOOGLE_CLIENT_ID…
- API-AUTH-09 — V: Apple token kid bulunamaz / imza geçersiz / iss / aud / exp hatalı; Z: 401. Apple JWKS 1 saat önbellekte
- API-AUTH-10 — V: e-postası aynı iki sağlayıcı (Google sonra Apple); O: ikinci giriş; Z: aynı kullanıcıya bağlanır (e-postaya…
- API-AUTH-22 — V: girişte verilen deviceId hiç register edilmemiş; Z: giriş başarılı, cihaz oluşturulmaz (bağlama sessizce at…
- API-USR-10 — Aynı token ile ikinci DELETE → hata yok (idempotent)
- API-USR-11 — Silme sonrası aynı Google hesabıyla giriş → yeni kullanıcı, isNewUser:true, eski veri yok
- API-USR-12 — Silme sırasında bir koleksiyon hatası → kullanıcı belgesi kalır, işlem tekrar denenebilir (kısmi silme sonrası…
- API-DHK-02 — GET /v1/dhikrs filtresiz → inaktif/doğrulanmamış zikirler de döner (yalnız verified-active süzer)
- API-DHK-06 — Hiçbir okuma yanıtında embedding vektörü dönmez
- API-DHK-10 — PATCH: embedding kaynak metni değişince vektör yenilenir, değişmezse yeniden embed yok
- API-DHK-11 — PATCH/DELETE bilinmeyen id → 404
- API-DHK-12 — V: halkanın/vird'in zikri silindi; O: halka detayı; Z: 500 değil, zikir anlık görüntüsü boş adla döner
- API-LOG-23 — Bulk içinde dhikrId'siz (özel zikir) öğe → 400
- API-LOG-32 — Silinmiş kullanıcının hâlâ geçerli token'ıyla POST → 404 (yetim log oluşmaz)
- API-STR-18 — Vird günü sonradan tamamlanmamışa dönerse (daha düşük sayı) vird serisi de düşmeli (şu an yalnız tamamlanınca …
- API-STA-15 — Top zikir etiketi: karar A-21 zikrin iki dilli adı dönmeli; kod hâlâ yalnız name.tr döndürüyor (uygulanmadı)
- API-AIR-17 — Yalnız isVerified && isActive zikirler önerilir (ikinci DB kapısı)
- API-AIR-22 — Seçim tekrarlanırsa selectionCount yine artar, selectedDhikrId üzerine yazılır
- API-AIR-25 — Kullanıcı silinmiş → 404, kredi işlemi yok
- API-CRD-15 — AI_CREDIT_TOPUP_PRODUCTS env (JSON veya sku:miktar csv) varsayılan kataloğu ezer
- API-CRD-17 — Kesimde cüzdan güncellemesi fırlarsa ledger satırı telafi olarak silinir (yetim kesim yok)
- API-CRD-18 — Grant uygulanırken eşzamanlı topup → bakiye bir sonraki okumada grant+topup'a düzelir (kalıcı kayıp yok)
- API-AIV-05 — Aynı flowId farklı süre/dilim/vakit/metin → 403
- API-AIV-06 — Taslak silindikten (veya 7 gün TTL'den) sonra aynı flowId → yeni program ÜCRETSİZ üretilir (kredi kaydı var, t…
- API-AIV-08 — Dil: gövde locale > Accept-Language > tr
- API-AIV-11 — AI taslağı 7 gün sonra silinir (manuel/şablon 30 gün)
- API-AIV-13 — Başlık tek dilde üretilir, title.tr = title.en
- API-AIV-15 — Aynı flowId iki eşzamanlı istek → tek taslak (unique ai.flowId + yeniden okuma)
- API-AIV-16 — startDate = isteğin saat dilimindeki bugün
- API-WA-04 — AI Vird ucu socketId almaz (alan elenir)
- API-CHT-08 — Atıf kartı en fazla 3 kaynak
- API-CHT-12 — Dil: gövde locale > Accept-Language > tr; sonraki mesajlar konuşmanın kayıtlı dilini kullanır
- API-CHT-13 — Bağlam penceresi son 10 mesaj
- API-CHT-19 — SSE: beklenmeyen hata → code:'INTERNAL', gerçek neden sızmaz
- API-SPD-10 — isActive:false kayıt home'da görünmez
- API-SUB-15 — sync-user: RC aktif ama DB'de aktif kayıt yok → isPremium false kalır (sync kayıt yaratmaz)
- API-WHK-18 — purchased_at_ms yoksa başlangıç = şimdi
- API-UDH-06 — POST upsert gönderilmeyen alanları sıfırlar (isFavorite:false, target:0)
- API-UDH-08 — PATCH name:'' → boş ad kabul ediliyor
- API-UDH-09 — Kullanıcı başına kayıt sayısı sınırsız
- API-COL-05 — Detay inaktif/doğrulanmamış zikirleri de döndürür
- API-COL-06 — Hiçbir koleksiyonda premium kilidi yok
- API-EVT-06 — Olaylar 180 gün sonra silinir (TTL)
- API-PSH-11 — Token'sız aday → noToken
- API-PSH-20 — Halka push'ları (tamamlanma/katılım) kampanya günlük tavanına tabi değil
- API-PSH-22 — push_dispatches 30 gün sonra silinir
- API-VRD-16 — Manuel startDate yok → 400
- API-VRD-18 — clientId yoksa sunucu srv-… üretir; iki clientId'siz program çakışmaz
- API-VRD-22 — Aynı programa çift activate (eşzamanlı) → ikisi de aktif programı döner
- API-VRD-25 — PATCH paused/completed/archived → expiresAt temizlenir; aktif → draft dönüşünde silinme süresi yeniden kurulma…
- API-VRD-29 — Aynı dilimde aynı zikir tekrarı → ilki tutulur
- API-VRD-33 — Manuel/şablon taslak 30 gün sonra silinir
- API-VPR-12 — Vird logu son yazan kazanır; daha düşük sayı günü tamamlanmamışa çevirebilir
- API-VPR-13 — Draft/paused/completed programa yazılan vird logu ilerleme ve vird serisi üretir
- API-CIR-03 — Ücretsiz: önceki halka completed/closed ise yeni halka kurabilir
- API-CIR-51 — Kurucu premium'u kaybederse halka ve memberLimit sürer (karar A-07)
- API-YTK-05 — Throttler yok: aynı uca sınırsız istek kabul edilir (bilinen durum; kod tahmini 32^8)
- API-DIL-04 — Diğer tüm sunucu hata mesajları Türkçe; istemci code alanına göre yerelleştirir (yalnız eyleme dönük hatalarda…

**Mobil + Web (131)**

- MOB-GIR-07 — V: iOS / auth ekranı / Apple düğmesi görünür; Android'de görünmez
- MOB-GIR-08 — V: auth ekranı geri gidilebilir durumda / X'e basınca / önceki ekrana döner; geri gidilemiyorsa X gizli
- MOB-GIR-09 — V: kullanıcı giriş akışını iptal eder / olunca / "Giriş işlemi iptal edildi." görünür, misafir kalır
- MOB-GIR-10 — V: sağlayıcı kesintisi (AUTH_SIMULATE_PROVIDER_OUTAGE) / giriş olunca / "Kimlik sağlayıcısına ulaşılamıyor" ha…
- MOB-GIR-12 — V: misafir AI/halka/premium eylemine basar / olunca / "Bu özellik için üye olun" modalı; "Üye ol" → auth, "Vaz…
- MOB-GIR-13 — V: modal üzerinden giriş yapıldı / olunca / tetikleyen eylem devam eder (karar M-17: ayrı iş)
- MOB-TUR-01 — V: tur tamamlanmamış / ana sekme odaklanınca (~600 ms) / 9 adımlı tur açılır
- MOB-TUR-02 — V: tur açık / "İleri" × 8 + "Bitir" olunca / tur kapanır, tamamlandı kalıcı, yeniden açılışta tekrar gelmez
- MOB-TUR-03 — V: tur açık / "Atla" veya Android geri olunca / tur tamamlanmış sayılır
- MOB-TUR-05 — V: Profil → "Uygulamayı Tanıt" / olunca / ana sayfaya gider ve tur yeniden başlar
- MOB-TUR-07 — V: tur sırasında sayaç demo dokunuşu / olunca / log yazılmaz
- MOB-SAY-05 — V: aynı gün aynı hedefe ikinci kez ulaşılır (sıfırla → tekrar) / olunca / ikinci otomatik kayıt yok; kayıt baş…
- MOB-SAY-06 — V: misafir seçili zikir / hedefe ulaşınca / otomatik kayıt yok, ilerleme yerelde kalır
- MOB-SAY-07 — V: serbest mod hedefli / hedefe ulaşınca / ad isteyen kaydet sayfası hedef dolu açılır (gün+hedef başına bir k…
- MOB-SAY-11 — V: tur boyu "Özel" / 4 haneden fazla veya 0 / kabul edilmez
- MOB-SAY-13 — V: "herhangi bir yere dokun" kapalı (varsayılan) / kart dışına dokunuş / sayılmaz; açıkken sayılır
- MOB-SAY-14 — V: her yere dokun açık / uygulama yeniden açılınca / tercih korunur; açılışta toast tekrar gösterilmez
- MOB-SAY-17 — V: sayım 50 / hedef 40 girilince / "Sayım kırpılacak" modalı; "Yine de uygula" → 40, vazgeç → 50
- MOB-SAY-18 — V: hedef modalı / boş veya 0 / seçili zikirde değişiklik yok, serbest modda hedef sınırsıza döner
- MOB-SAY-19 — V: hedef girişi / 5 haneli / en fazla 4 hane kabul
- MOB-SAY-20 — V: ücretsiz kullanıcı / tesbih görünümü seçili / halka sayacı çalışır + kilit şeridi, şeride dokununca premium…
- MOB-SAY-26 — V: ses paketi "tık" ücretsiz kullanıcıda / dokunuş / ses çalmaz; premiumda çalar
- MOB-SAY-28 — V: sayım 7 / uygulama öldürülüp açılınca / 7 korunur
- MOB-SAY-29 — V: 20 hızlı dokunuş (≤100 ms aralık) / olunca / tam 20 sayılır, kayıp yok
- MOB-KAY-20 — V: koleksiyondan "Sayaca Ekle", ilerleme var / olunca / devam/sıfırdan modalı, sonra ana sayfa
- MOB-HID-08 — V: giriş sonrası misafir taşıması bekliyor / hidrasyon / taşıma bitene kadar beklenir
- MOB-HID-09 — V: Android uçak modu, üye / 5 dokunuş + kaydet → uçak modu kapat / olunca / kayıt otomatik gönderilir (çevrimd…
- MOB-HID-10 — V: uçak modu / uygulama açılınca / çökme yok, yerel sayaç çalışır, ağ isteyen ekranlar hata kutusu gösterir
- MOB-HID-12 — V: cihaz saat dilimi New York / kaydet / log date yerel gün anahtarıyla, sunucu serisi aynı günü sayar
- MOB-ROZ-08 — V: kuyrukta rozet / gösterilmeden uygulama öldürülür / yeniden açılışta yine gösterilir
- MOB-IST-02 — V: kilitli bölüm / "Premium ile aç" / premium sayfası
- MOB-IST-03 — V: premium hesap / İstatistik / tüm bölümler açık
- MOB-IST-04 — V: premium alındı (seed) / ekrana dönünce / kilit kalkar (sorgu yenilenir)
- MOB-IST-07 — V: üye, sunucu hata + veri yok / olunca / "Tekrar dene" çalışır
- MOB-KOL-01 — V: Daha Fazla → Koleksiyonlar / açılınca / kartlar + kategori çipleri (Tümü, Günlük, Namaz, …)
- MOB-KOL-02 — V: kategori çipi / seçilince / yalnız o kategori
- MOB-KOL-03 — V: koleksiyon detayı, misafir / "Sayaca Ekle" / ana sayfada o zikir seçili, sayım 0, hedef = önerilen
- MOB-KOL-04 — V: üye, serbest modda sayım var / "Sayaca Ekle" → "Kaydet ve devam" / ad sayfası açılır (giriş hatası verilmez…
- MOB-KOL-05 — V: koleksiyon tamamen ücretsiz / ücretsiz hesap / hiçbir koleksiyonda kilit yok
- MOB-KOL-06 — V: ağ yok / Koleksiyonlar / "Koleksiyonlar yüklenemedi."
- MOB-ZKR-01 — V: Zikirlerim / filtre Tümü/Aktif/Tamamlanan/Favoriler / aktif = hedef yok veya current<hedef, tamamlanan = cu…
- MOB-ZKR-02 — V: "Yeni Zikir" / ad boş / Kaydet pasif
- MOB-ZKR-03 — V: yeni zikir hedef "0" / kaydedince / sınırsız hedef
- MOB-ZKR-04 — V: yeni zikir hedef 99999 / kaydedince / yerel ve sunucu aynı değeri tutar (kıskaç tutarlı)
- MOB-ZKR-05 — V: üye yeni zikir / API hatası / geri alınır + hata
- MOB-ZKR-06 — V: ana sayaçta kaydedilmemiş ilerleme / Zikirlerim'de yeni zikir oluşturulunca / sayaç sessizce değişmemeli
- MOB-ZKR-07 — V: kişisel zikir / "Güncelle" / ad, okunuş, anlam, hedef değişir; API hatasında geri alınır
- MOB-ZKR-08 — V: kişisel zikir / "Sil" → onay / listeden kalkar, sunucuda zikir + logları silinir; katalog zikrinde yalnız i…
- MOB-ZKR-09 — V: silme API hatası / olunca / hata görünür, öğe kalır
- MOB-ZKR-10 — V: "Favoriye Ekle" / basınca / Favoriler filtresinde; üye API hatasında geri alınır
- MOB-ZKR-11 — V: "Başlat" / serbest modda sayım var / kaydedilmemiş uyarısı çıkar
- MOB-ZKR-12 — V: "Başlat" / olunca / ana sayfa, zikir seçili, üyede son log sayısı
- MOB-ZKR-13 — V: misafir / Zikirlerim / kişisel + sayımı >0 katalog zikirleri; üye log alınamazsa yalnız kişiseller
- MOB-ZKR-14 — V: ana sayfa Esma listesi, ağ yok / Esma'ya basınca / "Esma zikri bulunamadı" görünür (sessiz değil)
- MOB-ESM-06 — V: kaydedilmemiş zikir / bildirim izni modalı açık / karşılama ertelenir
- MOB-VRD-02 — V: misafir / hub / "Misafir modundasın — bu cihazda saklanır" ipucu
- MOB-VRD-05 — V: editör / hiç zikir yok / "En az bir dilime bir zikir eklemelisin."
- MOB-VRD-12 — V: misafir / "Kaydet ve başlat" / yerel aktif program, hub kartı
- MOB-VRD-13 — V: "Kaydet ve başlat"a çift dokunuş / olunca / tek program
- MOB-VRD-20 — V: çakışma / "Taslak olarak bırak" veya geri / hub, "Taslak olarak kaydedildi"
- MOB-VRD-21 — V: misafir yerel 1 aktif / ikinci yerel program / istemci tarafı aynı çakışma kuralı; premiumda yok
- MOB-VRD-28 — V: şablon listesi yüklenemedi / raf / hata + tekrar dene
- MOB-VSE-02 — V: seans / hedefe ulaşınca / sayım hedefte durur, otomatik geçiş YOK
- MOB-VSE-08 — V: seans ortası / X / ilerleme sunucuya yazılır, kart günceldir
- MOB-VSE-09 — V: seans ortası / uygulama arka plana → öldür → aç / ilerleme kalıcı, seans kaldığı yerden
- MOB-VSE-10 — V: uçak modu / seans + X / yerel ilerleme korunur; ağ gelince sonraki tetikte gönderilir
- MOB-VSE-11 — V: misafir / seans / yalnız yerel; ağ isteği yok
- MOB-VSE-13 — V: /vird/session parametresiz/geçersiz program / açılınca / ana sayfaya yönlenir, çökme yok
- MOB-VHT-01 — V: ücretsiz / hatırlatma kartı / toggle yok, tek "Premium ile aç"
- MOB-VHT-03 — V: premium / aç → izin reddedilir / toggle kapalı kalır
- MOB-VHT-05 — V: "Konumu kullan" reddedilir / olunca / sessizce sabit saat kalır
- MOB-VAI-01 — V: misafir / "AI ile oluştur" / üye ol modalı
- MOB-VAI-04 — V: dilim seçilmedi / olunca / "En az bir dilim seçmelisin.", düğme pasif
- MOB-HAL-01 — V: misafir / ana sayfa halka kartı → hub / "giriş yapmalısın" ipucu, liste yok; "Yeni halka" → üye ol modalı
- MOB-HAL-05 — V: oluştur / zikir seçilmedi / "Lütfen bir zikir seç."
- MOB-HAL-06 — V: hedef 0, 10.000.001, harf / gönder / "Hedef 1 ile 10.000.000 arasında…"; 1 ve 10.000.000 kabul
- MOB-HAL-07 — V: süre çipleri / varsayılan 30 gün, hedef 1000 / 7/30/40/Süresiz seçilebilir, bitiş = bugün+N
- MOB-HAL-08 — V: ad boş / oluştur / halka adı = zikir adı
- MOB-HAL-15 — V: soğuk derin bağlantı zikirmatik://circle/join?code=KOD, misafir / Katıl / üye ol modalı; giriş sonrası katı…
- MOB-HAL-19 — V: detay açık / başka üye API ile sayar / ≤15 sn içinde toplam ve "Bugün N/M üye katıldı" güncellenir
- MOB-HAL-26 — V: oturum / arka plana alınınca / bekleyen sayım hemen gönderilir
- MOB-HAL-31 — V: kurucu / "Kapat" → onay / durum kapalı, sayaç kilitli; kurucu olmayan "Kapat" görmez
- MOB-HAL-34 — V: ana sayfa, aktif halka var / kart / "Devam et" → oturum, ayrı "Halkaya git" → hub (ikinci halka → paywall y…
- MOB-HAL-38 — V: EN dil / misafir üye satırı / "Guest" (TR sabit metne bağlı değil)
- MOB-AIR-02 — V: misafir / gönder / üye ol modalı, istek yok
- MOB-AIR-03 — V: öneri çipi ("İçim sıkıldı") / basınca / girdiye yazar, otomatik göndermez
- MOB-AIR-09 — V: konu dışı yanıt (mock) / olunca / kırmızı "Konu dışı", sonuç ve girdi temizlenir
- MOB-AIR-18 — V: özel gün detayı "AI Rehber ile öneri al" / olunca / Rehber sekmesi, girdi "<ad> için hangi zikirleri…" dolu…
- MOB-AIM-09 — V: 25 konuşma / sohbet ekranı / 3 görünür, "Tümünü Göster" 20'ye kadar, "Daha Az Göster"
- MOB-AIM-10 — V: eski konuşma / açılınca / son 50 mesaj; yeni sohbet temizler
- MOB-AIM-11 — V: akış sürerken başka konuşma açılır / olunca / token'lar diğer konuşmaya karışmaz
- MOB-AIM-13 — V: misafir / sohbet girişi / üye ol modalı
- MOB-KRD-01 — V: ücretsiz üye / kredi rozeti / sunucu bakiyesi (günlük 1 + kayıt bonusu); dokununca premium sayfası
- MOB-KRD-05 — V: kredi yükleniyor / gönder / "Kredilerin yükleniyor; birkaç saniye içinde…"
- MOB-PRM-03 — V: Android / sayfa açık / geri tuşu sayfayı kapatır, ekrandan çıkmaz
- MOB-PRM-04 — V: misafir / "Hemen Başla" / üye ol modalı
- MOB-PRM-05 — V: misafir / sayfa / fiyatsız plan etiketleri, kredi paketleri yok
- MOB-PRM-06 — V: satın alma başarılı, sync-user gecikmeli false / olunca / kullanıcıya "işleniyor" bilgisi; sessiz kalmaz
- MOB-PRM-12 — V: rozet modalı açık / teklif / bekler, üst üste binmez
- MOB-PRM-13 — V: widget "Premium ›" derin bağlantısı (?paywall=1&src=widget), soğuk açılış / olunca / ücretsizde sayfa açılı…
- MOB-OZG-02 — V: bugün özel gün / sekme / "BUGÜN" rozeti + "İncele" kartı
- MOB-OZG-05 — V: ağ yok / sekme / hata kutusu; çekip yenileme çalışır
- MOB-OZG-06 — V: dil değişti / detay açık / içerik yeni dilde yenilenmeli
- MOB-BLD-09 — V: misafir anahtar açık + saat 07:30 / uygulama yeniden açılınca / anahtar açık, saat 07:30, günlük hatırlatma…
- MOB-BLD-21 — V: dil EN'e geçer / olunca / zaten kurulu günlük/seri/Cuma/vird bildirimleri İngilizce metinle yeniden kurulur
- MOB-AYR-03 — V: dil seçildi / cihaz dili sonra değişir / saklı seçim kazanır
- MOB-AYR-04 — V: kaydedilmemiş sayım / dil değiştirilir / sayım ve seçili zikir korunur, ad yeni dilde
- MOB-AYR-07 — V: EN arayüz / tüm ana ekranlar / sabit Türkçe metin yok (~20 bilinen site)
- MOB-AYR-08 — V: ücretsiz / tema seçici / 8 ücretsiz tema seçilip kaydedilir; 13 premium tema önizlenir, kaydet → premium sa…
- MOB-AYR-11 — V: yazı tipi seçici / değiştirince / "Değişiklikleri Kaydet" görünür, kaydedince uygulanır
- MOB-AYR-13 — V: ücretsiz / tık sesi "Tık" seçilince / premium sayfası
- MOB-AYR-14 — V: titreşim deseni değişir, üye / olunca / sunucuya yazılır, hata → geri alınır
- MOB-AYR-15 — V: "Geri Bildirim Gönder", e-posta uygulaması yok / olunca / "E-posta uygulaması açılamadı" modalı
- MOB-SYM-02 — V: min sürüm ≤ build, boş, sayı değil / olunca / modal yok
- MOB-SYM-06 — V: render hatası / olunca / "Bir şeyler ters gitti" + "Tekrar dene"
- MOB-SYM-07 — V: bilinmeyen derin bağlantı (zikirmatik://xyz) / olunca / "Sayfa bulunamadı" + "Ana sayfaya dön"
- MOB-SYM-08 — V: ikinci şema zikirmatikasistan://circle/join?code=… / olunca / aynı katıl ekranı
- MOB-WDG-11 — V: soğuk açılış widget "Devam et" derin bağlantısı / olunca / router çökmesi yok, seans açılır
- MOB-WDG-12 — V: uygulamada sayım / arka plana alınınca / widget ≤ birkaç sn içinde güncel (30 dk beklemeden)
- MOB-WDG-14 — V: seri ≥3 veya vird günü tamam, widget yok, Android / ana sayfa / "Serini ana ekranında gör" kartı; kapatınca…
- WEB-06 — V: EN yasal sayfalar /en/terms, /en/refund-policy / açılınca / 200 + lang="en" + h1 dolu
- WEB-09 — V: TR footer / bakılınca / /delete-account, /privacy, /terms linkleri var (Play politika gereği silme sayfası …
- WEB-12 — V: yasak karakterli 8 hane (/halka/ABCDEFG0, …I, …O, …1) / istenince / 404 (mobil parseCircleCode ile aynı alf…
- WEB-13 — V: 7 ve 9 haneli kod / istenince / 404
- WEB-15 — V: halka sayfası / "Uygulamada aç" / href = zikirmatik://circle/join?code=KOD (uygulamanın scheme listesinde v…
- WEB-16 — V: halka sayfası / "Google Play'den indir" / href = Play paket URL'si
- WEB-21 — V: herhangi bir sayfa / dil düğmesine (TR/EN) basınca / aynı yolun diğer dil sürümüne gider (/privacy ↔ /en/pr…
- WEB-22 — V: Accept-Language: en ile / / istenince / yine TR (localeDetection kapalı)
- WEB-23 — V: bilinmeyen yol /xyz ve /de/privacy / istenince / 404
- WEB-24 — V: premium tablosu / bakılınca / limitler koddakiyle aynı (vird 1→10, halka 1/5 → 10/200, tema 8/22, kredi 1/g…
- WEB-25 — V: her sayfa / bakılınca / OG og:locale tr_TR / en_US, canonical doğru (/ vs /en)

---


## Bölüm 1 — Davranış Kataloğu — API (apps/api)

> Tarih: 2026-10-06 · Kapsam: NestJS API'nin tüm modülleri · Durum: taslak, ❓ satırları kullanıcı cevabı bekliyor.

### Amaç

Bu dosya API'nin **ne yapması gerektiğini** davranış olarak listeler: kurallar, normal akışlar, uç durumlar.
Testler koddan değil bu katalogdan yazılır; kod bir satırla çelişirse önce satır mı kod mu yanlış, ona karar verilir.
Kaynak sırası: hafıza dosyaları ve `docs/` (ürün kuralı) → kod (rota, hata kodu, limit). Hafıza ile kod çeliştiğinde satır ❓ işaretlenir ve en altta listelenir.

### Gösterim

- **Davranış:** `V:` verilen (ön koşul) · `O:` olunca (eylem) · `Z:` o zaman (gözlenebilir sonuç).
- **Tür:** normal / uç / yetki / eşzamanlılık / zaman / dil.
- **Katman:** `api-e2e` (gerçek Mongo + HTTP, `createTestApp`) · `birim` (saf fonksiyon/servis) · `prop` (fast-check değişmez testi) · `yük` (k6).
- **Mevcut test:** `T/<ad>:<satır>` = `apps/api/test/<ad>.e2e-spec.ts` (`T/race` = `circles.race.e2e-spec.ts`); `U/<dosya>:<satır>` = `apps/api/src/**/<dosya>.spec.ts` (dosya adları benzersiz). `(aynalayan)` = test gözlenebilir sonucu değil mock çağrısını/iç alanı doğruluyor; davranışı tek başına kanıtlamaz.
- **Durum:** ✅ kanıtlı · 🟡 kısmi (bir kısmı ya da yalnız aynalayan test) · ❌ test yok · ❓ kural belirsiz (soru numarası verilir, bkz. en alttaki Soru listesi).
- Ortak yanıt zarfı: başarıda `{success:true, data}`; hatada Nest gövdesi + `requestId` (AI 503'te `{code:'AI_UNAVAILABLE', reason, requestId, message}`).

---

### 1. App (health, app-config, keepAlive)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-APP-01 | V: Mongo bağlı; O: `GET /health` (tokensız, `v1` öneki yok); Z: 200, `status:'ok'`, `mongo:'up'` | normal | api-e2e | T/app:27 | ✅ |
| API-APP-02 | V: Mongo kopuk; O: `GET /health`; Z: yine 200 (asla 503), `mongo:'down'` | uç | birim | U/app.controller:28 | ✅ |
| API-APP-03 | O: `GET /app-config`; Z: `minVersion` = `APP_MIN_VERSION` yoksa `'0'` | normal | api-e2e | T/app:35, U/app.controller:50 | ✅ |
| API-APP-04 | V: `SERVER_PUSH_ENABLED='1'`; Z: `serverPushEnabled:true`; `'0'`/yok → false | normal | birim | T/app:35, U/app.controller:35, :40, :45 | ✅ |
| API-APP-05 | V: `SERVER_PUSH_ENABLED='true'` (0/1 dışı); O: açılış; Z: süreç başlamaz | uç | birim | U/env.validation:58 | ✅ |
| API-APP-06 | V: `MONGODB_URI` yok/boş; O: açılış; Z: süreç başlamaz | uç | birim | U/env.validation:11, :15 | ✅ |
| API-APP-07 | KALDIRILDI (ae2dda2: servis Starter / uyumuyor, keepAlive cron silindi). V: `RENDER_EXTERNAL_URL` yok; O: keepAlive cron (10 dk); Z: istek atılmaz. Var → `{url}/health` çağrılır | zaman | birim | ⛔ özellik kaldırıldı (ae2dda2) | ⛔ |
| API-APP-08 | KALDIRILDI (ae2dda2: keepAlive cron silindi). V: keepAlive hedefi hata verir/30 sn'de dönmez; Z: yalnız warn logu, süreç ve cron çökmez | uç | birim | ⛔ özellik kaldırıldı (ae2dda2) | ⛔ |
| API-APP-09 | V: prod, kritik secret eksik veya `AUTH_ALLOW_INSECURE_TEST_TOKENS=1`; O: açılış; Z: süreç DURMAZ, `boot.insecure_config` alarmı | uç | birim | — | ❌ |
| API-APP-10 | O: beklenmeyen (Http olmayan) hata; Z: 500 + `requestId`, iç mesaj/stack istemciye gitmez, `http.5xx:<rota>` alarmı | uç | api-e2e | U/logging:102 (yalnız genel 500 gövdesi; requestId / `http.5xx` alarmı doğrulanmıyor) | 🟡 |
| API-APP-11 | O: bilinmeyen rota; Z: 404 + `requestId` | uç | api-e2e | — | ❌ |

### 2. Auth

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-AUTH-01 | V: yeni sağlayıcı kimliği; O: `POST /v1/auth/provider/verify`; Z: `isNewUser:true`; aynı sub ikinci girişte `isNewUser:false` + aynı userId | normal | api-e2e | T/auth:23 | ✅ |
| API-AUTH-02 | V: platform android + provider apple; Z: 400 | yetki | api-e2e | T/auth:32 | ✅ |
| API-AUTH-03 | V: platform ios + provider google; Z: kabul | normal | birim | U/auth.service:277 | ✅ |
| API-AUTH-04 | V: `deviceId` eksik; Z: 400 (alan zorunlu) | uç | api-e2e | T/auth:47 | ✅ |
| API-AUTH-05 | V: `idToken` boş veya yalnız boşluk; Z: 400 | uç | api-e2e | — | ❌ |
| API-AUTH-06 | V: `NODE_ENV=production`, `AUTH_ALLOW_INSECURE_TEST_TOKENS` yok; O: `{...}` JSON test token; Z: kabul EDİLMEZ (Google/Apple doğrulamasına gider → 401) | yetki | birim | U/auth.service:347 | ✅ |
| API-AUTH-07 | V: `{` ile başlayan bozuk JSON token (test modu); Z: 400 | uç | api-e2e | T/auth:58 | ✅ |
| API-AUTH-08 | V: Google token aud `GOOGLE_CLIENT_IDS` dışı / iss yanlış / exp geçmiş / tokeninfo 4xx; Z: 401. `GOOGLE_CLIENT_IDS` boş → 500 | yetki | birim | — | ❌ |
| API-AUTH-09 | V: Apple token kid bulunamaz / imza geçersiz / iss / aud / exp hatalı; Z: 401. Apple JWKS 1 saat önbellekte | yetki | birim | — | ❌ |
| API-AUTH-10 | V: e-postası aynı iki sağlayıcı (Google sonra Apple); O: ikinci giriş; Z: aynı kullanıcıya bağlanır (e-postaya göre birleştirme) | uç | api-e2e | — | ❌ |
| API-AUTH-11 | V: kimlik kaydı var ama kullanıcı belgesi elle silinmiş; O: giriş; Z: yeni kullanıcı yaratılıp kimlik yeniden bağlanır, giriş başarılı | uç | birim | U/auth.service:171 | ✅ |
| API-AUTH-12 | V: bağlı Google kimliği; O: her giriş; Z: profil resmi güncellenir, `displayName` yalnız boşsa yazılır | normal | birim | U/auth.service:209 | ✅ |
| API-AUTH-13 | O: `POST /v1/auth/refresh` geçerli token; Z: yeni access + refresh çifti; uydurma → 401; boş → 400 | normal | api-e2e | T/auth:73 | ✅ |
| API-AUTH-14 | V: API yeniden başladı (bellekteki oturum haritası boş; refresh kaydı DB'de tutulur, karar A-20); O: imzalı, süresi geçmemiş refresh; Z: yine 200 | uç | birim | U/auth.service:249 | ✅ |
| API-AUTH-15 | V: süresi geçmiş refresh (varsayılan 30 gün); Z: 401 | zaman | birim | T/auth:247 | ✅ |
| API-AUTH-16 | V: refresh bir kez kullanıldı (döndürüldü); O: ESKİ refresh tekrar gönderilir; Z: 401 ve token ailesi iptal (tek kullanımlık, rotation); yanıtı kaybolan token kısa pencerede (60 sn) tekrar denenebilir; çıkışta `POST /v1/auth/logout` aileyi iptal eder, idempotent 204 (karar A-20) | yetki | api-e2e | T/auth:172, :181, :188, :204, :224, U/auth.service:324 | ✅ |
| API-AUTH-17 | V: kullanıcı hesabını sildi; O: eski refresh ile yenileme; Z: 401 (404 değil; B14 düzeltildi) | uç | api-e2e | T/auth:240 | ✅ |
| API-AUTH-18 | Access token ömrü `AUTH_ACCESS_TOKEN_TTL_MINUTES` (varsayılan 15 dk), en az 60 sn | zaman | birim | U/access-token:21 (yalnız 60 sn alt sınırı; varsayılan 15 dk / env okuması doğrulanmıyor) | 🟡 |
| API-AUTH-19 | Korumalı rota: geçerli Bearer 200; `Basic xyz` 401; süresi geçmiş 401 | yetki | api-e2e | T/auth:100, T/authz-matrix:132 | ✅ |
| API-AUTH-20 | Token imzası yanlış / `sub` ObjectId değil / 2 segment → 401 | yetki | birim | U/jwt-auth.guard:38, :80, U/access-token:56, T/authz-matrix:132 | ✅ |
| API-AUTH-21 | V: girişte `deviceId` verildi, cihaz önceden register edilmiş; Z: cihaz userId'ye bağlanır | normal | api-e2e | T/auth:128 | ✅ |
| API-AUTH-22 | V: girişte verilen `deviceId` hiç register edilmemiş; Z: giriş başarılı, cihaz oluşturulmaz (bağlama sessizce atlanır) | uç | api-e2e | — | ❌ |
| API-AUTH-23 | V: hesap silindi, access token hâlâ ≤15 dk geçerli; O: korumalı rota; Z: guard kullanıcı varlığına bakmaz → istek geçer (bazı uçlarda yetim kayıt) | yetki | api-e2e | T/route-coverage:310 (yalnız streaks recalculate; diğer uçlar doğrulanmıyor) | 🟡 |

### 3. Users (+ tam silme)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-USR-01 | `GET /v1/users/:id`: kendi id 200, başkası 403 | yetki | api-e2e | T/users:23, T/authz-matrix:401 | ✅ |
| API-USR-02 | `PATCH :id/preferences`: tema/font/haptics/hatırlatma güncellenir; enum dışı değer 400 | normal | api-e2e | T/users:38 | ✅ |
| API-USR-03 | `reminderTime` `HH:mm` (00:00–23:59); `24:00`, `8:00` → 400 | uç | api-e2e | T/validation-bounds:670 | ✅ |
| API-USR-04 | Gönderilmeyen tercih alanı (ör. `hapticsPattern`) değişmez | normal | birim | U/users.service:126, :138 | ✅ |
| API-USR-05 | `PATCH :id/onboarding`: `onboarding.completedAt` yazılır | normal | api-e2e | T/users:55 | ✅ |
| API-USR-06 | Başkasının preferences/onboarding'ini PATCH → 403 | yetki | api-e2e | T/authz-matrix:401 | ✅ |
| API-USR-07 | `DELETE :id` kendi: user_dhikrs, logs, streaks, subscriptions, ai_recommendations, auth_identities, vird_programs, vird_day_progress, devices, sohbet konuşma+mesaj, kredi ledger+cüzdan, ai_usage_logs, app_events (userId'li + cihazın girişsiz olayları), push_dispatches (cihaz) silinir; kullanıcı en son silinir | normal | api-e2e | T/users:68, :113, :144, U/users.service:153, :206 | ✅ |
| API-USR-08 | Silmede halkalar silinmez; yalnız üyelik `$pull`; `totalCount` değişmez (karar A-05); kurucuysa kuruculuk devri için bkz. API-USR-13 | normal | api-e2e | T/users:144 (üyelik `$pull` doğrulanıyor; `totalCount` korunması doğrulanmıyor) | 🟡 |
| API-USR-09 | Başkasının hesabını DELETE → 403 | yetki | api-e2e | T/authz-matrix:401 | ✅ |
| API-USR-10 | Aynı token ile ikinci DELETE → hata yok (idempotent) | uç | api-e2e | — | ❌ |
| API-USR-11 | Silme sonrası aynı Google hesabıyla giriş → yeni kullanıcı, `isNewUser:true`, eski veri yok | uç | api-e2e | — | ❌ |
| API-USR-12 | Silme sırasında bir koleksiyon hatası → kullanıcı belgesi kalır, işlem tekrar denenebilir (kısmi silme sonrası ikinci deneme tamamlar) | uç | api-e2e | — | ❌ |
| API-USR-13 | V: kurucu hesabını siler; Z: kuruculuk en eski aktif üyeye geçer (push "yöneticisi oldun"); üye yoksa halka kapanır; tamamlanmış halkaya dokunulmaz; devralanın ücretsiz limiti/200 üye sınırı aynen korunur (karar A-04) | uç | api-e2e | T/users:195, T/race:977, :993, :1010 | ✅ |
| API-USR-14 | Silinmiş kullanıcının RevenueCat olayı gelirse → 200, etkisiz (kullanıcı bulunamaz) | uç | api-e2e | T/webhooks:183 (yalnız bilinmeyen app_user_id; silinmişle aynı arama yolu) | 🟡 |

### 4. Dhikrs (katalog + admin secret)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-DHK-01 | `GET /v1/dhikrs`, `/verified-active`, `/lookup`, `/:id` tokensız 200 | normal | api-e2e | T/dhikrs:31, T/authz-matrix:271 | ✅ |
| API-DHK-02 | `GET /v1/dhikrs` filtresiz → inaktif/doğrulanmamış zikirler de döner (yalnız `verified-active` süzer) | uç | api-e2e | — | ❌ |
| API-DHK-03 | `isVerified`/`isActive` sorgusu `'true'`/`'false'` dışı → 400; `timeOfDay` enum dışı → 400 | uç | api-e2e | T/validation-bounds:996 | ✅ |
| API-DHK-04 | `lookup`: boş → 400; eşleşme yok → 404; büyük/küçük harf duyarsız TAM eşleşme; regex özel karakter (`.*`) kaçışlanır | uç | api-e2e | T/dhikrs:59, U/dhikrs.service:60, :86 | 🟡 |
| API-DHK-05 | `/:id` geçersiz ObjectId veya yok → 404 | uç | api-e2e | T/dhikrs:59, T/validation-bounds:1053 (yalnız bozuk id; geçerli ama olmayan id doğrulanmıyor) | 🟡 |
| API-DHK-06 | Hiçbir okuma yanıtında `embedding` vektörü dönmez | normal | api-e2e | — | ❌ |
| API-DHK-07 | POST/PATCH/DELETE: `x-admin-secret` yok/yanlış → 401; doğru → başarı; `ADMIN_API_SECRET` tanımsızsa doğru görünen başlıkla bile 401 | yetki | api-e2e | T/dhikrs:69, T/authz-matrix:183, U/admin-secret.guard:18 | ✅ |
| API-DHK-08 | POST: `virtue` (fazilet) ve diğer yerelleştirilmiş alanlar (ad, okunuş, anlam, kaynak, Arapça ad) zorunlu; boş / yalnız boşluk → 400 (B15 düzeltildi; PATCH aynı) | uç | api-e2e | T/validation-bounds:941, :950, :957, :964, :969 | ✅ |
| API-DHK-09 | POST: `canonicalKey` Arapça addan türetilir; embedding üretilemezse kayıt embedding'siz oluşur (bloklamaz) | normal | birim | U/dhikrs.service:30 | 🟡 |
| API-DHK-10 | PATCH: embedding kaynak metni değişince vektör yenilenir, değişmezse yeniden embed yok | normal | birim | — | ❌ |
| API-DHK-11 | PATCH/DELETE bilinmeyen id → 404 | uç | api-e2e | — | ❌ |
| API-DHK-12 | V: halkanın/vird'in zikri silindi; O: halka detayı; Z: 500 değil, zikir anlık görüntüsü boş adla döner | uç | api-e2e | — | ❌ |

### 5. DhikrLogs

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-LOG-01 | Gövdedeki `userId` yok sayılır, token sahibine yazılır | yetki | api-e2e | T/dhikr-logs:39, T/authz-matrix:419, T/validation-bounds:94 | ✅ |
| API-LOG-02 | Bilinmeyen alan sessizce elenir (400 değil) | uç | api-e2e | T/dhikr-logs:59, T/validation-bounds:79 | ✅ |
| API-LOG-03 | Aynı `{user, dhikr, date}` ikinci POST → tek belge, son yazan kazanır (count düşebilir) | normal | api-e2e | T/dhikr-logs:80 | ✅ |
| API-LOG-04 | Gün bir kez `isCompleted:true` olduysa sonraki kısmi yazım bunu geri almaz | normal | api-e2e | T/dhikr-logs:407, U/dhikr-logs.service:94, :111 | ✅ |
| API-LOG-05 | `dhikrId` ve `customDhikrId` ikisi de yok → 400 | uç | api-e2e | T/validation-bounds:318 | ✅ |
| API-LOG-06 | `dhikrId` biçimi bozuk → 400; biçim doğru ama katalogda yok → 404 | uç | api-e2e | T/validation-bounds:308 | ✅ |
| API-LOG-07 | `count`/`targetCount` negatif veya ondalık → 400; 0 kabul | uç | api-e2e | T/validation-bounds:247, :253, :257 | ✅ |
| API-LOG-08 | `count` tek kayıtta en fazla 100.000 (aşarsa 400; tekil ve bulk) (karar A-02) | uç | api-e2e | T/dhikr-logs:295, T/validation-bounds:247 | ✅ |
| API-LOG-09 | `date` `YYYY-MM-DD` değil → 400; `2026-02-30` gibi takvimde olmayan gün → 400 (B19 düzeltildi) | uç | api-e2e | T/dhikr-logs:305, T/validation-bounds:177 | ✅ |
| API-LOG-10 | Gelecek tarihli `date` en fazla bugün+1 (bugün `x-client-timezone` ile belirlenir); ilerisi 400 (karar A-12) | zaman | api-e2e | T/dhikr-logs:305, :327 | ✅ |
| API-LOG-11 | `isCompleted:true` ama `count < targetCount` → istemci bayrağı yok sayılır, tamamlanmaz; tamamlandı = sunucuda count ≥ targetCount; `targetCount` 0 (hedefsiz) → istemci bayrağı korunur (karar A-13) | uç | api-e2e | T/dhikr-logs:349, :369 | ✅ |
| API-LOG-12 | Aynı gün/zikir için sade, vird ve halka logları ayrı belgelerdir; biri diğerini ezmez | normal | api-e2e | T/race:606, U/dhikr-logs.service:176 | ✅ |
| API-LOG-13 | Aynı zikir farklı vird dilimi / farklı namaz vakti → ayrı belge | normal | api-e2e | U/dhikr-logs.service:227 (aynalayan) | 🟡 |
| API-LOG-14 | `circleId` + `virdProgramId` birlikte → 400 | uç | api-e2e | T/dhikr-logs:113 | ✅ |
| API-LOG-15 | Halka logu: üyelik/aktiflik/zikir kontrolü yazımdan ÖNCE; red → log yazılmaz | yetki | api-e2e | T/race:553, U/dhikr-logs.service:322, :396 | ✅ |
| API-LOG-16 | Halka logunda count `$max`: geç gelen küçük değer düşürmez | eşzamanlılık | api-e2e | T/circles:282, T/race:339 | ✅ |
| API-LOG-17 | Halka logu yanıtı `circleTotalCount` taşır; toplam türetimi düşerse alan yok ama log yine döner | normal | birim | U/dhikr-logs.service:519, :535 | ✅ |
| API-LOG-18 | Log yazımı seriyi tazeler; seri hatası yazımı bozmaz | normal | api-e2e | T/dhikr-logs:225 (seri hatasında yazımın bozulmaması doğrulanmıyor) | 🟡 |
| API-LOG-19 | Vird ilerleme türetim hatası yazımı bozmaz | uç | birim | U/dhikr-logs.service:272 | ✅ |
| API-LOG-20 | 40 paralel aynı anahtar yazımı → tek belge (sade ve vird) | eşzamanlılık | api-e2e | T/race:792, :813, :839 | ✅ |
| API-LOG-21 | Bulk: 3 kayıt + 1 tekrar → doğru `insertedCount` ve `items` | normal | api-e2e | T/dhikr-logs:132 | ✅ |
| API-LOG-22 | Bulk içinde `circleId` → 400 | uç | api-e2e | T/dhikr-logs:181 | ✅ |
| API-LOG-23 | Bulk içinde `dhikrId`'siz (özel zikir) öğe → 400 | uç | api-e2e | — | ❌ |
| API-LOG-24 | Bulk: boş `items` → 400; öğe sayısı üst sınırı yok (1000 öğe → 413 gövde sınırı, 500 değil) | uç | api-e2e | T/validation-bounds:330, :342, :348 | ✅ |
| API-LOG-25 | Bulk: gün tamamlanmışken daha düşük `count` / `isCompleted:false` gelse bile tamamlanmayı GERİ ALMAZ (tekil POST ile aynı kural; B10 düzeltildi) | uç | api-e2e | T/dhikr-logs:407, :435 | ✅ |
| API-LOG-26 | Bulk: vird alanlı öğe yazılabilir, 500 vermez (B10 düzeltildi) | uç | api-e2e | T/dhikr-logs:416 | ✅ |
| API-LOG-27 | `GET /v1/dhikr-logs`: yalnız kendi logları; `dateFrom`/`dateTo` dahil aralık; yeni→eski | normal | api-e2e | T/dhikr-logs:202, T/authz-matrix:419 (yalnız kendi + tarih aralığı; yeni→eski sıra doğrulanmıyor) | 🟡 |
| API-LOG-28 | `GET /:id` başkasının logu → 404 | yetki | api-e2e | T/authz-matrix:419, T/route-coverage:91 | ✅ |
| API-LOG-29 | `DELETE by-dhikr`: yalnız kendi logları silinir, `deletedCount` döner; ikisi de yok → 400 | normal | api-e2e | T/route-coverage:140, :166, :183 | ✅ |
| API-LOG-30 | `DELETE by-dhikr` halka/vird loglarını da siler; halka `totalCount` düşmez (kabul); seri yeniden hesaplanır, `longestStreak` düşmez (B11, A-15); vird ilerlemesi yeniden hesaplanmaz | uç | api-e2e | T/route-coverage:114, :140 (halka/vird log silme ve `totalCount` doğrulanmıyor) | 🟡 |
| API-LOG-31 | `PATCH favorite/by-dhikr`: kendi tüm loglarında `isFavorite`; matched/modified döner | normal | api-e2e | T/route-coverage:202, :230, :240, :258 | ✅ |
| API-LOG-32 | Silinmiş kullanıcının hâlâ geçerli token'ıyla POST → 404 (yetim log oluşmaz) | yetki | api-e2e | — | ❌ |

### 6. Streaks (genel + vird serisi, grace)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-STR-01 | Başkasının serisi (GET/recalculate) → 403 | yetki | api-e2e | T/streaks:52, T/authz-matrix:490 | ✅ |
| API-STR-02 | `POST recalculate-all` herkese 403 | yetki | api-e2e | T/streaks:62, T/authz-matrix:490 | ✅ |
| API-STR-03 | Bugün + dün tamamlanmış → `currentStreak:2` | normal | api-e2e | T/streaks:71 | ✅ |
| API-STR-04 | Yalnız dün tamamlanmış (grace) → 1 | zaman | api-e2e | T/streaks:97 | ✅ |
| API-STR-05 | Son tamamlanma 2 gün önce → 0 | zaman | api-e2e | T/streaks:116 | ✅ |
| API-STR-06 | Boşluklu 5 gün → `longestStreak` en uzun ardışık koşu | normal | api-e2e | T/streaks:135 | ✅ |
| API-STR-07 | Logu olan ama seri belgesi olmayan → GET tembel doldurur | uç | api-e2e | T/streaks:162 | ✅ |
| API-STR-08 | Hiç log yok → sıfırlar döner, belge yazılmaz | uç | birim | U/streaks.service:120 (aynalayan) | 🟡 |
| API-STR-09 | Seri = sayımı > 0 olan gün; hedefi tamamlanmamış ama sayımlı log seriyi sürdürür, sayımı 0 olan gün sürdürmez; `lastCompletedDate` = son sayımlı gün; eski kural belgesi ilk okumada bir kez yeniden hesaplanır (karar M-21) | normal | api-e2e | T/streaks:251, :261, :273, :282, :297, :315, U/streaks.service:81 | ✅ |
| API-STR-10 | V: son yazım 3 gün önce (o an seri 5); O: bugün yazım olmadan GET; Z: `currentStreak:0` (okuma anında `effectiveStreak`, `lastCompletedDate` + x-client-timezone) | zaman | api-e2e | T/streaks:487, :508, U/streak-calculator:104 | ✅ |
| API-STR-11 | `POST :userId/recalculate` kendi → güncel seri | normal | api-e2e | T/route-coverage:274, :284 | ✅ |
| API-STR-12 | Aynı gün birden çok tamamlanmış log → tek gün | uç | birim | U/streak-calculator:60 | ✅ |
| API-STR-13 | Gelecek tarihli log en fazla bugün+1 (karar A-12); okuma anı serisi gelecek tarihli güne takılmaz | zaman | birim | U/streak-calculator:113, T/dhikr-logs:305 (`longestStreak`/`totalDaysActive` etkisi doğrulanmıyor) | 🟡 |
| API-STR-14 | "Bugün" `x-client-timezone`'a göre (Auckland günü bugün sayılır; LA akşamı dün-grace sürer) | zaman | birim | U/streak-timezone:46, :53, T/streaks:508 | ✅ |
| API-STR-15 | Değişmez: tarih kümesinin sırası/tekrarı sonucu değiştirmez; `current ≤ longest`; `current>0` ⇒ bugün veya dün tamamlanmış; rastgele tz + DST'de aynı | uç | prop | T/streaks:315, T/timezone-cross-module:194 (yalnız count>0 ve gün tutarlılığı özellikleri; `current ≤ longest` / sıra bağımsızlığı yok) | 🟡 |
| API-STR-16 | Halka ve vird logları da genel seriye sayılır (karar A-14) | uç | api-e2e | T/stats:117 | ✅ |
| API-STR-17 | Vird serisi `vird_day_progress.isDayComplete` günlerinden, tüm programlar genelinde | normal | api-e2e | T/streaks:190 | ✅ |
| API-STR-18 | Vird günü sonradan tamamlanmamışa dönerse (daha düşük sayı) vird serisi de düşmeli (şu an yalnız tamamlanınca hesaplanıyor) | uç | api-e2e | — | ❌ |
| API-STR-19 | `vird_day_progress` 400 gün TTL ile silinse de `virdLongestStreak` ve rozet düşmez (karar A-15) | zaman | api-e2e | T/streaks:381, T/stats:156 | ✅ |
| API-STR-20 | Kullanıcı yoksa recalculate → 404 | uç | birim | U/streaks.service:139 | ✅ |

### 7. Stats (özet, rozetler, gün anahtarı)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-STA-01 | Boş kullanıcı → tüm sayılar 0 | uç | api-e2e | T/stats:35 | ✅ |
| API-STA-02 | 3 log sonrası `allTimeCount`/`totalSessions`/`completedCount` doğru | normal | api-e2e | T/stats:52 | ✅ |
| API-STA-03 | Ücretsiz: `locked:true`; heatmap, gün/saat dağılımı, kaynak, top zikirler, karşılaştırma boş/sıfır; özet, periyotlar, seri, 30 günlük seri ve rozetler açık | normal | api-e2e | U/stats-aggregator:204, :223 | 🟡 |
| API-STA-04 | Premium: `locked:false`, tüm bölümler dolu | normal | api-e2e | U/stats-aggregator:131 | 🟡 |
| API-STA-05 | Premium bilgisi sunucuda `user.isPremium`'dan; kullanıcı yoksa kilitli | yetki | birim | U/stats.service:102 | ✅ |
| API-STA-06 | `today`/`thisWeek` (7 gün)/`thisMonth` (30 gün) istek saat dilimine göre | zaman | api-e2e | U/stats-aggregator:29, :135, T/stats:304, :314 | ✅ |
| API-STA-07 | `hourDistribution` `createdAt` saatinden, istek tz'sine göre; her zaman 24 kova; gün dağılımı 7 kova | zaman | api-e2e | U/stats-aggregator:147, T/stats:304, :314 | ✅ |
| API-STA-08 | Karşılaştırma: önceki dönem 0 ise `changePercent:0` | uç | birim | U/stats-aggregator:141 | ✅ |
| API-STA-09 | `completionRate` yuvarlanmış yüzde; oturum yoksa 0; `averagePerActiveDay` = toplam / aktif gün | normal | birim | U/stats-aggregator:123 | ✅ |
| API-STA-10 | Rozetler: count-100/1k/10k/100k (toplam), streak-7/30/100 (`longest`), vird-7/30/100 (vird `longest`); `progress` 0..1 | normal | birim | U/stats-aggregator:41, :63, T/stats:225, :250 | ✅ |
| API-STA-11 | API rozet listesi `packages/shared` listesiyle birebir | normal | birim | packages/shared/src/utils/badges.test.ts | ✅ |
| API-STA-12 | Halka logları toplam/seri/rozete sayılır ve kaynak dağılımında `circle` olarak görünür (karar A-14) | uç | birim | T/stats:117 | ✅ |
| API-STA-13 | Seri alanları okuma anında değerlendirilir; bayat seri dönmez (bkz. API-STR-10) | zaman | api-e2e | T/streaks:487 | ✅ |
| API-STA-14 | Heatmap 365, günlük seri 30 gün, eksik günler 0 ile dolu | normal | birim | U/stats-aggregator:156 | ✅ |
| API-STA-15 | Top zikir etiketi: karar A-21 zikrin iki dilli adı dönmeli; kod hâlâ yalnız `name.tr` döndürüyor (uygulanmadı) | dil | api-e2e | — | ❌ |

### 8. AI Rehber (öneri)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-AIR-01 | Başarı: `kind:'recommendations'`, öneri kaydı, 1 kredi (`RECOMMENDATION_DEBIT`), `remainingCredits` | normal | api-e2e | T/ai:95, U/ai.service:107 | ✅ |
| API-AIR-02 | Konu dışı niyet → `kind:'offTopic'`, yerel mesaj, 0 kredi, seçim turu çağrılmaz | normal | birim | U/ai.service:168, U/recommendation-agent.service:472 | ✅ |
| API-AIR-03 | Netleştirme → `kind:'clarification'`, `items:[]`, `suggestedCategories:[]`, 0 kredi | normal | api-e2e | T/ai:238, U/ai.service:145 | ✅ |
| API-AIR-04 | Sağlayıcı hatası → 503 `AI_UNAVAILABLE`, kredi yok, kayıt yok | uç | api-e2e | T/ai:108, :124 | ✅ |
| API-AIR-05 | Zaman aşımı → 503 `reason:timeout`, en fazla 2 deneme | uç | api-e2e | T/ai:212 | ✅ |
| API-AIR-06 | Model sonuç üretmez → 503 `invalid_output` | uç | api-e2e | T/ai:258 | ✅ |
| API-AIR-07 | Aynı `flowId` tekrar → kredi tekrar düşmez | eşzamanlılık | api-e2e | T/ai:134 | ✅ |
| API-AIR-08 | Aynı `flowId` tekrarında kayıtlı öneri aynen döner; ajan YENİDEN çalışmaz, ikinci öneri kaydı oluşmaz, kredi düşmez (B7 çözüldü) | uç | api-e2e | T/ai:607 | ✅ |
| API-AIR-09 | Aynı `flowId` farklı `freeText` → 403 | yetki | api-e2e | T/ai:158 | ✅ |
| API-AIR-10 | `flowId` UUID v4 değil → 400 | uç | api-e2e | T/validation-bounds:473 | ✅ |
| API-AIR-11 | Gövdede `userId` zorunlu (biçim kontrolü) ama değeri yok sayılır, JWT kullanılır | yetki | api-e2e | T/authz-matrix:515 (yalnız değerin yok sayılması; `userId` yokluğu/biçimi testsiz) | 🟡 |
| API-AIR-12 | `maxRecommendations` 1..5 (varsayılan 5); 0/6 → 400 | uç | api-e2e | T/validation-bounds:456, :462 (varsayılan 5 testsiz) | 🟡 |
| API-AIR-13 | `timeContext` iç alanları doğrulanır (`hour` 0..23, `dayOfWeek` 0..6, `isSpecialDay` boolean); geçersiz → 400 (B12 çözüldü) | uç | api-e2e | T/validation-bounds:515, :518 | ✅ |
| API-AIR-14 | `timeContext` yoksa dilim isteğin saat dilimine göre belirlenir (`x-client-timezone`, yoksa İstanbul); sunucu saati kullanılmaz (B12 çözüldü) | zaman | api-e2e | T/validation-bounds:535 | ✅ |
| API-AIR-15 | `freeText` yok → zaman dilimine göre aday, niyet genişletme yok | normal | birim | U/recommendation-agent.service:493 (freeText'siz yol yalnız 503 testinin yan yolu), U/retrieval.service:659 (zaman tabanlı arama); ajanın bu yola girmesi doğrudan doğrulanmıyor | 🟡 |
| API-AIR-16 | Model yalnız `C#` ref kullanır; bilinmeyen ref düşer; ham ObjectId/ref metne sızmaz | uç | birim | U/recommendation-agent.service:434, :399, :368 | ✅ |
| API-AIR-17 | Yalnız `isVerified && isActive` zikirler önerilir (ikinci DB kapısı) | normal | birim | — (ikinci DB kapısı yalnız AI Vird'de test edilir: AIV-10) | ❌ |
| API-AIR-18 | Son 7 günde çekilen zikir dışlanmaz, işaretlenir | normal | birim | U/recommendation-agent.service:320 | ✅ |
| API-AIR-19 | `searchDhikrs` en fazla 1 kez, sonra seçim/netleştirme | normal | birim | T/ai:227, U/recommendation-agent.service:253 | ✅ |
| API-AIR-20 | `GET /recommendations`: yalnız kendi, son 50, yeni→eski | yetki | api-e2e | T/ai:294, T/authz-matrix:515 (yalnız kendi + liste; son 50 / yeni→eski sırası testsiz) | 🟡 |
| API-AIR-21 | `PATCH /recommendations/:id/select`: listede olmayan zikir → 404; başkasının önerisi → 404 | yetki | api-e2e | T/ai:294, T/authz-matrix:515 (başkasının önerisi → 404; listede olmayan zikir → 404 testsiz) | 🟡 |
| API-AIR-22 | Seçim tekrarlanırsa `selectionCount` yine artar, `selectedDhikrId` üzerine yazılır | uç | api-e2e | — | ❌ |
| API-AIR-23 | `GET /quota` (eski): premium `limit:null`; ücretsiz `used/limit` | normal | api-e2e | T/ai:294 (yalnız `isPremium` alanı; premium `limit:null` / ücretsiz `used/limit` testsiz) | 🟡 |
| API-AIR-24 | `freeText` loglara yazılmaz, yalnız uzunluğu loglanır (PII politikası; B13 çözüldü) | yetki | birim | T/ai:590 | ✅ |
| API-AIR-25 | Kullanıcı silinmiş → 404, kredi işlemi yok | uç | api-e2e | — | ❌ |
| API-AIR-26 | Fetva/kıyas/ürün içeriği kuralları (kaynaksız uydurma yok) — API testi değil, `eval:rehber` kapsamı | normal | — | ⛔ LLM çıktı kalitesi — `eval:rehber` kapsamı, CI dışı | ⛔ |

### 9. AI Kredileri (cüzdan, grant, idempotent kesim)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-CRD-01 | Yeni ücretsiz kullanıcı ilk gün 3 kredi (karşılama), sonraki günler 1 | normal | api-e2e | T/ai:177, U/ai-credits.service:410 | ✅ |
| API-CRD-02 | Ücretsiz günlük grant birikmez (yeni günde grant kovası 1'e eşitlenir), topup korunur | zaman | birim | U/ai-credits.service:540 | ✅ |
| API-CRD-03 | Premium: UTC ay başına 50 kredi; aynı ayda ikinci kez verilmez | zaman | api-e2e | T/ai:198, U/ai-credits.service:432 | ✅ |
| API-CRD-04 | Premium⇄ücretsiz geçişte aynı ay ikinci aylık grant yok | uç | birim | U/ai-credits.service:516, T/ai:541 | ✅ |
| API-CRD-05 | Premium bitince kalan aylık kredi ay sonuna kadar kullanılabilir (silinmez); aynı ay yeniden premium olunca kalan hak geri gelir, ikinci aylık grant verilmez (karar A-08) | uç | birim | T/ai:541, U/ai-credits.service:516, :892, :795 | ✅ |
| API-CRD-06 | Gün/ay sınırı UTC: ücretsiz günlük kredi UTC gece yarısı yenilenir (TR'de 03:00), değişmez (karar A-16) | zaman | birim | U/ai-credits.service:432 (ay sınırı 00:00:01Z), :410 (gün değişimi 10:00Z; gece yarısı anı testsiz) | 🟡 |
| API-CRD-07 | Bakiye < tutar → 403 `AI_CREDIT_INSUFFICIENT`, ajan hiç çalışmaz | normal | api-e2e | T/ai:177, U/ai-vird.service:271, U/ai-credits.service:635 | ✅ |
| API-CRD-08 | Kesim önce grant, kalan topup kovasından; 3'lük karışık kesim tek atomik adım | normal | birim | U/ai-credits.service:724, :613 | ✅ |
| API-CRD-09 | Değişmez: bakiye asla negatif olmaz; bakiye = grant + topup; rastgele eşzamanlı kesim dizilerinde toplam kesim ≤ başlangıç bakiye | eşzamanlılık | prop | U/ai-credits.service:795 (fast-check), T/ai:357 | ✅ |
| API-CRD-10 | Aynı `flowId` ile ikinci kesim yok | eşzamanlılık | birim | U/ai-credits.service:454, :683 | ✅ |
| API-CRD-11 | Aynı `flowId` iki eşzamanlı istek → tek ledger satırı, tek kesim | eşzamanlılık | api-e2e | T/ai:514 | ✅ |
| API-CRD-12 | Bakiye 1, farklı `flowId` ile iki eşzamanlı istek → biri başarılı; diğeri LLM çalıştıktan sonra 403 alır; içerik kaydı KALMAZ (önce kesim, sonra kalıcılaştırma; B9 çözüldü) | eşzamanlılık | api-e2e | T/ai:357, T/ai:377, T/ai-chat:235 | ✅ |
| API-CRD-13 | Cüzdanı olmayan kullanıcının ilk AI istekleri eşzamanlı → 500 olmaz, tek cüzdan, tek günlük grant (B8 çözüldü) | eşzamanlılık | api-e2e | T/ai:492 | ✅ |
| API-CRD-14 | Topup: katalog ürünü (10/30/75) → +kredi; aynı olay → duplicate, bakiye aynı; bilinmeyen ürün → etkisiz + hata logu | normal | api-e2e | T/webhooks:209, U/ai-credits.service:566, :589 | ✅ |
| API-CRD-15 | `AI_CREDIT_TOPUP_PRODUCTS` env (JSON veya `sku:miktar` csv) varsayılan kataloğu ezer | normal | birim | — | ❌ |
| API-CRD-16 | `GET /v1/ai/credits`: `balance`, `isPremium`, `dailyGrant`, `monthlyGrant`; ilk çağrı cüzdan+grant oluşturur | normal | api-e2e | T/ai:198, T/ai:492 (`balance`, `isPremium`, ilk çağrıda cüzdan+grant; `dailyGrant`/`monthlyGrant` alanları testsiz) | 🟡 |
| API-CRD-17 | Kesimde cüzdan güncellemesi fırlarsa ledger satırı telafi olarak silinir (yetim kesim yok) | uç | birim | — | ❌ |
| API-CRD-18 | Grant uygulanırken eşzamanlı topup → bakiye bir sonraki okumada `grant+topup`'a düzelir (kalıcı kayıp yok) | eşzamanlılık | api-e2e | — (eşzamanlı grant yarışı T/ai:492; topup ile kesişim testsiz) | ❌ |

### 10. AI Vird Programı (`POST /v1/ai/vird-programs`)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-AIV-01 | Başarı: taslak (`draft`, `source:'ai'`, `journey`), 3 kredi (`VIRD_PROGRAM_DEBIT`), önizleme + `remainingCredits` | normal | api-e2e | T/ai:415, U/ai-vird.service:124 | ✅ |
| API-AIV-02 | Ücretsiz kullanıcı da üretebilir (premium kapısı yok, yalnız 3 kredi) | normal | api-e2e | T/ai:415 | ✅ |
| API-AIV-03 | Konu dışı → taslak yok, kredi yok | normal | birim | U/ai-vird.service:205 | ✅ |
| API-AIV-04 | Aynı `flowId` tekrar → ajan çalışmaz, mevcut taslak döner, kredi yok | eşzamanlılık | api-e2e | U/ai-vird.service:244 (yalnız birim; HTTP düzeyinde testsiz) | 🟡 |
| API-AIV-05 | Aynı `flowId` farklı süre/dilim/vakit/metin → 403 | yetki | api-e2e | — | ❌ |
| API-AIV-06 | Taslak silindikten (veya 7 gün TTL'den) sonra aynı `flowId` → yeni program ÜCRETSİZ üretilir (kredi kaydı var, taslak yok) | uç | api-e2e | — (B7'nin AI Vird yarısı açık, kod değişmedi) | ❌ |
| API-AIV-07 | `durationDays` 7/14/30 dışı, `slots` boş, `prayerSelection` 1..5 dışı → 400 | uç | api-e2e | T/validation-bounds:481 | ✅ |
| API-AIV-08 | Dil: gövde `locale` > `Accept-Language` > tr | dil | api-e2e | — (yalnız geçersiz `locale` → 400: T/validation-bounds:481; öncelik sırası testsiz) | ❌ |
| API-AIV-09 | Fazlar 1..süre boşluksuz/çakışmasız; istenmeyen dilim yok; hedef katalog hedefini aşmaz; dilim başı ≤4 | normal | birim | U/vird-program-agent.service:354, :404, :447 | ✅ |
| API-AIV-10 | DB kapısını geçemeyen zikir düşer; hiçbiri kalmazsa 503 | uç | birim | U/vird-program-agent.service:286, :327 | ✅ |
| API-AIV-11 | AI taslağı 7 gün sonra silinir (manuel/şablon 30 gün) | zaman | api-e2e | — | ❌ |
| API-AIV-12 | AI programı 3 zikir ücretsiz sınırından muaf; ücretsizde yine 1 aktif program sınırı | normal | api-e2e | T/ai:415 (ücretsiz kullanıcı AI programını aktifleştirir; 3 zikir sınırından muafiyet ve 2. aktif program reddi testsiz) | 🟡 |
| API-AIV-13 | Başlık tek dilde üretilir, `title.tr` = `title.en` | dil | birim | — | ❌ |
| API-AIV-14 | AI hatası → 503, kredi yok | uç | birim | U/ai-vird.service:221 | ✅ |
| API-AIV-15 | Aynı `flowId` iki eşzamanlı istek → tek taslak (unique `ai.flowId` + yeniden okuma) | eşzamanlılık | api-e2e | — (T/ai:377 farklı `flowId`) | ❌ |
| API-AIV-16 | `startDate` = isteğin saat dilimindeki bugün | zaman | api-e2e | — | ❌ |

### 11. WebSocket `/ai-progress`

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-WA-01 | Rehber isteğinde `socketId` → o sokete `ai:step` adımları | normal | api-e2e | T/ai-streaming:323 | ✅ |
| API-WA-02 | Sohbet isteğinde `socketId` → `ai-chat:step` | normal | api-e2e | T/ai-streaming:356, U/ai-progress.gateway:25 | ✅ |
| API-WA-03 | Bağlantı kimlik doğrulamasız; başkasının `socketId`'si verilirse adım metinleri ona gider (veri içermez) | yetki | api-e2e | T/ai-streaming:380, T/ai-streaming:323 | ✅ |
| API-WA-04 | AI Vird ucu `socketId` almaz (alan elenir) | uç | api-e2e | — | ❌ |
| API-WA-05 | Bağlı olmayan `socketId` → sessiz, istek etkilenmez | uç | api-e2e | T/ai-streaming:372 | ✅ |

### 12. AI Sohbet (chat / bilgi, SSE)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-CHT-01 | Konuşma oluşturma: konuşma + user + assistant mesajı, 1 kredi `CHAT_MESSAGE_DEBIT` | normal | api-e2e | T/ai-chat:46 | ✅ |
| API-CHT-02 | 503 → konuşma/mesaj yaratılmaz, kredi düşmez | uç | api-e2e | T/ai-chat:80, T/ai-streaming:154 | ✅ |
| API-CHT-03 | Başkasının konuşmasına mesaj / mesaj listesi → 404 | yetki | api-e2e | T/ai-chat:99, T/authz-matrix:515, U/ai-chat.service:417, :434 | ✅ |
| API-CHT-04 | `sendMessage`: mesaj eklenir, yeni kredi düşer | normal | api-e2e | T/ai-chat:118 | ✅ |
| API-CHT-05 | Bilgi modu: `coverage` + kaynak atıfları döner | normal | api-e2e | T/ai-chat:145 | ✅ |
| API-CHT-06 | Chat modu: kaynak araması yok, `coverage` boş, atıf yok | normal | api-e2e | T/ai-chat:176, U/ai-chat.service:500 | ✅ |
| API-CHT-07 | `coverage:none` → atıf yok; bilinmeyen `P#` → `coverage` none'a düşer; metindeki ref temizlenir | uç | birim | U/ai-chat.service:616, :637, :658 | ✅ |
| API-CHT-08 | Atıf kartı en fazla 3 kaynak | uç | birim | — | ❌ |
| API-CHT-09 | Sınıflandırma düşerse 503, hiçbir şey kalıcılaşmaz | uç | birim | U/ai-chat.service:512 | ✅ |
| API-CHT-10 | Mesaj 1..2000 karakter; 2001 → 400; yalnız boşluk → 400, kredi düşmez (B16 çözüldü) | uç | api-e2e | T/validation-bounds:574, :577, T/ai-chat:262 | ✅ |
| API-CHT-11 | Başlık ilk mesajdan ≤60 karakter + `…` | normal | birim | U/ai-chat.service:449, :464 | ✅ |
| API-CHT-12 | Dil: gövde `locale` > `Accept-Language` > tr; sonraki mesajlar konuşmanın kayıtlı dilini kullanır | dil | api-e2e | — | ❌ |
| API-CHT-13 | Bağlam penceresi son 10 mesaj | normal | birim | — | ❌ |
| API-CHT-14 | Kredi yetersiz → 403 `AI_CREDIT_INSUFFICIENT`; SSE'de akış başlamadan düz JSON 403 | normal | api-e2e | T/ai-streaming:185, T/ai-chat:235 | ✅ |
| API-CHT-15 | SSE: `token`×N → `done {messageId, content, remainingCredits, conversationId, mode, coverage, sourceCitations}` | normal | birim | T/ai-streaming:100, :131, U/ai-chat.service:748 | ✅ |
| API-CHT-16 | SSE: ilk token öncesi hata → `event:error` `AI_UNAVAILABLE`, kalıcılaşma yok | uç | birim | T/ai-streaming:154, U/ai-chat.service:680 | ✅ |
| API-CHT-17 | SSE: token sonrası kopma → tekrar denenmez, `error` event, kalıcılaşma/kesim yok | uç | birim | U/ai-chat.service:712 | ✅ |
| API-CHT-18 | SSE: istemci bağlantıyı keserse kalıcılaşma/kesim atlanır, `error` yazılmaz | uç | api-e2e | T/ai-streaming:256 | ✅ |
| API-CHT-19 | SSE: beklenmeyen hata → `code:'INTERNAL'`, gerçek neden sızmaz | uç | birim | — | ❌ |
| API-CHT-20 | Aynı `clientMessageId` ile tekrar gönderim (ağ koptu, sunucu bitirdi) ücretsizdir: ikinci kredi, mesaj çifti ve LLM çağrısı yok, ilk cevap döner; aynı anahtar farklı metinle → 409 (karar A-11) | eşzamanlılık | api-e2e | T/ai-chat:285, :314, :350, T/ai-streaming:229 | ✅ |
| API-CHT-21 | Kesim önce, kalıcılaştırma sonra: eşzamanlı bakiye tükenmesinde istemci 403 görür, mesajlar KALMAZ, kredi tek düşer (B9 çözüldü) | eşzamanlılık | api-e2e | T/ai-chat:235, T/ai-streaming:207 | ✅ |
| API-CHT-22 | Konuşma listesi: kendi, `lastMessageAt` azalan, `hasMore` doğru | normal | api-e2e | T/ai-chat:195 (yalnız 200 + dolu yanıt; kendi/`lastMessageAt` sırası/`hasMore` testsiz) | 🟡 |
| API-CHT-23 | `page<1`, `limit>50`, sayı olmayan → 400 | uç | api-e2e | T/validation-bounds:586 | ✅ |
| API-CHT-24 | Ürün içeriği kuralları (fetva notu, kıyas yasağı, dua kartı yok) — `eval` kapsamı | normal | — | ⛔ LLM çıktı kalitesi — `eval` kapsamı, CI dışı | ⛔ |

### 13. SpecialDays

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-SPD-01 | `GET` list, `home`, `:id/detail`, `:id` JWT ile 200 | normal | api-e2e | T/special-days:51 | ✅ |
| API-SPD-02 | `GET` list, `home`, `:id/detail`, `:id` tokensız 200 → misafir görebilir; yazma rotaları yine 401/403 (karar A-22) | yetki | api-e2e | T/special-days:176, T/authz-matrix:266 | ✅ |
| API-SPD-03 | Yazma rotaları yalnız `x-admin-secret`; kullanıcı token'ı yetmez | yetki | api-e2e | T/special-days:127 | ✅ |
| API-SPD-04 | `home?date`: o güne eşleşen kayıt hero (`today`), yoksa ilk gelecek (`upcoming`); upcoming ≤18; geçmiş yok | normal | api-e2e | T/special-days:77 | ✅ |
| API-SPD-05 | `home` tarihsiz → İSTEK saat dilimindeki bugün (`x-client-timezone`); sunucu günü kullanılmaz (B6 çözüldü) | zaman | api-e2e | T/special-days:190 | ✅ |
| API-SPD-06 | `dateFrom`/`dateTo` filtresi | normal | api-e2e | T/special-days:101 | ✅ |
| API-SPD-07 | Tarih regex dışı → 400 | uç | api-e2e | T/special-days:117, T/validation-bounds:149 | ✅ |
| API-SPD-08 | `detail` ObjectId veya `eventKey` kabul eder; çok günlü olayda ilk gün | normal | api-e2e | T/special-days:51 (yalnız ObjectId ile `detail`; `eventKey` ve çok günlü ilk gün testsiz) | 🟡 |
| API-SPD-09 | Bilinmeyen id/eventKey → 404 | uç | api-e2e | T/special-days:74 (yalnız silinmiş ObjectId → `:id` 404; `detail`/`eventKey` testsiz) | 🟡 |
| API-SPD-10 | `isActive:false` kayıt home'da görünmez | normal | api-e2e | — | ❌ |
| API-SPD-11 | Açılışta veri kapsaması: son kayıt <180 gün sonra → tek warn | zaman | birim | U/special-days.service:95, :142 | ✅ |

### 14. Subscriptions (+ RevenueCat doğrulayıcı, mutabakat cron)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-SUB-01 | Güven modu (dev/test, RC anahtarı yok): POST istemci değeriyle yazar, `isPremium` eşitlenir | normal | api-e2e | T/subscriptions:55, U/subscriptions.service:138 | ✅ |
| API-SUB-02 | Doğrulama modu, RC aktif değil → 403 `SUBSCRIPTION_NOT_VERIFIED`, `isPremium` false kalır | yetki | api-e2e | T/subscriptions:115 | ✅ |
| API-SUB-03 | Doğrulama modu, RC aktif → kayıt RC değerleriyle (productId, provider, bitiş) | normal | api-e2e | T/subscriptions:132 | ✅ |
| API-SUB-04 | RC ulaşılamaz → 503 `SUBSCRIPTION_VERIFIER_UNAVAILABLE` | uç | birim | U/subscriptions.service:171 | ✅ |
| API-SUB-05 | Prod + anahtar yok → 503 `SUBSCRIPTION_VERIFIER_UNCONFIGURED` + alarm, yazım yok | uç | birim | U/subscriptions.service:146 | ✅ |
| API-SUB-06 | Başkası için `userId` ile POST → 403 | yetki | api-e2e | T/subscriptions:196, T/authz-matrix:582 | ✅ |
| API-SUB-07 | `GET ?userId=başkası` → 403; parametresiz → yalnız kendi | yetki | api-e2e | T/subscriptions:207, T/authz-matrix:582, T/subscriptions:55 | ✅ |
| API-SUB-08 | `GET /:id` başkasının → 404 | yetki | api-e2e | T/authz-matrix:582 | ✅ |
| API-SUB-09 | `PATCH /v1/subscriptions/:id` rota yok → 404; kullanıcı aboneliğini doğrudan değiştiremez (süresi geçmiş kayıt 2099 ile premium olmaz) | yetki | api-e2e | T/subscriptions:70, T/authz-matrix:376 | ✅ |
| API-SUB-10 | PATCH rotası yok → 404; `userId` değişimi de mümkün değil | yetki | api-e2e | T/subscriptions:70, T/authz-matrix:376 | ✅ |
| API-SUB-11 | `DELETE /v1/subscriptions/:id` rota yok → 404; kullanıcı aboneliğini doğrudan değiştiremez, kayıt silinmez | yetki | api-e2e | T/subscriptions:99, T/authz-matrix:376 | ✅ |
| API-SUB-12 | `sync-user`: RC aktif değil + istemci `true` → aktifler `expired`, `isPremium:false` | yetki | api-e2e | T/subscriptions:162, :235 | ✅ |
| API-SUB-13 | `sync-user`: RC ulaşılamaz → DB durumu korunur | uç | api-e2e | T/subscriptions:179 | ✅ |
| API-SUB-14 | `sync-user`: RC aktif + DB'de aktif kayıt → true | normal | api-e2e | T/subscriptions:218 | ✅ |
| API-SUB-15 | `sync-user`: RC aktif ama DB'de aktif kayıt yok → `isPremium` false kalır (sync kayıt yaratmaz) | uç | api-e2e | — | ❌ |
| API-SUB-16 | `sync-user` prod + anahtar yok → istemci bayrağı yok sayılır | yetki | birim | U/subscriptions.service:205 | ✅ |
| API-SUB-17 | `sync-user` başkası → 403 | yetki | api-e2e | T/subscriptions:260, T/authz-matrix:582 | ✅ |
| API-SUB-18 | `isPremium` ⇔ ∃ `plan:premium, status:active, endDate ≥ şimdi` | normal | api-e2e | T/subscriptions-reconcile:87, :97, :103, :122 | ✅ |
| API-SUB-19 | Cron (30 dk): süresi geçmiş `active` → `expired`; `isPremium` iki yönlü eşitlenir; iki kez çalışması aynı sonucu verir | zaman | api-e2e | T/subscriptions-reconcile:77, :87, :97, :138 | ✅ |
| API-SUB-20 | Cron sınırı: `endDate` tam şimdi → hâlâ premium (`$gte`); 1 ms önce → düşer | zaman | api-e2e | T/subscriptions-reconcile:122 | ✅ |
| API-SUB-21 | `sync-user` `provider:'google'` → yalnız Google aboneliklerini düşürür, Apple kalır | uç | api-e2e | U/subscriptions.service:101 (aynalayan: updateMany süzgeci provider içerir; Apple kalır e2e yok) | 🟡 |

### 15. Webhooks — RevenueCat

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-WHK-01 | Secret yok/yanlış → 401 | yetki | api-e2e | T/webhooks:48, :55 | ✅ |
| API-WHK-02 | Prod'da `REVENUECAT_WEBHOOK_SECRET` tanımsız → 401; dev'de atlanır | yetki | birim | U/webhooks.controller:79, :89 | ✅ |
| API-WHK-03 | `SANDBOX`: bayrak yok → 200 etkisiz; `REVENUECAT_ALLOW_SANDBOX_EVENTS=true` → işlenir | uç | api-e2e | T/webhooks:63, U/webhooks.controller:112, :122 | ✅ |
| API-WHK-04 | `INITIAL_PURCHASE` → abonelik kaydı + `isPremium:true` | normal | api-e2e | T/webhooks:82 | ✅ |
| API-WHK-05 | `RENEWAL`, `UNCANCELLATION` → aynı grant | normal | api-e2e | T/webhooks:308 (RENEWAL e2e), U/webhooks.controller:201 (UNCANCELLATION yalnız birim/aynalayan) | 🟡 |
| API-WHK-06 | Aynı olay tekrarı (RC retry) → tek abonelik belgesi | eşzamanlılık | api-e2e | T/webhooks:105 | ✅ |
| API-WHK-07 | `EXPIRATION` → `isPremium:false` | normal | api-e2e | T/webhooks:132 | ✅ |
| API-WHK-08 | `BILLING_ISSUE` → premium düşmez; grace varsa bitiş grace sonuna uzar; yalnız `EXPIRATION` düşürür (karar A-09) | uç | api-e2e | T/webhooks:281, U/webhooks.controller:153 | ✅ |
| API-WHK-09 | Grant olayında `expiration_at_ms` yok → 200, kayıt yok | uç | api-e2e | T/webhooks:164 | ✅ |
| API-WHK-10 | `app_user_id` eşleşmez → 200 etkisiz; `original_app_user_id` eşleşirse işlenir | uç | api-e2e | T/webhooks:183 (yalnız eşleşmeyen; `original_app_user_id` eşleşme yolu testsiz) | 🟡 |
| API-WHK-11 | `event` alanı/`type`/`app_user_id` eksik → 200 `{received:true}` | uç | api-e2e | T/webhooks:199 | ✅ |
| API-WHK-12 | `NON_RENEWING_PURCHASE` → topup | normal | api-e2e | T/webhooks:209 | ✅ |
| API-WHK-13 | `CANCELLATION`, `PRODUCT_CHANGE`, `TRANSFER`, `SUBSCRIPTION_PAUSED`, `TEST` → 200 etkisiz (premium bitişe kadar sürer) | uç | api-e2e | U/webhooks.controller:262, T/webhooks:364 (CANCELLATION; PRODUCT_CHANGE/TRANSFER/SUBSCRIPTION_PAUSED/TEST testsiz) | 🟡 |
| API-WHK-14 | İşlemede beklenmeyen hata → 500 (RC tekrar denesin) | uç | birim | U/webhooks.controller:343 | ✅ |
| API-WHK-15 | Sırasız: `RENEWAL` işlendikten sonra gelen eski dönemin `EXPIRATION`'ı yeni aboneliği düşürmez (olay zamanına göre; RENEWAL sonrası üretilen EXPIRATION düşürür) | eşzamanlılık | api-e2e | T/webhooks:308 | ✅ |
| API-WHK-16 | Tekillik anahtarı: `event.id` > `transaction_id` > `type:user:product:purchased_at` | eşzamanlılık | birim | U/webhooks.controller:221, :276, :296, :312 | ✅ |
| API-WHK-17 | İade: abonelikte anında etki yok, RevenueCat `EXPIRATION` beklenir; kredi paketi iadesinde kalan bakiyeden düşülür (min 0, olay başına bir kez) (karar A-10) | uç | api-e2e | T/webhooks:364, :379, U/webhooks.controller:179 | ✅ |
| API-WHK-18 | `purchased_at_ms` yoksa başlangıç = şimdi | uç | birim | — | ❌ |
| API-WHK-19 | `store` `APP_STORE` → apple; diğer her şey (PLAY_STORE, PROMOTIONAL, STRIPE) → google | uç | birim | U/webhooks.controller:153 (yalnız PLAY_STORE → google), :201 (APP_STORE → apple); PROMOTIONAL/STRIPE testsiz | 🟡 |

### 16. UserDhikrs (kişisel zikir)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-UDH-01 | Aynı `clientId` ikinci POST → upsert, tek belge | normal | api-e2e | T/user-dhikrs:22, U/user-dhikrs.service:32 | ✅ |
| API-UDH-02 | `clientId` yoksa `auto-` ile üretilir | normal | api-e2e | T/user-dhikrs:78, U/user-dhikrs.service:56 | ✅ |
| API-UDH-03 | PATCH/DELETE başkasının `clientId`'si → 404 | yetki | api-e2e | T/user-dhikrs:89, T/authz-matrix:615 | ✅ |
| API-UDH-04 | Tokensız → 401 | yetki | api-e2e | T/user-dhikrs:123 | ✅ |
| API-UDH-05 | Ad yoksa sunucu varsayılan ad yazmaz (`name` boş/null); uygulama kendi dilinde gösterir (karar A-21) | dil | birim | T/user-dhikrs:55, U/user-dhikrs.service:69 | ✅ |
| API-UDH-06 | POST upsert gönderilmeyen alanları sıfırlar (`isFavorite:false`, `target:0`) | uç | api-e2e | — | ❌ |
| API-UDH-07 | Uzunluk: clientId/name ≤120, transliteration/arabic ≤240, meaning ≤500; target ≥0 tam sayı ≤100.000 (karar A-02); aşım → 400 | uç | api-e2e | T/validation-bounds:728, :738, :754, :764 | ✅ |
| API-UDH-08 | PATCH `name:''` → boş ad kabul ediliyor | uç | api-e2e | — | ❌ |
| API-UDH-09 | Kullanıcı başına kayıt sayısı sınırsız | uç | api-e2e | — | ❌ |

### 17. DhikrCollections

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-COL-01 | Tokensız; yalnız aktif koleksiyonlar listelenir | normal | api-e2e | T/dhikr-collections:29, T/authz-matrix:314 | ✅ |
| API-COL-02 | Detay döner; bilinmeyen key → 404 | normal | api-e2e | T/dhikr-collections:54 | ✅ |
| API-COL-03 | Detayda zikir sırası seed sırası | normal | birim | U/dhikr-collections.service:82 | ✅ |
| API-COL-04 | `category` filtresi | normal | birim | U/dhikr-collections.service:42 (aynalayan) | 🟡 |
| API-COL-05 | Detay inaktif/doğrulanmamış zikirleri de döndürür | uç | api-e2e | — | ❌ |
| API-COL-06 | Hiçbir koleksiyonda premium kilidi yok | normal | api-e2e | — | ❌ |

### 18. Devices (dil / saat dilimi)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-DEV-01 | Tokensız register 200, `userId:null` | normal | api-e2e | T/devices:22 | ✅ |
| API-DEV-02 | Geçerli token ile register → userId bağlanır | normal | api-e2e | T/devices:30 | ✅ |
| API-DEV-03 | Aynı `deviceId` ikinci register → tek belge, push token güncel | normal | api-e2e | T/devices:41 | ✅ |
| API-DEV-04 | `deviceId` <8 → 400; `platform:'web'` → 400 | uç | api-e2e | T/devices:65, T/validation-bounds:611, :632 | ✅ |
| API-DEV-05 | Unlink → `userId:null`, cihaz silinmez | normal | api-e2e | T/devices:77 | ✅ |
| API-DEV-06 | Geçersiz token ile register 200 (misafir gibi) | yetki | api-e2e | T/devices:92 | ✅ |
| API-DEV-07 | Misafir register, bağlı cihazın `userId`'sini silmez | uç | api-e2e | T/devices:184, U/devices.service:64 | ✅ |
| API-DEV-08 | `locale` tr/en dışı → 400; `timezone` IANA dışı veya >64 → 400 | dil | api-e2e | T/devices:115, :126, T/validation-bounds:617, :623 | ✅ |
| API-DEV-09 | `locale`/`timezone` gönderilmezse kayıtlı değer korunur | dil | birim | T/devices:146, U/devices.locale:37 | ✅ |
| API-DEV-10 | `prefs`: verilenler yazılır; verilmeyenler ilk kayıtta `true` | normal | api-e2e | T/devices:166 | ✅ |
| API-DEV-11 | Bilinmeyen `deviceId` unlink → 200, `null` | uç | api-e2e | T/devices:209 | ✅ |
| API-DEV-12 | register/unlink kimliksiz: `deviceId`'yi bilen başkası cihazı ayırabilir veya push token'ını değiştirebilir (bilinçli tasarım, risk düşük) | yetki | api-e2e | T/authz-matrix:343 (yalnız tokensız unlink 200; başkasının push token'ını değiştirme doğrulanmıyor) | 🟡 |
| API-DEV-13 | Expo `DeviceNotRegistered` → cihaz pasif + token silinir | uç | birim | U/push-sender.service:91, :112 | ✅ |
| API-DEV-14 | Hesap silme cihazı siler; sonraki açılışta yeniden register | normal | api-e2e | T/users:113 | ✅ |

### 19. Events (analitik)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-EVT-01 | Tokensız 50 olay → 200, hepsi yazılır | normal | api-e2e | T/events:30 | ✅ |
| API-EVT-02 | 51 olay → 400 | uç | api-e2e | T/events:42 | ✅ |
| API-EVT-03 | Karışık geçerli/geçersiz → 200, yalnız geçerliler | uç | api-e2e | T/events:50 | ✅ |
| API-EVT-04 | Ad `^[a-z_]{2,48}$`; `ts` ISO-8601; props ≤20 anahtar, string ≤200 | uç | birim | U/events.service:40, T/validation-bounds:660 | ✅ |
| API-EVT-05 | Geçerli token → `userId` bağlanır; geçersiz/yok → misafir | yetki | birim | U/events.service:73, :86, :96 | ✅ |
| API-EVT-06 | Olaylar 180 gün sonra silinir (TTL) | zaman | api-e2e | — | ❌ |
| API-EVT-07 | Boş `events` veya `deviceId` <8 → 400 | uç | api-e2e | T/validation-bounds:654 (yalnız boş `events` → 400; events için `deviceId` <8 testsiz) | 🟡 |
| API-EVT-08 | Kısmi yazım hatası → `accepted` = yazılan sayı, istek yine 200 | uç | birim | U/events.service:131 | ✅ |

### 20. PushCampaigns (winback, kandil-eve, kandil-day, weekly-summary)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-PSH-01 | `x-campaign-secret` yok/yanlış → 401 | yetki | api-e2e | T/push-campaigns:42, :49, :310 | ✅ |
| API-PSH-02 | Bilinmeyen kampanya → 400 (secret kontrolünden SONRA) | uç | api-e2e | T/push-campaigns:57, :322, U/push-campaigns.controller:82 | ✅ |
| API-PSH-03 | Prod'da secret tanımsız → 401; dev'de atlanır | yetki | birim | U/push-campaigns.controller:39, :48 | ✅ |
| API-PSH-04 | `dryRun` → rezervasyon/gönderim yok, sayılar döner | normal | api-e2e | T/push-campaigns:65, :335 | ✅ |
| API-PSH-05 | Sessiz saat cihazın yerel saatine göre 22:00 (dahil)–08:00 (hariç); `force` yok sayar | zaman | api-e2e | T/push-campaigns:81, :437, :466, U/push-campaigns.service:114, :129, U/push-locale:119 | ✅ |
| API-PSH-06 | Değişmez: rastgele an + IANA bölge için `sessiz ⇔ yerel saat ∈ [22,24) ∪ [0,8)`; DST günlerinde de | zaman | prop | T/push-campaigns:537 | ✅ |
| API-PSH-07 | Cihaz `timezone` yok/geçersiz → İstanbul saati | zaman | birim | T/push-campaigns:485, U/kandil.campaign:41 | ✅ |
| API-PSH-08 | Cihaz başına İstanbul günü başına en fazla 1 kampanya push'u (kampanyalar arası) | eşzamanlılık | api-e2e | T/push-campaigns:500, U/push-campaigns.service:97 | ✅ |
| API-PSH-09 | Aynı kampanya aynı gün ikinci tetik (GH cron gecikmesi) → 0 gönderim | eşzamanlılık | api-e2e | T/push-campaigns:513, U/push-campaigns.service:97 | ✅ |
| API-PSH-10 | Gönderim hatası → rezervasyon kalır, `meta.error`; aynı gün yeniden denenmez | uç | birim | U/push-campaigns.service:149 | ✅ |
| API-PSH-11 | Token'sız aday → `noToken` | uç | birim | — | ❌ |
| API-PSH-12 | Winback: `lastSeenAt` [3,4) veya [7,8) gün; `prefs.streak:false` → atla; prefs yok → dahil | zaman | birim | U/winback.campaign:22–69 | ✅ |
| API-PSH-13 | `kandil-eve`: İstanbul yarını kandil; `kandil-day`: İstanbul bugünü; ay devri doğru | zaman | birim | U/kandil.campaign:13, :17, :21, T/push-campaigns:195, :208 | ✅ |
| API-PSH-14 | Kandil `prefs.specialDays:false` → atla | normal | birim | U/kandil.campaign:113, T/push-campaigns:527 | ✅ |
| API-PSH-15 | Kandil EN cihazda `name.en` (boşsa tr) | dil | birim | U/push-locale:53, T/push-campaigns:349 | ✅ |
| API-PSH-16 | `kandil-eve` / `kandil-day` hedef günü cihazın kayıtlı saat dilimine göre (bölge yok/geçersiz → İstanbul); aynı 02:00 UTC turu her cihazda yerel akşama denk gelmez (karar A-18) | zaman | birim | T/push-campaigns:127 (:195, :200, :208), U/kandil.campaign:28, :41, :49 | ✅ |
| API-PSH-17 | Weekly-summary: geçen İstanbul Pzt–Paz; premium sayı+aktif gün, ücretsiz yalnız sayı; 0 aktivite atlanır; kullanıcının tüm cihazları | normal | birim | U/weekly-summary.campaign:9–98, T/push-campaigns:380 | ✅ |
| API-PSH-18 | Haftalık özet push'u "seri hatırlatma" tercihine (`prefs.streak:false` → atla) bağlı (karar A-17) | normal | birim | U/weekly-summary.campaign:103 | ✅ |
| API-PSH-19 | EN şablonlar tekil/çoğul doğru; fazilet/ödül vaadi yok; locale yok → tr | dil | birim | U/push-locale:82, :97, T/push-campaigns:349, :380 | ✅ |
| API-PSH-20 | Halka push'ları (tamamlanma/katılım) kampanya günlük tavanına tabi değil | uç | birim | — | ❌ |
| API-PSH-21 | Expo bilet/chunk hatası → kampanya bunu `sent` saymaz, `skipped.error` artar, `meta.error` yazılır (B17 çözüldü, 78869ad) | uç | birim | T/push-campaigns:214, U/push-campaigns.service:168 | ✅ |
| API-PSH-22 | `push_dispatches` 30 gün sonra silinir | zaman | api-e2e | — | ❌ |

### 21. Vird programları (CRUD, activate, limitler)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-VRD-01 | `GET /programs`: yalnız kendi, `updatedAt` azalan | yetki | api-e2e | T/route-coverage:366, T/authz-matrix:633 | ✅ |
| API-VRD-02 | Ücretsiz manuel: 3 farklı zikir 201, 4. → 403 `VIRD_FREE_LIMIT_DHIKRS` | normal | api-e2e | T/vird:147, U/vird-programs.service:164, :180 | ✅ |
| API-VRD-03 | Aynı zikir iki dilimde tek sayılır | uç | birim | U/vird-programs.service:197 | ✅ |
| API-VRD-04 | Premium manuelde zikir sınırı yok | normal | birim | U/vird-programs.service:228 | ✅ |
| API-VRD-05 | Ücretsiz `reminders.enabled:true` (create/PATCH) → 403 `VIRD_PREMIUM_REQUIRED` | yetki | api-e2e | T/vird:162, U/vird-programs.service:244, :660 | ✅ |
| API-VRD-06 | Ücretsiz PATCH `reminders.enabled:false` veya kayıtlı `true` ama payload'da yok → izin | uç | birim | U/vird-programs.service:718, :749 | ✅ |
| API-VRD-07 | Ücretsiz ikinci aktif → 403 `VIRD_FREE_LIMIT_ACTIVE` | normal | api-e2e | T/vird:183, U/vird-programs.service:482 | ✅ |
| API-VRD-08 | Ücretsiz iki eşzamanlı activate → ≤1 aktif, ≥1 403 (ikisi de geri alınabilir → 0 aktif kabul) | eşzamanlılık | api-e2e | T/vird:206 | ✅ |
| API-VRD-09 | Premium 10 aktif, 11. → 403 `PREMIUM_MAX_ACTIVE_PROGRAMS` | normal | api-e2e | T/vird:313 | ✅ |
| API-VRD-10 | Premium iki eşzamanlı activate (limit altı) → ikisi de aktif | eşzamanlılık | api-e2e | T/vird:353 | ✅ |
| API-VRD-11 | Şablon: premium şablon ücretsizde → 403; klasik şablon ücretsizde → 201 | yetki | api-e2e | T/vird:250 | ✅ |
| API-VRD-12 | Şablon yok/inaktif/süresi geçmiş → 404; zikirlerin hiçbiri çözülemez → 422 | uç | birim | U/vird-programs.service:373, :388 | ✅ |
| API-VRD-13 | Şablonda `startDate` yoksa `anchorDate`, o da yoksa istek tz'sinde bugün | zaman | birim | U/vird-programs.service:405 | ✅ |
| API-VRD-14 | `source` template/ai ama `templateKey` yok: ücretsiz → 403; premium → boş fazlı taslak olabilir | uç | birim | U/vird-programs.service:270, :287 | 🟡 |
| API-VRD-15 | Manuel fazsız → 400 `VIRD_PHASES_REQUIRED` | uç | birim | U/vird-programs.service:428 | ✅ |
| API-VRD-16 | Manuel `startDate` yok → 400 | uç | api-e2e | — | ❌ |
| API-VRD-17 | Aynı `clientId` tekrar → 409 (manuel ve şablon) | eşzamanlılık | birim | U/vird-programs.service:440, :454 | ✅ |
| API-VRD-18 | `clientId` yoksa sunucu `srv-…` üretir; iki clientId'siz program çakışmaz | uç | api-e2e | — | ❌ |
| API-VRD-19 | Başkasının programı (GET/PATCH/DELETE/activate) → 404 | yetki | api-e2e | T/vird:281, T/authz-matrix:633 | ✅ |
| API-VRD-20 | PATCH `status:'active'` → 400 (activate ucu) | uç | api-e2e | T/vird:296, U/vird-programs.service:627 | ✅ |
| API-VRD-21 | Activate yalnız draft/paused; active/completed/archived → 400 `VIRD_NOT_ACTIVATABLE` | uç | birim | U/vird-programs.service:568, :577 | ✅ |
| API-VRD-22 | Aynı programa çift activate (eşzamanlı) → ikisi de aktif programı döner | eşzamanlılık | api-e2e | — | ❌ |
| API-VRD-23 | Activate öncesi süresi geçmiş journey'ler `completed` olur, limite sayılmaz | zaman | birim | U/vird-programs.service:590 | ✅ |
| API-VRD-24 | Activate taslak silinme süresini (`expiresAt`) temizler | normal | birim | U/vird-programs.service:504 | ✅ |
| API-VRD-25 | PATCH paused/completed/archived → `expiresAt` temizlenir; aktif → `draft` dönüşünde silinme süresi yeniden kurulmaz | uç | api-e2e | — | ❌ |
| API-VRD-26 | Arşiv tavanı 20; aşınca en eski silinir | uç | birim | U/vird-programs.service:770, :804 | ✅ |
| API-VRD-27 | Manuel journey fazları AI kuralıyla: 1. günden başlar, boşluk/çakışma/`toDay<fromDay` yok; aksi 400 `VIRD_PHASES_INVALID` (create ve PATCH) (karar A-24) | uç | api-e2e | T/vird:620, :639, U/vird-phases:44, :58, :67, :83 | ✅ |
| API-VRD-28 | Bitişi geçmiş journey activate → 400 `VIRD_PROGRAM_EXPIRED` ("süresi doldu, kopyalayıp yeniden başlat"), taslak kalır; "bugün" istek saat dilimine göre (karar A-23) | zaman | api-e2e | T/vird:553, :585 | ✅ |
| API-VRD-29 | Aynı dilimde aynı zikir tekrarı → ilki tutulur | uç | birim | — (U/vird-day:182 tersini belgeliyor: tekrar iki girdi, aynı `itemKey` çakışır; "ilki tutulur" doğrulanmıyor) | ❌ |
| API-VRD-30 | `phases` ≤60, `target` ≥1 tam sayı, `prayerSelection` 1..5; boş liste → [1..5] | uç | api-e2e | T/validation-bounds:792, :805, U/vird-day:162 | ✅ |
| API-VRD-31 | Premium biten kullanıcının mevcut programları korunur; yeni aktifleştirme ücretsiz limite takılır; vird hatırlatmaları durur (karar A-07) | uç | api-e2e | T/vird:183 (yeni aktivasyon engeli), src/features/vird/services/vird-reminder-notifications.test.ts:99 (hatırlatma durur); fazla aktif programın korunduğu API testi yok | 🟡 |
| API-VRD-32 | Aktif programı silmek serbest; o programın gün ilerlemeleri ve vird serisi kalır | uç | api-e2e | T/route-coverage:520 (aktif silinir), :538 (günlük ilerleme history'de kalır; vird serisi doğrulanmıyor) | 🟡 |
| API-VRD-33 | Manuel/şablon taslak 30 gün sonra silinir | zaman | api-e2e | — | ❌ |
| API-VRD-34 | Journey `dayCount`/`endDate` = en büyük `toDay` (yoksa `fromDay`); routine'de `endDate` yok | normal | birim | T/vird:585 (journey `endDate` = başlangıç + en büyük `toDay` - 1, dolaylı); `dayCount` ve routine'de `endDate` yok testsiz | 🟡 |

### 22. Vird ilerleme (today / history)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-VPR-01 | Log → dilim `done` → tüm dilimler → `isDayComplete`; history aralığı | normal | api-e2e | T/vird:387 | ✅ |
| API-VPR-02 | Süresi geçmiş journey `/today` çağrısında `completed` olur | zaman | api-e2e | T/vird:481 | ✅ |
| API-VPR-03 | `endDate` = bugün → henüz tamamlanmaz | zaman | birim | U/complete-expired-journeys:25 | ✅ |
| API-VPR-04 | Routine asla otomatik tamamlanmaz | normal | birim | U/vird-progress.service:227 | ✅ |
| API-VPR-05 | Aktif program yok → `program:null`, `slots:{}`, vird serisi | uç | birim | U/vird-progress.service:143 | ✅ |
| API-VPR-06 | `programId` verilirse yalnız aktifse; paused → `program:null` (404 değil) | uç | birim | U/vird-progress.service:212 | ✅ |
| API-VPR-07 | `programId` biçimi bozuk (yerel clientId) → 400 | uç | api-e2e | T/validation-bounds:1072 | ✅ |
| API-VPR-08 | `programId` yoksa en son güncellenen aktif program | normal | birim | U/vird-progress.service:252 (yalnız programId süzgeci; "en son güncellenen" sırası testsiz) | 🟡 |
| API-VPR-09 | `prayer` dilimi `prayerSelection` başına genişler; item bazlı `completed` | normal | birim | U/vird-progress.service:157 | ✅ |
| API-VPR-10 | `date` program başlangıcından önce → boş dilimler | uç | birim | U/vird-progress.service:241 | ✅ |
| API-VPR-11 | History: varsayılan son 30 gün (bugün dahil, istek tz'si); >400 gün → `to`'dan geriye kırpılır; `from>to` → boş | uç | birim | U/vird-progress.service:270, T/validation-bounds:228, :237 (varsayılan 30 gün testsiz) | 🟡 |
| API-VPR-12 | Vird logu son yazan kazanır; daha düşük sayı günü tamamlanmamışa çevirebilir | uç | api-e2e | — | ❌ |
| API-VPR-13 | Draft/paused/completed programa yazılan vird logu ilerleme ve vird serisi üretir | uç | api-e2e | — | ❌ |
| API-VPR-14 | Başka kullanıcının `virdProgramId`'si ile log → log yazılır, ilerleme türetilmez, karşı tarafın verisi etkilenmez | yetki | api-e2e | U/vird-progress.service:79 (yalnız birim: program bulunamazsa türetim yok; e2e yok) | 🟡 |
| API-VPR-15 | `dayIndex` saf takvim farkı (DST'den bağımsız), başlangıç = 1 | zaman | birim | U/vird-day:15, :23 | ✅ |

### 23. Vird şablonları

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-VTP-01 | Tokensız 200; inaktif görünmez | normal | api-e2e | T/vird:118 | ✅ |
| API-VTP-02 | İnaktif key → 404 | uç | api-e2e | T/vird:129 | ✅ |
| API-VTP-03 | Bitmiş journey şablonu gizlenir/404; klasik şablon asla gizlenmez | zaman | birim | U/vird-templates.service:107, :137, :156 | ✅ |
| API-VTP-04 | Olay ailesi şablonu tarihini `special_days`'ten çözer; kayıt yoksa gizlenir; sürmekte olan yolculuk kaymaz | zaman | birim | U/vird-templates.service:410, :424, :498 | ✅ |
| API-VTP-05 | Çözülemeyen zikir item'ı atlanır, boş dilim düşer | uç | birim | U/vird-templates.service:190, :239 | ✅ |
| API-VTP-06 | Zikir ve özel gün çözümü 10 dk önbellekli | normal | birim | U/vird-templates.service:375, :384, :554, :564 (aynalayan) | 🟡 |
| API-VTP-07 | Listede `isPremium` bayrağı döner (misafir dahil) | normal | api-e2e | U/vird-templates.service:82 (özet şekli; misafir/e2e yok) | 🟡 |
| API-VTP-08 | Önbellek aileye göre ve istek "bugün"üne göre ayrı girdi; farklı tz'deki istek başkasının günüyle çözülmüş çapayı görmez (B18 çözüldü, 78869ad) | zaman | birim | U/vird-templates.service:593 | ✅ |

### 24. Zikir Halkası (circles)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-CIR-01 | Ücretsiz ilk halka 201, `memberLimit:5` | normal | api-e2e | T/circles:103 | ✅ |
| API-CIR-02 | Ücretsiz ikinci aktif halka → 403 `CIRCLE_PREMIUM_REQUIRED` | yetki | api-e2e | T/circles:116 | ✅ |
| API-CIR-03 | Ücretsiz: önceki halka completed/closed ise yeni halka kurabilir | normal | api-e2e | — | ❌ |
| API-CIR-04 | Ücretsiz: bitişi geçmiş ama henüz kapanmamış (`active`) halka pasif sayılır → yeni halka izinli (paywall yok) | zaman | api-e2e | T/race:923 | ✅ |
| API-CIR-05 | Premium 201, kod `^[A-HJ-NP-Z2-9]{8}$`, `memberLimit:200` | normal | api-e2e | T/circles:134 | ✅ |
| API-CIR-06 | Premium 10 aktif → 11. `CIRCLE_MAX_ACTIVE`; birini kapatınca yenisi açılır | normal | api-e2e | T/race:713, U/circles.service:189 | ✅ |
| API-CIR-07 | Paralel create tavanı bir aşabilir (kabul edilen sapma) | eşzamanlılık | api-e2e | T/race:734 | ✅ |
| API-CIR-08 | `endDate` geçmiş → 400 `CIRCLE_END_DATE_PAST`; bugün kabul | zaman | api-e2e | T/circles:143, U/circles.service:254, :269 | ✅ |
| API-CIR-09 | `endDate` "bugün"ü kurucunun tz'sine göre (LA günü kabul, başlıksız İstanbul) | zaman | birim | U/circles.locale:110, :117 | ✅ |
| API-CIR-10 | `goalCount` 1..10.000.000 tam sayı; 0, 10M+1, 1.5 → 400 | uç | api-e2e | T/circles:158, U/create-circle.dto:14, :19, :24 | ✅ |
| API-CIR-11 | Ad 2..60; yoksa `name` null (sunucu varsayılan ad yazmaz; uygulama zikir adını kendi dilinde gösterir) (karar A-21) | dil | birim | T/circles:369, T/race:1030, U/circles.service:204, U/create-circle.dto:43, :48 | ✅ |
| API-CIR-12 | Bilinmeyen/inaktif zikir → 404 | uç | birim | U/circles.service:226, :239 | ✅ |
| API-CIR-13 | Kod çakışmasında yeni kod; 3 denemede olmazsa 409; 30 paralel create benzersiz kod | eşzamanlılık | api-e2e | T/race:656, :681, U/circles.service:324, :342 | ✅ |
| API-CIR-14 | Preview tokensız; kod, üye listesi, `myTotal`, `creatorId` dönmez | yetki | api-e2e | T/circles:171, T/race:765, T/authz-matrix:671 | ✅ |
| API-CIR-15 | Preview kodu normalize (küçük harf, tire, boşluk); bilinmeyen → 404 | uç | api-e2e | T/circles:185, :196 | ✅ |
| API-CIR-16 | Preview, bitişi geçmiş ama kapanmamış halkayı `closed` gösterir | zaman | api-e2e | T/race:933 | ✅ |
| API-CIR-17 | Join idempotent: zaten üye → yazım ve push yok (halka kapalı olsa bile 200) | uç | api-e2e | T/circles:202, U/circles.service:692 (kapalı halkada 200 testsiz) | 🟡 |
| API-CIR-18 | Ücretsiz kurucunun halkası 5 üyede dolar → 403 `CIRCLE_FULL` | normal | api-e2e | T/circles:222 | ✅ |
| API-CIR-19 | `memberLimit`'siz eski halka 200 varsayılan | uç | api-e2e | T/circles:252, U/circles.service:638 | ✅ |
| API-CIR-20 | Kapalı/tamamlanmış halkaya join → 403 `CIRCLE_NOT_ACTIVE` | normal | api-e2e | T/race:301, U/circles.service:711, :722 | ✅ |
| API-CIR-21 | Bitişi geçmiş ama `active` halkaya join reddedilir → 403 `CIRCLE_NOT_ACTIVE` | zaman | api-e2e | T/race:939 | ✅ |
| API-CIR-22 | 230 eşzamanlı join → tam 200 üye, gerisi `CIRCLE_FULL` | eşzamanlılık | api-e2e | T/race:256 | ✅ |
| API-CIR-23 | Aynı kullanıcı 20 paralel join → 1 üyelik, en fazla 1 push | eşzamanlılık | api-e2e | T/race:280 | ✅ |
| API-CIR-24 | Kurucuya "X katıldı" push'u cihaz dili başına; misafir adı gizli ("Bir kardeşin"/"Someone") | dil | birim | U/circles.locale:148 | ✅ |
| API-CIR-25 | Push hatası katılımı bozmaz | uç | birim | U/circles.service:732 | ✅ |
| API-CIR-26 | "X katıldı" push'u aynı kişi için halka başına bir kez: ayrılıp yeniden katılınca kurucuya ikinci push gitmez (karar A-06) | uç | birim | T/race:952, :961 | ✅ |
| API-CIR-27 | Katkı toplamı: 3 üye, aynı üye 10→30→20 → 30 | normal | api-e2e | T/circles:282 | ✅ |
| API-CIR-28 | Değişmez: `totalCount = Σ_{üye,gün} max(count)`; yazım sırasından bağımsız; asla azalmaz | eşzamanlılık | prop | T/race:339, :386 (örnek tabanlı 100 üye × 3 flush; fast-check yok) | 🟡 |
| API-CIR-29 | Hedef dolunca `completed`, tek `completedAt`, tüm üyelere tek push | eşzamanlılık | api-e2e | T/race:453, T/circles:347, U/circles.service:993 | ✅ |
| API-CIR-30 | Toplam = hedef (tam eşitlik) → tamamlanır | uç | birim | U/circles.service:1103 | ✅ |
| API-CIR-31 | Tamamlanma anında/sonrasında gelen katkı kabul edilir; toplam hedefin üstüne taşabilir, `completed` kalır (karar A-01) | eşzamanlılık | api-e2e | T/circles:347, T/race:453, :483 | ✅ |
| API-CIR-32 | Completed veya süresi dolmuş halkaya katkı KABUL edilir (toplam hedefi aşabilir); yalnız kurucunun elle kapattığı halkada → 403 `CIRCLE_NOT_ACTIVE`, log yok (karar A-01) | zaman | api-e2e | T/race:483, :882, U/circles.service:875, :891, :906 | ✅ |
| API-CIR-33 | Üye değil → 403 `CIRCLE_NOT_MEMBER` (var olmayan halka da 403, 404 değil) | yetki | api-e2e | T/circles:384, T/race:553, U/circles.service:861 | ✅ |
| API-CIR-34 | Farklı zikir veya özel zikir → 400 `CIRCLE_DHIKR_MISMATCH` | uç | api-e2e | T/circles:394, U/circles.service:847, :945 | ✅ |
| API-CIR-35 | Aynı kullanıcı iki cihaz aynı gün → `$max`, toplanmaz | eşzamanlılık | api-e2e | T/race:339 | ✅ |
| API-CIR-36 | Halka logu `date` yalnız kuruluş günü … bugün (+1 saat dilimi payı) arası; dışı → 400 (karar A-03) | zaman | api-e2e | T/circles:324 | ✅ |
| API-CIR-37 | Tek log `count` ≤ 100.000; aşarsa 400 (halka hilesi koruması) (karar A-02) | uç | api-e2e | T/dhikr-logs:295, T/validation-bounds:253 | ✅ |
| API-CIR-38 | Bitişten/tamamlanmadan sonra gelen (cihazda bekleyen) katkı kabul edilir ve toplama eklenir; yalnız elle kapatılan halka reddeder (karar A-01) | zaman | api-e2e | T/race:483, U/circles.service:891, :906 | ✅ |
| API-CIR-39 | Leave: kurucu → 403 `CIRCLE_CREATOR_ONLY`; üye çıkar; `totalCount` ve loglar korunur | normal | api-e2e | T/circles:407, :436, T/race:631 | ✅ |
| API-CIR-40 | Leave üye değil/bilinmeyen → 404 | yetki | birim | T/authz-matrix:671, U/circles.service:802 | ✅ |
| API-CIR-41 | Close yalnız kurucu ve aktifken; kurucu olmayan, kapalı veya tamamlanmış → 404 (403 değil) | yetki | api-e2e | T/circles:407, T/authz-matrix:693, U/circles.service:827 (kapalı/tamamlanmış halkada close e2e yok) | 🟡 |
| API-CIR-42 | 50 join + eşzamanlı close → yalnız aktifken katılanlar üye | eşzamanlılık | api-e2e | T/race:301 | ✅ |
| API-CIR-43 | `GET /circles`: bitişi geçmiş aktif halkalar tek adımda `closed`; `createdAt` azalan; halka başına `myTotal` | zaman | api-e2e | T/race:882, T/route-coverage:692, U/circles.locale:369, U/circles.service:388, :447 | ✅ |
| API-CIR-44 | `GET /circles/:id` üye değil/ayrılmış → 404 | yetki | api-e2e | T/authz-matrix:671, U/circles.service:458 | ✅ |
| API-CIR-45 | `?date=` gün anahtarı; bozuk → 400; yoksa istek tz'sinde bugün | zaman | birim | U/circles.service:552, :563, :574 | ✅ |
| API-CIR-46 | Detayda bireysel sayı yok; `activeToday` bayrağı + `activeTodayCount` yalnız mevcut üyeler | yetki | birim | U/circles.service:489 | ✅ |
| API-CIR-47 | Misafir varsayılan ad → `defaultName:true`, `displayName` aynen | dil | birim | U/circles.locale:127 | ✅ |
| API-CIR-48 | `expiresAt` = `endDate`+1 gününün kurucu tz'sindeki gece yarısı (LA, Auckland, DST) | zaman | birim | U/circles.locale:275, :299, :339 | ✅ |
| API-CIR-49 | `expiresAt`'siz eski halka İstanbul gününe göre kapanır | zaman | birim | U/circles.locale:316, :329 | ✅ |
| API-CIR-50 | Tamamlanmış halka asla `closed`'a çevrilmez | uç | birim | U/circles.locale:455 | ✅ |
| API-CIR-51 | Kurucu premium'u kaybederse halka ve `memberLimit` sürer (karar A-07) | uç | api-e2e | — | ❌ |
| API-CIR-52 | Kurucu hesabını silerse kuruculuk en eski aktif üyeye geçer (push "yöneticisi oldun"); üye yoksa halka kapanır; tamamlanmış halkaya dokunulmaz; devralanın limiti aynen korunur (karar A-04) | uç | api-e2e | T/users:195, T/race:977, :993, :1010 | ✅ |
| API-CIR-53 | Üye hesabını silerse: üyelik çıkar, logları silinir; katkısı halka toplamında kalır, `totalCount` düşmez (karar A-05) | uç | api-e2e | T/users:144 (yalnız üyelik çıkışı; `totalCount` korunumu testsiz) | 🟡 |
| API-CIR-54 | Sade log halka toplamına girmez | normal | api-e2e | T/race:606 | ✅ |
| API-CIR-55 | Tamamlanma push'u cihaz dili başına; EN metinde vaat yok | dil | birim | U/push-locale:20 | ✅ |
| API-CIR-56 | Halka ve vird zikirleri seri/toplam/rozetlere sayılır; istatistik kaynak dağılımında "circle" kovası (karar A-14) | uç | api-e2e | T/stats:117 | ✅ |

---

### 25. Yetki matrisi

Kural: JWT rotalarında token yoksa/bozuksa **401**. Başkasının kaynağı için davranış rota başına farklıdır (aşağıda). Admin rotaları `x-admin-secret`, iç rotalar kendi secret'ı ister.

| Rota | Kimlik | Tokensız | Başkasının kaynağı | Test |
|---|---|---|---|---|
| `GET /health`, `GET /app-config` | açık | 200 | — | T/app:27, :35; T/authz-matrix:267 |
| `POST /v1/auth/provider/verify`, `/auth/refresh` | açık | 200/4xx | — | T/auth:100; T/authz-matrix:361 |
| `GET /v1/dhikrs`, `/verified-active`, `/lookup`, `/:id` | açık | 200 | — | T/dhikrs:31; T/authz-matrix:271 |
| `POST/PATCH/DELETE /v1/dhikrs` | admin secret | 401 | — | T/dhikrs:69; T/authz-matrix:184 |
| `GET /v1/dhikr-collections`, `/:key` | açık | 200 | — | T/dhikr-collections:29; T/authz-matrix:267 |
| `GET /v1/vird/templates`, `/:key` | opsiyonel JWT | 200 | — | T/vird:118; T/authz-matrix:271 |
| `GET /v1/circles/preview/:code` | açık | 200 | kişisel veri dönmez | T/circles:171; T/authz-matrix:671 |
| `POST /v1/devices/register` | opsiyonel JWT | 200 | deviceId bilen değiştirebilir | T/devices:22; T/authz-matrix:326 |
| `POST /v1/devices/unlink` | açık | 200 | deviceId bilen ayırabilir | T/devices:77; T/authz-matrix:343 |
| `POST /v1/events` | opsiyonel JWT | 200 | — | T/events:30; T/authz-matrix:326 |
| `POST /v1/webhooks/revenuecat` | Bearer webhook secret | 401 | — | T/webhooks:48; T/authz-matrix:234 |
| `POST /internal/campaigns/:campaign` | `x-campaign-secret` | 401 | — | T/push-campaigns:42; T/authz-matrix:212 |
| `POST/PATCH/DELETE /v1/special-days` | admin secret | 401 | — | T/special-days:127; T/authz-matrix:184 |
| `GET /v1/special-days`, `/home`, `/:id/detail`, `/:id` | açık (misafir dahil) (karar A-22) | 200 | paylaşımlı veri | T/special-days:176; T/authz-matrix:267 |
| `GET/PATCH/DELETE /v1/users/:id…` | JWT | 401 | **403** | T/users:23; T/authz-matrix:401 |
| `POST /v1/dhikr-logs`, `/bulk` | JWT | 401 | gövde userId yok sayılır | T/dhikr-logs:39; T/authz-matrix:419 |
| `GET /v1/dhikr-logs`, `DELETE by-dhikr`, `PATCH favorite/by-dhikr` | JWT | 401 | yalnız kendi kapsamı | T/authz-matrix:419 |
| `GET /v1/dhikr-logs/:id` | JWT | 401 | **404** | T/authz-matrix:419 |
| `GET /v1/streaks/:userId`, `POST …/recalculate` | JWT | 401 | **403** | T/streaks:52; T/authz-matrix:490 |
| `POST /v1/streaks/recalculate-all` | JWT | 401 | herkese 403 | T/streaks:62; T/authz-matrix:490 |
| `GET /v1/stats/summary` | JWT | 401 | yalnız kendi | T/authz-matrix:499 |
| `POST /v1/ai/recommendations`, `GET /recommendations`, `/quota`, `/credits`, `POST /vird-programs` | JWT | 401 | yalnız kendi | T/authz-matrix:515 (öneri liste/select; quota/credits/vird-programs için yalnız 401 testi) |
| `PATCH /v1/ai/recommendations/:id/select` | JWT | 401 | **404** | T/authz-matrix:515 |
| `/v1/ai/chat/conversations` (POST, GET, `/stream`) | JWT | 401 | yalnız kendi | T/authz-matrix:558 |
| `/v1/ai/chat/conversations/:id/messages` (POST, GET, `/stream`) | JWT | 401 | **404** | T/ai-chat:99; T/authz-matrix:558 |
| `POST /v1/subscriptions` | JWT | 401 | **403** (gövde userId) | T/subscriptions:196 |
| `GET /v1/subscriptions` | JWT | 401 | **403** (`?userId`) | T/subscriptions:207 |
| `GET /v1/subscriptions/:id` (PATCH/DELETE rotaları kaldırıldı → 404) | JWT | 401 | **404** | T/authz-matrix:582, :376 |
| `POST /v1/subscriptions/sync-user/:userId` | JWT | 401 | **403** | T/subscriptions:260 |
| `/v1/user-dhikrs` (POST, GET, PATCH/DELETE `:clientId`) | JWT | 401 | **404** | T/user-dhikrs:89, :123; T/authz-matrix:615 |
| `/v1/vird/programs…`, `/today`, `/history` | JWT | 401 | **404** | T/vird:281; T/authz-matrix:633 |
| `POST /v1/circles`, `GET /v1/circles`, `POST /join` | JWT | 401 | — | T/authz-matrix:126 (yalnız 401) |
| `GET /v1/circles/:id`, `POST :id/leave`, `POST :id/close` | JWT | 401 | **404** (close kurucu değilse de 404) | U/circles.service:458, :827; T/authz-matrix:671, :693 |
| WS `/ai-progress` | yok | bağlanır | socketId bilen adım alır | T/ai-streaming:323, :372 (socketId yönlendirmesi) |

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-YTK-01 | Tüm JWT rotaları tokensız → 401 (tablodaki her satır için parametrik test) | yetki | api-e2e | T/authz-matrix:126 (48 JWT rotası) | ✅ |
| API-YTK-02 | Tüm JWT rotaları süresi geçmiş/yanlış imzalı token → 401 | yetki | api-e2e | T/authz-matrix:170 (7 bozuk token türü), T/auth:100 | ✅ |
| API-YTK-03 | "Başkasının kaynağı" sütunundaki her satır belirtilen kodu döner (403 veya 404), veri sızmaz | yetki | api-e2e | T/authz-matrix:401, :419, :490, :499, :515, :558, :582, :615, :633, :671, :693 (14 senaryo) | ✅ |
| API-YTK-04 | Admin rotaları: kullanıcı token'ı yetmez; `ADMIN_API_SECRET` tanımsızken fail-closed | yetki | api-e2e | T/authz-matrix:184, :188, :192, :199; U/admin-secret.guard:18 (fail-closed); T/dhikrs:69, T/special-days:127 | ✅ |
| API-YTK-05 | Throttler yok: aynı uca sınırsız istek kabul edilir (bilinen durum; kod tahmini 32^8) | yetki | yük | — | ❌ |

### 26. Doğrulama sınırları

Genel kural: global `ValidationPipe` `whitelist:true`, `transform:true`, `forbidNonWhitelisted` **yok** → bilinmeyen alan 400 değil sessizce elenir (T/dhikr-logs:54). Tip uymazsa 400.

| Alan | Kural | Sınır vakaları (test edilecek) | Durum |
|---|---|---|---|
| Tarih anahtarları (`date`, `dateFrom/To`, `startDate`, `endDate`, `from/to`, `?date=`) | `^\d{4}-\d{2}-\d{2}$` | `2026-9-1` → 400; `2026-02-30` → 400; `2026-13-01` → 400 (B19 düzeltildi, `@IsDateKey`) | ✅ T/validation-bounds:167, :177, :184, :207 (B19 ÇÖZÜLDÜ 26bcf18) |
| `dhikr-logs.count`, `targetCount`, `sessionDuration` | `count` tam sayı 0..100.000 (karar A-02); `targetCount`/`sessionDuration` tam sayı ≥0, üst sınır yok | count: -1, 1.5, 0, 100.000, 100.001, 2^31 (400); targetCount/sessionDuration: -1, 1.5, 0, 2^31 | ✅ T/validation-bounds:247, :253, :257, :263, :270, :276 |
| `dhikr-logs/bulk.items` | ≥1, üst sınır yok | 0, 1, 1000 | ✅ T/validation-bounds:330, :338, :342, :348 (1000 eleman → 413 gövde sınırı) |
| `virdPrayerIndex` 1..5, `virdDayIndex` ≥1 |  | 0, 6 | ✅ T/validation-bounds:283, :289 |
| `circles.goalCount` | 1..10.000.000 tam sayı | 0, 1, 10M, 10M+1, 1.5 | ✅ U/create-circle.dto:14, T/validation-bounds:365, :371 |
| `circles.name` | 2..60 | 1, 2, 60, 61, yalnız boşluk | ✅ T/validation-bounds:378, :384, :387 (yalnız boşluk kırpılır, ad yazılmaz: karar A-21) |
| `circles.join.code` | 8..16 karakter, normalize | 7, 8, `abcd-efgh`, 17 | ✅ T/validation-bounds:419, :430 |
| `ai.recommendations.maxRecommendations` | 1..5 | 0, 1, 5, 6 | ✅ T/validation-bounds:455, :461 |
| `ai.recommendations.freeText` | sınır yok | 10.000 karakter (maliyet) | ✅ T/validation-bounds:477 (üst sınır yok, bilinçli) |
| `ai.*.flowId` | UUID v4 | v1 UUID, boş | ✅ T/validation-bounds:468, :481 |
| `ai.vird-programs.durationDays` | 7/14/30 | 0, 8, 30 | 🟡 T/validation-bounds:481 (0, 8 → 400; 14/30 geçerli vakası yok) |
| `ai.chat.message/firstMessage` | 1..2000 | 0, `"   "`, 2000, 2001 | 🟡 T/validation-bounds:569, :577 (firstMessage); `message` ucunda yalnız boşluk T/ai-chat:262, 2000/2001 yok |
| `ai.chat.page/limit` | page ≥1; 1 ≤ limit ≤50 | 0, 51, `abc` | ✅ T/validation-bounds:580, :594 |
| `devices.deviceId` | ≥8 | 7, 8 | ✅ T/devices:65, T/validation-bounds:611 |
| `devices.locale` / `timezone` | tr/en; IANA ≤64 | `de`, `Mars/Base`, 65 karakter | ✅ T/devices:126, T/validation-bounds:617, :623 |
| `events.events` | 1..50 | 0, 50, 51 | ✅ T/events:42, T/validation-bounds:654 |
| `users.reminderTime` | `HH:mm` | `23:59`, `24:00`, `8:00` | ✅ T/validation-bounds:670 |
| `vird.phases` | ≤60, `fromDay` ≥1, `toDay` ≥1, `target` ≥1 | 61 faz, `toDay<fromDay`, boşluk, çakışma, 1. günden başlamama | ✅ T/validation-bounds:792; T/vird:626 (toDay<fromDay, boşluk/çakışma → 400, karar A-24); U/vird-phases:18 |
| `user-dhikrs` metin alanları | 120/240/500 | sınır ±1 | ✅ T/validation-bounds:728, :738 |
| `x-client-timezone` | geçerli IANA, ≤64; değilse İstanbul | `America/new_york` (kanonikleşir), `X/Y`, 65 karakter | ✅ T/validation-bounds:708, :715; U/date-keys:36, :91 |

### 27. Saat dilimi

Kural: istek yolları `x-client-timezone` başlığını kullanır (yoksa/geçersizse **Europe/Istanbul**); cron/kampanya yolları İstanbul günü; AI kredi döngüsü UTC; push sessiz saati cihazın kayıtlı `timezone`'u.

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-TZ-01 | `todayKey` başlığa göre; başlık yok → İstanbul; geçersiz → İstanbul; küçük harf bölge kanonikleşir | zaman | birim | U/date-keys:27, :36, :48, :91 | ✅ |
| API-TZ-02 | `startOfDayInZone` DST geçiş günlerinde yerel gece yarısı (Berlin Mart/Ekim, New York Mart/Kasım) | zaman | birim | U/date-keys:53, :73; T/timezone-cross-module:177 (Berlin/New York DST günleri) | ✅ |
| API-TZ-03 | Değişmez: rastgele an × {Istanbul, Berlin, New_York, Auckland, Kiritimati} için `dateKeyInZone(startOfDayInZone(k,z),z)=k` ve `startOfDay(k+1) > startOfDay(k)` | zaman | prop | U/date-keys:98 (fast-check, 5 bölge); T/timezone-cross-module:194 | ✅ |
| API-TZ-04 | Seri: Berlin 23:30 yazılan log (Berlin günü) aynı istekte "bugün" sayılır; İstanbul'da ertesi gün olsa bile | zaman | api-e2e | T/timezone-cross-module:177 (Berlin gece yarısı ±1 dk); U/streak-timezone:46 (Auckland) | ✅ |
| API-TZ-05 | Seri: New York 20:00 (İstanbul ertesi gün 03:00) dün tamamlanmış → grace sürer | zaman | api-e2e | U/streak-timezone:53 (Los Angeles akşamı); T/streaks:508 (Niue/Kiritimati) | ✅ |
| API-TZ-06 | Stats: aynı loglar, başlık İstanbul vs New York → `today`/`thisWeek` farklı pencere; saat dağılımı yerel saate kayar | zaman | api-e2e | T/stats:292, :304, :314 | ✅ |
| API-TZ-07 | Vird `/today` ve history varsayılan günü başlığa göre | zaman | api-e2e | T/timezone-cross-module:177 (vird /today + history, 4 bölge) | ✅ |
| API-TZ-08 | Journey otomatik tamamlama "bugün"ü istek tz'sine göre (iki cihaz farklı tz → aynı program farklı anda tamamlanır) | zaman | api-e2e | T/timezone-cross-module:296 | ✅ |
| API-TZ-09 | Halka: `endDate` doğrulaması ve `expiresAt` kurucunun tz'sine göre; diğer üyelerin tz'si bitiş anını değiştirmez | zaman | birim | U/circles.locale:110, :275, :299, :339 | ✅ |
| API-TZ-10 | Halka detay `?date=` yoksa istek tz'si; istemci kendi gün anahtarını gönderince çift sayım olmaz | zaman | api-e2e | U/circles.service:552 (verilen ?date=), :562 (yoksa İstanbul günü); çift sayımı sınayan e2e yok | 🟡 |
| API-TZ-11 | Gece yarısı sınırı: İstanbul 23:59:59 ve 00:00:00'da yazılan iki log farklı günlere düşer (gün anahtarı istemciden gelir; sunucu "bugün" hesabı aynı sınırı kullanır) | zaman | api-e2e | T/timezone-cross-module:266 | ✅ |
| API-TZ-12 | AI kredi günü/ayı UTC: İstanbul 02:59 → önceki gün, 03:00 → yeni gün | zaman | birim | U/ai-credits.service:432 (UTC ay sınırı 00:00:01Z) (yalnız ay sınırı; gün sınırı İstanbul 02:59/03:00 vakası yok) (karar A-16: UTC değişmez) | 🟡 |
| API-TZ-13 | Kampanyalar: kandil/weekly İstanbul günü; sessiz saat cihaz tz'si | zaman | birim | U/kandil.campaign:28 (A-18 cihaz tz), U/weekly-summary.campaign:17, T/push-campaigns:127, :437 | ✅ |
| API-TZ-14 | Special-days home: tarihsiz istekte sunucu yerel günü yerine istek tz'si (bkz. API-SPD-05) | zaman | api-e2e | T/special-days:190 | ✅ |
| API-TZ-15 | AI Rehber `timeContext` yoksa istemci yerel saati (bkz. API-AIR-14) | zaman | birim | T/validation-bounds:534 (B12: timeContext yoksa istek tz) | ✅ |

### 28. Eşzamanlılık

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-EA-01 | Halka katılım: kapasite atomik (230 → 200) | eşzamanlılık | api-e2e | T/race:256 | ✅ |
| API-EA-02 | Halka toplamı monoton ve `Σ max` (100 üye × 3 flush) | eşzamanlılık | api-e2e | T/race:386 | ✅ |
| API-EA-03 | Halka tamamlanma tek kazanan, tek push | eşzamanlılık | api-e2e | T/race:453 | ✅ |
| API-EA-04 | Halka toplam doğruluğu yük altında: k6 50 VU sonrası `totalCount == Σ max(üye son count)` | eşzamanlılık | yük | apps/api/load/run.js circle senaryosu + load/verify-circle.mjs (manuel: pnpm test:load:circle; otomatik süitte değil) | 🟡 |
| API-EA-05 | dhikr_logs upsert: unique anahtar + E11000'de tek tekrar; bulk'ta yalnız çakışan op'lar tekrar | eşzamanlılık | birim | U/dhikr-logs.service:670, :728; T/race:792, :813 | ✅ |
| API-EA-06 | Vird activate yarışı: limit aşılırsa telafiyle geri alınır | eşzamanlılık | api-e2e | T/vird:206 | ✅ |
| API-EA-07 | Kredi: aynı flowId paralel → tek kesim (bkz. API-CRD-11) | eşzamanlılık | api-e2e | T/ai:514 | ✅ |
| API-EA-08 | Kredi: farklı flowId paralel, bakiye yetersiz → bakiye negatife düşmez (bkz. API-CRD-12) | eşzamanlılık | api-e2e | T/ai:357, T/ai-chat:235 | ✅ |
| API-EA-09 | Webhook retry → tek abonelik; topup retry → tek kredi | eşzamanlılık | api-e2e | T/webhooks:105, :209 | ✅ |
| API-EA-10 | Webhook sırasız teslim (bkz. API-WHK-15) | eşzamanlılık | api-e2e | T/webhooks:308 | ✅ |
| API-EA-11 | AI Vird aynı flowId paralel → tek taslak (bkz. API-AIV-15) | eşzamanlılık | api-e2e | U/ai-vird.service:244 (yalnız ardışık tekrar; paralel aynı flowId yok) | 🟡 |
| API-EA-12 | Kampanya aynı anda iki tetik → rezervasyon unique index ile cihaz başına tek gönderim | eşzamanlılık | api-e2e | T/push-campaigns:513 (ardışık ikinci tetik), U/push-campaigns.service:97 (E11000 atlama) (paralel tetik yok) | 🟡 |
| API-EA-13 | Vird programı aynı `clientId` ile paralel iki POST → biri 201, diğeri 409 | eşzamanlılık | api-e2e | U/vird-programs.service:440, :454 (yalnız birim: E11000/çakışma → 409; paralel e2e yok) | 🟡 |
| API-EA-14 | İlk AI isteği paralel (cüzdan yok) → 500 olmamalı (bkz. API-CRD-13) | eşzamanlılık | api-e2e | T/ai:492 | ✅ |

### 29. Dil (Accept-Language / cihaz dili)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| API-DIL-01 | AI 503 mesajı `Accept-Language: en` → İngilizce; yok/başka dil → Türkçe | dil | api-e2e | T/ai:272, U/ai-pipeline.filter:86, :99 | ✅ |
| API-DIL-02 | AI Rehber `en` → İngilizce prompt, gerekçede `name.en` (boşsa tr); offTopic mesajı yerel | dil | birim | U/recommendation-agent.service:521 | 🟡 |
| API-DIL-03 | `Accept-Language` yalnız ilk etiketin ana dili okunur (`en-US,tr;q=0.8` → en; `de` → tr) | dil | birim | U/ai-pipeline.filter:86 (en-US,en;q=0.9 → en); `en-US,tr;q=0.8` ve `de` vakaları yok | 🟡 |
| API-DIL-04 | Diğer tüm sunucu hata mesajları Türkçe; istemci `code` alanına göre yerelleştirir (yalnız eyleme dönük hatalarda kod var) | dil | api-e2e | — | ❌ |
| API-DIL-05 | Push dili cihazın `locale`'i; yoksa tr | dil | birim | U/push-locale:20, :30; T/push-campaigns:349 | ✅ |
| API-DIL-06 | Sunucunun ürettiği varsayılan metinler: halka adı ve `Başlık N` yazılmaz, alan boş kalır; istatistikte zikrin iki dilli adı dönmeli (karar A-21) | dil | api-e2e | T/circles:369, T/circles.race:1030, T/user-dhikrs:55, U/circles.service:204, U/user-dhikrs.service:69 (halka adı + Başlık N); istatistikte iki dilli ad henüz yok (stats yalnız name.tr, bkz. API-STA-15) | 🟡 |

---

### ❓ Soru listesi

Her soru bir ürün kararıdır; parantez içi **önerilen varsayılan**. Cevap verilmezse önerilen varsayılan uygulanıp test o kurala göre yazılır.

- **A-01** **Halka bittikten sonra gelen katkı:** Bitiş anından (veya hedef dolduktan) sonra telefonda bekleyen son dokunuşlar sunucuya gelirse ne olsun? Şu an reddediliyor ve sessizce kayboluyor. (Öneri: reddedilsin, uygulama "halka bitti, son N zikir sayılmadı" desin.) → KARAR: süresiz kabul edilir ve toplama eklenir, hedef aşılabilir (öneri tersine çevrildi; elle kapatılan halka reddi ayrı iş).
- **A-02** **Tek kayıtta üst sınır:** Bir zikir kaydında (özellikle halkada) tek seferde gönderilen sayıya sınır olsun mu? Şu an tek istekle 10 milyonluk halka bir anda tamamlanabiliyor. (Öneri: gün başına kayıt sayısı en fazla 100.000; aşarsa 400.) → KARAR: tek kayıtta en fazla 100.000 sayım, aşarsa 400.
- **A-03** **Halka kaydının tarihi:** Halkaya katkı olarak halka kurulmadan önceki bir güne veya ileri bir tarihe kayıt gönderilebiliyor ve toplama ekleniyor. Kabul edilsin mi? (Öneri: yalnız kuruluş günü ile bugün (+1 gün saat dilimi payı) arası kabul.) → KARAR: yalnız kuruluş günü ile bugün (+1 TZ payı) arası, dışı 400.
- **A-04** **Kurucu hesabını silerse halka:** Şu an halka açık kalıyor, kimse kapatamıyor; bitiş tarihi yoksa sonsuza dek açık. (Öneri: kurucu silinince halka `closed` olsun, toplam ve üyelerin geçmişi kalsın.) → KARAR: kuruculuk en eski aktif üyeye geçer (push), üye yoksa halka kapanır.
- **A-05** **Silinen üyenin katkısı:** Hesabını silen üyenin zikir kayıtları siliniyor ama halka toplamından düşülmüyor. Böyle kalsın mı? (Öneri: kalsın; toplam anonim bir sayı, kişisel veri değil.) → KARAR: silinen üyenin katkısı toplamda kalır.
- **A-06** **Ayrılıp yeniden katılma bildirimi:** Bir üye çıkıp tekrar katılırsa kurucuya her seferinde "X katıldı" gidiyor. (Öneri: aynı kişi için halka başına bir kez.) → KARAR: "X katıldı" bildirimi aynı kişi için halka başına bir kez.
- **A-07** **Premium bitince mevcut kazanımlar:** Premium'u biten kullanıcının 5 aktif vird programı, açık hatırlatıcıları ve 200 kişilik halkası ne olsun? (Öneri: mevcutlar korunur; yalnız yeni aktifleştirme/yeni halka/hatırlatıcı açma engellenir — şu anki davranış.) → KARAR: mevcut programlar/halkalar korunur; yeni aktifleştirme/yeni halka engellenir, vird hatırlatmaları durur, tema varsayılana döner (A-07 + M-13).
- **A-08** **Premium bitince kalan aylık AI kredisi:** Şu an ertesi ücretsiz günde siliniyor ve aynı ay yeniden abone olunca aylık hak geri gelmiyor (yalnız 1 kredi kalıyor). (Öneri: düşüşte kalan aylık kredi ay sonuna kadar kullanılabilir kalsın; aynı ay yeniden abonelikte kalan hak geri gelsin.) → KARAR: kalan aylık kredi ay sonuna kadar kullanılabilir; aynı ay yeniden abonelikte geri gelir.
- **A-09** **Ödeme sorunu (BILLING_ISSUE):** Mağaza ödeme alamadığında premium hemen düşüyor; Google/Apple bu sürede kullanıcıya erişim tanıyor (grace period). (Öneri: BILLING_ISSUE'da düşürme, yalnız EXPIRATION'da düşür.) → KARAR: BILLING_ISSUE premium düşürmez, yalnız EXPIRATION düşürür.
- **A-10** **İade:** İade edilen abonelik veya kredi paketi için şu an hiçbir şey yapılmıyor. (Öneri: abonelikte RevenueCat'in EXPIRATION olayını bekle; kredi paketi iadesinde kalan bakiyeden düş, sıfırın altına inmeden.) → KARAR: abonelikte EXPIRATION beklenir; kredi paketi iadesinde kalan bakiyeden düşülür (min 0).
- **A-11** **AI Sohbet'te tekrar denemede çift ücret:** İnternet koptuğunda uygulama mesajı tekrar gönderirse ikinci kredi düşüyor ve mesaj iki kez kaydediliyor. (Öneri: uygulama her mesaj için bir anahtar göndersin; aynı anahtarla tekrar gelirse kredi düşmesin, ilk cevap dönsün.) → KARAR: aynı istemci mesaj anahtarıyla tekrar gönderim ücretsiz, ilk cevap döner.
- **A-12** **Gelecek tarihli zikir kaydı:** Yarın veya gelecek ay tarihli kayıt kabul ediliyor; en uzun seri ve aktif gün sayısını şişiriyor. (Öneri: tarih en fazla bugün +1 gün olabilir, daha ilerisi 400.) → KARAR: tarih en fazla bugün +1 gün, ilerisi 400.
- **A-13** **"Tamamlandı" kim karar verir:** Uygulama sayı hedefin altındayken de "tamamlandı" gönderebiliyor ve seri kazanılıyor. (Öneri: sunucu `count ≥ targetCount` ise tamamlandı sayar; hedef altı "tamamlandı" bayrağını yok sayar.) → KARAR: tamamlandı = sunucuda count ≥ targetCount, hedef altı bayrak yok sayılır.
- **A-14** **Halka ve vird zikirleri kişisel istatistiğe:** Halka ve vird oturumlarında çekilen zikirler genel seriye, toplam sayıya ve rozetlere sayılıyor; kaynak dağılımında ise halka görünmüyor. (Öneri: hepsi sayılsın — zikir zikirdir — ve kaynak dağılımına "Halka" eklensin.) → KARAR: halka ve vird zikirleri seri/toplam/rozetlere sayılır; kaynak dağılımına "Halka" eklenir.
- **A-15** **Vird rozetleri kalıcı mı:** Vird gün kayıtları 400 gün sonra silindiği için "100 günlük vird serisi" rozeti zamanla geri gidebilir. (Öneri: kazanılan en uzun seri ayrı saklansın, rozet asla geri alınmasın.) → KARAR: rozetler asla geri alınmaz; kazanılan en uzun seri ayrı saklanır.
- **A-16** **Ücretsiz AI kredisinin yenilenme saati:** Günlük kredi UTC gece yarısı, yani Türkiye'de 03:00'te yenileniyor. (Öneri: UTC kalsın — tüm dünyada tek kural, basit.) → KARAR: ücretsiz günlük kredi UTC gece yarısı yenilenir (değişmez).
- **A-17** **Haftalık özet bildirimini kapatma:** Haftalık özet push'unun ayrı bir kapatma ayarı yok, herkese gidiyor. (Öneri: mevcut "seri hatırlatma" ayarına bağlansın; kapatan almasın.) → KARAR: haftalık özet push'u "seri hatırlatma" tercihine bağlı.
- **A-18** **Kandil bildirimleri hangi takvime göre:** Kandil günü İstanbul takvimine göre hesaplanıyor; Amerika batısındaki kullanıcıya "yarın kandil" bildirimi aslında iki gün önceden gidebiliyor. (Öneri: kandil arifesi ve günü cihazın yerel gününe göre hesaplansın.) → KARAR: kandil arifesi/günü cihazın kayıtlı saat dilimine göre.
- **A-19** **Halka bitişinde son gün:** Bitiş tarihi "bugün" seçilirse halka kurucunun saat diliminde bu gece yarısı kapanıyor; diğer saat dilimlerindeki üyeler için daha erken/geç. (Öneri: böyle kalsın — tek ortak an, kurucunun saati.) → KARAR: halka bitişi kurucunun saat dilimi (değişmez).
- **A-20** **Oturum kapatma ve eski oturum anahtarı:** Yenileme anahtarı (refresh token) kullanıldıktan sonra eskisi de çalışmaya devam ediyor; çıkış yapınca da geçersiz olmuyor. (Öneri: her yenileme anahtarı tek kullanımlık olsun ve çıkışta iptal edilsin; bedeli: sunucu yeniden başlarsa değil, yalnız anahtar sızarsa oturum düşer — anahtarlar veritabanında tutulmalı.) → KARAR: refresh token tek kullanımlık (rotation), çıkışta iptal, DB'de tutulur.
- **A-21** **Sunucunun ürettiği varsayılan adların dili:** Ad verilmeyen halka zikrin Türkçe adını, ad verilmeyen kişisel zikir "Başlık N"yi alıyor; istatistikte zikir adları Türkçe. İngilizce kullanıcı Türkçe görüyor. (Öneri: sunucu varsayılan ad yazmasın, alan boş kalsın; uygulama kendi dilinde göstersin. İstatistikte zikrin iki dilli adı dönsün.) → KARAR: sunucu varsayılan ad yazmaz, alan boş kalır; istatistikte zikrin iki dilli adı döner.
- **A-22** **Misafir özel günleri görebilsin mi:** Uygulama misafir açılıyor ama özel gün uçları giriş istiyor. (Öneri: GET uçları misafire açılsın, şablonlar gibi.) → KARAR: özel gün GET uçları misafire açık.
- **A-23** **Bitişi geçmiş programı başlatma:** Bitiş tarihi geçmiş bir vird yolculuğu "başlat" denince aktif olup hemen "tamamlandı"ya düşüyor. (Öneri: başlatma reddedilsin, "Bu programın süresi doldu, kopyalayıp yeniden başlat" mesajı.) → KARAR: bitişi geçmiş program başlatılamaz, "süresi doldu, kopyalayıp yeniden başlat" hatası.
- **A-24** **Manuel yolculukta faz kuralları:** Kullanıcının kurduğu gün bazlı programda fazlar çakışabiliyor, arada boş gün kalabiliyor, bitiş günü başlangıçtan önce olabiliyor. (Öneri: AI programlarındaki kural aynen uygulansın: 1. günden başlar, boşluk ve çakışma yok, aksi 400.) → KARAR: manuel fazlar AI kuralıyla: 1. günden başlar, boşluk/çakışma yok, aksi 400.

### Kod / hafıza / doküman çelişkileri

1. **Topup olay adı:** `docs/ai-kredi-birim-ekonomi-takip.md` "Top-up: RevenueCat `NON_SUBSCRIPTION_PURCHASE`" diyor; kod `NON_RENEWING_PURCHASE` işliyor (`apps/api/src/modules/webhooks/webhooks.controller.ts:26`). RevenueCat'in gerçek adı kodla uyumlu; doküman eski.
2. **Şablon premium kapısı:** `docs/vird-programi.md` §4 "Hatırlatıcı / şablon / AI ile oluşturma premium gerektirir" diyor; kod ve hafıza (`premium-kimligi-ve-vird-dalgasi`) klasik şablonları ücretsiz, premium kapısını şablonun kendi `isPremium` bayrağına bağlıyor; AI programı da premium değil 3 kredi. Doküman eski.
3. **dev-secret fallback "ÇÖZÜLDÜ":** Hafıza indeksi (`api-gozlemlenebilirlik-kararlari`) dev-secret fallback'i çözüldü diyor; kodda `AUTH_ACCESS_TOKEN_SECRET`/`AUTH_REFRESH_TOKEN_SECRET` yoksa hâlâ sessizce `local-dev-*` kullanılıyor (`apps/api/src/common/guards/jwt-auth.guard.ts:57`, `apps/api/src/modules/auth/auth.service.ts:475`, `:537`); prod'da yalnız açılış alarmı var, durdurma yok (`apps/api/src/common/logging/boot.ts`). Eksik secret = herkes token üretebilir.
4. **Seri belgesinin tazeliği:** `rozet-ve-seri-kararlari` üyede serinin "sunucu serisi" olduğunu söylüyor; sunucu seriyi yalnız log yazımında hesaplayıp okumada saklı değeri döndüğü için gün geçtikçe bayatlıyor (bkz. Bulgu B2). Hafıza bu sınırı belirtmiyor. **ÇÖZÜLDÜ:** 624028a — seri okunurken bugüne göre değerlendirilir (B2); hafıza notu yine de güncellenmeli.

### Bulgu adayları (şüpheli hatalar — doğrulanmadı)

| # | Önem | Yer | Bulgu |
|---|---|---|---|
| B1 | **Yüksek** | `apps/api/src/modules/subscriptions/subscriptions.controller.ts:54`, `subscriptions.service.ts:189` | `PATCH /v1/subscriptions/:id` RevenueCat doğrulaması olmadan `status/plan/endDate` yazıyor; kullanıcı eski (süresi geçmiş) kaydını `active` + `endDate:2099` yapıp kendine kalıcı premium verebilir. Cron bunu düzeltmez (`endDate ≥ now`). POST'taki doğrulama PATCH'e uygulanmamış. **ÇÖZÜLDÜ:** 4913ee8 — PATCH/DELETE rotaları kaldırıldı, e2e iki rota 404 (T/authz-matrix:376, API-SUB-09). |
| B2 | **Yüksek** | `apps/api/src/modules/streaks/streaks.service.ts:37` | `getByUser` saklı seri belgesini yeniden hesaplamadan döndürüyor. Kullanıcı birkaç gün log yazmazsa `currentStreak` eski değerde kalıyor; `/v1/stats/summary` ve ana ekran başlığı da şişkin seri gösterir. (STR-05 testi bunu yakalamaz: log 2 gün öncesine yazılıyor ve yazım anında hesaplanıyor.) **ÇÖZÜLDÜ:** 624028a — `effectiveStreak` okumada isteğin todayKey'ine göre değerlendirir (T/streaks:399 bloğu); M-21 ile `lastCompletedDate` = sayımı > 0 son gün (067532f). |
| B3 | Orta | `apps/api/src/modules/webhooks/webhooks.controller.ts:89` → `subscriptions.service.ts:359` | `EXPIRATION`/`BILLING_ISSUE`, olayın hangi döneme ait olduğuna bakmadan sağlayıcının TÜM aktif aboneliklerini `expired` yapıyor. RENEWAL'dan sonra geç gelen eski EXPIRATION yeni dönemi düşürür; doğrulama modunda `sync-user` kayıt yaratmadığı için (SUB-15) premium bir sonraki RENEWAL'a kadar kaybolur. **ÇÖZÜLDÜ:** 23336a2 — sırasız EXPIRATION yeni dönemi düşürmez (T/webhooks:308); BILLING_ISSUE premium düşürmez (A-09, T/webhooks:281). |
| B4 | Orta | `apps/api/src/modules/auth/auth.service.ts:175` | Refresh rotasyonu eskiyi iptal etmiyor: bellekten silinen eski token durumsuz imza yolundan yine kabul ediliyor; çıkışta iptal yok. Sızan refresh 30 gün geçerli. **ÇÖZÜLDÜ:** 23336a2 + e0523fa — refresh tek kullanımlık, aile iptali, `POST /v1/auth/logout` (A-20); kayıp-yanıt tekrarı 60 sn ile sınırlı (T/auth:153 bloğu). |
| B5 | Orta | `apps/api/src/modules/circles/circles.service.ts:175`, `:406`, `preview` | Halka kurma, join ve preview tembel süre sonunu uygulamıyor. Ücretsiz kullanıcı bitişi geçmiş ama henüz kapanmamış halkası yüzünden ikinci halkada paywall görür; bitmiş halkaya katılım kabul edilir; preview "aktif" gösterir. **ÇÖZÜLDÜ:** b476fb6 — süresi geçmiş halka aktif sayılmaz; paywall, join (403 CIRCLE_NOT_ACTIVE) ve preview tutarlı (T/circles.race:923, :933, :939). |
| B6 | Orta | `apps/api/src/modules/special-days/special-days.service.ts:163`, `:389` | `home` tarihsiz çağrıda `toDateKey(new Date())` sunucu yerel saatini (Render = UTC) kullanıyor; İstanbul 00:00–03:00 arası dünün özel günü "bugün" görünür; `x-client-timezone` yok sayılıyor. `calculateDateDiff` de sunucu yerel gece yarısı kullanıyor. **KISMEN ÇÖZÜLDÜ:** 78869ad — `home` tarihsiz çağrı istek saat dilimini kullanır (T/special-days:190). `calculateDateDiff` hâlâ sunucu yerel gece yarısı kullanıyor (special-days.service.ts:389), doğrulandı: açık. |
| B7 | Orta-düşük | `apps/api/src/modules/ai/ai.service.ts:103–180`; `ai-vird.service.ts:109`, `:121` | Rehber'de aynı `flowId` tekrarı ajanı yeniden çalıştırıp ikinci öneri kaydı oluşturuyor (kredi düşmez ama LLM maliyeti var). AI Vird'de taslak silinince/7 gün TTL'den sonra aynı `flowId` ile yeni program ücretsiz üretilir (kredi kaydı var, taslak yok → erişim kontrolü geçer, kesim "zaten var" döner). **KISMEN ÇÖZÜLDÜ:** 80aaa4f — Rehber aynı flowId tekrarında kayıtlı öneriyi döndürür, ajan çalışmaz (T/ai:607). AI Vird'de taslak silinince/TTL sonrası aynı flowId ile ücretsiz üretim kısmı doğrulanmadı. |
| B8 | Düşük | `apps/api/src/modules/ai/ai-credits.service.ts:390–391` | `findOne ?? create` — cüzdanı olmayan kullanıcının iki eşzamanlı ilk AI isteğinde ikinci `create` E11000 ile 500 döner. **ÇÖZÜLDÜ:** 23336a2 — cüzdan oluşturma yarışı giderildi (T/ai:492). |
| B9 | Düşük | `apps/api/src/modules/ai-chat/ai-chat.service.ts:186`, `:280`, `:388`, `:481`; `ai/ai.service.ts:173` | Önce kalıcılaştırma, sonra kesim: eşzamanlı isteklerle bakiye tükenirse içerik (mesaj/öneri) kaydedilmiş kalır, kredi düşmez, istemci 403 görür (ücretsiz içerik + tutarsız UI). **ÇÖZÜLDÜ:** 5b04d43 (AI Rehber + AI Vird debit → persist) ve 23336a2 (sohbet debit → persist) — T/ai:357, :377, T/ai-chat:235. |
| B10 | Düşük (gizli) | `apps/api/src/modules/dhikr-logs/dhikr-logs.service.ts:378`, `:385–394` | Bulk: (a) `isCompleted` yapışkan değil, tamamlanmış günü geri alabilir; (b) vird alanları hem `$set` hem `$setOnInsert`'te → Mongo "would create a conflict" (kod 40) → 500. Mobil şu an bulk kullanmıyor; ilk kullanımda patlar. **ÇÖZÜLDÜ:** 067532f — bulk `isCompleted` korunur, `$set`/`$setOnInsert` çakışması (500) giderildi (T/dhikr-logs:407, :416; U/dhikr-logs.service:567). |
| B11 | Düşük | `apps/api/src/modules/vird/vird-progress.service.ts:135`; `dhikr-logs.service.ts` `removeByDhikr` | Vird serisi yalnız gün tamamlanınca yeniden hesaplanıyor (gün geri düşünce seri düşmüyor); `DELETE by-dhikr` sonrası ne genel seri ne vird ilerlemesi yeniden hesaplanıyor. **KISMEN ÇÖZÜLDÜ:** 2f888d0 — `DELETE by-dhikr` sonrası genel seri yeniden hesaplanır, longest düşmez (T/route-coverage:114). Vird serisinin gün geri düşünce düşmemesi ve by-dhikr sonrası vird ilerlemesi doğrulanmadı. |
| B12 | Düşük | `apps/api/src/modules/ai/dto/create-ai-recommendation.dto.ts:42`; `ai.service.ts:347` | `timeContext` için `@ValidateNested` yok → iç alanlar doğrulanmıyor (`hour:99`). `timeContext` yoksa sunucu saati (UTC) kullanılıyor → TR kullanıcısına yanlış vakit dilimi. **ÇÖZÜLDÜ:** 26bcf18 — `timeContext` doğrulanır, yoksa istek saat dilimi kullanılır (T/validation-bounds:500, :534). |
| B13 | Düşük (bilinen) | `apps/api/src/modules/ai/ai.service.ts:95` | Kullanıcı `freeText`'inin ilk 60 karakteri loglanıyor; PII politikası "kullanıcı metni asla" diyor (hafızada AÇIK olarak geçiyor). **ÇÖZÜLDÜ:** 80aaa4f — freeText loglanmaz, yalnız uzunluk. |
| B14 | Düşük | `apps/api/src/common/guards/jwt-auth.guard.ts:29`; `auth.service.ts:182` | Hesap silindikten sonra access token ≤15 dk geçerli ve guard kullanıcı varlığına bakmıyor → `user-dhikrs` POST, `devices/register`, `events`, `vird/programs` POST yetim kayıt üretebilir. Silinmiş kullanıcının refresh'i 401 yerine 404 dönüyor. **KISMEN ÇÖZÜLDÜ:** 23336a2 — silinmiş kullanıcının refresh'i 401 (T/auth:240). Access token ≤15 dk geçerli ve guard kullanıcı varlığına bakmıyor (karakterizasyon T/route-coverage:310), doğrulandı: açık. |
| B15 | Düşük | `apps/api/src/modules/dhikrs/dto/create-dhikr.dto.ts:15–20` | `LocalizedTextDto` yalnız `@IsString` → `virtue:{tr:'',en:''}` kabul; "fazilet + amaç zorunlu" kuralı API kapısında uygulanmıyor. **ÇÖZÜLDÜ:** 26bcf18 — boş/yalnız boşluk virtue/ad 400 (T/validation-bounds:941, :964, :969). |
| B16 | Düşük | `apps/api/src/modules/ai-chat/ai-chat.service.ts:131`, `:224` | `MinLength(1)` trim'den önce: yalnız boşluk mesaj geçer, trim sonrası boş içerik ajana gider ve kredi düşer. **ÇÖZÜLDÜ:** 23336a2 — yalnız boşluk mesaj 400, kredi düşmez (T/ai-chat:262; firstMessage T/validation-bounds:569). |
| B17 | Düşük | `apps/api/src/modules/push/push-sender.service.ts:84` | Expo chunk hatası yutuluyor; kampanya bunu `sent` sayıyor, `skipped.error` pratikte hiç artmıyor (izleme yanıltıcı). **ÇÖZÜLDÜ:** 78869ad — Expo gönderim hatası artık `sent` sayılmaz, `skipped.error` artar (T/push-campaigns:214). |
| B18 | Düşük | `apps/api/src/modules/vird/vird-templates.service.ts:331` | Özel gün çapası önbelleği aile anahtarıyla tutuluyor ama "bugün" isteğin tz'sine göre hesaplanıyor → farklı tz'deki kullanıcılar 10 dk boyunca birbirinin günüyle hesaplanmış çapayı görebilir. **ÇÖZÜLDÜ:** 78869ad — şablon önbelleği TZ'li anahtarla tutulur. |
| B19 | Düşük | tüm `@Matches(/^\d{4}-\d{2}-\d{2}$/)` DTO'ları | Biçim regex'i takvimde olmayan günleri (`2026-02-30`, `2026-13-01`) kabul ediyor; `shiftDateKey` bunları sessizce normalize eder, seri/halka gün anahtarı bozulabilir. **ÇÖZÜLDÜ:** 26bcf18 — `@IsDateKey` (10 DTO) takvimde olmayan günü 400 yapar (T/validation-bounds:167). |

---

## Bölüm 2 — Davranış Kataloğu — Mobil + Web Sitesi

Tarih: 2026-10-06 · Kapsam: `apps/mobile` (Expo/RN) + `apps/website` (Next). API tarafı ayrı dosyada: `docs/qa/katalog-api.md`.

Amaç: her kullanıcıya görünen davranışı **kural olarak** (normal + uç durum) yazmak ve mevcut testleri bu kurallara eşlemek. Testler sonra yazılacak; bu dosya neyin test edileceğinin tek listesidir. Satırlar kodu değil, ürün kuralını anlatır; kural koddan çıkarıldıysa ve ürün niyeti belirsizse ❓ ile işaretlenir.

### Lejant

**Kolonlar**
- **ID** — `MOB-<ALAN>-NN` (mobil), `WEB-NN` (site). Silinen satırın ID'si tekrar kullanılmaz.
- **Davranış** — `Verilen <ön koşul> / <eylem> olunca / <beklenen>`.
- **Tür** — `normal` · `uç` (sınır, çift dokunuş, limit tam/+1, bozuk veri, öldürülen uygulama) · `zaman` (gece yarısı, saat dilimi, zamanlayıcı) · `çevrimdışı` · `dil` · `premium` (ücretsiz/premium ayrımı).
- **Katman**
  - `detox` — gerçek yerel API + Docker Mongo'ya karşı uçtan uca, **Android tam süit**.
  - `detox@smoke` — aynı, ayrıca **iOS duman alt kümesi** (yalnız bu satırlar iOS'ta koşar).
  - `birim` — vitest, saf fonksiyon/store.
  - `birim (çıkar: <yol>)` — mantık bugün bir React hook'unun içinde; önce saf fonksiyona çıkarılmalı, sonra birim test.
  - `prop` — vitest + özellik tabanlı (fast-check). **Not:** fast-check bugün bağımlılık değil; eklenmesi onay ister. Onay yoksa aynı satırlar tablo-güdümlü `it.each` ile yazılır.
  - `playwright` — web sitesi.
- **Mevcut test** — davranışı gerçekten kanıtlayan `yol:satır`; yoksa `—`. Mobil yollar `apps/mobile/` köküne, site yolları `apps/website/` köküne görelidir. `(aynalayan)` = test uygulama ayrıntısını tekrar ediyor (anahtar adı, çağrı sırası), kuralı değil.
- **Durum** — ✅ kanıtlı · 🟡 kısmi (yanlış katmanda ya da kuralın yalnız bir kısmı) · ❌ test yok · ❓ ürün kuralı belirsiz / kod-hafıza çelişkisi (aşağıdaki soru listesine bağlı).

**Test ortamı varsayımları (karar verilmiş)**
- React Native Testing Library **yok**. Satın alma arayüzü test edilmez (Google). Premium/ücretsiz için iki önceden seed'lenmiş hesap.
- AI sunucu mock'u ile koşar (gerçek kredi yok). 503 / zaman aşımı / kredi bitti modları backend mock/seed ile tetiklenir.
- Çevrimdışı yalnız Android'de `adb shell cmd connectivity airplane-mode enable` ile.
- **Altyapı açığı:** mock Google kimliği bugün build anında gömülü tek kullanıcı (`EXPO_PUBLIC_DEV_GOOGLE_*`, `src/features/auth/services/mock-provider-auth.ts:324`). Premium/ücretsiz hesap geçişi ya `e2e-seed.mjs --premium` ile aynı hesabı çevirerek ya da mock kimliği Detox `launchArgs`'tan okuyacak küçük bir değişiklikle yapılır. Halka için "ikinci üye" cihaz değil, API üzerinden (test-token) sürülür.
- **Altyapı açığı:** AI hata modları (503, takılan istek, kredi 0, günlük limit) için backend mock'unda istek başına mod seçimi gerekir (ör. seed ile `ai_mock_mode` belgesi veya env). Bugün `AI_RUNTIME_MOCK=1` yalnız başarılı yanıt üretir.

---

### MOB-GIR — Misafir modu, giriş, oturum, hesap

| ID | Davranış (Verilen / Olunca / O zaman) | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-GIR-01 | Verilen temiz kurulum / uygulama açılınca / giriş duvarı yok, doğrudan ana sayfa (misafir) | normal | detox | e2e/01-auth-onboarding.e2e.js:19 | ✅ |
| MOB-GIR-02 | Verilen misafir / Profil → "Giriş yap" → Google (mock) olunca / profil adı görünür, geri dönüş profile | normal | detox@smoke | e2e/01-auth-onboarding.e2e.js:26 | ✅ |
| MOB-GIR-03 | Verilen giriş yapılmış / uygulama yeniden başlatılınca / oturum korunur | normal | detox | e2e/01-auth-onboarding.e2e.js:37 | ✅ |
| MOB-GIR-04 | Verilen giriş yapılmış / uygulama silinip yeniden kurulunca / misafir açılır (iOS Keychain'deki eski oturum geri gelmez) | uç | detox@smoke | e2e/01-auth-onboarding.e2e.js:45 (sıra: giriş :26 → yeniden başlat :37 → sil-kur :45); src/lib/storage/secure-session-storage.test.ts:101 | ✅ |
| MOB-GIR-05 | Verilen auth hidrasyonu bitmemiş / açılış / misafire geçiş beklenir, hidrasyon bitince bir kez misafir olur, giriş yapmışsa olmaz | normal | birim | src/features/onboarding/should-auto-become-guest.test.ts:5 | ✅ |
| MOB-GIR-06 | Verilen soğuk derin bağlantı (`zikirmatik://circle/join?code=…`) temiz kurulumda / açılınca / auth ekranı yok, misafir olarak hedef ekran | uç | detox | e2e/12-notifications-routing.e2e.js:108 (yalnız zikirmatik://vird soğuk bağlantısı) | 🟡 (circle/join bağlantısı ve temiz kurulum yok) |
| MOB-GIR-07 | Verilen iOS / auth ekranı / Apple düğmesi görünür; Android'de görünmez | normal | detox | — | ❌ |
| MOB-GIR-08 | Verilen auth ekranı geri gidilebilir durumda / X'e basınca / önceki ekrana döner; geri gidilemiyorsa X gizli | normal | detox | — | ❌ |
| MOB-GIR-09 | Verilen kullanıcı giriş akışını iptal eder / olunca / "Giriş işlemi iptal edildi." görünür, misafir kalır | uç | detox | — | ❌ |
| MOB-GIR-10 | Verilen sağlayıcı kesintisi (`AUTH_SIMULATE_PROVIDER_OUTAGE`) / giriş olunca / "Kimlik sağlayıcısına ulaşılamıyor" hatası, çökme yok | uç | detox | — | ❌ |
| MOB-GIR-11 | Verilen giriş düğmesine hızlı çift dokunuş / olunca / tek giriş isteği, yükleniyor göstergesi giriş bitene kadar kalır | uç | detox | src/store/auth-store.test.ts:142; e2e/10-profile-premium.e2e.js:61 | 🟡 (yükleniyor göstergesi kanıtsız) |
| MOB-GIR-12 | Verilen misafir AI/halka/premium eylemine basar / olunca / "Bu özellik için üye olun" modalı; "Üye ol" → auth, "Vazgeç" → kapanır | normal | detox | — | ❌ |
| MOB-GIR-13 | Verilen modal üzerinden giriş yapıldı / olunca / tetikleyen eylem devam eder (karar M-17: ayrı iş) | uç | detox | — (ayrı iş M-17) | ❌ (ayrı iş M-17; bugün devam etmiyor) |
| MOB-GIR-14 | Verilen misafir bugün zikir çekti + kişisel zikir + favori / giriş olunca / sunucuda log (gün başına max), kişisel zikir (clientId birliği), favori görünür | normal | detox | src/features/auth/services/guest-migration.test.ts:149; :181; :213; :255; e2e/05-counter-guest.e2e.js:86 | 🟡 (plan birim testi + Detox yalnız Serbest zikir; log/favori uçtan uca yok) |
| MOB-GIR-15 | Verilen sunucuda aynı gün daha yüksek sayı var / taşıma olunca / log yazılmaz (max kazanır, tekrar koşu idempotent) | uç | birim | src/features/auth/services/guest-migration.test.ts:149; :181 | ✅ |
| MOB-GIR-16 | Verilen misafir yerel vird programı + son 30 gün ilerlemesi / taşıma olunca / program sunucuda (aktifse aktif), 30 günden eski ilerleme gitmez | normal | birim | src/features/auth/services/guest-migration.test.ts:339; :370; :380; src/store/vird-store.test.ts:122 | ✅ |
| MOB-GIR-17 | Verilen misafir taşıma sırasında uygulama öldürülür / yeniden açılınca / taşıma `pending` olarak sürer, veri çiftlenmez | uç | birim | src/store/guest-migration-store.test.ts:37; src/features/auth/services/guest-migration.test.ts:507 (B-14) | ✅ |
| MOB-GIR-18 | Verilen taşıma 3 kez başarısız / olunca / sunucu senkronu serbest kalır, sonraki açılışta yeni tur; kullanıcıya uyarı bandı ayrı iş (karar M-18) | uç | birim | src/store/guest-migration-store.test.ts:45 | 🟡 (yeni tur kanıtlı; uyarı bandı yok, ayrı iş M-18) |
| MOB-GIR-19 | Verilen serbest modda kaydedilmemiş sayım (>0) / giriş olunca / "Serbest" adlı kişisel zikir olarak hesaba taşınır, 0'da taşınmaz (karar M-19) | uç | detox | e2e/05-counter-guest.e2e.js:86; src/features/auth/services/guest-migration.test.ts:457; :466 | ✅ |
| MOB-GIR-20 | Verilen oturumu düşmüş (lapsed) kullanıcı başka hesapla girer / olunca / eski kullanıcının verisi yeni hesaba taşınmaz | uç | birim | src/store/auth-store.test.ts:217 | ✅ |
| MOB-GIR-21 | Verilen giriş yapılmış / "Çıkış Yap" olunca / misafir ana sayfa; zikir, vird, halka, rozet, AI önbelleği, isPremium sıfır; tema/dil/tur bayrağı korunur | normal | detox | src/store/session-boundary.test.ts:29; :37; e2e/10-profile-premium.e2e.js:75 | 🟡 (zikir/vird/halka/isPremium sıfırlaması ve tema/dil/tur korunması kanıtsız) |
| MOB-GIR-22 | Verilen çıkış / olunca / cihaz kaydı sunucudan koparılır, unlink hatası çıkışı engellemez | uç | birim | src/features/notifications/services/push-device-registration.test.ts:229; :242 | ✅ |
| MOB-GIR-23 | Verilen çıkış yapıldı / tekrar aynı hesapla giriş / eski rozetler yeniden kutlanmaz, sunucu verisi geri gelir | uç | detox | src/features/stats/services/badge-celebration.test.ts:75 | 🟡 (çıkış → aynı hesapla tekrar giriş Detox akışı yok) |
| MOB-GIR-24 | Verilen refresh token kalıcı hata (4xx) / ön plana gelince / misafire düşer, ana sayfada "Oturumun süresi doldu" bandı + "Giriş yap" | uç | birim | src/store/auth-store.test.ts:133; :199; src/features/home/services/lapsed-session-banner.test.ts:5 | 🟡 (bant uçtan uca yok) |
| MOB-GIR-25 | Verilen refresh ağ hatası / 5xx / olunca / oturum KORUNUR (geçici hata) | çevrimdışı | birim | src/lib/http/client.test.ts:90; :101; src/store/auth-store.test.ts:126 | 🟡 (auth-store: yalnız 429/408; ağ hatası/5xx oturum kararı kanıtsız) |
| MOB-GIR-26 | Verilen eşzamanlı iki 401 / olunca / tek refresh isteği paylaşılır, ikisi de yeni token ile tekrar dener | uç | birim | src/store/auth-store.test.ts:53; :100; src/lib/http/client.test.ts:198 | ✅ |
| MOB-GIR-27 | Verilen refresh sonrası tekrar 401 / olunca / döngü yok, hata yükselir | uç | birim | src/lib/http/client.test.ts:212 | ✅ |
| MOB-GIR-28 | Verilen üye / "Hesabı Sil" → onay olunca / sunucu silinir, çıkış, misafir ana sayfa; tekrar girişte boş hesap | normal | detox | e2e/10-profile-premium.e2e.js:135; src/features/profile/services/delete-account.test.ts:5 | ✅ |
| MOB-GIR-29 | Verilen hesap silme API hatası / olunca / kullanıcıya hata, modal kapanmaz, oturum korunur | uç | detox | e2e/10-profile-premium.e2e.js:114 (Detox yalnız Android: uçak modu); src/features/profile/services/delete-account.test.ts:15 | ✅ |
| MOB-GIR-30 | Verilen misafir / Profil / "Hesabı Sil" satırı gösterilmez (karar M-14) | uç | detox | e2e/10-profile-premium.e2e.js:61; :75 | ✅ |
| MOB-GIR-31 | Verilen çıkış / olunca / onay sorulur, onayda misafir ana sayfa (karar M-15) | normal | detox | e2e/10-profile-premium.e2e.js:75 | ✅ |
| MOB-GIR-32 | Verilen kayıtlı oturum AsyncStorage'da (eski sürüm) / ilk açılış / SecureStore'a bir kez taşınır, düz kopya silinir | uç | birim | src/lib/storage/secure-session-storage.test.ts:53; :69 | ✅ |
| MOB-GIR-33 | Verilen auth `authenticating` durumunda uygulama öldürülür / yeniden açılınca / takılı "bağlanıyor" durumu geri gelmez | uç | birim | src/store/auth-store.test.ts:243 | ✅ |

### MOB-TUR — Tanıtım turu

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-TUR-01 | Verilen tur tamamlanmamış / ana sekme odaklanınca (~600 ms) / 9 adımlı tur açılır | normal | detox | — (helpers.skipTourIfShown yalnız atlıyor) | ❌ |
| MOB-TUR-02 | Verilen tur açık / "İleri" × 8 + "Bitir" olunca / tur kapanır, tamamlandı kalıcı, yeniden açılışta tekrar gelmez | normal | detox | — | ❌ |
| MOB-TUR-03 | Verilen tur açık / "Atla" veya Android geri olunca / tur tamamlanmış sayılır | normal | detox | — | ❌ |
| MOB-TUR-04 | Verilen tur bitti / olunca / bildirim izni akışı başlar (zaten açıksa başlamaz) | normal | detox | src/features/profile/services/sync-notification-settings.test.ts:191; :229 | 🟡 (tur bitişi tetikleyicisi kanıtsız) |
| MOB-TUR-05 | Verilen Profil → "Uygulamayı Tanıt" / olunca / ana sayfaya gider ve tur yeniden başlar | normal | detox | — | ❌ |
| MOB-TUR-06 | Verilen Android / tur spot ışığı / sekme çubuğu hapı ve durum çubuğu ofseti doğru hizalanır | uç | birim | src/features/tour/types.test.ts:17; :31 | ✅ |
| MOB-TUR-07 | Verilen tur sırasında sayaç demo dokunuşu / olunca / log yazılmaz | uç | birim (çıkar: src/features/home/hooks/use-counter-engine.ts) | — | ❌ |

### MOB-SAY — Ana sayaç

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-SAY-01 | Verilen serbest mod / sayaca 5 dokunuş / etiket 5 | normal | detox | e2e/02-counter-log-streak.e2e.js:10 | ✅ |
| MOB-SAY-02 | Verilen hedef > 0 / hedefe ulaşınca / sayım hedefte durur, sonraki dokunuş sayı değiştirmez, titreşim/ses yok | uç | birim | src/features/home/services/counter-service.test.ts:5; src/services/counter-feedback.test.ts:66; src/features/home/services/lap-counter.test.ts:102 | ✅ |
| MOB-SAY-03 | Verilen hedef 0 / dokunuş / üst sınırsız artar | normal | birim | src/features/home/services/counter-service.test.ts:11 | ✅ |
| MOB-SAY-04 | Verilen seçili zikir, üye / hedefe tam ulaşan dokunuş / sessiz otomatik kayıt + "Hedefe ulaştın, otomatik kaydedildi" | normal | detox | src/features/home/services/lap-counter.test.ts:98 (yalnız eşik) | 🟡 |
| MOB-SAY-05 | Verilen aynı gün aynı hedefe ikinci kez ulaşılır (sıfırla → tekrar) / olunca / ikinci otomatik kayıt yok; kayıt başarısızsa tekrar denenebilir | uç | birim (çıkar: src/features/home/hooks/use-counter-engine.ts) | — | ❌ |
| MOB-SAY-06 | Verilen misafir seçili zikir / hedefe ulaşınca / otomatik kayıt yok, ilerleme yerelde kalır | premium | detox | — | ❌ |
| MOB-SAY-07 | Verilen serbest mod hedefli / hedefe ulaşınca / ad isteyen kaydet sayfası hedef dolu açılır (gün+hedef başına bir kez) | normal | detox | — | ❌ |
| MOB-SAY-08 | Verilen tur boyu 33 / 33, 66 dokunuş / her turda başarı titreşimi + "N. tur tamamlandı" | normal | birim | src/features/home/services/lap-counter.test.ts:61; :90; src/services/counter-feedback.test.ts:45 | ✅ |
| MOB-SAY-09 | Verilen tur boyu / 32 ve 34. dokunuş / tur olayı yok | uç | birim | src/services/counter-feedback.test.ts:53; src/features/home/services/lap-counter.test.ts:66 | ✅ |
| MOB-SAY-10 | Verilen tur boyu girdisi 0, negatif, harf, 10000 / olunca / 1..9999'a kıskaçlanır, geçersiz → 33 | uç | prop | src/store/dhikr-store.test.ts:536; :607; src/features/home/services/lap-counter.test.ts:12 | ✅ |
| MOB-SAY-11 | Verilen tur boyu "Özel" / 4 haneden fazla veya 0 / kabul edilmez | uç | detox | — | ❌ |
| MOB-SAY-12 | Verilen tur hesabı / her sayım n ve tur boyu L için / `lap = floor(n/L)`, ilerleme 0..L-1, negatif yok | uç | prop | src/features/home/services/lap-counter.test.ts:28; :54 | 🟡 (örnek tabanlı) |
| MOB-SAY-13 | Verilen "herhangi bir yere dokun" kapalı (varsayılan) / kart dışına dokunuş / sayılmaz; açıkken sayılır | normal | detox | — | ❌ |
| MOB-SAY-14 | Verilen her yere dokun açık / uygulama yeniden açılınca / tercih korunur; açılışta toast tekrar gösterilmez | uç | detox | — | ❌ (B-44) |
| MOB-SAY-15 | Verilen sıfırla / onay modalı → "Sıfırla" / sayım 0; "Vazgeç" → değişmez | normal | detox | e2e/06-transition-modals.e2e.js:57 | ✅ |
| MOB-SAY-16 | Verilen sıfırlandı / "Kaydetmeden devam" seçilince / eski sayım geri gelmez; Sıfırla geri alma noktasını da siler (karar M-05) | uç | detox | src/store/dhikr-store-qa.test.ts:50; e2e/06-transition-modals.e2e.js:57 | ✅ |
| MOB-SAY-17 | Verilen sayım 50 / hedef 40 girilince / "Sayım kırpılacak" modalı; "Yine de uygula" → 40, vazgeç → 50 | uç | detox | — | ❌ |
| MOB-SAY-18 | Verilen hedef modalı / boş veya 0 / seçili zikirde değişiklik yok, serbest modda hedef sınırsıza döner | uç | birim (çıkar: src/features/home/hooks/use-home-editors.ts) | — | ❌ |
| MOB-SAY-19 | Verilen hedef girişi / 5 haneli / en fazla 4 hane kabul | uç | birim (çıkar: src/features/home/hooks/use-home-editors.ts) | — | ❌ |
| MOB-SAY-20 | Verilen ücretsiz kullanıcı / tesbih görünümü seçili / halka sayacı çalışır + kilit şeridi, şeride dokununca premium sayfası | premium | detox | — | ❌ |
| MOB-SAY-21 | Verilen premium / tesbih görünümü / boncuk dolumu 33'ün katında tam halka, sonraki dokunuşta 1 | premium | birim | src/features/home/components/tesbih-strand.math.test.ts:48; :54 | ✅ |
| MOB-SAY-22 | Verilen tesbih, tur boyu 99 / sayım / "kaçıncı halka" etiketi doğru | premium | birim | src/features/home/components/tesbih-strand.math.test.ts:70 | ✅ |
| MOB-SAY-23 | Verilen titreşim "kapalı/hafif/orta/tesbih" / dokunuş / ilgili desen; kapalıyken hiç | normal | birim | src/services/haptics.test.ts:36; :41; :47; :53 | 🟡 (aynalayan: zamanlama) |
| MOB-SAY-24 | Verilen kayıtlı desen bozuk / açılış / eski `hapticsEnabled:false` ise kapalı, değilse "orta" | uç | birim | src/services/haptics-pattern.test.ts:16; :23 | ✅ |
| MOB-SAY-25 | Verilen native titreşim/ses hata atar / dokunuş / sayım yine artar, çökme yok | uç | birim | src/services/haptics.test.ts:62; src/services/click-sound.test.ts:115 | ✅ |
| MOB-SAY-26 | Verilen ses paketi "tık" ücretsiz kullanıcıda / dokunuş / ses çalmaz; premiumda çalar | premium | birim (çıkar: src/features/home/hooks/use-counter-engine.ts) | — | ❌ |
| MOB-SAY-27 | Verilen hızlı ardışık dokunuşlar / ses / her dokunuşta baştan çalar (havuz) | uç | birim | src/services/click-sound.test.ts:83; :90 | 🟡 (aynalayan) |
| MOB-SAY-28 | Verilen sayım 7 / uygulama öldürülüp açılınca / 7 korunur | uç | detox | — | ❌ |
| MOB-SAY-29 | Verilen 20 hızlı dokunuş (≤100 ms aralık) / olunca / tam 20 sayılır, kayıp yok | uç | detox | — | ❌ |
| MOB-SAY-30 | Verilen serbest mod ad önerisi / kişisel zikirlerde "Serbest 3" var / sıradaki otomatik ad "Serbest 4" | normal | birim | src/features/home/services/free-mode-title.test.ts:5 | ✅ |
| MOB-SAY-31 | Verilen ömür boyu sayaç (misafir rozetleri) / gerçek dokunuş / artar; kıskaçlı dokunuş ve sunucu logu artırmaz | normal | birim | src/store/dhikr-store.test.ts:447 | ✅ |
| MOB-SAY-32 | Verilen elle girilen sayı (`setSelectedCount`) / misafir / ömür boyu sayaca sayılır mı | uç | birim | — | ❓ (rozet hafızası "açık" diyor) |

### MOB-KAY — Kaydetme ve geçiş modalları

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-KAY-01 | Verilen üye, serbest mod 5 / Kaydet → ad + hedef 5 → gönder / sayfa kapanır, log sunucuda `count 5, isCompleted true`, seri 1 | normal | detox@smoke | e2e/02-counter-log-streak.e2e.js:10 | ✅ |
| MOB-KAY-02 | Verilen serbest kaydet sayfası / ad boş / gönderilemez, "Zikir adı zorunlu." | uç | birim | src/features/home/services/free-save-draft.test.ts:5 | ✅ |
| MOB-KAY-03 | Verilen serbest kaydet / hedef "0" / "Hedef girilecekse 1 veya daha büyük olmalı."; boş = sonsuz | uç | birim (çıkar: src/features/home/hooks/use-dhikr-transition.ts) | src/features/home/services/free-save-draft.test.ts:10 | ✅ |
| MOB-KAY-04 | Verilen serbest kaydet / gönder'e çift dokunuş / tek kişisel zikir oluşur | uç | detox | src/features/home/services/free-save-draft.test.ts:25; e2e/06-transition-modals.e2e.js:119 | ✅ |
| MOB-KAY-05 | Verilen üye seçili zikir / Kaydet / log sunucuda, "kaydedilmemiş" işareti kalkar, seri başlığı tazelenir | normal | detox | e2e/02-counter-log-streak.e2e.js:10; src/store/dhikr-store.test.ts:66 | 🟡 (seçili zikirde sunucu logu ve başlık tazelenmesi doğrudan kanıtsız) |
| MOB-KAY-06 | Verilen misafir / Kaydet / "Kalıcı kaydetmek için giriş yap" istemi görünür, ilerleme cihazda kalır; sessiz kalmaz (karar M-02) | uç | detox | src/features/home/services/save-press.test.ts:12; e2e/05-counter-guest.e2e.js:39 | ✅ |
| MOB-KAY-07 | Verilen üye çevrimdışı / Kaydet / görünür hata, sayım ve "kaydedilmemiş" korunur | çevrimdışı | detox | e2e/11-offline-rollover.e2e.js:47 (Detox yalnız Android: uçak modu) | ✅ |
| MOB-KAY-08 | Verilen kayıt uçuşta / bu sırada 3 dokunuş / dokunuşlar kaybolmaz, "kaydedilmemiş" kalır | uç | birim | src/store/dhikr-store-qa.test.ts:108; :121 | ✅ |
| MOB-KAY-09 | Verilen sayım 0 / Kaydet / pasif, uyarı modalı yok; sunucu 0 kaydının tamamlanmış kaydı ezmesini reddeder (karar M-04) | uç | detox | src/features/home/services/save-press.test.ts:5; e2e/05-counter-guest.e2e.js:39 | ✅ |
| MOB-KAY-10 | Verilen üye serbest kaydet, `createUserDhikr` hata / olunca / hata gösterilir, yerel zikir sonraki senkronda kaybolmaz | çevrimdışı | birim | src/store/dhikr-store-qa.test.ts:151 | 🟡 (yerel zikrin korunması kanıtlı; hata gösterimi kanıtsız) |
| MOB-KAY-11 | Verilen seçili zikirde kaydedilmemiş ilerleme / başka zikre geçince / "Kaydedilmemiş zikir var" modalı | normal | detox | src/features/home/services/unsaved-transition-guard.test.ts:5; e2e/06-transition-modals.e2e.js:31 | ✅ |
| MOB-KAY-12 | Verilen aynı zikir yeniden seçilir / olunca / modal yok | uç | birim | src/features/home/services/unsaved-transition-guard.test.ts:15 | ✅ |
| MOB-KAY-13 | Verilen serbest mod sayım > 0 / zikir seçilince / modal; sayım 0 iken modal yok | normal | birim | src/features/home/services/unsaved-transition-guard.test.ts:25; :36 | ✅ |
| MOB-KAY-14 | Verilen seçili zikir sıfırlandı (sayım 0) / geçiş / modal gösterilmez (karar M-04) | uç | birim | src/features/home/services/unsaved-transition-guard.test.ts:51; e2e/06-transition-modals.e2e.js:57 | ✅ |
| MOB-KAY-15 | Verilen modal / "Kaydet ve devam" / kayıt + geçiş; kayıt hatasında modal açık kalır, hata görünür | normal | detox | e2e/06-transition-modals.e2e.js:31; :88 | 🟡 (başarı yolu kanıtlı; kayıt hatasında modal açık kalır yolu yok) |
| MOB-KAY-16 | Verilen modal / "Kaydetmeden devam" / ilk kaydedilmemiş değişiklikten önceki sayıma dönülür, geçilir | normal | birim | src/store/dhikr-store.test.ts:108; e2e/05-counter-guest.e2e.js:58 | ✅ |
| MOB-KAY-17 | Verilen modal / "Vazgeç" / hiçbir şey değişmez | normal | detox | e2e/06-transition-modals.e2e.js:31; e2e/05-counter-guest.e2e.js:58 | ✅ |
| MOB-KAY-18 | Verilen misafir / kayıtlı zikirde geçiş / uyarı modalı yok; serbest modda sayım > 0 iken var (karar M-03) | uç | birim | src/features/home/services/unsaved-transition-guard.test.ts:56; e2e/05-counter-guest.e2e.js:58 | ✅ |
| MOB-KAY-19 | Verilen Esma ilerlemesi > 0 ve seçili değil / Esma'ya basınca / "Nasıl devam etmek istersin?"; "Kaldığı yerden" sayımı korur, "Sıfırdan" 0 + önerilen hedef | normal | detox | e2e/06-transition-modals.e2e.js:88; src/features/ai-guide/services/recommendation-start.test.ts:42 | ✅ |
| MOB-KAY-20 | Verilen koleksiyondan "Sayaca Ekle", ilerleme var / olunca / devam/sıfırdan modalı, sonra ana sayfa | normal | detox | — | ❌ |
| MOB-KAY-21 | Verilen AI önerisi seçili zikirle aynı / "Başla" / devam/sıfırdan modalı | normal | detox | src/features/ai-guide/services/recommendation-start.test.ts:42; :46 | 🟡 (hedef kuralı birimde; devam/sıfırdan modalı Detox yok) |

### MOB-HID — Hidrasyon, senkron, çevrimdışı, gün dönümü

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-HID-01 | Verilen sunucuda loglar / yeniden kurulup giriş olunca / Zikirlerim ve sayaçta son loglar görünür | normal | detox | src/features/dhikrs/hooks/use-dhikr-backend-sync.test.ts:42; :83 | 🟡 (hidrasyon birimde; yeniden kurulum + giriş uçtan uca yok) |
| MOB-HID-02 | Verilen vird ve halka logları / hidrasyon / ana sayaca yazılmaz | uç | birim | src/features/dhikrs/hooks/use-dhikr-backend-sync.test.ts:42; :52 | ✅ |
| MOB-HID-03 | Verilen yerelde kaydedilmemiş ilerleme / sunucu daha eski / yerel sayı ve hedef kazanır | uç | birim | src/store/dhikr-store.test.ts:31; :641 | ✅ |
| MOB-HID-04 | Verilen yerel kaydedilmiş / sunucu farklı / sunucu kazanır, `lastActivityAt` sunucudan | normal | birim | src/store/dhikr-store.test.ts:66; :678 | ✅ |
| MOB-HID-05 | Verilen 10 gün önceki log / hidrasyon / "bugün" etkinliği sayılmaz | zaman | birim | src/features/dhikrs/hooks/use-dhikr-backend-sync.test.ts:59 | ✅ |
| MOB-HID-06 | Verilen dün 30/33 çekilmiş / gece yarısı geçince / bugünkü sayaç 0'dan başlar; üyede dünkü kaydedilmemiş sayım için bir kez "kaydet / at" sorulur, kaydet dünün tarihine yazar (karar M-01) | zaman | birim | src/features/home/services/day-rollover.test.ts:9; :58; src/features/dhikrs/hooks/use-dhikr-backend-sync.test.ts:83; src/features/dhikrs/services/dhikr-log-payload.test.ts:15; src/store/dhikr-store-qa.test.ts:96; e2e/11-offline-rollover.e2e.js:72 (Android) | ✅ |
| MOB-HID-07 | Verilen serbest mod damgası dün / gün dönümü / bugünkü toplama ve seriye dünkü serbest sayım girmez | zaman | birim | src/features/stats/services/local-badges.test.ts:59; src/features/widget/widget-snapshot.test.ts:215; :260 | ✅ |
| MOB-HID-08 | Verilen giriş sonrası misafir taşıması bekliyor / hidrasyon / taşıma bitene kadar beklenir | uç | birim (çıkar: src/features/dhikrs/hooks/use-dhikr-backend-sync.ts) | — | ❌ |
| MOB-HID-09 | Verilen Android uçak modu, üye / 5 dokunuş + kaydet → uçak modu kapat / olunca / kayıt otomatik gönderilir (çevrimdışı kuyruk: karar M-20, ayrı iş) | çevrimdışı | detox | — (ayrı iş M-20) | ❌ (ayrı iş M-20; bugün kuyruk yok) |
| MOB-HID-10 | Verilen uçak modu / uygulama açılınca / çökme yok, yerel sayaç çalışır, ağ isteyen ekranlar hata kutusu gösterir | çevrimdışı | detox | — | ❌ |
| MOB-HID-11 | Verilen her API isteği / gönderilince / geçerli IANA saat dilimi `x-client-timezone` başlığında; geçersizse başlık yok | zaman | birim | src/lib/http/client.test.ts:254 | ✅ |
| MOB-HID-12 | Verilen cihaz saat dilimi New York / kaydet / log `date` yerel gün anahtarıyla, sunucu serisi aynı günü sayar | zaman | detox | — | ❌ |
| MOB-HID-13 | Verilen istek 30 sn yanıtsız / olunca / zaman aşımı, geçici hata; AI isteği 120 sn | zaman | birim | src/lib/http/client.test.ts:148; :165; :180; src/features/ai-guide/services/ai-api-client.test.ts:17 | ✅ |
| MOB-HID-14 | Verilen yanıt `{data}` zarflı ya da çıplak / olunca / ikisi de doğru açılır | normal | birim | src/lib/http/client.test.ts:51 | ✅ |
| MOB-HID-15 | Verilen dil EN / sunucu Türkçe hata / kullanıcıya İngilizce yedek metin, kod korunur | dil | birim | src/lib/http/client.test.ts:280 | ✅ |
| MOB-HID-16 | Verilen bozuk/eski persist edilmiş zikir verisi (v0..v4) / açılış / çökme yok, alanlar taşınır, ilerleme korunur | uç | birim | src/store/dhikr-store.test.ts:188; :263; :389; :430; :723 | ✅ |
| MOB-HID-17 | Verilen v5 göçü / silinmiş seed zikirleri / geri eklenmez | uç | birim | src/store/dhikr-store.test.ts:738 | ✅ |

### MOB-SER — Seri başlığı

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-SER-01 | Verilen üye ilk log (sayım > 0) / kaydedince / başlık "Seri 1 gün" (karar M-21) | normal | detox | e2e/02-counter-log-streak.e2e.js:10 | ✅ |
| MOB-SER-02 | Verilen üye / sunucu serisi gelmeden / 0 gösterilir, yerel tahmin gösterilmez | normal | birim | src/features/stats/services/local-streak-rule.test.ts:54; src/features/stats/services/local-badges.test.ts:100 | ✅ |
| MOB-SER-03 | Verilen misafir aynı zikri 7 gün üst üste çekti / başlık / Seri 7 (aktif gün listesi) | zaman | birim | src/features/stats/services/local-badges.test.ts:44; :91 | ✅ |
| MOB-SER-04 | Verilen misafir dün çekti bugün değil / başlık / seri korunur (dünden sayılır) | zaman | birim | src/features/stats/services/local-streak-rule.test.ts:48 | ✅ |
| MOB-SER-05 | Verilen misafir 2 gün boşluk / başlık / seri 0 | zaman | birim | src/features/stats/services/local-streak-rule.test.ts:42 | ✅ |
| MOB-SER-06 | Verilen aktif gün listesi tavanı / eski günler / en eski düşer, yeni gün bir kez eklenir | uç | birim | src/store/dhikr-store.test.ts:490; :517 | ✅ |
| MOB-SER-07 | Verilen hedefi tamamlanmamış ama sayımı > 0 log / üye kaydeder / sunucu serisi sürer, sayımı 0 olan log sürdürmez (karar M-21) | normal | api e2e | T/streaks:251; T/streaks:261 | ✅ |
| MOB-SER-08 | Verilen misafir hedefsiz sadece dokunur / başlık / dokunulan gün seriye sayılır; kural misafir ve üyede tek (karar M-21) | uç | birim | src/features/stats/services/local-streak-rule.test.ts:24 | ✅ |

### MOB-ROZ — Rozetler ve kutlama

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-ROZ-01 | Verilen misafir ömür boyu 99 / 100. dokunuş + 3 sn boşta, ana sayfa / "Yeni rozet kazandın! İlk 100 zikir" | normal | detox | src/features/stats/services/badge-celebration.test.ts:91 | 🟡 (modal metni ve 100. dokunuş + 3 sn boşta Detox yok) |
| MOB-ROZ-02 | Verilen sayaca hâlâ dokunuluyor / rozet hak edildi / modal bekler | uç | birim | src/features/stats/services/badge-celebration.test.ts:136 | ✅ |
| MOB-ROZ-03 | Verilen başka sekme/rota veya açık katman (tur, sheet, modal) / olunca / modal bekler; yalnız /home ve /stats | uç | birim | src/features/stats/services/badge-celebration.test.ts:131; :140; :145 | ✅ |
| MOB-ROZ-04 | Verilen ilk kurulum/güncelleme, zaten kazanılmış rozetler / açılış / sessizce işaretlenir, popup yok | uç | birim | src/features/stats/services/badge-celebration.test.ts:69; src/store/badge-celebration-store.test.ts:53 | ✅ |
| MOB-ROZ-05 | Verilen misafir → üye / sahip değişince / eski rozetler yeniden kutlanmaz | uç | birim | src/features/stats/services/badge-celebration.test.ts:75 | ✅ |
| MOB-ROZ-06 | Verilen yepyeni misafir / ilk gerçek rozet / kutlanır (boş seed) | normal | birim | src/features/stats/services/badge-celebration.test.ts:81 | ✅ |
| MOB-ROZ-07 | Verilen üye, sunucu rozetleri yüklenmedi / olunca / yerel rozete düşmez, bekler | uç | birim | src/features/stats/services/badge-celebration.test.ts:122 | ✅ |
| MOB-ROZ-08 | Verilen kuyrukta rozet / gösterilmeden uygulama öldürülür / yeniden açılışta yine gösterilir | uç | birim (çıkar: src/features/stats/hooks/use-badge-celebration.ts) | — | ❌ |
| MOB-ROZ-09 | Verilen iki rozet aynı anda / olunca / sırayla, tekrarsız | uç | birim | src/features/stats/services/badge-celebration.test.ts:171 | ✅ |
| MOB-ROZ-10 | Verilen rozet listesi / tr ve en / her rozetin etiketi ve kutlama ölçütü var | dil | birim | src/features/stats/services/local-badges.test.ts:127 | ✅ |
| MOB-ROZ-11 | Verilen misafir / vird rozetleri / hep 0 ilerleme | uç | birim | src/features/stats/services/local-badges.test.ts:108 | ✅ |
| MOB-ROZ-12 | Verilen "7 günlük seri" rozeti kapatılınca, day-7 teklifi bekliyor / olunca / mağaza puanlama istemi atlanır; teklif gösterilmişse istenir | premium | birim | src/features/stats/services/badge-celebration.test.ts:151; :155 | ✅ |

### MOB-IST — İstatistik

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-IST-01 | Verilen ücretsiz üye / İstatistik / özet, günlük çubuk (7/30), rozetler açık; ısı haritası, dönem, gün, saat, kaynak, en çok çekilen kilitli | premium | detox | src/features/stats/services/stats-aggregation.test.ts:79 (yalnız misafir bayrağı) | 🟡 |
| MOB-IST-02 | Verilen kilitli bölüm / "Premium ile aç" / premium sayfası | premium | detox | — | ❌ |
| MOB-IST-03 | Verilen premium hesap / İstatistik / tüm bölümler açık | premium | detox | — | ❌ |
| MOB-IST-04 | Verilen premium alındı (seed) / ekrana dönünce / kilit kalkar (sorgu yenilenir) | premium | detox | — | ❌ |
| MOB-IST-05 | Verilen misafir / İstatistik / yerel özet: toplam, bugün, 30 gün serisi, 365 gün ısı haritası, en çok çekilen sıralı | normal | birim | src/features/stats/services/stats-aggregation.test.ts:46; :55; :60; :65; :74 | ✅ |
| MOB-IST-06 | Verilen misafir sayaçları sıfırladı / toplam / ömür boyu sayıya düşer, azalmaz | uç | birim | src/features/stats/services/stats-aggregation.test.ts:109 | ✅ |
| MOB-IST-07 | Verilen üye, sunucu hata + veri yok / olunca / "Tekrar dene" çalışır | çevrimdışı | detox | — | ❌ |
| MOB-IST-08 | Verilen sayı biçimi / tr ve en / binlik ayırıcı ve yüzde işareti dile göre | dil | birim | src/lib/locale-format.test.ts:5; :10 | ✅ |

### MOB-KOL — Koleksiyonlar

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-KOL-01 | Verilen Daha Fazla → Koleksiyonlar / açılınca / kartlar + kategori çipleri (Tümü, Günlük, Namaz, …) | normal | detox | — | ❌ |
| MOB-KOL-02 | Verilen kategori çipi / seçilince / yalnız o kategori | normal | detox | — | ❌ |
| MOB-KOL-03 | Verilen koleksiyon detayı, misafir / "Sayaca Ekle" / ana sayfada o zikir seçili, sayım 0, hedef = önerilen | normal | detox | — | ❌ |
| MOB-KOL-04 | Verilen üye, serbest modda sayım var / "Sayaca Ekle" → "Kaydet ve devam" / ad sayfası açılır (giriş hatası verilmez) | uç | detox | — (B-47 kodda açık) | ❌ (B-47) |
| MOB-KOL-05 | Verilen koleksiyon tamamen ücretsiz / ücretsiz hesap / hiçbir koleksiyonda kilit yok | premium | detox | — | ❌ |
| MOB-KOL-06 | Verilen ağ yok / Koleksiyonlar / "Koleksiyonlar yüklenemedi." | çevrimdışı | detox | — | ❌ |

### MOB-ZKR — Zikirlerim, Esma, kişisel zikir

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-ZKR-01 | Verilen Zikirlerim / filtre Tümü/Aktif/Tamamlanan/Favoriler / aktif = hedef yok veya current<hedef, tamamlanan = current≥hedef | normal | birim (çıkar: src/features/focus/context/zikirlerim-context.tsx) | — | ❌ |
| MOB-ZKR-02 | Verilen "Yeni Zikir" / ad boş / Kaydet pasif | uç | detox | — | ❌ |
| MOB-ZKR-03 | Verilen yeni zikir hedef "0" / kaydedince / sınırsız hedef | normal | detox | — | ❌ |
| MOB-ZKR-04 | Verilen yeni zikir hedef 99999 / kaydedince / yerel ve sunucu aynı değeri tutar (kıskaç tutarlı) | uç | birim | — (B-55: form ≤100000 kabul, yerel store 9999 kıskacı sürüyor; test yok) | ❌ (B-55) |
| MOB-ZKR-05 | Verilen üye yeni zikir / API hatası / geri alınır + hata | çevrimdışı | detox | — | ❌ |
| MOB-ZKR-06 | Verilen ana sayaçta kaydedilmemiş ilerleme / Zikirlerim'de yeni zikir oluşturulunca / sayaç sessizce değişmemeli | uç | detox | — (B-45 kodda açık) | ❌ (B-45) |
| MOB-ZKR-07 | Verilen kişisel zikir / "Güncelle" / ad, okunuş, anlam, hedef değişir; API hatasında geri alınır | normal | detox | — | ❌ |
| MOB-ZKR-08 | Verilen kişisel zikir / "Sil" → onay / listeden kalkar, sunucuda zikir + logları silinir; katalog zikrinde yalnız ilerleme temizlenir | normal | detox | — | ❌ |
| MOB-ZKR-09 | Verilen silme API hatası / olunca / hata görünür, öğe kalır | çevrimdışı | detox | — (B-48 kodda açık) | ❌ (B-48) |
| MOB-ZKR-10 | Verilen "Favoriye Ekle" / basınca / Favoriler filtresinde; üye API hatasında geri alınır | normal | detox | — | ❌ |
| MOB-ZKR-11 | Verilen "Başlat" / serbest modda sayım var / kaydedilmemiş uyarısı çıkar | uç | detox | — (B-46 kodda açık) | ❌ (B-46) |
| MOB-ZKR-12 | Verilen "Başlat" / olunca / ana sayfa, zikir seçili, üyede son log sayısı | normal | detox | — | ❌ |
| MOB-ZKR-13 | Verilen misafir / Zikirlerim / kişisel + sayımı >0 katalog zikirleri; üye log alınamazsa yalnız kişiseller | çevrimdışı | birim (çıkar: src/features/focus/context/zikirlerim-context.tsx) | — | ❌ |
| MOB-ZKR-14 | Verilen ana sayfa Esma listesi, ağ yok / Esma'ya basınca / "Esma zikri bulunamadı" görünür (sessiz değil) | çevrimdışı | detox | — | ❌ |
| MOB-ZKR-15 | Verilen EN dil / Esma ve 8 seed zikir / onaylı İngilizce ad + anlam (G1 Tablo C) | dil | birim | src/features/focus/esma-en-content.test.ts:8; :18; :27 | ✅ |
| MOB-ZKR-16 | Verilen son etkinlik etiketi / dil tr→en / "Bugün HH:MM" dile ve gerçek tarihe göre | dil | birim | src/store/register-dhikr-store-text.test.ts:21; src/features/home/services/local-streak.test.ts:5 | 🟡 (etiket tarihe bakmıyor — hafıza) |

### MOB-ESM — Günlük Esma karşılama

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-ESM-01 | Verilen tur bitti, gün içinde ilk açılış / ana sayfa boşta / "Hoş geldin" 3 Esma önerisi | normal | detox | src/features/home/services/daily-esma-suggestion-service.test.ts:18; e2e/11-offline-rollover.e2e.js:72 (yeni günde karşılama görünür, yalnız Android; 3 öneri içeriği doğrulanmıyor) | 🟡 |
| MOB-ESM-02 | Verilen aynı gün / tekrar açılış / modal yok; ertesi gün yeni ve tekrarsız 3 öneri | zaman | birim | src/features/home/services/daily-esma-suggestion-service.test.ts:25; :38 | ✅ |
| MOB-ESM-03 | Verilen modal / "Sonra bak" veya Android geri / görüldü sayılır | normal | detox | e2e/11-offline-rollover.e2e.js:72 (yalnız "Sonra bak" ile kapanır; görüldü işareti ve Android geri doğrulanmıyor) | 🟡 |
| MOB-ESM-04 | Verilen modal / "Başla" / o Esma sayaca (gerekirse devam/sıfırdan modalı) | normal | detox | src/features/home/services/home-navigation-intent-store.test.ts:21 (yalnız niyet deposu; modal "Başla" akışı yok) | 🟡 |
| MOB-ESM-05 | Verilen modal / "Tümünü gör" / ana sayfa Esma bölümüne kayar | normal | detox | src/features/home/services/home-navigation-intent-store.test.ts:31 (yalnız niyet deposu; kaydırma yok) | 🟡 |
| MOB-ESM-06 | Verilen kaydedilmemiş zikir / bildirim izni modalı açık / karşılama ertelenir | uç | birim (çıkar: src/features/home/hooks/use-daily-esma-welcome.ts) | — | ❌ |
| MOB-ESM-07 | Verilen misafir / serbest veya kayıtlı zikir sayımı var / günlük Esma karşılaması çıkar: misafir "kaydedilmemiş" sayılmaz (karar M-03) | uç | birim | src/features/home/services/unsaved-transition-guard.test.ts:65 | ✅ |

### MOB-VRD — Vird hub, editör, şablon, çakışma

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-VRD-01 | Verilen program yok / ana sayfa "Vird kur" / hub açılır | normal | detox | e2e/03-vird-guided-session.e2e.js:13 | ✅ |
| MOB-VRD-02 | Verilen misafir / hub / "Misafir modundasın — bu cihazda saklanır" ipucu | normal | detox | — | ❌ |
| MOB-VRD-03 | Verilen üye, senkron hatası / hub / "Vird programların şu anda senkronlanamadı." | çevrimdışı | detox | src/store/vird-store.test.ts:89 | 🟡 |
| MOB-VRD-04 | Verilen "Kendim kurayım" / editör / varsayılan dilim sabah + akşam, vakitler 1–5, ad boşsa "Sabah-Akşam virdi" | normal | birim | src/features/vird/services/vird-editor-helpers.test.ts:59; :67 (yalnız otomatik başlık; varsayılan dilim/vakitler doğrulanmıyor) | 🟡 |
| MOB-VRD-05 | Verilen editör / hiç zikir yok / "En az bir dilime bir zikir eklemelisin." | uç | detox | — | ❌ |
| MOB-VRD-06 | Verilen kapalı dilimde zikir var / kaydedince / o zikirler programa girmez | uç | birim (çıkar: src/features/vird/screens/vird-editor-screen.tsx) | src/features/vird/services/vird-editor-helpers.test.ts:205 | ✅ |
| MOB-VRD-07 | Verilen ücretsiz, 3 farklı zikir / 4. farklı zikir seçilince / eklenmez, premium sayfası | premium | detox | src/features/vird/services/vird-editor-helpers.test.ts:49 (yalnız limit mantığı; premium sayfası yok) | 🟡 |
| MOB-VRD-08 | Verilen ücretsiz, aynı zikir başka dilimde / eklenince / limitten sayılmaz | uç | birim | src/features/vird/services/vird-editor-helpers.test.ts:21; :39 | ✅ |
| MOB-VRD-09 | Verilen premium / 4+ zikir / serbest | premium | birim | src/features/vird/services/vird-editor-helpers.test.ts:35 | ✅ |
| MOB-VRD-10 | Verilen hedef "0" / öğe hedefi / en az 1'e kıskaçlanır | uç | birim (çıkar: src/features/vird/screens/vird-editor-screen.tsx) | src/features/vird/services/vird-editor-helpers.test.ts:213 | ✅ |
| MOB-VRD-11 | Verilen üye / "Kaydet ve başlat" / hub, "Vird başlatıldı", bugünkü kart dilim satırlarıyla | normal | detox | e2e/03-vird-guided-session.e2e.js:13 | ✅ |
| MOB-VRD-12 | Verilen misafir / "Kaydet ve başlat" / yerel aktif program, hub kartı | normal | detox | — | ❌ |
| MOB-VRD-13 | Verilen "Kaydet ve başlat"a çift dokunuş / olunca / tek program | uç | detox | — | ❌ |
| MOB-VRD-14 | Verilen mevcut program "Düzenle" / kaydedince / aynı program güncellenir (yeni program oluşmaz) | normal | detox | src/store/vird-store.test.ts:153; :162; e2e/08-vird-free.e2e.js:73 (yeni program oluşmaması ayrıca doğrulanmıyor) | 🟡 |
| MOB-VRD-15 | Verilen duraklatılmış program düzenlenip kaydedilir / olunca / durum değişmez (paused kalır), ayrı "Aktifleştir" gerekir (karar M-22) | uç | detox | src/features/vird/services/vird-editor-helpers.test.ts:190; e2e/08-vird-free.e2e.js:73 | ✅ |
| MOB-VRD-16 | Verilen yolculuk (journey) programı / editör / fazlar salt-okunur, yalnız ad + vakit; "Kopyala ve uyarla" → bugünkü fazdan rutin + "(kopya)" | normal | detox | src/features/vird/services/vird-editor-helpers.test.ts:80 (yalnız faz→editör eşlemesi; salt-okunur faz / "Kopyala ve uyarla" yok) | 🟡 |
| MOB-VRD-17 | Verilen ücretsiz, 1 aktif program / ikinci programı başlatınca / "Aktif programı değiştir" modalı (3 seçenek) | premium | detox | e2e/08-vird-free.e2e.js:55 (modal açılır; 3 seçeneğin hepsi doğrulanmıyor) | 🟡 |
| MOB-VRD-18 | Verilen çakışma / "Değiştir ve başlat" / hedef dışı TÜM aktifler duraklar, yeni aktif; yine limit gelirse hata, modal döngüsü yok | premium | detox | e2e/08-vird-free.e2e.js:55; src/features/vird/services/vird-ai-create-service.test.ts:207 (limit hatası / modal döngüsü yok doğrulanmıyor) | 🟡 |
| MOB-VRD-19 | Verilen çakışma / "Premium'a geç" → satın alma (seed) / aktivasyon kendiliğinden sürer | premium | detox | ⛔ satın alma mağaza arayüzü (B-22 kodla düzeltildi, yalnız elle) | ⛔ |
| MOB-VRD-20 | Verilen çakışma / "Taslak olarak bırak" veya geri / hub, "Taslak olarak kaydedildi" | normal | detox | — | ❌ |
| MOB-VRD-21 | Verilen misafir yerel 1 aktif / ikinci yerel program / istemci tarafı aynı çakışma kuralı; premiumda yok | premium | birim (çıkar: src/features/vird/hooks/use-vird-program-actions.ts) | — | ❌ |
| MOB-VRD-22 | Verilen premium 10 aktif / 11. aktivasyon / "En fazla 10 aktif vird programın olabilir." | uç | detox | src/features/vird/services/vird-i18n-keys.test.ts:10 | 🟡 (yalnız çeviri anahtarı) |
| MOB-VRD-23 | Verilen diğer programlar listesi / "Duraklat"/"Aktifleştir"/"Sil"→onay / durum değişir, silinen kalkar, aktif silinirse aktif yok | normal | detox | src/store/vird-store.test.ts:174; :184; e2e/08-vird-free.e2e.js:55 (aktifleştir/duraklat; "Sil"→onay doğrulanmıyor) | 🟡 |
| MOB-VRD-24 | Verilen yolculuk son günü geçti / hub / "Program tamamlandı" | zaman | birim | src/features/vird/services/vird-day.test.ts:273; src/features/widget/widget-snapshot.test.ts:604 (hub metni yok) | 🟡 |
| MOB-VRD-25 | Verilen şablon rafı / ücretsiz hesap / klasik şablonlar rozetsiz; Ramazan/Esma/Kandil yolculukları "Premium" rozetli | premium | detox | e2e/08-vird-free.e2e.js:102 (klasik şablon ücretsiz aktifleşir, Esma-33 premium paywall; rozet doğrulanmıyor) — karar yok (Ç-3) | ❓ (docs ↔ hafıza çelişkisi, Ç-3) |
| MOB-VRD-26 | Verilen ücretsiz / premium şablon "Programı başlat" / premium sayfası | premium | detox | e2e/08-vird-free.e2e.js:102 | ✅ |
| MOB-VRD-27 | Verilen klasik şablon, misafir/ücretsiz / "Programı başlat" / aktif program, başlangıç = şablon `anchorDate` ya da bugün | normal | detox | src/features/vird/services/vird-editor-helpers.test.ts:130; :159; e2e/08-vird-free.e2e.js:102 | ✅ |
| MOB-VRD-28 | Verilen şablon listesi yüklenemedi / raf / hata + tekrar dene | çevrimdışı | detox | — | ❌ (yeniden deneme yok) |
| MOB-VRD-29 | Verilen yerel program sunucuya itilir, 409 / olunca / clientId ile mevcut programa bağlanır; 400 olduğu gibi döner | uç | birim | src/features/vird/services/vird-sync.test.ts:171; :182 | ✅ |
| MOB-VRD-30 | Verilen sunucu listesi geldi / birleştirme / clientId eşleşen değişir, yerel-yalnız korunur, gün ilerlemesi max ile | uç | birim | src/store/vird-store.test.ts:284; :300 | ✅ |
| MOB-VRD-31 | Verilen aktif program sunucuda yok oldu / birleştirme / ilk aktif sunucu programı; yoksa null | uç | birim | src/store/vird-store.test.ts:332; :344 | ✅ |
| MOB-VRD-32 | Verilen bozuk persist edilmiş vird verisi / açılış / güvenli varsayılan, geçerli alanlar korunur | uç | birim | src/store/vird-store.test.ts:445; :459 | ✅ |
| MOB-VRD-33 | Verilen bugünkü kart / saat 11:59 → 12:00 → 17:00 → 21:00 → 00:30 / "Şimdi" dilimi sabah → namaz sonrası → akşam → gece → gece | zaman | birim | src/features/vird/services/vird-now.test.ts:50; :55; :65; :75; :80 | ✅ |
| MOB-VRD-34 | Verilen konum var / "Şimdi" / gerçek vakit sınırları (imsak öncesi gece, imsak–öğle sabah …) | zaman | birim | src/features/vird/services/vird-now.test.ts:96; :101; :111 | ✅ |
| MOB-VRD-35 | Verilen saat dilimi tamamlandı / "Şimdi" / sıradaki eksik dilime döner | normal | birim | src/features/vird/services/vird-now.test.ts:15 | ✅ |
| MOB-VRD-36 | Verilen bugünkü kart / yüzde ve "N/M zikir", "N/M vakit" | normal | birim (çıkar: src/features/vird/components/todays-vird-card.tsx) | src/features/vird/services/vird-day.test.ts:175; :220 | 🟡 |
| MOB-VRD-37 | Verilen kart açık kalır / gece yarısı geçer / kart yeni güne geçer (dünkü tamamlanma bugünü tamamlamaz) | zaman | birim | src/features/widget/widget-snapshot.test.ts:558 (widget için; kart için yok) | 🟡 (widget için; kart için yok) |
| MOB-VRD-38 | Verilen vird serisi / bugün eksik, dün tamam / dünden sayılır; bugün tamamlanınca bugünden | zaman | birim | src/features/vird/services/vird-streak.test.ts:33; :48 | ✅ |
| MOB-VRD-39 | Verilen namaz sonrası dilimi / vakit seçimi 2,4 / yalnız seçili vakitler beklenir | normal | birim | src/features/vird/services/vird-day.test.ts:114 | ✅ |
| MOB-VRD-40 | Verilen başlangıçtan önceki gün / bugünkü öğeler / boş | zaman | birim | src/features/vird/services/vird-day.test.ts:39; src/features/vird/services/vird-session.test.ts:47 | ✅ |
| MOB-VRD-41 | Verilen iki program aynı zikri aynı dilimde içerir / program değiştirilince aynı gün / ilerleme program kimliğine bağlı, yeni programa geçmez (karar M-23) | uç | birim | src/features/vird/services/vird-day.test.ts:305; src/store/vird-store.test.ts:416 | ✅ |

### MOB-VSE — Vird rehberli seans

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-VSE-01 | Verilen sabah dilimi 2 zikir hedef 2 / 2 dokunuş → "Sonraki" → 2 dokunuş → "Bitir" / kart "tamamlandı" | normal | detox | e2e/03-vird-guided-session.e2e.js:13 | ✅ |
| MOB-VSE-02 | Verilen seans / hedefe ulaşınca / sayım hedefte durur, otomatik geçiş YOK | uç | detox | — | ❌ |
| MOB-VSE-03 | Verilen hedef öncesi / "Atla" / sıradaki eksik öğe; "Sonraki" yalnız hedef dolunca görünür | normal | detox | src/features/vird/services/vird-session.test.ts:65 (yalnız sıradaki öğe seçimi; "Atla"/"Sonraki" görünürlüğü yok) | 🟡 |
| MOB-VSE-04 | Verilen son eksik öğe / "Sonraki" / baştaki eksik öğeye sarar; hepsi tamamsa yok | uç | birim | src/features/vird/services/vird-session.test.ts:69; :73; :77 | ✅ |
| MOB-VSE-05 | Verilen "2/3 · 47 tekrar kaldı" / hedefi aşan öğe / kalan 0 sayılır | uç | birim | src/features/vird/services/vird-session.test.ts:83; :91 | ✅ |
| MOB-VSE-06 | Verilen dilim tamam, sıradaki eksik dilim var / olunca / "… virdi tamamlandı ✓" + "Sıradaki: <dilim>" | normal | detox | src/features/vird/services/vird-session.test.ts:100; :109 (yalnız mantık; başlık/"Sıradaki" metni yok) | 🟡 |
| MOB-VSE-07 | Verilen tüm gün tamam / olunca / "Bugünkü vird tamamlandı 🎉" + seri; mağaza puanlama istemi bir kez | normal | detox | src/features/vird/services/vird-session.test.ts:127 (yalnız mantık; kutlama metni, seri, puanlama istemi yok) | 🟡 |
| MOB-VSE-08 | Verilen seans ortası / X / ilerleme sunucuya yazılır, kart günceldir | normal | detox | — | ❌ |
| MOB-VSE-09 | Verilen seans ortası / uygulama arka plana → öldür → aç / ilerleme kalıcı, seans kaldığı yerden | uç | detox | — | ❌ |
| MOB-VSE-10 | Verilen uçak modu / seans + X / yerel ilerleme korunur; ağ gelince sonraki tetikte gönderilir | çevrimdışı | detox | — (ayrı iş M-20: çevrimdışı kuyruk) | ❌ (ayrı iş M-20) |
| MOB-VSE-11 | Verilen misafir / seans / yalnız yerel; ağ isteği yok | normal | birim (çıkar: src/features/vird/screens/vird-session-screen.tsx) | — | ❌ |
| MOB-VSE-12 | Verilen öğe sıfırlanır / X'ten önce ön plana dönülür / sıfırlama geri alınmamalı | uç | detox | src/store/vird-store.test.ts:259; :270 (yalnız depo; ön plan senkronu/X akışı yok) | ❓ (B-41; karar yok) |
| MOB-VSE-13 | Verilen `/vird/session` parametresiz/geçersiz program / açılınca / ana sayfaya yönlenir, çökme yok | uç | detox | — | ❌ |
| MOB-VSE-14 | Verilen seans gece yarısını geçer / dokunuş / sayım dokunuş anının gününe yazılır (karar M-24) | zaman | birim (çıkar: src/features/vird/screens/vird-session-screen.tsx) | src/features/vird/services/vird-session.test.ts:282; :290 (yalnız saf mantık; ekran akışı yok) | 🟡 |
| MOB-VSE-15 | Verilen log yükü / katalog vs kişisel ref, namaz vakti / doğru alanlar, count [0,hedef] kıskaç, `isCompleted` = count≥hedef | uç | birim | src/features/vird/services/vird-session.test.ts:201; :215; :234; :248 | ✅ |
| MOB-VSE-16 | Verilen yerel (senkronlanmamış) program / log / vird alanları gönderilmez | uç | birim | src/features/vird/services/vird-session.test.ts:151 | ✅ |
| MOB-VSE-17 | Verilen yerel ilerleme / max birleştirme / düşük değer yüksek değeri ezmez, tamamlandı kalıcı | uç | birim | src/store/vird-store.test.ts:210; :226 | ✅ |

### MOB-VHT — Vird hatırlatmaları

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-VHT-01 | Verilen ücretsiz / hatırlatma kartı / toggle yok, tek "Premium ile aç" | premium | detox | — | ❌ |
| MOB-VHT-02 | Verilen premium / aç → izin ver / bugün + yarın için hatırlatmalar kurulur | premium | detox | src/features/vird/services/vird-reminder-notifications.test.ts:99; :171 (izin diyaloğu/toggle akışı yok) | 🟡 |
| MOB-VHT-03 | Verilen premium / aç → izin reddedilir / toggle kapalı kalır | uç | detox | — | ❌ |
| MOB-VHT-04 | Verilen konum yok / kurulum / sabit 07:00 · 13:00 · 19:00 · 22:00 (+ namaz vakti hatırlatmaları) | zaman | birim | src/features/vird/services/vird-reminder-notifications.test.ts:116 (etiket ↔ gerçek saatler, B-43) | 🟡 (etiket ↔ gerçek saatler, B-43) |
| MOB-VHT-05 | Verilen "Konumu kullan" reddedilir / olunca / sessizce sabit saat kalır | uç | detox | — | ❌ |
| MOB-VHT-06 | Verilen dilim bugün tamam / kurulum / bugünkü atlanır, yarınki kurulur; geçmiş saat kurulmaz | zaman | birim | src/features/vird/services/vird-reminder-notifications.test.ts:220; :236; :253 | ✅ |
| MOB-VHT-07 | Verilen yalnız seçili dilimler / kurulum / yalnız onlar | normal | birim | src/features/vird/services/vird-reminder-notifications.test.ts:268 | ✅ |
| MOB-VHT-08 | Verilen kapalı veya aktif program yok / kurulum / hepsi iptal; izin yoksa dokunulmaz | uç | birim | src/features/vird/services/vird-reminder-notifications.test.ts:81; :140; :153 | ✅ |
| MOB-VHT-09 | Verilen premium biter / olunca / vird hatırlatmaları durur, program kalır (karar A-07 + M-13) | premium | birim (çıkar: src/features/vird/hooks/use-vird-reminder-sync.ts) | src/features/vird/services/vird-reminder-notifications.test.ts:99 | ✅ |
| MOB-VHT-10 | Verilen hatırlatmaya dokunuş / olunca / `/vird?slot=…` hub vurgulu dilim | normal | birim | src/features/notifications/services/notification-tap-routing.test.ts:40; :49 | ✅ |

### MOB-VAI — AI ile vird programı

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-VAI-01 | Verilen misafir / "AI ile oluştur" / üye ol modalı | normal | detox | — | ❌ |
| MOB-VAI-02 | Verilen üye ≥3 kredi / süre 7, dilim sabah, gönder / önizleme → "Programı Başlat" → hub "başlatıldı", 3 kredi düşer | normal | detox | e2e/13-vird-premium.e2e.js:53 (Başlat → aktif, kaynak ai; 3 kredi düşmesi + hub mesajı doğrulanmıyor) | 🟡 |
| MOB-VAI-03 | Verilen kredi < 3 / gönder / premium sayfası; satın alma sonrası üretim kendiliğinden sürer | premium | detox | src/features/ai-shared/services/ai-credits.test.ts:23; :27 (yalnız kredi eşiği; premium sayfası + üretimin sürmesi yok) | 🟡 |
| MOB-VAI-04 | Verilen dilim seçilmedi / olunca / "En az bir dilim seçmelisin.", düğme pasif | uç | detox | — | ❌ |
| MOB-VAI-05 | Verilen sunucu 503 / olunca / amber kutu + "Tekrar dene" aynı flowId ile; kredi düşmez | uç | detox | src/features/vird/services/vird-ai-create-service.test.ts:83 (yalnız hata sınıflama; Rehber için e2e/09-ai-modes.e2e.js:60; vird amber/aynı flowId yok) | 🟡 |
| MOB-VAI-06 | Verilen gönder'e çift dokunuş / olunca / tek üretim, 3 kredi | uç | detox | src/features/ai-shared/services/in-flight-guard.test.ts:5; e2e/09-ai-modes.e2e.js:82 (Rehber; vird gönder e2e yok) (B-23 düzeltildi) | 🟡 |
| MOB-VAI-07 | Verilen önizleme / "Vazgeç" / program hub'da taslak olarak kalmamalı | uç | detox | e2e/13-vird-premium.e2e.js:53; src/features/vird/services/vird-ai-create-service.test.ts:215 | ✅ |
| MOB-VAI-08 | Verilen istek yükü / boş niyet, namaz vakti seçili değil / freeText ve prayerSelection gönderilmez, vakitler sıralı | uç | birim | src/features/vird/services/vird-ai-create-service.test.ts:31; :37; :42; :50 | ✅ |
| MOB-VAI-09 | Verilen çakışma (ücretsiz 1 aktif) / "Mevcut programı duraklat ve başlat" / tüm diğer aktifler durur | premium | detox | src/features/vird/services/vird-ai-create-service.test.ts:207 | 🟡 |

### MOB-HAL — Zikir Halkası

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-HAL-01 | Verilen misafir / ana sayfa halka kartı → hub / "giriş yapmalısın" ipucu, liste yok; "Yeni halka" → üye ol modalı | normal | detox | — | ❌ |
| MOB-HAL-02 | Verilen ücretsiz üye, aktif halka yok / yeni halka → zikir seç → oluştur / detay, 8 haneli kod, "1/5 üye" | premium | detox | e2e/04-circle-ai-premium.e2e.js:51 (:62) | ✅ |
| MOB-HAL-03 | Verilen ücretsiz üye, 1 aktif halka / ikinci halka gönderilince / premium sayfası (PREMIUM_REQUIRED) | premium | detox | e2e/04-circle-ai-premium.e2e.js:51 (:72) | ✅ |
| MOB-HAL-04 | Verilen premium / halka kur / kod `[A-HJ-NP-Z2-9]{8}`, "1/200" | premium | detox | e2e/04-circle-ai-premium.e2e.js:90 (:116 regex gevşek; "1/200" doğrulanmıyor) | 🟡 |
| MOB-HAL-05 | Verilen oluştur / zikir seçilmedi / "Lütfen bir zikir seç." | uç | detox | — | ❌ |
| MOB-HAL-06 | Verilen hedef 0, 10.000.001, harf / gönder / "Hedef 1 ile 10.000.000 arasında…"; 1 ve 10.000.000 kabul | uç | birim (çıkar: src/features/circle/screens/circle-create-screen.tsx) | — | ❌ |
| MOB-HAL-07 | Verilen süre çipleri / varsayılan 30 gün, hedef 1000 / 7/30/40/Süresiz seçilebilir, bitiş = bugün+N | normal | birim (çıkar: src/features/circle/screens/circle-create-screen.tsx) | — | ❌ |
| MOB-HAL-08 | Verilen ad boş / oluştur / halka adı = zikir adı | normal | detox | — | ❌ |
| MOB-HAL-09 | Verilen bitiş etiketi / kurucunun saat dilimi `expiresAt` / izleyenin kendi saat diliminde son dahil dakika | zaman | birim | src/features/circle/services/circle-end-label.test.ts:9; :15; :22 | ✅ |
| MOB-HAL-10 | Verilen hub "Kodla katıl" / ham kod, boşluklu/tireli, küçük harf, `/halka/` linki, `?code=` linki / kabul, büyük harfe | normal | prop | src/features/circle/services/circle-share.test.ts:64; :68; :72; :76; :85 | ✅ |
| MOB-HAL-11 | Verilen kod O/0/1/I içerir, 7/9 hane, RTL işareti / olunca / "Geçersiz davet kodu." | uç | prop | src/features/circle/services/circle-share.test.ts:80; :85; :119; :123 | ✅ |
| MOB-HAL-12 | Verilen paylaş metni (tr ve en) / kopyalanıp kodla katıl'a yapıştırılınca / aynı kod çözülür | dil | prop | src/features/circle/services/circle-share.test.ts:109; :114 | ✅ |
| MOB-HAL-13 | Verilen ikinci hesap (API) kodla katılır / kurucu detayı / üye sayısı 2/5, üye adı görünür, bireysel sayı görünmez | normal | detox | e2e/07-circle-two-members.e2e.js:55 (:58 "2/5"; üye adı ve bireysel sayı gizliliği doğrulanmıyor) | 🟡 |
| MOB-HAL-14 | Verilen 5/5 dolu ücretsiz halka / 6. hesap katılınca / "Bu halka dolu." | uç | detox | e2e/07-circle-two-members.e2e.js:99 | ✅ |
| MOB-HAL-15 | Verilen soğuk derin bağlantı `zikirmatik://circle/join?code=KOD`, misafir / Katıl / üye ol modalı; giriş sonrası katılım | normal | detox | e2e/07-circle-two-members.e2e.js:55 (yalnız üye için; misafir/üye ol modalı yok; girişten sonra devam M-17 ayrı iş) | ❌ |
| MOB-HAL-16 | Verilen kapalı/tamamlanmış halka kodu / katıl ekranı / "Bu halka artık aktif değil.", düğme pasif | uç | detox | e2e/07-circle-two-members.e2e.js:81 | ✅ |
| MOB-HAL-17 | Verilen detay / "Paylaş" / sistem paylaşımı: "<ad> zikir halkasına katıl! <link> Kod: KOD", tek https linki | normal | birim | src/features/circle/services/circle-share.test.ts:12; :27; :32; :38 (paylaşım sayfası açılışı ⛔ native paylaşım sayfası) | 🟡 |
| MOB-HAL-18 | Verilen EN kullanıcı / paylaş / link `/en/halka/KOD`, TR kökte `/halka/KOD` (karar M-09) | dil | birim | src/features/circle/services/circle-share.test.ts:19; :12 | ✅ |
| MOB-HAL-19 | Verilen detay açık / başka üye API ile sayar / ≤15 sn içinde toplam ve "Bugün N/M üye katıldı" güncellenir | zaman | detox | — | ❌ |
| MOB-HAL-20 | Verilen oturum / 10 dokunuş / büyük rakam = halka toplamı +10, "Sen bugün: 10"; ≤3 sn içinde sunucuya akar | normal | detox | e2e/07-circle-two-members.e2e.js:55 (3+2 dokunuş: :61 sayaç etiketi, :66-68 sunucuya akış; 10 dokunuş ve "Sen bugün" doğrulanmıyor) | 🟡 |
| MOB-HAL-21 | Verilen oturum açık / diğer üye API ile sayar / ≤5 sn içinde toplam artar, asla geri gitmez | zaman | detox | src/features/circle/services/circle-share.test.ts:129; :133; :137; src/store/circle-store.test.ts:146; :160 (diğer üyenin sayımı ≤5 sn Detox yok) | 🟡 |
| MOB-HAL-22 | Verilen toplam formülü / her (prev, serverTotal, serverMine, localMine) / sonuç ≥ prev ve ≥ 0 | uç | prop | src/features/circle/services/circle-share.test.ts:129-157 (örnek tabanlı, fast-check yok) | 🟡 |
| MOB-HAL-23 | Verilen sunucuda bugün 50 katkım var / ilk poll gelmeden 3 dokunuş / 53 olmalı (dokunuşlar ezilmez) | uç | birim (çıkar: src/features/circle/screens/circle-session-screen.tsx) | src/features/circle/services/circle-session-logic.test.ts:37 (B-32 tohum = yerel/sunucu payının büyüğü); :48 (M-12 ilk detay gelene kadar dokunuş yok); ekranda 3 dokunuş → 53 yok | 🟡 |
| MOB-HAL-24 | Verilen hedef dolmak üzere / son dokunuşlar / hedefe ulaşınca sayaç anında yerel kilit + son gönderim, "hedefine ulaştı" bildirimi, puanlama istemi bir kez (karar M-11) | normal | detox | e2e/07-circle-two-members.e2e.js:55 (:63 kilit, :65-68 son gönderim); src/features/circle/services/circle-session-logic.test.ts:54 (isGoalReached); bildirim/puanlama istemi doğrulanmıyor | 🟡 |
| MOB-HAL-25 | Verilen kurucu kapattı / oturum açık üye / ≤5 sn içinde "kapatıldı" + sayaç kilitli | normal | detox | e2e/07-circle-two-members.e2e.js:71 | ✅ |
| MOB-HAL-26 | Verilen oturum / arka plana alınınca / bekleyen sayım hemen gönderilir | uç | detox | — (kodda AppState dinleyicisi var: circle-session-screen.tsx:235; test yok) | ❌ |
| MOB-HAL-27 | Verilen uçak modu oturumda / 10 dokunuş → uçak modu kapalı / sayım kaybolmadan gönderilir | çevrimdışı | detox | e2e/07-circle-two-members.e2e.js:122 (yalnız Android; iOS atlanır); src/features/circle/services/circle-session-logic.test.ts:24 (B-33) | ✅ |
| MOB-HAL-28 | Verilen oturum gece yarısını geçer / dokunuş / sayım dokunuş anının gününe yazılır, gönderilmeyen günler ayrı gider (`?date=`) (karar M-24) | zaman | birim (çıkar: src/features/circle/screens/circle-session-screen.tsx) | src/features/circle/services/circle-session-logic.test.ts:5; :14; :24; src/features/circle/services/circle-api-client.test.ts:6 | ✅ |
| MOB-HAL-29 | Verilen bugünkü yerel sayım / yeni gün / önceki gün birikmez, değişir | zaman | birim | src/store/circle-store.test.ts:116 | ✅ |
| MOB-HAL-30 | Verilen kurucu olmayan üye / "Ayrıl" → onay / listeden çıkar, katkısı toplamda kalır | normal | detox | e2e/07-circle-two-members.e2e.js:111 (liste/üyelik temizlenir; katkının toplamda kalması yalnız API A-05) | 🟡 |
| MOB-HAL-31 | Verilen kurucu / "Kapat" → onay / durum kapalı, sayaç kilitli; kurucu olmayan "Kapat" görmez | normal | detox | — (07:71 kapatmayı API ile yapıyor; kurucunun UI Kapat onayı yok) | ❌ |
| MOB-HAL-32 | Verilen ayrıl/kapat API hatası / olunca / kullanıcıya hata | çevrimdışı | detox | src/features/circle/services/circle-api-client.test.ts:48 (hata→metin eşlemesi); ekran/Detox actionError yok | 🟡 |
| MOB-HAL-33 | Verilen bilinmeyen / üyesi olunmayan halka id'si (derin bağlantı) / açılınca / "Halka bulunamadı" (boş sayfa değil) | uç | detox | e2e/07-circle-two-members.e2e.js:94; src/features/circle/services/circle-api-client.test.ts:48 | ✅ |
| MOB-HAL-34 | Verilen ana sayfa, aktif halka var / kart / "Devam et" → oturum, ayrı "Halkaya git" → hub (ikinci halka → paywall yolu) | normal | detox | — (testID e2e-circle-home-card-hub var, test kullanmıyor; kodda ayrı "Halkaya git" var) | ❌ |
| MOB-HAL-35 | Verilen halka bitiş push'una dokunuş / olunca / `/circle/<24 hex>`; büyük harf/23 hane/ek yol reddedilir | uç | birim | src/features/notifications/services/notification-tap-routing.test.ts:74; :79; :85; :91 | ✅ |
| MOB-HAL-36 | Verilen halka log yükü / olunca / `source:circle`, `isCompleted:false`, hedef = goalCount, vird alanı yok | normal | birim | src/features/circle/services/circle-share.test.ts:160; :180; :190; :200; :221 | ✅ |
| MOB-HAL-37 | Verilen her halka hata kodu / tr ve en / çeviri anahtarı var, bilinmeyen kod yedek metin | dil | birim | src/features/circle/services/circle-i18n-keys.test.ts:21; src/features/circle/services/circle-api-client.test.ts:28; :39 | ✅ |
| MOB-HAL-38 | Verilen EN dil / misafir üye satırı / "Guest" (TR sabit metne bağlı değil) | dil | detox | — (kod düzeltilmiş: circle-detail-screen.tsx:197 guestMember; test yok) | ❌ |

### MOB-AIR — AI Rehber

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-AIR-01 | Verilen üye, mock / niyet yaz → gönder / öneri kartları (ilki "birincil"), fazilet + kaynak | normal | detox | e2e/04-circle-ai-premium.e2e.js:119; src/features/ai-guide/services/ai-guide-localize.test.ts:18 (ilk = birincil) | ✅ |
| MOB-AIR-02 | Verilen misafir / gönder / üye ol modalı, istek yok | normal | detox | — | ❌ |
| MOB-AIR-03 | Verilen öneri çipi ("İçim sıkıldı") / basınca / girdiye yazar, otomatik göndermez | normal | detox | — | ❌ |
| MOB-AIR-04 | Verilen girdi boş/yalnız boşluk / gönder / düğme pasif (kredi harcanmaz, "genel öneri" yok); sunucu boş freeText'i özel gün/bildirim önerileri için kabul eder (karar ayrı iş: MOB-AIR-04) | uç | detox | e2e/09-ai-modes.e2e.js:52; src/features/ai-guide/services/intent-input.test.ts:5; :9 | ✅ |
| MOB-AIR-05 | Verilen ilerleme soketi bağlanamaz (6 sn) / istek / yine gönderilir, "Hazırlanıyor..." yedek etiket | uç | birim | src/features/ai-shared/hooks/use-ai-progress-steps.test.ts:23; src/features/ai-guide/services/ai-progress-socket.test.ts:35 | ✅ |
| MOB-AIR-06 | Verilen istek sunucuda takılır (mock: askıda) / 120 sn / dönen gösterge durur, amber "Tekrar dene" | zaman | detox | e2e/09-ai-modes.e2e.js:68; src/features/ai-guide/services/ai-api-client.test.ts:17 (amber "Tekrar dene" rengi doğrulanmıyor) | 🟡 |
| MOB-AIR-07 | Verilen mock 503 / olunca / "Asistan şu anda yanıt veremiyor. Kredin düşülmedi…", kredi aynı, tekrar dene aynı flowId | uç | detox | e2e/09-ai-modes.e2e.js:60 (hata ekranı + kredi aynı; metin ve aynı flowId doğrulanmıyor) | 🟡 |
| MOB-AIR-08 | Verilen ücretsiz, günlük kredi bitti (mock/seed) / gönder / premium sayfası; satın alma sonrası istek kendiliğinden sürer | premium | detox | e2e/09-ai-modes.e2e.js:104 (premium sayfası + metin korunur); satın alma sonrası otomatik sürme ⛔ mağaza satın alma UI + M-17 ayrı iş | 🟡 |
| MOB-AIR-09 | Verilen konu dışı yanıt (mock) / olunca / kırmızı "Konu dışı", sonuç ve girdi temizlenir | uç | detox | — (mock modu yok: yalnız [mock:error503]/[mock:timeout]/[mock:clarify]/[mock:bilgi]) | ❌ |
| MOB-AIR-10 | Verilen netleştirme yanıtı (mock) / olunca / "Biraz daha netleştirelim", girdi korunur | uç | detox | e2e/09-ai-modes.e2e.js:76 (girdinin korunması doğrulanmıyor) | 🟡 |
| MOB-AIR-11 | Verilen öneri "Başla" / olunca / ana sayfa, o zikir seçili, AI bağlamı log kaynağı `ai` | normal | detox | src/features/ai-guide/services/recommendation-start.test.ts:54 (seçili zikir); src/features/dhikrs/services/dhikr-log-payload.test.ts:76 (log kaynağı ai); ekran akışı Detox yok | 🟡 |
| MOB-AIR-12 | Verilen öneri "Önerilen hedef: 100" / "Sıfırdan başla" / sayaç hedefi 100; "Kaldığı yerden"de mevcut hedef kalır (karar M-06) | uç | detox | src/features/ai-guide/services/recommendation-start.test.ts:42; :46; :50 (mağaza mantığı; ekran Detox yok) | 🟡 |
| MOB-AIR-13 | Verilen önerilen zikir yerel katalogda yok / "Başla" / sessizce boş ana sayfa yerine zikir yüklenir ya da hata | uç | birim | src/features/ai-guide/services/recommendation-start.test.ts:54 (B-26 zikir eklenir ve seçilir) | ✅ |
| MOB-AIR-14 | Verilen geçmiş 5 arama / Rehber / son 2 görünür, "Tümünü Gör" hepsi; geçmişten açmak AI çağırmaz | normal | detox | src/features/ai-guide/services/ai-guide-history-service.test.ts:26; :30 (geçmişten açmak AI çağırmaz doğrulanmıyor) | 🟡 |
| MOB-AIR-15 | Verilen yeniden açılış / son sonuç / kullanıcı başına önbellekten (v2), sürüm uyuşmazsa yok sayılır | uç | birim | src/features/ai-guide/services/ai-guide-cache.test.ts:21; :29 | ✅ |
| MOB-AIR-16 | Verilen dil değişti / ekrandaki öneri / yeni dile göre çözülür | dil | birim | src/features/ai-guide/services/ai-guide-localize.test.ts:18 (dil değişimi sonrası yeniden çözüm ekranı yok) | 🟡 |
| MOB-AIR-17 | Verilen gönder'e çift dokunuş / olunca / tek istek, tek kredi | uç | detox | e2e/09-ai-modes.e2e.js:82; src/features/ai-shared/services/in-flight-guard.test.ts:5 | ✅ |
| MOB-AIR-18 | Verilen özel gün detayı "AI Rehber ile öneri al" / olunca / Rehber sekmesi, girdi "<ad> için hangi zikirleri…" dolu, otomatik gönderim yok | normal | detox | — | ❌ |

### MOB-AIS — AI Sohbet

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-AIM-01 | Verilen üye / mesaj gönder / akışla "Mock yanıt.", kredi 1 düşer | normal | detox | e2e/04-circle-ai-premium.e2e.js:119 (:140, :148); e2e/09-ai-modes.e2e.js:92 | ✅ |
| MOB-AIM-02 | Verilen akış / token'lar / yalnız akan mesaja eklenir; `done` sunucu id + otoriter içerik; boş `done` akanı korur | normal | birim | src/features/ai-chat/services/chat-messages.test.ts:23; :30; :45 | ✅ |
| MOB-AIM-03 | Verilen hata / olunca / iyimser kullanıcı mesajı ve akan balon kaldırılır | uç | birim | src/features/ai-chat/services/chat-messages.test.ts:51 | ✅ |
| MOB-AIM-04 | Verilen mock 503 / gönder / metin girdiye geri konur + tekrar dene, kredi düşmez | uç | detox | src/features/ai-chat/services/chat-send-policy.test.ts:32 (AI_UNAVAILABLE sınıflandırması); metnin geri konması/kredi Detox yok | 🟡 |
| MOB-AIM-05 | Verilen kredi yetersiz / gönder / premium sayfası; yazılan metin kaybolmamalı | premium | detox | src/features/ai-chat/services/chat-send-policy.test.ts:32 (kredi → premium yönlendirme, B-30 kodda); metnin korunması Detox yok (Rehber için 09:104 var) | 🟡 |
| MOB-AIM-06 | Verilen günlük limit (DAILY_LIMIT_REACHED) / gönder / premium sayfası (genel hata değil) | premium | detox | src/features/ai-chat/services/chat-send-policy.test.ts:32 (DAILY_LIMIT_REACHED → kredi yolu); ekran Detox yok | 🟡 |
| MOB-AIM-07 | Verilen akış takılır (mock: token sonrası sessiz) / olunca / zaman aşımında hata + tekrar dene, "yazıyor" sonsuz dönmez | zaman | detox | src/features/ai-chat/services/chat-sse.test.ts:40; :51 (B-28 bekçi birim); UI hata + tekrar dene Detox yok | 🟡 |
| MOB-AIM-08 | Verilen akış `done` olmadan kapanır / olunca / hata gösterilir, iyimser mesaj temizlenir | uç | birim (çıkar: src/features/ai-chat/hooks/use-chat-stream.ts) | src/features/ai-chat/services/chat-sse.test.ts:35 (B-29 done'sız kapanış hata); src/features/ai-chat/services/chat-messages.test.ts:51; hook bağlama testi yok | 🟡 |
| MOB-AIM-09 | Verilen 25 konuşma / sohbet ekranı / 3 görünür, "Tümünü Göster" 20'ye kadar, "Daha Az Göster" | normal | detox | — | ❌ |
| MOB-AIM-10 | Verilen eski konuşma / açılınca / son 50 mesaj; yeni sohbet temizler | normal | detox | — | ❌ |
| MOB-AIM-11 | Verilen akış sürerken başka konuşma açılır / olunca / token'lar diğer konuşmaya karışmaz | uç | birim (çıkar: src/features/ai-chat/hooks/use-ai-chat.ts) | — (B-31 düzeltilmemiş; use-ai-chat testi yok) | ❌ |
| MOB-AIM-12 | Verilen bilgi yanıtı kaynaklı / balon altı / "Başlık, s. 12" veya "s. 12-14" | normal | detox | e2e/09-ai-modes.e2e.js:92 (kaynaklı yanıt gelir; "Başlık, s. 12" biçimi doğrulanmıyor) | 🟡 |
| MOB-AIM-13 | Verilen misafir / sohbet girişi / üye ol modalı | normal | detox | — | ❌ |

### MOB-KRD — AI kredi gösterimi

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-KRD-01 | Verilen ücretsiz üye / kredi rozeti / sunucu bakiyesi (günlük 1 + kayıt bonusu); dokununca premium sayfası | premium | detox | — (04:134/10:109 rozeti okur; ücretsiz bakiye ve dokununca premium yok) | ❌ |
| MOB-KRD-02 | Verilen premium / kredi rozeti / gerçek sunucu bakiyesi (50/ay); sınırsız sayı yok (karar M-07) | premium | birim | src/features/ai-shared/services/ai-credits.test.ts:5; :27; e2e/10-profile-premium.e2e.js:91 (:109-111) | ✅ |
| MOB-KRD-03 | Verilen kredi eşiği / Rehber/Sohbet 1, Vird 3 / bakiye>0 ve ≥3 | normal | birim | src/features/ai-shared/services/ai-credits.test.ts:19; :23 | ✅ |
| MOB-KRD-04 | Verilen satın alma sonrası / bakiye / en çok 8 deneme 2 sn arayla yoklanır, ilk deneme beklemesiz | zaman | birim | src/features/ai-shared/services/ai-credits.test.ts:47; :55; :62 | ✅ |
| MOB-KRD-05 | Verilen kredi yükleniyor / gönder / "Kredilerin yükleniyor; birkaç saniye içinde…" | uç | detox | — (kodda mesaj var: use-chat-stream.ts:289; test yok) | ❌ |
| MOB-KRD-06 | Verilen kalan kredi negatif/kesirli / gösterim / tabana yuvarlanır, 0 altı yok | uç | birim | src/features/ai-shared/services/ai-credits.test.ts:34 | ✅ |

### MOB-PRM — Premium sayfası, 7. gün teklifi

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-PRM-01 | Verilen ücretsiz üye / kilitli eylem (ör. ikinci halka, kilitli tema kaydet) / premium sayfası açılır, 6 fayda maddesi | premium | detox@smoke | e2e/04-circle-ai-premium.e2e.js:51 (:72 sayfa açılır; @smoke etiketli); e2e/10-profile-premium.e2e.js:91 (:96); 6 fayda maddesi doğrulanmıyor | 🟡 |
| MOB-PRM-02 | Verilen sayfa açık / "Belki Daha Sonra" veya arka plan / kapanır | normal | detox | e2e/04-circle-ai-premium.e2e.js:75 | ✅ |
| MOB-PRM-03 | Verilen Android / sayfa açık / geri tuşu sayfayı kapatır, ekrandan çıkmaz | uç | detox | — | ❌ |
| MOB-PRM-04 | Verilen misafir / "Hemen Başla" / üye ol modalı | normal | detox | — | ❌ |
| MOB-PRM-05 | Verilen misafir / sayfa / fiyatsız plan etiketleri, kredi paketleri yok | normal | detox | — | ❌ |
| MOB-PRM-06 | Verilen satın alma başarılı, `sync-user` gecikmeli false / olunca / kullanıcıya "işleniyor" bilgisi; sessiz kalmaz | uç | birim (çıkar: src/hooks/use-premium-sheet.ts) | — (B-16 düzeltilmemiş: use-premium-sheet.ts synced=false sessiz) | ❌ |
| MOB-PRM-07 | Verilen fayda listesi / "Zikir Halkası kur" maddesi / "10 halka, 200 üye" (karar M-10) | premium | detox | e2e/10-profile-premium.e2e.js:91 (:97) | ✅ |
| MOB-PRM-08 | Verilen ücretsiz, seri ≥ 7, hiç gösterilmedi / ana sayfa boşta / yıllık plan seçili premium sayfası bir kez | premium | detox | src/features/home/services/day7-offer.test.ts:20 (koşul birim); yıllık plan seçili sayfa + bir kez Detox yok | 🟡 |
| MOB-PRM-09 | Verilen premium / seri 7 / teklif yok; seri 6 / yok; gösterildi / bir daha yok | uç | birim | src/features/home/services/day7-offer.test.ts:6; :10; :14 | ✅ |
| MOB-PRM-10 | Verilen üye sunucu serisi yüklenmedi / teklif kaynağı / yerel güne düşer; yüklendiyse sunucu | uç | birim | src/features/home/services/day7-offer.test.ts:30; :35 | ✅ |
| MOB-PRM-11 | Verilen teklif koşulu, kullanıcı başka sekmede / ön plana dönünce / teklif yalnız ana sekmede açılmalı | uç | detox | — | ❓ (B-50) |
| MOB-PRM-12 | Verilen rozet modalı açık / teklif / bekler, üst üste binmez | uç | birim (çıkar: src/features/home/hooks/use-day7-offer.ts) | — (kodda canShowDay7Offer = !overlay && !rozet: home-view.tsx:582; test yok) | ❌ |
| MOB-PRM-13 | Verilen widget "Premium ›" derin bağlantısı (`?paywall=1&src=widget`), soğuk açılış / olunca / ücretsizde sayfa açılır, premiumda açılmaz | premium | detox | — (home-navigation-intent-store.test.ts paywall isteğini kapsamıyor; B-53 kodda store ile çözüldü; widget dokunuşu ⛔ native, openURL ile derin bağlantı otomatize edilebilir) | ❌ |
| MOB-PRM-14 | Verilen "Aboneliği Yönet" / olunca / Play abonelik sayfası; dönüşte premium durumu yeniden senkron | premium | detox | ⛔ Play abonelik sayfası harici uygulama (mağaza UI) | ⛔ |
| MOB-PRM-15 | Verilen premium biter (seed kaldır) / yeniden açılış / mevcut programlar/halkalar korunur, yeni aktifleştirme/halka engellenir, vird hatırlatmaları durur, tema ücretsiz varsayılana döner (karar A-07 + M-13) | premium | detox | src/theme/premium-themes.test.ts:10 (yalnız tema); program/halka/hatırlatma Detox yok | 🟡 |

### MOB-OZG — Özel günler

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-OZG-01 | Verilen yaklaşan gün / sekme / hero "YAKLAŞAN" + "Kalan: N gün", liste | normal | detox | e2e/12-notifications-routing.e2e.js:92 (yalnız misafir liste; hero "YAKLAŞAN"/"Kalan: N gün" doğrulanmıyor); src/features/special-days/services/special-days-api-client.test.ts:18 | 🟡 |
| MOB-OZG-02 | Verilen bugün özel gün / sekme / "BUGÜN" rozeti + "İncele" kartı | zaman | detox | — | ❌ |
| MOB-OZG-03 | Verilen TR saati 00:00–03:00 / geri sayım / yerel güne göre doğru gün (UTC kayması yok) | zaman | birim (çıkar: src/features/special-days/hooks/use-special-days.ts) | src/features/special-days/services/special-days-countdown.test.ts:15; :21; :26; :30 | ✅ |
| MOB-OZG-04 | Verilen detay / açılınca / tema, "Bu Gün Hakkında", "Tavsiye Edilen İbadetler" (içerik opsiyonel, boşsa bölüm gizli) | normal | detox | e2e/12-notifications-routing.e2e.js:92 (yalnız detay başlığı; bölümler doğrulanmıyor) | 🟡 |
| MOB-OZG-05 | Verilen ağ yok / sekme / hata kutusu; çekip yenileme çalışır | çevrimdışı | detox | — | ❌ |
| MOB-OZG-06 | Verilen dil değişti / detay açık / içerik yeni dilde yenilenmeli | dil | detox | — | ❌ |
| MOB-OZG-07 | Verilen kampanya push'u (`/special-days/<id>`) / dokunuş / detay | normal | birim | src/features/notifications/services/notification-tap-routing.test.ts:9 | ✅ |
| MOB-OZG-08 | Verilen "Kandil bildirimlerini al" ve "Ramazan Modu" çevirileri var / ekran / UI'da yok (karar M-25: kapsam dışı, ölü çeviri anahtarları silindi) | normal | detox | — (anahtarlar silindi, grep ile doğrulandı; otomatik test yok) | 🟡 |

### MOB-BLD — Bildirimler ve push

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-BLD-01 | Verilen izin henüz sorulmadı / tur bitince (veya bildirim anahtarı açılınca) / önce uygulama içi "Uygulama bildirimleri" modalı, "İzin ver" → OS istemi | normal | detox@smoke | src/features/notifications/services/request-notification-permission.test.ts:44; src/features/notifications/services/reminder-offer.test.ts:56; e2e/12-notifications-routing.e2e.js:56 (@smoke; kartı "Şimdi değil" ile kapatır, OS penceresine "Evet" dokunuşu yok) | 🟡 |
| MOB-BLD-02 | Verilen özel modal / "Şimdi değil" / OS istemi yok, anahtar kapalı | normal | birim | src/features/notifications/services/request-notification-permission.test.ts:63; src/features/profile/services/sync-notification-settings.test.ts:80; e2e/12-notifications-routing.e2e.js:56 | ✅ |
| MOB-BLD-03 | Verilen OS kalıcı reddetti / anahtar açılınca / "Bildirim izni kapalı" + "Ayarları Aç" | uç | detox | src/features/notifications/services/request-notification-permission.test.ts:31 (yalnız birim; "Ayarları Aç" dokunuşu ve OS ret detox'ta yok) | 🟡 |
| MOB-BLD-04 | Verilen izin zaten var / anahtar açılınca / modal yok | normal | birim | src/features/notifications/services/request-notification-permission.test.ts:18 | ✅ |
| MOB-BLD-05 | Verilen ilk açılış / push kaydı / OS izni yumuşak sormadan istenmemeli (karar B-11: ilk açılışta OS penceresi yok; ilk kayıttan sonra uygulama içi kart, "Evet" → OS) | uç | detox | src/features/notifications/services/push-device-registration.test.ts:187; :210; src/features/notifications/services/reminder-offer.test.ts:34; :56; :78; e2e/12-notifications-routing.e2e.js:56 (@smoke) | ✅ |
| MOB-BLD-06 | Verilen Profil bildirim anahtarı / açınca / günlük, seri, özel gün, Cuma tercihleri birlikte açılır, sunucuya yazılır | normal | birim | src/features/profile/services/sync-notification-settings.test.ts:44; :191 (yalnız setAll sahte; gerçek yerel store yazımı yok) | 🟡 |
| MOB-BLD-07 | Verilen anahtar açma, sunucu hata / olunca / hepsi geri alınır, hata modalı | çevrimdışı | birim | src/features/profile/services/sync-notification-settings.test.ts:145; :166 (EN'de Türkçe hata metni beklemesi — aynalayan) | 🟡 |
| MOB-BLD-08 | Verilen anahtar kapatma / olunca / izin sorulmaz, zamanlamalar iptal | normal | birim | src/features/profile/services/sync-notification-settings.test.ts:100 | ✅ |
| MOB-BLD-09 | Verilen misafir anahtar açık + saat 07:30 / uygulama yeniden açılınca / anahtar açık, saat 07:30, günlük hatırlatma kurulu kalır | uç | detox | src/features/profile/services/sync-notification-settings.test.ts:127 (misafirde sunucuya kaydetmediğini doğrular; yeniden açılışta anahtar korunması yok — B-3 açık: profile-store partialize dailyReminderEnabled yazmıyor) | ❌ |
| MOB-BLD-10 | Verilen ana anahtar kapalı / Cuma ve kandil yerel bildirimleri / kurulmamalı mı (karar M-08: Cuma/kandil yerel bildirimleri ana anahtardan bağımsız KALIR) | normal | birim | src/features/notifications/services/event-notifications.test.ts:80; :123 (syncEventNotifications ana anahtar parametresi almaz; anahtar kapalı + yerel kurulum uçtan uca test yok) | 🟡 |
| MOB-BLD-11 | Verilen saat seçici / "24:00", "12:60", harf / "Lütfen geçerli bir saat gir"; değişmemişse Kaydet pasif | uç | birim | src/features/profile/services/profile-format.test.ts:16; :23 (yalnız ayrıştırma; modal metni ve Kaydet pasif durumu yok) | 🟡 |
| MOB-BLD-12 | Verilen günlük hatırlatma / kurulunca / haftanın 7 günü, her gün 3 Esma adı; EN'de kanal adı İngilizce | dil | birim | src/features/profile/services/daily-reminder-notifications.test.ts:42 (yalnız EN kanal adı; 7 gün / 3 Esma adı yok) | 🟡 |
| MOB-BLD-13 | Verilen seri ≥1, bugün eksik, saat < 21:00 / olunca / bugün 21:00 tek seri hatırlatması; bugün tamam veya 21:00 geçti → yarın 21:00 | zaman | birim | src/features/home/services/streak-reminder-notifications.test.ts:115; :121; :127; :148; :169 | ✅ |
| MOB-BLD-14 | Verilen seri 0 veya kapalı / olunca / bekleyen seri hatırlatmaları silinir, başkalarına dokunulmaz | uç | birim | src/features/home/services/streak-reminder-notifications.test.ts:180; :196 | ✅ |
| MOB-BLD-15 | Verilen sunucu push etkin (kayıtlı + rollout açık) / olunca / yerel özel gün bildirimleri iptal, Cuma yerel kalır | normal | birim | src/features/notifications/services/event-notifications.test.ts:101; :123; :148 | ✅ |
| MOB-BLD-16 | Verilen bildirime dokunuş (sıcak ve soğuk) / olunca / izinli rotaya gider; izin listesi dışı rota reddedilir | uç | detox | src/features/notifications/services/notification-tap-routing.test.ts:58; :111; src/features/notifications/services/deferred-route.test.ts:5 (soğuk; gerçek bildirim dokunuşu detox'ta yok) | 🟡 |
| MOB-BLD-17 | Verilen eski bildirim yanıtı / sonraki soğuk açılış / aynı rotaya ikinci kez gidilmez (karar B-18: navigatör hazır olunca bir kez açılır, son yanıt temizlenir) | uç | detox | src/features/notifications/services/deferred-route.test.ts:5; :16; e2e/12-notifications-routing.e2e.js:108 (derin bağlantı soğuk açılışı; "ikinci kez gidilmez" için bildirim yanıtı temizleme testi yok) | 🟡 |
| MOB-BLD-18 | Verilen push kaydı / dil veya saat dilimi değişince / yeniden kayıt (locale + timezone); değişmemişse yok; başarısızsa sonraki açılışta tekrar | dil | birim | src/features/notifications/services/push-device-registration.test.ts:60; :111 | ✅ |
| MOB-BLD-19 | Verilen cihaz kimliği / tekrar kurulum olmadan / bir kez üretilir, kalıcı | normal | birim | src/features/notifications/services/push-device-registration.test.ts:125 | ✅ |
| MOB-BLD-20 | Verilen kayıt başarılı ama token yok / olunca / sunucu push aktif sayılmaz | uç | birim | src/features/notifications/services/push-device-registration.test.ts:160; :172 | ✅ |
| MOB-BLD-21 | Verilen dil EN'e geçer / olunca / zaten kurulu günlük/seri/Cuma/vird bildirimleri İngilizce metinle yeniden kurulur | dil | detox | — | ❌ |
| MOB-BLD-22 | Verilen cihaz tercihi (özel gün / Cuma) / güncellenince / push token'a dokunmadan sunucuya gider; hata yükselir (geri alma için) | normal | birim | src/features/notifications/services/update-device-prefs.test.ts:50; :74 | ✅ |

### MOB-AYR — Ayarlar (dil, tema, yazı tipi, sayaç görünümü)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-AYR-01 | Verilen TR / Profil → Dil / arayüz anında EN; yeniden açılışta EN kalır | dil | detox@smoke | e2e/10-profile-premium.e2e.js:33 (@smoke) | ✅ |
| MOB-AYR-02 | Verilen cihaz dili tr / ilk kurulum / TR; en, de, ar / EN | dil | birim | src/i18n/detect-device-locale.test.ts:19 | ✅ |
| MOB-AYR-03 | Verilen dil seçildi / cihaz dili sonra değişir / saklı seçim kazanır | dil | birim | — | ❌ |
| MOB-AYR-04 | Verilen kaydedilmemiş sayım / dil değiştirilir / sayım ve seçili zikir korunur, ad yeni dilde | dil | detox | — | ❌ |
| MOB-AYR-05 | Verilen tr/en çeviri dosyaları / karşılaştırınca / aynı dosyalar, aynı anahtar yolları | dil | birim | src/i18n/locales/locale-parity.test.ts:42; :46 | ✅ |
| MOB-AYR-06 | Verilen en çevirileri / taranınca / Türkçe karakter sızıntısı yok | dil | birim | src/i18n/locales/no-turkish-leak.test.ts:29 | ✅ |
| MOB-AYR-07 | Verilen EN arayüz / tüm ana ekranlar / sabit Türkçe metin yok (~20 bilinen site) | dil | detox | — | ❌ |
| MOB-AYR-08 | Verilen ücretsiz / tema seçici / 8 ücretsiz tema seçilip kaydedilir; 13 premium tema önizlenir, kaydet → premium sayfası | premium | detox | — | ❌ |
| MOB-AYR-09 | Verilen premium / tema kaydet / uygulanır, yeniden açılışta korunur, üyede sunucuya yazılır (premium bitince tema ücretsiz varsayılana döner — karar A-07+M-13) | premium | detox | src/features/users/services/backend-user-hydration.test.ts:5; src/store/theme-store.test.ts:22 (premium bitişi); :29; :35 (kaydet-uygula-yeniden açılış detox'ta yok) | 🟡 |
| MOB-AYR-10 | Verilen sunucudan bilinmeyen tema/font / hidrasyon / yok sayılır, mevcut kalır | uç | birim | src/features/users/services/backend-user-hydration.test.ts:27 | ✅ |
| MOB-AYR-11 | Verilen yazı tipi seçici / değiştirince / "Değişiklikleri Kaydet" görünür, kaydedince uygulanır | normal | detox | — | ❌ |
| MOB-AYR-12 | Verilen sayaç görünümü Halka/Tesbih, malzeme, tık sesi / seçilince / bağımsız saklanır; varsayılan halka/kehribar/kapalı | normal | birim | src/store/counter-style-store.test.ts:9; :17 | 🟡 (aynalayan) |
| MOB-AYR-13 | Verilen ücretsiz / tık sesi "Tık" seçilince / premium sayfası | premium | detox | — | ❌ |
| MOB-AYR-14 | Verilen titreşim deseni değişir, üye / olunca / sunucuya yazılır, hata → geri alınır | normal | birim (çıkar: src/features/profile/hooks/use-profile.ts) | — | ❌ |
| MOB-AYR-15 | Verilen "Geri Bildirim Gönder", e-posta uygulaması yok / olunca / "E-posta uygulaması açılamadı" modalı | uç | detox | — | ❌ |
| MOB-AYR-16 | Verilen üyelik tarihi / tr ve en / "Ocak 2026'ten beri" / "since January 2026" biçimi | dil | birim | src/features/profile/services/profile-format.test.ts:9 | ✅ |

### MOB-SYS — Uygulama kabuğu (zorunlu güncelleme, puanlama, derin bağlantı, hata)

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-SYM-01 | Verilen API `APP_MIN_VERSION` > build numarası / soğuk açılış / kapatılamaz "Güncelleme Gerekli", "Güncelle" mağazayı açar, geri tuşu kapatmaz | normal | detox | e2e/12-notifications-routing.e2e.js:113 (APP_MIN_VERSION yüksek: modal çıkar/kalkar; E2E_API_RESTART_CMD yoksa atlanır; "Güncelle" mağaza ve geri tuşu doğrulanmıyor) | 🟡 |
| MOB-SYM-02 | Verilen min sürüm ≤ build, boş, sayı değil / olunca / modal yok | uç | birim | — (`isUpdateRequired` testsiz; src/lib/app-config.ts:64) | ❌ |
| MOB-SYM-03 | Verilen `/app-config` erişilemez / açılış / modal yok, sunucu push bayrağı ezilmez | çevrimdışı | birim (çıkar: app/_layout.tsx) | src/store/app-config-store.test.ts:9; :13; :19 (yalnız store varsayılanı; /app-config erişilemez yolu yok) | 🟡 |
| MOB-SYM-04 | Verilen mağaza puanlama tetikleyicileri (seri 7 rozeti kapandı / vird günü tamam / halka hedefi) / olunca / kurulum başına bir kez, eşzamanlı iki tetik tek istem | normal | birim | src/features/review/request-store-review.test.ts:31; :51; :62 | ✅ |
| MOB-SYM-05 | Verilen OS puanlama çağrısı hata / olunca / çökme yok | uç | birim | src/features/review/request-store-review.test.ts:85 | ✅ |
| MOB-SYM-06 | Verilen render hatası / olunca / "Bir şeyler ters gitti" + "Tekrar dene" | uç | detox | — | ❌ |
| MOB-SYM-07 | Verilen bilinmeyen derin bağlantı (`zikirmatik://xyz`) / olunca / "Sayfa bulunamadı" + "Ana sayfaya dön" | uç | detox | — | ❌ |
| MOB-SYM-08 | Verilen ikinci şema `zikirmatikasistan://circle/join?code=…` / olunca / aynı katıl ekranı | normal | detox | — | ❌ |
| MOB-SYM-09 | Verilen uygulama açılışı ve her ön plana dönüş / olunca / `app_opened` olayı | normal | birim | src/features/analytics/use-app-opened.test.ts:26 | ✅ |
| MOB-SYM-10 | Verilen analitik kuyruğu / 20 olay, arka plan, ağ hatası / toplu gönderim (≤50), hata → kuyruk korunur, 200 tavan | çevrimdışı | birim | src/lib/analytics.test.ts:90; :125; :137; :161; :204; :218 | ✅ |
| MOB-SYM-11 | Verilen misafir analitik / gönderim / yetkilendirme başlığı yok; üye → bearer | normal | birim | src/lib/analytics.test.ts:181; :193 | ✅ |
| MOB-SYM-12 | Verilen "Daha Fazla" / dokununca / İstatistik, Koleksiyonlar, Profil menüsü | normal | detox | — (helpers.openTab kullanıyor) | 🟡 |

### MOB-WDG — Android ana ekran widget'ı

| ID | Davranış | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| MOB-WDG-01 | Verilen ücretsiz / seri widget'ı / seri + bugünkü toplam; dokununca ana sayaç | premium | detox | src/features/widget/widget-snapshot.test.ts:100; :113; :130 (veri; widget çizimi ve dokununca ana sayaç yalnız cihazda) | 🟡 |
| MOB-WDG-02 | Verilen bugünkü toplam / ana sayaç + vird bugünü + halka bugünü + serbest (bugünse) / toplanır, max alınmaz | normal | birim | src/features/widget/widget-snapshot.test.ts:178; :191; :204; :228 | ✅ |
| MOB-WDG-03 | Verilen saat 00:05 / dünkü her şey / 0 | zaman | birim | src/features/widget/widget-snapshot.test.ts:260 | ✅ |
| MOB-WDG-04 | Verilen önbellekli sunucu serisi / lastActiveDate dün/bugün, 2 gün önce, gelecekte, bozuk / değer, yerel hesap, yerel, yerel | zaman | birim | src/features/widget/widget-snapshot.test.ts:279; :290; :301; :313; :398; :407 | ✅ |
| MOB-WDG-05 | Verilen önbellek 2 gün eski + yerelde dün tamam / olunca / zincir uzar; boşluk varsa kopar (karar M-21: sayımı > 0 olan gün sayılır) | zaman | prop | src/features/widget/widget-snapshot.test.ts:145; :157; :328; :346; :387 | ✅ |
| MOB-WDG-06 | Verilen ücretsiz veya biten abonelik / vird widget'ı / temel içerik + "Premium ›" daveti (kilit ekranı değil) | premium | birim | src/features/widget/widget-snapshot.test.ts:447 | ✅ |
| MOB-WDG-07 | Verilen premium, aktif program / vird widget'ı / dilim, ilerleme, sıradaki zikir, "Devam et" → `/vird/session?programId&slot[&prayerIndex]` | premium | detox | src/features/widget/widget-snapshot.test.ts:487; :509 (uri/içerik; "Devam et" dokunuşu yalnız cihazda) | 🟡 |
| MOB-WDG-08 | Verilen premium program yok / bugün öğe yok / bitti / vird widget'ı / "Program kur", "Bugün için planlanmış bir vird yok", "Bugün tamam ✓" | premium | birim | src/features/widget/widget-snapshot.test.ts:455; :471; :577; :589; :604 | ✅ |
| MOB-WDG-09 | Verilen süreç ölü, iki widget aynı anda güncellenir (soğuk) / olunca / ikisi de tazelenir | uç | birim | src/features/widget/widget-task-handler.test.ts:54; :65 | 🟡 (gerçek yarış yalnız cihazda) |
| MOB-WDG-10 | Verilen bozuk AsyncStorage / handler / çökme yok, yine çizer | uç | birim | src/features/widget/widget-task-handler.test.ts:115; :154; src/features/widget/widget-snapshot.test.ts:95 | ✅ |
| MOB-WDG-11 | Verilen soğuk açılış widget "Devam et" derin bağlantısı / olunca / router çökmesi yok, seans açılır | uç | detox | — | ❌ |
| MOB-WDG-12 | Verilen uygulamada sayım / arka plana alınınca / widget ≤ birkaç sn içinde güncel (30 dk beklemeden) | zaman | detox | — | ❌ |
| MOB-WDG-13 | Verilen EN dil / widget / İngilizce etiketler | dil | birim | src/features/widget/widget-snapshot.test.ts:169 (yalnız locale okuma; İngilizce widget etiketleri yok) | 🟡 |
| MOB-WDG-14 | Verilen seri ≥3 veya vird günü tamam, widget yok, Android / ana sayfa / "Serini ana ekranında gör" kartı; kapatınca bir daha yok | normal | detox | — | ❌ |
| MOB-WDG-15 | Verilen sayı biçimi / 999, 1.000, 12.345 / widget kısaltması doğru | uç | birim | src/features/widget/widget-snapshot.test.ts:638 | ✅ |

---

### WEB — Web sitesi (apps/website, Next + next-intl, Playwright)

Kaynak: `apps/website/src/i18n/routing.ts` (locales tr+en, `as-needed`, `localeDetection:false`), `next.config.mjs` (yalnız `/tr*` → 308), `app/[locale]/halka/[code]/page.tsx` (`CODE_RE=/^[A-HJ-NP-Z2-9]{8}$/`, `robots.index:false`), `app/sitemap.ts`, `app/robots.ts`.

| ID | Davranış (Verilen / Olunca / O zaman) | Tür | Katman | Mevcut test | Durum |
|---|---|---|---|---|---|
| WEB-01 | Verilen kök `/` / açılınca / h1 dolu, `html lang="tr"` | normal | playwright | e2e/smoke.spec.ts:3 | ✅ |
| WEB-02 | Verilen `/en`, `/en/privacy`, `/en/delete-account` / açılınca / 200 + `lang="en"` | dil | playwright | e2e/smoke.spec.ts:9 | ✅ |
| WEB-03 | Verilen `/tr`, `/tr/privacy`, `/tr/halka/KOD` / istenince / 308 → öneksiz yol | normal | playwright | e2e/smoke.spec.ts:28 | ✅ |
| WEB-04 | Verilen `/en/*` / istenince / yönlendirme YOK (gerçek EN sayfa) — `/en` 308'e düşmez | dil | playwright | e2e/smoke.spec.ts:9 (dolaylı: 200) | 🟡 |
| WEB-05 | Verilen yasal sayfalar `/privacy`, `/terms`, `/refund-policy` / açılınca / 200 + h1 dolu | normal | playwright | e2e/smoke.spec.ts:43 | ✅ |
| WEB-06 | Verilen EN yasal sayfalar `/en/terms`, `/en/refund-policy` / açılınca / 200 + `lang="en"` + h1 dolu | dil | playwright | — | ❌ |
| WEB-07 | Verilen `/delete-account` / açılınca / 200, `lang="tr"`, silme adımları + iletişim e-postası görünür | normal | playwright | e2e/smoke.spec.ts:22 (yalnız 200+lang) | 🟡 |
| WEB-08 | Verilen EN footer / bakılınca / `/en/delete-account` linki tek | dil | playwright | e2e/smoke.spec.ts:17 | ✅ |
| WEB-09 | Verilen TR footer / bakılınca / `/delete-account`, `/privacy`, `/terms` linkleri var (Play politika gereği silme sayfası erişilebilir) | normal | playwright | — | ❌ |
| WEB-10 | Verilen `/halka/abcdefgh` (küçük harf) / açılınca / 200, kod BÜYÜK harfe çevrilmiş görünür, `meta robots` noindex | normal | playwright | e2e/smoke.spec.ts:51 | ✅ |
| WEB-11 | Verilen `/halka/ABC!` / istenince / 404 | uç | playwright | e2e/smoke.spec.ts:51 | ✅ |
| WEB-12 | Verilen yasak karakterli 8 hane (`/halka/ABCDEFG0`, `…I`, `…O`, `…1`) / istenince / 404 (mobil `parseCircleCode` ile aynı alfabe) | uç | playwright | — | ❌ |
| WEB-13 | Verilen 7 ve 9 haneli kod / istenince / 404 | uç | playwright | — | ❌ |
| WEB-14 | Verilen `/en/halka/abcdefgh` / açılınca / 200, "Circle Code" etiketi + kod | dil | playwright | e2e/smoke.spec.ts:36 | ✅ |
| WEB-15 | Verilen halka sayfası / "Uygulamada aç" / href = `zikirmatik://circle/join?code=KOD` (uygulamanın `scheme` listesinde var) | normal | playwright | — | ❌ |
| WEB-16 | Verilen halka sayfası / "Google Play'den indir" / href = Play paket URL'si | normal | playwright | — | ❌ |
| WEB-17 | Verilen halka sayfası / kaynak / sitemap'te YOK, noindex; canonical ana sayfaya işaret etmemeli | uç | playwright | — | ❓ (B-58) |
| WEB-18 | Verilen `/robots.txt` / istenince / 200 + `Sitemap: <SITE_URL>/sitemap.xml` | normal | playwright | e2e/smoke.spec.ts:61 (yalnız 200) | 🟡 |
| WEB-19 | Verilen `/sitemap.xml` / istenince / 200 + 10 URL (tr kök + `/en` × 5 yol), halka yok | normal | playwright | e2e/smoke.spec.ts:61 (yalnız 200) | 🟡 |
| WEB-20 | Verilen tr.json/en.json / karşılaştırınca / anahtar kümeleri aynı | dil | playwright | e2e/messages-parity.spec.ts:12 | ✅ |
| WEB-21 | Verilen herhangi bir sayfa / dil düğmesine (TR/EN) basınca / aynı yolun diğer dil sürümüne gider (`/privacy` ↔ `/en/privacy`), Accept-Language yok sayılır | dil | playwright | — | ❌ |
| WEB-22 | Verilen `Accept-Language: en` ile `/` / istenince / yine TR (localeDetection kapalı) | dil | playwright | — | ❌ |
| WEB-23 | Verilen bilinmeyen yol `/xyz` ve `/de/privacy` / istenince / 404 | uç | playwright | — | ❌ |
| WEB-24 | Verilen premium tablosu / bakılınca / limitler koddakiyle aynı (vird 1→10, halka 1/5 → 10/200, tema 8/22, kredi 1/gün → 50/ay) ve fiyat yazılmaz | normal | playwright | — | ❌ |
| WEB-25 | Verilen her sayfa / bakılınca / OG `og:locale` tr_TR / en_US, canonical doğru (`/` vs `/en`) | dil | playwright | — | ❌ |

---

### Önerilen Detox akışları

Hedef: Android tam süit ~30–35 dk (18 dosya, dosya başına 1–2,5 dk; mevcut 4 akış ~2,5 dk). iOS yalnız `@smoke` (6 satır, ~4 dk). Her dosya `freshSignIn()` veya misafir temiz kurulumla başlar; tek dosya koşusu global-setup ile DB'yi sıfırlar.

**iOS @smoke alt kümesi (6):** MOB-GIR-02 (giriş), MOB-GIR-04 (iOS riskli: Keychain sil-kur sonrası misafir), MOB-KAY-01 (sayaç kaydet), MOB-PRM-01 (premium sayfası), MOB-BLD-01 (bildirim izni), MOB-AYR-01 (dil değişimi). İlk beşi mevcut 01/02/04 dosyalarında; Detox `--testNamePattern @smoke` için `it()` adlarına `@smoke` eklenmeli.

| # | Dosya | Satırlar (`MOB-` öneki atlandı) | Gereken |
|---|---|---|---|
| 1 | `01-auth-onboarding.e2e.js` (genişlet) | GIR-01..04, 06..13, TUR-01..03, TUR-05 | `AUTH_SIMULATE_PROVIDER_OUTAGE` için ikinci build ya da launchArg — **Durum:** uygulandı kısmen: `e2e/01-auth-onboarding.e2e.js` (GIR-02, GIR-04 @smoke; misafir açılış) |
| 2 | `02-counter-log-streak.e2e.js` (genişlet) | SAY-01, 04, 06, 07, 11, 13..17, 28, 29, KAY-01, 05, SER-01, 07, ROZ-01 | — — **Durum:** uygulandı kısmen: `e2e/02-counter-log-streak.e2e.js` (KAY-01 @smoke) + `e2e/05-counter-guest.e2e.js` (M-02/03/04/19) |
| 3 | `03-vird-guided-session.e2e.js` (genişlet) | VRD-01, 11, VSE-01..03, 06..09, 12, 13 | — — **Durum:** uygulandı kısmen: `e2e/03-vird-guided-session.e2e.js` (manuel program + sabah seansı) |
| 4 | `04-circle-ai-premium.e2e.js` (mevcut) | HAL-02..04, AIR-01, AIM-01, PRM-01, 02 | premium seed — **Durum:** uygulandı: `e2e/04-circle-ai-premium.e2e.js` (PRM-01 @smoke, halka kur, AI Rehber/sohbet) |
| 5 | `05-account-lifecycle.e2e.js` | GIR-14, 19, 21, 23, 28..31, HID-01 | misafir kurulum → giriş; API ile log doğrulama — **Durum:** yok (silme/çıkış akışları `e2e/10-profile-premium.e2e.js` içinde, M-14/M-15/B-6) |
| 6 | `06-transition-modals.e2e.js` | KAY-02, 04, 06, 09, 11, 14..21, ESM-01, 03..05, 07 | — — **Durum:** uygulandı: `e2e/06-transition-modals.e2e.js` (M-04/05/06, B-49) |
| 7 | `07-offline-sync.e2e.js` **(yalnız Android)** | KAY-07, HID-09, 10, VRD-03, VSE-10, HAL-27, OZG-05, KOL-06, ZKR-05, 09, 14, IST-07 | `adb` uçak modu — **Durum:** uygulandı kısmen (Android): `e2e/11-offline-rollover.e2e.js` (B-1 çevrimdışı Kaydet, M-01 gün dönümü; OZG-05, KOL-06 vb. yok) |
| 8 | `08-zikirlerim-collections.e2e.js` | ZKR-02, 03, 06..12, KOL-01..05 | — — **Durum:** yok |
| 9 | `09-vird-free-limits.e2e.js` | VRD-02, 05, 07, 12, 13, 15, 17..20, 23, 25..28, VHT-01 | ücretsiz hesap — **Durum:** uygulandı: `e2e/08-vird-free.e2e.js` (B-21, M-22, A-23, şablon kurulum) |
| 10 | `10-vird-premium.e2e.js` | VRD-14, 16, 22, VHT-02, 03, 05, VAI-01..07, 09 | premium seed; mock `program` türü; 503 mock modu; 10 aktif program API seed'i — **Durum:** uygulandı kısmen: `e2e/13-vird-premium.e2e.js` (B-20 AI vird, B-22) |
| 11 | `11-circle-two-members.e2e.js` | HAL-01, 05, 08, 13, 14, 16, 19..21, 24..26, 30, 31, 34, 38 | **2. ve 6. hesap API test-token ile**; EN için dil değişimi — **Durum:** uygulandı kısmen: `e2e/07-circle-two-members.e2e.js` (katıl, M-11 kilit, kapalı halka, B-36, 5 üye limiti, ayrıl) |
| 12 | `12-circle-deeplinks.e2e.js` | HAL-15, 32, 33, GIR-06, SYM-07, 08 | `device.openURL` / `launchApp({url})`; API hata enjeksiyonu (halka kapat → 409) — **Durum:** yok (yalnız `e2e/12-notifications-routing.e2e.js:108` soğuk derin bağlantı; `e2e/07` içinde B-36 bilinmeyen halka) |
| 13 | `13-ai-guide-modes.e2e.js` | AIR-02..04, 06..14, 17, 18, KRD-01, 05 | **backend mock modu**: askıda / 503 / konu dışı / netleştir / kredi 0 / günlük limit — **Durum:** uygulandı kısmen: `e2e/09-ai-modes.e2e.js` (AIR-04, mock:error503/timeout/clarify, B-23, kredi 0) |
| 14 | `14-ai-chat-modes.e2e.js` | AIM-04..07, 09, 10, 12, 13 | **backend mock modu**: 503 / kredi yok / limit / takılan akış; 25 konuşma seed'i — **Durum:** uygulandı kısmen: `e2e/09-ai-modes.e2e.js` (sohbet mock:bilgi, çift dokunuş kredi) |
| 15 | `15-premium-surfaces.e2e.js` | PRM-03..05, 07, 08, 11, 14, 15, IST-01..04, SAY-20, AYR-08, 09, 13 | premium seed aç/kapat; seri 7 için 7 günlük log seed'i — **Durum:** uygulandı kısmen: `e2e/10-profile-premium.e2e.js` (M-10/M-07) + `e2e/14-stats-source.e2e.js` (Halka kaynağı) |
| 16 | `16-settings-notifications.e2e.js` | AYR-01, 04, 07, 11, 15, BLD-01, 03, 05, 09, 21, TUR-04, HID-12 | iOS'ta `permissions:{notifications:'NO'}` ile ret; Android `pm revoke` — **Durum:** uygulandı kısmen: `e2e/10-profile-premium.e2e.js` (AYR-01 @smoke) + `e2e/12-notifications-routing.e2e.js` (B-11 kartı @smoke) |
| 17 | `17-special-days-routing.e2e.js` | OZG-01, 02, 04, 06, 08, BLD-16, 17, SYM-01, 06, 12 | özel gün seed'i "bugün"; `launchApp({userNotification})`; `APP_MIN_VERSION` yüksek API yeniden başlatma (dosya sonunda) — **Durum:** uygulandı kısmen: `e2e/12-notifications-routing.e2e.js` (OZG liste+detay, B-18, SYM-01 koşullu) |
| 18 | `18-widget.e2e.js` **(yalnız Android)** | WDG-01, 07, 11, 12, 14, PRM-13 | `adb` widget yayını (`APPWIDGET_UPDATE`) + `uiautomator dump`; widget'ı Detox ekleyemez, `appwidget` bind komutu ya da elle ön koşul — **Durum:** yok (widget Detox ile otomatikleştirilemez; birim testleri `src/features/widget/*.test.ts`) |

Zaman satırları (gece yarısı, saat dilimi) bilinçli olarak birim katmanında; Detox'ta yalnız MOB-HID-12 (emülatörde `adb shell setprop persist.sys.timezone`).

---

### ❓ Soru listesi

- **M-01** **Gece yarısı sayaç.** Dün 30/33 çektin, kaydetmedin; bugün açtın. Şu an sayaç 30'dan devam ediyor ve kaydedince 30 + bugünkü dokunuşlar bugüne yazılıyor. — *Öneri:* yeni günde seçili zikir 0'dan başlasın; dünkü kaydedilmemiş ilerleme varsa bir kez "Dünkü 30'u kaydet / at" sorulsun. → KARAR: Yeni günde sayaç 0, dünkü kaydedilmemiş sayım için bir kez "kaydet / at" sorulur (uygulandı 2160371).
- **M-02** **Misafir "Kaydet"e basınca** bugün hiçbir şey görünmüyor. — *Öneri:* "Kalıcı kaydetmek için giriş yap" istemi (mevcut üye ol modalı); yerel ilerleme kalsın. → KARAR: Misafir Kaydet → "Kalıcı kaydetmek için giriş yap" istemi, ilerleme cihazda kalır.
- **M-03** **Misafir hep "kaydedilmemiş" sayılıyor** → her zikir değişiminde uyarı modalı ve günlük Esma karşılaması hiç çıkmıyor. — *Öneri:* misafirde yerel kayıt "kaydedildi" sayılsın; uyarı modalı yalnız üyede. → KARAR: Misafirde yerel kayıt "kaydedildi" sayılır; uyarı modalı yalnız üyede (serbest sayım > 0 geçişinde uyarı kalır, 3b0f21f).
- **M-04** **0 çekim.** Sayım 0 iken kaydetmek bugünkü tamamlanmış kaydı 0'a eziyor; uyarı modalı da 0'da çıkıyor. — *Öneri:* 0'da Kaydet pasif, uyarı modalı yok. → KARAR: 0'da Kaydet pasif, uyarı modalı yok; sunucu 0'ın tamamlanmış kaydı ezmesini reddeder.
- **M-05** **"Sıfırla — geri alınamaz"** ama "Kaydetmeden devam" eski sayıyı geri getiriyor. — *Öneri:* metin doğru kalsın; sıfırlama geri alma noktasını da sıfırlasın. → KARAR: Sıfırla geri alma noktasını da siler.
- **M-06** **AI "Önerilen hedef: 100"** gösteriliyor ama "Başla" sayaca uygulamıyor. — *Öneri:* "Sıfırdan başla"da önerilen hedef uygulansın, "Kaldığı yerden"de mevcut hedef kalsın. → KARAR: "Sıfırdan başla"da önerilen hedef uygulanır; "Kaldığı yerden"de mevcut hedef kalır.
- **M-07** **Premium kredi gösterimi.** Premium'a istemci "sınırsız" davranıyor (yedek yolda 9.007.199.254.740.991 yazabiliyor), sunucu ise ayda 50 veriyor. — *Öneri:* her zaman gerçek bakiye gösterilsin; ön kontrol bakiyeye baksın. → KARAR: Kredi her zaman sunucudaki gerçek bakiye; ön kontrol bakiyeye bakar (premium dahil).
- **M-08** **Ana bildirim anahtarı kapalıyken** Cuma ve kandil yerel bildirimleri yine geliyor (kodda "tercihe bağlı değil" yorumu var). — *Öneri:* anahtar kapalıysa hiçbir bildirim kurulmasın. → KARAR: Cuma/kandil yerel bildirimleri ana anahtardan bağımsız KALIR (öneri reddedildi).
- **M-09** **İngilizce halka paylaşım linki** öneksiz `/halka/KOD` → alıcı Türkçe sayfa görüyor (site artık `/en` yayında). — *Öneri:* EN kullanıcıda `/en/halka/KOD`. → KARAR: EN kullanıcının halka linki `/en/halka/KOD`.
- **M-10** **Premium sayfası "Zikir Halkası kur" maddesi** ücretsizde 1 halka kurulabildiği için yanlış anlaşılıyor. — *Öneri:* "10 halka, 200 üye" olarak değişsin. → KARAR: Premium sayfası halka maddesi "10 halka, 200 üye".
- **M-11** **Halka hedefe ulaşınca** sayaç ≤5 sn daha dokunulabiliyor (sunucu yoklamasını bekliyor). — *Öneri:* yerel toplam ≥ hedef olunca anında kilit + son gönderim. → KARAR: Hedefe ulaşınca sayaç anında yerel kilit + son gönderim.
- **M-12** **Halka "ilk yükleme öncesi dokunuşlar"** sunucudaki bugünkü sayıyla eziliyor olabilir. — *Öneri:* sayaç ilk detay gelene kadar pasif olsun. → KARAR: Halka sayacı ilk detay gelene kadar pasif.
- **M-13** **Premium bitince** ne olsun? Bugün: premium tema kalıyor, vird hatırlatmaları sürüyor, tesbih/istatistik kilitleniyor. — *Öneri:* tema ücretsiz varsayılana dönsün, vird hatırlatmaları dursun (program kalsın). → KARAR: Premium bitince mevcut programlar/halkalar korunur, yeni aktifleştirme/halka engellenir, vird hatırlatmaları durur, tema ücretsiz varsayılana döner (A-07 ile birlikte).
- **M-14** **Misafire "Hesabı Sil"** satırı görünüyor, onaylayınca hiçbir şey olmuyor. — *Öneri:* misafirde gizle. → KARAR: Misafirde "Hesabı Sil" gizli.
- **M-15** **Çıkış onaysız** ve yerel veriyi siliyor. — *Öneri:* "Çıkış yapılsın mı?" onayı. → KARAR: Çıkışta onay sorulur.
- **M-16** **Restore purchases** düğmesi yok (yeni cihaz/yeniden kurulum). — *Öneri:* Profil > Premium altında "Satın alımları geri yükle" ekle (Play için zorunlu değil ama destek yükünü azaltır). → KARAR: Ayrı iş (QA turu dışı).
- **M-17** **Giriş sonrası tetikleyen eylem** (AI gönder, halkaya katıl, premium başlat) devam etmiyor, kullanıcı tekrar basmalı. — *Öneri:* katıl ve AI gönder kaldığı yerden devam etsin. → KARAR: Ayrı iş (QA turu dışı).
- **M-18** **Misafir verisi taşıma başarısız olursa** kullanıcı hiç bilmiyor. — *Öneri:* 3. başarısızlıkta ana sayfada tek satırlık "Verilerin henüz hesabına aktarılamadı, tekrar dene" bandı. → KARAR: Ayrı iş (QA turu dışı).
- **M-19** **Serbest moddaki kaydedilmemiş sayım** girişte hesaba taşınmıyor. — *Öneri:* sayım > 0 ise "Serbest" adlı kişisel zikir olarak taşınsın. → KARAR: Misafirin serbest sayımı (>0) girişte "Serbest" adlı kişisel zikir olarak taşınır.
- **M-20** **Çevrimdışı kayıt** kuyruğa alınmıyor; ağ gelince elle tekrar Kaydet gerekiyor. — *Öneri:* tek bekleyen kayıt kuyruğu (zikir başına son değer), ön plana dönüşte gönder. → KARAR: Ayrı iş (QA turu dışı; veri kaybını önler, öncelikli).
- **M-21** **Seri tanımı misafir ile üye arasında farklı:** misafirde dokunulan her gün sayılıyor, üyede yalnız hedefi tamamlanan gün. — *Öneri:* misafir de "en az bir tamamlanan hedef" kuralına geçsin (giriş yapınca seri düşmesin). → KARAR: Seri kuralı tek: o gün sayımı > 0 olan kayıt varsa seri sürer; "tamamlandı" (A-13) istatistik/hedef için kalır.
- **M-22** **Duraklatılmış bir vird programını düzenleyip kaydetmek** onu yeniden aktifleştiriyor (ücretsizde çakışma modalı açılıyor). — *Öneri:* düzenleme durumu değiştirmesin; "Kaydet" ve ayrı "Aktifleştir". → KARAR: Vird düzenleme durumu değiştirmez; ayrı "Aktifleştir".
- **M-23** **Vird ilerlemesi program bağımsız:** aynı gün program değiştirince aynı zikrin ilerlemesi yeni programa geçiyor. — *Öneri:* ilerleme program kimliğine bağlansın. → KARAR: Vird günlük ilerlemesi program kimliğine bağlı.
- **M-24** **Gece yarısını geçen seans:** vird seansı yeni güne geçiyor, halka seansı açılış gününe yazmaya devam ediyor. — *Öneri:* ikisi de dokunuş anının gününe yazsın. → KARAR: Vird ve halka seansı sayımı dokunuş anının gününe yazar.
- **M-25** **Kandil bildirim kartı ve Ramazan Modu** çevirileri var, ekranda yok. — *Öneri:* bu sürümde kapsam dışı; ölü çeviri anahtarları silinsin. → KARAR: Kapsam dışı; ölü çeviri anahtarları silindi (2160371).

---

### Kod/hafıza çelişkileri

- **Ç-1 Web sitesi dili.** Hafıza `website-2026-kararlari`: "site yalnız TR, `/en/*` → `/` 308". Kod: `apps/website/src/i18n/routing.ts:4` `locales:["tr","en"]`, `next.config.mjs` yalnız `/tr*` yönlendiriyor, `e2e/smoke.spec.ts:9` `/en` 200 bekliyor. Hafıza bayat (EN yayını `ingilizce-yayin-kararlari` sırasıyla açılmış görünüyor).
- **Ç-2 Tema sayısı.** Hafıza/site "tema 8/22"; kod 21 aktif tema (8 ücretsiz + 13 premium), `premium-doku` yorumda (`src/features/theme-selector/hooks/use-theme-selector.ts`).
- **Ç-3 Vird şablon kilidi.** `docs/vird-programi.md` §4: "Hatırlatıcı / şablon / AI ile oluşturma premium gerektirir". Hafıza `premium-kimligi`: "ücretsiz = klasik şablonlar". Kod: şablon başına `isPremium`, klasikler ücretsiz (`apps/api/scripts/lib/vird-template-seed.mjs:74`), AI program herkese 3 kredi. Ayrıca `tr/vird.json errors.premiumRequired` "AI ile program oluşturma premium gerektirir" diyor — kodla çelişiyor.
- **Ç-4 Halka ana sayfa kartı.** Hafıza `zikir-halkasi` (2026-09-25): "aktif halka varken CircleCard testID taşımıyor, hub'a görünür yol yok". Kod: `src/features/circle/components/circle-card.tsx:54-56, 82-90` `e2e-circle-home-card-active` ve `e2e-circle-home-card-hub` var. `e2e/04-circle-ai-premium.e2e.js:77-81` yorumu ve API ile kapatma geçici çözümü bayat.
- **Ç-5 Vird seans parametresiz açılış.** Hafıza `android-widget`: "`/vird/session` parametresiz açılınca `router.back()`". Kod: `<Redirect href="/(tabs)/home">` (`src/features/vird/screens/vird-session-screen.tsx:81-83`).
- **Ç-6 Halka davet adresi.** Hafıza `zikir-halkasi`: "`zikirmatikasistan.app[/tr]/halka/KOD`". Kod: `https://zikirmatik-asistan.vercel.app/halka/KOD` (`src/features/circle/services/circle-share.ts:7`). Uygulamada `/halka` rotası yok; `app/_layout.tsx:82` yorumu var olmayan `/halka/[code]` rotasından söz ediyor.
- **Ç-7 Halka canlı toplam.** Hafıza ilk metinde "polling 15 sn"; sonra 2026-09-19 notu oturumda 5 sn diyor. Kod: detay 15 sn, oturum 5 sn + 3 sn gönderim — hafızanın son hâliyle uyumlu, ilk satır yanıltıcı.
- **Ç-8 AI kredi modeli.** Hafıza `admob-bekleyen-isler`: "premium'da sınırsız". Premium sayfası/hafıza `premium-kimligi`: "50 kredi/ay". İstemci premium'u sınırsız sayıyor (`src/features/ai-shared/services/ai-credits.ts:10,16-18`). **ÇÖZÜLDÜ:** 2160371 (M-07: istemci gerçek bakiyeyi gösterir, uydurma "sınırsız" yok).
- **Ç-9 Açık bulgu hâlâ açık.** Hafıza `video-04`: "Kaydedilmemiş zikir modalı 0 çekimde de çıkıyor" ve "ai-chat SSE zaman aşımı yok" — kodda ikisi de duruyor (`src/features/home/services/unsaved-transition-guard.ts:18`, `src/features/ai-chat/services/ai-chat-api-client.ts:194-213`). **ÇÖZÜLDÜ:** 2160371 (M-04 0'da modal yok; B-28/B-29 SSE watchdog).
- **Ç-10 Silme kapsamı metni.** Hafıza `ingilizce-yayin`: "hesap silme artık AI/kredi/olay/halka üyeliğini de siliyor". `tr/profile.json deleteAccountModal.items` vird programları ve halka üyeliğini saymıyor.
- **Ç-11 Üye ol modalı metni.** `tr/auth.json promptModal.message` "senkronizasyon için giriş gerekli" diyor; senkron hiçbir yerde istemi tetiklemiyor (yalnız AI, halka, satın alma).

---

### Bulgu adayları

Şüpheli hatalar; her biri test yazılırken doğrulanmalı. "(doğrulandı)" = bu katalog hazırlanırken kod satırı okunarak teyit edildi.

**Yüksek (veri kaybı / görünmez hata)**
- **B-1** Ana sayfa kaydetme hataları hiç gösterilmiyor: `dhikr-store.syncError` yalnız yazılıyor, okuyan bileşen yok (doğrulandı) — `src/store/dhikr-store.ts:58,701`; yazanlar `src/features/home/hooks/use-dhikr-log-save.ts:58,81`, `use-dhikr-transition.ts:264,288`. Misafir "giriş gerekli", çevrimdışı ve otomatik kayıt hataları görünmez. **ÇÖZÜLDÜ:** 2160371 (kayıt hataları görünür; detox 11).
- **B-2** Gece yarısı sıfırlama yok; dünkü sayım bugünün tarihiyle yazılıyor (doğrulandı) — `src/features/dhikrs/services/dhikr-log-payload.ts:44`; hidrasyon tarihten bağımsız son logu alıyor `src/features/dhikrs/hooks/use-dhikr-backend-sync.ts:46`. **ÇÖZÜLDÜ:** 2160371 (M-01 gün dönümü).
- **B-3** Günlük hatırlatma anahtarı ve saati persist edilmiyor; misafirde yeniden açılışta anahtar kapalı görünür ve günlük hatırlatmalar iptal edilir (doğrulandı) — `src/store/profile-store.ts:115-125` (`partialize` yalnız locale/haptics/isPremium).
- **B-4** Aynı kök: seri hatırlatma tercihi persist ediliyor, ana anahtar edilmiyor → anahtar kapalı görünürken seri hatırlatması gelir — `src/store/streak-reminder-store.ts:22-26`.
- **B-7** Üye serbest kaydetmede `createUserDhikr`/`createDhikrLog` hatası → yerel zikir "kaydedilmemiş" işaretlenmiyor, sonraki senkron sunucunun bilmediği kişisel zikirleri siliyor — `src/features/home/hooks/use-dhikr-transition.ts:286-289`, `src/store/dhikr-store.ts:662`. **ÇÖZÜLDÜ:** 2160371.
- **B-8** Kayıt uçuştayken gelen dokunuşlar: `applySavedBackendLog` kaydedilmemiş işaretini koşulsuz kaldırıyor, sonraki hidrasyon düşük sunucu sayısını yazıyor — `src/store/dhikr-store.ts:694`. **ÇÖZÜLDÜ:** 2160371.
- **B-9** Sayım 0 kaydı bugünkü tamamlanmış logu eziyor (sunucu `$set count`) — `src/features/home/hooks/use-dhikr-log-save.ts:48`. **ÇÖZÜLDÜ:** 2160371 + 067532f (M-04, sunucu 0 ezmez).
- **B-32** Halka oturumu: ilk detay gelmeden yapılan dokunuşlar `seed = max(yerel, sunucuMine)` ile eziliyor (doğrulandı, kod) — `src/features/circle/screens/circle-session-screen.tsx:138-144`. **ÇÖZÜLDÜ:** 2160371.
- **B-33** Halka oturumu çevrimdışı açıldıysa hiç gönderim yok (`flush` `detail` ister) (doğrulandı) — `src/features/circle/screens/circle-session-screen.tsx:155`. **ÇÖZÜLDÜ:** 2160371.
- **B-14** Misafir taşımasında vird ilerleme logları tekilleştirilmiyor; kısmi hatadan sonra tekrar → çift vird logu — `src/features/auth/services/guest-migration.ts:234-275`. **ÇÖZÜLDÜ:** 2160371.
- **B-13** Çıkış taşıma deposunu temizlemiyor; `failed` anlık görüntü sonraki açılışta `pending` olup başka hesaba taşınabilir — `src/store/guest-migration-store.ts:75-78`, `src/store/session-boundary.ts`. **ÇÖZÜLDÜ:** 2160371.

**Orta (yanlış davranış / UX)**
- **B-5** Cuma ve kandil yerel bildirimleri ana anahtardan ve cihaz tercihlerinden bağımsız kuruluyor (doğrulandı; kodda bilinçli yorum var → ürün kararı S-8) — `src/features/notifications/services/event-notifications.ts:70-89`, `hooks/use-event-notification-sync.ts:8-10`. **NOT A BUG:** karar M-08 — Cuma/kandil yerel bildirimleri ana anahtardan bağımsız kalır (bilinçli).
- **B-6** Hesap silmede `catch` yok: API hatasında sessiz + işlenmeyen promise; misafirde onay hiçbir şey yapmıyor (doğrulandı) — `src/features/profile/hooks/use-profile.ts:81-91`. **ÇÖZÜLDÜ:** 2160371 (silme hatası görünür, oturum korunur; e2e/10:114).
- **B-10** Uyarı modalı sayım 0'da da çıkıyor (sıfırlama/hedef değişimi/koleksiyon `setSelectedCount(0)` kaydedilmemiş işaretliyor) — `src/features/home/services/unsaved-transition-guard.ts:18`, `src/store/dhikr-store.ts:466-468,514-516`. **ÇÖZÜLDÜ:** 2160371 (M-04: 0'da modal yok; e2e/06:57).
- **B-11** Push kaydı ilk açılışta yumuşak sormadan OS izni istiyor; tur sonrası istem iOS'ta hemen "izin kapalı" modalına düşüyor — `src/features/notifications/services/push-device-registration.ts:43-61`. **ÇÖZÜLDÜ:** 3b0f21f + e3756e1 (e2e/12:56, reminder-offer.test.ts).
- **B-12** Refresh'te 429 dahil her 4xx oturumu düşürüyor; düşmüş misafirde kalıcı `isPremium=true` ve önceki üyenin verisi kalıyor — `src/store/auth-store.ts:209-221`. **ÇÖZÜLDÜ:** 2160371 (429/408 oturum düşürmez).
- **B-15** Giriş düğmesine çift dokunuş: ikinci no-op çağrı `pendingProvider`'ı null yapıyor, giriş sürerken gösterge kayboluyor — `src/features/auth/screen.tsx:84-89`. **ÇÖZÜLDÜ:** 2160371 (e2e/10:61).
- **B-16** Satın alma başarılı ama `sync-user` gecikmeli `isPremium:false` → sayfa mesajsız açık kalıyor — `src/hooks/use-premium-sheet.ts:108-114`.
- **B-17** Premium kredi yedek yolunda `Number.MAX_SAFE_INTEGER` gösterilebiliyor — `src/features/ai-shared/services/ai-credits.ts:10`. **ÇÖZÜLDÜ:** 2160371 (M-07; ai-credits.test.ts:5).
- **B-18** Son bildirim yanıtı temizlenmiyor → sonraki soğuk açılışlarda aynı rotaya tekrar gidebilir; soğuk açılışta `router.push` navigasyon hazır olmadan, hata yutuluyor — `src/features/notifications/hooks/use-notification-tap-routing.ts:24`. **ÇÖZÜLDÜ:** 3b0f21f (deferred-route.test.ts, e2e/12:108).
- **B-20** AI vird önizlemesinde "Vazgeç" sunucudaki taslağı silmiyor; senkronda hub'da geri geliyor — `src/features/vird/hooks/use-vird-ai-create.ts:34-37`. **ÇÖZÜLDÜ:** 2160371 (e2e/13:53).
- **B-21** Vird çakışma yolları farklı: AI yolu sunucudaki TÜM aktifleri duraklatıyor, editör/şablon/liste yalnız yerel `activeProgramId`'yi — `src/features/vird/hooks/use-vird-program-actions.ts:136-152` vs `use-vird-activation.ts:85-105`. **ÇÖZÜLDÜ:** 2160371 (e2e/08:55).
- **B-22** Editör ve şablonda çakışma modalından premium alındıktan sonra aktivasyon sürmüyor, program taslak kalıyor — `src/features/vird/screens/vird-editor-screen.tsx:402-405`. **ÇÖZÜLDÜ:** 2160371 (e2e/13:81).
- **B-23** Çift gönderim: AI vird (`isGenerating` kredi tazelemesinden sonra set ediliyor → 6 kredi) ve AI Rehber (`ensureCreditsAvailable` sırasında `isLoading` false) — `src/features/vird/hooks/use-vird-ai-generate.ts:107-125`, `src/features/ai-guide/hooks/use-ai-guide-request.ts:197-214`. **ÇÖZÜLDÜ:** 2160371 (e2e/09:82).
- **B-24** AI Rehber boş metinle gönderiliyor ve kredi harcıyor — `src/features/ai-guide/hooks/use-ai-guide-request.ts:207`, `components/intent-input-section.tsx:52`. **ÇÖZÜLDÜ:** 3b0f21f (MOB-AIR-04; e2e/09:52).
- **B-25** Önerilen hedef sayaca uygulanmıyor; `selectDhikr` hedefi değiştirmiyor (doğrulandı) — `src/store/dhikr-store.ts:242-256`, `src/features/ai-guide/components/recommendation-card.tsx:114`. **ÇÖZÜLDÜ:** 2160371 (M-06; e2e/06:88).
- **B-26** Önerilen zikir yerel katalogda yoksa `selectDhikr` sessizce dönüyor ama ana sayfaya gidiliyor (doğrulandı) — `src/store/dhikr-store.ts:243-245`, `src/features/ai-guide/screen.tsx:73-86`.
- **B-27** Premium 0/50 krediyle istemci ön kontrolünü geçiyor, sunucu 403 → yine premium sayfası (premium kullanıcıya "premium'a geç") — `src/features/ai-shared/services/ai-credits.ts:16-18`. **ÇÖZÜLDÜ:** 2160371 (M-07 ön kontrol bakiyeye bakar).
- **B-28** AI sohbet SSE'de zaman aşımı/izleyici yok; takılan akışta "yazıyor" sonsuz — `src/features/ai-chat/services/ai-chat-api-client.ts:194-213`. **ÇÖZÜLDÜ:** 2160371 (SSE watchdog).
- **B-29** Akış `done` olmadan kapanırsa iyimser mesaj ve yarım yanıt kalıyor, hata yok — `src/features/ai-chat/hooks/use-chat-stream.ts:133,143-164`. **ÇÖZÜLDÜ:** 2160371.
- **B-30** Sohbet `DAILY_LIMIT_REACHED`'i genel hata gösteriyor; kredi yetersizde yazılan metin siliniyor — `src/features/ai-chat/hooks/use-chat-stream.ts:97,168-172`.
- **B-31** Akış sürerken konuşma değiştirme: `done` konuşma kimliğini geri alıyor, ilk token başka konuşmaya balon ekleyebiliyor — `src/features/ai-chat/hooks/use-ai-chat.ts:45`, `use-chat-stream.ts:103-131`.
- **B-34** Halka hedefi dolunca yerel kilit yok; 5 sn yoklamaya kadar dokunulabilir — `src/features/circle/screens/circle-session-screen.tsx:129,236`. **ÇÖZÜLDÜ:** 2160371 (M-11; e2e/07:55).
- **B-35** Halkadan ayrıl/kapat hataları yalnız `console.warn` — `src/features/circle/screens/circle-detail-screen.tsx:97-99,111-113`. **ÇÖZÜLDÜ:** 3b0f21f.
- **B-36** Bilinmeyen / üye olunmayan / misafir halka detayı ve oturumu sonsuza dek boş sayfa — `src/features/circle/screens/circle-detail-screen.tsx:70-76`, `circle-session-screen.tsx:216-230`. **ÇÖZÜLDÜ:** 3b0f21f (e2e/07:94).
- **B-38** Özel gün geri sayımı UTC "bugün" ile hesaplanıyor; TR'de 00:00–03:00 arası +1 gün (doğrulandı) — `src/features/special-days/hooks/use-special-days.ts:117-124`. **ÇÖZÜLDÜ:** 2160371 (special-days-countdown.test.ts:15).
- **B-39** Vird seansında `todayKey` her render'da yeniden hesaplanıyor; gece yarısını geçen seans yeni günün öğelerine yazıyor (halka ise açılış gününde sabit) — `src/features/vird/screens/vird-session-screen.tsx:118` vs `circle-session-screen.tsx:52`. **ÇÖZÜLDÜ:** 2160371 (M-24).
- **B-40** Vird `dayProgress` anahtarı program içermiyor (tarih+dilim+ref) — `src/features/vird/services/vird-day.ts:70-71`. **ÇÖZÜLDÜ:** 2160371 (M-23, persist v3).
- **B-41** Vird seansında sıfırlama Sonraki/X'e kadar gönderilmiyor; ön plan senkronu max ile eski sayıyı geri getiriyor — `src/store/vird-store.ts:229-234`, `vird-session-screen.tsx:249-255`.
- **B-42** Vird hatırlatma senkronu `isPremium`'a bakmıyor; abonelik bitince hatırlatmalar sürüyor — `src/features/vird/hooks/use-vird-reminder-sync.ts:30-104`. **ÇÖZÜLDÜ:** 2160371 (premium bitince hatırlatmalar durur).
- **B-45** Zikirlerim'de yeni zikir oluşturmak ana sayacı uyarısız değiştiriyor (`addCustomDhikr` seçiyor) — `src/store/dhikr-store.ts:383-386`, `src/features/focus/components/zikirlerim-header.tsx:29`.
- **B-46** Zikirlerim "Başlat" serbest mod ilerlemesini korumuyor (uyarısız atılıyor) — `src/features/focus/context/zikirlerim-context.tsx:452-456`.
- **B-47** Koleksiyonda üye + serbest mod "Kaydet ve devam" → yanlış "giriş yapmalısın" hatası — `src/features/collections/collection-detail-screen.tsx:110-112`.
- **B-48** Zikirlerim silme hatası görünmüyor (işlenmeyen promise), öğe kalıyor — `src/features/focus/context/zikirlerim-context.tsx:505-542`.
- **B-49** Serbest kaydetme gönderiminde uçuş koruması yok; hızlı çift dokunuş iki zikir oluşturabilir — `src/features/home/hooks/use-dhikr-transition.ts:233`. **ÇÖZÜLDÜ:** 2160371 (e2e/06:119).
- **B-50** 7. gün teklifi görünür sekmeye bağlı değil; sekmeler bağlı kaldığı için ön plana dönüşte başka sekmede açılabilir — `src/features/home/hooks/use-day7-offer.ts:52-55`, `src/features/home/home-view.tsx:573`.
- **B-51** `streak_7` puanlama istemi ücretsizde neredeyse hiç tetiklenmiyor (rozet kapanırken day-7 teklifi hep bekliyor, rozet bir kez kutlanıyor) — `src/features/stats/hooks/use-badge-celebration.ts:171-173`.

**Düşük**
- **B-19** iOS `STORE_URL` yer tutucu `id000000000` (zorunlu güncelleme düğmesi iOS'ta kırık); semver `minVersion` NaN → hiç zorlamaz; yalnız soğuk açılışta kontrol — `src/lib/app-config.ts:8,64-68`, `app/_layout.tsx:124-137`.
- **B-37** Halka üye adı sabit Türkçe "Misafir Kullanıcı" ile karşılaştırılıyor — `src/features/circle/screens/circle-detail-screen.tsx:180`.
- **B-43** Sabit saat etiketi (07:00/13:00/19:00/22:00) ayrıca kurulan namaz sonrası hatırlatmalarını (≈06:45/13:00/16:30/18:45/21:15) göstermiyor — `src/i18n/locales/tr/vird.json` `reminders.locationFixed`, `src/features/vird/services/vird-reminder-notifications.ts:32-35`.
- **B-44** Her yere dokun açıkken "Ekranın her yerine…" toast'ı her soğuk açılışta çıkıyor — `src/features/home/hooks/use-tap-anywhere-pref.ts:6-11`, `src/features/home/home-view.tsx:619-629`.
- **B-52** Premium tema çıkışta / abonelik bitince geri dönmüyor — `src/store/theme-store.ts`. **ÇÖZÜLDÜ:** 2160371 (theme-store.test.ts:22).
- **B-53** Widget paywall soğuk açılışında `isPremium` henüz hidrate olmadan premium kullanıcıya sayfa açılabilir — `src/features/home/home-view.tsx:536-545`.
- **B-54** `signed_out` + `guestMode=false` anında İstatistik boş ekran (ne yükleniyor ne hata) — `src/features/stats/hooks/use-stats.ts:57,68,106-107`.
- **B-55** Zikir formu hedefi ham değerle sunucuya gidiyor, yerel store 9999'a kıskaçlıyor (sunucu/yerel sapması) — `src/features/focus/components/zikir-form-modal.tsx:144`, `src/features/focus/context/zikirlerim-context.tsx:342`.
- **B-56** Şablon listesi yükleme hatasında tekrar dene yok — `src/features/vird/components/template-shelf.tsx:112`.
- **B-57** Oturumu düşmüş kullanıcının `authError`'ı persist edilmiyor (bant yeniden açılışta kaybolur) ve düşük oturumdaki ilerleme taşımadan dışlanıyor — `src/store/auth-store.ts:64,166-174`.
- **B-58** (Web) Halka davet sayfası canonical'ı layout'tan miras alıyor → `/` (ana sayfa); noindex ile çelişkili sinyal — `apps/website/src/app/[locale]/layout.tsx` `alternates.canonical`, `app/[locale]/halka/[code]/page.tsx:11-23`.
- **B-59** Taşıma adları yakalama anındaki dille, eşleştirme şimdiki dille → dil değiştirilip tekrar denenirse katalog zikirleri kişisel log olarak gider — `src/features/auth/services/guest-migration.ts:88` vs `:139-142`.
