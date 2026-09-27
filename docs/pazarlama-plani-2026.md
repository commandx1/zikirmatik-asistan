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

1. ✅ 2026-09-25 Giriş duvarı kaldırma + puan isteme (commit da67831)
2. ✅ 2026-09-25 Ücretsiz halka (1 aktif, 5 üye) + 7. gün yıllık teklifi + süresi dolan oturum uyarısı
3. ✅ 2026-09-25 KPI betiği (`pnpm --filter api kpi:report --weeks 8`); Play başlığı/kısa açıklama taslağı store-assets/play-2026/store-listing-tr.md'de. Play Console'a giriş: yeni sürüm Play'e çıktıktan SONRA (metin "ilk halka ücretsiz" diyor).
4. Videolar: Video 1 sesli sürüm hazır (apps/promo-video/out/video-01-sesli.mp4, 24 sn, ElevenLabs "George", 5 cümle; sessiz sürüm out/video-01-sayarken-sasirma.mp4). Akış: senaryo → cümle başına TTS (scripts/tts.mjs, manifest public/audio/vo-01.json) → cümle süresine göre sahne → gerçek kayıt hız rampalı → kare/ses kontrolü → render. Açık: AI Rehber klibi (kullanıcı telefonundan, public/recordings/ai-rehber.mp4; gelene kadar yer tutucu kart), ses seçimi (George/River örnekleri public/audio/samples). Sıradaki: Vird ve Halka videoları (premium hesap ister). Müzik yok (telifsiz parça gerekirse kullanıcı verir).
5. iOS (tetikleyici gerçekleşince)

Kalan işler: yeni Android sürümü (expo-store-review yerel modül), sonra Play Console metin + görsel seti; Play mağaza deneyi (AI vurgulu/vurgusuz görseller); senaryolu Detox kaydı (pilot onayından sonra).

## Takvim (Diyanet 2026/2027 listeleriyle doğrulandı, 2026-09-25)

| Tarih | Olay | Not |
|---|---|---|
| 2026-12-10 Per | Regaib Kandili, üç ayların başı | ilk organik dalga, prova |
| 2027-01-04 Pzt | Miraç Kandili | |
| 2027-01-22 Cum | Berat Kandili | Ramazan teklifi başlar |
| 2027-02-08 Pzt | Ramazan başı | kategori zirvesi |
| 2027-03-05 Cum | Kadir Gecesi | teklif biter |
| 2027-03-09 Sal | Ramazan Bayramı (3 gün) | |
| 2027-05-16 Paz | Kurban Bayramı (4 gün) | ikinci dalga |
| 2027-08-13 Cum | Mevlid Kandili | |
| 2027-12-02 Per | Regaib 2027 | |

Kaynak: vakithesaplama.diyanet.gov.tr icerik 153 (2026) ve 154 (2027). Gece olayları Diyanet kuralıyla akşamı geceyi başlatan günün tarihindedir.

## Haftalık ritüel (Cuma bloğu)

1. KPI betiği çalıştır, D7 ve huniyi not et.
2. Play Console: mağaza dönüşümü, kaynak bazlı kurulum, puan/yorumlar; yorumlara cevap.
3. Video: 2 adet üret ve yayınla (kalite kuralı).
4. Bir cümle: bu hafta ne değişti, gelecek hafta tek öncelik ne.
