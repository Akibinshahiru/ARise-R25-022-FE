import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

type HubCard = {
  name: string;
  description: string;
  path: string;
  colors: [string, string];
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

export default function HomePage() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role;
  const isTutor = role === "tutor";

  useEffect(() => {
    if (!role) {
      router.replace("/login");
    }
  }, [role, router]);

  const cards = useMemo<HubCard[]>(
    () => [
      {
        name: "Surface Dyslexia",
        description: isTutor
          ? "Monitor learner progress, trigger IEP insights, and explore AR content."
          : "Dive into AR stories, QR hunts, and pronunciation practice quests.",
        path: isTutor ? "/akila/iep" : "/akila/surface-dyslexia",
        colors: ["#6d28d9", "#8b5cf6"],
        icon: "planet",
      },
      {
        name: "Phonological Dyslexia",
        description: isTutor
          ? "Review challenge boards and tailor sound-awareness interventions."
          : "Tackle rhythm drills and sound puzzles that build decoding strength.",
        path: isTutor ? "/binoosh/dashboard" : "/binoosh/view-challenges",
        colors: ["#ec4899", "#f472b6"],
        icon: "musical-notes",
      },
      {
        name: "Orthographic Dyslexia",
        description: isTutor
          ? "Access tutor tools for word-building journeys and custom lesson plans."
          : "Build word recognition with guided adventures and quick wins.",
        path: isTutor
          ? "/shalinda/(authed)/tutor/tutorHome"
          : "/shalinda/(authed)/student/studentHome",
        colors: ["#f59e0b", "#fbbf24"],
        icon: "sparkles",
      },
      {
        name: "Progress Lab",
        description: isTutor
          ? "Open Hiruni�s analytics dashboard for cross-cohort trends."
          : "Check your streaks, achievements, and bonus missions.",
        path: "/hiruni/dashboard",
        colors: ["#14b8a6", "#22d3ee"],
        icon: "analytics",
      },
    ],
    [isTutor]
  );

  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Explorer";
  const displayName =
    user?.email?.split("@")[0]?.replace(/\./g, " ") || (isTutor ? "Tutor" : "Learner");

  return (
    <RoleAwareSidebarLayout title={`${displayRole} Dashboard`}>
      <LinearGradient
        colors={["#f5f3ff", "#eef2ff", "#ffffff"]}
        style={styles.gradient}
      >
        <View pointerEvents="none" style={[styles.blobOne, { top: -90 }]} />
        <View pointerEvents="none" style={styles.blobTwo} />
        <View pointerEvents="none" style={styles.blobThree} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroGreeting}>Welcome back,</Text>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroSubtitle}>
                {isTutor
                  ? "Guide your learners with immersive AR lessons, instant evaluations, and ready-made reports."
                  : "Choose a journey to keep growing your reading superpowers with stories, games, and AR adventures."}
              </Text>
            </View>
            <LinearGradient
              colors={isTutor ? ["#fb923c", "#f97316"] : ["#a855f7", "#6366f1"]}
              style={styles.heroBadge}
            >
              <Ionicons
                name={isTutor ? "school" : "sparkles"}
                size={28}
                color="#fff"
              />
              <Text style={styles.heroBadgeText}>{displayRole}</Text>
            </LinearGradient>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose your journey</Text>
            <Text style={styles.sectionHint}>
              {isTutor
                ? "Quick access to AR tools, evaluation dashboards, and intervention hubs."
                : "Pick a pathway and continue your personalised AR reading adventure."}
            </Text>
          </View>

          <View style={styles.cardsWrap}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.name}
                activeOpacity={0.92}
                style={styles.cardTap}
                onPress={() => router.push({ pathname: card.path } as any)}
              >
                <LinearGradient colors={card.colors} style={styles.card}>
                  <View style={styles.cardIconBubble}>
                    <Ionicons name={card.icon} size={24} color="#fdf4ff" />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{card.name}</Text>
                    <Text style={styles.cardCopy}>{card.description}</Text>
                    <View style={styles.cardLinkRow}>
                      <Text style={styles.cardLink}>Open</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fdf4ff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 40,
  },
  content: {
    paddingBottom: 48,
    gap: 28,
  },
  blobOne: {
    position: "absolute",
    top: -60,
    left: -40,
    width: 220,
    height: 220,
    backgroundColor: "#e0e7ff",
    opacity: 0.55,
    borderRadius: 200,
  },
  blobTwo: {
    position: "absolute",
    bottom: 120,
    right: -50,
    width: 260,
    height: 260,
    backgroundColor: "#ffe4e6",
    opacity: 0.45,
    borderRadius: 260,
  },
  blobThree: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 280,
    height: 280,
    backgroundColor: "#ccfbf1",
    opacity: 0.4,
    borderRadius: 280,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#4c1d95",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  heroTextBlock: { flex: 1 },
  heroGreeting: {
    color: "#4338ca",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1f1147",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: 12,
    color: "#4c1d95",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  heroBadge: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#a855f7",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  heroBadgeText: {
    color: "#fdf4ff",
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  sectionHeader: { gap: 6, paddingHorizontal: 4 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#312e81",
  },
  sectionHint: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  cardsWrap: { gap: 18 },
  cardTap: { width: "100%" },
  card: {
    borderRadius: 24,
    padding: 18,
    minHeight: 170,
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 12,
  },
  cardIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(253, 244, 255, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { gap: 12 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fdf4ff",
    letterSpacing: 0.4,
  },
  cardCopy: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
  },
  cardLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardLink: { color: "#fdf4ff", fontWeight: "800", fontSize: 13 },
});

