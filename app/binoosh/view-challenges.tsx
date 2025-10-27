// app/binoosh/view-challenges.tsx
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Config } from "../../constants/config";
// const ipAddress = process.env.API_BASE_URL;
const ipAddress = Config.DEVELOPMENT_API_URL;

type Challenge = {
  _id: string;
  title: string;
  words: any[];
};

export default function ViewChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [useOriginal, setUseOrigginal] = useState(false);

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
      }>(`${ipAddress}/api/challenges`);
      setChallenges(res.data.challenges);
    } catch (err: any) {
      console.error("Error fetching challenges:", err.message);
      alert("Failed to fetch challenges.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient colors={["#FFE6A7", "#FFB3C1"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blobTop} />
      <LinearGradient colors={["#B5E4FF", "#D7C3FF"] as const} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.blobBottom} />

      {challenges.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No challenges available</Text>
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.container}
          ListHeaderComponent={
            <>
              {/* Intro animation: brand + hero */}
              <Animated.View entering={FadeIn.duration(600)} style={styles.brandRow}>
                <Text onPress={()=> {setUseOrigginal(!useOriginal)}} style={styles.brand}>ARise</Text>
                <Ionicons name="sparkles" size={22} color={`${useOriginal ? "#6C2BD9" : "#ff6a00ff"}`} />
              </Animated.View>
              <Animated.View entering={ZoomIn.springify().delay(50)}>
                <LinearGradient colors={["#7C3AED", "#4F46E5"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Hey superstar! 🌟</Text>
                    <Text style={styles.heroSubtitle}>Choose a fun challenge and let’s play!</Text>
                  </View>
                  <View style={styles.emojiBadge}><Text style={styles.emojiText}>🎯</Text></View>
                </LinearGradient>
              </Animated.View>
            </>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(150 + index * 90).springify()}>
              <TouchableOpacity
                 style={styles.card}
                 onPress={() =>
                 useOriginal
                 ? router.push({ pathname: "/binoosh/challenge-student-five", params: { challengeId: item._id } })
                 : router.push({ pathname: "/binoosh/challenge-student-four", params: { challengeId: item._id } })
                }
                activeOpacity={0.9}
                >
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.pill}>
                    <Ionicons name="language" size={12} color="#4F46E5" />
                    <Text style={styles.pillText}>{item.words?.length ?? 0}</Text>
                  </View>
                </View>
                <Text style={styles.wordCount}>Fun words inside! Are you ready?</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 16, paddingBottom: 40 },
  // Decorative blobs
  blobTop: { position: "absolute", top: -80, left: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },
  blobBottom: { position: "absolute", bottom: -70, right: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  brand: { fontSize: 22, fontWeight: "800", color: "#111827" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" , backgroundColor: '#ffffff'},
  emptyText: { fontSize: 16, color: "#666" },
  heroCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 18, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  heroSubtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  emojiText: { fontSize: 26 },
  card: { backgroundColor: "#ffffff", padding: 16, marginVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800" },
  wordCount: { fontSize: 14, color: "#6B7280" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: "#4F46E5", fontWeight: "800", fontSize: 12 },
});
