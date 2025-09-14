import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 🔐 Environment (same style as your other screen)
const API_BASE = process.env.API_BASE_URL as string;

// 🧩 Types
type LevelScore = {
  round: number;
  word: string;
  score?: number;
  timeTaken?: number;
  audioClipPath?: string;
  hintTaken?: boolean;
};

type PopulatedChallenge = {
  _id: string;
  title: string;
};

type ScoreDoc = {
  _id: string;
  challengeId: PopulatedChallenge | null; // in case the challenge was removed
  levelScores: LevelScore[];
  pseudowordRecording?: string;
  emotion?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse = {
  ok: boolean;
  data: ScoreDoc[];
};

export default function ScoresListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<ScoreDoc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      if (!API_BASE) {
        throw new Error("Missing API_BASE_URL environment variable");
      }
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/scores`);
      if (!res.ok) throw new Error(`Failed to fetch scores: ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      if (!json.ok) throw new Error("API returned ok=false");
      setScores(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not load scores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchScores();
    } finally {
      setRefreshing(false);
    }
  }, [fetchScores]);

  const empty = useMemo(() => scores.length === 0, [scores]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#7C3AED", "#A78BFA"]} style={styles.header}>
        <Text style={styles.title}>My Scores</Text>
        <Text style={styles.subtitle}>Tap a card to view details</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>Loading scores…</Text>
        </View>
      ) : empty ? (
        <View style={styles.center}>
          <Ionicons name="trophy" size={48} color="#C4B5FD" />
          <Text style={styles.emptyTitle}>No scores yet</Text>
          <Text style={styles.emptyHelp}>Play a challenge to see your progress here!</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={scores}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const challengeTitle = item.challengeId?.title ?? "Untitled Challenge";
            const count = item.levelScores?.length ?? 0;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.card}
                onPress={() =>
                  router.push({ pathname: "/binoosh/view-score", params: { scoreId: item._id } })
                }
              >
                <View style={styles.cardRow}>
                  <View style={styles.iconBubble}>
                    <Ionicons name="ribbon" size={24} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {challengeTitle}
                    </Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="list" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{count} rounds</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// 🎨 Styles (kid-friendly)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F3FF" },
  header: { padding: 16, paddingTop: 24 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#F3E8FF", marginTop: 4, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1F2937",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  metaText: {
    color: "#6B7280",
    fontWeight: "600",
  },

  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#374151",
  },
  emptyHelp: {
    marginTop: 4,
    color: "#6B7280",
  },
});
