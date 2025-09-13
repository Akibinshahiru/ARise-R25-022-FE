import axios from "axios";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ARThreeOverlay from "./ARThreeOverlay";

// ---------- Types ----------
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
};

type Props = {
  word: string;
  initialData?: StoryResponse;
  autoOpenAR?: boolean;
};

// ---------- API helpers ----------
function getStoryApiBase(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL_STORY as string) || "http://localhost:8001";
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

function getPronunciationUrl(): string {
  // This should point directly to your /evaluate-mobile endpoint
  return (process.env.EXPO_PUBLIC_API_BASE_URL_PRONUNCIATION as string) || "http://localhost:8000/evaluate-mobile";
}

// Evaluate pronunciation for a word within a sentence
async function evaluatePronunciation(word: string, sentence: string): Promise<any> {
  // Use bundled demo audio and send as base64 to the mobile endpoint
  const mp3Module = require("./files/pronunciation_en_yacht.mp3");
  const asset = Asset.fromModule(mp3Module);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri || asset.uri;
  if (!uri) throw new Error("Failed to load audio asset");
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

  const form = new FormData();
  form.append("audio_base64", base64 as any);
  form.append("session_id", "demo_session_1" as any);
  form.append("student_id", "student_001" as any);
  form.append("target_word", word as any);
  form.append("context_sentence", sentence as any);

  const url = getPronunciationUrl();
  const res = await axios.post(url, form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 });
  return res.data;
}

