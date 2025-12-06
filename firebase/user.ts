// firebase/user.ts
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { UserProfile, MiningData, ReferralData } from "./types";
import { arrayUnion } from "firebase/firestore";

// Generate random referral code
export const generateReferralCode = (uid: string) =>
  uid.slice(0, 6).toUpperCase();

// ------------------------------
// CREATE USER AFTER REGISTER
// ------------------------------
export async function createUserInFirestore(referredBy: string | null = null) {
  if (!auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const userRef = doc(db, "users", uid);

  const profile: UserProfile = {
    username: "",
    avatarUrl: null,
    referralCode: generateReferralCode(uid),
    referredBy,
    createdAt: serverTimestamp() as Timestamp,
  };

  const mining: MiningData = {
    miningActive: false,
    lastStart: null,
    lastClaim: null,
    balance: 0,
  };

  const referrals: ReferralData = {
    totalReferred: 0,
    referredUsers: [],
  };

  await setDoc(userRef, {
  profile,
  mining,
  referrals,

  boost: {
    usedToday: 0,
    lastReset: serverTimestamp(),
    balance: 0,
  },

  dailyClaim: {
    lastClaim: null,
    streak: 0,
    totalEarned: 0,
  },
});

}

// ------------------------------
// GET USER DATA
// ------------------------------
export async function getUserData(uid: string) {
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? docSnap.data() : null;
}

// ------------------------------
// START MINING
// ------------------------------
export async function startMining(uid: string) {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    "mining.miningActive": true,
    "mining.lastStart": serverTimestamp(),
  });
}

// ------------------------------
// STOP MINING
// ------------------------------
export async function stopMining(uid: string) {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    "mining.miningActive": false,
  });
}

// ------------------------------
// CLAIM MINING REWARDS
// ------------------------------
export async function claimMiningReward(uid: string) {
  const userRef = doc(db, "users", uid);

  const reward = await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return 0;

    const data = snap.data();
    const mining = data.mining as MiningData | undefined;

    if (!mining || !mining.lastStart) return 0;

    const now = Timestamp.now();
    const elapsedMs = now.toMillis() - mining.lastStart.toMillis();
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

    const MAX_SECONDS = 24 * 3600;
    const capped = Math.min(elapsedSeconds, MAX_SECONDS);

    const DAILY_MAX = 4.8;
    const rewardAmount = (capped / MAX_SECONDS) * DAILY_MAX;

    const normalizedReward = Number(rewardAmount);

    tx.update(userRef, {
      "mining.balance": increment(normalizedReward),
      "mining.lastClaim": serverTimestamp(),
      "mining.lastStart": null,
      "mining.miningActive": false,
    });

    return normalizedReward;
  });

  return reward;
}

// ------------------------------
// REGISTER REFERRAL
// ------------------------------
export async function registerReferral(referrerCode: string, newUserUid: string) {
  const allUsersSnap = await getDoc(doc(db, "referrals", referrerCode));
  if (!allUsersSnap.exists()) return;

  const referrerUid = allUsersSnap.data().uid;
  const referrerRef = doc(db, "users", referrerUid);

  await updateDoc(referrerRef, {
    "referrals.totalReferred": increment(1),
    "referrals.referredUsers": arrayUnion([newUserUid]),
  });
}

// ------------------------------
// BOOST REWARD (WATCH ADS)
// ------------------------------
export async function claimBoostReward(uid: string) {
  const userRef = doc(db, "users", uid);

  const reward = await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return 0;

    const data = snap.data();

    const boost = data.boost ?? {
      usedToday: 0,
      lastReset: null,
      balance: 0,
    };

    const now = Timestamp.now();
    const lastReset = boost.lastReset?.toMillis() ?? 0;
    const diff = now.toMillis() - lastReset;

    let resetApplied = false;

    // ✅ Auto reset every 24h (persisted)
    if (!boost.lastReset || diff >= 24 * 3600 * 1000) {
      boost.usedToday = 0;
      boost.lastReset = now;
      resetApplied = true;
    }

    if (resetApplied) {
      tx.update(userRef, {
        "boost.usedToday": 0,
        "boost.lastReset": now,
      });
    }

    if (boost.usedToday >= 3) return 0;

    const REWARD = 0.5;

    tx.update(userRef, {
      "mining.balance": increment(REWARD),
      "boost.usedToday": increment(1),
      "boost.lastReset": now,
      "boost.balance": increment(REWARD),
    });

    return REWARD;
  });

  return reward;
}


// ------------------------------
// DAILY CLAIM (STREAK + INTERSTITIAL)
// ------------------------------
export async function claimDailyReward(uid: string) {
  const userRef = doc(db, "users", uid);

  const reward = await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return 0;

    const data = snap.data();
    const daily = data.dailyClaim ?? {
      lastClaim: null,
      streak: 0,
      totalEarned: 0,
    };

    const now = Timestamp.now();
    const lastClaim = daily.lastClaim?.toMillis() ?? 0;
    const diff = now.toMillis() - lastClaim;

    const DAY = 24 * 3600 * 1000;

    // ❌ Already claimed within 24h
    if (lastClaim && diff < DAY) {
      return 0;
    }

    // ✅ If missed over 48h → reset streak
    if (lastClaim && diff >= DAY * 2) {
      daily.streak = 0;
    }

    // ✅ Increase streak
    daily.streak += 1;

    // ✅ Reward table
    let REWARD = 0.1 * daily.streak;
    if (daily.streak === 7) REWARD = 2;

    tx.update(userRef, {
      "mining.balance": increment(REWARD),
      "dailyClaim.lastClaim": now,
      "dailyClaim.streak": daily.streak,
      "dailyClaim.totalEarned": increment(REWARD),
    });

    return REWARD;
  });

  return reward;
}

// ------------------------------
// WATCH & EARN (REWARDED ADS)
// ------------------------------
export async function claimWatchEarnReward(uid: string) {
  const userRef = doc(db, "users", uid);

  const reward = await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return 0;

    const data = snap.data();
    const watch = data.watchEarn ?? {
      totalWatched: 0,
      totalEarned: 0,
    };

    const REWARD = 0.25; // ✅ you can change this later

    tx.update(userRef, {
      "mining.balance": increment(REWARD),
      "watchEarn.totalWatched": increment(1),
      "watchEarn.totalEarned": increment(REWARD),
    });

    return REWARD;
  });

  return reward;
}
