/**
 * special_days koleksiyonu yıllık elle bakım gerektirir (yeni hicri yıl
 * apps/api/scripts/data/hijri-calendar.mjs'e eklenip `seed:special-days`
 * çalıştırılır). Bu sabit, SpecialDaysService.getCoverage()'ın veri ufkunu
 * yeterli sayması için aktif kayıtların en ileri tarihinin bugünden
 * (İstanbul) en az kaç gün ileride olması gerektiğini belirler.
 */
export const SPECIAL_DAYS_MIN_COVERAGE_DAYS = 180;
