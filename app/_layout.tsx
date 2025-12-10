import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

/* --------------------------------------------------
   Lazy Firebase Helpers (NO STATIC IMPORTS)
-------------------------------------------------- */
async function getAuthSafe() {
  const { getAuth, onAuthStateChanged } = await import("firebase/auth");
  const { app } = await import("../firebase/firebaseConfig");
  return { auth: getAuth(app), onAuthStateChanged };
}

async function getFirestoreSafe() {
  const { getFirestore, doc, getDoc } = await import("firebase/firestore");
  const { app } = await import("../firebase/firebaseConfig");
  return { db: getFirestore(app), doc, getDoc };
}

/* --------------------------------------------------
   Root Layout
-------------------------------------------------- */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  /* --------------------------------------------------
     AUTH LISTENER (Lazy Firebase)
  -------------------------------------------------- */
  useEffect(() => {
    let unsubscribe: any = null;

    (async () => {
      try {
        const { auth, onAuthStateChanged } = await getAuthSafe();
        const { db, doc, getDoc } = await getFirestoreSafe();

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setIsAuthenticated(true);

            try {
              const userRef = doc(db, "users", user.uid);
              const userDoc = await getDoc(userRef);

              setProfileCompleted(
                userDoc.exists() && !!userDoc.data()?.username
              );
            } catch (err) {
              console.warn("[Auth] failed to fetch user profile", err);
              setProfileCompleted(false);
            }
          } else {
            setIsAuthenticated(false);
            setProfileCompleted(false);
          }

          setLoading(false);
        });
      } catch (e) {
        console.warn("🔥 Failed to init Firebase in layout:", e);
        setLoading(false);
      }
    })();

    return () => unsubscribe && unsubscribe();
  }, []);

  /* --------------------------------------------------
     Loading Screen
  -------------------------------------------------- */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <StatusBar style="auto" />
      </View>
    );
  }

  /* --------------------------------------------------
     Navigation Logic
  -------------------------------------------------- */
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>

        {/* MAIN APP */}
        {isAuthenticated && profileCompleted && (
          <Stack.Screen name="(tabs)" />
        )}

        {/* PROFILE SETUP */}
        {isAuthenticated && !profileCompleted && (
          <Stack.Screen name="(auth)/profileSetup" />
        )}

        {/* AUTH FLOW */}
        {!isAuthenticated && (
          <Stack.Screen name="(auth)" />
        )}

        {/* MODAL */}
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
