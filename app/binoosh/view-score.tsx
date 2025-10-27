import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av"; // ⬅️ added for playback
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Config } from "../../constants/config";
// 🔐 Environment (same style you used elsewhere)
const API_BASE = Config.DEVELOPMENT_API_URL;

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
  challengeId: PopulatedChallenge | null;
  levelScores: LevelScore[];
  pseudowordRecording?: string;
  emotion?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ScoreResponse = {
  ok: boolean;
  data: ScoreDoc;
};

// 🏅 Medal helper
const medalForScore = (v: number): "bronze" | "silver" | "gold" =>
  v <= 55 ? "bronze" : v <= 75 ? "silver" : "gold";

// ⏱️ format ms → m:ss
const t = (ms: number) => {
  if (!ms || ms < 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export default function ViewScoreScreen() {
  const router = useRouter();
  const { scoreId } = useLocalSearchParams<{ scoreId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoreDoc, setScoreDoc] = useState<ScoreDoc | null>(null);

  // 🔊 playback state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);

  const fetchScore = useCallback(async () => {
    try {
      if (!API_BASE) {
        throw new Error("Missing API_BASE_URL environment variable");
      }
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/scores/${scoreId}`);
      if (!res.ok) throw new Error(`Failed to fetch score: ${res.status}`);
      const json = (await res.json()) as ScoreResponse;
      if (!json.ok || !json.data) throw new Error("API returned ok=false");
      setScoreDoc(json.data);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not load this score.");
    } finally {
      setLoading(false);
    }
  }, [scoreId]);

  useEffect(() => {
    fetchScore();
    return () => {
      // unload audio on unmount
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch {}
      })();
    };
  }, [fetchScore]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchScore();
    } finally {
      setRefreshing(false);
    }
  }, [fetchScore]);

  const challengeTitle = scoreDoc?.challengeId?.title ?? "Challenge";
  const levelScores = useMemo(() => scoreDoc?.levelScores ?? [], [scoreDoc]);

  const averageScore = useMemo(() => {
    if (!levelScores.length) return 0;
    const s = levelScores.reduce((acc, it) => acc + (it.score || 0), 0);
    return Math.round(s / levelScores.length);
  }, [levelScores]);

  const medal = medalForScore(averageScore);

  const emotionText = useMemo(() => {
    if (!scoreDoc?.emotion) return "Emotion was not recorded.";
    return `The student felt '${scoreDoc.emotion.toLowerCase()}' while reading out the pseudo word.`;
  }, [scoreDoc?.emotion]);

  // ▶️ Play / ⏸️ Pause pseudoword recording
  const togglePlayback = useCallback(async () => {
    if (!scoreDoc?.pseudowordRecording) return;

    try {
      setIsLoadingAudio(true);

      // If there is a loaded sound, toggle it
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if ("isLoaded" in status && status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          setIsLoadingAudio(false);
          return;
        } else {
          // not loaded; unload to reset
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }

      // Fresh load
      const { sound } = await Audio.Sound.createAsync(
        { uri: scoreDoc.pseudowordRecording },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st || !("isLoaded" in st)) return;
        if (st.isLoaded) {
          setPosMs(st.positionMillis ?? 0);
          setDurMs(st.durationMillis ?? 0);
          if (st.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
    } catch (e) {
      Alert.alert("Audio", "Could not play the pseudoword recording.");
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      } catch {}
      setIsPlaying(false);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [scoreDoc?.pseudowordRecording]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#7C3AED", "#A78BFA"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Score Details</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {challengeTitle}
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>Loading score…</Text>
        </View>
      ) : !scoreDoc ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#FCA5A5" />
          <Text style={styles.emptyTitle}>Score not found</Text>
          <Text style={styles.emptyHelp}>Please go back and try another one.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Summary card */}
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="ribbon" size={24} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{challengeTitle}</Text>
                <Text style={styles.cardSub}>Average Score: {averageScore}</Text>
              </View>
              <Text style={[styles.medal, styles[`medal_${medal}` as const]]}>{medal.toUpperCase()}</Text>
            </View>
          </View>

          {/* Rounds narrative */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-circle" size={22} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Rounds</Text>
            </View>

            {levelScores.map((r) => {
              const time = typeof r.timeTaken === "number" ? r.timeTaken : "N/A";
              const score = typeof r.score === "number" ? r.score : 0;
              const hintPart = r.hintTaken ? "The student used the hint provided." : "The student didn't use the hint provided.";
              const sentence = `During round ${r.round} where the word is '${r.word}' the student took ${time} seconds to answer and scored ${score}. ${hintPart}`;

              return (
                <View key={`${r.round}-${r.word}`} style={styles.bulletRow}>
                  <Ionicons name="sparkles" size={18} color="#7C3AED" style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>{sentence}</Text>
                </View>
              );
            })}
          </View>

          {/* Pseudoword & emotion */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="happy" size={22} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Pseudoword & Emotion</Text>
            </View>

            <View style={styles.bulletRow}>
              <Ionicons name="heart" size={18} color="#EC4899" style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>
                {scoreDoc.emotion
                  ? `The student felt '${scoreDoc.emotion.toLowerCase()}' while reading out the pseudo word.`
                  : "Emotion was not recorded."}
              </Text>
            </View>

            {scoreDoc.pseudowordRecording ? (
              <View style={{ marginTop: 8, alignItems: "center" }}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={togglePlayback}
                  disabled={isLoadingAudio}
                >
                  <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
                  <Text style={styles.playBtnText}>
                    {isLoadingAudio ? "Loading..." : isPlaying ? "Pause" : "Play"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.progressText}>
                  {t(posMs)} / {t(durMs)}
                </Text>
              </View>
            ) : (
              <View style={styles.bulletRow}>
                <Ionicons name="musical-notes" size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                <Text style={styles.bulletText}>No pseudoword recording was uploaded.</Text>
              </View>
            )}
          </View>

          {/* Spacer */}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// 🎨 Styles (playful & clean)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F3FF" },

  header: { padding: 16, paddingTop: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#F3E8FF", marginTop: 2, fontWeight: "600" },

  container: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },

  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBubble: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#EDE9FE",
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#1F2937" },
  cardSub: { color: "#6B7280", marginTop: 2, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#4C1D95" },

  bulletRow: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  bulletText: { flex: 1, color: "#374151", fontWeight: "600" },

  medal: { fontSize: 14, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  medal_bronze: { color: "#B45309", backgroundColor: "#FEF3C7" },
  medal_silver: { color: "#6B7280", backgroundColor: "#F3F4F6" },
  medal_gold: { color: "#CA8A04", backgroundColor: "#FEF3C7" },

  playBtn: {
    marginTop: 6,
    backgroundColor: "#8B5CF6",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  playBtnText: { color: "#fff", fontWeight: "900" },
  progressText: { marginTop: 6, color: "#6B7280", fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 8, fontSize: 18, fontWeight: "800", color: "#374151" },
  emptyHelp: { marginTop: 4, color: "#6B7280" },
});
