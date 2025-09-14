// app/(authed)/challenge/[challengeId]/game-screen.tsx
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

// 🔐 Environment / Endpoints
const API_BASE = process.env.API_BASE_URL as string;               // your Express API (challenges/scores)
const MEDIA_BASE = process.env.EXPO_PUBLIC_MEDIA_BASE as string;   // (kept if you still use it elsewhere)
const PRONUN_BASE = "http://192.168.43.137:8002";                  // FastAPI host for both pronunciation & emotion

// 🧩 Types
export type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo?: boolean;
  soundClipRef?: string | null; // URL to hint audio
  createdBy?: { uid?: string; username?: string };
};

export type Challenge = {
  _id: string;
  title: string;
  words: Word[];         // populated
  pseudoWord: Word;      // populated
  recordEmotion?: boolean;
};

export type LevelScore = {
  round: number;
  word: string;
  score?: number; // 0..100 (normal rounds only)
  timeTaken?: number; // seconds
  audioClipPath?: string; // URL returned by multer/upload (pseudoword only if you ever store it here)
  hintTaken?: boolean;
};

export type ScoreBody = {
  challengeId: string;
  levelScores: LevelScore[]; // normal rounds only
  pseudowordRecording?: any; // file from RN FormData (for backend to upload to Firebase)
  emotion?: string;          // set from FastAPI emotion endpoint if recordEmotion = true
};

// 🏅 Medal helpers
const medalForScore = (v: number): "bronze" | "silver" | "gold" =>
  v <= 55 ? "bronze" : v <= 75 ? "silver" : "gold";

// ⏱️ Time score per spec
const timeScore = (seconds: number) => {
  if (seconds <= 10) return 100;
  const over = Math.min(Math.max(Math.floor(seconds - 10), 0), 10);
  return Math.max(0, 100 - over * 10);
};

// 🧮 Final score (accuracy 0..1 from API)
const finalScore = (accuracy01: number, seconds: number, hintTaken: boolean) => {
  const ts = timeScore(seconds);
  const hintFactor = hintTaken ? 0.5 : 1;
  const raw = accuracy01 * ts * hintFactor;
  return Math.round(Math.max(0, Math.min(100, raw)));
};

// 🔧 Helpers
async function blobFromUri(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}

function guessMimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".m4a")) return "audio/m4a";
  if (lower.endsWith(".mp4")) return "audio/mp4";
  if (lower.endsWith(".aac")) return "audio/aac";
  if (lower.endsWith(".caf")) return "audio/x-caf";
  if (lower.endsWith(".3gp") || lower.endsWith(".3gpp")) return "audio/3gpp";
  if (lower.endsWith(".wav")) return "audio/wav";
  // default best guesses
  return Platform.OS === "ios" ? "audio/m4a" : "audio/3gpp";
}

function filenameFromUri(uri: string, fallback = `file_${Date.now()}`) {
  const last = uri.split("/").pop();
  return last || `${fallback}`;
}

// 🔊 Play a hint clip using expo-av
async function playHintClip(uri: string) {
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  return new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status?.didJustFinish || status?.isLoaded === false) {
        sound.unloadAsync();
        resolve();
      }
    });
  });
}

// 🎤 Recording helpers
async function startRecording(): Promise<Audio.Recording> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const rec = new Audio.Recording();
  await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await rec.startAsync();
  return rec;
}

async function stopRecording(rec: Audio.Recording): Promise<string> {
  try {
    await rec.stopAndUnloadAsync();
  } catch {}
  const uri = rec.getURI();
  if (!uri) throw new Error("Recording URI not available");
  return uri;
}

// --- REAL: pronunciation evaluator via FastAPI ---
type PronunAPIResponse = {
  score: number;           // 0..1
  is_correct: boolean;
  transcribed_text: string;
  target_word: string;
  error?: string;
};

