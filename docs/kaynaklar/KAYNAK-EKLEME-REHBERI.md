# Kaynak Ekleme Rehberi

AI Rehber'in kullandığı `source_passages` korpusuna yeni bir kitap/PDF eklerken
izlenecek yol. Yeni bir oturum bu dosyayı okuyarak aynı akışı sorunsuz
tekrarlayabilmeli.

Bütün komutlar `apps/api` dizininden çalıştırılır:

```bash
cd apps/api
```

---

## Akışın özeti

```
docs/kaynaklar/<kitap>.pdf
        │
        ├─ (metin katmanı VARSA)  seed-source-passages.mjs --extract
        │
        └─ (metin katmanı YOKSA)  sayfa sayfa elle transkripsiyon
                                  → docs/kaynaklar/verified/<source_id>/pNNN.txt
                                  → build-passages-from-verified.mjs
        ↓
docs/kaynaklar/<source_id>.passages.jsonl      ← ÜRETİLEN dosya, elle düzenlenmez
        ↓
review-passages.mjs   (--report → gözden geçir → --approve/--reject)
        ↓
prune-stale-source-passages.mjs   (bayat kayıtları temizle)
        ↓
seed-source-passages.mjs --seed   (embed + upsert)
        ↓
MongoDB: source_passages
```

---

## 1. manifest.json'a kaydı ekle

`docs/kaynaklar/manifest.json` bütün betiklerin baktığı kayıt defteridir. Burada
olmayan bir `source_id` ile hiçbir betik çalışmaz.

```json
{
  "source_id": "ornek-kaynak",
  "title": "Örnek Kaynak (Yazar)",
  "type": "dua",
  "file": "ornek-kaynak.pdf",
  "index_file": null,
  "version": 1
}
```

- `source_id` — kebab-case, dosya adlarında da bu kullanılır.
- `type` — `dua` | `siyer` | `ilmihal` … (pasaj kaydına aynen yazılır).
- `file` — `docs/kaynaklar/` içine göre göreli yol.

---

## 2. PDF'in metin katmanı var mı? (yol ayrımı)

```bash
pdftotext -f 10 -l 10 "../../docs/kaynaklar/ornek-kaynak.pdf" -
```

- **Çıktı geliyorsa** → metin katmanı var, **Yol A**.
- **Çıktı boşsa** → taranmış görüntü PDF, **Yol B**.

Üç mevcut OCR kaynağı (`dogru-inanc`, `ehli-sunnet-akide`,
`sihir-kahinlik-hukmu`) Yol B ile üretildi.

---

## Yol A — Metin katmanı olan PDF

```bash
node scripts/seed-source-passages.mjs --extract --source ornek-kaynak
```

Bu komut PDF'ten sayfa sayfa metni çeker, chunk'lar ve
`docs/kaynaklar/ornek-kaynak.passages.jsonl` dosyasını yazar. Ardından
pasajları gözden geçir (aşağıdaki bölüm), sonra **5. bölüme** geç.

> Üretilen jsonl'de `review` alanı vardır; yalnızca `approved` olan pasajlar
> seed edilir. Gözden geçirme yapıp onaylamak gerekir.

### `--strip-arabic` — garbled Arapça glyph temizliği

