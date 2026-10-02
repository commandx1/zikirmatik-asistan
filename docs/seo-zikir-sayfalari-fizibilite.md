# Programatik SEO: zikir başına sayfa — fizibilite (2026-10-02)

Salt okunur inceleme. Kod, commit, prod DB değişikliği yok. Sayımlar `apps/api/scripts/data/sourceDataset.mjs` içindeki `SOURCE_DATASETS` yüklenerek çıkarıldı.

## Özet

- Teknik olarak kolay: veri repoda, site Next.js 15 App Router, `generateStaticParams` + statik üretim yeterli.
- Önerilen yol: **seçenek (a)**, repodaki seed dosyalarından build-time üretim. API/prod DB bağımlılığı sıfır.
- Asıl risk teknik değil, **içerik**: 541 kaydın bir kısmı ince/kopya, `virtue` alanının büyük bölümü hadis değil editoryal yorum, ~262 kaydın kaynağı birincil hadis kaynağı belirtmiyor. Tüm kayıtları değil, filtrelenmiş bir alt kümeyi yayınlamak gerekir.
- Bloklayıcı karar: repodaki başlıklar eski (rename `--apply` durumu repodan görülemiyor), yayın öncesi başlık kararı gerekli.

## 1. Veri nerede, hangi alanlar

- Tek kaynak: `apps/api/scripts/data/*.mjs` (59 dataset, `sourceDataset.mjs` toplar). `seed-dhikrs.mjs` bunları `key` üzerinden prod Mongo `dhikrs` koleksiyonuna upsert eder. Yani repo = seed kaynağı, prod = onun kopyası (+ rename betiğiyle yapılan düzeltmeler).
- Şema (`apps/api/src/modules/dhikrs/schemas/dhikr.schema.ts`): `key`, `nameArabic`, `canonicalKey`, `name/transliteration/meaning/virtue/source` (hepsi `{tr,en}`, ikisi de zorunlu), `tags`, `categories`, `timeOfDay[]`, `recommendedCount`, `suitableFor`, `isVerified`, `isActive`, `audioUrl?`, embedding alanları. Seed öğelerinde ayrıca `dhikrDay` (esma) ve `specialDays` (16 kayıt).
- **Slug alanı yok.** `key` benzersiz ama iki biçim karışık: `kebab-case` ve `BUYUK_HARF_ALT_CIZGI` (örn. `AYETEL_KURSI`). Slug `key.toLowerCase().replaceAll('_','-')` ile türetilebilir; çakışma kontrolü gerekir.
- Kayıt sayısı: **541 benzersiz key**, 520 benzersiz Arapça metin, 535 benzersiz `name.tr`.
- Kapsam: name, transliteration, meaning, virtue, source için **TR ve EN %100 dolu** (boş kayıt 0). `tags`, `categories`, `suitableFor` boş olan 0. `en` meaning `tr` ile aynı olan 0.
- `recommendedCount`: 100 (150 kayıt), 7 (152), 10 (64), 3 (73), 33 (17), kalanı dağınık; 1-2000 arası, bazıları çok büyük (esma ebced sayıları). Sayfada "kaç kere okunur" cevabı için bu alan kullanılabilir ama aşırı değerler (>1000) ayrıca ele alınmalı.
- `timeOfDay`: 416 kayıt `any`, kalan ~125 kayıt vakit bazlı. Seed'de karışık biçim (string ve dizi, TR/EN vakit adları); `scripts/lib/time-of-day.mjs` `normalizeTimeOfDay` ile normalize ediyor, aynı fonksiyon kullanılmalı.

## 2. Web sitesi yığını

- `apps/website`: Next.js **15.5.21**, React 19.1, next-intl 3.26.3, Tailwind 3.4. App Router, kök `app/layout.tsx` boş, asıl layout `app/[locale]/layout.tsx`.
- i18n: `routing.ts` locales `["tr","en"]`, `defaultLocale: "tr"`, `localePrefix: "as-needed"` (TR kökte, EN `/en`). Not: memory'deki "yalnız TR" notu eski; commit 11a3b9d ile EN açıldı. `next.config.mjs` yalnız `/tr/*` -> `/*` yönlendiriyor.
- Mevcut sayfalar: ana sayfa, `/privacy`, `/terms`, `/refund-policy`, `/delete-account`, `/halka/[code]` (noindex).
- `sitemap.ts` / `robots.ts`: elle yazılı sabit yol listesi, `SITE_URL` = `https://zikirmatik-asistan.vercel.app` (alan adı yok). Sitemap dinamik yol almıyor; zikir sayfaları için genişletilmeli (541 x 2 dil = ~1082 URL, 50k limitinin çok altında, tek dosya yeter).
- Metadata deseni: `generateMetadata` + `getTranslations({namespace:"meta"})`, `alternates.canonical` ve `languages` (tr/en) elle yazılmış (`privacy/page.tsx`). Yeni sayfalar aynı deseni izler.
- Veri: bugün **hiç veri çekmiyor**; tüm içerik `messages/{tr,en}.json`. API çağrısı yok.
- Bağımlılık notu: web `apps/api` içindeki `.mjs` dosyalarını import edebilir mi: monorepo workspace'inde web'in `tsconfig` kapsamı dışı; en az kodlu yol `apps/website/src/data/` altına üretilmiş bir JSON snapshot koymak (aşağıda).

