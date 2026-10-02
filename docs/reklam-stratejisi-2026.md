# Reklam ve kanal stratejisi — 2026-10-02

Organik plana (`docs/pazarlama-plani-2026.md`) eklenen **küçük, tavanlı ücretli test katmanı**. Organik plan aynen geçerli; bu belge onu değiştirmez, yalnız üstüne ölçülü bir deney ekler. Yatırımcı sunumundaki büyük ücretli edinim planı geçersiz kalır.

- **Hedef aynı:** D7 ≥ %25, 90 günde 50 ödeyen abone. Kurulum hedef değil.
- **Ücretli testin işi:** abone satın almak değil, şu soruyu ucuza cevaplamak: *"Parayla gelen kullanıcı kalıyor ve ödüyor mu, hangi kreatif ve coğrafyada?"* 50 abonenin büyük kısmını yine organik taşır.
- **Kaynaklar:** `.agents/product-marketing.md` (ürün, fiyat, marka kuralları), organik plan, fiyat kararları (2026-09-30), kod incelemesi (aşağıda §3).
- **Kural:** Bu belgedeki sektör aralıkları **tahmindir** (bizim verimiz değil, güven düşük). Karar her zaman kendi ilk 7–14 günlük verimizle verilir.

---

## 1. Kanal kararları

