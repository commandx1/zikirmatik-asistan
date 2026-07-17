/**
 * İki dilli metin alanı ({ tr, en }). Zikir kataloğunda name, transliteration,
 * meaning, virtue, source alanları bu şekli kullanır.
 *
 * Not: Bu tip yapısal olarak packages/shared/src/types/domain.ts içindeki
 * LocalizedText tipiyle birebir aynıdır ve normalde oradan import edilmesi
 * tercih edilirdi. Ancak apps/api'nin tsconfig'i "moduleResolution": "nodenext"
 * kullanıyor (apps/mobile'ın "Bundler" moduna göre çok daha katı) ve
 * packages/shared bir derleme/dist adımı olmadan salt .ts kaynağını
 * (package.json "main": "src/index.ts") dışa veriyor. packages/shared/src/index.ts
 * içindeki uzantısız relative export'lar (`export * from "./types/theme"` vb.)
 * nodenext altında TS2835 hatası veriyor ve tüm modül grafiğinin çözülmesini
 * engelliyor — tek bir named import bile alınsa aynı hata oluşuyor.
 *
 * packages/shared/src/index.ts'e .js uzantıları eklemek nodenext tarafını
 * çözer, ama bu paket apps/mobile tarafından da (Metro/Bundler çözümlemesiyle)
 * kullanılıyor ve derlenmemiş .ts kaynağına açık ".js" uzantılı import
 * eklemenin Metro bundling'ini bozup bozmayacağı bu görevin kapsamında
 * doğrulanamadı. Bu yüzden burada yapısal olarak birebir aynı, yerel bir tip
 * tanımlanıyor. packages/shared'a bir build/dist adımı (veya "exports" alanı)
 * eklenirse bu dosya kaldırılıp gerçek import'a geçilebilir.
 */
export interface LocalizedText {
  tr: string;
  en: string;
}
