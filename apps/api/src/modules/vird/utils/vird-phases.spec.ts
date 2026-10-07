import fc from 'fast-check';
import { findManualPhasesError } from './vird-phases';

type P = { fromDay: number; toDay?: number | null };

/** Boşluksuz/çakışmasız 1..N bölümlemesi üretir (uzunluklar ≥1). */
const partition = fc
  .array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 8 })
  .map((lengths) => {
    let from = 1;
    return lengths.map<P>((len) => {
      const phase = { fromDay: from, toDay: from + len - 1 };
      from += len;
      return phase;
    });
  });

describe('findManualPhasesError (A-24 / API-VRD-27)', () => {
  it('geçerli bölümleme (sırasız gelse de) hata vermez', () => {
    fc.assert(
      fc.property(
        partition.chain((ps) =>
          fc
            .shuffledSubarray(ps, {
              minLength: ps.length,
              maxLength: ps.length,
            })
            .map((s) => ({ ps, s })),
        ),
        ({ s }) => findManualPhasesError(s) === null,
      ),
    );
  });

  it('son faz toDay:null (açık uçlu) geçerli', () => {
    expect(
      findManualPhasesError([
        { fromDay: 1, toDay: 3 },
        { fromDay: 4, toDay: null },
      ]),
    ).toBeNull();
  });

  it('boşluk → hata', () => {
    fc.assert(
      fc.property(partition, fc.integer({ min: 1, max: 5 }), (ps, gap) => {
        fc.pre(ps.length >= 2);
        const shifted = ps.map((p, i) =>
          i === 0
            ? p
            : { fromDay: p.fromDay + gap, toDay: (p.toDay as number) + gap },
        );
        return findManualPhasesError(shifted) !== null;
      }),
    );
  });

  it('çakışma → hata', () => {
    expect(
      findManualPhasesError([
        { fromDay: 1, toDay: 5 },
        { fromDay: 5, toDay: 8 },
      ]),
    ).not.toBeNull();
  });

  it('1. günden başlamıyorsa → hata', () => {
    fc.assert(
      fc.property(
        partition,
        fc.integer({ min: 1, max: 5 }),
        (ps, off) =>
          findManualPhasesError(
            ps.map((p) => ({
              fromDay: p.fromDay + off,
              toDay: (p.toDay as number) + off,
            })),
          ) !== null,
      ),
    );
  });

  it('toDay < fromDay → hata', () => {
    expect(findManualPhasesError([{ fromDay: 1, toDay: 0 }])).not.toBeNull();
    expect(
      findManualPhasesError([
        { fromDay: 1, toDay: 3 },
        { fromDay: 4, toDay: 2 },
      ]),
    ).not.toBeNull();
  });

  it('ortadaki toDay:null sonraki fazın başına kadar sürer (geçerli); aynı fromDay → hata', () => {
    expect(
      findManualPhasesError([
        { fromDay: 1, toDay: null },
        { fromDay: 4, toDay: 6 },
      ]),
    ).toBeNull();
    expect(
      findManualPhasesError([
        { fromDay: 1, toDay: null },
        { fromDay: 1, toDay: 6 },
      ]),
    ).not.toBeNull();
  });
});
