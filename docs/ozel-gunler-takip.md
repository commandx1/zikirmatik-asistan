# İslami Özel Günler — Uygulama Takip Listesi

Kaynak: `docs/müslümanlık-özel-günler.pdf`  
Mevcut özel gün sayısı: **75** | Benzersiz dhikrItem: **514**

---

## Hicri takvim tabanlı tarih modeli (2026-09)

Özel gün veri dosyaları (`apps/api/scripts/data/*.mjs`) artık `date`/
`hijriDate`/yıl ekli `eventKey` alanlarını DOĞRUDAN taşımaz. Bunun yerine her
`specialDays` girişi bir **hicri tanım** taşır:

- `hijri: { month: 'recep', day: 27, night: true }` — sabit hicri gün.
  `night: true` Diyanet kandil kuralını uygular (`date = ayBaşlangıcı + gün − 2`);
  yoksa gündüz kuralı (`date = ayBaşlangıcı + gün − 1`).
- `hijriRule: { type: 'first-weekday-on-or-after' | 'last-weekday-on-or-before-month-end', month, weekday }`
  — haftanın gününe bağlı olaylar (Regaib: Recep'in ilk Perşembesi; Safer'in
  ilk/son Çarşambası).
- `eventFamily: 'mirac-kandili'` — olayın ailesi; yıl eki İÇERMEZ.
- `onlyHijriYears`/`excludeHijriYears` (opsiyonel) — bir ailenin içeriği
  yıllar arasında değiştiyse (örn. bir olayın eski sürümü sade, yeni sürümü
  makale+practices ile zenginleştirilmiş), her sürüm ayrı bir şablon olarak
  kalır ve hangi hicri yıl(lar)a uygulanacağı bununla sınırlanır — içerik
  ASLA birleştirilip yeniden yazılmaz.

Tüm hicri ay başlangıçları TEK bir tabloda toplanır:
`apps/api/scripts/data/hijri-calendar.mjs` → `HIJRI_MONTH_STARTS` (hicri yıl
→ ay → miladi tarih, Diyanet resmi "Dini Günler Listesi" kaynaklı). Aynı
dosyada doğrulama için `OFFICIAL_DIYANET_DATES` (Diyanet'in yayınladığı
kandil/bayram tarihleri) ve türetim yardımcıları (`gregorianForHijri`,
`firstWeekdayOnOrAfter`, `lastWeekdayOnOrBefore`, `hijriDateLabel` vb.) bulunur.

**Seed zamanında açılım:** `scripts/lib/special-day-seed.mjs`'deki
`expandSpecialDays` her şablonu `HIJRI_MONTH_STARTS`'taki bilinen HER hicri
yıl için somut bir `{date, hijriDate, eventKey}` kaydına çözer. Ay başlangıcı
`null` olan yıllar atlanır (dry-run raporunda listelenir). `eventKey`, aile
zaten canlıysa (`EVENT_FAMILY_KEY_OVERRIDES`) eski/miladi-yıl-ekli biçimini
korur (mobil derin link/push kırılmasın); yeni yıllar için çakışmasız
`<family>-<hicriYıl>` biçimini kullanır (miladi yıl eki bazı ailelerde iki
farklı hicri yılı aynı miladi yıla düşürüp çakışabildiği için hicri yıl
tercih edilir).

**Upsert anahtarı** `{type, eventKey, dayIndex}` (dayIndex yoksa `name.tr`
ile) — `date` DAHİL DEĞİLDİR, böylece takvim tablosundaki bir düzeltme var
olan kaydı yerinde günceller, kopya oluşturmaz.

**Yıllık bakım:** yeni bir hicri yıl geldiğinde SADECE
`hijri-calendar.mjs`'e yeni bir `HIJRI_MONTH_STARTS` girişi eklenir; olay
veri dosyalarına (mevlidKandili.mjs vb.) dokunulmaz.

**Karşılaştırma/doğrulama araçları:**
- `node scripts/seed-special-days.mjs --dry-run` — DB'ye yazmadan tüm
  ailelerin bilinen hicri yıllar için açılımını listeler.
- `node scripts/report-special-days-diff.mjs` — DB'deki mevcut kayıtlarla
  yeni açılımı karşılaştırır (salt-okunur, yalnız `find`).
- Testler: `apps/api/scripts/lib/hijri-calendar.test.mjs`,
  `apps/api/scripts/lib/special-day-seed.test.mjs`.

