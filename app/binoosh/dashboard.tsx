import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ColorValue } from "react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BinooshDashboard() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient
        colors={["#FFE6A7", "#bd092aff"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={["#B5E4FF", "#D7C3FF"] as const}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.blobBottom}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* App brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>ARise</Text>
          <Ionicons name="sparkles" size={22} color="#6C2BD9" />
        </View>

        {/* Greeting card */}
        <LinearGradient
          colors={["#7C3AED", "#4F46E5"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, Explorer!</Text>
            <Text style={styles.subtitle}>Let's play, learn and have fun!</Text>
          </View>
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiText}>🧩</Text>
          </View>
        </LinearGradient>

        {/* Daily challenge card */}
        <LinearGradient
          colors={["#A78BFA", "#F472B6"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.challengeCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeTitle}>Create Challenges</Text>
            <Text style={styles.challengeText}>Create challenging contests to keep students engaged!</Text>
          </View>
          <TouchableOpacity style={styles.challengeButton} activeOpacity={0.9} onPress={() => router.push("/binoosh/manage-plans")}>
            <Text style={styles.challengeButtonText}>Let's Go</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <ActionTile
            colors={["#34D399", "#10B981"] as const}
            icon="book"
            label="Manage Words"
            onPress={() => router.push("/binoosh/manage-words")}
          />
          <ActionTile
            colors={["#60A5FA", "#3B82F6"] as const}
            icon="clipboard"
            label="Manage Plans"
            onPress={() => router.push("/binoosh/manage-plans")}
          />
          <ActionTile
            colors={["#F59E0B", "#F97316"] as const}
            icon="bar-chart"
            label="View Reports"
            onPress={() => router.push("/binoosh/view-scores")}
            full
          />
        </View>
      </ScrollView>
    </View>
  );
}

type ActionTileProps = {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  full?: boolean;
};

function ActionTile({ colors, icon, label, onPress, full }: ActionTileProps) {
  return (
    <TouchableOpacity style={[styles.tileWrap, full ? styles.tileFull : null]} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
        <View style={styles.tileIconWrap}>
          <Ionicons name={icon as any} size={28} color="#ffffff" />
        </View>
        <Text style={styles.tileText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  blobTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
  },
  blobBottom: {
    position: "absolute",
    bottom: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.5,
  },
  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hello: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: "#E9D5FF",
    fontSize: 14,
    fontWeight: "600",
  },
  emojiBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  emojiText: {
    fontSize: 26,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  challengeTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  challengeText: {
    color: "#FDF2F8",
    fontSize: 13,
    fontWeight: "600",
  },
  challengeButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
  },
  challengeButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tileWrap: {
    width: "48%",
    marginBottom: 14,
  },
  tileFull: {
    width: "100%",
  },
  tile: {
    height: 110,
    borderRadius: 18,
    padding: 14,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
