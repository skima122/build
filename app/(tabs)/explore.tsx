// app/(tabs)/explore.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase/firebaseConfig"; // keep auth for session info

const { width } = Dimensions.get("window");
const CARD_W = Math.round((width - 60) / 2);

const SAMPLE_MARKET_ITEMS = [
  {
    id: "land-001",
    title: "Oceanfront Parcel #001",
    collection: "VAD Estates",
    price: 1250,
    currency: "VAD",
    img: null,
    badge: "Limited",
  },
  {
    id: "art-023",
    title: "Neon Raven #023",
    collection: "Raven Rush x VAD",
    price: 350,
    currency: "VAD",
    img: null,
    badge: "Featured",
  },
  {
    id: "prop-12",
    title: "Sky Tower - Token #12",
    collection: "Urban Tokens",
    price: 4200,
    currency: "VAD",
    img: null,
    badge: "Auction",
  },
  {
    id: "asset-77",
    title: "Mystic Gem Pack",
    collection: "Genesis Drops",
    price: 80,
    currency: "VAD",
    img: null,
    badge: "New",
  },
];

export default function ExploreScreen() {
  const user = auth.currentUser;
  const fade = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const goSoon = (label?: string) => {
    Alert.alert("Launching soon!", label ? `${label} — launching soon!` : "Feature launching soon!");
  };

  const renderCard = (item: any, idx: number) => {
    const cardScale = new Animated.Value(1);

    const handlePressIn = () =>
      Animated.spring(cardScale, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();

    const handlePressOut = () =>
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.marketCard,
          {
            transform: [{ scale: cardScale }],
            opacity: fade,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => goSoon(item.title)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          <View style={styles.media}>
            {/* Placeholder image area */}
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="image" size={36} color="rgba(255,255,255,0.12)" />
            </View>
            {/* Badge */}
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.cardCollection}>
              {item.collection}
            </Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.pricePrimary}>
                  {item.price.toLocaleString()} {item.currency}
                </Text>
                <Text style={styles.priceSub}>Reserve · Tokenized asset</Text>
              </View>

              <TouchableOpacity
                onPress={() => goSoon("Buy / Trade")}
                style={styles.cardAction}
              >
                <Text style={styles.cardActionText}>BUY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: headerY }] }]}>
        <View>
          <Text style={styles.title}>VAD MARKETPLACE</Text>
          <Text style={styles.subtitle}>EARN, TRADE, OWN, WIN!</Text>
        </View>

        <View style={styles.rightGroup}>
          <TouchableOpacity onPress={() => goSoon("Wallet / Connect")} style={styles.iconBtn}>
            <Ionicons name="wallet" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => goSoon("Notifications")} style={styles.iconBtn}>
            <Ionicons name="notifications" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.userTag}>
            <Ionicons name="person" size={16} color="#000" />
            <Text style={styles.userTagText}>
              {user ? (user.email ? user.email.split("@")[0] : user.uid.slice(0, 6)) : "Guest"}
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Spotlight / hero area */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Featured drop</Text>
            <Text style={styles.heroSub}>
              Tokenized properties, rare art & exclusive collections — trade with VAD.
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity onPress={() => goSoon("Explore Drops")} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Explore drops</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => goSoon("Create Listing")} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Create listing</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroPreview}>
            <View style={styles.previewCard}>
              <Ionicons name="sparkles" size={28} color="#fff" />
              <Text style={styles.previewTitle}>Oceanfront Parcel #001</Text>
              <Text style={styles.previewPrice}>1,250 VAD</Text>
            </View>
          </View>
        </View>

        {/* Filters row (static) */}
        <View style={styles.filtersRow}>
          <TouchableOpacity onPress={() => goSoon("Filters")} style={styles.filterPill}>
            <Ionicons name="funnel" size={14} color="#fff" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goSoon("Sort")} style={styles.filterPill}>
            <Ionicons name="swap-vertical" size={14} color="#fff" />
            <Text style={styles.filterText}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goSoon("Collections")} style={styles.filterPill}>
            <Ionicons name="layers" size={14} color="#fff" />
            <Text style={styles.filterText}>Collections</Text>
          </TouchableOpacity>
        </View>

        {/* Grid of marketplace cards */}
        <View style={styles.grid}>
          {SAMPLE_MARKET_ITEMS.map((it, i) => renderCard(it, i))}
        </View>

        {/* Large CTA / informational cards */}
        <View style={styles.infoRow}>
          <TouchableOpacity style={styles.infoCard} onPress={() => goSoon("Learn about VAD staking")}>
            <Ionicons name="trending-up" size={20} color="#5865F2" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoTitle}>Stake & Earn</Text>
              <Text style={styles.infoSub}>Earn passive VAD rewards when you stake marketplace assets.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={() => goSoon("How tokenization works")}>
            <Ionicons name="cube" size={20} color="#5865F2" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoTitle}>Tokenization 101</Text>
              <Text style={styles.infoSub}>Learn how real-world assets become tradable tokens.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = "#000000";
const CARD = "#0b0b0b";
const BLUE = "#5865F2";
const MUTED = "rgba(255,255,255,0.55)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  userTag: {
    backgroundColor: BLUE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userTagText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },

  hero: {
    backgroundColor: CARD,
    borderRadius: 14,
    overflow: "hidden",
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "800",
  },
  heroSub: {
    color: "rgba(255,255,255,0.45)",
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  ghostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  ghostBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: BLUE,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  heroPreview: {
    width: 120,
    alignItems: "center",
  },
  previewCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    width: 110,
    height: 110,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  previewTitle: {
    color: "#fff",
    fontWeight: "800",
    marginTop: 8,
    fontSize: 12,
  },
  previewPrice: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
    marginTop: 4,
    fontSize: 12,
  },

  filtersRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 10,
  },
  filterPill: {
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  marketCard: {
    width: CARD_W,
    backgroundColor: CARD,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  media: {
    position: "relative",
    height: CARD_W,
    backgroundColor: "rgba(255,255,255,0.02)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaPlaceholder: {
    width: "92%",
    height: "90%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    backgroundColor: "rgba(255,255,255,0.02)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeWrap: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(88,101,242,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: BLUE,
    fontWeight: "800",
    fontSize: 11,
  },

  cardBody: {
    padding: 12,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  cardCollection: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricePrimary: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  priceSub: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
  },
  cardAction: {
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  cardActionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  infoRow: {
    marginTop: 8,
    gap: 10,
  },
  infoCard: {
    backgroundColor: CARD,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoTitle: {
    color: "#fff",
    fontWeight: "800",
  },
  infoSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 4,
  },
});
