import { Types } from 'mongoose';
import type { VirdProgramPhase } from '../schemas/vird-program.schema';
import {
  daysBetween,
  dayIndexFor,
  expectedItemsForDay,
  isDayComplete,
  phaseForDay,
  type VirdDayProgramLike,
} from './vird-day';

const dhikrId = new Types.ObjectId('507f1f77bcf86cd799439011');

describe('daysBetween', () => {
  it('computes the day difference across a month boundary', () => {
    expect(daysBetween('2026-06-30', '2026-07-02')).toBe(2);
    expect(daysBetween('2026-07-02', '2026-06-30')).toBe(-2);
    expect(daysBetween('2026-06-30', '2026-06-30')).toBe(0);
  });
});

describe('dayIndexFor', () => {
  it('returns 1 for the start date and increments per day after it', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-06-01',
      phases: [],
    };
    expect(dayIndexFor(program, '2026-06-01')).toBe(1);
    expect(dayIndexFor(program, '2026-06-05')).toBe(5);
  });

  it('returns a value below 1 for dates before startDate', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-06-10',
      phases: [],
    };
    expect(dayIndexFor(program, '2026-06-08')).toBe(-1);
  });
});

describe('phaseForDay', () => {
  const routinePhase: VirdProgramPhase = {
    fromDay: 1,
    toDay: null,
    slots: {},
  };
  const journeyPhases: VirdProgramPhase[] = [
    { fromDay: 1, toDay: 3, slots: {} },
    { fromDay: 4, toDay: 7, slots: {} },
  ];

  it('matches a single open-ended routine phase for any day', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: [routinePhase],
    };
    expect(phaseForDay(program, 1)).toBe(routinePhase);
    expect(phaseForDay(program, 500)).toBe(routinePhase);
  });

  it('matches the correct day-ranged phase for a journey program', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: journeyPhases,
    };
    expect(phaseForDay(program, 2)).toBe(journeyPhases[0]);
    expect(phaseForDay(program, 4)).toBe(journeyPhases[1]);
    expect(phaseForDay(program, 7)).toBe(journeyPhases[1]);
  });

  it('returns undefined when no phase covers the day', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: journeyPhases,
    };
    expect(phaseForDay(program, 8)).toBeUndefined();
    expect(phaseForDay(program, 0)).toBeUndefined();
  });
});

describe('expectedItemsForDay', () => {
  it('returns one item for a non-prayer slot with prayerIndex null', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { morning: [{ dhikrId, target: 33 }] },
        },
      ],
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toHaveLength(1);
    expect(expected[0]).toMatchObject({
      slot: 'morning',
      prayerIndex: null,
      dhikrId: dhikrId.toString(),
      target: 33,
      itemKey: `morning:0:${dhikrId.toString()}`,
    });
  });

  it('expands a prayer-slot item across the default prayerSelection (1..5)', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { prayer: [{ dhikrId, target: 10 }] },
        },
      ],
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toHaveLength(5);
    expect(expected.map((item) => item.prayerIndex)).toEqual([1, 2, 3, 4, 5]);
    expect(expected[0].itemKey).toBe(`prayer:1:${dhikrId.toString()}`);
  });

  it('expands a prayer-slot item only across the configured prayerSelection', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { prayer: [{ dhikrId, target: 10 }] },
        },
      ],
      prayerSelection: [1, 4],
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toHaveLength(2);
    expect(expected.map((item) => item.prayerIndex)).toEqual([1, 4]);
  });

  it('supports customDhikrId items alongside catalog dhikrId items', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { free: [{ customDhikrId: 'my-custom', target: 5 }] },
        },
      ],
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toEqual([
      {
        itemKey: 'free:0:my-custom',
        slot: 'free',
        prayerIndex: null,
        dhikrId: undefined,
        customDhikrId: 'my-custom',
        target: 5,
      },
    ]);
  });

  it('returns an empty list when no phase covers the requested day', () => {
    const program: VirdDayProgramLike = {
      startDate: '2026-01-01',
      phases: [
        { fromDay: 1, toDay: 3, slots: { morning: [{ dhikrId, target: 1 }] } },
      ],
    };
    expect(expectedItemsForDay(program, 10)).toEqual([]);
  });
});

describe('isDayComplete', () => {
  it('is false when there are no expected items', () => {
    expect(isDayComplete([], new Map())).toBe(false);
  });

  it('is true only when every expected item reached its target', () => {
    const expected = [
      { itemKey: 'a', slot: 'morning' as const, prayerIndex: null, target: 10 },
      { itemKey: 'b', slot: 'evening' as const, prayerIndex: null, target: 5 },
    ];

    expect(
      isDayComplete(
        expected,
        new Map([
          ['a', 10],
          ['b', 5],
        ]),
      ),
    ).toBe(true);

    expect(
      isDayComplete(
        expected,
        new Map([
          ['a', 10],
          ['b', 4],
        ]),
      ),
    ).toBe(false);

    expect(isDayComplete(expected, new Map([['a', 10]]))).toBe(false);
  });
});
