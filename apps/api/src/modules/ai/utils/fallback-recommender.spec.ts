import { fallbackRecommend } from './fallback-recommender';

describe('fallbackRecommend', () => {
  it('prioritizes tag and diversity match', () => {
    const result = fallbackRecommend({
      mood: 'huzur',
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
  });
});
