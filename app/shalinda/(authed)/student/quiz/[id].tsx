import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

const QUIZ_API_URL =
  process.env.EXPO_PUBLIC_QUIZ_API_URL ?? "http://192.168.1.9:8082";

export default function StudentQuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const user = useSelector((s: RootState) => s.auth.user);

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!id || !user) return;

    console.log(id, user);

    const assignAndFetch = async () => {
      try {
        // 1) Assign quiz to student
        const assignRes = await fetch(`${QUIZ_API_URL}/quiz/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.idToken}`,
          },
          body: JSON.stringify({
            studentId: user.uid, // or user.id depending on your store
            quizId: id,
          }),
        });

        if (!assignRes.ok) {
          const err = await assignRes.text();
          throw new Error(err || "Failed to assign quiz");
        }

        // 2) Fetch quiz details
        const res = await fetch(`${QUIZ_API_URL}/quiz/${id}`, {
          headers: {
            Authorization: `Bearer ${user.idToken}`,
          },
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setQuiz(data);
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e.message || "Could not load quiz");
        router.replace("/shalinda/(authed)/student/studentHome");
      } finally {
        setLoading(false);
      }
    };

    assignAndFetch();
  }, [id, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading quiz…</Text>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No quiz found</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            router.replace("/shalinda/(authed)/student/studentHome")
          }
        >
          <Text style={styles.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = quiz.questions[currentIdx];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{quiz.title}</Text>
        <Text style={styles.subtitle}>
          Question {currentIdx + 1} of {quiz.questions.length}
        </Text>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {question.sentence.replace("WORD", "_____")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            if (currentIdx < quiz.questions.length - 1) {
              setCurrentIdx((i) => i + 1);
            } else {
              Alert.alert("Quiz Completed 🎉", "Well done!", [
                {
                  text: "OK",
                  onPress: () =>
                    router.replace("/shalinda/(authed)/student/studentHome"),
                },
              ]);
            }
          }}
        >
          <Text style={styles.btnText}>
            {currentIdx < quiz.questions.length - 1 ? "Next" : "Finish"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6b7280", marginBottom: 20 },
  questionCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginBottom: 20,
  },
  questionText: { fontSize: 18, fontWeight: "600" },
  btn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
