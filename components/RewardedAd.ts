import { useCallback } from "react";
import { AdMobRewarded } from "expo-ads-admob";

export async function showRewardedAd(onReward?: () => void) {
  try {
    const unitId = __DEV__
      ? "ca-app-pub-3940256099942544/5224354917" // test ID
      : "ca-app-pub-4533962949749202/yyyyyyyyyy"; // your real rewarded ID

    await AdMobRewarded.setAdUnitID(unitId);

    AdMobRewarded.addEventListener("rewardedVideoUserDidEarnReward", () => {
      console.log("User earned reward");
      onReward && onReward();
    });

    await AdMobRewarded.requestAdAsync({ servePersonalizedAds: true });
    await AdMobRewarded.showAdAsync();
  } catch (err) {
    console.log("Rewarded failed:", err);
  }
}
