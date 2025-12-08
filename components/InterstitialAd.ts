import { useEffect, useRef } from "react";
import { AdMobInterstitial } from "expo-ads-admob";

export async function showInterstitial() {
  try {
    const unitId = __DEV__
      ? "ca-app-pub-3940256099942544/1033173712" // test ID
      : "ca-app-pub-4533962949749202/xxxxxxxxxx"; // your real ID

    await AdMobInterstitial.setAdUnitID(unitId);
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();
  } catch (error) {
    console.log("Interstitial failed:", error);
  }
}
