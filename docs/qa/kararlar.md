# QA turu — kullanıcı kararları (2026-10-07)

Katalogdaki ❓ soruların cevapları. Testler bu kararlara göre yazılır.

- **A-02** Tek kayıtta en fazla 100.000 sayım; aşarsa 400 (halka hilesi + hatalı istemci koruması).
- **A-03** Halka katkısı yalnız kuruluş günü … bugün(+1 TZ payı) arası tarihlere; dışı 400.
- **A-09** BILLING_ISSUE'da premium düşmez; yalnız EXPIRATION'da düşer.
- **A-11** Sohbette aynı istemci mesaj anahtarıyla tekrar gönderim ücretsiz; ilk cevap döner.
- **A-12** Gelecek tarihli kayıt en fazla bugün +1 gün; ilerisi 400.
- **A-13** Tamamlandı = sunucuda count ≥ targetCount; istemci bayrağı hedef altındaysa yok sayılır.
- **A-20** Refresh token tek kullanımlık (rotation), çıkışta iptal; DB'de tutulur.
- **A-21** Sunucu varsayılan ad yazmaz (halka adı, "Başlık N"); alan boş, uygulama kendi dilinde gösterir; istatistikte zikrin iki dilli adı döner.
- **A-23** Bitişi geçmiş vird programı başlatılamaz; "süresi doldu, kopyalayıp yeniden başlat" hatası.
- **A-24** Manuel vird fazları AI kuralıyla: 1. günden başlar, boşluk/çakışma yok; aksi 400 + editör uyarısı.
- **M-04** Sayım 0'da Kaydet pasif, uyarı modalı yok; sunucu 0'ın tamamlanmış kaydı ezmesini reddeder.
- **M-05** Sıfırla geri alma noktasını da siler ("geri alınamaz" doğru olur).
- **M-06** AI önerilen hedef "Sıfırdan başla"da uygulanır; "Kaldığı yerden"de mevcut hedef kalır.
- **M-07** Kredi her zaman sunucudaki gerçek bakiye; ön kontrol bakiyeye bakar (premium dahil).
- **M-09** EN kullanıcının halka linki `/en/halka/KOD`.
- **M-11** Halka hedefe ulaşınca sayaç anında yerel kilit + son gönderim.
- **M-12** Halka sayacı ilk detay gelene kadar pasif.
- **M-14** Misafirde "Hesabı Sil" gizli.
- **M-22** Vird düzenleme durumu değiştirmez; ayrı "Aktifleştir".
- **M-23** Vird günlük ilerlemesi program kimliğine bağlı.
- **M-24** Vird ve halka seansı sayımı dokunuş anının gününe yazar.
- **A-01** Halka bittikten sonra gelen katkı **süresiz kabul edilir ve toplama eklenir** (hedef aşılabilir). (Kullanıcı önerinin tersini seçti.)
- **A-04** Kurucu hesabını silerse kuruculuk en eski aktif üyeye geçer (push "yöneticisi oldun"); üye yoksa halka kapanır. Devralanın ücretsiz limiti/200 üye sınırı aynen korunur.
- **A-05** Silinen üyenin katkısı halka toplamında kalır.
- **A-06** "X katıldı" bildirimi aynı kişi için halka başına bir kez.
- **A-07 + M-13** Premium bitince mevcut programlar/halkalar korunur; yeni aktifleştirme/yeni halka engellenir; vird hatırlatmaları durur; tema ücretsiz varsayılana döner.
- **A-08** Premium bitince kalan aylık AI kredisi ay sonuna kadar kullanılabilir; aynı ay yeniden abonelikte kalan hak geri gelir.
- **A-10** İade: abonelikte RevenueCat EXPIRATION beklenir; kredi paketi iadesinde kalan bakiyeden düşülür (min 0).
- **A-14** Halka ve vird zikirleri seri/toplam/rozetlere sayılır; istatistik kaynak dağılımına "Halka" eklenir.
- **A-15** Rozetler asla geri alınmaz; kazanılan en uzun seri ayrı saklanır.
- **A-16** Ücretsiz günlük kredi UTC gece yarısı yenilenir (değişmez).
- **A-17** Haftalık özet push'u "seri hatırlatma" tercihine bağlı.
- **A-18** Kandil arifesi/günü bildirimi cihazın kayıtlı saat dilimine göre.
- **A-19** Halka bitişi kurucunun saat dilimi (değişmez).
- **A-22** Özel günler GET uçları misafire açık.
- **M-01** Yeni günde sayaç 0'dan başlar; dünkü kaydedilmemiş sayım için bir kez "kaydet / at" sorulur.
- **M-02 + M-03** Misafir Kaydet → "Kalıcı kaydetmek için giriş yap" istemi, ilerleme cihazda kalır; misafirde yerel kayıt "kaydedildi" sayılır, uyarı modalı yalnız üyede.
- **M-08** Cuma/kandil yerel bildirimleri ana anahtardan bağımsız **kalır** (bugünkü davranış; kullanıcı önerinin tersini seçti).
- **M-10** Premium sayfası halka maddesi: "10 halka, 200 üye".
- **M-15** Çıkışta onay sorulur.
- **M-19** Misafirin serbest moddaki kaydedilmemiş sayımı (>0) girişte "Serbest" adlı kişisel zikir olarak taşınır.
- **M-21** Seri kuralı misafir+üye tek: **o gün sayımı > 0 olan kayıt varsa seri sürer** (hedef tamamlama şartı kalkar). Sunucu seri hesabı + seri rozetleri buna göre değişir; "tamamlandı" (A-13) istatistik/hedef için kalır. Not: B2 düzeltmesindeki `lastCompletedDate` bu kurala göre "sayımı > 0 olan son gün"e çevrilmeli.
- **M-25** Kandil kartı / Ramazan Modu ölü çeviri anahtarları silinir.

## Ayrı iş (QA turu dışı, sonra ele alınacak)
- **M-16** Satın alımları geri yükle düğmesi.
- **M-17** Girişten sonra tetikleyen eylemin (AI gönder, halkaya katıl) devam etmesi.
- **M-18** Misafir verisi aktarılamazsa uyarı bandı.
- **M-20** Çevrimdışı kayıt kuyruğu (veri kaybını önler — ayrı işler içinde öncelikli).
- **A-01 ek** Kurucunun elle kapattığı halka geç katkıyı reddeder; süre dolumu/hedef sonrası kabul (A-01).
- **B-11** Bildirim izni ilk anlamlı anda (ilk zikir kaydı ya da vird hatırlatıcısı açılınca) önce uygulama içi açıklama kartı, "Evet" → sistem diyaloğu; ilk açılışta doğrudan sistem diyaloğu yok.
- **MOB-AIR-04** AI Rehber metin kutusu boş/yalnız boşlukken Gönder pasif; "genel öneri" yok. (Sunucu boş freeText'i özel gün/bildirim kaynaklı öneriler için kabul etmeye devam eder.)