async function evaluatePronunciation(localUri: string, targetWord: string): Promise<PronunAPIResponse> {
  const fileName = filenameFromUri(localUri, `recording_${Date.now()}.m4a`);
  const type = guessMimeFromUri(localUri);

  const form = new FormData();
  form.append(
    "audio_file",
    {
      uri: localUri,
      name: fileName,
      type,
    } as any
  );
  form.append("target_word", targetWord);

  const res = await fetch(`${PRONUN_BASE}/check-pronunciation/`, {
    method: "POST",
    body: form, // RN sets multipart boundary automatically
  });

  const text = await res.text(); // great for debugging if JSON parse fails
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Pronunciation API returned non-JSON: ${text}`);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Pronunciation API error ${res.status}`);
  }
  return json as PronunAPIResponse;
}

// --- REAL: emotion detector via FastAPI (photo upload) ---
async function detectEmotionFromPhoto(localUri: string): Promise<string> {
  const name = filenameFromUri(localUri, `emotion_${Date.now()}.jpg`);
  // Most Expo camera photos are JPEG
  const form = new FormData();
  form.append(
    "image",
    {
      uri: localUri,
      name,
      type: "image/jpeg",
    } as any
  );

  const res = await fetch(`${PRONUN_BASE}/predict-emotion/`, {
    method: "POST",
    body: form,
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Emotion API returned non-JSON: ${text}`);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Emotion API error ${res.status}`);
  }

  // Be flexible with field names coming back
  const label =
    json.emotion ||
    json.label ||
    json.prediction ||
    json.result ||
    json.class ||
    json?.data?.emotion;

  return (label || "Neutral").toString();
}