---

## ✅ Tamamlananlar

### Gündelik / Haftalık
- [x] **Sabah Zikirleri** — `sabahZikirleri.mjs`
- [x] **Akşam Zikirleri** — `aksamZikirleri.mjs`

### Muharrem
- [x] **Hicri Yılbaşı** (1 Muharrem — 2026-06-16) — `muharremIlkOn.mjs`
- [x] **Muharrem İlk 10 Gün** (2–9 Muharrem) — `muharremIlkOn.mjs`
- [x] **Aşure Günü** (10 Muharrem — 2026-06-25) — `muharremIlkOn.mjs` + `ASURE_DUASI`, `HASBIYALLAH_VEKIL`, `SUBHANALLAHI_MIZAN`, `ASURE_ENBIYA_DUASI`, `FATIHA_SURESI`

### Rebîulevvel
- [x] **Mevlid Kandili** (12 Rebîulevvel — 2026-08-24) — `mevlidKandili.mjs`
- [x] **Kutlu Doğum Haftası** (2026-08-20..26) — `mevlidHaftasi.mjs`

### Recep — Üç Aylar
- [x] **Üç Ayların İlk Gecesi** (1 Recep — 2025-12-21) — `ucAylarBaslangic.mjs`
- [x] **Recep Ayı — 1. Faz (Hayy-Kayyûm)** (1–10 Recep) — `recepAyi.mjs`
- [x] **Recep Ayı — 2. Faz (Ehad-Samed)** (11–20 Recep) — `recepAyi.mjs`
- [x] **Recep Ayı — 3. Faz (Ğafûr-Rahîm)** (21–30 Recep) — `recepAyi.mjs`
- [x] **Regâib Kandili** (Recep ilk Cuma gecesi — 2025-12-25) — `regaibKandili.mjs`
- [x] **Miraç Kandili** (27 Recep — 2026-01-15) — `miracKandili.mjs`

### Şaban
- [x] **Şaban Ayı — 1. Faz (Latîf)** (1–10 Şaban — 2026-01-20) — `sabanAyi.mjs`
- [x] **Şaban Ayı — 2. Faz (Rezzâk)** (11–20 Şaban — 2026-01-30) — `sabanAyi.mjs`
- [x] **Şaban Ayı — 3. Faz (Azîz)** (21–30 Şaban — 2026-02-09) — `sabanAyi.mjs`
- [x] **Berat Kandili** (15 Şaban — 2026-02-02) — `beratKandili.mjs`

### Ramazan
- [x] **Ramazan Girişi** (1 Ramazan — 2026-02-19) — `ramazanGirisi.mjs`
- [x] **Ramazan Günleri 1–29** — `ramazanGunleri.mjs`
- [x] **Kadir Gecesi** (27 Ramazan — 2026-03-16) — `kadirGecesi.mjs`
- [x] **Ramazan Bayramı** (1–3 Şevval — 2026-03-20..22) — `ramazanBayrami.mjs`

### Zilkade
- [x] **Zilkade Ayı Girişi** (1 Zilkade — 2026-04-18) — `zilkadeAyi.mjs`

### Zilhicce
- [x] **Zilhicce 1–8. Günler** — `zilhicceIlkOn.mjs`
- [x] **Arefe Günü** (9 Zilhicce — 2026-05-26) — `kurbanBayrami.mjs`
- [x] **Kurban Bayramı + Teşrik Günleri** (10–13 Zilhicce — 2026-05-27..30) — `kurbanBayrami.mjs`

---

## ❌ Eksikler / Yapılacaklar

### Haftalık Periyodik
- [ ] **Cuma Günü** — haftalık bayram; Yasin/Duhan okuma, 1000 salavat; ayrı dataset veya `cuma.mjs`
- [ ] **Pazartesi ve Perşembe** — amellerin arz edildiği günler; oruç, istiğfar; `pazartesiPersembe.mjs`

### Aylık Periyodik
- [x] **Eyyâm-ı Biyd** (her ayın 13–14–15. günleri) — `eyyamibiyd.mjs` + `TEVHID_SIRK_UZAKLASMA`; tüm 12 ay 1448 specialDays eklendi
- [x] **Eyyâm-ı Sud** (her ayın 28–29–30. günleri) — `eyyamisud.mjs` + `ISTIGFAR`; tüm 12 ay 1448 specialDays eklendi