## 3. Seçenekler

**(a) Repo seed dosyalarından build-time statik üretim (önerilen)**
- Küçük bir betik (`apps/website/scripts/export-dhikrs.mjs`) `SOURCE_DATASETS`'i okuyup yalnız yayınlanacak alanları `apps/website/src/data/dhikrs.json`'a yazar (slug, ad, Arapça, okunuş, anlam, kaynak, virtue, recommendedCount, normalize timeOfDay, categories). JSON git'e girer; site build'i betiğe veya prod'a bağımlı olmaz.
- `app/[locale]/zikir/[slug]/page.tsx` + `generateStaticParams` + `generateMetadata`. Hepsi build'de statik, ISR gerekmez.
- Artılar: prod DB/API bağımlılığı yok, çalışan uygulamayı etkilemez, yeni dependency yok, yayın seti repoda gözden geçirilebilir (kullanıcı review kuralıyla uyumlu), Vercel build deterministik.
- Eksiler: veri değişince yeniden export + deploy gerekir; prod'daki rename'ler repoya yansımadıysa sayfalar prod başlıklarından sapar (aşağıda risk).

**(b) Public API'den build/ISR**
- `GET v1/dhikrs` korumasız, çalışır. Ancak web'de hiç API istemcisi/env yok, build'in canlı API'ye bağımlı olması, API URL/ortam yönetimi, `isVerified/isActive` filtre, throttler yok (api-gözlemlenebilirlik notunda açık takip) ve 541 sayfa için build-time yük eklenir. Prod DB'ye dolaylı bağ, ISR'de API kesintisinde bayat/boş sayfa riski.
- Daha fazla kod, daha fazla risk; tek avantajı prod ile otomatik senkron.

**Öneri: (a).** İleride prod'la senkron gerekirse export betiği API'den okuyacak şekilde değiştirilebilir, sayfa kodu değişmez.

## 4. İçerik politikası kontrolü

Kısıtlar: Claude yeni dini metin yazmaz ([[feedback-islami-icerik-kullaniciya-ait]]); sitede "fazilet hadisi" vaadi/pazarlama dili yok ([[website-2026-kararlari]]).

- Sayfalar yalnız mevcut onaylı kütüphane alanlarını göstermeli: Arapça, okunuş, anlam, kaynak, virtue, önerilen adet, vakit. Şablon cümleleri (başlık/H2 etiketleri, "Ne zaman okunur?" gibi) arayüz çevirisi sayılır ve `messages/*.json`'a girer; dini içerik taşımaz. Ek açıklama/özet/SSS metni üretilmemeli.
- **Virtue alanı hadis değil, çoğunlukla editoryal yorum.** Örnekler: "Kimlik ve aidiyet bilincini tazeler...", "Selamet, umut ve güven duygusunu besler...", esma kayıtlarında "baş ağrısı ve migren ağrılarının şifası". Bunlar "fazilet vaadi" gibi okunur ve sağlık iddiası içerir. Ayrıca 11 kayıtta virtue < 80 karakter (ince). Medyan 452, p90 914 karakter.
- Önerilen sunum: etiket "Fazilet" yerine **"Rivayet ve kaynak"** veya "Kaynaklarda geçen bilgi"; virtue + source **birlikte** ve kaynak görünür biçimde gösterilir; "okursan şu olur" çerçevesi, CTA veya vaat dili yok; esma ve virtue'sü sağlık/rızık sonucu vaat eden kayıtlar ilk dalgadan hariç tutulur. Bu, uygulama içi zorunlu fazilet kuralını ([[feedback-fazilet-amac-zorunlu]]) web'de pazarlama dilinden ayrıştırır. Son karar kullanıcıda.
- Kaynak referansı eksikleri (source alanı dolu ama zayıf):
  - 262 kayıt birincil hadis/Kur'an koleksiyonu adı içermiyor (regex taraması, kaba sayı). Büyük kısmı: esma 99 + esma rızık 10, Ramazan günleri 11, Muharrem 11, salavat 11, sıkıntı-kaygı 17, rızık-mülk 12, Recep 6, Mevlid 7, Safer 5, evlilik 9.
  - 26 kayıt açıkça ikincil/klasik atıf ("Receb-i Şerif Risalesi", "klasik vird derlemeleri", "Dua mecmuaları", "Mahmud Sami Ramazanoğlu"). Bunlar hadis kaynağı gibi sunulmamalı, ilk dalgadan hariç.
  - 15 kayıtta source < 15 karakter ("Esmâ-i Hüsnâ", "Dua mecmuaları", "Yasin 58"); Kur'an ayetleri için kabul edilebilir, esma ve mecmua için zayıf.
  - Boş source: 0 (şema zorunlu), yani eksiklik "yok" değil "niteliksiz".
