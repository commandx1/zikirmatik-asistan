# Detox TODO — QA turu (F4)

Kaynak: Dalga 2 mobil ajan raporları (2160371, 3b0f21f) + katalog "Önerilen Detox akışları" (davranis-katalogu.md Bölüm 2).
testID tek kaynak: `apps/mobile/src/test-ids.ts`. Kurallar: Android tam süit, iOS yalnız `@smoke`.

## Hesaplar ve tetikleyiciler
- Ücretsiz ve premium hesap: `apps/api/scripts/e2e-seed.mjs --premium <sub>`; halka katılımı için 2. hesap API test-token ile.
- AI hata modları: istek metnine `[mock:error503]`, `[mock:timeout]`, `[mock:bilgi]` (canlı sunucuda çalışır).
- Kredi 0 / günlük limit: seed ile cüzdanı sıfırla.
- Zorunlu güncelleme: API'yi `APP_MIN_VERSION` ile yeniden başlat.
- Çevrimdışı (yalnız Android): `adb shell cmd connectivity airplane-mode enable|disable`.
- Gün dönümü / gece yarısı: emülatör saat dilimi/saat (`adb shell` ile) veya seed'de dünkü tarihli durum.

## Sayaç ve misafir
- M-02: misafir 3 dokunuş → `home.save` → giriş istemi ("Kalıcı kaydetmek için giriş yap", `auth.promptConfirm`), sayım 3 kalır.
- M-04: sayım 0'da `home.save` pasif; 1 dokunuşta aktif.
- M-03: misafir kayıtlı zikirde geçişte uyarı yok; serbest modda sayım > 0 iken geçişte uyarı VAR.
- Üye geçiş modalı: `home.unsavedSaveContinue` / `unsavedDiscard` / `unsavedCancel`; 0'da modal yok.
- M-05: `home.reset` → `home.resetConfirm` → geçiş → "Kaydetmeden devam" → sayım 0 kalır.
- M-06: AI önerisinden "Sıfırdan başla" (`home.resumeFresh`) → hedef = önerilen; "Kaldığı yerden" (`home.resumeContinue`) → mevcut hedef.
- M-01: üye dünkü kaydedilmemiş sayım → `home.dayRolloverSave` / `home.dayRolloverDiscard`; Android geri tuşu modalı kapatmaz; misafirde sorusuz 0.
- B-49: serbest kaydet gönder çift dokunuş → tek kişisel zikir (`home.saveNameSubmit`).
- B-1: üye çevrimdışı Kaydet → `home.toast` hata, sayım korunur.
- M-19: misafir serbest sayım → giriş → Zikirlerim'de "Serbest".
- ESM: misafirde ertesi gün günlük Esma karşılaması çıkar.

## Bildirim
- B-11: ilk açılışta OS izin penceresi çıkmaz; ilk kayıttan sonra kart → `notifications.offerConfirm` OS penceresini açar, `offerDismiss` açmaz; ikinci kayıtta kart yok. (iOS @smoke)
- B-18: bildirimden soğuk açılış → rota navigatör hazır olunca açılır, çökme yok.

## Halka
- Kodla katılma (2. hesap), oturumda sayım → toplam artar (`circle.sessionCounter`, `circle.sessionCountLabel`).
- M-12: ilk detay gelmeden dokunuş sayılmaz. M-11: hedefe ulaşınca `circle.sessionLocked`.
- Kurucu kapatınca sayaç kilitlenir. Süresi dolmuş halkaya katıl → notActive mesajı, `circle.joinButton` pasif.
- Toplam hedefi aşabilir (geç katkı), ilerleme %100'de kalır.
- Çevrimdışı oturumda sayım kaybolmaz (Android uçak modu).
- B-35: ayrıl/kapat çevrimdışı → `circle.actionError`. B-36: bilinmeyen halka id derin bağlantısı → `circle.notFound`.
- Ücretsiz 1 aktif/5 üye limiti (6. üye → CIRCLE_FULL); ana sayfa kartından hub.
- EN dilde paylaş metni `/en/halka/KOD`.

## Vird
- M-22: duraklatılmış programı düzenle-kaydet → durum paused kalır; `vird.programToggle` ile aktifleştir.
- B-21: çakışma modalı "Değiştir ve başlat" tüm aktifleri duraklatır; B-22 premium sonrası otomatik aktifleşme.
- A-23: süresi dolmuş yolculuk → hata + `vird.programCloneRestart` → editör.
- A-24: editörde bozuk faz → uyarı.
- Şablondan kurulum; AI ile oluşturma (mock); B-20 AI "Vazgeç" taslak bırakmaz.
- M-24: gece yarısını geçen seans (cihaz saati) → sayım yeni güne.
- Premium bitince vird hatırlatmaları iptal (premium seed kaldır).

## AI
- MOB-AIR-04: boş girdide `aiGuide.sendDisabled`, yazınca `aiGuide.send`.
- B-23: Rehber/Sohbet/AI vird çift dokunuş → tek istek, tek kredi.
- `[mock:error503]` → hata ekranı, kredi düşmez; `[mock:timeout]` → spinner durur.
- Kredi 0 / günlük limit → premium sayfası açılır, yazılan metin girdide kalır.
- Sohbet listesi; `[mock:bilgi]` → kaynaklı cevap.

## Profil, premium, ayarlar
- M-15: `profile.logout` → onay modalı → çıkış → misafir ana sayfa.
- M-14: misafirde `profile.deleteAccount` yok. B-6: silme hatasında `profile.deleteError`, oturum korunur; başarıda misafir.
- B-15: `auth.google` çift dokunuş → tek istek.
- M-10: premium sayfasında "10 halka, 200 üye". M-07: premium hesapta gerçek kredi bakiyesi.
- Premium bitince premium tema → varsayılan.
- Dil TR→EN, yeniden başlatma sonrası kalıcı. (iOS @smoke) Tema/font.
- Özel günler misafirle liste + detay.
- Zorunlu güncelleme modalı.
- Kaynak dağılımında "Halka".

## iOS @smoke
Giriş (01), sayaç kaydet (02), premium sayfası, bildirim izni (B-11 kartı), dil değişimi, Keychain sil-kur (MOB-GIR-04).
