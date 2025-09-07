import axios from "axios";
import { Audio } from "expo-av";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ARWordStory from "./ARWordStory";

// Types shaped from backend JSON you shared
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
  assets?: {
    correct_pronunciation_audio?: string; // asset id
    tts_story_audio?: string; // asset id
  };
};

type Props = {
  word: string;
  initialData?: StoryResponse;
  // Optional override: turn AR steps into hard gates
  requireARBeforeAdvance?: boolean;
};

function getApiBaseUrl(): string {
  // Use Expo public env var if provided; fallback to localhost:8000
  return (process.env.EXPO_PUBLIC_API_BASE_URL as string);
}

// Real API call using axios
async function fetchStoryForWord(word: string): Promise<StoryResponse> {
  const base = getApiBaseUrl();
  // Backend expects the word wrapped in double quotes only.
  // Example that works: /generate?word=%22yacht%22
  const trimmed = (word ?? "").trim();
  const isQuoted = (s: string) => (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"));
  const inner = isQuoted(trimmed) ? trimmed.slice(1, -1) : trimmed;
  const url = `${base}/generate?word=${word}`;
  const res = await axios.get<StoryResponse>(url, { timeout: 15000 });
  return res.data;
}

// Map backend asset ids -> URLs your app can fetch
function getAssetUrl(assetId: string): string {
  // Replace with your CDN or API route
  // e.g., return `${API_BASE}/assets/${assetId}`;
  return `https://example.com/assets/${assetId}`;
}

// Pronunciation evaluation stub
async function evaluatePronunciation(_word: string, _recordingUri?: string): Promise<{ success: boolean; score: number }> {
  // TODO: integrate with your evaluator. For now, simulate.
  await new Promise((r) => setTimeout(r, 600));
  const score = Math.round(60 + Math.random() * 40); // 60-100
  return { success: score >= 75, score };
}

export default function EpisodeStoryPlayer({ word, initialData, requireARBeforeAdvance = false }: Props) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StoryResponse | null>(initialData ?? null);

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [passedPronunciation, setPassedPronunciation] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const [arCompleted, setArCompleted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const confetti = useRef(new Animated.Value(0)).current;

  const sentences = data?.story ?? [];
  const current = sentences[index];
  const total = sentences.length;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchStoryForWord(word);
        if (!cancelled) setData(d);
      } catch (e: any) {
        if (!cancelled) {
          // Extract useful axios error info
          const status = e?.response?.status;
          const msg = e?.message || "Network error";
          setError(status ? `${msg} (HTTP ${status})` : msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!initialData) load();
    return () => {
      cancelled = true;
    };
  }, [word, initialData]);

  // Reset per-sentence state when index changes
  useEffect(() => {
    setAttempts(0);
    setPassedPronunciation(false);
    setArCompleted(false);
  }, [index]);

  const isARNode = useMemo(() => {
    if (!current) return false;
    return current.cue_type === "3d_model" || current.type === "image-cue";
  }, [current]);

  const needsPronunciation = !!current?.contains_word && !passedPronunciation;
  const needsARGate = requireARBeforeAdvance && isARNode && !arCompleted;

  const canAdvance = current && !needsPronunciation && !needsARGate;

  const startRecording = useCallback(async () => {
    try {
      setMicError(null);
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        setMicError("Microphone permission denied.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e: any) {
      setMicError(e?.message || "Failed to start recording");
    }
  }, []);

  const stopRecordingAndEvaluate = useCallback(async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || undefined;
      setIsRecording(false);
      setRecording(null);
      if (!current) return;
      const res = await evaluatePronunciation(word, uri);
      if (res.success) {
        setPassedPronunciation(true);
      } else {
        setAttempts((a) => a + 1);
      }
    } catch (e: any) {
      setMicError(e?.message || "Failed to stop recording");
      setIsRecording(false);
      setRecording(null);
    }
  }, [current, recording, word]);

  const onHint = useCallback(async () => {
    const assetId = data?.assets?.correct_pronunciation_audio;
    try {
      const sound = new Audio.Sound();
      const rate = attempts >= 1 ? 0.75 : 1.0; // slow after first failed attempt
      if (assetId) {
        await sound.loadAsync({ uri: getAssetUrl(assetId) }, { shouldPlay: true, rate });
      } else {
        // no asset provided; you could optionally use expo-speech here
      }
    } catch (e) {
      // no-op
    }
  }, [attempts, data?.assets?.correct_pronunciation_audio]);

  const onNext = useCallback(() => {
    if (index < total - 1) setIndex((i) => i + 1);
  }, [index, total]);

  const onOpenAR = useCallback(() => setArOpen(true), []);
  const onCloseAR = useCallback(() => setArOpen(false), []);
  const onCompleteAR = useCallback(() => {
    setArCompleted(true);
    setArOpen(false);
  }, []);

  const onAllAttemptsFailed = useCallback(() => {
    Animated.sequence([
      Animated.timing(confetti, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.delay(600),
      Animated.timing(confetti, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
    ]).start();
  }, [confetti]);

  useEffect(() => {
    if (attempts >= 3 && needsPronunciation) onAllAttemptsFailed();
  }, [attempts, needsPronunciation, onAllAttemptsFailed]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6d28d9" />
        <Text style={styles.loading}>Loading story…</Text>
      </View>
    );
  }
    if (error || !current) {
      const base = getApiBaseUrl();
      const fetchUrl = `${base}/generate?word=${encodeURIComponent(word)}`;
      const isLocalhost = /localhost|127\.0\.0\.1/i.test(base);
      const hostHint = isLocalhost
        ? Platform.OS === "android"
          ? "On Android emulator use http://10.0.2.2:8000, or set EXPO_PUBLIC_API_BASE_URL to your PC's LAN IP."
          : Platform.OS === "ios"
            ? "On iOS simulator localhost works; on a real device use your PC's LAN IP."
            : "If on a physical device, use your PC's LAN IP instead of localhost."
        : "";
      return (
        <View style={styles.center}>
          <Text style={styles.error}>Failed to load story. {error ?? "No data."}</Text>
          <Text>Fetch URL: {fetchUrl}</Text>
          {!!hostHint && <Text>{hostHint}</Text>}
          {Platform.OS === 'android' && <Text>If this is a release build on Android 9+, allow cleartext HTTP.</Text>}
          <TouchableOpacity style={[styles.button, styles.primary, { marginTop: 12 }]} onPress={() => {
            // Trigger reload by resetting state so effect runs
            setData(null);
            setError(null);
            setLoading(true);
          }}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

  const header = `Sentence ${index + 1} of ${total}`;
  const showFillIn = current.type === "fill-in";
  const displayText = showFillIn ? current.text.replace("___", "___") : current.text;

  return (
    <View style={styles.root}>
      {/* Simple colored backdrop; you can swap to art/bg */}
      <View style={styles.backdrop} />

      {/* Image cue preview */}
      {current.type === "image-cue" && current.asset_id ? (
        <Image source={{ uri: getAssetUrl(current.asset_id) }} style={styles.cueImage} resizeMode="cover" />
      ) : null}

      <View style={styles.topBar}>
        <Text style={styles.header}>{header}</Text>
        {isARNode ? (
          <View style={styles.badge}><Text style={styles.badgeText}>AR</Text></View>
        ) : null}
      </View>

      {/* Story box */}
      <View style={styles.dialogueBox}>
        <Text style={styles.storyText}>{displayText}</Text>

        <View style={styles.actionsRow}>
          {isARNode ? (
            <TouchableOpacity onPress={onOpenAR} style={[styles.button, styles.secondary]}>
              <Text style={styles.buttonText}>Try in AR</Text>
            </TouchableOpacity>
          ) : null}

          {needsPronunciation ? (
            <TouchableOpacity
              onPress={isRecording ? stopRecordingAndEvaluate : startRecording}
              style={[styles.button, styles.primary]}
            >
              <Text style={styles.buttonText}>
                {isRecording ? "Stop & Check" : `Say “${word}”`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onNext} disabled={!canAdvance} style={[styles.button, styles.primary, !canAdvance && styles.disabled]}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hints and attempts */}
        {needsPronunciation ? (
          <View style={styles.hintsRow}>
            <TouchableOpacity onPress={onHint} style={[styles.buttonSm, styles.secondary]}>
              <Text style={styles.hintText}>{attempts >= 1 ? "Hint (slow)" : "Hint (normal)"}</Text>
            </TouchableOpacity>
            <Text style={styles.attempts}>Attempts: {attempts}/3</Text>
          </View>
        ) : null}

        {!!micError && <Text style={[styles.attempts, { marginTop: 6 }]}>{micError}</Text>}

        {/* Encouragement after 3 failed attempts */}
        {attempts >= 3 && needsPronunciation ? (
          <View style={styles.encourageBox}>
            <Text style={styles.encourageTitle}>Great effort!</Text>
            <Text style={styles.encourageText}>Let’s try an easier word and come back later.</Text>
          </View>
        ) : null}
      </View>

      {/* Simple confetti-like animation */}
      <Animated.View pointerEvents="none" style={[styles.confetti, { opacity: confetti }]}>
        <Text style={styles.confettiText}>⭐ You can do it! ⭐</Text>
      </Animated.View>

      {/* AR overlay as a fullscreen modal, reusing your ARWordStory */}
      <Modal visible={arOpen} animationType="slide" onRequestClose={onCloseAR}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <ARWordStory word={word} storyText={current.text} />
          <View style={styles.arOverlayControls}>
            <TouchableOpacity onPress={onCloseAR} style={[styles.button, styles.secondary]}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCompleteAR} style={[styles.button, styles.primary]}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0614" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0614" },
  loading: { color: "#c4b5fd", marginTop: 12 },
  error: { color: "#fecaca" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0b0614" },
  cueImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topBar: { position: "absolute", top: 20, left: 16, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: { color: "#f5f3ff", fontSize: 16, fontWeight: "700" },
  badge: { backgroundColor: "#a78bfa", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: "#1e1b4b", fontWeight: "800" },
  dialogueBox: { position: "absolute", left: 16, right: 16, bottom: 24, padding: 16, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.92)" },
  storyText: { color: "#1f1147", fontSize: 18, lineHeight: 24, fontWeight: "600" },
  actionsRow: { marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  hintsRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  attempts: { color: "#6b7280" },
  encourageBox: { marginTop: 10, padding: 10, backgroundColor: "#ecfeff", borderRadius: 12 },
  encourageTitle: { color: "#155e75", fontWeight: "800", marginBottom: 4 },
  encourageText: { color: "#0f766e" },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  buttonSm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  primary: { backgroundColor: "#6d28d9" },
  secondary: { backgroundColor: "#e9d5ff" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "800" },
  hintText: { color: "#4c1d95", fontWeight: "800" },
  confetti: { position: "absolute", top: 80, left: 0, right: 0, alignItems: "center" },
  confettiText: { color: "#fde047", fontSize: 18, fontWeight: "900" },
  arOverlayControls: { position: "absolute", bottom: 24, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
});
