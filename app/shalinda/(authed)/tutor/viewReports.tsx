import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";

const QUIZ_API_URL =
  process.env.EXPO_PUBLIC_QUIZ_API_URL ?? "http://localhost:8082";

type Quiz = {
  id: string;
  title: string;
  createdAt?: string;
  questions?: Array<any>;
  tutorId?: string;
  assignedStudents?: string[];
};

type ReportAnswer = {
  questionIndex: number;
  answer?: string; // legacy
  studentAnswer?: string; // preferred if present
  correctAnswer?: string;
  attempts?: number;
  mistyped?: string[];
};

type ReportItem = {
  id: string;
  studentId: string;
  quizId: string;
  answers: ReportAnswer[];
  score: number;
  submittedAt:
    | { _seconds: number; _nanoseconds?: number }
    | string
    | number
    | Date;
};

export default function ViewReportsScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const { quizId: qpQuizId, id: qpId } = useLocalSearchParams<{
    quizId?: string;
    id?: string;
  }>();

  // If the screen is opened with a quizId param, we’ll use it directly.
  const paramQuizId = qpQuizId ?? qpId ?? null;

  // Quizzes list state (when no quizId param)
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(
    paramQuizId
  );

  // Reports state (when a quiz is selected)
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsRefreshing, setReportsRefreshing] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);

  // Details modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ReportItem | null>(null);

  // Tutor-only guard
  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "tutor") {
      router.replace("/shalinda/(authed)/student/studentHome");
    }
  }, [user]);

  const toDate = (ts: ReportItem["submittedAt"]) => {
    try {
      if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
        const secs = (ts as any)._seconds as number;
        const nanos = (ts as any)._nanoseconds ? (ts as any)._nanoseconds : 0;
        return new Date(secs * 1000 + Math.floor(nanos / 1e6));
      }
      if (typeof ts === "string" || typeof ts === "number") {
        return new Date(ts);
      }
      if (ts instanceof Date) return ts;
      return new Date();
    } catch {
      return new Date();
    }
  };

  const fmt = (d: Date) => {
    const opts: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return d.toLocaleString(undefined, opts);
  };

  // Fetch all quizzes (only needed when no quizId param or when going "back to list")
  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    setQuizzesError(null);
    setQuizzesLoading(true);
    try {
      const res = await fetch(`${QUIZ_API_URL}/quiz`, {
        headers: { Authorization: `Bearer ${user.idToken}` },
      });
      if (!res.ok)
        throw new Error((await res.text()) || "Failed to load quizzes");
      const data = (await res.json()) as Quiz[];
      // sort newest first
      data.sort((a, b) => {
        const ta = a.createdAt ? +new Date(a.createdAt) : 0;
        const tb = b.createdAt ? +new Date(b.createdAt) : 0;
        return tb - ta;
      });
      setQuizzes(data);
    } catch (e: any) {
      console.error(e);
      setQuizzesError(e.message || "Could not load quizzes");
    } finally {
      setQuizzesLoading(false);
    }
  }, [user]);

  // Fetch reports for a selected quiz
  const fetchReports = useCallback(
    async (qid: string) => {
      if (!user || !qid) return;
      setReportsError(null);
      setReportsLoading(true);
      try {
        const res = await fetch(`${QUIZ_API_URL}/quiz/reports/${qid}`, {
          headers: { Authorization: `Bearer ${user.idToken}` },
        });
        if (!res.ok)
          throw new Error((await res.text()) || "Failed to load reports");
        const data = (await res.json()) as ReportItem[];
        data.sort((a, b) => +toDate(b.submittedAt) - +toDate(a.submittedAt));
        setReports(data);
      } catch (e: any) {
        console.error(e);
        setReportsError(e.message || "Could not load reports");
      } finally {
        setReportsLoading(false);
        setReportsRefreshing(false);
      }
    },
    [user]
  );

  // Initial load:
  useEffect(() => {
    if (selectedQuizId) {
      // we have a quiz id (from param or user selection) → fetch reports
      fetchReports(selectedQuizId);
    } else {
      // no quiz selected → fetch list
      fetchQuizzes();
    }
  }, [selectedQuizId, fetchReports, fetchQuizzes]);

  const totals = useMemo(() => {
    if (!reports.length) return { submissions: 0, avgScore: 0, avgPct: 0 };
    const submissions = reports.length;
    let sumPct = 0;
    let sumScore = 0;
    reports.forEach((r) => {
      const denom = r.answers?.length || 0;
      const pct = denom ? (r.score / denom) * 100 : 0;
      sumPct += pct;
      sumScore += r.score;
    });
    return {
      submissions,
      avgScore: +(sumScore / submissions).toFixed(2),
      avgPct: +(sumPct / submissions).toFixed(1),
    };
  }, [reports]);

  const totalAttempts = (r: ReportItem) =>
    (r.answers || []).reduce((acc, a) => acc + (a.attempts || 0), 0);

  const openDetails = (r: ReportItem) => {
    setSelectedSubmission(r);
    setDetailOpen(true);
  };

  // ====== RENDER: QUIZ LIST (no selected quiz) ======
  if (!selectedQuizId) {
    if (quizzesLoading) {
      return (
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Loading quizzes…</Text>
        </SafeAreaView>
      );
    }

    if (quizzesError) {
      return (
        <SafeAreaView style={styles.center}>
          <Text style={styles.errText}>{quizzesError}</Text>
          <TouchableOpacity style={styles.btn} onPress={fetchQuizzes}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <RoleAwareSidebarLayout title="View Reports">
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <Text style={styles.heading}>📚 Your Quizes</Text>
            <Text style={styles.subheading}>
              Choose a quiz to view submissions
            </Text>

            <FlatList
              data={quizzes}
              keyExtractor={(q) => q.id}
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const qCount = item.questions?.length ?? 0;
                const dateText = item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "—";
                return (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {item.title || "Untitled Quiz"}
                    </Text>
                    <Text style={styles.metaText}>Quiz ID: {item.id}</Text>
                    <Text style={styles.metaText}>Questions: {qCount}</Text>
                    <Text style={styles.metaText}>Created: {dateText}</Text>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.btn}
                        onPress={() => setSelectedQuizId(item.id)}
                      >
                        <Text style={styles.btnText}>View Reports</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>No quizzes found.</Text>
              }
            />
          </View>
        </SafeAreaView>
      </RoleAwareSidebarLayout>
    );
  }

  // ====== RENDER: REPORTS VIEW (quiz selected) ======
  if (reportsLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading reports…</Text>
      </SafeAreaView>
    );
  }

  if (reportsError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errText}>{reportsError}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => fetchReports(selectedQuizId!)}
          >
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() => setSelectedQuizId(null)}
          >
            <Text style={[styles.btnText, { color: "#111827" }]}>
              Back to Quizzes
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>📊 Quiz Reports</Text>
        <Text style={styles.subheading}>Quiz ID: {selectedQuizId}</Text>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Submissions</Text>
            <Text style={styles.pillValue}>{totals.submissions}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Avg. Score</Text>
            <Text style={styles.pillValue}>{totals.avgScore}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Avg. %</Text>
            <Text style={styles.pillValue}>{totals.avgPct}%</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn, { flexGrow: 1 }]}
            onPress={() => setSelectedQuizId(null)}
          >
            <Text style={[styles.btnText, { color: "#111827" }]}>
              ← Back to Quizzes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { flexGrow: 1 }]}
            onPress={() => {
              setReportsRefreshing(true);
              fetchReports(selectedQuizId!);
            }}
          >
            <Text style={styles.btnText}>
              {reportsRefreshing ? "Refreshing…" : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reports list */}
        <FlatList
          data={reports}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const when = fmt(toDate(item.submittedAt));
            const attemptsSum = totalAttempts(item);
            const denom = item.answers?.length || 0;
            const pct = denom ? Math.round((item.score / denom) * 100) : 0;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>
                    Student: {item.studentId}
                  </Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>
                      {item.score}/{denom} • {pct}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText}>Submitted: {when}</Text>
                <Text style={styles.metaText}>
                  Total Attempts: {attemptsSum}
                </Text>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => openDetails(item)}
                  >
                    <Text style={styles.btnText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No submissions yet.</Text>
          }
        />

        {/* Details Modal */}
        <Modal
          visible={detailOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submission Details</Text>
                <TouchableOpacity
                  onPress={() => setDetailOpen(false)}
                  style={styles.closeX}
                >
                  <Text style={{ color: "#111827", fontWeight: "900" }}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedSubmission ? (
                <ScrollView
                  style={{
                    maxHeight: Platform.select({ ios: 560, android: 560 }),
                  }}
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  <Text style={styles.modalMeta}>
                    Student:{" "}
                    <Text style={styles.bold}>
                      {selectedSubmission.studentId}
                    </Text>
                  </Text>
                  <Text style={styles.modalMeta}>
                    Submitted:{" "}
                    <Text style={styles.bold}>
                      {fmt(toDate(selectedSubmission.submittedAt))}
                    </Text>
                  </Text>
                  {/* <Text style={styles.modalMeta}>
                    Score:{" "}
                    <Text style={styles.bold}>
                      {selectedSubmission.score}/
                      {selectedSubmission.answers?.length || 0}
                    </Text>
                  </Text> */}

                  {(selectedSubmission.answers || []).map((a, idx) => {
                    const studentAns = (
                      a.studentAnswer ??
                      a.answer ??
                      ""
                    ).trim();
                    const correctAns = (a.correctAnswer ?? "").trim();
                    const attempts = a.attempts ?? 0;
                    const mistyped = Array.isArray(a.mistyped)
                      ? a.mistyped
                      : [];
                    const showCorrect = Boolean(correctAns.length);
                    const isCorrect =
                      showCorrect && studentAns
                        ? studentAns.trim().toLowerCase() ===
                          correctAns.toLowerCase()
                        : undefined;

                    return (
                      <View key={idx} style={styles.detailRow}>
                        <Text style={styles.detailQ}>
                          Q{(a.questionIndex ?? idx) + 1}
                        </Text>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>
                            Student Answer:
                            <Text
                              style={[
                                styles.detailValue,
                                isCorrect === true && styles.correct,
                                isCorrect === false && styles.incorrect,
                              ]}
                            >
                              {" "}
                              {studentAns || "—"}
                            </Text>
                          </Text>

                          {showCorrect ? (
                            <Text style={styles.detailLabel}>
                              Correct Answer:
                              <Text
                                style={[styles.detailValue, styles.correct]}
                              >
                                {" "}
                                {correctAns}
                              </Text>
                            </Text>
                          ) : null}

                          <Text style={styles.detailLabel}>
                            Attempts:
                            <Text style={styles.detailValue}> {attempts}</Text>
                          </Text>

                          {mistyped.length ? (
                            <Text style={styles.detailLabel}>
                              Mistyped:{" "}
                              <Text style={styles.detailValue}>
                                {mistyped.join(", ")}
                              </Text>
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.btn, styles.secondaryBtn, { flex: 1 }]}
                  onPress={() => setDetailOpen(false)}
                >
                  <Text style={[styles.btnText, { color: "#111827" }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subheading: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  pill: {
    minWidth: 110,
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    opacity: 0.75,
  },
  pillValue: { fontSize: 16, fontWeight: "900", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 2,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    maxWidth: "70%",
  },
  scoreBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scoreBadgeText: { color: "#fff", fontWeight: "800" },
  metaText: { color: "#6b7280", marginTop: 6 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  btn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  secondaryBtn: { backgroundColor: "#F3F4F6" },
  btnText: { color: "#fff", fontWeight: "800" },

  empty: { textAlign: "center", color: "#6b7280", marginTop: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errText: {
    color: "#b91c1c",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  closeX: {
    backgroundColor: "#F3F4F6",
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  modalMeta: { color: "#374151", marginTop: 6 },
  bold: { fontWeight: "800", color: "#111827" },

  detailRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailQ: { fontWeight: "900", color: "#4F46E5", width: 40 },
  detailLabel: { color: "#374151", marginTop: 4, fontWeight: "700" },
  detailValue: { color: "#111827", fontWeight: "800" },
  correct: { color: "#059669" },
  incorrect: { color: "#DC2626" },

  modalFooter: { flexDirection: "row", gap: 10, marginTop: 12 },
});
