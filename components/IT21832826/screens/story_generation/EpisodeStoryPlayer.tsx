import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from 'expo-sensors';
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, Image, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ARBubblesOverlay from "./ARBubblesOverlay";
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

  // Quiz state (Word–Image Match)
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelection, setQuizSelection] = useState<string | null>(null);
  const [quizOptions, setQuizOptions] = useState<Array<{ key: string; label: string; iconName: string; imageUri?: string; correct: boolean }>>([]);

  // Quiz 2: Word Hunt
  const [huntVisible, setHuntVisible] = useState(false);
  const [huntDone, setHuntDone] = useState(false);
  const [huntCorrect, setHuntCorrect] = useState<boolean | null>(null);
  const [huntSelection, setHuntSelection] = useState<string | null>(null);
  const [huntOptions, setHuntOptions] = useState<Array<{ key: string; word: string; correct: boolean }>>([]);
  const [huntFlash, setHuntFlash] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const huntAppear = useRef<Animated.Value[]>([]).current;
  const huntShimmer = useRef(new Animated.Value(0)).current;

  // Quiz 3: Word Puzzle (Scrambled Letters in AR)
  const [puzzleVisible, setPuzzleVisible] = useState(false);
  const [puzzleDone, setPuzzleDone] = useState(false);
  const [puzzleTiles, setPuzzleTiles] = useState<Array<{ id: string; ch: string }>>([]);
  const [puzzleSlots, setPuzzleSlots] = useState<Array<{ id: string; ch: string | null }>>([]);
  const [puzzleCorrect, setPuzzleCorrect] = useState<boolean | null>(null);
  const [puzzleFloating, setPuzzleFloating] = useState(new Animated.Value(0));
  const puzzleContainerRef = useRef<View>(null);
  const [puzzleContainerOffset, setPuzzleContainerOffset] = useState<{x:number,y:number}>({x:0,y:0});
  const slotRefs = useRef<Array<View | null>>([]);
  const [slotCenters, setSlotCenters] = useState<Array<{x:number,y:number}>>([]);
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

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
        // no global skip persistence; quizzes can be skipped per instance only
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

  // -------------- Quiz logic --------------
  function getEmojiForWord(w: string): string {
    const s = (w || '').trim().toLowerCase();
    const map: Record<string, string> = {
      yacht: '⛵', boat: '⛵', ship: '🚢', car: '🚗', apple: '🍎', dog: '🐶', cat: '🐱', fish: '🐟', bird: '🐦', sun: '☀️', moon: '🌙', star: '⭐', rocket: '🚀', tree: '🌳', flower: '🌸', ball: '⚽', book: '📘'
    };
    return map[s] || '⭐';
  }

  function getImageUrlForQuery(query: string): string {
    // picsum provides direct image URLs (no redirects) and is reliable on RN
    const q = encodeURIComponent(query || 'image');
    return `https://picsum.photos/seed/${q}/600/400`;
  }

  // Icon mapping for kid-friendly quiz (MaterialCommunityIcons)
  function getIconForWord(w: string): string {
    const s = (w || '').trim().toLowerCase();
    const map: Record<string, string> = {
      yacht: 'sail-boat', boat: 'sail-boat', ship: 'ferry', car: 'car', apple: 'apple', dog: 'dog', cat: 'cat', fish: 'fish', bird: 'bird', sun: 'white-balance-sunny', moon: 'moon-waning-crescent', star: 'star', rocket: 'rocket', tree: 'tree', flower: 'flower', ball: 'soccer', book: 'book',
    };
    return map[s] || 'star';
  }

  // Remote kid‑friendly images (OpenMoji PNGs via GitHub raw)
  function getRemoteImageForWord(w: string): string | null {
    const s = (w || '').trim().toLowerCase();
    const map: Record<string, string> = {
      yacht: '1F6A4', boat: '1F6A4', ship: '1F6A2',
      car: '1F697', apple: '1F34E', dog: '1F436', cat: '1F431',
      fish: '1F41F', bird: '1F426', sun: '2600', moon: '1F319', star: '2B50',
      rocket: '1F680', tree: '1F333', flower: '1F33C', ball: '26BD', book: '1F4D8'
    };
    const code = map[s];
    return code ? `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/618x618/${code}.png` : null;
  }

  function buildQuizOptions(target: string) {
    const decoyQueries = ['car','apple','dog','cat','tree','flower','rocket','ball','sun','moon','book'];
    // ensure decoys are different from target
    const decoys: string[] = [];
    for (let i = 0; i < decoyQueries.length && decoys.length < 2; i++) {
      if (decoyQueries[i].toLowerCase() !== target.toLowerCase()) decoys.push(decoyQueries[i]);
    }
    const raw = [
      { key: 'c', label: target, iconName: getIconForWord(target), imageUri: getRemoteImageForWord(target) || undefined, correct: true },
      { key: 'd1', label: decoys[0], iconName: getIconForWord(decoys[0]), imageUri: getRemoteImageForWord(decoys[0]) || undefined, correct: false },
      { key: 'd2', label: decoys[1], iconName: getIconForWord(decoys[1]), imageUri: getRemoteImageForWord(decoys[1]) || undefined, correct: false },
    ];
    // shuffle
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }
    return raw;
  }

  function buildHuntOptions(target: string) {
    const base = ['the','and','play','green','blue','happy','jump','bright','moon','song','cat','dog','ball','book','tree','car','boat'];
    const words: string[] = [];
    // insert target once
    words.push(target);
    // add distractors up to 9 total
    for (let i = 0; i < base.length && words.length < 9; i++) {
      if (base[i].toLowerCase() !== target.toLowerCase()) words.push(base[i]);
    }
    // shuffle
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words.map((w, idx) => ({ key: `w${idx}`, word: w, correct: w.toLowerCase() === target.toLowerCase() }));
  }

  // Open quiz right after first three sentences (on entering index 3)
  useEffect(() => {
    if (!quizDone && index === 3) {
      const opts = buildQuizOptions(scanned);
      setQuizOptions(opts);
      setQuizSelection(null);
      setQuizCorrect(null);
      setQuizVisible(true);
      // Icons require no network prefetch
    }
  }, [index, scanned, quizDone]);

  // Open Flash Quiz after six sentences (on entering index 6)
  useEffect(() => {
    if (!huntDone && index === 6) {
      const opts = buildHuntOptions(scanned);
      setHuntOptions(opts);
      setHuntSelection(null);
      setHuntCorrect(null);
      setHuntVisible(true);
      // Start flash phase (show the word for ~1.6s)
      setHuntFlash(true);
      try { flashAnim.setValue(0); } catch {}
      Animated.timing(flashAnim, { toValue: 1, duration: 1600, useNativeDriver: false }).start();
      setTimeout(() => setHuntFlash(false), 1600);
    }
  }, [index, scanned, huntDone]);

  // Open Word Puzzle after nine sentences (on entering index 9)
  useEffect(() => {
    if (!puzzleDone && index === 9) {
      const letters = Array.from(scanned);
      // build tiles in scrambled order (ensure different from original when possible)
      const scrambled = [...letters];
      for (let i = scrambled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
      }
      if (scrambled.join('') === letters.join('') && letters.length > 1) {
        // swap last two to differ from original
        const n = scrambled.length;
        [scrambled[n - 1], scrambled[n - 2]] = [scrambled[n - 2], scrambled[n - 1]];
      }
      setPuzzleTiles(scrambled.map((ch, i) => ({ id: `t${i}`, ch })));
      setPuzzleSlots(letters.map((_, i) => ({ id: `s${i}`, ch: null })));
      setSlotCenters(letters.map(() => ({ x: 0, y: 0 })));
      setPuzzleCorrect(null);
      setPuzzleVisible(true);
      // gentle float animation for the letter tray
      try { puzzleFloating.setValue(0); } catch {}
      Animated.loop(
        Animated.sequence([
          Animated.timing(puzzleFloating, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(puzzleFloating, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [index, scanned, puzzleDone, puzzleFloating]);

  // Tilt assist using accelerometer
  useEffect(() => {
    if (!puzzleVisible) return;
    let sub: any;
    try { Accelerometer.setUpdateInterval(100); } catch {}
    sub = Accelerometer.addListener(({ x, y }) => {
      // x: tilt left/right, y: tilt up/down (device coords)
      Animated.timing(tiltX, { toValue: x * 22, duration: 90, useNativeDriver: true }).start();
      Animated.timing(tiltY, { toValue: -y * 22, duration: 90, useNativeDriver: true }).start();
    });
    return () => { try { sub && sub.remove && sub.remove(); } catch {}; };
  }, [puzzleVisible, tiltX, tiltY]);

  const onPuzzlePlace = useCallback((tileIdx: number) => {
    // place tile into next empty slot
    setPuzzleSlots((prev) => {
      const next = prev.map((s) => ({ ...s }));
      const emptyIndex = next.findIndex((s) => !s.ch);
      if (emptyIndex >= 0) {
        next[emptyIndex].ch = puzzleTiles[tileIdx].ch;
      }
      return next;
    });
    // remove tile from rack
    setPuzzleTiles((prev) => prev.map((t, i) => (i === tileIdx ? { ...t, ch: '' } : t)));
  }, [puzzleTiles]);

  const onPuzzlePlaceAt = useCallback((tileIdx: number, slotIdx: number) => {
    setPuzzleSlots((prev) => {
      const next = prev.map((s) => ({ ...s }));
      if (!next[slotIdx].ch) next[slotIdx].ch = puzzleTiles[tileIdx].ch;
      return next;
    });
    setPuzzleTiles((prev) => prev.map((t, i) => (i === tileIdx ? { ...t, ch: '' } : t)));
  }, [puzzleTiles]);

  const onPuzzleRemove = useCallback((slotIdx: number) => {
    setPuzzleSlots((prev) => {
      const next = prev.map((s) => ({ ...s }));
      const ch = next[slotIdx].ch;
      next[slotIdx].ch = null;
      // return ch to first empty tile position in rack
      if (ch) {
        setPuzzleTiles((pt) => {
          const copy = pt.map((t) => ({ ...t }));
          const empty = copy.findIndex((t) => !t.ch);
          if (empty >= 0) copy[empty].ch = ch;
          return copy;
        });
      }
      return next;
    });
  }, []);

  const onPuzzleReset = useCallback(() => {
    setPuzzleCorrect(null);
    const letters = Array.from(scanned);
    const scrambled = [...letters];
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }
    setPuzzleTiles(scrambled.map((ch, i) => ({ id: `t${i}`, ch })));
    setPuzzleSlots(letters.map((_, i) => ({ id: `s${i}`, ch: null })));
  }, [scanned]);

  // Play a gentle chime for quiz feedback (declare early so it's available to handlers below)
  const playQuizChime = useCallback(async (success: boolean) => {
    try {
      // Ensure playback works in silent mode
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
      if (success) {
        // Play a short musical-like flourish (staggered chimes)
        const uri = 'https://assets.mixkit.co/sfx/preview/mixkit-quick-win-video-game-notification-269.wav';
        const s1 = await Audio.Sound.createAsync({ uri }, { volume: 1.0 });
        const s2 = await Audio.Sound.createAsync({ uri }, { volume: 0.9 });
        const s3 = await Audio.Sound.createAsync({ uri }, { volume: 0.85 });
        await s1.sound.playAsync();
        setTimeout(() => { try { s2.sound.playAsync(); } catch {} }, 160);
        setTimeout(() => { try { s3.sound.playAsync(); } catch {} }, 320);
        setTimeout(() => { try { s1.sound.unloadAsync(); s2.sound.unloadAsync(); s3.sound.unloadAsync(); } catch {} }, 3000);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-soft-pop-3564.wav' },
          { shouldPlay: true, volume: 0.9 }
        );
        setTimeout(() => { try { sound.unloadAsync(); } catch {} }, 2000);
      }
    } catch {
      // No speech fallback per request
    }
  }, []);

  const onPuzzleCheck = useCallback(async () => {
    const attempt = (puzzleSlots.map((s) => s.ch || '')).join('');
    const ok = attempt.toLowerCase() === scanned.toLowerCase();
    setPuzzleCorrect(ok);
    await playQuizChime(ok);
  }, [puzzleSlots, scanned, playQuizChime]);

  // Animate chips appearing after flash
  useEffect(() => {
    if (huntVisible && !huntFlash && huntOptions.length > 0) {
      // init
      huntAppear.length = 0;
      for (let i = 0; i < huntOptions.length; i++) huntAppear.push(new Animated.Value(0));
      const anims = huntAppear.map((v, i) => Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 90 }));
      Animated.stagger(60, anims).start();
      // shimmer under prompt
      huntShimmer.setValue(0);
      Animated.loop(
        Animated.timing(huntShimmer, { toValue: 1, duration: 1400, useNativeDriver: true })
      ).start();
    }
  }, [huntVisible, huntFlash, huntOptions, huntAppear, huntShimmer]);

  const onSkipCurrentImageQuiz = useCallback(() => {
    setQuizVisible(false);
    setQuizDone(true);
  }, []);

  const onSkipCurrentHuntQuiz = useCallback(() => {
    setHuntVisible(false);
    setHuntDone(true);
  }, []);

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

  // Ensure playback is audible even in iOS silent mode
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch {}
    })();
  }, []);

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
        // restore playback-friendly audio mode
        try { await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true }); } catch {}
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
        {current.type === 'image-cue' ? (
          <View style={styles.arHintRow}>
            <Text style={styles.arHintText}>Tip: Tap “Try in AR”.</Text>
          </View>
        ) : null}
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

      {/* Word–Image Match Quiz */}
      <Modal visible={quizVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.quizOverlay}>
          <View style={styles.quizCard}>
            <Text style={styles.quizTitle}>Match the picture!</Text>
            <Text style={styles.quizWord}>{scanned}</Text>
            <View style={styles.quizRow}>
              {quizOptions.map(opt => (
                <QuizOption
                  key={opt.key}
                  iconName={opt.iconName}
                  imageUri={opt.imageUri}
                  selected={quizSelection === opt.key}
                  onPress={async () => {
                    if (quizSelection) return; // lock after one
                    setQuizSelection(opt.key);
                    const ok = !!opt.correct;
                    setQuizCorrect(ok);
                    await playQuizChime(ok);
                  }}
                />
              ))}
            </View>

            {/* Feedback inside quiz */}
            {quizCorrect !== null && (
              <View style={[styles.fbCard, quizCorrect ? styles.fbGood : styles.fbTry] }>
                <ConfettiOverlay visible={!!quizCorrect} />
                <Text style={styles.fbEmoji}>{quizCorrect ? '🌟' : '⭐'}</Text>
                <Text style={styles.fbTitle}>{quizCorrect ? 'Great job!' : 'Nice try!'}</Text>
                <Text style={styles.fbText}>{quizCorrect ? 'You picked the right picture.' : 'That was a good try. Keep trying — you’ve got this!'}</Text>
                <TouchableOpacity
                  style={[styles.button, styles.primary, styles.fbBtn]}
                  onPress={() => { setQuizVisible(false); setQuizDone(true); }}
                >
                  <Text style={styles.buttonText}>Continue ▶</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Flash Quiz (Quick Recognition) */}
      <Modal visible={huntVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.quizOverlay}>
          <View style={styles.quizCard}>
            <Text style={styles.quizTitle}>Flash Quiz</Text>
            {huntFlash ? (
              <View style={styles.flashPhaseWrap}>
                <Animated.Text style={[styles.flashWord, {
                  transform: [{ scale: flashAnim.interpolate({ inputRange: [0,1], outputRange: [0.9, 1.04] }) }],
                  opacity: flashAnim.interpolate({ inputRange: [0,1], outputRange: [0.95, 1] })
                }]}>{scanned}</Animated.Text>
                <View style={styles.flashBarWrap}>
                  <Animated.View style={[styles.flashBarFill, { width: flashAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
                </View>
                
              </View>
            ) : (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.quizWord}>Which word did you see?</Text>
                  <View style={styles.shimmerWrap}>
                    <Animated.View
                      style={[styles.shimmerBar, {
                        transform: [{ translateX: huntShimmer.interpolate({ inputRange: [0,1], outputRange: [-40, 140] }) }],
                        opacity: 0.6,
                      }]}
                    />
                  </View>
                </View>
                
                <View style={styles.huntGrid}>
                  {huntOptions.map((opt, idx) => (
                    <Animated.View key={opt.key} style={{
                      transform: [
                        { scale: (huntAppear[idx] || new Animated.Value(1)).interpolate({ inputRange: [0,1], outputRange: [0.85, 1] }) },
                        { translateY: (huntAppear[idx] || new Animated.Value(1)).interpolate({ inputRange: [0,1], outputRange: [8, 0] }) },
                      ],
                      opacity: (huntAppear[idx] || new Animated.Value(1))
                    }}>
                      <TouchableOpacity
                        onPress={async () => {
                          if (huntSelection) return;
                          setHuntSelection(opt.key);
                          const ok = !!opt.correct;
                          setHuntCorrect(ok);
                          await playQuizChime(ok);
                        }}
                        style={[styles.chip, huntSelection === opt.key && (opt.correct ? styles.chipGood : styles.chipBad)]}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.chipText}>{opt.word}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>

                {huntCorrect !== null && (
                  <View style={[styles.fbCard, huntCorrect ? styles.fbGood : styles.fbTry] }>
                    <ConfettiOverlay visible={!!huntCorrect} />
                    <Text style={styles.fbEmoji}>{huntCorrect ? '🌟' : '⭐'}</Text>
                    <Text style={styles.fbTitle}>{huntCorrect ? 'You got it!' : 'Nice try!'}</Text>
                    <Text style={styles.fbText}>{huntCorrect ? 'Great memory!' : 'Keep trying — you’ll get it!'}</Text>
                    <TouchableOpacity
                      style={[styles.button, styles.primary, styles.fbBtn]}
                      onPress={() => { setHuntVisible(false); setHuntDone(true); }}
                    >
                      <Text style={styles.buttonText}>Continue ▶</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.skipBottomRow}>
                  <TouchableOpacity onPress={onSkipCurrentHuntQuiz}>
                    <Text style={styles.skipLinkText}>Skip this quiz</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Word Puzzle (Scrambled Letters in AR) */}
      <Modal visible={puzzleVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={{ flex: 1 }}>
          {/* AR background without models: camera feed */}
          <ARBubblesOverlay>
            {/* Optional: could draw faint floating bubbles here in the future */}
          </ARBubblesOverlay>
          {/* Floating overlay */}
          <View style={styles.puzzleOverlay}>
            <Text style={styles.quizTitle}>Word Puzzle</Text>
            <Text style={styles.quizWord}>Arrange the letters to make the word</Text>
            <Text style={[styles.quizWord, { color: '#1f1147' }]}>{' '}</Text>
            

            {/* Slots row */}
            <View style={styles.puzzleSlotsRow}>
              {puzzleSlots.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  ref={(r) => { slotRefs.current[i] = r; }}
                  onLayout={() => {
                    // measure center for drop detection
                    try {
                      (slotRefs.current[i] as any)?.measureInWindow?.((x:number,y:number,w:number,h:number) => {
                        setSlotCenters((prev) => {
                          const next = [...prev];
                          next[i] = { x: x + w/2, y: y + h/2 };
                          return next;
                        });
                      });
                    } catch {}
                  }}
                  onPress={() => onPuzzleRemove(i)}
                  style={[styles.slotCell, s.ch && styles.slotFilled]}
                  activeOpacity={0.9}
                >
                  <Text style={styles.slotText}>{s.ch || '_'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Letter bubbles (draggable, floating) */}
            <Animated.View
              ref={puzzleContainerRef as any}
              onLayout={() => {
                try { (puzzleContainerRef.current as any)?.measureInWindow?.((x:number,y:number)=> setPuzzleContainerOffset({x,y})); } catch {}
              }}
              style={[styles.puzzleRack, { height: 160, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
                transform: [{ translateY: puzzleFloating.interpolate({ inputRange: [0,1], outputRange: [4, -4] }) }] }]}
            >
              {puzzleTiles.map((t, idx) => (
                t.ch ? (
                  <DraggableBubble
                    key={t.id}
                    label={t.ch}
                    tiltX={tiltX}
                    tiltY={tiltY}
                    viewportW={W}
                    viewportH={H}
                    onDrop={async (pageX, pageY) => {
                      // find nearest slot center
                      let best=-1, bestD=1e9;
                      for (let i=0;i<slotCenters.length;i++){
                        const c = slotCenters[i];
                        if(!c) continue;
                        const dx = c.x - pageX, dy = c.y - pageY;
                        const d = Math.hypot(dx,dy);
                        if (d < bestD){ bestD=d; best=i; }
                      }
                      if (best>=0 && bestD < 160 && !(puzzleSlots[best]?.ch)){
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onPuzzlePlaceAt(idx, best);
                        return true;
                      } else {
                        await Haptics.selectionAsync();
                        return false;
                      }
                    }}
                  />
                ) : (
                  <View key={`empty-${idx}`} style={[styles.tileCell, { opacity: 0.25 }]} />
                )
              ))}
            </Animated.View>

            {/* Controls (bottom) */}
            <View style={styles.puzzleButtonsBottom}>
              <TouchableOpacity onPress={onPuzzleReset} style={[styles.button, styles.secondary, { flex: 1, marginRight: 6 }]}>
                <Text style={[styles.buttonText, { color: '#1f1147' }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onPuzzleCheck} style={[styles.button, styles.primary, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.buttonText}>Check</Text>
              </TouchableOpacity>
            </View>

            {puzzleCorrect !== null && (
              <View style={[styles.fbCard, puzzleCorrect ? styles.fbGood : styles.fbTry] }>
                <ConfettiOverlay visible={!!puzzleCorrect} />
                <Text style={styles.fbEmoji}>{puzzleCorrect ? '🌟' : '⭐'}</Text>
                <Text style={styles.fbTitle}>{puzzleCorrect ? 'Well done!' : 'Nice try!'}</Text>
                <Text style={styles.fbText}>{puzzleCorrect ? 'You solved the puzzle.' : 'Give it another go!'}</Text>
                <TouchableOpacity
                  style={[styles.button, styles.primary, styles.fbBtn]}
                  onPress={() => { setPuzzleVisible(false); setPuzzleDone(true); }}
                >
                  <Text style={styles.buttonText}>Continue ▶</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.skipBottomRow}>
              <TouchableOpacity onPress={onSkipCurrentImageQuiz}>
                <Text style={styles.skipLinkText}>Skip this quiz</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skipBottomRow}>
              <TouchableOpacity onPress={() => { setPuzzleVisible(false); setPuzzleDone(true); }}>
                <Text style={styles.skipLinkText}>Skip this quiz</Text>
              </TouchableOpacity>
            </View>
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

// Confetti overlay for quiz success
function ConfettiOverlay({ visible }: { visible: boolean }) {
  const { width: W, height: H } = Dimensions.get('window');
  const pieces = 24;
  const anims = useRef(Array.from({ length: pieces }).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;
    const runs = anims.map((v, idx) => {
      v.setValue(0);
      const d = 1200 + Math.random() * 800;
      const delay = Math.random() * 200;
      return Animated.timing(v, { toValue: 1, duration: d, delay, useNativeDriver: true });
    });
    Animated.stagger(30, runs).start();
  }, [visible, anims]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {anims.map((v, i) => {
        const startX = Math.random() * W;
        const endY = H + 40;
        const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-40, endY] });
        const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [startX, startX + (Math.random() * 120 - 60)] });
        const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() * 360}deg`] });
        const size = 6 + Math.random() * 6;
        const colors = ['#FDE68A', '#A78BFA', '#60A5FA', '#FCA5A5', '#34D399'];
        const bg = colors[i % colors.length];
        return (
          <Animated.View key={`conf-${i}`} style={{ position: 'absolute', width: size, height: size, backgroundColor: bg, borderRadius: 2, transform: [{ translateX }, { translateY }, { rotate }] }} />
        );
      })}
    </View>
  );
}

// Small selectable quiz option (image with icon fallback)
function QuizOption({ iconName, imageUri, selected, onPress }: { iconName: string; imageUri?: string; selected: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1.06 : 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  }, [selected, scale]);
  return (
    <Animated.View style={[styles.quizOption, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={onPress} style={[styles.quizOptionBtn, { alignItems: 'center', justifyContent: 'center' }]} activeOpacity={0.9}>
        {imageUri && !errored ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.quizOptionImg}
              resizeMode="cover"
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setErrored(true); setLoading(false); }}
            />
            {loading ? (<View style={styles.quizLoading}><Text style={styles.quizLoadingText}>Loading…</Text></View>) : null}
          </>
        ) : (
          <MaterialCommunityIcons name={iconName as any} size={48} color="#6d28d9" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Draggable floating bubble letter
function DraggableBubble({ label, onDrop, tiltX, tiltY, viewportW = 360, viewportH = 640 }: { label: string; onDrop: (pageX:number,pageY:number)=>Promise<boolean>; tiltX?: Animated.Value; tiltY?: Animated.Value; viewportW?: number; viewportH?: number }){
  const base = useRef({ x: Math.random()*140 - 70, y: Math.random()*80 - 40 }).current;
  const baseX = useRef(new Animated.Value(base.x)).current;
  const baseY = useRef(new Animated.Value(base.y)).current;
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const vanish = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);
  const floatAnimation = useRef({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    phase: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 0.6,
    amplitudeX: 60 + Math.random() * 40,
    amplitudeY: 30 + Math.random() * 20,
  }).current;
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const loop = () => {
      if (!isDragging) {
        const t = Date.now() * 0.001;
        const phase = t * floatAnimation.speed + floatAnimation.phase;
        const tx = Math.sin(phase) * floatAnimation.amplitudeX;
        const ty = Math.sin(phase * 0.7) * floatAnimation.amplitudeY;
        floatAnimation.x.setValue(tx);
        floatAnimation.y.setValue(ty);
        const bx = (baseX as any)._value ?? 0;
        const by = (baseY as any)._value ?? 0;
        const px = bx + tx;
        const py = by + ty;
        const margin = 60;
        const targetX = Math.min(Math.max(px, -viewportW/2 + margin), viewportW/2 - margin);
        const targetY = Math.min(Math.max(py, -viewportH/3 + margin), viewportH/3 - margin);
        if (Math.abs(targetX - px) > 1) baseX.setValue(bx + (targetX - px) * 0.04);
        if (Math.abs(targetY - py) > 1) baseY.setValue(by + (targetY - py) * 0.04);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isDragging, floatAnimation, baseX, baseY, viewportW, viewportH]);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { setIsDragging(true); Haptics.selectionAsync(); },
    onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
    onPanResponderRelease: async (e, gesture) => {
      const ok = await onDrop(e.nativeEvent.pageX, e.nativeEvent.pageY);
      if (!ok) {
        Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(() => setIsDragging(false));
      } else {
        // gracefully vanish to imply snap-in
        Animated.timing(vanish, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setIsDragging(false));
      }
    },
  })).current;
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{ margin: 8, opacity: vanish, transform: [ 
        { translateX: Animated.add(Animated.add(baseX, Animated.add(floatAnimation.x, pos.x)), (isDragging ? new Animated.Value(0) : (tiltX || new Animated.Value(0)))) }, 
        { translateY: Animated.add(Animated.add(baseY, Animated.add(floatAnimation.y, pos.y)), (isDragging ? new Animated.Value(0) : (tiltY || new Animated.Value(0)))) } 
      ] }}
    >
      <View style={styles.tileCell}>
        <Text style={styles.tileText}>{label}</Text>
      </View>
    </Animated.View>
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
  buttonText: { color: "#fff", fontWeight: "800", textAlign: 'center' },
  arOverlayControls: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  star: { position: 'absolute', backgroundColor: '#ffffff', borderRadius: 2, opacity: 0.6 },

  blob: { position: 'absolute', borderRadius: 9999 },
  blobOne: { width: 220, height: 220, left: -40, top: -30, borderRadius: 9999 },
  blobTwo: { width: 160, height: 160, right: -30, top: 60, borderRadius: 9999 },
  blobThree: { width: 260, height: 260, right: -60, bottom: -80, borderRadius: 9999 },

  bubbleTail: { position: 'absolute', left: 12, top: 24, width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#ffffff' },
  arHintRow: { marginTop: 10, backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  arHintText: { color: '#92400e', fontWeight: '800' },

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

  // Quiz styles
  quizOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  quizCard: { width: '100%', maxWidth: 480, backgroundColor: '#ffffff', borderRadius: 28, padding: 20, borderWidth: 2, borderColor: '#e9d5ff' },
  quizTitle: { fontSize: 22, fontWeight: '900', color: '#4c1d95', textAlign: 'center' },
  quizWord: { fontSize: 24, fontWeight: '900', color: '#6d28d9', textAlign: 'center', marginTop: 6 },
  quizRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  quizOption: { flex: 1, marginHorizontal: 6 },
  quizOptionBtn: { backgroundColor: '#f5f3ff', borderRadius: 18, overflow: 'hidden', height: 120 },
  quizOptionImg: { width: '100%', height: '100%' },
  quizLoading: { ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  quizLoadingText: { color: '#6b7280', fontWeight: '700' },
  skipLink: { alignSelf: 'flex-end', marginTop: 8 },
  skipLinkText: { color: '#6d28d9', fontWeight: '800' },
  huntGrid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#f5f3ff', marginBottom: 12, marginRight: 8, borderWidth: 2, borderColor: '#e9d5ff' },
  chipText: { color: '#1f1147', fontWeight: '900', fontSize: 18 },
  chipGood: { backgroundColor: '#ecfeff', borderColor: '#a7f3d0' },
  chipBad: { backgroundColor: '#fff7ed', borderColor: '#fecaca' },
  flashPhaseWrap: { marginTop: 16, alignItems: 'center' },
  flashWord: { fontSize: 42, fontWeight: '900', color: '#1f1147', letterSpacing: 1 },
  flashBarWrap: { marginTop: 12, width: '100%', height: 8, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden' },
  flashBarFill: { height: '100%', backgroundColor: '#8B5CF6' },
  shimmerWrap: { marginTop: 4, width: 180, height: 6, backgroundColor: '#ede9fe', borderRadius: 3, overflow: 'hidden' },
  shimmerBar: { width: 40, height: '100%', backgroundColor: '#c4b5fd', borderRadius: 3 },
  skipBottomRow: { marginTop: 12, alignItems: 'center' },
  fbCard: { marginTop: 16, borderRadius: 20, padding: 16, alignItems: 'center' },
  fbGood: { backgroundColor: '#ecfeff' },
  fbTry: { backgroundColor: '#fff7ed' },
  fbEmoji: { fontSize: 36 },
  fbTitle: { fontSize: 18, fontWeight: '900', color: '#1f1147', marginTop: 6 },
  fbText: { color: '#374151', textAlign: 'center', marginTop: 6 },
  fbBtn: { marginTop: 10, alignSelf: 'stretch' },
  // Puzzle styles
  puzzleOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, padding: 16, justifyContent: 'center', alignItems: 'center' },
  puzzleSlotsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  slotCell: { width: 64, height: 64, borderRadius: 32, marginHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#c7d2fe' },
  slotFilled: { backgroundColor: '#eef2ff', borderColor: '#a78bfa' },
  slotText: { fontSize: 22, fontWeight: '900', color: '#1f1147' },
  puzzleRack: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 },
  tileCell: { width: 56, height: 56, borderRadius: 28, margin: 8, backgroundColor: 'rgba(233,213,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  tileText: { fontSize: 24, fontWeight: '900', color: '#1f1147' },
  puzzleButtonsBottom: { position: 'absolute', left: 16, right: 16, bottom: 54, flexDirection: 'row', justifyContent: 'space-between' },
});
