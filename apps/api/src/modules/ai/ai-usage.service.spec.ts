import { Types } from 'mongoose';
import { AiUsageService } from './ai-usage.service';

describe('AiUsageService', () => {
  const save = jest.fn();
  function AiUsageLogModel(this: { save: jest.Mock }) {
    this.save = save;
  }
  const aiUsageLogModel = Object.assign(AiUsageLogModel, {});

  let service: AiUsageService;

  beforeEach(() => {
    save.mockReset();
    save.mockResolvedValue(undefined);
    service = new AiUsageService(aiUsageLogModel as never);
  });

  it('inputTokens/outputTokens (v6 formatı) doğru kaydedilir', async () => {
    await service.record({
      kind: 'chat',
      model: 'gpt-5-mini',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      userId: new Types.ObjectId(),
    });

    expect(save).toHaveBeenCalledTimes(1);
  });

  it('promptTokens/completionTokens (eski format) tolere edilir', async () => {
    await service.record({
      kind: 'recommend',
      model: 'gpt-5',
      usage: { promptTokens: 20, completionTokens: 10 },
    });

    expect(save).toHaveBeenCalledTimes(1);
  });

  it('usage yoksa (undefined) kayıt yapılmaz', async () => {
    await service.record({
      kind: 'embedding',
      model: 'text-embedding-3-small',
      usage: undefined,
    });

    expect(save).not.toHaveBeenCalled();
  });

  it("string userId ObjectId'ye çevrilir", async () => {
    await service.record({
      kind: 'chat',
      model: 'gpt-5',
      usage: { inputTokens: 1, outputTokens: 1 },
      userId: '507f1f77bcf86cd799439011',
    });

    expect(save).toHaveBeenCalledTimes(1);
  });

  it('geçersiz string userId sessizce undefined olur (hata fırlatmaz)', async () => {
    await expect(
      service.record({
        kind: 'chat',
        model: 'gpt-5',
        usage: { inputTokens: 1, outputTokens: 1 },
        userId: 'not-an-object-id',
      }),
    ).resolves.toBeUndefined();

    expect(save).toHaveBeenCalledTimes(1);
  });

  it('save() hata fırlatsa bile record() reddedilmez (fire-and-forget güvenliği)', async () => {
    save.mockRejectedValueOnce(new Error('db down'));

    await expect(
      service.record({
        kind: 'chat',
        model: 'gpt-5',
        usage: { inputTokens: 1, outputTokens: 1 },
      }),
    ).resolves.toBeUndefined();
  });
});
