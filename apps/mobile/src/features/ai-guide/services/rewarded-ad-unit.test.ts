import { describe, expect, it } from "vitest";
import { resolveRewardedUnitId, resolveRewardedUnitIdFromPublicEnv } from "./rewarded-ad-unit";

describe("resolveRewardedUnitId", () => {
  it("uses Google test rewarded unit in non-dev builds when test ads are enabled", () => {
    expect(
      resolveRewardedUnitId({
        env: {
          EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID: "ca-app-pub-real/android",
          EXPO_PUBLIC_ADMOB_USE_TEST_ADS: "1"
        },
        isDev: false,
        platform: "android"
      })
    ).toBe("ca-app-pub-3940256099942544/5224354917");
  });

  it("reads Expo public env values directly for bundled production builds", () => {
    const previous = process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS;
    process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS = "1";

    expect(resolveRewardedUnitIdFromPublicEnv({ isDev: false, platform: "android" })).toBe(
      "ca-app-pub-3940256099942544/5224354917"
    );

    process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS = previous;
  });
});
