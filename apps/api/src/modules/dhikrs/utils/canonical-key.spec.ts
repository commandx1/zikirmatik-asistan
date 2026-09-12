import { canonicalKeyFromArabic } from './canonical-key';

describe('canonicalKeyFromArabic', () => {
  it('harekeli ve harekesiz aynı metin aynı anahtarı verir', () => {
    const withHarakat = canonicalKeyFromArabic('السَّلَامُ عَلَيْكُمْ');
    const withoutHarakat = canonicalKeyFromArabic('السلام عليكم');
    expect(typeof withHarakat).toBe('string');
    expect(withHarakat).toHaveLength(12);
    expect(withHarakat).toBe(withoutHarakat);
  });

  it('boşluk ve noktalama farkları anahtarı değiştirmez', () => {
    const a = canonicalKeyFromArabic('الحمد لله رب العالمين');
    const b = canonicalKeyFromArabic('  الحمد   لله، رب  العالمين!  ');
    expect(a).toBe(b);
  });

  it('tatweel (kaşide) yok sayılır', () => {
    const a = canonicalKeyFromArabic('اللّٰه');
    const b = canonicalKeyFromArabic('اللّٰـه');
    expect(a).toBe(b);
  });

  it('boş/undefined girişte undefined döner', () => {
    expect(canonicalKeyFromArabic(undefined)).toBeUndefined();
    expect(canonicalKeyFromArabic(null)).toBeUndefined();
    expect(canonicalKeyFromArabic('')).toBeUndefined();
    expect(canonicalKeyFromArabic('   ')).toBeUndefined();
  });

  it('farklı metinler farklı anahtar üretir', () => {
    expect(canonicalKeyFromArabic('بسم الله الرحمن الرحيم')).not.toBe(
      canonicalKeyFromArabic('الحمد لله رب العالمين'),
    );
  });
});
