// components/AdBanner.tsx
import React from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

export default function AdBanner() {
  const unitId = __DEV__
    ? "ca-app-pub-3940256099942544/6300978111" // test
    : "ca-app-pub-4533962949749202/7206578732"; // your banner ID

  return (
    <View style={{ alignItems: "center", marginVertical: 10 }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
        onAdFailedToLoad={(err) => {
          console.log("Banner failed:", err);
        }}
      />
    </View>
  );
}