export default function ChallengeGameScreen() {
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();

  // data
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  // gameplay state (normal rounds)
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0); // current round among normal words
  const [roundStartTs, setRoundStartTs] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(20);
  const [paused, setPaused] = useState(false);
  const [hintTaken, setHintTaken] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploading, setUploading] = useState(false);

  // results
  const [levelScores, setLevelScores] = useState<LevelScore[]>([]);
  const [pseudowordUrl, setPseudowordUrl] = useState<string | undefined>();
  const [emotion, setEmotion] = useState<string | undefined>(undefined); // set only if recordEmotion==true

  // per-round immediate result (normal rounds)
  const [roundResult, setRoundResult] = useState<{
    score: number;
    medal: "bronze" | "silver" | "gold";
  } | null>(null);

  // camera for emotion
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [camVisible, setCamVisible] = useState(false);
  const camRef = useRef<any>(null);

  // pseudoword round state
  const [pseudoStartTs, setPseudoStartTs] = useState<number | null>(null);
  const [pseudoSeconds, setPseudoSeconds] = useState(20);
  const [pseudoRecording, setPseudoRecording] = useState<Audio.Recording | null>(null);
  const [pseudoLastUri, setPseudoLastUri] = useState<string | undefined>(undefined);
  const [pseudoSubmitted, setPseudoSubmitted] = useState(false);

  // confetti for gold
  const [showConfetti, setShowConfetti] = useState(false);

  const words = useMemo(() => challenge?.words ?? [], [challenge]);
  const currentWord = useMemo<Word | null>(
    () => (started && index < words.length ? words[index] : null),
    [started, index, words]
  );
  const allNormalRoundsDone = started && index >= words.length;

  // ⏳ timer (normal rounds)
  useEffect(() => {
    if (!started || paused || roundStartTs === null) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartTs) / 1000);
      const remain = Math.max(0, 20 - elapsed);
      setSeconds(remain);
      if (remain === 0) {
        clearInterval(id);
        if (index < words.length) finalizeRound({ noAttempt: !attempted });
      }
    }, 300);
    return () => clearInterval(id);
  }, [started, paused, roundStartTs, index, attempted, words.length]);

  // 🎯 Fetch challenge
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/challenges/${challengeId}`);
        if (!res.ok) throw new Error("Failed to load challenge");
        const entireSet = await res.json();
        const j = (entireSet?.challenge ?? entireSet) as Challenge;
        if (mounted) setChallenge(j);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [challengeId]);

  // ▶️ Start
  const startChallenge = useCallback(() => {
    setStarted(true);
    setIndex(0);
    setLevelScores([]);
    setHintTaken(false);
    setAttempted(false);
    setRoundResult(null);
    setSeconds(20);
    setPaused(false);
    setRoundStartTs(Date.now());
    // reset pseudoword state
    setPseudoSubmitted(false);
    setPseudoStartTs(null);
    setPseudoSeconds(20);
    setPseudoRecording(null);
    setPseudoLastUri(undefined);
    setPseudowordUrl(undefined);
    setEmotion(undefined);
  }, []);

  // 🧩 Hint
  const onHint = useCallback(async () => {
    if (!currentWord?.soundClipRef) return Alert.alert("No hint available for this word.");
    try {
      setPaused(true);
      await playHintClip(currentWord.soundClipRef);
      setHintTaken(true);
    } catch (e) {
      Alert.alert("Hint error", String(e));
    } finally {
      setPaused(false);
      if (seconds > 0) setRoundStartTs(Date.now() - (20 - seconds) * 1000);
    }
  }, [currentWord, seconds]);

  // 🎤 Record (normal rounds)
  const onMicPressIn = useCallback(async () => {
    try {
      const rec = await startRecording();
      setRecording(rec);
      setAttempted(true);
    } catch (e) {
      Alert.alert("Mic error", String(e));
    }
  }, []);

  const onMicPressOut = useCallback(
    async () => {
      if (!recording || !currentWord) return;
      try {
        const uri = await stopRecording(recording);
        setRecording(null);
        await onEvaluate(uri, currentWord);
      } catch (e) {
        Alert.alert("Recording error", String(e));
      }
    },
    [recording, currentWord]
  );

  // 🧪 Evaluate & show immediate result (calling FastAPI)
  const onEvaluate = useCallback(
    async (localUri: string, wordObj: Word) => {
      const elapsed = 20 - seconds;
      const elapsedClamped = Math.max(0, Math.min(20, elapsed));
      try {
        setUploading(true);

        // 1) REAL pronunciation via FastAPI
        const evalRes = await evaluatePronunciation(localUri, wordObj.word);

        // 2) Compute round score from API score (0..1) + time + hint factor
        const roundScore = finalScore(evalRes.score, elapsedClamped, hintTaken);
        const medal = medalForScore(roundScore);

        // 3) Save level result (no audio upload for normal rounds)
        setLevelScores((prev) => [
          ...prev,
          {
            round: prev.length + 1,
            word: wordObj.word,
            score: roundScore,
            timeTaken: Math.round(elapsedClamped),
            hintTaken,
          },
        ]);

        // 4) Show result immediately; pause timer
        setRoundResult({ score: roundScore, medal });
        setPaused(true);
      } catch (e: any) {
        Alert.alert("Pronunciation error", e?.message || "Could not evaluate pronunciation.");
      } finally {
        setUploading(false);
      }
    },
    [seconds, hintTaken]
  );

  const finalizeRound = useCallback(
    ({ noAttempt = false }: { noAttempt?: boolean } = {}) => {
      if (!currentWord) return;
      const elapsed = 20 - seconds;
      const elapsedClamped = Math.max(0, Math.min(20, elapsed));

      if (noAttempt) {
        setLevelScores((prev) => [
          ...prev,
          {
            round: prev.length + 1,
            word: currentWord.word,
            score: 0,
            timeTaken: Math.round(elapsedClamped),
            hintTaken,
          },
        ]);
        Alert.alert("Let's try sometime later!", "No attempt was made this round.");
        setRoundResult({ score: 0, medal: "bronze" });
        setPaused(true);
      }
    },
    [currentWord, seconds, hintTaken]
  );

  const goNext = useCallback(() => {
    setHintTaken(false);
    setAttempted(false);
    setSeconds(20);
    setRoundStartTs(Date.now());
    setIndex((i) => i + 1);
  }, []);

  // Confetti for gold medal (normal round)
  useEffect(() => {
    if (roundResult?.medal === "gold" && !showConfetti) {
      setShowConfetti(true);
    }
  }, [roundResult, showConfetti]);

  // 🎭 Pseudoword: start timer when we enter phase
  useEffect(() => {
    if (started && allNormalRoundsDone && !pseudoSubmitted && pseudoStartTs === null) {
      setPseudoSeconds(20);
      setPseudoStartTs(Date.now());
    }
  }, [started, allNormalRoundsDone, pseudoSubmitted, pseudoStartTs]);

  // Submit to your backend (multipart with audio file for pseudoword)
  const finishAndSubmit = useCallback(
    async (pseudoUri?: string) => {
      if (!challenge) return;
      try {
        const form = new FormData();
        form.append("challengeId", challenge._id);
        form.append("levelScores", JSON.stringify(levelScores));
        if (emotion) form.append("emotion", emotion);

        if (pseudoUri) {
          const name = filenameFromUri(pseudoUri, `pseudo_${Date.now()}.m4a`);
          const type = guessMimeFromUri(pseudoUri);
          form.append("pseudowordRecording", { uri: pseudoUri, type, name } as any);
        }

        const res = await fetch(`${API_BASE}/api/scores`, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to submit: ${res.status}`);
        }
      } catch (e: any) {
        Alert.alert("Submit failed", e?.message ?? "Failed to submit score.");
      }
    },
    [challenge, levelScores, emotion]
  );

  // Pseudoword countdown & time-up submission
  useEffect(() => {
    if (!started || !allNormalRoundsDone || pseudoStartTs === null || pseudoSubmitted) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pseudoStartTs) / 1000);
      const remain = Math.max(0, 20 - elapsed);
      setPseudoSeconds(remain);
      if (remain === 0) {
        clearInterval(id);
        onPseudoTimeUp();
      }
    }, 300);
    return () => clearInterval(id);
  }, [started, allNormalRoundsDone, pseudoStartTs, pseudoSubmitted]);

  const onPseudoTimeUp = useCallback(async () => {
    if (pseudoSubmitted) return;
    try {
      setUploading(true);

      // if still recording, stop and capture uri
      let uri = pseudoLastUri;
      if (pseudoRecording) {
        try {
          uri = await stopRecording(pseudoRecording);
        } catch {}
        setPseudoRecording(null);
      }

      // if emotion recording required, open camera (user taps capture)
      if (challenge?.recordEmotion) {
        if (!camPerm?.granted) await requestCamPerm();
        setCamVisible(true);
      }

      setPseudoSubmitted(true);
      await finishAndSubmit(uri);
    } catch (e) {
      Alert.alert("Submit failed", String(e));
      setPseudoSubmitted(true); // avoid duplicate submits
      await finishAndSubmit(undefined);
    } finally {
      setUploading(false);
    }
  }, [pseudoRecording, pseudoLastUri, pseudoSubmitted, finishAndSubmit, challenge?.recordEmotion, camPerm?.granted, requestCamPerm]);

  // 🎤 Pseudoword press & hold mic
  const onPseudoMicPressIn = useCallback(async () => {
    try {
      const rec = await startRecording();
      setPseudoRecording(rec);
    } catch (e) {
      Alert.alert("Mic error", String(e));
    }
  }, []);

  const onPseudoMicPressOut = useCallback(async () => {
    if (!pseudoRecording) return;
    try {
      const uri = await stopRecording(pseudoRecording);
      setPseudoRecording(null);
      setPseudoLastUri(uri); // keep last attempt within the 20s window
    } catch (e) {
      Alert.alert("Recording error", String(e));
    }
  }, [pseudoRecording]);

  const beginPseudoword = useCallback(async () => {
    if (challenge?.recordEmotion) {
      if (!camPerm?.granted) await requestCamPerm();
      setCamVisible(true);
    }
  }, [challenge?.recordEmotion, camPerm?.granted, requestCamPerm]);

  // 📸 Take a photo and call FastAPI to detect emotion
  const captureEmotion = useCallback(async () => {
    try {
      if (!camRef.current) throw new Error("Camera not ready");
      // takePictureAsync on CameraView
      const photo = await camRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });
      const uri = photo?.uri;
      if (!uri) throw new Error("No photo URI from camera");

      const label = await detectEmotionFromPhoto(uri);
      setEmotion(label);
      setCamVisible(false);
      Alert.alert("Emotion detected", `Detected: ${label}`);
    } catch (e: any) {
      setCamVisible(false);
      Alert.alert("Emotion error", e?.message || "Unable to detect emotion");
    }
  }, []);

  // 🧾 Final averages (normal rounds only)
  const averageScore = useMemo(() => {
    if (!levelScores.length) return 0;
    const s = levelScores.reduce((a, b) => a + (b.score || 0), 0);
    return Math.round(s / levelScores.length);
  }, [levelScores]);

  // 🌈 UI
  if (loading)
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  if (error || !challenge)
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Failed to load challenge</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </SafeAreaView>
    );

  const showFinal = allNormalRoundsDone && pseudoSubmitted;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#7C3AED", "#A78BFA"]} style={styles.header}>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.subtitle}>Daily Challenge</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        {!started && (
          <View style={styles.card}>
            <Text style={styles.big}>Ready to play?</Text>
            <Text style={styles.helper}>You will see a word and say it out loud! ⏰ 20s per round.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={startChallenge}>
              <Ionicons name="rocket" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Start Challenge</Text>
            </TouchableOpacity>
          </View>
        )}

        {started && !allNormalRoundsDone && currentWord && (
          <View style={styles.card}>
            {/* Timer bar (simple) */}
            <View style={styles.timerRow}>
              <View style={styles.timerTrack}>
                <View style={[styles.timerFill, { width: `${(seconds / 20) * 100}%` }]} />
              </View>
              <Text style={styles.timerEmoji}>⏳</Text>
              <Text style={styles.timerText}>{seconds}s</Text>
            </View>

            {/* Word card */}
            <View style={styles.wordCard}>
              <Text style={styles.wordText}>{currentWord.word}</Text>
              <Text style={styles.segmentText}>{currentWord.wordSegmented}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.hintBtn, !currentWord.soundClipRef && { opacity: 0.4 }]}
                onPress={onHint}
                disabled={!currentWord.soundClipRef}
              >
                <Ionicons name="bulb" size={18} color="#1F2937" />
                <Text style={styles.hintText}>Hint</Text>
              </TouchableOpacity>

              <Pressable
                onPressIn={onMicPressIn}
                onPressOut={onMicPressOut}
                style={({ pressed }) => [styles.micBtn, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <Ionicons name="mic" size={26} color="#fff" />
                <Text style={styles.micText}>Hold to speak</Text>
              </Pressable>
            </View>

            {uploading && <ActivityIndicator style={{ marginTop: 8 }} />}
            <Text style={styles.progressText}>Round {index + 1} of {words.length}</Text>

            {/* Immediate result after round */}
            {roundResult && (
              <View style={styles.resultBox}>
                <Text style={styles.helper}>Score: {roundResult.score}</Text>
                <Text style={[styles.medal, styles[`medal_${roundResult.medal}` as const]]}>
                  {roundResult.medal.toUpperCase()}
                </Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    setRoundResult(null);
                    setPaused(false);
                    setShowConfetti(false);
                    goNext();
                  }}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Pseudoword phase (with its own 20s timer) */}
        {started && allNormalRoundsDone && !pseudoSubmitted && (
          <View style={styles.card}>
            <Text style={styles.big}>Last round: Pseudoword</Text>

            {/* Timer bar for pseudoword */}
            <View style={styles.timerRow}>
              <View style={styles.timerTrack}>
                <View style={[styles.timerFill, { width: `${(pseudoSeconds / 20) * 100}%` }]} />
              </View>
              <Text style={styles.timerEmoji}>⏳</Text>
              <Text style={styles.timerText}>{pseudoSeconds}s</Text>
            </View>

            <View style={styles.wordCard}>
              <Text style={styles.wordText}>{challenge.pseudoWord.word}</Text>
              <Text style={styles.segmentText}>{challenge.pseudoWord.wordSegmented}</Text>
            </View>

            {challenge.recordEmotion && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={beginPseudoword}>
                <Ionicons name="happy" size={18} color="#4C1D95" />
                <Text style={styles.secondaryBtnText}>Record Emotion</Text>
              </TouchableOpacity>
            )}

            <Pressable
              onPressIn={onPseudoMicPressIn}
              onPressOut={onPseudoMicPressOut}
              style={({ pressed }) => [styles.micBtn, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <Ionicons name="mic" size={26} color="#fff" />
              <Text style={styles.micText}>Hold to speak</Text>
            </Pressable>

            {uploading && <ActivityIndicator style={{ marginTop: 8 }} />}
            <Text style={styles.progressText}>Auto-submits when time ends</Text>
          </View>
        )}

        {/* Final */}
        {showFinal && (
          <View style={styles.card}>
            <Text style={styles.big}>Great job! 🎉</Text>
            <Text style={styles.helper}>Average Score: {averageScore}</Text>
            <Text style={[styles.medal, styles[`medal_${medalForScore(averageScore)}` as const]]}>
              {medalForScore(averageScore).toUpperCase()}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Ionicons name="home" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Emotion camera modal */}
      {camVisible && (
        <View style={styles.camModal}>
          <CameraView ref={camRef} style={styles.cam} facing="front" />
          <View style={styles.camBar}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCamVisible(false)}>
              <Text style={styles.secondaryBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={captureEmotion}>
              <Text style={styles.primaryBtnText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showConfetti && <ConfettiCannon count={80} origin={{ x: 0, y: 0 }} fadeOut fallSpeed={3500} />}
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F3FF" },
  header: { padding: 16, paddingTop: 24 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#F3E8FF", marginTop: 4, fontWeight: "600" },
  container: { padding: 16, paddingBottom: 48 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  big: { fontSize: 20, fontWeight: "800", color: "#1F2937", marginBottom: 6 },
  helper: { color: "#4B5563", marginBottom: 10 },
  timerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  timerTrack: { flex: 1, height: 16, backgroundColor: "#EDE9FE", borderRadius: 999, overflow: "hidden" },
  timerFill: { height: "100%", backgroundColor: "#8B5CF6" },
  timerEmoji: { marginLeft: 8, fontSize: 18 },
  timerText: { marginLeft: 6, fontWeight: "700", color: "#374151" },
  wordCard: { backgroundColor: "#FAF5FF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#E9D5FF", alignItems: "center" },
  wordText: { fontSize: 36, fontWeight: "900", color: "#111827" },
  segmentText: { fontSize: 16, color: "#6B7280", marginTop: 6 },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 14, alignItems: "center" },
  hintBtn: { backgroundColor: "#FDE68A", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  hintText: { color: "#1F2937", fontWeight: "800" },
  micBtn: { backgroundColor: "#8B5CF6", borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8 },
  micText: { color: "#fff", fontWeight: "800" },
  progressText: { textAlign: "center", marginTop: 10, color: "#6B7280" },
  primaryBtn: { backgroundColor: "#7C3AED", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 18, alignSelf: "center", flexDirection: "row", gap: 8, alignItems: "center", marginTop: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  secondaryBtn: { backgroundColor: "#EDE9FE", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, flexDirection: "row", gap: 8, alignItems: "center" },
  secondaryBtnText: { color: "#4C1D95", fontWeight: "800" },
  medal: { fontSize: 28, fontWeight: "900", marginVertical: 8, textAlign: "center" },
  medal_bronze: { color: "#B45309" },
  medal_silver: { color: "#6B7280" },
  medal_gold: { color: "#CA8A04" },
  resultBox: { marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: "#F3E8FF", alignItems: "center" },
  camModal: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  cam: { width: "100%", height: "80%" },
  camBar: { position: "absolute", bottom: 24, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#DC2626", fontWeight: "800", fontSize: 16 },
  errorSub: { color: "#6B7280", marginTop: 6 },
});
