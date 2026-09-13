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
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import { findProvinceByKey } from "../data/tr-provinces";

export type PrayerTimesResult = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
};

export type PrayerTimesCoordinates = { lat: number; lng: number };
export type PrayerTimesLocation = string | PrayerTimesCoordinates;

export class PrayerTimesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrayerTimesError";
  }
}

/**
 * `location` bir il anahtarı (bkz. data/tr-provinces.ts TrProvince.key,
 * ör. "istanbul") ya da doğrudan `{lat, lng}` koordinatı olabilir.
 * Bilinmeyen bir il anahtarı verilirse PrayerTimesError fırlatılır.
 */
export function getPrayerTimes(location: PrayerTimesLocation, date: Date): PrayerTimesResult {
  const coordinates = resolveCoordinates(location);
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

function resolveCoordinates(location: PrayerTimesLocation): Coordinates {
  if (typeof location === "string") {
    const province = findProvinceByKey(location);
    if (!province) {
      throw new PrayerTimesError(`Bilinmeyen il anahtarı: ${location}`);
    }
    return new Coordinates(province.lat, province.lng);
  }

  return new Coordinates(location.lat, location.lng);
}