| Kanal | Karar | Neden (tek satır) |
|---|---|---|
| Google App Campaign — **Türkiye** (Play, TR dili) | **Şimdi** (Faz A) | SDK gerektirmez (Play Console bağlantısıyla kurulum ölçülür); Search + Play + YouTube + Display tek kampanyada; TR'de kurulum en ucuz yer. |
| Google App Campaign — **Avrupa Türk diasporası** (DE, NL, AT, BE, FR; dil: Türkçe) | **Sonra** (Faz B, Faz A kapısı geçerse) | Zengin ülke fiyatı (yıllık 19,99 USD) + mevcut TR kreatifleri ve TR içerik; EN'den daha iyi uyum varsayımı. |
| Google App Campaign — **EN zengin ülkeler** (US, UK, Körfez vb.) | **Sonra** (EN organik D7 görülünce) | EN kayıt 2026-10-01'de canlı, hiç EN verisi yok; EN kreatif yok; CPI tahmini yüksek (≈0,5–2 USD, tahmin) → geri ödeme ihtimali en düşük. |
| YouTube (Shorts/In-stream) | **Şimdi, yalnız App Campaign içinde** | App Campaign videoyu YouTube'a zaten dağıtır; ayrı YouTube kampanyası ayrı ölçüm ve bütçe ister. |
| Meta App Install (FB/IG) | **Hayır** (şimdilik) | Kurulumu ölçmek/optimize etmek için Meta SDK veya MMP gerekir → yeni bağımlılık, Reklam Kimliği, Veri Güvenliği değişikliği (§3). |
| Meta — organik kazanan Reel'i "Öne çıkar" (Play linki + UTM, SDK yok) | **Sonra** (Faz B alternatifi) | 3–5 USD/gün ile mümkün; §3'teki referrer yakalama varsa D7/abone ölçülebilir. Tıklama optimizasyonu → kalite riski. |
| TikTok Ads | **Hayır** | Uygulama kampanyası SDK/MMP ister; reklam grubu asgari günlük bütçesi (≈20 USD, platform kuralı, doğrula) tavanı aşar. Organik TikTok devam. |
| Apple Search Ads | **Park** | iOS yok. Tetikleyici: organik plandaki iOS kararı (Play'den ilk 10 yıllık abone → Apple hesabı). iOS çıkınca ilk ücretli kanal adayı ("zikirmatik" anahtar kelimesi). |
| Play mağaza deneyleri (store listing experiments) | **Şimdi** (organik planda zaten var) | Ücretsiz; AI vurgulu/vurgusuz set. Düşük trafikte sonuç geç çıkar; ücretli trafik deneyi hızlandırır. |
| Play özel mağaza girişleri (custom store listings) | **Sonra** | Az trafiği bölmek deneyi öldürür. Faz B'de diaspora için veya Ramazan kampanyasına özel giriş olarak değerlendir. |
| Play Console promosyon içeriği (LiveOps) | **Sonra** (Regaib/Ramazan) | Ücretsiz; kandil/Ramazan etkinliği Play'de görünür. Uygunluk hesap bazlı, Console'da kontrol edilmeli (belirsiz). |
| Google Ads yeni hesap teşvik kredisi | **Şimdi, varsa** | Yeni hesaba "X harca, X kredi al" teklifi ülkeye göre değişir; hesap açılışında çıkarsa kullan, kovalanmaz. Tutar varsayılmaz. |
| Google Ad Grants | **Hayır** | Yalnız tescilli kâr amacı gütmeyen kuruluşlar; kâr amaçlı abonelik uygulaması uygun değil (ayrıca yalnız Search/web, uygulama kurulumu yok). |
| Google for Startups (Cloud) kredileri | **Hayır** (reklam için) | Bulut kredisi; reklam kredisi değil. Altyapımız Atlas/Vercel; fayda yok. |
| Hoca / içerik üreticisi mikro sponsorluk (ücretli) | **Sonra** | Organik plan birebir ulaşımı ilk 20 videodan sonraya park etti; önce ücretsiz Premium kodu denenir, ücretli anlaşma onun başarısına bağlı (§4 kuralları). |
| Ramazan 2027 dönemi (Berat 2027-01-22 → Kadir 2027-03-05) | **Sonra, koşullu** | Kategori zirvesi ve teklif dönemi; ama Ramazan'da ibadet uygulaması reklam maliyetleri yükselir (tahmin). Yalnız Faz A/B kapıları geçerse; karar Ocak ortası. |
| Retargeting / yeniden etkileşim kampanyası | **Hayır** | SDK + uygulama içi olay + asgari kitle büyüklüğü ister; ayrıca "winback yok" ürün kararıyla çelişir (bkz. EN yayın kararları). |

---

## 2. Ücretli test tasarımı

### 2.1 Birim ekonomi (testin çıtası)

Fiyatlar Play fiyatları; net = KDV düşülür, Google payı %15 (abonelik). Kur varsayımı **1 USD ≈ 45 TL** (Ekim 2026 tahmini; güncel kurla düzelt).

| Pazar | Yıllık fiyat | İlk yıl net (tahmini) | 12 ay geri ödeme için **azami abone maliyeti** |
|---|---|---|---|
| TR | 479,99 TL | 479,99 / 1,20 × 0,85 ≈ **340 TL** | **≈ 340 TL** (≈ 7,5 USD) |
| Zengin ülke (DE örneği, %19 KDV) | 19,99 USD | ≈ **14–17 USD** (ülke vergisine göre) | **≈ 15 USD** |

- Geri ödeme hedefi: ads skill'indeki "payback 3–12 ay" bandının üst ucu (abonelik başına düşük ARPU).
- Kurulum → ödeyen oranı **bilinmiyor**. Deneme süresiz freemium için sektör aralığı ≈ %1–3 (tahmin). Buna göre **başa baş CPI**: TR ≈ 3,4–10 TL (0,08–0,23 USD); zengin ülke ≈ 0,15–0,45 USD.
- Dürüst beklenti: TR CPI tahmini ≈ 0,05–0,30 USD (tahmin). Yani TR'de başa baş **mümkün ama garanti değil**; diaspora/EN'de büyük ihtimalle zarar. Test bu belirsizliği satın alır.

### 2.2 Bütçe tavanları — **kullanıcı onayı bekliyor**

| Faz | Coğrafya | Günlük tavan | Süre | Faz tavanı |
|---|---|---|---|---|
| A | Türkiye | **250 TL** (≈ 5,5 USD) | 21 gün | **5.250 TL** |
| B (koşullu) | DE+NL+AT+BE+FR, dil Türkçe | **6 USD** (≈ 270 TL) | 21 gün | **≈ 126 USD (≈ 5.700 TL)** |
| — | **90 günlük mutlak tavan** | | | **12.000 TL (≈ 265 USD)** |

Gerekçe: Google'ın kurulum kampanyası önerisi günlük bütçe ≈ hedef CPI × 50 (platform rehberi, güncelliğini doğrula). TR hedef CPI ≈ 0,15 USD → ≈ 7,5 USD/gün ideal; 5,5 USD öğrenmeyi yavaşlatır ama ~21 günde ≈ 400–700 kurulum (tahmin) üretir — D7 okumak için yeterli, abone maliyeti için yalnız yön verir. Google Ads TR faturasına vergi yansıtmaları eklenebilir; tavanı **faturadaki brüt** üzerinden takip et.

### 2.3 Kampanya yapısı

- **Faz A:** 1 kampanya (`GOOG_AppInstall_TR_Faz-A_2026-11`), 1 reklam grubu. Konum: Türkiye; dil: Türkçe. Kitle sinyali yok (dini hedefleme yasak ve App Campaign'de zaten yok; hedeflemeyi kreatif yapar).
- **Optimizasyon olayı: Kurulum ("kurulum hacmi").** Gerekçe:
  - Satın alma/değer teklifi (tCPA/tROAS) için platformlar düzenli yüksek hacim ister: Google uygulama içi işlem kampanyasında günlük bütçe ≈ hedef EBM'nin ~10 katı ve her gün dönüşüm; Meta öğrenme fazı için reklam seti başına ≈ 50 olay/hafta (ads skill, `meta-decision-system.md`). Bizim ölçekte haftada 1–5 satın alma → algoritma öğrenemez.
  - Ara olay ("ilk zikir") Google'a göndermek Firebase/GA4 SDK ister (§3 K3) — şimdilik hayır.
  - Kalite filtresini algoritma değil **bizim kohort ölçümümüz** yapar (§3 K2).
- **Değişiklik disiplini:** kampanya içinde varlık düzenleme yok (öğrenmeyi sıfırlar); yeni varlık yanına eklenir. Bütçe artışı tek seferde en fazla %20, artışlar arası 3–5 gün (ads skill).
- **Faz B:** ayrı kampanya (`GOOG_AppInstall_TR-Diaspora_Faz-B`), Faz A'daki kazanan kreatiflerle.

### 2.4 Kreatifler (yüzsüz video hattından)

| Varlık | Kaynak | Not |
|---|---|---|
| Video 1 "Sayarken şaşırma" (24 sn) | `apps/promo-video/out/video-01-sesli.mp4` | Reklamsız sayaç açısı |
| Video 2 Vird (23 sn) | `video-02-vird-sesli.mp4` | Rutin/seri açısı |
| Video 3 Halka (22 sn) | `video-03-halka-sesli.mp4` | "Ailenle ortak hedef" — en güçlü kanca adayı (varsayım) |
| Yatay/kare kırpım | Remotion'da ikinci boyut | İsteğe bağlı; Google 9:16'yı kabul eder |
| Metin varlıkları | 5 başlık (≤30 kr.), 5 açıklama (≤90 kr.) | Dini olmayan ürün metni; Claude taslak, kullanıcı onay |
| Görsel | Mevcut Play ekran görüntüleri (`store-assets/play-2026`) | |

- Önkoşul: üç video organik planda **kullanıcı onayı bekliyor**; onaysız video reklama da girmez.
- Videoda uygulama ekranında görünen dini metin (hadis/kaynak satırı) kullanıcının yazdığı uygulama içeriğidir; reklam **anlatımı** o metni vaat olarak kullanmaz (§4).

### 2.5 Kapılar, kesme ve büyütme kriterleri

Karar zamanı: **test bitişi + 7 gün** (D7 ve 7. gün yıllık teklifinin etkisi için). Ölçümler §3 K2'ye bağlıdır; K2 yoksa yalnız CPI satırı okunabilir.

**Faz A (TR)**

| Metrik | Ölçüm kaynağı | Büyüt | Bekle / değiştir | **Kes** |
|---|---|---|---|---|
| Teslimat | Google Ads | — | 3 gün üst üste harcama < günlük bütçenin %50'si → varlık/teklif sorunu | — |
| CPI (7 gün ort., ≥ 2.000 TL harcamadan sonra) | Google Ads | ≤ 8 TL (≈0,18 USD) | 8–22 TL → en zayıf kreatifi değiştir | **> 22 TL (≈0,50 USD)** |
| İlk zikir başına maliyet (CPI ÷ aktivasyon oranı) | KPI betiği, ücretli kohort | ≤ 12 TL | 12–30 TL | **> 30 TL** |
| Ücretli kohort D7 (n ≥ 150 kurulum; altında karar yok) | KPI betiği | **≥ %20** | %12–20 | **< %12** |
| Ödeyen abone başına maliyet | KPI + `purchase_completed` | **≤ 340 TL** | 340–700 TL | **> 700 TL** (veya 0 abone) |

- **Büyüt** = D7 ≥ %20 **ve** abone maliyeti ≤ 700 TL → Faz B açılır, TR %20'lik adımlarla 90 gün tavanı içinde sürer.
- **Ramazan bütçesi** ancak abone maliyeti ≤ 340 TL ise konuşulur.
- **Kes** satırlarından biri → kampanya durur, kalan bütçe harcanmaz (tavan bir hedef değil).
- Küçük örneklem uyarısı: ~10 abone ile maliyetin hata payı geniş (±%50+). Bu yüzden ana karar D7 + aktivasyon, abone maliyeti yön verir.

**Faz B (diaspora, USD)**: CPI kes > 1,50 USD; D7 eşikleri aynı; abone maliyeti büyüt ≤ 15 USD, kes > 30 USD.

**Sıfırıncı kapı (G0):** test başlamadan organik D7 en az 2 haftalık kohortla ölçülmüş olmalı. Organik D7 < %15 ise ücretli test **ertelenir** — sızdıran kovaya su doldurulmaz; önce ürün/aktivasyon.

---

## 3. Ölçüm önkoşulları

### 3.1 Bugün olan (kodda doğrulandı)

- `app_events` (`apps/api/src/modules/events`): `app_opened`, `dhikr_completed`, `paywall_viewed`, `purchase_completed`… Misafir dahil, `deviceId`'ye bağlı; prop başına ≤ 200 karakter, ≤ 20 anahtar; 180 gün TTL.
- `devices` (`.../devices/schemas`): `createdAt`/`lastSeenAt`, platform, locale, timezone. **Kaynak/referrer alanı yok.**
- KPI betiği (`apps/api/scripts/kpi-report.mjs`): haftalık kohort D1/D7/D30 + huni. **Kanala göre bölmüyor.**
- Mobilde install referrer **okunmuyor**; Firebase, GA4, Meta SDK, MMP **yok**.
- Reklam Kimliği: yerel release birleşik manifestinde (`apps/mobile/android/app/build/intermediates/merged_manifest/release/...`) `com.google.android.gms.permission.AD_ID` **yok**.
- Play Console edinim raporu UTM'li Play linklerini kaynak bazında ayırır (organik plan); ama kohort D7/abone vermez.

### 3.2 Eksik olan ve kararlar

| # | Karar | Seçenek | Yeni bağımlılık | Gizlilik / Play beyanı | Öneri |
|---|---|---|---|---|---|
| K1 | Google Ads ↔ Play Console bağlantısı | Hesap bağlama; Android kurulumları (ve Play üzerinden uygulama içi satın almalar) Ads'e otomatik gelir | Yok, kod yok | Değişmez | **Evet.** Abonelik satın alımlarının bu yolla sayılıp sayılmadığı hesapta doğrulanmalı (belirsiz). |
| K2 | Install referrer yakalama | `expo-application` **zaten bağımlılık** ve `getInstallReferrerAsync()` sunuyor (`com.android.installreferrer:2.2` içinde). İlk açılışta bir kez oku; `utm_source`, `utm_campaign`, `gclid` var/yok olarak ayrıştır; ilk `app_opened` olayına prop olarak ekle (200 karakter sınırı nedeniyle ham dize değil). KPI betiğine kaynak kırılımı. | **Yok** | Reklam Kimliği gerekmez. Veri Güvenliği formunda mevcut "uygulama etkinliği/analiz" beyanı kapsıyor mu kontrol et. | **Evet — en az kodlu yol; Faz A'nın önkoşulu.** Bir sonraki Android sürümüne girmeli. Ayrıca organik video UTM'lerini de kohorta bağlar. |
| K3 | Firebase Analytics / GA4 (Ads'e "ilk zikir" gibi uygulama içi olay) | Firebase SDK | **Evet** | AD_ID izni manifeste girer → Reklam Kimliği beyanı "Evet", Veri Güvenliği'nde cihaz kimliği + Google'la paylaşım, AB için onay yönetimi (Consent Mode/UMP) | **Hayır (şimdi).** Hacim zaten optimizasyona yetmez; güven/sadelik maliyeti yüksek. Tetikleyici: günlük ≥ 10 satın alma. |
| K4 | Meta SDK (+ AEM) | Meta uygulama kurulum kampanyası için | **Evet** | AD_ID, Meta'ya veri paylaşımı, Veri Güvenliği'nde "paylaşılan veri"; "reklamsız, sade" güven mesajına ters | **Hayır.** |
| K5 | MMP (AppsFlyer/Adjust vb.) | Çok kanallı atıf | Evet + ücret | Yukarıdakilerin hepsi | **Hayır.** Tek kanal testinde gereksiz. |

**Reklam Kimliği beyanı belirsizliği — sonucu:** Play Console'daki "Uygulamanız reklam kimliği kullanıyor mu?" sorusu, manifestteki AD_ID iznine bakar. Yerel derlemede izin yok → doğru cevap **"Hayır"**. Etkisi:
- "Hayır" beyanı + manifestte AD_ID varsa (ör. ileride Firebase eklenirse) Play yeni sürümü **reddeder/uyarır**.
- "Evet" beyanı + izin yoksa: işlevsel zarar yok ama beyan yanlış olur; Veri Güvenliği'yle tutarsızlık riski.
- K2 (expo-application) bu durumu **değiştirmez**; K3/K4 değiştirir. Bu yüzden K2 seçilirse beyan "Hayır" kalır.
- Doğrulama: EAS'tan çıkan son AAB'nin manifesti `bundletool dump manifest` ile kontrol edilmeli (inceleme yerel Gradle çıktısına dayandı).

**Not:** Uygulama içi "Reklam içerir: Hayır" beyanı, uygulama **dışında** reklam vermekten etkilenmez; o beyan uygulama içi reklam içindir.

---

## 4. Dini hassasiyet ve marka tutarlılığı

**Metin kuralları (reklam metni, video anlatımı, mağaza)**
- Fazilet, sevap, ödül, "kabul", manevi kazanç **vaadi yok** (marka kuralı, product-marketing.md).
- Dini metin (hadis, ayet, dua anlamı) **Claude üretmez**; reklamda yer alacaksa kullanıcı yazar ve onaylar. Varsayılan: reklam metni yalnız ürünü anlatır (reklamsız sayaç, vird, Halka, kaynak referansı).
- Suçluluk/korku çerçevesi yok ("zikrini kaçırma", "günah" vb.). Psikoloji ilkelerinden yalnız etik olanlar: tutarlılık (seri), varsayılan (yıllık plan öne), sürtünmeyi azaltma (giriş yok, doğrudan sayaç). Uydurma sosyal kanıt yok (kullanıcı/puan metriği henüz yok).
- AI manşette değil; "fetva vermez, kaynak gösterir" güven satırı olarak.
- "Ücretsiz" yalnız kütüphane / temel sayaç / ilk halka için; ürünün tamamı ücretsizmiş gibi kullanılmaz.

**Platform politikaları (bilgi bazlı; reklam açmadan önce güncel metinden doğrula)**
- **Meta:** dinî inanç/pratiklere atıf yapan ayrıntılı hedefleme seçenekleri 2022'de kaldırıldı; reklam metni kişinin dinini bildiğini ima edemez ("Müslüman mısın?", "Sen de namaz kılıyorsan…" gibi kişisel özellik iddiası yasak). Güven: yüksek; ayrıntılar değişmiş olabilir.
- **Google:** kişiselleştirilmiş reklam politikasında dinî inanç hassas kategori; din bazlı kitle/yeniden pazarlama yapılamaz. App Campaign zaten yalnız konum+dil hedefler. Güven: yüksek.
- **TikTok:** din hedeflemesi yok; kişisel özellik ima eden metin yasak. Dinî içerikli reklam kısıtları için güncel politika kontrol edilmeli (belirsiz).
- Sonuç: hedeflemeyi **dil + konum + kreatif** yapar. Kreatifin kendisi ("zikir sayacı", "vird", tesbih görseli) doğru kitleyi seçer — ads skill'indeki "kitle bilgisi önce kreatife" ilkesi.

**"Reklamsız uygulama" ile reklam vermek**
- Mesaj tam olarak: **"Uygulama içinde reklam yok."** Çelişki yok: söz uygulama deneyimi hakkında.
- Yorumlarda "reklamsız diyip reklam veriyorsunuz" gelirse tek cümlelik hazır yanıt: "Uygulama içinde hiç reklam göstermiyoruz; bizi duyurmak için uygulama dışında tanıtım yapıyoruz."
- Hoca/üretici sponsorluğunda: işbirliği etiketi zorunlu (Reklam Kurulu sosyal medya etkileyici kılavuzu), sözleşme/brief'te vaat yasağı, üreticinin dini anlatımı yayından önce kullanıcı onayı, benzersiz UTM linki.

---

## 5. Sıra: 30 / 60 / 90 gün

Başlangıç 2026-10-02. Haftalık bütçe 5–8 saat; organik Cuma bloğu korunur.

| Dönem | İş | Saat |
|---|---|---|
| **0–30 gün** (2 Eki – 1 Kas) | K2 referrer yakalama + KPI kaynak kırılımı (fast-worker; bir sonraki Android sürümü). Play metin/görsel seti + mağaza deneyi (organik planda). Üç videonun onayı ve organik yayın. Google Ads hesabı aç, **harcamasız**: Play bağla (K1), dönüşümleri doğrula, metin varlıklarını onayla. 2–4 haftalık organik D7 tabanı. **G0 kapısı ~1 Kas.** | Kurulum tek seferlik ≈ 4–5 sa (o hafta 1 video); sonra mevcut ritüel |
| **31–60 gün** (2 Kas – 1 Ara) | **Faz A** TR, 2–22 Kas (Efsane Cuma/Kasım sonu açık artırma yükselişinden önce biter, tahmin). Gün 3 ve 7 teslimat/CPI kontrolü. 29 Kas: D7 + abone okuması → Faz A kararı. | Cuma bloğuna +30–45 dk |
| **61–90 gün** (2 Ara – 31 Ara) | Faz A geçtiyse **Faz B** diaspora 2–22 Ara (Regaib 10 Ara içinde — mevsim etkisini not et, karşılaştırmayı bozar). Geçmediyse para harcanmaz; saat organiğe döner. 29 Ara: Faz B kararı. **Ocak ortası:** Ramazan (Berat 22 Oca → Kadir 5 Mar) ücretli bütçe kararı, Ramazan teklif oranıyla birlikte. | Cuma bloğuna +30–45 dk |

Haftalık ücretli rutini (Cuma bloğunun içinde): KPI betiğini kaynak kırılımıyla çalıştır → tablo §2.5'e göre büyüt/bekle/kes → tek satır not. Kreatif değişikliği gerekiyorsa organik video hattından yeni varyant (yeni iş değil, mevcut üretim).

---

## 6. Açık kararlar (kullanıcı)

1. **Bütçe tavanları:** Faz A 250 TL/gün (5.250 TL), Faz B 6 USD/gün (≈126 USD), 90 gün mutlak tavan 12.000 TL — onay veya yeni rakam.
2. **K2 install referrer yakalama** (yeni bağımlılık yok, `expo-application`) bir sonraki sürüme girsin mi? Faz A'nın önkoşulu.
3. **K3/K4 Firebase veya Meta SDK:** öneri "hayır"; Reklam Kimliği beyanı "Hayır" kalır. Onay.
4. **G0 eşiği:** organik D7 < %15 ise ücretli test ertelensin mi?
5. **Faz B coğrafyası:** Avrupa Türk diasporası (öneri) mı, EN zengin ülkeler mi?
6. **Reklam metinleri:** dini olmayan ürün metnini Claude taslaklasın, sen onaylayasın — uygun mu? Dini metin reklamda hiç yer almasın mı (öneri: almasın)?
7. **Google Ads hesabı:** bireysel mi şirket mi, fatura/vergi bilgisi; teşvik kredisi çıkarsa kullanılsın mı?
8. **Ramazan 2027 ücretli bütçesi:** Ocak ortasında Faz A/B sonuçlarıyla karar.
9. **Ücretli hoca/üretici sponsorluğu:** 20 video + ücretsiz Premium kodu denemesinden sonra açılsın mı; anlaşma başına tavan?
10. **Reklam Kimliği doğrulaması:** son EAS AAB manifest kontrolü yapılsın (Play beyanı "Hayır" ile tutarlılık).

## Belirsizlikler

- Kurulum → ödeyen oranı, TR/diaspora CPI: veri yok; tüm eşikler ilk 7–14 günden sonra yeniden kalibre edilir.
- Play aboneliklerinin Google Ads'e SDK'sız "uygulama içi satın alma" dönüşümü olarak gelip gelmediği (K1) hesapta doğrulanmalı.
- Google Ads tıklamasıyla gelen kurulumda referrer'da `gclid` bulunması beklenir; ilk test kurulumunda doğrula.
- Platform asgari bütçeleri ve politika ayrıntıları (TikTok asgari bütçe, dinî içerikli reklam kısıtları, Google bütçe çarpanı önerileri) değişebilir; açmadan önce güncel metinden kontrol.
- Kur ve Google Ads TR vergi yansıtmaları tavan hesabını değiştirir.
