import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

export default function TutorHome() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  // Guard: only tutors
  useEffect(() => {
    if (!user) router.replace("/login");
    else if (user.role !== "tutor")
      router.replace("/shalinda/(authed)/student/studentHome");
  }, [user]);

  if (!user || user.role !== "tutor") return null;

  const cards = [
    {
      name: "Create Quiz",
      path: "/shalinda/(authed)/tutor/createQuiz",
      colors: ["#4f46e5", "#6366f1"],
    },
    {
      name: "My Quizes",
      path: "/shalinda/(authed)/tutor/myQuizes",
      colors: ["#0083B0", "#00B4DB"],
    },
    {
      name: "View Reports",
      path: "/shalinda/(authed)/tutor/viewReports",
      colors: ["#059669", "#10b981"],
    },
  ];

  return (
    <RoleAwareSidebarLayout title="Tutor Home">
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.row}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.name}
                style={{ flex: 0.48 }}
                onPress={() => router.push({ pathname: card.path } as any)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={card.colors as any} style={styles.card}>
                  <Text style={styles.cardText}>{card.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    height: 140,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
