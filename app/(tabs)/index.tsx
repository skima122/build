import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useState, useEffect } from "react";
import { MotiView } from "moti";
import { MaterialIcons, Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { startMining, stopMining, claimMiningRewards } from "../../firebase/mining";
import { useRouter } from "expo-router";

export default function MiningDashboard() {
  const router = useRouter();

  const [miningData, setMiningData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralBonus, setReferralBonus] = useState(0);
  const [mining, setMining] = useState(false);
  const [balance, setBalance] = useState(0);

  // Mining Rate (Given your system = 2.4 coins / 24h)
  const RATE_PER_HOUR = 2.4 / 24;
  const RATE_PER_MIN = RATE_PER_HOUR / 60;
  const RATE_PER_SEC = RATE_PER_MIN / 60;

  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userProfileData = userSnap.data();

          if (!userProfileData) {
            Alert.alert("Error", "No user profile data found.");
            return;
          }

          setUserProfile(userProfileData);

          const miningRef = doc(db, "miningData", auth.currentUser.uid);
          const miningSnap = await getDoc(miningRef);
          const miningData = miningSnap.data();

          if (!miningData) {
            Alert.alert("Error", "No mining data found.");
            return;
          }

          setMiningData(miningData);
          setBalance(miningData.balance);
          setMining(miningData.miningActive);

        } catch (error) {
          Alert.alert("Error", "Failed to fetch mining data.");
          console.error(error);
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleStartStopMining = async () => {
    if (auth.currentUser) {
      if (mining) {
        await stopMining(auth.currentUser.uid);
        setMining(false);
      } else {
        await startMining(auth.currentUser.uid);
        setMining(true);
      }
    }
  };

  const handleClaimRewards = async () => {
    if (auth.currentUser) {
      const reward = await claimMiningRewards(auth.currentUser.uid);
      setBalance(balance + reward);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* MAIN CIRCLE */}
      <View style={styles.circleWrapper}>
        <View style={styles.circle}>
          <Text style={styles.balance}>{balance.toFixed(2)}</Text>
          <Text style={styles.vad}>VAD BALANCE</Text>

          {/* Mining Rate */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.rateText}>+{RATE_PER_SEC.toFixed(6)} / sec</Text>
            <Text style={styles.rateText}>+{RATE_PER_MIN.toFixed(4)} / min</Text>
            <Text style={styles.rateText}>+{RATE_PER_HOUR.toFixed(3)} / hour</Text>
          </View>
        </View>
      </View>

      {/* RIGHT-SIDE ICONS */}
      <View style={styles.rightColumn}>

        {/* Start / Stop Mining Icon */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={handleStartStopMining}
        >
          <Feather
            name={mining ? "pause-circle" : "play-circle"}
            size={34}
            color="white"
          />
        </TouchableOpacity>

        {/* Claim Reward Icon */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={handleClaimRewards}
        >
          <MaterialIcons name="attach-money" size={34} color="white" />
        </TouchableOpacity>

        {/* Invite */}
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Ionicons name="arrow-forward-circle" size={32} color="white" />
          <Text style={styles.inviteText}>Invite</Text>
        </View>

      </View>

      {/* BOTTOM ICON NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <FontAwesome5 name="user-circle" size={38} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/explore")}>
          <Feather name="compass" size={38} color="white" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E90FF",
    paddingTop: 40,
    alignItems: "center",
  },

  circleWrapper: {
    marginTop: 40,
    alignSelf: "center",
  },

  circle: {
    width: 240,
    height: 240,
    borderRadius: 200,
    borderWidth: 12,
    borderColor: "white",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  balance: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1E90FF",
  },

  vad: {
    fontSize: 16,
    color: "#1E90FF",
    marginTop: 4,
  },

  rateText: {
    textAlign: "center",
    fontSize: 14,
    color: "#1E90FF",
  },

  rightColumn: {
    position: "absolute",
    right: 20,
    top: 130,
    alignItems: "center",
  },

  sideBtn: {
    backgroundColor: "#0077FF",
    padding: 10,
    marginBottom: 18,
    borderRadius: 50,
  },

  inviteText: {
    color: "white",
    fontSize: 14,
    marginTop: 3,
  },

  bottomNav: {
    position: "absolute",
    bottom: 40,
    width: "60%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
