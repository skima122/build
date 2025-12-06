// components/DailyClaim.tsx
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { claimDailyReward } from "../firebase/user";
import { useMining } from "../hooks/useMining";
import { Timestamp } from "firebase/firestore";

const STREAK_REWARDS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 2.0];

function fmtTimeLeft(ms: number) {
  if (ms <= 0) return "0h 0m";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function DailyClaim({ visible, onClose }: any) {
  const { dailyClaim } = useMining();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0); // countdown seconds while "ad" plays
  const [cooldownMs, setCooldownMs] = useState<number>(0);

  // update cooldown based on dailyClaim.lastClaim
  useEffect(() => {
    if (!dailyClaim || !dailyClaim.lastClaim) {
      setCooldownMs(0);
      return;
    }

    const last = (dailyClaim.lastClaim as Timestamp).toMillis
      ? (dailyClaim.lastClaim as Timestamp).toMillis()
      : Number(dailyClaim.lastClaim);

    const DAY = 24 * 3600 * 1000;
    const diff = Date.now() - last;
    const remaining = Math.max(0, DAY - diff);
    setCooldownMs(remaining);

    // update live countdown every minute
    const iv = setInterval(() => {
      const nowRemaining = Math.max(0, DAY - (Date.now() - last));
      setCooldownMs(nowRemaining);
    }, 1000 * 30);

    return () => clearInterval(iv);
  }, [dailyClaim]);

  // local countdown while ad is simulating
  useEffect(() => {
    if (!loading || timer === 0) return;
    const iv = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [loading, timer]);

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("Please log in to claim.");
      return;
    }

    // If cooldown exists, block
    if (cooldownMs > 0) {
      setMessage("Already claimed — come back later.");
      return;
    }

    setLoading(true);
    setMessage("");
    setTimer(5); // 5s fake interstitial

    // simulated ad playback
    setTimeout(async () => {
      try {
        const reward = await claimDailyReward(user.uid);

        if (reward === 0) {
          setMessage("Already claimed for today.");
        } else {
          setMessage(`+${reward.toFixed(1)} VAD added to your balance!`);
        }
      } catch (err) {
        console.error("claimDailyReward error", err);
        setMessage("Claim failed. Try again.");
      } finally {
        setLoading(false);
        setTimer(0);
      }
    }, 5000);
  };

  // derive streak & claimed status from server
  const streak = dailyClaim?.streak ?? 0;
  const lastClaimTs = dailyClaim?.lastClaim ?? null;
  const todayClaimed = (() => {
    if (!lastClaimTs) return false;
    const lastMs =
      (lastClaimTs as Timestamp).toMillis?.() ?? Number(lastClaimTs);
    return Date.now() - lastMs < 24 * 3600 * 1000;
  })();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🔥 Daily Check-In</Text>
          <Text style={styles.sub}>
            Claim once every 24 hours. Keep your streak to increase rewards.
          </Text>

          <View style={styles.grid}>
            {STREAK_REWARDS.map((r, i) => {
              const day = i + 1;
              const claimed = day <= streak;
              return (
                <View
                  key={day}
                  style={[styles.dayBox, claimed ? styles.dayClaimed : undefined]}
                >
                  <Text style={styles.dayLabel}>Day {day}</Text>
                  <Text style={[styles.dayReward, claimed && styles.claimedText]}>
                    +{r} VAD
                  </Text>
                  {claimed && <Text style={styles.check}>✔</Text>}
                </View>
              );
            })}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Streak: <Text style={{ fontWeight: "900" }}>{streak} day(s)</Text>
            </Text>

            <Text style={styles.metaText}>
              Next:{" "}
              <Text style={{ fontWeight: "900" }}>
                {cooldownMs > 0 ? fmtTimeLeft(cooldownMs) : "Available now"}
              </Text>
            </Text>
          </View>

          <Pressable
            onPress={handleClaim}
            disabled={loading || cooldownMs > 0}
            style={[
              styles.claimBtn,
              (loading || cooldownMs > 0) && { opacity: 0.65 },
            ]}
          >
            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#000" />
                <Text style={styles.claimText}>Watching... ({timer}s)</Text>
              </View>
            ) : (
              <Text style={styles.claimText}>
                {cooldownMs > 0 ? "Already Claimed" : "Claim Today"}
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
    backgroundColor: "rgba(5,8,20,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "92%",
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.45)",
    shadowColor: "#34D399",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  sub: {
    color: "#A5B4FC",
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
  },

  grid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },

  dayBox: {
    width: "30%",
    backgroundColor: "rgba(52,211,153,0.08)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },

  dayClaimed: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "#22C55E",
  },

  dayLabel: {
    color: "#9FA8C7",
    fontSize: 11,
    marginBottom: 4,
  },

  dayReward: {
    color: "#34D399",
    fontWeight: "900",
    fontSize: 13,
  },

  claimedText: {
    color: "#16A34A",
  },

  check: {
    color: "#22C55E",
    fontWeight: "900",
    marginTop: 6,
  },

  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metaText: {
    color: "#9FA8C7",
    fontSize: 13,
  },

  claimBtn: {
    marginTop: 18,
    backgroundColor: "#34D399",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  claimText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 15,
  },

  message: {
    marginTop: 12,
    color: "#22C55E",
    textAlign: "center",
    fontWeight: "800",
  },

  closeBtn: {
    marginTop: 16,
    alignItems: "center",
  },

  closeText: {
    color: "#9FA8C7",
    fontSize: 13,
    fontWeight: "600",
  },
});
