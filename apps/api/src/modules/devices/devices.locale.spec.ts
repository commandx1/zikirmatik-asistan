import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

describe('DevicesService locale/timezone', () => {
  const deviceModel = { findOneAndUpdate: jest.fn() };
  const service = new DevicesService(deviceModel as never);

  beforeEach(() => {
    deviceModel.findOneAndUpdate.mockReset().mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue({}) }),
    });
  });

  function update() {
    const [call] = deviceModel.findOneAndUpdate.mock.calls as [
      unknown,
      { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> },
    ][];
    return call[1];
  }

  it('stores locale and timezone when provided', async () => {
    await service.register({
      deviceId: 'device-1',
      platform: 'android',
      locale: 'en',
      timezone: 'America/Chicago',
    });
    expect(update().$set).toMatchObject({
      locale: 'en',
      timezone: 'America/Chicago',
    });
  });

  it('registering without locale/timezone leaves the stored values intact', async () => {
    await service.register({ deviceId: 'device-1', platform: 'android' });
    const { $set, $setOnInsert } = update();
    expect($set).not.toHaveProperty('locale');
    expect($set).not.toHaveProperty('timezone');
    expect($setOnInsert).not.toHaveProperty('locale');
    expect($setOnInsert).not.toHaveProperty('timezone');
  });

  it.each([
    [{ locale: 'en', timezone: 'Europe/London' }, 0],
    [{}, 0],
    [{ locale: 'de' }, 1],
    [{ timezone: 'Mars/Base' }, 1],
  ])('validates optional fields %j', (extra, errorCount) => {
    const dto = plainToInstance(RegisterDeviceDto, {
      deviceId: 'device-1',
      platform: 'ios',
      ...extra,
    });
    expect(validateSync(dto)).toHaveLength(errorCount);
  });
});
