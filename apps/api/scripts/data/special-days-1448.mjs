/**
 * Premium vird şablonları (bkz. vird-template-seed.mjs: buildRamazanJourneyTemplate,
 * buildKandilJourneyTemplates) için 1448 hicri yılı özel gün `anchorDate`
 * sabitleri. Bu dosya yalnız TARİH içerir — yeni dini metin YAZILMAZ (bkz.
 * proje belleği: "İslami içerik kullanıcıya ait").
 *
 * Kaynak durumu (bugün: 2026-09-12):
 * - REGAIB_KANDILI_ANCHOR: repo verisi (apps/mobile/src/features/notifications/
 *   data/special-days-dataset.ts → id 'regaib-kandili-2026', date '2026-12-10').
 *   DOĞRULAMA gerekmez.
 * - Diğerleri (MIRAC/BERAT/KADIR/MEVLID + RAMAZAN_1448_START): repoda bugünden
 *   sonraki bir tarih bulunamadı (mobil dataset yalnız 2026-12-10'a kadar
 *   kapsıyor) → aşağıdaki yöntemle TAHMİN edilmiştir, DOĞRULANMALIDIR:
 *   1) Repo'daki 1448 ay başlangıçlarından (Rebiülevvel 2026-08-14, Rebiülahir
 *      2026-09-12, Cemaziyelevvel 2026-10-12, Cemaziyelahir 2026-11-10, Recep
 *      2026-12-10) ay uzunlukları geriye dönük hesaplanmış (29/30 gün, art arda
 *      dönüşümlü) ve zincirleme ileri taşınmıştır.
 *   2) "Ayın N. günü = ay başlangıcı + (N-2) gün" kalıbı, repodaki 1447 verisiyle
 *      üç bağımsız noktada doğrulanmıştır (1 Recep 2025-12-21 → 27 Recep/Miraç
 *      2026-01-15; 1 Şaban 2026-01-20 → 15 Şaban/Berat 2026-02-02; 1 Ramazan
 *      2026-02-19 → 27 Ramazan/Kadir 2026-03-16 — üçünde de +25/+13 farkı
 *      birebir tutuyor). Bu kalıp 1448 tahminlerine de uygulanmıştır.
 *   Tüm tahminler ±1 gün belirsizlik payı taşır (hilal gözlemine bağlı resmi
 *   Diyanet takvimiyle teyit edilmelidir).
 */

// Repo verisi — DOĞRULAMA gerekmez (bkz. special-days-dataset.ts).
export const REGAIB_KANDILI_ANCHOR = '2026-12-10';

// DOĞRULA (Diyanet takvimi) — tahmin: 27 Recep 1448 = 1 Recep 1448
// (2026-12-10, repo verisi) + 25 gün.
export const MIRAC_KANDILI_ANCHOR = '2027-01-04';

// DOĞRULA (Diyanet takvimi) — tahmin: 15 Şaban 1448. Zincir: Recep 1448
// başlangıcı (2026-12-10, repo verisi) + tahmini Recep uzunluğu (29 gün) =
// Şaban 1448 başlangıcı (~2027-01-08); + 13 gün (15. gün kalıbı).
export const BERAT_KANDILI_ANCHOR = '2027-01-21';

// DOĞRULA (Diyanet takvimi) — tahmin: Ramazan 1448 başlangıcı. Zincir: Şaban
// 1448 başlangıcı (~2027-01-08, yukarı bkz.) + tahmini Şaban uzunluğu (30 gün).
export const RAMAZAN_1448_START = '2027-02-08';

// DOĞRULA (Diyanet takvimi) — tahmin: 27 Ramazan 1448 (Kadir Gecesi) =
// RAMAZAN_1448_START + 25 gün.
export const KADIR_GECESI_ANCHOR = '2027-03-05';

// DOĞRULA (Diyanet takvimi) — tahmin: 11 Rebiülevvel 1449 (Mevlid Kandili).
// 1448'in Mevlid'i (2026-08-23/24, repo verisi) bugün (2026-09-12) itibarıyla
// zaten geçti; bir sonraki hicri yıla taşınmıştır. Zincir: Rebiülevvel 1448
// başlangıcı (2026-08-14, repo verisi) + ~1 hicri yıl (354 gün) = Rebiülevvel
// 1449 başlangıcı (~2027-08-03); + 9 gün (11. gün kalıbı).
export const MEVLID_KANDILI_ANCHOR = '2027-08-12';
