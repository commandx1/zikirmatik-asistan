/**
 * Bir dhikrs DB kaydı için Esma İngilizce yazım farkını hesaplar.
 * Dönüş: `$set` nesnesi (fark yoksa null).
 *
 * Kural: transliteration.en her zaman hedefe eşitlenir; name.en yalnız
 * mevcut değeri (büyük/küçük harf farkı yok sayılarak) mevcut
 * transliteration.en ile aynıysa, yani "ad = harfleştirme" ise eşitlenir.
 *
 * @param {{ name?: { en?: string }, transliteration?: { en?: string } }} doc
 * @param {{ name: { en: string }, transliteration: { en: string } }} target
 */
export function diffEsmaEn(doc, target) {
  const curTr = doc.transliteration?.en ?? '';
  const curName = doc.name?.en ?? '';
  const set = {};
  if (curTr !== target.transliteration.en) set['transliteration.en'] = target.transliteration.en;
  if (curName.toLowerCase() === curTr.toLowerCase() && curName !== target.name.en) {
    set['name.en'] = target.name.en;
  }
  return Object.keys(set).length > 0 ? set : null;
}
