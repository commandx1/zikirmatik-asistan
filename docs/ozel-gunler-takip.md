# İslami Özel Günler — Uygulama Takip Listesi

Kaynak: `docs/müslümanlık-özel-günler.pdf`  
Mevcut özel gün sayısı: **75** | Benzersiz dhikrItem: **514**

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
