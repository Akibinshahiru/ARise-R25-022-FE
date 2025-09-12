import axios from "axios";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ARThreeOverlay from "./ARThreeOverlay";

/* =========================
   Types (sync with backend)
   ========================= */
type StorySentence = {
  sentence_id: number;
  text: string;
  type: "full" | "fill-in" | "image-cue";
  contains_word: boolean;
  cue_type: null | "3d_model" | "image";
  asset_id: string | null;
};
type StoryResponse = {
  word: string;
  story: StorySentence[];
  assets?: { correct_pronunciation_audio?: string; tts_story_audio?: string };
};
type EvaluationResponse = {
  pronunciation_score: number;
  confidence_score: number;
  feedback_message: string;
  is_irregular_word: boolean;
  needs_intervention: boolean;
  confidence_level: string;
  recommended_action: string;
  next_action: string;
  show_trophy: boolean;
  evaluation_id: string;
};

type Props = {
  word: string;
  initialData?: StoryResponse;
  requireARBeforeAdvance?: boolean;
  autoOpenAR?: boolean;
};

/* =========================
   API helpers
   ========================= */
function getStoryApiBase(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL_STORY as string) || "http://192.168.8.119:8001";
}
function getPronunciationUrl(): string {
  // This should point directly to your /evaluate-mobile endpoint
  return (process.env.EXPO_PUBLIC_API_BASE_URL_PRONUNCIATION as string) || "http://192.168.8.119:8000/evaluate-mobile";
}

