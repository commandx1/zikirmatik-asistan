import { normalizeText } from './text-normalize';

describe('normalizeText', () => {
  it('folds Turkish-specific characters', () => {
    expect(normalizeText('KAYGI şükür çöğü')).toBe('kaygi sukur cogu');
  });

  it('folds circumflexed vowels so "kurân" matches "kuran"', () => {
    expect(normalizeText('kurân')).toBe('kuran');
    expect(normalizeText('âlem')).toBe('alem');
    expect(normalizeText('dînî')).toBe('dini');
    expect(normalizeText('mûsâ')).toBe('musa');
  });

  it('keeps dotless-ı handling correct alongside circumflex folding', () => {
    expect(normalizeText('Kaygı ve KURÂN')).toBe('kaygi ve kuran');
  });

  it('strips punctuation and collapses whitespace', () => {
    expect(normalizeText('  merhaba,   dünya! ')).toBe('merhaba dunya');
  });
});
