import { estimateCostUsd, normalizeModelName } from './ai-pricing.constants';

describe('normalizeModelName', () => {
  it('picks the longest matching prefix (gpt-5-mini over gpt-5)', () => {
    expect(normalizeModelName('gpt-5-mini-2025-08-07')).toBe('gpt-5-mini');
  });

  it('falls back to the shorter root when only it matches', () => {
    expect(normalizeModelName('gpt-5-2025-08-07')).toBe('gpt-5');
  });

  it('matches an exact known model name with no suffix', () => {
    expect(normalizeModelName('gpt-5-mini')).toBe('gpt-5-mini');
    expect(normalizeModelName('gpt-5')).toBe('gpt-5');
  });

  it('returns the trimmed input unchanged for an unknown model', () => {
    expect(normalizeModelName('  claude-3-opus  ')).toBe('claude-3-opus');
  });
});

describe('estimateCostUsd', () => {
  it('prices a gpt-5-mini call using the gpt-5-mini rate, not gpt-5', () => {
    const cost = estimateCostUsd('gpt-5-mini-2025-08-07', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.25 + 2.0);
  });

  it('prices a gpt-5 call using the gpt-5 rate', () => {
    const cost = estimateCostUsd('gpt-5-2025-08-07', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(1.25 + 10.0);
  });

  it('returns 0 for an unknown model', () => {
    expect(estimateCostUsd('unknown-model', 1_000_000, 1_000_000)).toBe(0);
  });
});
