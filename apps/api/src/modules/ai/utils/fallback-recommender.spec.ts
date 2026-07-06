import { fallbackRecommend } from './fallback-recommender';

describe('fallbackRecommend', () => {
  it('prioritizes tag and diversity match', () => {
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
          nameTurkish: 'Estağfirullah',
          tags: ['stresli', 'huzur'],
          categories: ['arınma'],
          timeOfDay: 'morning',
          suitableFor: ['cuma'],
        },
        {
          _id: '2',
          nameTurkish: 'Elhamdülillah',
          tags: ['şükür'],
          categories: ['şükür'],
          timeOfDay: 'morning',
          suitableFor: ['bayram'],
        },
      ],
    });

    expect(result.recommendedIds[0]).toBe('1');
    expect(result.recommendedIds).toHaveLength(2);
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.hasTextualSignal).toBe(true);
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
          nameTurkish: 'La havle',
          tags: ['kaygi', 'endise'],
          categories: ['gelecek kaygisi'],
          timeOfDay: 'any',
          suitableFor: [],
        },
        {
          _id: '2',
          nameTurkish: 'Elhamdülillah',
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
          nameTurkish: 'Tag eşleşmesi',
          tags: ['sınav'],
          categories: [],
          timeOfDay: 'any',
          suitableFor: [],
        },
        {
          _id: 'suitable-for-only',
          nameTurkish: 'SuitableFor eşleşmesi',
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
          nameTurkish: 'Estağfirullah',
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
