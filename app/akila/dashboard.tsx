import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AkilaDashboard() {
  return (
    <RoleAwareSidebarLayout title="Surface Dyslexia Hub">
      <LinearGradient colors={["#f5f3ff", "#e0e7ff", "#ffffff"]} style={styles.gradient}>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroLabel}>Quick Overview</Text>
            <Text style={styles.heroTitle}>Surface Dyslexia Modules</Text>
            <Text style={styles.heroCopy}>
              Access QR story missions, pronunciation drills, and progress celebrations in one place.
            </Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="planet" size={30} color="#fdf4ff" />
          </View>
        </View>

        <View style={styles.cards}>
          <View style={[styles.card, styles.cardPurple]}>
            <Ionicons name="qr-code" size={22} color="#fff" />
            <Text style={styles.cardTitle}>Story Scanner</Text>
            <Text style={styles.cardCopy}>
              Launch the AR story explorer for the latest word quests.
            </Text>
          </View>
          <View style={[styles.card, styles.cardPink]}>
            <Ionicons name="mic" size={22} color="#fff" />
            <Text style={styles.cardTitle}>Pronunciation Coach</Text>
            <Text style={styles.cardCopy}>
              Review recent pronunciation attempts and provide quick feedback.
            </Text>
          </View>
          <View style={[styles.card, styles.cardGold]}>
            <Ionicons name="ribbon" size={22} color="#fff" />
            <Text style={styles.cardTitle}>Celebrate Wins</Text>
            <Text style={styles.cardCopy}>
              Send a celebration or encouragement scene to your learner.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, padding: 24, gap: 24 },
  hero: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    gap: 20,
    shadowColor: "#4c1d95",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 10,
  },
  heroText: { flex: 1 },
  heroLabel: { fontSize: 14, fontWeight: "700", color: "#4338ca", letterSpacing: 0.4 },
  heroTitle: { marginTop: 6, fontSize: 26, fontWeight: "900", color: "#1f1147" },
  heroCopy: { marginTop: 10, color: "#4c1d95", fontWeight: "600", lineHeight: 20 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
  },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    flex: 1,
    minWidth: 220,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
  cardPurple: { backgroundColor: "#8b5cf6" },
  cardPink: { backgroundColor: "#ec4899" },
  cardGold: { backgroundColor: "#f59e0b" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  cardCopy: { color: "rgba(255,255,255,0.92)", fontWeight: "600", lineHeight: 18 },
});