- Tekrarlar: 19 Arapça metin grubunda 40 kayıt aynı duayı taşıyor; `name.tr` kopyaları (Yâ Mü'min x3, Es-Samed x2, Hasbiyallâh Zikri x2, Kadir Gecesi Duası x2...). `canonicalKey` ile gruplanıp tek sayfa/canonical yapılmalı.

## 5. SEO değeri

Hacim verisi uydurulmadı; her kalıp için Google Search Console (site doğrulaması) ve Keyword Planner ile (ücretsiz) kontrol edilmeli. Başlangıçta alan adı `vercel.app` alt alanı olduğundan otorite düşük, bu en büyük belirsizlik.

Hedef sorgu kalıpları (TR), sayfa elemanıyla eşleşme:
- "{ad} nasıl okunur / okunuşu" -> transliteration + Arapça
- "{ad} anlamı / türkçe meali" -> meaning
- "{ad} kaç kere okunur / kaç defa çekilir" -> recommendedCount (vird bağlamı)
- "{ad} ne zaman okunur / sabah akşam duası" -> timeOfDay + categories
- "{ad} arapça yazılışı" -> nameArabic
- "{ad} hadis kaynağı" -> source
- Başlık adlandırma kuralları (özel isim/en yaygın söyleniş) bu sorgularla uyumlu; title = "{Ad}: Okunuşu, Anlamı ve Kaç Defa Okunur" gibi şablon.
- Genel "zikir çekmek", "zikirmatik" sorguları rekabetçi; uzun kuyruk (tek dua adı) daha gerçekçi.
- İlk dalga tahmini: kamuya bilinen, aranma olasılığı yüksek 30-60 dua (Ayetel Kürsi, Salavat, Hasbünallah, istihare vb.); sorgu verisiyle doğrulanmalı.

## 6. Efor ve riskler

Eklenecek/değişecek dosyalar (~8-9):
1. `apps/website/scripts/export-dhikrs.mjs` (yeni; seed -> JSON, filtre + slug + normalize)
2. `apps/website/src/data/dhikrs.json` (üretilen)
3. `apps/website/src/lib/dhikrs.ts` (tip + getter, ~30 satır)
4. `apps/website/src/app/[locale]/zikir/[slug]/page.tsx` (+ `generateStaticParams`, `generateMetadata`, canonical, JSON-LD opsiyonel)
5. `apps/website/src/app/[locale]/zikir/page.tsx` (dizin/kategori sayfası, iç bağlantı için şart)
6. `apps/website/src/app/sitemap.ts` (dinamik yolları ekle)
7. `apps/website/src/messages/tr.json`, `en.json` (şablon etiketleri, meta)
8. Header/Footer'a dizin linki (opsiyonel)
9. Playwright smoke testi (1 sayfa)
Tahmini 1-2 iş günü kod; asıl zaman yayın seti kararı ve içerik review'u.

Riskler:
- **İnce/kopya içerik:** 40 kayıt kopya Arapça, 11 çok kısa virtue; çok sayıda neredeyse aynı şablon sayfa Google'da "thin/duplicate" sayılabilir. Azaltma: önce 30-60 sayfalık seçili set, canonicalKey ile birleştirme, ince kayıtlara noindex.
- **Başlık senkronu:** repo başlıkları eski; `rename-dhikr-titles.mjs` prod'a uygulandıysa ve seed dosyaları güncellenmediyse repo != prod. Başlık review'u (`docs/zikir-baslik-onerileri.md`) bitmeden başlıklarla URL/slug sabitlemek yanlış; slug'ı `key`'den türetmek bu bağımlılığı keser.
- **Özel gün zikirleri:** tarihe bağlı dataset'ler (2025/2026) zamanla eskir; ilk dalgadan hariç tut.
- **Arapça render:** harekeli metin için `dir="rtl"`, `lang="ar"`, harekeyi destekleyen font (Amiri/Noto Naskh; web fontu ağırlık ekler, system font fallback testlenmeli); Tailwind'de RTL blokta yalnız Arapça satırı. Yeni dependency gerekmez.
- **Canonical/hreflang:** EN sayfaları çevirisi hazır (EN %100), ama EN başlık/transliterasyon kalitesi gözden geçirilmeli; `alternates.languages` tr<->en karşılıklı, canonical self. `vercel.app` alan adı değişirse (`SITE_URL`) tüm canonical'lar değişir; alan adı kararından önce toplu indeksleme erken olabilir.
- **Politika:** virtue sağlık/rızık vaadi gibi okunan kayıtlar; pazarlama kuralıyla çelişir (bkz. 4).
- **Tarama/dizin:** 1082 URL yeni, düşük otoriteli sitede yavaş indekslenir; sitemap + iç bağlantı + Search Console gönderimi şart.

## Veri boşlukları (özet)
- Slug yok, key biçimi karışık.
- 262 kayıt birincil kaynak adı içermiyor, 26 kayıt ikincil/klasik atıf, 15 kayıtta çok kısa source.
- virtue alanı hadis değil yorum olan kayıtlar çok; 11 kayıt çok kısa.
- 19 Arapça kopya grubu (40 kayıt).
- Repo başlıkları ile prod başlıkları arasında olası fark.
- Arama hacmi bilinmiyor.
