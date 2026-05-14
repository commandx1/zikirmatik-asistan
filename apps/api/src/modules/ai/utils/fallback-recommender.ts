type AvailableDhikr = {
  _id: string;
  nameTurkish: string;
  tags: string[];
  categories: string[];
  timeOfDay: 'morning' | 'evening' | 'night' | 'any';
  suitableFor: string[];
};

type TimeContext = {
  hour: number;
  dayOfWeek: number;
  isSpecialDay: boolean;
  specialDayName?: string;
};

type FallbackInput = {
  mood: string;
  freeText?: string;
  timeContext: TimeContext;
  recentDhikrIds: string[];
  availableDhikrs: AvailableDhikr[];
  maxRecommendations: number;
};

export type FallbackResult = {
  recommendedIds: string[];
  reasoning: string;
};

export function fallbackRecommend(input: FallbackInput): FallbackResult {
  const moodTokens = tokenize(`${input.mood} ${input.freeText ?? ''}`);
  const recentSet = new Set(input.recentDhikrIds);

  const scored = input.availableDhikrs.map((dhikr) => {
    const tokenSpace = tokenize(
      `${dhikr.tags.join(' ')} ${dhikr.categories.join(' ')}`,
    );
    const tagOverlap = overlapRatio(moodTokens, tokenSpace);

    const timeScore = scoreTimeMatch(input.timeContext.hour, dhikr.timeOfDay);
    const specialScore = scoreSpecialDayMatch(
      input.timeContext.isSpecialDay,
      input.timeContext.specialDayName,
      dhikr.suitableFor,
    );
    const diversityBonus = recentSet.has(dhikr._id) ? 0 : 1;

    const score =
      tagOverlap * 0.4 +
      timeScore * 0.2 +
      specialScore * 0.2 +
      diversityBonus * 0.2;

    return {
      dhikr,
      score,
      tagOverlap,
      timeScore,
      specialScore,
      diversityBonus,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const picks = scored.slice(0, input.maxRecommendations);
  const recommendedIds = picks.map((item) => item.dhikr._id);

  const reasoning = buildReasoningSummary(picks);

  return {
    recommendedIds,
    reasoning,
  };
}

function tokenize(input: string) {
  const lowered = input.toLocaleLowerCase('tr-TR');
  const normalized = lowered.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/).filter((token) => token.length > 1);
}

function overlapRatio(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const bSet = new Set(b);
  const hitCount = a.filter((token) => bSet.has(token)).length;
  return hitCount / a.length;
}

function scoreTimeMatch(hour: number, timeOfDay: AvailableDhikr['timeOfDay']) {
  if (timeOfDay === 'any') {
    return 0.7;
  }

  if (hour >= 5 && hour < 12 && timeOfDay === 'morning') {
    return 1;
  }

  if (hour >= 12 && hour < 19 && timeOfDay === 'evening') {
    return 1;
  }

  if ((hour >= 19 || hour < 5) && timeOfDay === 'night') {
    return 1;
  }

  return 0.2;
}

function scoreSpecialDayMatch(
  isSpecialDay: boolean,
  specialDayName: string | undefined,
  suitableFor: string[],
) {
  if (!isSpecialDay) {
    return 0.6;
  }

  const lowered = specialDayName?.toLocaleLowerCase('tr-TR') ?? '';
  const suitable = suitableFor.map((item) => item.toLocaleLowerCase('tr-TR'));

  if (suitable.length === 0) {
    return 0.2;
  }

  if (
    lowered &&
    suitable.some((item) => lowered.includes(item) || item.includes(lowered))
  ) {
    return 1;
  }

  return 0.4;
}

function buildReasoningSummary(
  picks: Array<{
    dhikr: AvailableDhikr;
    tagOverlap: number;
    timeScore: number;
    specialScore: number;
    diversityBonus: number;
  }>,
) {
  if (picks.length === 0) {
    return 'Uygun doğrulanmış zikir bulunamadı.';
  }

  const top = picks[0];
  const reasons: string[] = [];

  if (top.tagOverlap > 0) {
    reasons.push('ruh haline uygun etiket eşleşmesi');
  }

  if (top.timeScore >= 0.7) {
    reasons.push('günün saatine uygunluk');
  }

  if (top.specialScore >= 0.8) {
    reasons.push('özel gün bağlamı uyumu');
  }

  if (top.diversityBonus > 0) {
    reasons.push('son günlerde tekrar etmeyen çeşitlilik');
  }

  const reasonText =
    reasons.length > 0 ? reasons.join(', ') : 'genel bağlam uyumu';

  return `Öneriler ${reasonText} dikkate alınarak sıralandı.`;
}
