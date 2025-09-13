import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Audio, type AVPlaybackSource } from "expo-av";

const QUIZ_API_URL =
  process.env.EXPO_PUBLIC_QUIZ_API_URL ?? "http://localhost:8082";

export default function StudentQuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const user = useSelector((s: RootState) => s.auth.user);

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question UI state
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Clue gating
  const [cluesUnlocked, setCluesUnlocked] = useState(false); // ≥3 fails
  const [showImageClue, setShowImageClue] = useState(false); // toggled by button
  const [revealedAnswer, setRevealedAnswer] = useState(false); // pressed after ≥5 fails

  // Tracking across the whole quiz
  const [attemptsPerQuestion, setAttemptsPerQuestion] = useState<number[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]); // last typed answer, correct or not
  const [mistypedPerQuestion, setMistypedPerQuestion] = useState<string[][]>(
    []
  ); // all wrong attempts

  // Audio
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Assign & fetch quiz
  useEffect(() => {
    if (!id || !user) return;

    const assignAndFetch = async () => {
      try {
        // Assign quiz
        const assignRes = await fetch(`${QUIZ_API_URL}/quiz/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.idToken}`,
          },
          body: JSON.stringify({ studentId: user.uid, quizId: id }),
        });
        if (!assignRes.ok)
          throw new Error((await assignRes.text()) || "Failed to assign quiz");

        // Fetch quiz
        const res = await fetch(`${QUIZ_API_URL}/quiz/${id}`, {
          headers: { Authorization: `Bearer ${user.idToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setQuiz(data);

        const qLen = data?.questions?.length ?? 0;
        setAttemptsPerQuestion(Array(qLen).fill(0));
        setStudentAnswers(Array(qLen).fill(""));
        setMistypedPerQuestion(
          Array(qLen)
            .fill(null)
            .map(() => [])
        );
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e.message || "Could not load quiz");
        router.replace("/shalinda/(authed)/student/studentHome");
      } finally {
        setLoading(false);
      }
    };

    assignAndFetch();
    return () => {
      stopAndUnloadSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Reset per-question UI when index changes
  useEffect(() => {
    setAnswerInput("");
    setFeedback(null);
    setCluesUnlocked(false);
    setShowImageClue(false);
    setRevealedAnswer(false);
    stopAndUnloadSound();
  }, [currentIdx]);

  const question = useMemo(
    () => (quiz ? quiz.questions[currentIdx] : null),
    [quiz, currentIdx]
  );

  const stopAndUnloadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
  };

  const toggleAudio = async (uri?: string | null) => {
    if (!uri) return;
    if (isPlaying) {
      await stopAndUnloadSound();
      return;
    }
    try {
      await stopAndUnloadSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri } as AVPlaybackSource,
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status?.didJustFinish) setIsPlaying(false);
      });

      await sound.playAsync();
    } catch {
      setIsPlaying(false);
      Alert.alert("Playback error", "Could not play the audio clue.");
    }
  };

  const normalize = (s: string) => s.trim().toLowerCase();

  const commitCurrentAnswerIfAny = () => {
    if (!quiz) return;
    const typed = answerInput.trim();
    if (!typed) return;
    setStudentAnswers((prev) => {
      const copy = prev.slice();
      if (copy[currentIdx] !== typed) copy[currentIdx] = typed;
      return copy;
    });
  };

  const sendSubmission = async () => {
    const answers = (quiz?.questions ?? []).map((q: any, idx: number) => ({
      questionIndex: idx,
      // keep your original field name:
      answer: studentAnswers[idx] ?? "",
      // extras for tutor insight:
      studentAnswer: studentAnswers[idx] ?? "",
      correctAnswer: q.answer,
      attempts: attemptsPerQuestion[idx] ?? 0,
      mistyped: mistypedPerQuestion[idx] ?? [],
    }));

    const payload = { quizId: quiz?.id, answers };
    console.log(payload);

    try {
      await fetch(`${QUIZ_API_URL}/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.idToken}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("Could not submit results:", e);
    }
  };

  const goNextOrFinish = async () => {
    // Ensure whatever is currently typed is persisted
    commitCurrentAnswerIfAny();

    const atEnd = currentIdx >= (quiz?.questions?.length ?? 1) - 1;
    if (atEnd) {
      await sendSubmission();
      Alert.alert("Quiz Completed 🎉", "Well done!", [
        {
          text: "OK",
          onPress: () =>
            router.replace("/shalinda/(authed)/student/studentHome"),
        },
      ]);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const markCorrectAndAdvance = () => {
    setFeedback("✅ Correct!");
    setTimeout(goNextOrFinish, 450);
  };

  const onRevealAnswerClick = () => {
    // Display only; do not autofill
    setRevealedAnswer(true);
    setFeedback("👀 Answer revealed. Type it in the box.");
  };

  const onCheckAnswer = () => {
    if (!question) return;

    const correct = normalize(question.answer);
    const givenRaw = answerInput.trim(); // keep original casing for logs
    const given = normalize(givenRaw);

    if (!givenRaw) {
      setFeedback("Type your answer in the blank.");
      return;
    }

    // Always store the latest typed value for this question (even if wrong)
    setStudentAnswers((prev) => {
      const copy = prev.slice();
      copy[currentIdx] = givenRaw;
      return copy;
    });

    if (given === correct) {
      markCorrectAndAdvance();
      return;
    }

    // Wrong attempt: increment counter and record mistyped word
    setAttemptsPerQuestion((prev) => {
      const copy = prev.slice();
      copy[currentIdx] = (copy[currentIdx] ?? 0) + 1;
      return copy;
    });
    setMistypedPerQuestion((prev) => {
      const copy = prev.map((arr) => arr.slice());
      copy[currentIdx].push(givenRaw);
      return copy;
    });

    const nextTotal = (attemptsPerQuestion[currentIdx] ?? 0) + 1;
    if (nextTotal >= 3) setCluesUnlocked(true);
    // After 5 total fails, reveal button will appear (no autofill)
    setFeedback("❌ Try again.");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading quiz…</Text>
      </SafeAreaView>
    );
  }

  if (!quiz || !question) {
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

  const hasImage = Boolean(question.imageUrl);
  const hasAudio = Boolean(question.audioUrl);
  const totalFailsForThis = attemptsPerQuestion[currentIdx] ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{quiz.title}</Text>
          <Text style={styles.subtitle}>
            Question {currentIdx + 1} of {quiz.questions.length} • Attempts:{" "}
            {totalFailsForThis}
          </Text>

          {/* Question with blank + input */}
          <View style={styles.questionCard}>
            <Text style={styles.promptLabel}>Fill in the blank:</Text>
            <Text style={styles.questionText}>
              {question.sentence.replace("WORD", "_____")}
            </Text>

            <TextInput
              placeholder="Type the missing word"
              placeholderTextColor="#9CA3AF"
              style={styles.answerInput}
              value={answerInput}
              onChangeText={setAnswerInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onCheckAnswer}
            />

            {revealedAnswer ? (
              <View style={styles.answerBadgeWrap}>
                <Text style={styles.answerBadgeLabel}>Answer:</Text>
                <Text style={styles.answerBadgeValue}>{question.answer}</Text>
                <Text style={styles.answerHint}>
                  Type this word in the box above.
                </Text>
              </View>
            ) : null}

            {totalFailsForThis >= 5 && !revealedAnswer ? (
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: "#ea580c", marginTop: 10 },
                ]}
                onPress={onRevealAnswerClick}
              >
                <Text style={styles.btnText}>Reveal Answer</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.helperText}>
              Clues unlock after 3 wrong attempts
              {totalFailsForThis >= 5 ? " • Reveal available" : ""}
            </Text>
          </View>

          {/* Clues: buttons after 3 wrong attempts */}
          {cluesUnlocked && (hasImage || hasAudio) ? (
            <View style={styles.cluesCard}>
              <Text style={styles.cluesTitle}>Clues</Text>

              {hasImage ? (
                <>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => setShowImageClue((v) => !v)}
                  >
                    <Text style={styles.smallBtnText}>
                      {showImageClue ? "Hide Image Clue" : "Show Image Clue"}
                    </Text>
                  </TouchableOpacity>
                  {showImageClue ? (
                    <View style={{ alignItems: "center", marginTop: 10 }}>
                      <Image
                        source={{ uri: question.imageUrl }}
                        style={styles.clueImage}
                      />
                    </View>
                  ) : null}
                </>
              ) : null}

              {hasAudio ? (
                <TouchableOpacity
                  style={[styles.smallBtn, { marginTop: 12 }]}
                  onPress={() => toggleAudio(question.audioUrl)}
                >
                  <Text style={styles.smallBtnText}>
                    {isPlaying ? "■ Stop Audio" : "▶ Play Audio Clue"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.btn} onPress={onCheckAnswer}>
              <Text style={styles.btnText}>Check Answer</Text>
            </TouchableOpacity>

            {normalize(answerInput) === normalize(question.answer) ? (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#10b981" }]}
                onPress={goNextOrFinish}
              >
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8, color: "#111827" },
  subtitle: { fontSize: 16, color: "#6b7280", marginBottom: 16 },

  questionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginBottom: 16,
  },
  promptLabel: { fontWeight: "700", color: "#111827", marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: "600", color: "#111827" },
  answerInput: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    fontSize: 16,
    color: "#111827",
  },

  helperText: { marginTop: 8, fontSize: 12, color: "#6b7280" },
  cluesCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 16,
  },
  cluesTitle: { fontWeight: "800", color: "#111827", marginBottom: 10 },
  clueImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },

  answerBadgeWrap: {
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  answerBadgeLabel: { fontWeight: "900", color: "#92400E", marginBottom: 4 },
  answerBadgeValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#78350F",
    letterSpacing: 1,
  },
  answerHint: { marginTop: 6, fontSize: 12, color: "#B45309" },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 150,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  smallBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
  },
  smallBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
