// components/RewardedAd.ts
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// Real production rewarded ID
const unitId = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-4533962949749202/1804000824";

export function showRewardedAd(onReward?: (reward: { amount: number; type: string }) => void) {
  const rewarded = RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise<void>((resolve, reject) => {
    const loadedListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        rewarded.show();
      }
    );

    const earnedListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log("User earned reward:", reward);
        if (onReward) onReward(reward); // callback
      }
    );

    const errorListener = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log("Rewarded error:", error);
        removeAll();
        reject(error);
      }
    );

    const closedListener = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        removeAll();
        resolve();
      }
    );

    function removeAll() {
      loadedListener();
      earnedListener();
      errorListener();
      closedListener();
    }

    rewarded.load();
  });
}
