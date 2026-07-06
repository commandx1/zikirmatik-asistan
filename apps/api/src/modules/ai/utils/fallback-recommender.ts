import { normalizeText } from './text-normalize';

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
  freeText?: string;
  timeContext: TimeContext;
  recentDhikrIds: string[];
  availableDhikrs: AvailableDhikr[];
  maxRecommendations: number;
};

export type FallbackResult = {
  recommendedIds: string[];
  reasoning: string;
  /**
   * true → en iyi adayda tags/suitableFor/categories alanlarından en az
   * biriyle kelime örtüşmesi bulundu (gerçek bir metinsel sinyal var).
   * false → freeText tamamen alakasız/anlamsız olabilir, katalogda hiçbir
   * alanla eşleşme yok; bu durumda çağıran taraf kullanıcıya netleştirme
   * sorusu sormalı ("Yanlış zikir önerme lüksümüz yok" kuralı).
   */
  hasTextualSignal: boolean;
};

export function fallbackRecommend(input: FallbackInput): FallbackResult {
  const intentTokens = tokenize(input.freeText ?? '');
  const recentSet = new Set(input.recentDhikrIds);

  const scored = input.availableDhikrs.map((dhikr) => {
    const suitableForOverlap = overlapRatio(
      intentTokens,
      tokenize(dhikr.suitableFor.join(' ')),
    );
    const tagsOverlap = overlapRatio(
      intentTokens,
      tokenize(dhikr.tags.join(' ')),
    );
    const categoriesOverlap = overlapRatio(
      intentTokens,
      tokenize(dhikr.categories.join(' ')),
    );
    // suitableFor×3, tags×2, categories×1 — searchDhikrsForAgent (ai.service.ts)
    // ile aynı ağırlıklandırma; 6'ya bölünerek 0..1 aralığına normalize edilir.
    const fieldOverlapScore =
      (suitableForOverlap * 3 + tagsOverlap * 2 + categoriesOverlap * 1) / 6;

    const timeScore = scoreTimeMatch(input.timeContext.hour, dhikr.timeOfDay);
    const specialScore = scoreSpecialDayMatch(
      input.timeContext.isSpecialDay,
      input.timeContext.specialDayName,
      dhikr.suitableFor,
    );
    const diversityBonus = recentSet.has(dhikr._id) ? 0 : 1;

    const score =
      fieldOverlapScore * 0.4 +
      timeScore * 0.2 +
      specialScore * 0.2 +
      diversityBonus * 0.2;

    return {
      dhikr,
      score,
      suitableForOverlap,
      tagsOverlap,
      categoriesOverlap,
      fieldOverlapScore,
      timeScore,
      specialScore,
      diversityBonus,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const picks = scored.slice(0, input.maxRecommendations);
  const recommendedIds = picks.map((item) => item.dhikr._id);

  const reasoning = buildReasoningSummary(picks);
  const hasTextualSignal =
    intentTokens.length > 0 && (picks[0]?.fieldOverlapScore ?? 0) > 0;

  return {
    recommendedIds,
    reasoning,
    hasTextualSignal,
  };
}

function tokenize(input: string) {
  const normalized = normalizeText(input);

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
    fieldOverlapScore: number;
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

  if (top.fieldOverlapScore > 0) {
    reasons.push('niyet metniyle uyumlu etiket/kategori eşleşmesi');
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
