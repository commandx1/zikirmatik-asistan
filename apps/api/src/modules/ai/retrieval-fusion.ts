/**
 * Reciprocal Rank Fusion (RRF) — hibrit arama (Atlas $vectorSearch +
 * Atlas Search $search) sonuçlarını birleştirmek için kullanılan saf
 * fonksiyon. Bilinçli olarak Mongo/servis bağımlılığı yok — RetrievalService
 * dışında bağımsız test edilebilsin diye ayrı dosyada tutuluyor.
 *
 * RRF formülü: her liste içindeki 1-indeksli sıraya (rank) göre
 * `1 / (k + rank)` katkısı verilir; bir öğe birden fazla listede geçiyorsa
 * katkılar toplanır (dolayısıyla iki listede de üstte olan bir öğe, tek
 * listede üstte olandan daha yüksek fused skor alır — "both listelerde
 * geçme" doğal bir boost'tur, ayrıca kodlanmadı).
 */

export const DEFAULT_RRF_K = 60;

export type RankedItem<T> = {
  id: string;
  item: T;
};

export type FusedItem<T> = {
  id: string;
  item: T;
  fusedScore: number;
  /** Öğenin geçtiği listelerin index'leri (0-based), artan sırada. */
  sourceLists: number[];
};

/**
 * `lists[i]` sıralı (en iyi eşleşme ilk sırada) bir aday listesidir.
 * Dönüş, fused skora göre azalan sırada, listeler arası tekilleştirilmiş
 * (aynı `id` birleştirilmiş) sonuç dizisidir.
 */
export function rrfFuse<T>(
  lists: Array<RankedItem<T>[]>,
  k: number = DEFAULT_RRF_K,
): Array<FusedItem<T>> {
  const byId = new Map<
    string,
    { item: T; fusedScore: number; sourceLists: Set<number> }
  >();

  lists.forEach((list, listIndex) => {
    list.forEach((entry, indexInList) => {
      const rank = indexInList + 1; // 1-indeksli
      const contribution = 1 / (k + rank);

      const existing = byId.get(entry.id);
      if (existing) {
        existing.fusedScore += contribution;
        existing.sourceLists.add(listIndex);
      } else {
        byId.set(entry.id, {
          item: entry.item,
          fusedScore: contribution,
          sourceLists: new Set([listIndex]),
        });
      }
    });
  });

  return Array.from(byId.entries())
    .map(([id, value]) => ({
      id,
      item: value.item,
      fusedScore: value.fusedScore,
      sourceLists: Array.from(value.sourceLists).sort((a, b) => a - b),
    }))
    .sort((a, b) => b.fusedScore - a.fusedScore);
}
