import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { generateSentences } from "@/utils/IT21801204/sentenceGenerator";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";

export default function QuizPreviewScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const { words } = useLocalSearchParams<{ words?: string }>();

  // Tutor-only guard
  useEffect(() => {
    if (!user) router.replace("/shalinda/login");
    else if (user.role !== "tutor")
      router.replace("/shalinda/(authed)/student/studentHome");
  }, [user]);

  // Decode the list from params
  const selectedWords: string[] = useMemo(() => {
    try {
      if (!words) return [];
      const parsed = JSON.parse(decodeURIComponent(words));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [words]);

  const sentences = useMemo(() => {
    return generateSentences(selectedWords);
  }, [selectedWords]);

  if (!user || user.role !== "tutor") return null;

  const confirmCreate = () => {
    if (!selectedWords.length) {
      Alert.alert("No words found", "Go back and add some words first.");
      return;
    }

    // TODO: call your backend or redux action here to persist a quiz
    // e.g. await api.createQuiz({ words: selectedWords, createdBy: user.uid })

    // Alert.alert("Quiz Created 🎉", `Words: ${selectedWords.join(", ")}`, [
    //   {
    //     text: "Done",
    //     onPress: () => router.replace("/shalinda/(authed)/tutorHome"),
    //   },
    // ]);
  };

  return (
    <RoleAwareSidebarLayout title="Preview Quiz">
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.heading}>🧩 Quiz Preview</Text>
          <Text style={styles.subheading}>
            Review your selected words before creating the quiz.
          </Text>

          <View style={styles.countPill}>
            <Ionicons name="list" size={18} color="#111827" />
            <Text style={styles.countText}>
              {selectedWords.length} word{selectedWords.length === 1 ? "" : "s"}
            </Text>
          </View>

          <FlatList
            data={sentences}
            keyExtractor={(item, i) => `${item.word}-${i}`}
            renderItem={({ item, index }) => (
              <LinearGradient
                colors={["#4e54c8", "#8f94fb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wordChip}
              >
                <Text style={styles.wordText}>
                  {index + 1}. {item.word}
                </Text>
                <Text style={{ color: "#fff", marginTop: 6 }}>
                  {item.sentence}
                </Text>
              </LinearGradient>
            )}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.btn, styles.secondaryBtn]}
              accessibilityLabel="Go back and edit words"
            >
              <Text style={[styles.btnText, { color: "#111827" }]}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmCreate}
              style={styles.btn}
              accessibilityLabel="Confirm and create quiz"
            >
              <Text style={styles.btnText}>Create Quiz ✅</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
  },
  subheading: {
    marginTop: 6,
    fontSize: 16,
    textAlign: "center",
    color: "#374151",
    opacity: 0.9,
    marginBottom: 16,
  },
  countPill: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E0E7FF",
    marginBottom: 14,
  },
  countText: { fontWeight: "800", color: "#111827" },
  wordChip: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
  },
  wordText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptyText: { textAlign: "center", color: "#6b7280", marginTop: 20 },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 18,
  },
  btn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 150,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  secondaryBtn: { backgroundColor: "#F3F4F6" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
