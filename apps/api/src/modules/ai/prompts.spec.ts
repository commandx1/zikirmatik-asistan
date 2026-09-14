import { formatCandidateLine } from './prompts';
import type { DhikrCandidate } from './retrieval.service';

/**
 * Regresyon: özel gün seed'i normalize edilmemiş `timeOfDay` yazdığında
 * (ör. 'any' string, ['sabah','aksam'] TR dizi) DB'deki 541 zikir kaydının
 * timeOfDay/tags/suitableFor alanları şemanın beklediği string[] yerine ham
 * değer taşıyordu. `formatCandidateLine` bu alanlara doğrudan `.join`
 * çağırdığı için "candidate.timeOfDay.join is not a function" hatasıyla AI
 * Rehber ve AI Vird programı akışlarını 503'e düşürdü. formatCandidateLine
 * artık bozuk (string) alanlarla da throw etmemeli.
 */
function candidate(overrides: Partial<DhikrCandidate> = {}): DhikrCandidate & {
  ref: string;
} {
  return {
    id: 'id-1',
    name: 'Test Zikri',
    virtue: 'Fazilet metni',
    meaning: 'Anlam metni',
    tags: ['tag1'],
    categories: ['cat1'],
    suitableFor: ['herkes'],
    timeOfDay: ['morning'],
    ref: 'C1',
    ...overrides,
  };
}

describe('formatCandidateLine', () => {
  it('formats a well-formed candidate with array fields', () => {
    const line = formatCandidateLine(candidate());
    expect(line).toContain('C1');
    expect(line).toContain('morning');
    expect(line).toContain('tag1');
    expect(line).toContain('herkes');
  });

  it('does not throw when timeOfDay is a raw string instead of an array', () => {
    const bogus = candidate({
      timeOfDay: 'any' as unknown as string[],
    });
    expect(() => formatCandidateLine(bogus)).not.toThrow();
    const line = formatCandidateLine(bogus);
    expect(line).toContain('any');
  });

  it('does not throw when tags/suitableFor are raw strings instead of arrays', () => {
    const bogus = candidate({
      tags: 'sabah' as unknown as string[],
      suitableFor: 'herkes' as unknown as string[],
    });
    expect(() => formatCandidateLine(bogus)).not.toThrow();
    const line = formatCandidateLine(bogus);
    expect(line).toContain('sabah');
    expect(line).toContain('herkes');
  });

  it('does not throw and drops the field when timeOfDay is null/undefined/object', () => {
    for (const bad of [null, undefined, { weird: true }, 42] as unknown[]) {
      const bogus = candidate({ timeOfDay: bad as string[] });
      expect(() => formatCandidateLine(bogus)).not.toThrow();
    }
  });
});