// ---------- Component ----------
export default function EpisodeStoryPlayer({ word, initialData, autoOpenAR = false }: Props) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StoryResponse | null>(initialData ?? null);

  const [index, setIndex] = useState(0);
  const [arOpen, setArOpen] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [evalVisible, setEvalVisible] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [count, setCount] = useState(0); // success counter (> 0.7)
  const [countLoaded, setCountLoaded] = useState(false);

  const COUNT_KEY = 'ARise:pronunciation_success_count';

  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const dialogFloat = useRef(new Animated.Value(0)).current;

  // Magical starfield
  const { width: W, height: H } = Dimensions.get("window");
  const stars = React.useMemo(() => (
    Array.from({ length: 36 }).map((_, i) => ({
      left: Math.random() * W,
      top: Math.random() * H,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.floor(Math.random() * 1400),
      dur: 1500 + Math.floor(Math.random() * 2200),
    }))
  ), [W, H]);
  const starOpacities = useRef(stars.map(() => new Animated.Value(Math.random() * 0.8))).current;

  const sentences = data?.story ?? [];
  const current = sentences[index];
  const total = sentences.length;
  const scanned = (word ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
  const showSpeechControls = !!(current?.contains_word ?? (current?.text ?? "").toLowerCase().includes(scanned.toLowerCase()));

  // Load persisted success count
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(COUNT_KEY);
        if (stored != null) {
          const n = parseInt(stored, 10);
          if (!Number.isNaN(n)) setCount(n);
        }
      } catch {}
      setCountLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist success count whenever it changes
  useEffect(() => {
    if (!countLoaded) return;
    AsyncStorage.setItem(COUNT_KEY, String(count)).catch(() => {});
  }, [count, countLoaded]);

  // Load story
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

  // Soft background motion
  useEffect(() => {
    const mk = (v: Animated.Value, d: number, delay = 0) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: d, delay, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: d, useNativeDriver: true }),
      ]));
    const a1 = mk(float1, 6000);
    const a2 = mk(float2, 7000, 400);
    const a3 = mk(float3, 8000, 800);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [float1, float2, float3]);

  // Dialogue subtle float
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(dialogFloat, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(dialogFloat, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [dialogFloat]);

  // Twinkling stars
  useEffect(() => {
    const loops = starOpacities.map((op, i) => (
      Animated.loop(Animated.sequence([
        Animated.timing(op, { toValue: 0.2 + Math.random() * 0.6, duration: stars[i].dur, delay: stars[i].delay, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.05, duration: stars[i].dur, useNativeDriver: true }),
      ]))
    ));
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [starOpacities, stars]);

  const isARNode = true; // allow AR on all screens

  const onNext = useCallback(() => {
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setIndex(0);
    }
    // Trigger a brief magic burst
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 700);
  }, [index, total]);

  const speak = useCallback((rate: number) => {
    try { Speech.speak(word, { rate, pitch: 1.2, language: 'en-US' }); } catch {}
  }, [word]);

  const startRecording = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone needed', 'Please allow microphone to record your pronunciation.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setListening(true);
      setTimeout(async () => {
        try { await rec.stopAndUnloadAsync(); } catch {}
        setRecording(null);
        setListening(false);
        setEvaluating(true);
        try {
          const result = await evaluatePronunciation(scanned, current?.text || '');
          setEvalResult(result || {});
          // increment success counter if score > 0.7
          const raw = (result?.pronunciation_score ?? result?.score ?? result?.data?.score) as any;
          const score = Number(raw);
          if (!Number.isNaN(score) && score > 0.7) {
            setCount((c) => c + 1);
          }
          setEvalVisible(true);
        } catch (e: any) {
          Alert.alert('Pronunciation', e?.message || 'Failed to evaluate');
        } finally {
          setEvaluating(false);
        }
      }, 2500);
    } catch (e: any) {
      setListening(false);
      setRecording(null);
      Alert.alert('Microphone', e?.message || 'Could not start recording');
    }
  }, [current, scanned]);

  const onEvaluate = useCallback(async () => {
    if (!current || listening || evaluating) return;
    await startRecording();
  }, [current, listening, evaluating, startRecording]);

  useEffect(() => { if (autoOpenAR) setArOpen(true); }, [autoOpenAR]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6d28d9" />
        <Text style={styles.loading}>Loading�</Text>
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
      <LinearGradient colors={["#FFF7ED", "#FEF3C7", "#EDE9FE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.blob, styles.blobOne, { backgroundColor: "#FDE68A", transform: [
        { translateY: float1.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
        { translateX: float1.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
        { scale: float1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
      ] }]} />
      <Animated.View style={[styles.blob, styles.blobTwo, { backgroundColor: "#C7D2FE", transform: [
        { translateY: float2.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
        { translateX: float2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
        { scale: float2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
      ] }]} />
      <Animated.View style={[styles.blob, styles.blobThree, { backgroundColor: "#FBCFE8", transform: [
        { translateY: float3.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
        { translateX: float3.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
        { scale: float3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
      ] }]} />

      {/* Starfield (above blobs) */}
      {stars.map((s, i) => (
        <Animated.View key={`star-${i}`} style={[styles.star, {
          left: s.left,
          top: s.top,
          width: s.size,
          height: s.size,
          opacity: starOpacities[i],
        }]} />
      ))}

      {/* Removed child avatar */}

      <View style={styles.topBar}>
        <Text style={styles.header}>Sentence {index + 1} of {total}</Text>
        {isARNode ? (<View style={styles.badge}><Text style={styles.badgeText}>AR</Text></View>) : null}
      </View>

      {/* Magical bordered dialogue */}
      <Animated.View style={[styles.dialogueBorder, {
        transform: [{ translateY: dialogFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
      }]}>
        <View style={styles.dialogueBox}>
        <View style={styles.bubbleTail} />
        <Text style={styles.storyText}>{current.text}</Text>
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            {isARNode ? (
              <TouchableOpacity onPress={() => setArOpen(true)} style={[styles.button, styles.secondary, styles.actionBtn]}>
                <Text style={styles.buttonText}>Try in AR</Text>
              </TouchableOpacity>
            ) : null}

            {showSpeechControls ? (
              <>
                <TouchableOpacity onPress={() => speak(1.0)} style={[styles.button, styles.secondary, styles.actionBtn]}>
                  <Text style={[styles.buttonText, { color: '#1f1147' }]}>Hear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => speak(0.75)} style={[styles.button, styles.secondary, styles.actionBtn]}>
                  <Text style={[styles.buttonText, { color: '#1f1147' }]}>Slow</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={evaluating || listening} onPress={onEvaluate} style={[styles.button, styles.secondary, styles.actionBtn, (evaluating || listening) && { opacity: 0.6 }] as any}>
                  <Text style={[styles.buttonText, { color: '#1f1147' }]}>{evaluating ? 'Evaluating…' : (listening ? 'Listening…' : 'Evaluate')}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <TouchableOpacity onPress={onNext} style={[styles.button, styles.primary]}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Animated.View>

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

      {/* Summary panel removed */}

      {/* Magic burst on next */}
      {showBurst ? <MagicBurst /> : null}

      {/* Listening overlay */}
      <Modal visible={listening} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.listenOverlay}>
          <View style={styles.listenCard}>
            <Text style={styles.listenTitle}>Say the word</Text>
            <Text style={styles.listenEmoji}>⭐</Text>
            <Text style={styles.listenWord}>{scanned}</Text>
            <Text style={styles.listenHint}>Listening… 3 seconds</Text>
          </View>
        </View>
      </Modal>

      {/* Pronunciation Result Modal */}
      <Modal visible={evalVisible} transparent animationType="fade" onRequestClose={() => setEvalVisible(false)}>
        <View style={styles.evalOverlay}>
          <View style={styles.evalCard}>
            <Text style={styles.evalTitle}>Great effort!</Text>
            {(() => {
              const s = Math.max(0, Math.min(1, Number(evalResult?.pronunciation_score ?? 0)));
              const pct = Math.round(s * 100);
              const mood = pct >= 90 ? '🌟' : pct >= 70 ? '😊' : pct >= 50 ? '👍' : '⭐';
              return (
                <>
                  <Text style={styles.evalEmoji}>{evalResult?.show_trophy ? '🏆' : mood}</Text>
                  <View style={styles.evalScoreRow}>
                    <Text style={styles.evalScoreLabel}>Pronunciation</Text>
                    <View style={styles.evalScorePill}><Text style={styles.evalScorePillText}>{pct}%</Text></View>
                  </View>
                  <View style={styles.evalBarWrap}>
                    <View style={[styles.evalBarFill, { width: `${Math.max(6, pct)}%` }]} />
                  </View>
                </>
              );
            })()}
            {evalResult?.feedback_message ? (
              <Text style={styles.evalFeedback}>{String(evalResult.feedback_message)}</Text>
            ) : null}
            {evalResult?.recommended_action ? (
              <Text style={styles.evalHint}>{String(evalResult.recommended_action)}</Text>
            ) : null}

            <View style={styles.evalButtonsRow}>
              <TouchableOpacity
                disabled={evaluating}
                onPress={() => { setEvalVisible(false); onEvaluate(); }}
                style={[styles.button, styles.secondary, styles.evalBtn, evaluating && { opacity: 0.6 }] as any}
              >
                <Text style={[styles.buttonText, { color: '#1f1147' }]}>{evaluating ? 'Evaluating…' : 'Try Again 🔁'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const next = String(evalResult?.next_action || 'continue_story');
                  setEvalVisible(false);
                  if (next === 'continue_story') onNext();
                }}
                style={[styles.button, styles.primary, styles.evalBtn]}
              >
                <Text style={styles.buttonText}>{String(evalResult?.next_action) === 'provide_help' ? 'Keep Practicing' : 'Continue ▶'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Small magic burst overlay
function MagicBurst() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 650, easing: undefined as any, useNativeDriver: true }).start();
  }, [progress]);

  const count = 8;
  const items = Array.from({ length: count });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
        const tx = Animated.multiply(dist, Math.cos(angle));
        const ty = Animated.multiply(dist, Math.sin(angle));
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.1] });
        const opacity = progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.9, 0.6, 0] });
        return (
          <Animated.View
            key={`burst-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 120,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#FDE68A',
              shadowColor: '#FDE68A',
              shadowOpacity: 0.8,
              shadowRadius: 6,
              transform: [{ translateX: tx as any }, { translateY: Animated.multiply(ty, new Animated.Value(-1)) as any }, { scale }],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0614" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0614" },
  loading: { color: "#6b7280", marginTop: 12 },
  error: { color: "#ef4444" },
  topBar: { marginTop: 24, marginHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: { color: "#4c1d95", fontSize: 16, fontWeight: "700" },
  badge: { backgroundColor: "#a78bfa", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: "#1e1b4b", fontWeight: "800" },
  dialogueBox: { position: 'absolute', left: 16, right: 16, bottom: 24, padding: 16, borderRadius: 16, backgroundColor: '#ffffff' },
  dialogueBorder: { position: 'absolute', left: 16, right: 16, bottom: 24, padding: 2, borderRadius: 18, backgroundColor: '#8B5CF6',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  storyText: { color: "#1f1147", fontSize: 18, lineHeight: 24, fontWeight: "600" },
  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: 'center', justifyContent: "space-between" },
  actionsLeft: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  actionBtn: { marginRight: 8, marginBottom: 8 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primary: { backgroundColor: "#6d28d9" },
  secondary: { backgroundColor: "#e9d5ff" },
  buttonText: { color: "#fff", fontWeight: "800" },
  arOverlayControls: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  star: { position: 'absolute', backgroundColor: '#ffffff', borderRadius: 2, opacity: 0.6 },

  blob: { position: 'absolute', borderRadius: 9999 },
  blobOne: { width: 220, height: 220, left: -40, top: -30, borderRadius: 9999 },
  blobTwo: { width: 160, height: 160, right: -30, top: 60, borderRadius: 9999 },
  blobThree: { width: 260, height: 260, right: -60, bottom: -80, borderRadius: 9999 },

  bubbleTail: { position: 'absolute', left: 12, top: 24, width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#ffffff' },

  // Evaluation modal styles
  evalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  evalCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12 },
  evalTitle: { fontSize: 20, fontWeight: '900', color: '#1f1147', textAlign: 'center' },
  evalEmoji: { fontSize: 48, textAlign: 'center', marginVertical: 8 },
  evalScoreRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  evalScoreLabel: { color: '#1f1147', fontWeight: '800' },
  evalScorePill: { backgroundColor: '#e9d5ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  evalScorePillText: { color: '#1f1147', fontWeight: '900' },
  evalBarWrap: { marginTop: 10, height: 10, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden' },
  evalBarFill: { height: '100%', backgroundColor: '#8B5CF6' },
  evalFeedback: { marginTop: 12, color: '#1f1147', fontSize: 15, fontWeight: '700' },
  evalHint: { marginTop: 6, color: '#6b7280' },
  evalButtonsRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  evalBtn: { flex: 1, marginHorizontal: 4 },

  // Listening overlay styles
  listenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  listenCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  listenTitle: { fontSize: 18, fontWeight: '900', color: '#1f1147' },
  listenEmoji: { fontSize: 48, marginVertical: 8 },
  listenWord: { fontSize: 22, fontWeight: '800', color: '#6d28d9' },
  listenHint: { marginTop: 8, color: '#6b7280' },
});
