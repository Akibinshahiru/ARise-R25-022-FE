import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "tutor") {
      router.replace("/shalinda/(authed)/student/studentHome");
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const res = await fetch(`${QUIZ_API_URL}/quiz`, {
          headers: {
            Authorization: `Bearer ${user.idToken}`, // ✅ attach bearer token
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        console.log(data);

        setQuizzes(data);
      } catch (err) {
        console.error("Failed to load quizzes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [user]);

  if (!user || user.role !== "tutor") return null;

  return (
    <RoleAwareSidebarLayout title="My Quizzes">
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.heading}>📚 My Quizzes</Text>

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 40 }} />
          ) : quizzes.length === 0 ? (
            <Text style={styles.emptyText}>No quizzes created yet.</Text>
          ) : (
            <FlatList
              data={quizzes}
              keyExtractor={(q) => q.id}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/shalinda/(authed)/tutor/quizPreview",
                      params: {
                        quiz: encodeURIComponent(JSON.stringify(item)),
                      },
                    })
                  }
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.quizTitle}>{item.title}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#6b7280"
                    />
                  </View>
                  <Text style={styles.meta}>
                    {item.questions?.length} question
                    {item.questions?.length === 1 ? "" : "s"} •{" "}
                    {item.assignedStudents?.length} student
                    {item.assignedStudents?.length === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.meta}>
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    color: "#111827",
  },
  emptyText: {
    marginTop: 40,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
  },
  card: {
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  quizTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 14, color: "#6b7280" },
});
