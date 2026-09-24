import type { Model } from 'mongoose';
import type { DhikrDocument } from '../../src/modules/dhikrs/schemas/dhikr.schema';
import request from 'supertest';
import type { App } from 'supertest/types';

export type SignInResult = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  displayName: string;
  isNewUser: boolean;
};

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export const data = <T>(res: { body: { data: unknown } }) => res.body.data as T;

// AUTH_ALLOW_INSECURE_TEST_TOKENS=1: `{` ile başlayan idToken JSON claims olarak
// okunur (auth.service.ts verifyProviderToken). android yalnız google kabul eder.
export async function signIn(
  http: App,
  claims: {
    sub: string;
    email?: string;
    name?: string;
    provider?: 'google' | 'apple';
    platform?: 'android' | 'ios';
    deviceId?: string;
  },
): Promise<SignInResult> {
  const {
    provider = 'google',
    platform = 'android',
    deviceId,
    ...rest
  } = claims;
  const res = await request(http)
    .post('/v1/auth/provider/verify')
    .send({
      provider,
      platform,
      idToken: JSON.stringify(rest),
      deviceId: deviceId ?? `e2e-device-${rest.sub}`,
    })
    .expect(200);
  return data<SignInResult>(res);
}

export async function makePremium(userModel: Model<any>, userId: string) {
  await userModel.updateOne({ _id: userId }, { $set: { isPremium: true } });
}

let dhikrSeq = 0;

export async function seedDhikr(
  dhikrModel: Model<DhikrDocument>,
  overrides: Record<string, unknown> & { key?: string } = {},
) {
  const key = overrides.key ?? `e2e-dhikr-${++dhikrSeq}`;
  const localized = { tr: `tr-${key}`, en: `en-${key}` };
  const dhikr = await dhikrModel.create({
    key,
    nameArabic: 'سبحان الله',
    name: localized,
    transliteration: localized,
    meaning: localized,
    virtue: localized,
    source: localized,
    isActive: true,
    ...overrides,
  });
  return String(dhikr._id);
}
