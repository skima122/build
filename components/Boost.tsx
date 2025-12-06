// app/(tabs)/Boost.tsx
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useMemo } from "react";
import { auth } from "../firebase/firebaseConfig";
import { claimBoostReward } from "../firebase/user";
import { useMining } from "../hooks/useMining";
import { Timestamp } from "firebase/firestore";

function timeLeft(ms: number) {
  if (ms <= 0) return "0h 0m";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function Boost({ visible, onClose }: any) {
  const { boost } = useMining();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [cooldownMs, setCooldownMs] = useState(0);

  const usedToday = boost?.usedToday ?? 0;
  const remaining = Math.max(0, 3 - usedToday);

  // ----- DAILY RESET TIMER -----
  useEffect(() => {
    if (!boost?.lastReset) {
      setCooldownMs(0);
      return;
    }

    const last =
      (boost.lastReset as Timestamp).toMillis?.() ??
      Number(boost.lastReset);

    const DAY = 24 * 3600 * 1000;
    const diff = Date.now() - last;
    const remainingMs = Math.max(0, DAY - diff);
    setCooldownMs(remainingMs);

    const iv = setInterval(() => {
      const nowRemain = Math.max(0, DAY - (Date.now() - last));
      setCooldownMs(nowRemain);
    }, 1000 * 30);

    return () => clearInterval(iv);
  }, [boost?.lastReset]);

  // ----- FAKE AD COUNTDOWN -----
  useEffect(() => {
    if (!loading || timer === 0) return;
    const iv = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(iv);
  }, [loading, timer]);

  // ----- CLAIM BOOST -----
  const handleWatchAd = async () => {
    if (!auth.currentUser || loading) return;

    if (remaining <= 0) {
      setMessage("Daily boost limit reached (3/3).");
      return;
    }

    setLoading(true);
    setMessage("");
    setTimer(5); // simulated ad

    setTimeout(async () => {
      try {
        const reward = await claimBoostReward(auth.currentUser!.uid);

        if (reward === 0) {
          setMessage("Boost limit reached for today.");
        } else {
          setMessage(`+${reward.toFixed(1)} VAD added to your balance!`);
        }
      } catch (err) {
        console.error("Boost error:", err);
        setMessage("Boost failed. Try again.");
      } finally {
        setLoading(false);
        setTimer(0);
      }
    }, 5000);
  };

  const progressLabel = useMemo(() => {
    if (remaining === 0)
      return `Next reset in ${timeLeft(cooldownMs)}`;
    return `${remaining} boost${remaining === 1 ? "" : "s"} remaining today`;
  }, [remaining, cooldownMs]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>⚡ Boost Earnings</Text>
          <Text style={styles.sub}>
            Watch a short ad to instantly boost your mining balance.
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
            {loading ? (
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.watchText}>
                  Watching... ({timer}s)
                </Text>
              </View>
            ) : (
              <Text style={styles.watchText}>
                {remaining === 0 ? "No Boosts Left" : "Watch Ad"}
              </Text>
            )}
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
    gap: 10,
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
