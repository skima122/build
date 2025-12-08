// components/InterstitialAd.ts
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

const unitId = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-4533962949749202/2761859275"; // ← YOUR REAL ID

export function showInterstitial() {
  const interstitial = InterstitialAd.createForAdRequest(unitId);

  return new Promise<void>((resolve, reject) => {
    const loadedListener = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => interstitial.show()
    );

    const errorListener = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log("Interstitial error:", error);
        loadedListener();
        errorListener();
        closedListener();
        reject(error);
      }
    );

    const closedListener = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        loadedListener();
        errorListener();
        closedListener();
        resolve();
      }
    );

    interstitial.load();
  });
}
