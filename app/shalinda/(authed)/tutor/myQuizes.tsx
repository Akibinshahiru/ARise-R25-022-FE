import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

const QUIZ_API_URL =
  process.env.EXPO_PUBLIC_QUIZ_API_URL ?? "http://192.168.0.195:8082";

type Quiz = {
  id: string;
  title: string;
  createdAt: string;
  questions: { sentence: string; answer: string }[];
  assignedStudents: string[];
};

export default function MyQuizzesScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${QUIZ_API_URL}/quiz`, {
        headers: { Authorization: `Bearer ${user.idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "tutor") {
      router.replace("/shalinda/(authed)/student/studentHome");
      return;
    }
    fetchQuizzes();
  }, [user, fetchQuizzes]);

  if (!user || user.role !== "tutor") return null;

  return (
    <RoleAwareSidebarLayout title="My Quizzes">
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          {/* Decorative blobs behind content (won’t block taps) */}
          <LinearGradient
            pointerEvents="none"
            colors={["#FFE6A7", "#bd092aff"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.blobTop}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["#B5E4FF", "#D7C3FF"] as const}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.blobBottom}
          />

          <FlatList
            data={quizzes}
            keyExtractor={(q) => q.id}
            contentContainerStyle={styles.container}
            ListHeaderComponent={
              <>
                {/* Brand */}
                <View style={styles.brandRow}>
                  <Text style={styles.brand}>ARise</Text>
                  <Ionicons name="sparkles" size={22} color="#6C2BD9" />
                </View>

                {/* Greeting / CTA */}
                <LinearGradient
                  colors={["#7C3AED", "#4F46E5"] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.greetingCard}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hello}>Your Quizzes</Text>
                    <Text style={styles.subtitle}>
                      Review, assign, and track student progress.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.createBtn}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push("/shalinda/(authed)/tutor/createQuiz" as any)
                    }
                  >
                    <Ionicons name="add" size={18} color="#7C3AED" />
                    <Text style={styles.createBtnText}>New</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <Text style={styles.sectionTitle}>My Quizzes</Text>
                {loading && (
                  <ActivityIndicator size="large" style={{ marginTop: 12 }} />
                )}
                {!loading && quizzes.length === 0 && (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>
                      No quizzes yet. Create your first one!
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push(
                          "/shalinda/(authed)/tutor/createQuiz" as any
                        )
                      }
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={["#A78BFA", "#F472B6"] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emptyCta}
                      >
                        <Ionicons name="create-outline" size={18} color="#fff" />
                        <Text style={styles.emptyCtaText}>Create Quiz</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/shalinda/(authed)/tutor/quizPreview",
                    params: { quiz: encodeURIComponent(JSON.stringify(item)) },
                  })
                }
              >
                {/* Gradient stripe */}
                <LinearGradient
                  colors={["#A78BFA", "#F472B6"] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardStripe}
                />
                <View style={styles.cardInner}>
                  <View style={styles.cardTop}>
                    <Text style={styles.quizTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Ionicons name="help-circle-outline" size={14} color="#6b7280" />
                      <Text style={styles.metaText}>
                        {item.questions?.length} question
                        {item.questions?.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="people-outline" size={14} color="#6b7280" />
                      <Text style={styles.metaText}>
                        {item.assignedStudents?.length} student
                        {item.assignedStudents?.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.createdText}>
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchQuizzes();
                }}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  screen: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 20, paddingBottom: 24 },

  // decorative blobs
  blobTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
    zIndex: -1,
  },
  blobBottom: {
    position: "absolute",
    bottom: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
    zIndex: -1,
  },

  // brand + greeting
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
  hello: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  createBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createBtnText: { color: "#7C3AED", fontSize: 14, fontWeight: "800" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  // empty state
  emptyWrap: { alignItems: "center", marginTop: 16 },
  emptyText: { color: "#6b7280", fontSize: 16, marginBottom: 12, textAlign: "center" },
  emptyCta: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyCtaText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // list cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: "hidden",
  },
  cardStripe: { height: 6, width: "100%" },
  cardInner: { padding: 14 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  quizTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },

  metaRow: { flexDirection: "row", gap: 10, marginTop: 2, marginBottom: 6 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },

  createdText: { fontSize: 12, color: "#6b7280" },
});
