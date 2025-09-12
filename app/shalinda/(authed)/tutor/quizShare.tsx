import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function QuizShareScreen() {
  const router = useRouter();
  const { quiz } = useLocalSearchParams<{ quiz?: string }>();
  const parsedQuiz = quiz ? JSON.parse(decodeURIComponent(quiz)) : null;
  const user = useSelector((s: RootState) => s.auth.user);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>🎉 Quiz Created!</Text>
        <Text style={styles.subheading}>
          Ask your students to scan this QR to join:
        </Text>

        <View style={styles.qrWrap}>
          <QRCode value={parsedQuiz.id} size={220} />
        </View>

        <Text style={styles.linkText}>{parsedQuiz.id}</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace("/shalinda/(authed)/tutor/tutorHome")}
        >
          <Text style={styles.btnText}>Back to Tutor Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 24,
    textAlign: "center",
  },
  qrWrap: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 32,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
