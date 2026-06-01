import { Platform } from "react-native";
import { resolveRewardedUnitId } from "./rewarded-ad-unit";

let initializePromise: Promise<unknown> | null = null;
let mobileAdsModulePromise: Promise<typeof import("react-native-google-mobile-ads") | null> | null = null;

async function loadMobileAdsModule() {
  if (!mobileAdsModulePromise) {
    mobileAdsModulePromise = import("react-native-google-mobile-ads")
      .then((module) => module)
      .catch(() => null);
  }

  return mobileAdsModulePromise;
}

async function ensureInitialized(module: typeof import("react-native-google-mobile-ads")) {
  if (!initializePromise) {
    initializePromise = module.default().initialize();
  }

  await initializePromise;
}

export async function showRewardedAdGate(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const module = await loadMobileAdsModule();
  if (!module) {
    return false;
  }

  try {
    await ensureInitialized(module);
  } catch {
    return false;
  }

  const rewardedUnitId = resolveRewardedUnitId({
    env: process.env,
    isDev: __DEV__,
    platform: Platform.OS
  });
  if (!rewardedUnitId) {
    return false;
  }

  const ad = module.RewardedAd.createForAdRequest(rewardedUnitId, {
    requestNonPersonalizedAdsOnly: true
  });

  return new Promise((resolve) => {
    let rewarded = false;
    let settled = false;

    const settle = (value: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      unsubscribeReward();
      resolve(value);
    };

    const unsubscribeLoaded = ad.addAdEventListener(module.RewardedAdEventType.LOADED, () => {
      ad.show().catch(() => settle(false));
    });

    const unsubscribeClosed = ad.addAdEventListener(module.AdEventType.CLOSED, () => {
      settle(rewarded);
    });

    const unsubscribeError = ad.addAdEventListener(module.AdEventType.ERROR, (error) => {
      if (__DEV__) {
        console.log("[AdMob Rewarded] load/show error:", error);
      }
      settle(false);
    });

    const unsubscribeReward = ad.addAdEventListener(module.RewardedAdEventType.EARNED_REWARD, () => {
      rewarded = true;
    });

    try {
      ad.load();
    } catch {
      settle(false);
    }
  });
}
