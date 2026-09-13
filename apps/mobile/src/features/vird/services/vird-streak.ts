// Yerel (cihaz-içi) vird serisi. Sunucudaki authoritative seri her zaman
// GET /v1/vird/today yanıtındaki `virdStreak` alanıdır (bkz. vird-api-client.ts
// fetchVirdToday) — bu dosya yalnızca ÇEVRİMDIŞI/misafir senaryosunda ya da
// sunucu yanıtı gelmeden önce gösterilecek bir YAKLAŞIK değer üretir.
//
// Basitleştirme (bilerek, sunucudaki VirdProgressService.getToday'in "şimdilik
// yalnızca en son güncellenen TEK programı döner" notuyla aynı kapsamda):
// dayProgress store alanı programa göre ayrışmadığından bu hesap, o tarihte
// AKTİF olan tek bir programın günlerini tamamlanmış sayar. Kullanıcı aktif
// programı değiştirirse (premium, birden fazla aktif program) yerel seri bu
// yüzden yalnızca yaklaşık olabilir; kesin değer her zaman sunucudan gelir.
import { calculateLocalCompletionStreak, type LocalCompletionStreak } from "../../home/services/local-streak";
import { dayIndexFor, expectedItemsForDay, isDayComplete, type VirdDayProgramLike } from "./vird-day";
import type { VirdDayProgressByDate } from "../types";

export type VirdCompletionStreak = LocalCompletionStreak;

/**
 * dayProgress store'undaki tüm tarih anahtarlarını (bkz. vird-store.ts
 * dayProgress) programın gün algoritmasıyla (dayIndexFor/expectedItemsForDay/
 * isDayComplete) süzer, o günün TÜM beklenen item'ları tamamlanmış olan
 * tarihleri çıkarır ve local-streak.ts'teki genel seri hesabını bu tarih
 * listesiyle çalıştırır.
 */
export function calculateVirdStreak(
  program: VirdDayProgramLike,
  dayProgress: VirdDayProgressByDate,
  today: Date = new Date()
): VirdCompletionStreak {
  const completedDateKeys = Object.keys(dayProgress).filter((dateKey) => {
    const dayIndex = dayIndexFor(program, dateKey);
    const expected = expectedItemsForDay(program, dayIndex);
    return isDayComplete(expected, dayProgress[dateKey]);
  });

  return calculateLocalCompletionStreak(completedDateKeys, today);
}
