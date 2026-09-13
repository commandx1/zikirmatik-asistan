import { PushCampaignsService } from './push-campaigns.service';
import type { CampaignCandidate } from './push-campaigns.types';

describe('PushCampaignsService', () => {
  const pushDispatchModel = {
    create: jest.fn(),
    updateOne: jest.fn(),
    find: jest.fn(),
  };
  const pushSender = { sendToDevices: jest.fn() };
  const winbackCampaign = { buildCandidates: jest.fn() };
  const kandilCampaign = { buildCandidates: jest.fn() };
  const weeklySummaryCampaign = { buildCandidates: jest.fn() };

  let service: PushCampaignsService;

  // 10:00 İstanbul — sessiz saatin dışında, testler için nötr bir an.
  const DAY_TIME = new Date('2026-06-15T07:00:00.000Z');
  // 23:00 İstanbul — sessiz saat içinde.
  const NIGHT_TIME = new Date('2026-06-15T20:00:00.000Z');

  const candidate = (
    overrides: Partial<CampaignCandidate> = {},
  ): CampaignCandidate => ({
    deviceId: 'device-1',
    expoPushToken: 'ExponentPushToken[abc]',
    title: 'Başlık',
    body: 'Gövde',
    data: { route: '/(tabs)/home' },
    meta: { window: 'day3' },
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers();

    pushDispatchModel.create.mockReset();
    pushDispatchModel.updateOne
      .mockReset()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    pushDispatchModel.find.mockReset();
    pushSender.sendToDevices.mockReset();
    winbackCampaign.buildCandidates.mockReset();
    kandilCampaign.buildCandidates.mockReset();
    weeklySummaryCampaign.buildCandidates.mockReset();

    service = new PushCampaignsService(
      pushDispatchModel as never,
      pushSender as never,
      winbackCampaign as never,
      kandilCampaign as never,
      weeklySummaryCampaign as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reserves before sending and reports sent/dayKey/candidates', async () => {
    jest.setSystemTime(DAY_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [candidate()],
      skippedPrefs: 0,
    });
    pushDispatchModel.create.mockResolvedValue({});
    pushSender.sendToDevices.mockResolvedValue({
      sentCount: 1,
      skippedCount: 0,
      ticketErrorCount: 0,
      deactivatedDeviceIds: [],
    });

    const result = await service.run('winback');

    expect(pushDispatchModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignKey: 'winback',
        deviceId: 'device-1',
        dayKey: '2026-06-15',
      }),
    );
    expect(pushSender.sendToDevices).toHaveBeenCalledWith(
      [{ deviceId: 'device-1', expoPushToken: 'ExponentPushToken[abc]' }],
      { title: 'Başlık', body: 'Gövde', data: { route: '/(tabs)/home' } },
    );
    expect(result).toEqual({
      campaign: 'winback',
      dayKey: '2026-06-15',
      candidates: 1,
      sent: 1,
      skipped: { dedupe: 0, quietHours: 0, noToken: 0, prefs: 0, error: 0 },
      dryRun: false,
    });
  });

  it('skips a candidate whose reservation hits a duplicate key error (dedupe)', async () => {
    jest.setSystemTime(DAY_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [candidate()],
      skippedPrefs: 0,
    });
    pushDispatchModel.create.mockRejectedValue(
      Object.assign(new Error('E11000 duplicate key'), { code: 11000 }),
    );

    const result = await service.run('winback');

    expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    expect(result.skipped.dedupe).toBe(1);
  });

  it('does not reserve or send anything during quiet hours unless forced', async () => {
    jest.setSystemTime(NIGHT_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [candidate(), candidate({ deviceId: 'device-2' })],
      skippedPrefs: 0,
    });

    const result = await service.run('winback');

    expect(pushDispatchModel.create).not.toHaveBeenCalled();
    expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    expect(result.skipped.quietHours).toBe(2);
    expect(result.sent).toBe(0);
  });

  it('sends during quiet hours when force is true', async () => {
    jest.setSystemTime(NIGHT_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [candidate()],
      skippedPrefs: 0,
    });
    pushDispatchModel.create.mockResolvedValue({});
    pushSender.sendToDevices.mockResolvedValue({
      sentCount: 1,
      skippedCount: 0,
      ticketErrorCount: 0,
      deactivatedDeviceIds: [],
    });

    const result = await service.run('winback', { force: true });

    expect(result.skipped.quietHours).toBe(0);
    expect(result.sent).toBe(1);
  });

  it('keeps the reservation and records meta.error when sending throws', async () => {
    jest.setSystemTime(DAY_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [candidate()],
      skippedPrefs: 0,
    });
    pushDispatchModel.create.mockResolvedValue({});
    pushSender.sendToDevices.mockRejectedValue(new Error('network blip'));

    const result = await service.run('winback');

    expect(result.sent).toBe(0);
    expect(result.skipped.error).toBe(1);
    expect(pushDispatchModel.updateOne).toHaveBeenCalledWith(
      { campaignKey: 'winback', deviceId: 'device-1', dayKey: '2026-06-15' },
      { $set: { 'meta.error': 'network blip' } },
    );
  });

  it('does not create a reservation or call the push sender in dry-run mode', async () => {
    jest.setSystemTime(DAY_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [candidate(), candidate({ deviceId: 'device-2' })],
      skippedPrefs: 0,
    });
    pushDispatchModel.find.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: jest.fn().mockResolvedValue([{ deviceId: 'device-1' }]),
        }),
      }),
    });

    const result = await service.run('winback', { dryRun: true });

    expect(pushDispatchModel.create).not.toHaveBeenCalled();
    expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    // device-1 zaten bugün gönderim almış (dedupe), device-2 gönderilebilir.
    expect(result.skipped.dedupe).toBe(1);
    expect(result.sent).toBe(1);
  });

  it('surfaces the prefs skip count returned by the campaign builder', async () => {
    jest.setSystemTime(DAY_TIME);
    winbackCampaign.buildCandidates.mockResolvedValue({
      candidates: [],
      skippedPrefs: 3,
    });

    const result = await service.run('winback');

    expect(result.skipped.prefs).toBe(3);
    expect(result.candidates).toBe(0);
  });

  it('routes each campaign key to its own builder', async () => {
    jest.setSystemTime(DAY_TIME);
    kandilCampaign.buildCandidates.mockResolvedValue({
      candidates: [],
      skippedPrefs: 0,
    });
    weeklySummaryCampaign.buildCandidates.mockResolvedValue({
      candidates: [],
      skippedPrefs: 0,
    });

    await service.run('kandil-eve');
    expect(kandilCampaign.buildCandidates).toHaveBeenCalledWith(
      'eve',
      DAY_TIME,
    );

    await service.run('kandil-day');
    expect(kandilCampaign.buildCandidates).toHaveBeenCalledWith(
      'day',
      DAY_TIME,
    );

    await service.run('weekly-summary');
    expect(weeklySummaryCampaign.buildCandidates).toHaveBeenCalledWith(
      DAY_TIME,
    );
  });
});
