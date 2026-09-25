# Pazarlama planı — 2026-09-25

Sıfır bütçe, tek kurucu, haftada 5–8 saat pazarlama. Yatırım yok; yatırımcı sunumundaki ücretli edinim planı geçersiz.

## Hedef

- **Hedef metrik:** 7. gün elde tutma (D7) ≥ %25.
- **Sonuç metrik:** 90 günde ilk 50 ödeyen Premium abone.
- Kurulum sayısı hedef değil.

## Ölçüm

- Veri kaynağı: `devices.createdAt/lastSeenAt` (kurulum ve son görülme, her açılışta güncellenir) ve `app_events` (paywall_viewed, purchase_completed, circle_*, vird_*…). `app_opened` ve `dhikr_completed` 2026-09-25'e kadar hiç gönderilmiyordu; aynı gün eklendi, o tarihten öncesi için elde tutma yalnız lastSeenAt'e dayanır.
- Eksik olan okuma katmanı: haftada bir çalıştırılan tek Mongo aggregation betiği. Çıktı: kurulum kohortu → D1/D7/D30; huni kurulum → ilk zikir → paywall → satın alma.
- Mağaza sayfası dönüşümü (görüntüleme → kurulum): Play Console.
- Kanal atfı: her platformun bio linki UTM'li doğrudan Play linki (`&referrer=utm_source%3Dtiktok` vb.); Play Console edinim raporu ayırır. Web sitesi araya girmez.
- PostHog vb. yok; betik yetmezse tekrar bakılır.

## Konumlandırma

- **Arama için:** zikirmatik / zikir sayacı / vird.
- **İkna için:** reklamsız + Zikir Halkası (ailenle ortak hedef, tek toplam).
- **AI:** manşette değil, güven satırı olarak ("her öneri kitap ve sayfa referanslı, fetva vermez"). Kısa açıklamada ve 3–4. ekran görüntüsünde görünür.
- **Play başlığı:** `Zikirmatik: Zikir Sayacı, Vird` (30 karakter). "AI" başlıktan çıkar. Uygulama içi ad ve site aynı ada çekilir.
- Halka başlığa girmez (arama terimi değil); kısa açıklama ve ilk 2 görselde yaşar.
- Play mağaza deneyleriyle görsel seti A/B test edilir (AI vurgulu / vurgusuz).

## Kanal

- **Ana kanal:** yüzsüz kısa video; aynı video TikTok + Instagram Reels + YouTube Shorts.
- **Format:** karma, 20–35 sn, tek şablon: ilk 3 sn metin kancası → gerçek uygulama ekran kaydı ("uygulamada şöyle çekersin") → kaynak satırı + indirme çağrısı.
- **Kalite kuralı (kullanıcı şartı):** baştan savma video yok. Sayı kaliteyi eziyorsa sayı düşer. Marka kiti sabit (uygulama tema renkleri, tek yazı tipi, tek hareket dili, tek ses yatağı).
- **Yapım:** mevcut Remotion projesi (`apps/promo-video`) içine ikinci kompozisyon. Ekran kayıtları simülatör/emülatörden, temiz durum çubuğu, 60 fps. İlk 3 pilot elle; pilotlar kullanıcı onayından geçmeden üretime geçilmez. Onaydan sonra tekrar eden sahneler Detox ile senaryolu kayda alınır.
- **Sıklık:** ilk 3 hafta 3 pilot, sonra haftada 2.
- **Konu takvimi:** uygulamadaki özel günler (kandiller, üç aylar, hicri günler) + haftalık Cuma döngüsü. Hadis/ayet/fazilet metinleri kullanıcı yazar, Claude yazmaz.
- **Park edilen:** birebir ulaşım (küçük içerik üreticileri, hocalar; karşılığında Premium kodu) → ilk 20 videodan sonra tekrar değerlendir. Topluluk/grup kanalı yok.

## Ürün değişiklikleri (büyüme ve elde tutma)

1. **Giriş duvarı kalkar.** İlk açılış doğrudan sayaç, herkes otomatik misafir. Giriş ekranı silinmez, kapı olmaktan çıkar: profilde "Giriş yap / Hesabını koru", ayrıca değer anlarında (halkaya katılma, yedekleme, 7 günlük seri). Çıkışta kullanıcı yeni misafir olarak sayaca döner. Misafir → üye taşıma akışı mevcut.
2. **Puan isteme:** Android yerleşik uygulama içi puanlama; tetikleyiciler 7 günlük seri, ilk vird tamamlama, halka hedefi. Tek sefer; kapatırsa bir daha sorulmaz.
3. **Ücretsiz halka:** ücretsiz kullanıcı aynı anda en fazla 1 tamamlanmamış halka kurabilir, kurucu dahil 5 üye. Premium: sınırsız halka/üye + halka istatistikleri. İkinci halka denemesi doğal paywall. (17 Eylül "kur=premium" kararını değiştirir.)
4. **7. gün teklifi:** kilitli özellik paywall'ları kalır (mevcut), artı 7. günde tek seferlik proaktif yıllık plan teklifi ("ayda ~40 TL"). Yıllık plan öne.
5. **Ramazan teklifi:** yıllık planda Play tanıtım teklifi, Berat → Kadir Gecesi arası (ör. 479,99 → 349,99 ilk yıl). RevenueCat gösterir, kod değişmez. İndirim oranı Ocak'ta Regaib/Miraç paywall dönüşümüne göre belirlenir.
6. **iOS:** Apple hesabı tetikleyici bazlı: Play'den ilk 10 yıllık abone geldiğinde açılır (≈ 99 USD). Ramazan'a yetişmesi hedeflenir.

## Sıra (Regaib 10 Aralık 2026'ya kadar, 11 hafta)

1. Giriş duvarı kaldırma + puan isteme
2. Ücretsiz halka + 7. gün yıllık teklifi
3. Play başlığı ve görsel seti + haftalık KPI betiği
4. Videolar: 3 pilot, sonra haftada 2
5. iOS (tetikleyici gerçekleşince)

## Takvim (2027 tarihleri yaklaşık, Diyanet listesiyle doğrulanacak)

| Tarih | Olay | Not |
|---|---|---|
| 2026-12-10 | Regaib, üç ayların başı | ilk organik dalga, prova |
| 2027-01-04 | Miraç | |
| 2027-01-22 | Berat | Ramazan teklifi başlar |
| 2027-02-08 | Ramazan başı | kategori zirvesi |
| 2027-03-06 | Kadir Gecesi | teklif biter |

## Haftalık ritüel (Cuma bloğu)

1. KPI betiği çalıştır, D7 ve huniyi not et.
2. Play Console: mağaza dönüşümü, kaynak bazlı kurulum, puan/yorumlar; yorumlara cevap.
3. Video: 2 adet üret ve yayınla (kalite kuralı).
4. Bir cümle: bu hafta ne değişti, gelecek hafta tek öncelik ne.
