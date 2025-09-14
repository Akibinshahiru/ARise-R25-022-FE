// app/binoosh/view-plans.tsx
import axios from "axios";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo: boolean;
  soundClipRef?: string;
};

type Challenge = {
  _id: string;
  title: string;
  words: Word[];
  assignees: { uid: string; username: string }[];
  pseudoWord: Word;
  createdAt: string;
  updatedAt: string;
};

const ipAddress = process.env.API_BASE_URL;

export default function ViewPlansScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{
        message: string;
        count: number;
        challenges: Challenge[];
      }>(`${ipAddress}/api/challenges`); //

      setChallenges(res.data.challenges);
    } catch (err: any) {
      console.error("Error fetching challenges:", err.message);
      alert("Failed to fetch plans.");
    } finally {
      setLoading(false);
    }
  };

  const renderChallenge = ({ item }: { item: Challenge }) => {
    return (
      <View style={styles.card}>
        {/* Title */}
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.pill}>
            <Ionicons name="people" size={12} color="#4F46E5" />
            <Text style={styles.pillText}>{item.assignees.length}</Text>
          </View>
        </View>

        {/* Words */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Words:</Text>
          <View style={styles.tagContainer}>
            {item.words.map((w) => (
              <View key={w._id} style={styles.tag}>
                <Text style={styles.tagText}>{w.word}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pseudo Word */}
        {item.pseudoWord && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pseudo Word:</Text>
            <View style={styles.tagPseudo}>
              <Text style={styles.tagText}>{item.pseudoWord.word}</Text>
            </View>
          </View>
        )}

        {/* Assignees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignees:</Text>
          <Text>{item.assignees.map((a) => a.username).join(", ") || "None"}</Text>
        </View>

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.timestamp}>
            Created: {new Date(item.createdAt).toLocaleString()}
          </Text>
          <Text style={styles.timestamp}>
            Updated: {new Date(item.updatedAt).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No plans to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient colors={["#FFE6A7", "#FFB3C1"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blobTop} />
      <LinearGradient colors={["#B5E4FF", "#D7C3FF"] as const} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.blobBottom} />

      <FlatList
        data={challenges}
        keyExtractor={(item) => item._id}
        renderItem={renderChallenge}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>ARise</Text>
              <Ionicons name="calendar" size={22} color="#6C2BD9" />
            </View>
            <LinearGradient colors={["#7C3AED", "#4F46E5"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Plans</Text>
                <Text style={styles.heroSubtitle}>Your saved learning plans at a glance.</Text>
              </View>
              <View style={styles.emojiBadge}><Text style={styles.emojiText}>🗂️</Text></View>
            </LinearGradient>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 16, paddingBottom: 40 },
  // Decorative blobs
  blobTop: { position: "absolute", top: -80, left: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },
  blobBottom: { position: "absolute", bottom: -70, right: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  brand: { fontSize: 22, fontWeight: "800", color: "#111827" },
  heroCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 18, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  heroSubtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  emojiText: { fontSize: 26 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800" },
  section: { marginTop: 8 },
  sectionTitle: { fontWeight: "800", marginBottom: 4, color: "#374151" },
  tagContainer: { flexDirection: "row", flexWrap: "wrap" },
  tag: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagPseudo: {
    backgroundColor: "#9333ea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  tagText: { color: "#fff", fontSize: 12 },
  timestamp: { fontSize: 12, color: "#6B7280" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: "#4F46E5", fontWeight: "800", fontSize: 12 },
});