async function fetchStoryForWord(word: string): Promise<StoryResponse> {
  const base = getStoryApiBase();
  const trimmed = (word ?? "").trim();
  const isQuoted = (s: string) => (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"));
  const inner = isQuoted(trimmed) ? trimmed.slice(1, -1) : trimmed;
  const url = `${base}/generate?word=${encodeURIComponent(`"${inner}"`)}`;
  const res = await axios.get<StoryResponse>(url, { timeout: 15000 });
  return res.data;
}

/** Infer a sane filename + mime from the given recording URI (Expo Recording) */
function guessFileNameAndType(uri: string) {
  const lower = (uri || "").toLowerCase();
  if (lower.endsWith(".wav")) return { name: "recording.wav", type: "audio/wav" as const };
  if (lower.endsWith(".mp3")) return { name: "recording.mp3", type: "audio/mpeg" as const };
  if (lower.endsWith(".aac")) return { name: "recording.aac", type: "audio/aac" as const };
  if (lower.endsWith(".caf")) return { name: "recording.caf", type: "audio/x-caf" as const };
  if (lower.endsWith(".ogg")) return { name: "recording.ogg", type: "audio/ogg" as const };
  if (lower.endsWith(".webm")) return { name: "recording.webm", type: "audio/webm" as const };
  if (lower.endsWith(".mp4")) return { name: "recording.mp4", type: "audio/mp4" as const };
  // Expo HIGH_QUALITY typically produces M4A (AAC) on iOS/Android
  if (lower.endsWith(".m4a")) return { name: "recording.m4a", type: "audio/mp4" as const };
  // Default to M4A if unknown
  return { name: "recording.m4a", type: "audio/mp4" as const };
}

/**
 * Upload using multipart/form-data with a REAL file field.
 * Matches backend: session_id, target_word, context_sentence, student_id, audio_file
 */
async function uploadAndEvaluateFile(
  url: string,
  { targetWord, audioUri, contextSentence, sessionId, studentId }: {
    targetWord: string;
    audioUri: string;
    contextSentence: string;
    sessionId: number | string;
    studentId: string;
  }
): Promise<EvaluationResponse> {
  const info = await FileSystem.getInfoAsync(audioUri);
  if (!info.exists) throw new Error("Audio file does not exist");

  const { name, type } = guessFileNameAndType(audioUri);

  const form = new FormData();
  form.append("session_id", String(sessionId));
  form.append("target_word", targetWord);
  form.append("context_sentence", contextSentence);
  form.append("student_id", studentId);
  form.append("audio_file", { uri: audioUri, name, type } as any);

  const res = await fetch(url, { method: "POST", body: form });
  const text = await res.text();
  console.log("File upload status:", res.status);
  console.log("File upload resp:", text.slice(0, 500));
  if (!res.ok) {
    // Try to surface JSON error if present
    try {
      console.log("Error JSON:", JSON.parse(text));
    } catch {}
    throw new Error(`Upload failed: ${res.status} - ${text}`);
  }
  return JSON.parse(text) as EvaluationResponse;
}

/**
 * Upload using base64 when needed (no data: prefix — raw base64 only).
 * Matches backend: session_id, target_word, context_sentence, student_id, audio_base64
 */
async function uploadAndEvaluateBase64(
  url: string,
  { targetWord, audioUri, contextSentence, sessionId, studentId }: {
    targetWord: string;
    audioUri: string;
    contextSentence: string;
    sessionId: number | string;
    studentId: string;
  }
): Promise<EvaluationResponse> {
  const info = await FileSystem.getInfoAsync(audioUri);
  if (!info.exists) throw new Error("Audio file does not exist");

  const base64 = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
  if (!base64) throw new Error("Failed to read audio as base64");

  const form = new FormData();
  form.append("session_id", String(sessionId));
  form.append("target_word", targetWord);
  form.append("context_sentence", contextSentence);
  form.append("student_id", studentId);
  // IMPORTANT: raw base64 string; DO NOT prepend data URI
  form.append("audio_base64", base64);

  const res = await fetch(url, { method: "POST", body: form });
  const text = await res.text();
  console.log("Base64 upload status:", res.status);
  console.log("Base64 upload resp:", text.slice(0, 500));
  if (!res.ok) {
    try {
      console.log("Error JSON:", JSON.parse(text));
    } catch {}
    throw new Error(`Upload failed: ${res.status} - ${text}`);
  }
  return JSON.parse(text) as EvaluationResponse;
}

/* =========================
   Component
   ========================= */
export default function EpisodeStoryPlayer({
  word,
  initialData,
  requireARBeforeAdvance = false,
  autoOpenAR = false
}: Props) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StoryResponse | null>(initialData ?? null);

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [passedPronunciation, setPassedPronunciation] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const [evalVisible, setEvalVisible] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResponse | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const confetti = useRef(new Animated.Value(0)).current;

  // Temporary: use a bundled MP3 instead of live recording
  const USE_BUNDLED_AUDIO = true;
  const BUNDLED_MP3 = require("./files/pronunciation_en_yacht.mp3");
  async function resolveBundledAssetUri(mod: number): Promise<string> {
    const a = Asset.fromModule(mod);
    if (!a.downloaded) {
      try { await a.downloadAsync(); } catch {}
    }
    const uri = (a as any).localUri || a.uri;
    if (!uri) throw new Error("Failed to resolve bundled audio asset");
    return uri;
  }

  const sentences = data?.story ?? [];
  const current = sentences[index];
  const total = sentences.length;

  /* Load story */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initialData) return;
      setLoading(true);
      setError(null);
      try {
        const d = await fetchStoryForWord(word);
        if (!cancelled) setData(d);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load story");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [word, initialData]);

  /* Reset attempts on sentence change */
  useEffect(() => {
    setAttempts(0);
    setPassedPronunciation(false);
  }, [index]);

  const isARNode = useMemo(() => current?.type === "image-cue", [current]);
  const needsPronunciation = !!current?.contains_word && !passedPronunciation;
  const canAdvance = !!current && !needsPronunciation;

  /* Recording controls */
  const startRecording = useCallback(async () => {
    try {
      setMicError(null);
      if (USE_BUNDLED_AUDIO) {
        // Skip recorder; we'll upload the bundled MP3 on Stop & Check
        setIsRecording(true);
        return;
      }
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        setMicError("Microphone permission denied.");
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const rec = new Audio.Recording();

      // Use HIGH_QUALITY preset (M4A/AAC) — consistent across platforms.
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      setRecording(rec);
      setIsRecording(true);
    } catch (e: any) {
      setMicError(e?.message || "Failed to start recording");
    }
  }, []);

  const stopRecordingAndEvaluate = useCallback(async () => {
    try {
      if (!USE_BUNDLED_AUDIO && !recording) return;

      let uri: string | null = null;
      if (USE_BUNDLED_AUDIO) {
        uri = await resolveBundledAssetUri(BUNDLED_MP3);
        if (recording) { try { await recording.stopAndUnloadAsync(); } catch {} }
      } else {
        console.log("Stopping recording...");
        await recording!.stopAndUnloadAsync();
        uri = recording!.getURI();
      }

      setIsRecording(false);
      setRecording(null);

      if (!uri || !current) {
        console.log("No URI or current sentence");
        return;
      }

      console.log("Recording saved to:", uri);
      const info = await FileSystem.getInfoAsync(uri);
      console.log("Recorded file info:", info);

      const url = getPronunciationUrl();

      // Prefer direct file upload; switch to base64 if you need it.
      const result = await uploadAndEvaluateFile(url, {
        targetWord: word,
        audioUri: uri,
        contextSentence: current.text,
        sessionId: 2,
        studentId: "stu1",
      });

      setEvalResult(result);
      setEvalError(null);
      setEvalVisible(true);

      if (result.show_trophy) {
        setPassedPronunciation(true);
      } else {
        setAttempts((a) => a + 1);
      }
    } catch (e: any) {
      console.log("Stop & evaluate error:", e);
      setEvalError(e?.message || "Failed to stop or evaluate");
      setEvalResult(null);
      setEvalVisible(true);
      setIsRecording(false);
      setRecording(null);
    }
  }, [recording, current, word]);

  const onNext = useCallback(() => {
    if (index < total - 1) setIndex((i) => i + 1);
  }, [index, total]);

  /* UI */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6d28d9" />
        <Text style={styles.loading}>Loading story…</Text>
      </View>
    );
  }

  if (error || !current) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load story. {error ?? "No data."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Sentence {index + 1} of {total}</Text>
        {isARNode ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AR</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.dialogueBox}>
        <Text style={styles.storyText}>{current.text}</Text>
        <View style={styles.actionsRow}>
          {isARNode ? (
            <TouchableOpacity onPress={() => setArOpen(true)} style={[styles.button, styles.secondary]}>
              <Text style={styles.buttonText}>Try in AR</Text>
            </TouchableOpacity>
          ) : null}

          {needsPronunciation ? (
            <TouchableOpacity
              onPress={isRecording ? stopRecordingAndEvaluate : startRecording}
              style={[styles.button, styles.primary]}
            >
              <Text style={styles.buttonText}>
                {isRecording ? "Stop & Check" : `Say "${word}"`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onNext} style={[styles.button, styles.primary]}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!micError && (
          <Text style={[styles.attempts, { marginTop: 6 }]}>{micError}</Text>
        )}
      </View>

      {/* AR Modal */}
      <Modal visible={arOpen} animationType="slide" onRequestClose={() => setArOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <ARThreeOverlay query={word} />
          <View style={styles.arOverlayControls}>
            <TouchableOpacity onPress={() => setArOpen(false)} style={[styles.button, styles.secondary]}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Evaluation Modal */}
      <Modal visible={evalVisible} transparent animationType="fade" onRequestClose={() => setEvalVisible(false)}>
        <View style={styles.evalBackdrop}>
          <View style={styles.evalCard}>
            {evalError ? (
              <>
                <Text style={styles.evalTitle}>Couldn't evaluate</Text>
                <Text style={styles.evalText}>{evalError}</Text>
                <TouchableOpacity style={[styles.button, styles.primary, { marginTop: 12 }]} onPress={() => setEvalVisible(false)}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : evalResult?.show_trophy ? (
              <>
                <Text style={styles.trophyEmoji}>🏆</Text>
                <Text style={styles.evalTitle}>Great job!</Text>
                <Text style={styles.evalText}>
                  Pronunciation score: {Math.round((evalResult?.pronunciation_score ?? 0) * 100)}%
                </Text>
                <Text style={[styles.evalText, { opacity: 0.8 }]}>
                  Confidence: {evalResult?.confidence_level}
                </Text>
                <TouchableOpacity style={[styles.button, styles.primary, { marginTop: 14 }]} onPress={() => setEvalVisible(false)}>
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.encourageEmoji}>💪</Text>
                <Text style={styles.evalTitle}>Keep going!</Text>
                {!!evalResult?.feedback_message && (
                  <Text style={styles.evalText}>{evalResult.feedback_message}</Text>
                )}
                {!!evalResult?.recommended_action && (
                  <Text style={[styles.evalText, { marginTop: 6 }]}>
                    {evalResult.recommended_action}
                  </Text>
                )}
                <TouchableOpacity style={[styles.button, styles.secondary, { marginTop: 14 }]} onPress={() => setEvalVisible(false)}>
                  <Text style={[styles.buttonText, { color: "#1f1147" }]}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================
   Styles
   ========================= */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0614" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0614" },
  loading: { color: "#c4b5fd", marginTop: 12 },
  error: { color: "#fecaca" },
  topBar: { marginTop: 24, marginHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: { color: "#f5f3ff", fontSize: 16, fontWeight: "700" },
  badge: { backgroundColor: "#a78bfa", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: "#1e1b4b", fontWeight: "800" },
  dialogueBox: { marginTop: 20, marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.92)" },
  storyText: { color: "#1f1147", fontSize: 18, lineHeight: 24, fontWeight: "600" },
  actionsRow: { marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  attempts: { color: "#6b7280" },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primary: { backgroundColor: "#6d28d9" },
  secondary: { backgroundColor: "#e9d5ff" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "800" },
  arOverlayControls: { position: "absolute", bottom: 24, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  evalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  evalCard: { width: "86%", borderRadius: 16, padding: 18, backgroundColor: "#ffffff", alignItems: "center" },
  evalTitle: { color: "#1f1147", fontSize: 20, fontWeight: "800", marginTop: 4, textAlign: "center" },
  evalText: { color: "#312e81", fontSize: 14, textAlign: "center", marginTop: 8 },
  trophyEmoji: { fontSize: 48, textAlign: "center" },
  encourageEmoji: { fontSize: 42, textAlign: "center" },
});
