import { fallbackRecommend } from './fallback-recommender';

describe('fallbackRecommend', () => {
  it('prioritizes tag and diversity match, and drops zero-overlap fillers when textual signal exists', () => {
    const result = fallbackRecommend({
      freeText: 'stresli hissediyorum',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: ['2'],
      maxRecommendations: 2,
      availableDhikrs: [
        {
          _id: '1',
          tags: ['stresli', 'huzur'],
          categories: ['arınma'],
          timeOfDay: 'morning',
          suitableFor: ['cuma'],
        },
        {
          _id: '2',
          tags: ['şükür'],
          categories: ['şükür'],
          timeOfDay: 'morning',
          suitableFor: ['bayram'],
        },
      ],
    });

    // "hissediyorum" bir stopword — asıl sinyal "stresli" tokeninden gelir.
    // '2' numaralı zikrin hiçbir alanla örtüşmesi yok, bu yüzden sonuç
    // listesinden elenir (maxRecommendations=2 olsa bile).
    expect(result.recommendedIds).toEqual(['1']);
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.hasTextualSignal).toBe(true);
  });

  it('filters stopwords out of tokenize() so they do not dilute overlap ratio', () => {
    // "ben", "hissediyorum" ve "cok" stopword; kalan tek anlamlı token
    // "kaygi" tam eşleşmeli olduğu için overlap oranı 1'e ulaşabilmeli.
    const result = fallbackRecommend({
      freeText: 'ben çok kaygı hissediyorum',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 1,
      availableDhikrs: [
        {
          _id: '1',
          tags: ['kaygi'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
      ],
    });

    expect(result.recommendedIds).toEqual(['1']);
    expect(result.hasTextualSignal).toBe(true);
  });

  it('matches via prefix when the shared prefix is at least 4 characters ("kaygılıyım" ~ "kaygı")', () => {
    const result = fallbackRecommend({
      freeText: 'kaygılıyım',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 1,
      availableDhikrs: [
        {
          _id: '1',
          tags: ['kaygı'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
        {
          _id: '2',
          tags: ['şükür'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
      ],
    });

    expect(result.recommendedIds).toEqual(['1']);
    expect(result.hasTextualSignal).toBe(true);
  });

  it('does not prefix-match short shared prefixes below the 4-char minimum', () => {
    // "de" ve "deniz" paylaşılan önek uzunluğu 2 — eşik altı, eşleşmemeli.
    const result = fallbackRecommend({
      freeText: 'deniz',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 1,
      availableDhikrs: [
        {
          _id: '1',
          tags: ['de'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
      ],
    });

    expect(result.hasTextualSignal).toBe(false);
  });

  it('detects textual signal from ANY scored candidate, not just the top pick, and excludes zero-overlap items from recommendedIds', () => {
    const result = fallbackRecommend({
      freeText: 'sükunet',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 3,
      availableDhikrs: [
        {
          _id: 'no-overlap-but-good-time',
          tags: ['şükür'],
          categories: [],
          timeOfDay: 'morning',
          suitableFor: [],
        },
        {
          _id: 'overlap-match',
          tags: ['sükunet'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
      ],
    });

    expect(result.hasTextualSignal).toBe(true);
    expect(result.recommendedIds).toEqual(['overlap-match']);
    expect(result.recommendedIds).not.toContain('no-overlap-but-good-time');
  });

  it('folds Turkish diacritics so "kaygı" matches a tag written as "kaygi"', () => {
    const result = fallbackRecommend({
      freeText: 'kaygı içindeyim ne yapmalıyım',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 1,
      availableDhikrs: [
        {
          _id: '1',
          tags: ['kaygi', 'endise'],
          categories: ['gelecek kaygisi'],
          timeOfDay: 'any',
          suitableFor: [],
        },
        {
          _id: '2',
          tags: ['şükür'],
          categories: ['şükür'],
          timeOfDay: 'any',
          suitableFor: [],
        },
      ],
    });

    expect(result.recommendedIds[0]).toBe('1');
    expect(result.hasTextualSignal).toBe(true);
  });

  it('weighs suitableFor overlap more heavily than tags overlap', () => {
    const result = fallbackRecommend({
      freeText: 'sınav',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 1,
      availableDhikrs: [
        {
          _id: 'tags-only',
          tags: ['sınav'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
        {
          _id: 'suitable-for-only',
          tags: [],
          categories: [],
          timeOfDay: 'any',
          suitableFor: ['sınav'],
        },
      ],
    });

    expect(result.recommendedIds[0]).toBe('suitable-for-only');
  });

  it('reports hasTextualSignal=false when nothing overlaps with any field', () => {
    const result = fallbackRecommend({
      freeText: 'zzz qqq wwwxyz',
      timeContext: {
        hour: 9,
        dayOfWeek: 2,
        isSpecialDay: false,
      },
      recentDhikrIds: [],
      maxRecommendations: 2,
      availableDhikrs: [
        {
          _id: '1',
          tags: ['stresli', 'huzur'],
          categories: ['arınma'],
          timeOfDay: 'morning',
          suitableFor: ['cuma'],
        },
      ],
    });

    expect(result.hasTextualSignal).toBe(false);
  });
});
