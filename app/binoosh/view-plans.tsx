// app/binoosh/view-plans.tsx
import axios from "axios";
import React, { useEffect, useState } from "react";
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
      }>("http://192.168.43.137:5000/api/challenges"); // 👈 adjust your backend route

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
        <Text style={styles.title}>{item.title}</Text>

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
    <FlatList
      data={challenges}
      keyExtractor={(item) => item._id}
      renderItem={renderChallenge}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  section: { marginTop: 8 },
  sectionTitle: { fontWeight: "bold", marginBottom: 4 },
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
  timestamp: { fontSize: 12, color: "#666" },
});