### Safer Ayı
- [x] **Safer Girişi** (1 Safer 1448 — 2026-07-15) — `saferAyi.mjs`; ilk gece namazı + `SAFER_GIRISI_DUASI` (100x/gün ilk 15 gün)
- [x] **Safer İlk Çarşambası** (1 Safer 1448 = 2026-07-15, aynı gece) — `saferAyi.mjs`; teheccüd namazı + `BISMILLAH_LA_YEDURRU`
- [x] **Safer Son Çarşambası** (29 Safer 1448 — 2026-08-12) — `saferAyi.mjs`; selam ayetleri şifa suyu ritüeli + `SAFER_MUAFAZA_DUASI`

### Şaban
- [ ] **Şaban'ın 27. Gecesi** — 2 rekat namaz + secdede İhlas/Felak/Nas + 100 istiğfar + havkale; ayrı entry olarak `sabanAyi.mjs`'e ekle

### Ramazan
- [ ] **Ramazan Bayramı Gecesi** (son gece — 2026-03-19) — zikir ve istiğfarla ihya; `ramazanBayrami.mjs`'e ekle

### Şevval
- [x] **Şevval Ayı** (6 gün nafile oruç) — ayrı dataset yok; Şevval orucu + tekbir bilgisi `ramazanBayrami.mjs` specialDay description'larına eklendi (Sahih Müslim 1164)

### Zilhicce
- [ ] **Kurban Bayramı Gecesi** (9→10 Zilhicce arası gece) — tekbir, hamd ve ibadetle ihya; `zilhicceIlkOn.mjs` veya `kurbanBayrami.mjs`'e ekle
- [ ] **Gadir-i Hum Günü** (18 Zilhicce — 2026-06-04) — oruç, gusül, Hz. Ali ziyareti (Eminullah duası), 2 rekat namaz, 100 şükür secdesi, Nudbe duası; `gadiriHum.mjs`

---

## Notlar

- **Teşrik Günleri (10–13 Zilhicce):** `kurbanBayrami.mjs` içinde mevcut, ayrı entry gerekmez.
- **Şaban 27. Gecesi:** `sabanAyi.mjs`'de `SABAN_SALAVATI` tanımlı ama 3. faz (21. gün) içinde eriyip gidiyor; ayrı `specialDay` girişi önerilir.
- **Eyyâm-ı Biyd / Sud:** Hicri takvimde her ay tekrar eden olaylar — `date` alanına birkaç örnek ay için somut tarih koymak gerekir.
- **Cuma / Pazartesi / Perşembe:** Recurring (tekrarlayan) yapıda modellemek gerekebilir; seed sistemi buna hazır değilse veri girişi sembolik tutulabilir.

## Yıllık bakım kontrol listesi (2026-09-13)

1. Diyanet'in bir sonraki iki yılın "Dini Günler Listesi" sayfasından (ay başlangıçları dahil) yeni hicri yılın 12
   ay başlangıcını `apps/api/scripts/data/hijri-calendar.mjs` → `HIJRI_MONTH_STARTS`'a ekle (kaynak URL'sini yaz).
   `pnpm --filter api test:scripts` içindeki kapsama testi son bilinen ay 180 günden yakınsa FAIL eder; API de
   açılışta `special_days` ufku 180 günün altındaysa `[special-days] veri ufku yetersiz` uyarısı loglar.
2. `node scripts/seed-special-days.mjs --dry-run --deactivate-orphans` → rapor; gerçek seed: `node scripts/seed-special-days.mjs --all --deactivate-orphans`.
   Orphan = dataset'te artık üretilmeyen aktif kayıt (`LEGACY_EVENT_KEYS`); silinmez, `isActive:false` olur.
   `SPECIAL_DAYS_SEED_MIN_DATE` (2025-12-21) altındaki kayıtlar üretilmez (`--include-history` açar).
3. `pnpm --filter api gen:special-days-mobile` ile mobil `special-days-dataset.ts` yeniden üretilir (18 aylık
   pencere, başlık olaylar; tarih = sunucu `date`, Diyanet günü). `--check` ile güncellik doğrulanır.
4. Vird şablonları `sourceEventKey` ile `special_days`'ten çapa aldığı için ek işlem gerekmez (bkz.
   `docs/vird-programi.md`).
5. `name`/`description` içindeki `{hijriYear}`/`{gregorianYear}` yer tutucuları seed'de doldurulur; makale ve
   uygulama metinlerine dokunulmaz (kullanıcı içeriği).
