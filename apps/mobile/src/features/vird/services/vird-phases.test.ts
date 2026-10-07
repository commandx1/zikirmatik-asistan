import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { findPhasesError } from "./vird-phases";

type P = { fromDay: number; toDay: number | null };

// Geçerli, ardışık fazlar: uzunluklar >= 1; sonuncu açık uçlu ya da kapalı.
function contiguous(lengths: number[], lastOpen: boolean): P[] {
  let from = 1;
  return lengths.map((len, index) => {
    const phase: P = { fromDay: from, toDay: index === lengths.length - 1 && lastOpen ? null : from + len - 1 };
    from += len;
    return phase;
  });
}

const lengthsArb = fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 1, maxLength: 6 });

describe("findPhasesError (A-24, VIRD_PHASES_INVALID ile aynı kurallar)", () => {
  it("özellik: ardışık, 1. günden başlayan fazlar (karışık sırada bile) geçerli", () => {
    fc.assert(
      fc.property(lengthsArb, fc.boolean(), (lengths, lastOpen) => {
        const phases = contiguous(lengths, lastOpen);
        expect(findPhasesError(phases)).toBeNull();
        expect(findPhasesError([...phases].reverse())).toBeNull();
      })
    );
  });

  it("özellik: ilk faz 1'den başlamıyorsa 'start'", () => {
    fc.assert(
      fc.property(lengthsArb, fc.integer({ min: 1, max: 5 }), (lengths, offset) => {
        const shifted = contiguous(lengths, true).map((p) => ({ fromDay: p.fromDay + offset, toDay: p.toDay === null ? null : p.toDay + offset }));
        expect(findPhasesError(shifted)).toBe("start");
      })
    );
  });

  it("özellik: iki faz arasına boşluk girerse hata", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 2, maxLength: 6 }), fc.integer({ min: 1, max: 5 }), (lengths, gap) => {
        const phases = contiguous(lengths, false);
        const last = phases[phases.length - 1]!;
        phases[phases.length - 1] = { fromDay: last.fromDay + gap, toDay: last.toDay === null ? null : last.toDay + gap };
        expect(findPhasesError(phases)).toBe("gap_or_overlap");
      })
    );
  });

  it("çakışma: önceki faz sonraki fazın başladığı güne taşarsa hata", () => {
    expect(findPhasesError([{ fromDay: 1, toDay: 10 }, { fromDay: 8, toDay: null }])).toBe("gap_or_overlap");
  });

  it("bitiş < başlangıç hata; tek açık uçlu faz ve boş liste geçerli (sunucu ile aynı)", () => {
    expect(findPhasesError([{ fromDay: 1, toDay: 0 }])).toBe("end_before_start");
    expect(findPhasesError([{ fromDay: 1, toDay: null }])).toBeNull();
    expect(findPhasesError([])).toBeNull();
  });

  it("açık uçlu ara faz sonraki fazın başına kadar sürer (sunucu kuralı)", () => {
    expect(findPhasesError([{ fromDay: 1, toDay: null }, { fromDay: 5, toDay: null }])).toBeNull();
  });
});