Bazı kaynaklarda (örn. Hısnu'l-Muslim) `pdftotext` Arapça metni ters/bozuk
glif dizileri hâlinde, Türkçe metnin arasına karışmış biçimde döker (bidi
sıralama sorunu). Türkçe meal kendi başına temizdir; sorun yalnızca aradaki
Arapça karakter döküntüsüdür. Bu durumda `--extract` çağrısına
`--strip-arabic` ekle:

```bash
node scripts/seed-source-passages.mjs --extract --source hisnul-muslim --strip-arabic
```

- Sayfa metni, chunk'lamadan **önce** temizlenir — yani `--strip-arabic` ile
  ve onsuz üretilen jsonl'lerin chunk sınırları/`chunkIndex`'leri **farklı
  olur**. Bu yüzden bir kaynak için bu bayrak seçildiyse, o kaynağın her yeniden
  `--extract` çalıştırılışında **tutarlı biçimde aynı bayrakla** kullanılmalı
  (bir seferinde açık, bir seferinde kapalı kullanmak aynı `chunkIndex`'in
  farklı sınırlara denk gelmesine, dolayısıyla review durumunun anlamını
  yitirmesine yol açar).
- Varsayılan **kapalı**'dır; Arapça glif sızıntısı olmayan kaynaklarda
  (el-ezkar, muhtasar-ilmihal gibi) kullanılmamalı — çıktıyı değiştirmez ama
  gereksizdir.
- `[özet]` çıktısında `arapça temizleme: açık/kapalı` satırı ve (açıksa)
  temizlenen toplam Arapça karakter sayısı basılır.
- Temizleme mantığı `apps/api/scripts/lib/chunking.mjs` içindeki
  `stripArabicScript(text)` fonksiyonundadır: Arapça script Unicode
  aralıklarını (U+0600–06FF, U+0750–077F, U+08A0–08FF, U+FB50–FDFF,
  U+FE70–FEFF) ve bidi/format kontrol karakterlerini satır satır siler; bir
  satır bu işlemden sonra tamamen boşalırsa ya da geriye yalnızca
  noktalama/rakam kalırsa (ör. yalancı bir dipnot numarası) o satır tamamen
  atılır. Zaten boş olan paragraf ayırıcı satırlara dokunmaz.

### `--heading-colon` — sonu ":" ile biten başlıkları tanı

Bazı kaynaklarda (örn. Hısnu'l-Muslim) bölüm başlıkları BÜYÜK HARF/Title Case
olmakla birlikte sonunda ":" ile biter (ör. `EVDEN ÇIKARKEN YAPILAN DUÂ:`).
Varsayılan başlık sezgisi `. , ; :` ile biten satırları başlık saymadığı için
bu satırlar `sectionHeading` olarak yakalanmaz. Bu durumda `--extract`
çağrısına `--heading-colon` ekle:

```bash
node scripts/seed-source-passages.mjs --extract --source hisnul-muslim --strip-arabic --heading-colon
```

- Sonunda **tek** ":" olan (": :" gibi çiftler hariç) kısa, BÜYÜK HARF/Title
  Case bir satır artık başlık kabul edilir; kaydedilen `sectionHeading`'de
  ":" kaldırılır ve metin baştan/sondan trim edilir.
- Tıpkı `--strip-arabic` gibi chunk sınırlarını etkiler: bir kaynak için bu
  bayrak seçildiyse, o kaynağın her yeniden `--extract` çalıştırılışında
  **tutarlı biçimde aynı bayrakla** kullanılmalı — bir seferinde açık, bir
  seferinde kapalı kullanmak aynı `chunkIndex`'in farklı sınırlara denk
  gelmesine, dolayısıyla review durumunun anlamını yitirmesine yol açar.
- Varsayılan **kapalı**'dır; mevcut kaynakların çıktısı bu bayrak olmadan
  bayt bazında aynı kalır.
- `[özet]` çıktısında `heading-colon: açık/kapalı` satırı basılır.
- Mantık `apps/api/scripts/lib/chunking.mjs` içinde `classifyHeading` /
  `stripSingleTrailingColon` fonksiyonlarındadır; varsayılan (bayrak kapalı)
  yol hâlâ doğrudan `isHeadingCandidate`'i kullanır ve değişmedi.
- Aynı bayrak, blank satırla ayrılmadan bir paragrafın ortasına gömülmüş
  başlık satırlarını da (örn. bir cümlenin hemen ardından gelen
  `EVDEN ÇIKARKEN YAPILAN DUÂ:` satırı) yakalar ve paragrafı o satırdan böler;
  içindekiler (TOC) sayfalarındaki noktalı/sayfa numaralı satırlar bu taramada
  başlık sayılmaz.
- `--heading-colon` altında ayet/hadis kaynak satırları (`"X Sûresi"`,
  `"X Sûresi: 255"`, `Bkz./Buhâri/Müslim/Tirmizi/Ebu Dâvud/Nesâi/İbn-i/Ahmed/
  Hâkim/Elbâni` ile başlayan veya `(4/103)` gibi bir cilt/sayfa referansı
  taşıyan satırlar) ve rivâyet giriş ifadeleri (sonu "ki"/"dedi"/"der"/
  "buyurdu" ile biten, ör. `Buyurdu ki:`) hiçbir zaman başlık sayılmaz; ayrıca
  bu bayrakta Title Case artık yeterli değildir — satırın harflerinin en az
  %80'i (Türkçe'ye duyarlı `toLocaleUpperCase('tr')` karşılaştırmasıyla, sabit
  "-sallallahu aleyhi ve sellem-" gibi hitap araları hariç) BÜYÜK HARF olmalı.
- PDF sayfa düzeninin iki veya üç fiziksel satıra böldüğü başlıklar (ör.
  `KÂFİR, AKSIRDIRDIĞI ZAMAN ALLAH'A HAMD EDERSE,` + `ONUN İÇİN YAPILAN DUÂ:`)
  tek başlığa birleştirilir: BÜYÜK HARF, sonu `:`/`?` ile bitmeyen bir ilk
  satırı — aralarında en fazla 2 boş/harfsiz satır ve en fazla 1 ek ara satır
  atlanarak — sonu `:`/`?` ile biten tam bir başlık satırı takip ediyorsa
  ikisi birleştirilir (`:` kaldırılır, `?` korunur).

---

## Yol B — Taranmış PDF (metin katmanı yok)

Ölçüt: sayfa görüntüsü tek tek okunur ve metin elle yazılır. Orijinal dosyayla
birebir kontrol yapılır, **hiçbir sayfa atlanmaz**.

### 3. Sayfa dosyalarını oluştur

```
docs/kaynaklar/verified/<source_id>/p001.txt
docs/kaynaklar/verified/<source_id>/p002.txt
...
```

- Dosya adı **daima üç haneli**: `p007.txt`, `p142.txt`.
- PDF'in fiziksel sayfa numarasıyla birebir eşleşir (kitabın iç numarasıyla
  değil).
