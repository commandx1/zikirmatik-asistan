// Namaz vakti hesabı — `adhan` kütüphanesi (zaten kurulu, bkz. package.json)
// üzerine ince bir sarmalayıcı. Türkiye Diyanet hesaplama yöntemi kullanılır.
//
// ÖNEMLİ (tarih/saat dilimi): adhan, verilen `date` parametresinin YEREL
// (device-local) yıl/ay/gün bileşenlerini (date.getFullYear/getMonth/getDate)
// okuyarak o takvim gününü hesaplar; döndürdüğü Date'ler ise doğru mutlak ana
// karşılık gelir (UTC olarak da okunabilir). Bu yüzden `date`'i HER ZAMAN
// yerel bileşenlerle üret (`new Date(y, m - 1, d)` ya da düzden `new Date()`)
// — ISO string parse etme veya `Date.UTC(...)` kullanma: cihazın saat dilimi
// negatif (UTC'nin batısı) olduğunda bir gün kayması olabilir. Bu, Türkiye'de
// (tek dilim, UTC+3, DST yok) çalışan bir cihaz için sorun değildir; pratikte
// bu uygulamanın hedef kullanıcı kitlesi budur (bkz. README).
//
// FAZ C: il seçimi (data/tr-provinces.ts) kaldırıldı — vakitler artık
// yalnızca GPS koordinatından (`reminderPrefs.coords`, bkz. ../types.ts)
// hesaplanır. Konum yoksa/izin reddedildiyse `resolvePrayerTimes` sabit bir
// saat tablosuna düşer (bkz. aşağı).
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";

export type PrayerTimesResult = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
};

export type PrayerTimesCoordinates = { lat: number; lng: number };

/** `coords` doğrudan `{lat, lng}` koordinatıdır (GPS). */
export function getPrayerTimes(coords: PrayerTimesCoordinates, date: Date): PrayerTimesResult {
  const coordinates = new Coordinates(coords.lat, coords.lng);
  const params = CalculationMethod.Turkey();
  const times = new PrayerTimes(coordinates, date, params);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha
  };
}

/** Sabit saat tablosu — konum yokken (izin reddedildi/henüz alınmadı)
 * kullanılan yaklaşık vakitler. `date`'in yerel takvim gününe göre kurulur
 * (bkz. dosya başı notu). Zamanlama ofsetleri (morning=fajr+30 vb., bkz.
 * vird-reminder-notifications.ts) DEĞİŞMEZ — bu tablo yalnızca fajr/dhuhr/
 * maghrib/isha'ya makul sabit değerler verir (07:00/13:00/19:00/22:00 tetik
 * saatleriyle sonuçlanır). */
function fixedPrayerTimes(date: Date): PrayerTimesResult {
  const at = (hours: number, minutes: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);

  return {
    fajr: at(6, 30),
    sunrise: at(8, 0),
    dhuhr: at(12, 45),
    asr: at(16, 15),
    maghrib: at(18, 30),
    isha: at(21, 0)
  };
}

/** Koordinat varsa gerçek adhan vakitlerini, yoksa sabit tabloyu döner. */
export function resolvePrayerTimes(coords: PrayerTimesCoordinates | null, date: Date): PrayerTimesResult {
  if (!coords) {
    return fixedPrayerTimes(date);
  }
  return getPrayerTimes(coords, date);
}
