// app/index.tsx

// Initialize Firebase first
import "../firebase/firebaseConfig";

import { Redirect } from "expo-router";

export default function Index() {
  // Remove trailing slash here
  return <Redirect href="/(tabs)" />;
}