- 1'den son sayfaya kadar **hiçbir numara eksik olamaz** — betik eksik sayfa
  görürse üretimi durdurur.

**Transkripsiyon kuralları:**

- Metin sayfada ne yazıyorsa öyle yazılır. İçerik yazılmaz, tamamlanmaz,
  yeniden ifade edilmez.
- Paragraflar arası boş satır bırakılır (chunker paragrafları böyle ayırır).
- Dipnotlar sayfanın sonunda, referans numarasıyla birlikte tutulur:

  ```
  "...Hiç şüphesiz ki O, her şeyi bilendir."1

  Bizler,
  ...

  1 Şûrâ Sûresi:11-12
  2 Hûd Sûresi:6
  ```

- Arapça blokları **yazılmaz** (korpus Türkçedir); ayetin/hadisin Türkçe meali
  yazılır. QA raporu Arapça harf sızmasını yakalar.
- Okunamayan yer varsa geçici olarak `[?]` konur; üretimden önce ya çözülür ya
  sayfa boşaltılır.

### 4. Korpusa girmeyecek sayfaları BOŞALT (silme)

Kapak, künye, içindekiler, boş sayfa, okunamayan sayfa → dosya **silinmez**,
içeriği boşaltılır (`''` yazılır).

Sebep: "eksik sayfa yok" kontrolü dosyanın varlığına bakar. Dosyayı silmek
üretimi durdurur; boşaltmak hem numara sürekliliğini korur hem içeriği
korpustan çıkarır.

---

## Pasajları gözden geçir — `review-passages.mjs`

jsonl üretildikten sonra (Yol A'da `--extract`, Yol B'de
`build-passages-from-verified.mjs`), **seed edilmeden önce** bu adımda
pasajlar gözden geçirilir. Betik MongoDB'ye bağlanmaz, hiçbir embedding/seed
işlemi yapmaz; yalnızca jsonl'i okur/yazar.

```bash
# 1) rapor üret — hiçbir şeyi değiştirmez
node scripts/review-passages.mjs --source ornek-kaynak --report
```

