import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
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

type MetricCard = {
  label: string;
  value: string;
  hint: string;
  accent: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

type QuickAction = {
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  path: string;
  colors: [string, string];
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
          ? "Open Hiruni’s analytics dashboard for cross-cohort trends."
          : "Check your streaks, achievements, and bonus missions.",
        path: "/hiruni/splash",
        colors: ["#14b8a6", "#22d3ee"],
        icon: "analytics",
      },
    ],
    [isTutor]
  );

  const metrics = useMemo<MetricCard[]>(
    () =>
      isTutor
        ? [
            {
              label: "Learners Active",
              value: "18",
              hint: "visited stories this week",
              accent: "#8b5cf6",
              icon: "people-outline",
            },
            {
              label: "IEP Reports",
              value: "5",
              hint: "awaiting review",
              accent: "#ec4899",
              icon: "document-text-outline",
            },
            {
              label: "Celebrations",
              value: "12",
              hint: "shared this month",
              accent: "#f59e0b",
              icon: "sparkles-outline",
            },
          ]
        : [
            {
              label: "Story Streak",
              value: "7",
              hint: "days in a row",
              accent: "#8b5cf6",
              icon: "flame-outline",
            },
            {
              label: "Words Practiced",
              value: "42",
              hint: "this month",
              accent: "#ec4899",
              icon: "book-outline",
            },
            {
              label: "Badges Earned",
              value: "9",
              hint: "keep collecting",
              accent: "#22d3ee",
              icon: "ribbon-outline",
            },
          ],
    [isTutor]
  );

  const quickActions = useMemo<QuickAction[]>(
    () =>
      isTutor
        ? [
            {
              label: "Launch Story Scanner",
              hint: "Open the AR QR experience",
              icon: "qr-code-outline",
              path: "/akila/surface-dyslexia",
              colors: ["#a855f7", "#6366f1"],
            },
            {
              label: "Evaluate Pronunciation",
              hint: "Review latest recordings",
              icon: "mic-outline",
              path: "/akila/iep",
              colors: ["#ec4899", "#f472b6"],
            },
          ]
        : [
            {
              label: "Continue Story Quest",
              hint: "Pick up where you left off",
              icon: "play-circle-outline",
              path: "/akila/surface-dyslexia",
              colors: ["#a855f7", "#6366f1"],
            },
            {
              label: "Practice Pronunciation",
              hint: "Try a new word challenge",
              icon: "mic-outline",
              path: "/akila/encouragement",
              colors: ["#22d3ee", "#38bdf8"],
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
        <View pointerEvents="none" style={[styles.blobOne, { top: -120 }]} />
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
              <View style={styles.heroPillsRow}>
                <View style={styles.heroPill}>
                  <Ionicons name="time-outline" size={14} color="#4338ca" />
                  <Text style={styles.heroPillText}>
                    {isTutor ? "Live classroom mode" : "Daily quests ready"}
                  </Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#4338ca" />
                  <Text style={styles.heroPillText}>Progress synced securely</Text>
                </View>
              </View>
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

          <View style={styles.metricsRow}>
            {metrics.map((metric) => (
              <LinearGradient
                key={metric.label}
                colors={[metric.accent, `${metric.accent}CC`]}
                style={styles.metricCard}
              >
                <View style={styles.metricIconBubble}>
                  <Ionicons name={metric.icon} size={20} color="#fdf4ff" />
                </View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricHint}>{metric.hint}</Text>
              </LinearGradient>
            ))}
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: action.path } as any)}
              >
                <LinearGradient colors={action.colors} style={styles.quickActionCard}>
                  <Ionicons name={action.icon} size={20} color="#fdf4ff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                    <Text style={styles.quickActionHint}>{action.hint}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#fdf4ff" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
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
    left: -50,
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
  heroTextBlock: { flex: 1, gap: 12 },
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
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: "#4c1d95",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  heroPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(79,70,229,0.12)",
  },
  heroPillText: {
    color: "#4338ca",
    fontSize: 12,
    fontWeight: "700",
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
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 22,
    padding: 18,
    gap: 8,
    shadowColor: "#312e81",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
  },
  metricIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(253,244,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fdf4ff",
  },
  metricHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  quickActions: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: "#312e81",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fdf4ff",
    letterSpacing: 0.4,
  },
  quickActionHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(253,244,255,0.85)",
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
  cardsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },
  cardTap: {
    width: "48%",
  },
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
