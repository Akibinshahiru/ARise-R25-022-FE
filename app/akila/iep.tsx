import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import AllIEPReportsList from "@/components/IT21832826/screens/iep_reports/AllIEPReportsList";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Metric = {
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

export default function AkilaIepPage() {
  const router = useRouter();

  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: "Pending Reviews",
        value: "5",
        hint: "IEP summaries awaiting approval",
        accent: "#6366f1",
        icon: "document-text-outline",
      },
      {
        label: "Evaluations This Week",
        value: "12",
        hint: "Pronunciation sessions uploaded",
        accent: "#ec4899",
        icon: "mic-outline",
      },
      {
        label: "Celebrations Sent",
        value: "8",
        hint: "Motivational scenes shared",
        accent: "#f59e0b",
        icon: "sparkles-outline",
      },
    ],
    []
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        label: "Generate New IEP",
        hint: "Create a report from recent evaluations",
        icon: "add-circle-outline",
        path: "/akila/iep",
        colors: ["#6366f1", "#8b5cf6"],
      },
      {
        label: "Launch Pronunciation Coach",
        hint: "Guide a learner through word practice",
        icon: "mic-circle-outline",
        path: "/akila/surface-dyslexia",
        colors: ["#ec4899", "#f472b6"],
      },
    ],
    []
  );

  return (
    <RoleAwareSidebarLayout title="IEP Dashboard">
      <LinearGradient colors={["#f5f3ff", "#eef2ff", "#ffffff"]} style={styles.gradient}>
        <View pointerEvents="none" style={[styles.blobOne, { top: -120 }]} />
        <View pointerEvents="none" style={styles.blobTwo} />
        <View pointerEvents="none" style={styles.blobThree} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroText}>
              <Text style={styles.heroGreeting}>Tutor Console</Text>
              <Text style={styles.heroTitle}>Individualized Education Plans</Text>
              <Text style={styles.heroCopy}>
                Track learner progress, review AI-generated insights, and export professional reports in one place.
              </Text>
              <View style={styles.heroPillsRow}>
                <View style={styles.heroPill}>
                  <Ionicons name="time-outline" size={14} color="#4338ca" />
                  <Text style={styles.heroPillText}>Updated moments ago</Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#4338ca" />
                  <Text style={styles.heroPillText}>Data securely backed up</Text>
                </View>
              </View>
            </View>
            <LinearGradient colors={["#fb923c", "#f97316"]} style={styles.heroBadge}>
              <Ionicons name="analytics" size={26} color="#fff" />
              <Text style={styles.heroBadgeText}>Tutor</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricsRow}>
            {metrics.map((metric) => (
              <LinearGradient
                key={metric.label}
                colors={[metric.accent, `${metric.accent}CC` as any]}
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
            <Text style={styles.sectionTitle}>Reports & Insights</Text>
            <Text style={styles.sectionHint}>
              Review, export, and share up-to-date plans tailored for each learner.
            </Text>
          </View>

          <View style={styles.reportsCard}>
            <AllIEPReportsList />
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
    left: -60,
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
  heroText: { flex: 1, gap: 12 },
  heroGreeting: {
    color: "#4338ca",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1f1147",
    letterSpacing: 0.5,
  },
  heroCopy: {
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
    backgroundColor: "rgba(99,102,241,0.12)",
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
    shadowColor: "#f97316",
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
  reportsCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    shadowColor: "#312e81",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
});
