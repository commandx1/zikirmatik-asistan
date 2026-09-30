import { circleCompletedPush } from '../circles/circles.constants';
import { selectKandilCandidates } from './campaigns/kandil.campaign';
import { selectWinbackCandidates } from './campaigns/winback.campaign';
import { PushCampaignsService } from './push-campaigns.service';
import {
  weeklySummaryFreeTemplate,
  weeklySummaryPremiumTemplate,
  winbackTemplate,
} from './templates';

describe('push template locale selection', () => {
  it.each([
    ['en', 'Zikirmatik is waiting for you'],
    ['tr', 'Zikirmatik seni bekliyor'],
    [undefined, 'Zikirmatik seni bekliyor'],
  ] as const)('winback day3 for locale %s', (locale, title) => {
    expect(winbackTemplate('day3', locale).title).toBe(title);
  });

  it('circle completed push: en, tr and missing locale', () => {
    expect(circleCompletedPush('X', 'en').title).toBe(
      'Circle reached its goal',
    );
    expect(circleCompletedPush('X', 'tr').title).toBe(
      'Halka hedefini tamamladı',
    );
    expect(circleCompletedPush('X')).toEqual(circleCompletedPush('X', 'tr'));
  });

  it('winback candidates pick text per device and carry the timezone', () => {
    const now = new Date('2026-06-15T07:00:00.000Z');
    const lastSeenAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const { candidates } = selectWinbackCandidates(
      [
        {
          deviceId: 'a',
          lastSeenAt,
          locale: 'en',
          timezone: 'America/New_York',
        },
        { deviceId: 'b', lastSeenAt },
      ],
      now,
    );
    expect(candidates[0]).toMatchObject({
      title: 'Zikirmatik is waiting for you',
      timezone: 'America/New_York',
    });
    expect(candidates[1].title).toBe('Zikirmatik seni bekliyor');
    expect(candidates[1].timezone).toBeUndefined();
  });

  it('kandil uses the English name for en devices, Turkish name otherwise', () => {
    const day = {
      id: '1',
      nameTr: 'Regaib Kandili',
      nameEn: 'Laylat al-Raghaib',
    };
    const { candidates } = selectKandilCandidates(
      [day],
      [{ deviceId: 'en', locale: 'en' }, { deviceId: 'tr' }],
      'eve',
    );
    expect(candidates[0].title).toBe('Laylat al-Raghaib');
    expect(candidates[0].body).toBe(
      'Laylat al-Raghaib is tomorrow. Take a look at the special day guide to prepare.',
    );
    expect(candidates[1].body).toBe(
      'Yarın Regaib Kandili. Hazırlık için özel gün rehberine göz at.',
    );

    const noEnName = selectKandilCandidates(
      [{ id: '1', nameTr: 'Regaib Kandili' }],
      [{ deviceId: 'en', locale: 'en' }],
      'day',
    );
    expect(noEnName.candidates[0].title).toBe('Regaib Kandili');
  });
});

describe('weekly summary plurals', () => {
  it('uses singular English forms for 1 and plural for 2', () => {
    expect(weeklySummaryPremiumTemplate(1, 1, 'en').body).toBe(
      'Last week: 1 dhikr, 1 active day. Keep it up!',
    );
    expect(weeklySummaryPremiumTemplate(2, 2, 'en').body).toBe(
      'Last week: 2 dhikrs, 2 active days. Keep it up!',
    );
    expect(weeklySummaryFreeTemplate(1, 'en').body).toBe(
      'Last week: 1 dhikr. Your detailed weekly report is in Premium.',
    );
    expect(weeklySummaryFreeTemplate(2, 'en').body).toBe(
      'Last week: 2 dhikrs. Your detailed weekly report is in Premium.',
    );
  });

  it('keeps Turkish output unchanged', () => {
    expect(weeklySummaryPremiumTemplate(1, 1).body).toBe(
      'Geçen hafta 1 zikir, 1 aktif gün. Böyle devam!',
    );
    expect(weeklySummaryFreeTemplate(2).body).toBe(
      "Geçen hafta 2 zikir. Detaylı haftalık raporun Premium'da.",
    );
  });
});

describe('PushCampaignsService per-device quiet hours', () => {
  const pushDispatchModel = {
    create: jest.fn(),
    updateOne: jest.fn(),
    find: jest.fn(),
  };
  const pushSender = { sendToDevices: jest.fn() };
  const winbackCampaign = { buildCandidates: jest.fn() };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('skips a device at 03:00 local time while an Istanbul device in daytime is sent', async () => {
    // 10:00 İstanbul, 03:00 New York.
    jest.setSystemTime(new Date('2026-06-15T07:00:00.000Z'));
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [
        {
          deviceId: 'ny',
          expoPushToken: 'ExponentPushToken[a]',
          title: 't',
          body: 'b',
          timezone: 'America/New_York',
        },
        {
          deviceId: 'ist',
          expoPushToken: 'ExponentPushToken[b]',
          title: 't',
          body: 'b',
        },
      ],
      skippedPrefs: 0,
    });
    pushDispatchModel.create.mockResolvedValue({});
    pushSender.sendToDevices.mockResolvedValue({});

    const service = new PushCampaignsService(
      pushDispatchModel as never,
      pushSender as never,
      winbackCampaign as never,
      {} as never,
      {} as never,
    );
    const result = await service.run('winback');

    expect(result.sent).toBe(1);
    expect(result.skipped.quietHours).toBe(1);
    expect(pushDispatchModel.create).toHaveBeenCalledTimes(1);
    expect(pushDispatchModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'ist' }),
    );
    const [targets] = pushSender.sendToDevices.mock.calls[0] as [
      { deviceId: string }[],
    ];
    expect(targets).toEqual([
      { deviceId: 'ist', expoPushToken: 'ExponentPushToken[b]' },
    ]);
  });
});
