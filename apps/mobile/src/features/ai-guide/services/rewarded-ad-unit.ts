export const TEST_ANDROID_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";
export const TEST_IOS_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/1712485313";

type RewardedPlatform = "android" | "ios" | "web" | string;

type RewardedAdUnitOptions = {
  env: Partial<Record<string, string | undefined>>;
  isDev: boolean;
  platform: RewardedPlatform;
};

export function resolveRewardedUnitId({ env, isDev, platform }: RewardedAdUnitOptions): string | null {
  if (platform === "web") {
    return null;
  }

  const testUnitId = platform === "ios" ? TEST_IOS_REWARDED_UNIT_ID : TEST_ANDROID_REWARDED_UNIT_ID;
  const configured =
    platform === "ios"
      ? env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_IOS?.trim()
      : env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID?.trim();

  if (env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS === "1") {
    return testUnitId;
  }

  if (isDev) {
    const allowRealAdsInDev = env.EXPO_PUBLIC_ADMOB_USE_REAL_ADS_IN_DEV === "1";
    if (allowRealAdsInDev && configured) {
      return configured;
    }
    return testUnitId;
  }

  return configured || null;
}

export function resolveRewardedUnitIdFromPublicEnv({
  isDev,
  platform
}: Omit<RewardedAdUnitOptions, "env">): string | null {
  return resolveRewardedUnitId({
    env: {
      EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID,
      EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_IOS: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_IOS,
      EXPO_PUBLIC_ADMOB_USE_REAL_ADS_IN_DEV: process.env.EXPO_PUBLIC_ADMOB_USE_REAL_ADS_IN_DEV,
      EXPO_PUBLIC_ADMOB_USE_TEST_ADS: process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS
    },
    isDev,
    platform
  });
}
