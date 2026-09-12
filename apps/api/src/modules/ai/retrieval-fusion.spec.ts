import { DEFAULT_RRF_K, rrfFuse, type RankedItem } from './retrieval-fusion';

function ranked<T extends string>(ids: T[]): RankedItem<T>[] {
  return ids.map((id) => ({ id, item: id }));
}

describe('rrfFuse', () => {
  it('scores each item by 1/(k + rank) within a single list', () => {
    const fused = rrfFuse([ranked(['a', 'b', 'c'])], 60);

    expect(fused.map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(fused[0].fusedScore).toBeCloseTo(1 / 61, 10);
    expect(fused[1].fusedScore).toBeCloseTo(1 / 62, 10);
    expect(fused[2].fusedScore).toBeCloseTo(1 / 63, 10);
    expect(fused.every((f) => f.sourceLists.length === 1)).toBe(true);
  });

  it('sums contributions across lists — an item in both lists outranks an item that is rank #1 in only one list', () => {
    // 'x' is #1 in listA only. 'y' is #2 in listA and #1 in listB.
    const listA = ranked(['x', 'y']);
    const listB = ranked(['y', 'z']);

    const fused = rrfFuse([listA, listB], 60);
    const byId = new Map(fused.map((f) => [f.id, f]));

    const xScore = byId.get('x')!.fusedScore;
    const yScore = byId.get('y')!.fusedScore;
    const zScore = byId.get('z')!.fusedScore;

    expect(xScore).toBeCloseTo(1 / 61, 10);
    expect(yScore).toBeCloseTo(1 / 62 + 1 / 61, 10);
    expect(zScore).toBeCloseTo(1 / 62, 10);

    // "both lists" boost: y's combined score beats x's single rank-1 score.
    expect(yScore).toBeGreaterThan(xScore);
    expect(fused.map((f) => f.id)).toEqual(['y', 'x', 'z']);

    expect(byId.get('y')!.sourceLists).toEqual([0, 1]);
    expect(byId.get('x')!.sourceLists).toEqual([0]);
    expect(byId.get('z')!.sourceLists).toEqual([1]);
  });

  it('uses DEFAULT_RRF_K (60) when k is omitted', () => {
    const fused = rrfFuse([ranked(['a'])]);
    expect(fused[0].fusedScore).toBeCloseTo(1 / (DEFAULT_RRF_K + 1), 10);
  });

  it('a larger k flattens the gap between adjacent ranks', () => {
    const list = ranked(['first', 'second']);

    const withSmallK = rrfFuse([list], 0);
    const withLargeK = rrfFuse([list], 1000);

    const gapSmallK =
      withSmallK.find((f) => f.id === 'first')!.fusedScore -
      withSmallK.find((f) => f.id === 'second')!.fusedScore;
    const gapLargeK =
      withLargeK.find((f) => f.id === 'first')!.fusedScore -
      withLargeK.find((f) => f.id === 'second')!.fusedScore;

    expect(gapSmallK).toBeGreaterThan(gapLargeK);
    // Order is preserved regardless of k.
    expect(withLargeK.map((f) => f.id)).toEqual(['first', 'second']);
  });

  it('returns an empty array when every list is empty', () => {
    expect(rrfFuse([[], []])).toEqual([]);
  });

  it('preserves the original item payload, not just the id', () => {
    const fused = rrfFuse([[{ id: 'a', item: { label: 'A', score: 42 } }]]);
    expect(fused[0].item).toEqual({ label: 'A', score: 42 });
  });
});
