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

export default function ManageWords() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Background decorative blobs */}
      <LinearGradient
        colors={["#FFE6A7", "#FFB3C1"] as const}
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
        {/* Brand row */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>ARise</Text>
          <Ionicons name="book" size={22} color="#6C2BD9" />
        </View>

        {/* Header card */}
        <LinearGradient
          colors={["#7C3AED", "#4F46E5"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Manage Words</Text>
            <Text style={styles.subtitle}>Add fun new words or review your list!</Text>
          </View>
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiText}>🔤</Text>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <ActionTile
            colors={["#34D399", "#10B981"] as const}
            icon="add-circle"
            label="Create New Word"
            onPress={() => router.push("/binoosh/create-word")}
          />
          <ActionTile
            colors={["#60A5FA", "#3B82F6"] as const}
            icon="list"
            label="View Created Words"
            onPress={() => router.push("/binoosh/view-words")}
          />
        </View>

        {/* Helpful tip card */}
        <LinearGradient
          colors={["#A78BFA", "#F472B6"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipCard}
        >
          <Ionicons name="bulb" size={22} color="#fff" />
          <Text style={styles.tipText}>Use simple, colorful images and clear sounds to help kids learn faster.</Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

type ActionTileProps = {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function ActionTile({ colors, icon, label, onPress }: ActionTileProps) {
  return (
    <TouchableOpacity style={styles.tileWrap} activeOpacity={0.9} onPress={onPress}>
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
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tileWrap: {
    width: "48%",
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
  tipCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
});
