import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDhykCGrx_g-EB6lHZi_KYSwQzJGM9znjw",
  authDomain: "vad-app-4a6e8.firebaseapp.com",
  projectId: "vad-app-4a6e8",
  storageBucket: "vad-app-4a6e8.firebasestorage.app",
  messagingSenderId: "98354868664",
  appId: "1:98354868664:android:4317c6de58777ce72f9f4d"
};


export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ----------------------------------
// 🔥 Lazy Auth Singleton
// ----------------------------------
let authInstance: ReturnType<typeof initializeAuth> | null = null;

export const getAuthInstance = async () => {
  if (authInstance) return authInstance;

  const { initializeAuth, getReactNativePersistence } = await import(
    "firebase/auth/react-native"
  );
  const AsyncStorageModule = await import("@react-native-async-storage/async-storage");

  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorageModule.default),
  });

  return authInstance;
};

// ----------------------------------
// 🔥 Lazy Firestore
// ----------------------------------
export const getDb = async () => {
  await getAuthInstance(); // ❤️ Ensures Auth registered first
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(app);
};

// ----------------------------------
// 🔥 Lazy Storage
// ----------------------------------
export const getStorageInstance = async () => {
  await getAuthInstance(); // ❤️ Same logic
  const { getStorage } = await import("firebase/storage");
  return getStorage(app);
};
