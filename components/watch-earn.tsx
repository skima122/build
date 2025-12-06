// app/(tabs)/watch-earn.tsx
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";

export default function WatchEarn({ visible, onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Watch & Earn</Text>
          <Text style={styles.text}>Watch ads to earn rewards — coming soon.</Text>

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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "85%",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  text: { fontSize: 16, opacity: 0.7 },
  closeBtn: { marginTop: 20, alignItems: "center" },
  closeText: { color: "blue", fontWeight: "bold" },
});
