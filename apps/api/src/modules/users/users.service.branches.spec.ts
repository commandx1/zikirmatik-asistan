import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';

const ID = new Types.ObjectId().toString();
const lean = (v: unknown) => ({
  lean: () => ({ exec: () => Promise.resolve(v) }),
});

describe('UsersService branches', () => {
  const userModel = {
    exists: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    Object.values(userModel).forEach((m) => m.mockReset());
    const noop = {} as never;
    service = new UsersService(
      userModel as never,
      ...(Array(17).fill(noop) as [
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
        never,
      ]),
      { transferFounderOnDelete: jest.fn() } as never,
    );
  });

  it('createUser: e-posta zaten kayıtlıysa 409; e-postasız misafir oluşturulur', async () => {
    userModel.exists.mockResolvedValueOnce({ _id: 'x' });
    await expect(service.createUser({ email: 'A@b.co' })).rejects.toThrow(
      ConflictException,
    );
    userModel.create.mockResolvedValue({
      toObject: () => ({ password: 'h', isPremium: false }),
    });
    const res = await service.createUser({ displayName: 'g' });
    expect(userModel.exists).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ isPremium: false }); // parola sızmaz
  });

  it('getUserById: bulunamayan ve geçersiz kimlik 404', async () => {
    userModel.findById.mockReturnValue(lean(null));
    await expect(service.getUserById(ID)).rejects.toThrow(NotFoundException);
    await expect(service.getUserById('nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('saveOnboarding: kullanıcı yoksa 404, varsa completedAt yazar', async () => {
    userModel.findByIdAndUpdate.mockReturnValueOnce(lean(null));
    await expect(service.saveOnboarding(ID, {})).rejects.toThrow(
      NotFoundException,
    );
    userModel.findByIdAndUpdate.mockReturnValueOnce(lean({ _id: 1 }));
    await service.saveOnboarding(ID, { goal: 'x' } as never);
    const [, update] = userModel.findByIdAndUpdate.mock.calls[1] as [
      unknown,
      { $set: { onboarding: { completedAt: Date; goal: string } } },
    ];
    expect(update.$set.onboarding.goal).toBe('x');
    expect(update.$set.onboarding.completedAt).toBeInstanceOf(Date);
  });

  it('savePreferences: yalnız verilen alanları yazar; kullanıcı yoksa 404', async () => {
    userModel.findByIdAndUpdate.mockReturnValue(lean({ _id: 1 }));
    await service.savePreferences(ID, {
      theme: 'dark',
      fontFamily: 'serif',
      dailyReminder: false,
      reminderTime: '07:30',
    } as never);
    const [, update] = userModel.findByIdAndUpdate.mock.calls[0] as [
      unknown,
      { $set: Record<string, unknown> },
    ];
    expect(update.$set).toMatchObject({
      theme: 'dark',
      fontFamily: 'serif',
      'notifSettings.dailyReminder': false,
      'notifSettings.reminderTime': '07:30',
    });
    await service.savePreferences(ID, {});
    const [, empty] = userModel.findByIdAndUpdate.mock.calls[1] as [
      unknown,
      { $set: Record<string, unknown> },
    ];
    expect(Object.keys(empty.$set)).toEqual(['lastSeenAt']);
    userModel.findByIdAndUpdate.mockReturnValue(lean(null));
    await expect(service.savePreferences(ID, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('findOrCreateFromAuth', () => {
    const existingDoc = (over: Record<string, unknown>) => ({
      save: jest.fn(),
      displayName: undefined,
      ...over,
    });

    it('mevcut kullanıcı: boş adı doldurur, fotoğrafı ve sağlayıcıyı günceller', async () => {
      const doc = existingDoc({});
      userModel.findOne.mockReturnValue({ exec: () => Promise.resolve(doc) });
      const res = await service.findOrCreateFromAuth({
        provider: 'apple',
        email: ' A@B.co ',
        displayName: 'Ayşe',
        profileImageUrl: 'u',
      });
      expect(res).toBe(doc);
      expect(doc).toMatchObject({
        displayName: 'Ayşe',
        profileImageUrl: 'u',
        authProvider: 'apple',
      });
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'a@b.co' });
    });

    it('mevcut kullanıcı: dolu adı ezmez, fotoğraf gelmediyse dokunmaz', async () => {
      const doc = existingDoc({ displayName: 'Eski' });
      userModel.findOne.mockReturnValue({ exec: () => Promise.resolve(doc) });
      await service.findOrCreateFromAuth({
        provider: 'google',
        email: 'a@b.co',
        displayName: 'Yeni',
      });
      expect(doc.displayName).toBe('Eski');
      expect((doc as Record<string, unknown>).profileImageUrl).toBeUndefined();
    });

    it('e-posta yoksa arama yapmadan misafir adıyla oluşturur', async () => {
      userModel.create.mockResolvedValue({});
      await service.findOrCreateFromAuth({ provider: 'apple' });
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: expect.any(String) as string,
          isPremium: false,
        }),
      );
    });
  });

  describe('touchAuthUser', () => {
    const select = (doc: unknown) => ({
      select: () => ({ exec: () => Promise.resolve(doc) }),
    });
    it('yoksa 404', async () => {
      userModel.findById.mockReturnValue(select(null));
      await expect(service.touchAuthUser(ID)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('boş adı ve fotoğrafı günceller, dolu adı korur', async () => {
      const doc = {
        _id: new Types.ObjectId(ID),
        displayName: '',
        email: 'e',
        save: jest.fn(),
      } as Record<string, unknown>;
      userModel.findById.mockReturnValue(select(doc));
      const out = await service.touchAuthUser(ID, {
        displayName: 'N',
        profileImageUrl: 'p',
      });
      expect(out).toEqual({
        id: ID,
        displayName: 'N',
        email: 'e',
        profileImageUrl: 'p',
      });
      const doc2 = {
        _id: new Types.ObjectId(ID),
        displayName: 'Var',
        save: jest.fn(),
      } as Record<string, unknown>;
      userModel.findById.mockReturnValue(select(doc2));
      await service.touchAuthUser(ID, { displayName: 'Başka' });
      expect(doc2.displayName).toBe('Var');
      await service.touchAuthUser(ID);
      expect(doc2.profileImageUrl).toBeUndefined();
    });
  });

  it('deleteUserAllData: geçersiz kimlik 404 ve hiçbir şey silinmez', async () => {
    await expect(service.deleteUserAllData('bad')).rejects.toThrow(
      NotFoundException,
    );
  });
});
