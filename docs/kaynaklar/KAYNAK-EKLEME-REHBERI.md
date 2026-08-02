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
**5. bölüme** geç.

> Üretilen jsonl'de `review` alanı vardır; yalnızca `approved` olan pasajlar
> seed edilir. Gözden geçirme yapıp onaylamak gerekir.

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
| `apps/api/scripts/prune-stale-source-passages.mjs` | bayat kayıt temizliği |
| `apps/api/scripts/lib/chunking.mjs` | chunk kuralları (800–1000 karakter, 150 örtüşme) |
