import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PushCampaignsController } from './push-campaigns.controller';

describe('PushCampaignsController', () => {
  const pushCampaignsService = { run: jest.fn() };
  const configService = { get: jest.fn() };

  let controller: PushCampaignsController;

  function mockEnv(secret: string | undefined, nodeEnv: string | undefined) {
    configService.get.mockImplementation((key: string) => {
      if (key === 'CAMPAIGN_TRIGGER_SECRET') return secret;
      if (key === 'NODE_ENV') return nodeEnv;
      return undefined;
    });
  }

  beforeEach(() => {
    pushCampaignsService.run
      .mockReset()
      .mockResolvedValue({ campaign: 'winback' });
    configService.get.mockReset();

    controller = new PushCampaignsController(
      pushCampaignsService as never,
      configService as never,
    );
  });

  it('rejects a request with the wrong secret (401)', async () => {
    mockEnv('correct-secret', 'production');

    await expect(
      controller.trigger('winback', 'wrong-secret', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(pushCampaignsService.run).not.toHaveBeenCalled();
  });

  it('rejects every request in production when no secret is configured (fail-closed)', async () => {
    mockEnv(undefined, 'production');

    await expect(
      controller.trigger('winback', undefined, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(pushCampaignsService.run).not.toHaveBeenCalled();
  });

  it('bypasses the secret check in development when none is configured', async () => {
    mockEnv(undefined, 'development');

    await controller.trigger('winback', undefined, {});

    expect(pushCampaignsService.run).toHaveBeenCalledWith('winback', {
      dryRun: false,
      force: false,
    });
  });

  it('accepts a request with the correct secret and forwards dryRun/force', async () => {
    mockEnv('shh', 'production');

    await controller.trigger('kandil-eve', 'shh', {
      dryRun: true,
      force: true,
    });

    expect(pushCampaignsService.run).toHaveBeenCalledWith('kandil-eve', {
      dryRun: true,
      force: true,
    });
  });

  it('rejects an unknown campaign name (400)', async () => {
    mockEnv('shh', 'production');

    await expect(
      controller.trigger('not-a-campaign', 'shh', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pushCampaignsService.run).not.toHaveBeenCalled();
  });

  it('checks the secret before validating the campaign name', async () => {
    mockEnv('shh', 'production');

    await expect(
      controller.trigger('not-a-campaign', 'wrong', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
