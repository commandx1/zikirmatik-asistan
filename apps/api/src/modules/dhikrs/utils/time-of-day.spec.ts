import { normalizeTimeOfDay } from './time-of-day';

describe('normalizeTimeOfDay', () => {
  it('undefined/null için any döner', () => {
    expect(normalizeTimeOfDay(undefined)).toEqual(['any']);
    expect(normalizeTimeOfDay(null)).toEqual(['any']);
  });

  it('tek Türkçe string eşler', () => {
    expect(normalizeTimeOfDay('sabah')).toEqual(['morning']);
    expect(normalizeTimeOfDay('akşam')).toEqual(['evening']);
    expect(normalizeTimeOfDay('gece')).toEqual(['night']);
    expect(normalizeTimeOfDay('öğle')).toEqual(['afternoon']);
  });

  it('İngilizce değerleri kabul eder', () => {
    expect(normalizeTimeOfDay('morning')).toEqual(['morning']);
    expect(normalizeTimeOfDay('any')).toEqual(['any']);
  });

  it('dizi girişlerini dedup eder', () => {
    expect(normalizeTimeOfDay(['sabah', 'morning'])).toEqual(['morning']);
    expect(normalizeTimeOfDay(['gece', 'yatsi'])).toEqual(['night']);
  });

  it('dört vaktin tamamı any döner', () => {
    expect(
      normalizeTimeOfDay(['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']),
    ).toEqual(['any']);
  });

  it('any diğer değerlerle birlikteyse kısa devre yapar', () => {
    expect(normalizeTimeOfDay(['sabah', 'any'])).toEqual(['any']);
  });

  it('bilinmeyen değerde hata fırlatır', () => {
    expect(() => normalizeTimeOfDay('öğlen-sonrası')).toThrow(
      /Geçersiz timeOfDay/,
    );
  });
});