Bu komut `docs/kaynaklar/ornek-kaynak.review-subset.md` dosyasını yazar:
toplam chunk/sayfa özeti, `pending`/`approved`/`rejected` sayıları ve
"Otomatik bayraklar" bölümü (kapak/içindekiler olabilecek sayfa ≤ 12
chunk'lar, <200 karakter kısa chunk'lar, Arapça harf oranı >%10 olan
chunk'lar, birebir mükerrer metinler). Bayraklar yalnızca öneridir; kararı
rapor okunarak insan verir.

Rapor incelendikten sonra `review` alanı şu komutlarla güncellenir:

```bash
# çoğunu onayla, birkaçını dışarıda bırak (pending kalır)
node scripts/review-passages.mjs --source ornek-kaynak --approve-all --except 3,7,9

# tek tek onayla / reddet
node scripts/review-passages.mjs --source ornek-kaynak --approve 1,2
node scripts/review-passages.mjs --source ornek-kaynak --reject 5,9
```

Bu komutlar yalnızca `review` alanını değiştirir; `passageId`, key sırası ve
metin aynen korunur. jsonl dosyası yoksa betik hata verip durur.

> `--help` ile tüm seçenekler listelenir. `--file <path>` ile jsonl'in
> varsayılan konumu (`docs/kaynaklar/<id>.passages.jsonl`) geçici olarak
> geçersiz kılınabilir — örneğin bir kopya üzerinde deneme yapmak için.

Onaylama bittiğinde **5. bölüme** geç.

---

## 5. Üret → temizle → seed (5 adımlı döngü)

Sayfalarda her düzeltme yaptığında bu döngü baştan çalıştırılır.

```bash
# 1) pNNN.txt dosyasını düzelt (elle)

# 2) jsonl'i yeniden üret  (Yol A ise bu adım yerine --extract)
node scripts/build-passages-from-verified.mjs \
  --source ornek-kaynak \
  --verified-dir ../../docs/kaynaklar/verified/ornek-kaynak

# 3) bayat kayıt var mı? (kuru çalışma, hiçbir şey silmez)
node scripts/prune-stale-source-passages.mjs --source ornek-kaynak

# 4) bayat kayıt varsa sil
node scripts/prune-stale-source-passages.mjs --source ornek-kaynak --apply

# 5) embed + upsert
node scripts/seed-source-passages.mjs --source ornek-kaynak --seed
```

`--dry-run` ile 2. adımı dosya yazmadan deneyebilirsin.

### 3. ve 4. adım neden var?

`seed-source-passages.mjs` yalnızca **upsert** yapar, hiç silmez.
`passageId = sha1("sourceId:chunkIndex")` olduğu için metin değişse de ID sabit
kalır — ama **chunk sayısı azalırsa** son chunkIndex'ler veritabanında öksüz
kalır ve AI Rehber artık var olmayan metni döndürür. Prune tam olarak bu
kayıtları siler. (Akide kaynağında 44 öksüz kayıt bu şekilde bulundu.)

---

## 6. Doğrulama

**Üretim çıktısı (2. adım):**

```
[qa] boş sayfa (9): 1, 38, 92, 93, ...        ← bilerek boşaltılanlarla eşleşmeli
[qa] arapça harf sızmış sayfa (0): -          ← 0 olmalı
[qa] "[?]" okunamayan işareti (0): -          ← 0 olmalı
[qa] üretilen chunk: 139
[fark] pasaj: 183 -> 139 | karakter: ... (%-11.2)
```

`[fark]` satırı beklenmedik bir düşüş gösteriyorsa dur ve sebebini bul.

**Prune kuru çalışması (3. adım):** `jsonl chunk` ile `veritabanı` sayısı eşit
ve `bayat kayıt: 0` olmalı.

**Seed çıktısı (5. adım):** hata sayısı 0 olmalı. Metni değişmeyen pasajlar
(`embeddingSourceHash` aynı) yeniden embed edilmez, atlanır — bu normaldir.

---

## Tehlikeler

- ⛔ **Yol B kaynaklarında `--extract` ASLA kullanılmaz.** PDF'ten yeniden
  çıkarır ve elle yapılmış bütün düzeltmeleri siler.
- ⛔ **`.passages.jsonl` elle düzenlenmez.** Üretilen dosyadır; bir sonraki
  build'de üzerine yazılır. Düzeltme her zaman `pNNN.txt` üzerinde yapılır.
  (İstisna: `review-passages.mjs`, metne dokunmadan yalnızca `review`
  alanını chunkIndex bazlı günceller — bu "elle düzenleme" sayılmaz.)
- ⛔ **`verified/` dizini silinmez.** PDF'ler gitignore'da (`docs/**/*.pdf`),
  yani `verified/` bu kaynakların tek geri döndürülemez kopyasıdır.
- ⛔ **Sayfa dosyası silinmez, boşaltılır.**
- ⛔ **İslami içerik yazılmaz.** Sadece sayfada yazan aktarılır.
- ⚠️ Prune'suz seed, kısalan kaynaklarda öksüz kayıt bırakır.

---

## İlgili dosyalar

| Dosya | İşi |
|---|---|
| `docs/kaynaklar/manifest.json` | kaynak kayıt defteri |
| `docs/kaynaklar/verified/<id>/pNNN.txt` | doğrulanmış sayfa metinleri (Yol B) |
| `docs/kaynaklar/<id>.passages.jsonl` | üretilen pasajlar |
| `apps/api/scripts/build-passages-from-verified.mjs` | sayfa → jsonl |
| `apps/api/scripts/seed-source-passages.mjs` | `--extract` / `--seed` |
| `apps/api/scripts/review-passages.mjs` | rapor üretimi + `review` alanı güncelleme |
| `apps/api/scripts/prune-stale-source-passages.mjs` | bayat kayıt temizliği |
| `docs/kaynaklar/<id>.review-subset.md` | `--report` çıktısı, gözden geçirme raporu |
| `apps/api/scripts/lib/chunking.mjs` | chunk kuralları (800–1000 karakter, 150 örtüşme) + `stripArabicScript` (`--strip-arabic`) + `classifyHeading`/`stripSingleTrailingColon` (`--heading-colon`) |
| `docs/ai-mimari.md` | `source_passages` korpusunun AI Rehber ve AI Sohbet tarafından nasıl tüketildiği (retrieval, skor eşiği, mimari) |

> **Not (hibrit arama):** `source_passages_text_index` full-text index'i
> `dynamic: false` sabit alan listesiyle tanımlıdır (`text`,
> `sectionHeading`, `sourceTitle`, `sourceId`) — yeni bir kaynak eklemek
> bu index'i etkilemez, ekstra bir adım GEREKMEZ (bkz.
> `docs/ai-mimari.md` §6).
