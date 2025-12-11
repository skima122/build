// app/components/Boost.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";

import { useInterstitialAd } from "react-native-google-mobile-ads";
import { useMining } from "../hooks/useMining";

/* ----------------------------------------------------
   TYPES
---------------------------------------------------- */
type BoostProps = {
  visible: boolean;
  onClose?: () => void;
};

function timeLeft(ms: number) {
  if (!ms || ms <= 0) return "0h 0m";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

/* ----------------------------------------------------
   LAZY HELPERS
   (no static firebase imports here)
---------------------------------------------------- */
async function lazyGetAuthInstance() {
  const mod = await import("../firebase/firebaseConfig");
  return mod.getAuthInstance();
}

async function lazyClaimBoostReward(uid: string) {
  const mod = await import("../firebase/user");
  // export name in your file: claimBoostReward
  return mod.claimBoostReward(uid);
}

async function parseLastResetToMs(value: any): Promise<number> {
  // Try firebase Timestamp shape (has toMillis)
  try {
    if (value && typeof value.toMillis === "function") {
      return value.toMillis();
    }
  } catch {
    // ignore
  }

  // If it's numeric-like
  const n = Number(value);
  if (Number.isFinite(n)) return n;

  return 0;
}

/* ----------------------------------------------------
   COMPONENT
---------------------------------------------------- */
export default function Boost({ visible, onClose }: BoostProps) {
  const { boost } = useMining();

  // Defensive: snapshot boost object
  const boostSafe = useMemo(() => {
    if (!boost) return null;
    // expected fields: usedToday, lastReset, balance
    return {
      usedToday: typeof boost.usedToday === "number" ? boost.usedToday : 0,
      lastReset: boost.lastReset ?? null,
      balance: typeof boost.balance === "number" ? boost.balance : 0,
    };
  }, [boost]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldownMs, setCooldownMs] = useState(0);

  const mountedRef = useRef(true);
  const rewardPendingRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    loadingRef.current = loading;
    return () => {
      mountedRef.current = false;
    };
  }, [loading]);

  /* ----------------------------------------------------
     AD SETUP (useMemo so adUnitId is stable)
  ---------------------------------------------------- */
  const adUnitId = useMemo(
    () =>
      __DEV__
        ? "ca-app-pub-3940256099942544/1033173712"
        : "YOUR_REAL_PROD_AD_UNIT_ID",
    []
  );

  const { isLoaded, isClosed, load, show } = useInterstitialAd(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  /* ----------------------------------------------------
     AUTO CLOSE WHEN LOGGED OUT (lazy auth)
  ---------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!visible) return;
      try {
        const auth = await lazyGetAuthInstance();
        if (cancelled) return;
        if (!auth?.currentUser) onClose?.();
      } catch {
        // ignore auth errors here
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, onClose]);

  /* ----------------------------------------------------
     COOLDOWN TIMER
  ---------------------------------------------------- */
  useEffect(() => {
    let iv: number | null = null;
    let lastMs = 0;

    (async () => {
      try {
        lastMs = await parseLastResetToMs(boostSafe?.lastReset);
      } catch {
        lastMs = 0;
      }

      const DAY = 86400000;

      const update = () => {
        if (!mountedRef.current) return;
        const remain = Math.max(0, DAY - (Date.now() - lastMs));
        setCooldownMs(remain);
      };

      update();
      iv = global.setInterval(update, 30000);
    })();

    return () => {
      if (iv) clearInterval(iv);
    };
  }, [boostSafe?.lastReset]);

  /* ----------------------------------------------------
     PRELOAD AD WHEN MODAL OPENS
  ---------------------------------------------------- */
  useEffect(() => {
    if (visible) {
      // attempt to load ad (idempotent)
      try {
        load();
      } catch (e) {
        // ignore
      }
    }
  }, [visible, load]);

  /* ----------------------------------------------------
     WHEN AD CLOSES -> GRANT REWARD (lazy claim)
  ---------------------------------------------------- */
  useEffect(() => {
    if (!isClosed || !rewardPendingRef.current) return;

    // reset pending flag immediately to avoid duplicates
    rewardPendingRef.current = false;

    (async () => {
      try {
        const auth = await lazyGetAuthInstance();
        const user = auth?.currentUser;
        if (!user || !mountedRef.current) {
          if (mountedRef.current) {
            setMessage("Not authenticated.");
            setLoading(false);
          }
          return;
        }

        const reward = await lazyClaimBoostReward(user.uid);

        if (!mountedRef.current) return;

        if (reward === 0) {
          setMessage("Boost limit reached.");
        } else {
          setMessage(`+${reward.toFixed(1)} VAD added!`);
        }
      } catch (err) {
        console.error("Boost reward error:", err);
        if (mountedRef.current) setMessage("Boost failed.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [isClosed]);

  /* ----------------------------------------------------
     HANDLE WATCH AD BUTTON
  ---------------------------------------------------- */
  const usedToday = boostSafe?.usedToday ?? 0;
  const remaining = Math.max(0, 3 - usedToday);

  const handleWatchAd = async () => {
    // Prevent double invocation
    if (loadingRef.current) return;

    setMessage("");
    setLoading(true);
    loadingRef.current = true;
    rewardPendingRef.current = true;

    try {
      const auth = await lazyGetAuthInstance();
      const user = auth?.currentUser;
      if (!user) {
        setMessage("Login required.");
        setLoading(false);
        loadingRef.current = false;
        rewardPendingRef.current = false;
        return;
      }

      if (remaining <= 0) {
        setMessage("No boosts left today.");
        setLoading(false);
        loadingRef.current = false;
        rewardPendingRef.current = false;
        return;
      }

      // If not loaded, request load and wait for load; don't call show() immediately
      if (!isLoaded) {
        // attempt to load and wait a short time
        try {
          load();
          // give it a small grace period to load before returning control
          // user will tap again when ready (keeps UI responsive)
        } catch {
          // ignore load errors
        }
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      // show ad (native)
      try {
        show();
      } catch (err) {
        // show failed: clear pending and inform user
        rewardPendingRef.current = false;
        setMessage("Failed to show ad.");
        setLoading(false);
        loadingRef.current = false;
      }
    } catch (err) {
      console.error("handleWatchAd error:", err);
      rewardPendingRef.current = false;
      setMessage("Ad failed to start.");
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const progressLabel = useMemo(() => {
    return remaining === 0
      ? `Next reset in ${timeLeft(cooldownMs)}`
      : `${remaining} boosts remaining today`;
  }, [remaining, cooldownMs]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>⚡ Boost Earnings</Text>

          <Text style={styles.sub}>
            Watch a short ad to boost your balance.
          </Text>

          <View style={styles.rewardBox}>
            <Text style={styles.reward}>+0.5 VAD</Text>
            <Text style={styles.limit}>{progressLabel}</Text>
          </View>

          <View style={styles.usesRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.useDot,
                  i < usedToday && styles.useDotActive,
                  i < 2 ? { marginRight: 10 } : undefined,
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleWatchAd}
            disabled={loading || remaining === 0}
            style={[
              styles.watchBtn,
              (loading || remaining === 0) && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.watchText}>
              {loading
                ? "Loading ad..."
                : remaining === 0
                ? "No Boosts Left"
                : "Watch Ad"}
            </Text>
          </Pressable>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------
      STYLES (kept as you provided)
-------------------------------------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,5,15,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "92%",
    borderRadius: 26,
    padding: 26,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.5)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 15,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  sub: {
    color: "#9FA8C7",
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  rewardBox: {
    marginTop: 22,
    backgroundColor: "rgba(139,92,246,0.18)",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },

  reward: {
    color: "#A78BFA",
    fontSize: 30,
    fontWeight: "900",
  },

  limit: {
    color: "#9FA8C7",
    fontSize: 12,
    marginTop: 6,
  },

  usesRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  useDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#2C2F48",
    borderWidth: 1,
    borderColor: "#3B3F63",
  },

  useDotActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },

  watchBtn: {
    marginTop: 22,
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },

  watchText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  message: {
    marginTop: 16,
    color: "#34D399",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 13,
  },

  closeBtn: {
    marginTop: 24,
    alignItems: "center",
  },

  closeText: {
    color: "#A1A7C6",
    fontSize: 13,
    fontWeight: "600",
  },
});
