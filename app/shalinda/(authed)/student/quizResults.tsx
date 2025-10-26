import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
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
import { useRouter } from "expo-router";

const QUIZ_API_URL =
  process.env.EXPO_PUBLIC_QUIZ_API_URL ?? "http://192.168.0.195:8082";

type QuizReport = {
  id: string;
  title: string;
  studentId: string;
  quizId: string;
  answers: { questionIndex: number; answer: string }[];
  score: number;
  submittedAt: { _seconds: number; _nanoseconds: number };
};

export default function QuizResultsScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  const [reports, setReports] = useState<QuizReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/shalinda/login");
      return;
    }
    if (user.role !== "student") {
      router.replace("/shalinda/(authed)/tutor/tutorHome");
      return;
    }

    const fetchReports = async () => {
      console.log("Fetching");

      try {
        const res = await fetch(`${QUIZ_API_URL}/quiz/reports`, {
          headers: {
            Authorization: `Bearer ${user.idToken}`,
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setReports(data);
      } catch (e) {
        console.error("Failed to fetch reports", e);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (!user || user.role !== "student") return null;

  return (
    <RoleAwareSidebarLayout title="Quiz Results">
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.heading}>📝 Attempted Quizes</Text>

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 40 }} />
          ) : reports.length === 0 ? (
            <Text style={styles.emptyText}>No enrolled quizzes found.</Text>
          ) : (
            <FlatList
              data={reports}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/shalinda/(authed)/student/quiz/[id]",
                      params: { id: item.quizId },
                    })
                  }
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.quizId}>Quiz: {item.title}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#6b7280"
                    />
                  </View>

                  <Text style={styles.meta}>Score: {item.score}</Text>
                  <Text style={styles.meta}>
                    Submitted:{" "}
                    {new Date(
                      item.submittedAt._seconds * 1000
                    ).toLocaleString()}
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
  quizId: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 14, color: "#6b7280" },
});
