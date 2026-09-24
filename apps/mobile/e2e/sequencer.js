// Dosyaları ad sırasıyla koş (01 → 04): jest varsayılanı süreye göre sıralar.
// @jest/test-sequencer'a bağımlı olmamak için minimal arayüz.
module.exports = class AlphabeticalSequencer {
  sort(tests) {
    return [...tests].sort((a, b) => a.path.localeCompare(b.path));
  }
  cacheResults() {}
};
