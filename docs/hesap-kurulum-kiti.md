# Hesap kurulum kiti — 2026-10-02

Amaç: ücretsiz tanıtım hesaplarını dakikalar içinde açmak. Kanal gerekçeleri ve sıra: `docs/ucretsiz-kanallar-2026.md`. Marka sesi: `.agents/product-marketing.md`.
Kural: metinlerde fazilet/ödül vaadi yok, yalnız doğru iddia (reklamsız, Zikir Halkası, vird, kaynak referanslı AI, "fetva vermez"). Kullanıcı adlarının müsaitliğini açarken sen kontrol et. Hiçbir hesap bu belgeyle açılmadı.

## 0. Ortak bilgiler

- Play paket kimliği: `com.zikirmatik_asistan.app` (apps/mobile/app.json)
- Temel Play linki: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app`
- Her linke eklenen son ek: `&referrer=utm_source%3D<kanal>%26utm_medium%3Dsocial%26utm_campaign%3Dprofile` (tam hâli her kanalda yazılı)
- Web sitesi: `https://zikirmatik-asistan.vercel.app` (alan adı 2026-10-02'de ertelendi; alınırsa tercih zikirmatik.app, yedek zikirmatik.net). Alan adı gelene kadar bio linki Play'e gider.
- Marka renkleri: koyu lacivert `#0B1423` (adaptif simge arka planı); diğer tonlar için store-assets/play-2026/template.html.
- Görsel dosyaları:
  - Logo: `store-assets/applogo.webp` (480x480), `apps/mobile/src/assets/app-logo.png` (440x440, PNG; platformlar webp kabul etmeyebilir, PNG'yi kullan)
  - Kapak/banner: `store-assets/play-2026/out/feature-graphic-tr.png` ve `feature-graphic-en.png` (1024x500; geniş alanlar için kırp/ölçekle)
  - Ekran görüntüleri: `store-assets/play-2026/out/tr/`, `out/en/` (01-10.png); eski set `store-assets/playstore-images/1-7.png`
  - Videolar: `apps/promo-video/out/video-01-sesli.mp4`, `video-02-vird-sesli.mp4`, `video-03-halka-sesli.mp4` (kullanıcı onayı bekliyor)
- Ortak profil görseli: logoyu 1:1 kullan, tüm platformlarda aynı. Yuvarlak kırpılacağı için kenarlarda boşluk bırak.

## 1. Ortak Gmail ve güvenlik

Ürün Gmail'i: `zikirmatik.asistan.app@gmail.com` (2026-10-02 açıldı). Tüm hesaplar bununla açılır.

- Marka hesapları + geliştirici hesabı tek Gmail ile açılır; Gmail'e 2FA (uygulama tabanlı) aç.
- Kurtarma telefonu ve ikinci kurtarma e-postası ekle; yedek kodları çıktı al/şifre yöneticisine koy.
- Şifre yöneticisi (1Password, Bitwarden vb.): her platform için benzersiz, 20+ karakter şifre; kullanıcı adı ve kayıt tarihi notu ekle.
- Her platformda 2FA aç (mümkünse uygulama tabanlı; SMS yedek). Yedek kodları yöneticide sakla.
- Aynı hafta aynı IP'den tüm hesapları arka arkaya açma; günde 2-3 hesap, aralarda ara ver (spam sinyali).
- Alan adı alınınca: iletişim adresi `destek@alanadi` olarak ayrıca kurulur, profil e-postaları güncellenir.

## 2. Marka hesapları ("Zikirmatik")

Ortak görünen ad: **Zikirmatik**. Genel kullanıcı adı önerisi aşağıdadır; müsait değilse sıradaki.

### TikTok (işletme hesabı)
- Kullanıcı adı: `zikirmatik.app` / `zikirmatikapp` / `zikirmatik.official`
- Bio sınırı: 80 karakter
  - TR: `Reklamsız zikir sayacı. Vird, Zikir Halkası, kaynak referanslı AI rehber.`
  - EN: `Ad-free dhikr counter. Daily wird, dhikr circles, source-linked AI guide.`
- Link: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dtiktok%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: profil `app-logo.png` (min 200x200, 1:1)
- Ayarlar: önce kişisel hesap aç, sonra Ayarlar > Hesap > İşletme hesabına geç (ücretsiz; linki bu açar, kişisel hesapta 1.000 takipçi eşiği var). Kategori: Uygulama / Yaşam tarzı. Hesabı hemen kamuya açık yap, 2FA aç. Dil tercihi TR; video açıklamalarında EN etiket ekleme.

### Instagram (profesyonel hesap)
- Kullanıcı adı: `zikirmatik.app` / `zikirmatik_app` / `zikirmatikapp`
- Görünen ad sınırı 30: `Zikirmatik`; bio sınırı 150
  - TR: `Reklamsız zikir sayacı. Kendi virdini kur, ailenle Zikir Halkası'nda ortak hedefe say. AI rehber kaynak gösterir, fetva vermez.`
  - EN: `Ad-free dhikr counter. Build your daily wird, count toward a shared goal in dhikr circles. AI guide cites sources, gives no fatwas.`
- Link: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dinstagram%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: profil `app-logo.png` (min 320x320, 1:1); öne çıkanlar kapakları için ekran görüntüleri
- Ayarlar: Ayarlar > Hesap türü > Profesyonel > İşletme veya Marka/Ürün kategorisi: "Uygulama". Yeni hesapta link geçici silinebilir (doğrulanamadı); silinirse 1-2 gün sonra tekrar ekle. 2FA aç. Threads'i bu hesaptan bağla.

### YouTube (marka kanalı)
- Kanal adı sınırı 50: `Zikirmatik`; tanıtıcı (handle) 3-30: `@zikirmatikapp` / `@zikirmatik_app` / `@zikirmatikofficial`
- Açıklama sınırı 1000 (kısa yaz)
  - TR: `Zikirmatik: reklamsız zikir sayacı. Vird programı, ailenle ortak hedefli Zikir Halkası ve kaynak referanslı AI rehber. AI rehber fetva vermez. Android için Google Play'de.`
  - EN: `Zikirmatik: an ad-free dhikr counter. Daily wird routine, dhikr circles for shared goals, and an AI guide that cites sources and gives no fatwas. On Google Play for Android.`
- Link: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dyoutube%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: profil `app-logo.png` (800x800 önerilir; 98x98 min), banner `feature-graphic-tr.png` ölçekle (önerilen 2048x1152, güvenli alan 1235x338; 1024x500 küçük kalır, üretimde büyüt)
- Ayarlar: kanalı Google hesabından "Yeni kanal" ile marka hesabı olarak oluştur (bireysel adın görünmez). Telefon doğrulaması yap (link/uzun video için gerekebilir). Çocuklara yönelik değil seç. 2FA Gmail üzerinden.

### Pinterest (işletme) — ertele
- Kanal belgesine göre web sitesi talebi alan adı ister; alan adı gelene kadar bekle. Açılırsa:
- Kullanıcı adı: `zikirmatikapp` / `zikirmatik_app` / `zikirmatikofficial`; görünen ad (sınır 65): `Zikirmatik`; hakkında sınırı 500
  - TR: `Reklamsız zikir sayacı: vird, Zikir Halkası ve kaynak referanslı AI rehber. Android'de.`
  - EN: `Ad-free dhikr counter: daily wird, dhikr circles and a source-linked AI guide. On Android.`
- Link: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dpinterest%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: profil `app-logo.png` (165x165 min), pinler dikey 1000x1500 (ekran görüntülerinden üretilecek)
- Ayarlar: "İşletme hesabı" olarak aç (ücretsiz), site talebi alan adı alınınca.

### X
- Kullanıcı adı sınırı 15: `zikirmatikapp` / `zikirmatik_app` / `zikirmatik_hq`
- Ad sınırı 50: `Zikirmatik`; bio sınırı 160
  - TR: `Reklamsız zikir sayacı. Vird, Zikir Halkası, kaynak referanslı AI rehber. Android.`
  - EN: `Ad-free dhikr counter for Android. Daily wird, dhikr circles, source-linked AI guide (no fatwas).`
- Link: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dx%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: profil `app-logo.png` (400x400), başlık `feature-graphic-en.png` kırpılmış 1500x500
- Ayarlar: bio dili EN (kitle EN). Ücretsiz hesapta günde 50 gönderi sınırı var; yalnız çapraz paylaşım yap. Otomasyon açma. 2FA aç.

### Threads
- Kullanıcı adı Instagram'dan gelir (`zikirmatik.app`); bio sınırı 150, Instagram bio metnini kullan (TR veya EN).
- Link: `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dthreads%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: Instagram'dan devralınır. Gönderi sınırı 500 karakter. Link/yeni hesap kısıtı doğrulanamadı.

### Product Hunt, AlternativeTo, Indie Hackers
- Kullanıcı adı: `zikirmatik` / `zikirmatikapp` / `zikirmatik_app`; üç yerde aynı ad. Bio sınırı bu üç platformda doğrulanamadı; kısa tut.
- Bio EN: `Ad-free dhikr counter for Android: daily wird, dhikr circles, source-linked AI guide. Built by a solo developer.`
- Linkler (her platform kendi `utm_source` değeriyle):
  - `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dproducthunt%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
  - `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dalternativeto%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
  - `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dindiehackers%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
- Görsel: profil `app-logo.png`; ürün sayfası için `feature-graphic-en.png` + `store-assets/play-2026/out/en/01-05.png`
- Ayarlar: AlternativeTo'da yeni hesapta 7 gün bekleme var; hesabı hemen aç, ürünü eklemeyi 7. günden sonraya bırak. Product Hunt'ta lansman günü hesap açma, 1-2 hafta önceden ısıt (bölüm 6). Indie Hackers: ürünü "yapım notu" olarak ekle. Hepsinde geliştirici olduğunu yaz.

## 3. Geliştirici hesabı (Reddit, DonanımHaber, Technopat)

Marka değil, açıkça geliştirici. Kullanıcı adı: `zikirmatik_dev` / `zikirmatik_developer` / `zikirmatikdev` (Reddit 3-20 karakter).
- Görünen ad: `Zikirmatik (geliştirici)` / `Zikirmatik (dev)`
- Bio (Reddit sınırı 200):
  - EN: `Solo developer of Zikirmatik, an ad-free dhikr counter for Android. Here to listen and share what I build.`
  - TR: `Zikirmatik'in geliştiricisiyim: Android için reklamsız zikir sayacı. Geri bildirim dinlemek için buradayım.`
- Link (profil linki varsa): `https://play.google.com/store/apps/details?id=com.zikirmatik_asistan.app&referrer=utm_source%3Dreddit%26utm_medium%3Dsocial%26utm_campaign%3Dprofile`
  - DonanımHaber başlığı için `utm_source%3Ddonanimhaber`, Technopat için `utm_source%3Dtechnopat` (kalan kısım aynı)
- Görsel: profil `app-logo.png`; gönderi ekleri `out/en/` ve `out/tr/` ekran görüntüleri
- Ayarlar: Reddit e-postasını doğrula (r/droidappshowcase eşiği), 2FA aç. Forum imzasına yalnız tek satır geliştirici notu.

## 4. Reddit ısınma planı (günde 10-15 dk)

Önce her subreddit'in güncel kurallarını kendin oku; kural araştırması reddit.com'a erişemedi, eşikler ikincil kaynaklıdır.
- Hafta 1: hesabı aç, e-postayı doğrula. r/androidapps ve r/SideProject'te günde 2-3 yardımcı yorum (soru yanıtı, deneyim paylaşımı). Link yok, tanıtım yok.
- Hafta 2: aynı tempo; konu bulduğun yerde yararlı cevap ver. Kendi uygulamanı yalnız doğrudan soruyorsa ve kural izin veriyorsa, geliştirici olduğunu belirterek an. Hesap 24 saatten ve 2 karmadan eskiyse r/droidappshowcase'te tek gönderi.
- Hafta 3: r/SideProject'te yapım hikâyesi gönderisi (ne yaptım, neyi öğrendim); yorumlara 24 saat içinde yanıt ver.
- Hafta 4+: haftada en fazla 1 gönderi, geri kalan yorum; 90/10 oranı (etkinliğin ~%90'ı tanıtımsız).
- Yapma: aynı metni birden çok subreddit'e atma, oy isteme, ikinci hesapla destek verme, link içeren DM.

Şablon gönderi (r/droidappshowcase, EN; kuralda format farklıysa uyarla):
```
Title: [Android] Zikirmatik - an ad-free dhikr counter I built (solo developer)

I'm the developer. Zikirmatik is a free dhikr counter with a library of 541 dhikrs, no ads, and
optional Premium features. What it does:
- Counter with a daily wird routine (tie your dhikr to a time of day)
- Dhikr Circles: count toward one shared goal with family or friends (free circle for up to 5 people)
- An AI guide that cites its sources with page references. It does not issue fatwas.

Free to use; Premium adds the AI guide, unlimited wird, detailed stats and themes.
Play link: <EN Play linki + utm_source=reddit>
I'd like honest feedback, especially about the first-run experience.
```
Geliştirici açıklama satırı (her gönderiye ve her tanıtım yorumuna): `Disclosure: I'm the developer of this app.`

## 5. DonanımHaber / Technopat tanıtım başlığı (TR)

Önce bölüm kurallarını oku; Technopat'ta öneri başlığı 30 günde 3-4 ile sınırlı. Tek başlık aç, geri bildirime dön.
```
Başlık: [Android] Zikirmatik - Reklamsız zikir sayacı (geliştirici tanıtımı)

Merhaba, uygulamanın geliştiricisiyim. Zikirmatik, reklamsız bir zikir sayacı. Neler var:
- 541 zikirlik ücretsiz kütüphane ve temel sayaç
- Vird: zikrini günün bir vaktine bağlayan rutin, seri takibi
- Zikir Halkası: aile/arkadaşla tek ortak hedefe birlikte sayım (ücretsiz halka 5 kişiye kadar)
- Kaynak ve sayfa referanslı AI rehber; fetva vermez (Premium özellik, günlük 1 ücretsiz kredi var)

Premium isteğe bağlıdır; güncel fiyat Google Play'de. Ekran görüntüleri aşağıda.
Play: <TR Play linki + utm_source=donanimhaber veya technopat>
Hata, eksik ya da isteklerinizi buraya yazarsanız dönüş yapacağım.
```

## 6. Listicle yazarlarına pitch e-postası

Hedefler: docs/ucretsiz-kanallar-2026.md "Listicle hedefleri" (öncelik 3, 5, 7, 9, 11). Yazar adı ve e-posta gönderimden önce sitede bulunmalı. Kısa, kişisel, abartısız; tek e-posta, 7-10 gün sonra tek hatırlatma. `<...>` yerlerini doldur.

TR:
```
Konu: <Makale adı> için bir öneri: Zikirmatik

Merhaba <Yazar adı>,

<Makale adı> yazınızı okudum, <somut bir şey: örn. "Ramazan bölümündeki sayaç karşılaştırması"> işime yaradı.
Zikirmatik'in geliştiricisiyim: Android için reklamsız bir zikir sayacı. Vird rutini, ailece ortak hedefli
Zikir Halkası ve kaynak referanslı bir AI rehber var (fetva vermez).
Uygun görürseniz listenize eklemeyi değerlendirir misiniz? İncelemek isterseniz size ücretsiz bir Premium kodu
gönderebilirim; yazıdaki görüşünüz size ait, karşılığında bir şey beklemiyorum.
Play: <TR Play linki + utm_source=listicle>

Teşekkürler,
<Ad> - Zikirmatik geliştiricisi
```
EN:
```
Subject: A suggestion for <article title>: Zikirmatik

Hi <Author name>,

I read <article title>; <something specific: e.g. "the Ramadan comparison section"> was useful to me.
I'm the developer of Zikirmatik, an ad-free dhikr counter for Android: a daily wird routine, dhikr circles
for shared goals, and an AI guide that cites sources (it gives no fatwas).
If it fits, would you consider adding it to your list? I'm happy to send a free Premium code so you can review
it; your opinion in the article is yours, I'm not asking for anything in return.
Play: <EN Play linki + utm_source=listicle>

Thanks,
<Name> - developer of Zikirmatik
```

## 7. Product Hunt hazırlık listesi (lansman sonra)

- [ ] Hesabı lansmandan 1-2 hafta önce aç; ürünlere yorum yaz, profilini doldur
- [ ] Tagline seçenekleri (≤60 karakter):
  - `Ad-free dhikr counter with daily wird and shared circles` (56)
  - `An ad-free dhikr counter for your daily wird` (44)
  - `Dhikr counter: wird routines, shared circles, no ads` (52)
- [ ] Galeri: `feature-graphic-en.png` (kapak), `store-assets/play-2026/out/en/01-05.png`, 20-35 sn video (`video-0X-sesli.mp4`)
- [ ] Logo: `app-logo.png` (240x240 min, 1:1)
- [ ] Ürün sayfasında Play linki (utm_source=producthunt), "Android only" notu
- [ ] İlk yorum (maker comment) taslağı:
```
Hi, I'm the developer. I built Zikirmatik because most dhikr counters I tried were full of ads. It's a free,
ad-free counter with a 541-dhikr library, a daily wird routine, and dhikr circles to count toward a shared goal
with family. The optional AI guide cites its sources and doesn't issue fatwas. Android only for now.
I'd love your feedback on the first-run experience.
```
- [ ] Lansman günü: yorumlara hızlı yanıt, oy isteme yok; kitle uyumsuzluğu nedeniyle en son sıra

## 8. Açılış günü kontrol listesi (sırayla)

- [ ] 1. Ortak Gmail'i aç (bölüm 1), 2FA + kurtarma telefonu + yedek kodlar
- [ ] 2. Şifre yöneticisini hazırla, her hesap için kayıt aç
- [ ] 3. Kullanıcı adlarının müsaitliğini kontrol et (zikirmatik.app / zikirmatikapp...); seçileni yöneticiye yaz
- [ ] 4. Görselleri tek klasöre al: `app-logo.png`, `feature-graphic-tr/en.png`
- [ ] 5. TikTok: aç, işletme hesabına geç, bio + link, 2FA
- [ ] 6. Instagram: aç, profesyonel hesap, bio + link, 2FA
- [ ] 7. YouTube: marka kanalı, telefon doğrulama, açıklama + link
- [ ] 8. Threads'i Instagram'dan bağla, bio + link
- [ ] 9. X: aç, bio + link, 2FA
- [ ] 10. Geliştirici hesabı `zikirmatik_dev`: Reddit aç, e-postayı doğrula, bio (bölüm 3), 2FA
- [ ] 11. Reddit ısınma planını başlat (hafta 1)
- [ ] 12. AlternativeTo + Indie Hackers hesabı aç (AlternativeTo ürün kaydı 7. günden sonra)
- [ ] 13. Product Hunt hesabını aç, ısınmayı başlat
- [ ] 14. DonanımHaber ve Technopat'ta üye ol, bölüm kurallarını oku (başlık hafta 4)
- [ ] 15. Pinterest: alan adı gelene kadar ertele
- [ ] 16. Alan adı alınınca: sitede ve tüm profillerde linki güncelle, Pinterest sitesini talep et
- [ ] 17. Tüm hesapların kullanıcı adı, e-posta ve kayıt tarihi yöneticide kayıtlı mı kontrol et

Sabit kararlar: Ekşi Sözlük hariç, SEO sayfaları ertelendi, ücretli reklam yok, hoca/üretici ile takas ilk 20 videodan sonra.
