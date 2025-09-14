import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ipAddress = process.env.API_BASE_URL;

// ---- Types ----
type WordItem = { word: string; complexity: number };
type SoundClip = { uri: string; name: string; size?: number; mimeType?: string };

export default function CreateWordScreen() {
  const [word, setWord] = useState("");
  const [segmented, setSegmented] = useState("");
  const [complexity, setComplexity] = useState<number | null>(null);
  const [isPseudo, setIsPseudo] = useState(false);

  // Mocked audio state
  const [soundClip, setSoundClip] = useState<SoundClip | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInput, setModalInput] = useState<string>("");

  // Words fetched from API (for complexity picker)
  const [words, setWords] = useState<WordItem[]>([]);
  const fetchWords = async () => {
    try {
      const response = await axios.get(`${ipAddress}/api/words/wc`);
      setWords(response.data.words || []);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to load words for complexity picker");
    }
  };
  useEffect(() => {
    fetchWords();
  }, []);

  // Derived lists for modal
  const inputNum = Number(modalInput);
  const lessOrEqual = words.filter((w) => !isNaN(inputNum) && w.complexity <= inputNum);
  const greater = words.filter((w) => !isNaN(inputNum) && w.complexity > inputNum);

  const handleConfirm = () => {
    if (!isNaN(inputNum)) {
      setComplexity(inputNum);
      setModalVisible(false);
    } else {
      Alert.alert("Error", "Enter a valid number");
    }
  };

  // --------- MOCK AUDIO: pick + fake upload + preview ----------
  const pickAudio = async () => {
    try {
      // pick local audio
      const res = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const asset = (res.assets && res.assets[0]) || (res as any);
      const clip: SoundClip = {
        uri: asset.uri,
        name: asset.name || "audio.mp3",
        size: asset.size,
        mimeType: asset.mimeType || "audio/mpeg",
      };

      // set UI state
      setSoundClip(clip);
      setIsUploading(true);
      setUploadProgress(0);

      // simulate upload progress
      const timer = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setIsUploading(false);
            return 100;
          }
          return p + 5; // ~1s total at 50ms interval
        });
      }, 50);
    } catch (e: any) {
      console.log(e);
      Alert.alert("Audio", "Unable to pick audio right now.");
    }
  };

  const unloadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
    } catch {}
    soundRef.current = null;
    setIsPlaying(false);
  };

  useEffect(() => {
    // unload any existing sound when clip changes or on unmount
    return () => {
      unloadSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundClip?.uri]);

  const togglePlay = async () => {
    if (!soundClip) return;
    if (!soundRef.current) {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const s = new Audio.Sound();
      await s.loadAsync({ uri: soundClip.uri }, { shouldPlay: true });
      s.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(!!status.isPlaying);
      });
      soundRef.current = s;
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if ("isLoaded" in status && status.isLoaded) {
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const removeAudio = async () => {
    await unloadSound();
    setSoundClip(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // If toggled to pseudo, clear audio (since you said no audio for pseudo)
  useEffect(() => {
    if (isPseudo && soundClip) {
      removeAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPseudo]);

  // Save word (no audio upload!)
  const handleSave = async () => {
    if (!word || !segmented || complexity === null) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (isUploading) {
      Alert.alert("Hold on", "Please wait for the mock upload to finish.");
      return;
    }

    try {
      const response = await axios.post(`${ipAddress}/api/words`, {
        word,
        wordSegmented: segmented,
        complexity,
        isPseudo,
        // NOTE: We do NOT send audio — this is a mock.
        // If you want to *show* sending something, you could send filename only:
        attachedAudioName: soundClip?.name ?? null,
      });

      Alert.alert(
        "Success",
        `Word "${response.data.word}" saved successfully${soundClip ? " (audio attached locally)" : ""}`
      );

      // Reset form
      setWord("");
      setSegmented("");
      setComplexity(null);
      setIsPseudo(false);
      await removeAudio();
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to save word");
    }
  };

  const handleModalPress = () => {
    fetchWords();
    setModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient
        colors={["#FFE6A7", "#FFB3C1"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={["#B5E4FF", "#D7C3FF"] as const}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.blobBottom}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand + title */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>ARise</Text>
          <Ionicons name="create" size={22} color="#6C2BD9" />
        </View>

        {/* Hero card */}
        <LinearGradient
          colors={["#7C3AED", "#4F46E5"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Create New Word</Text>
            <Text style={styles.subtitle}>Add a word and set its complexity.</Text>
          </View>
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiText}>🔤</Text>
          </View>
        </LinearGradient>

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Word */}
          <Text style={styles.label}>Word</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Word"
            value={word}
            onChangeText={setWord}
          />

          {/* Segmented Word */}
          <Text style={styles.label}>Segmented Word</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., sev-en"
            value={segmented}
            onChangeText={setSegmented}
          />

          {/* Complexity Picker */}
          <Text style={styles.label}>Complexity</Text>
          <TouchableOpacity onPress={handleModalPress} activeOpacity={0.9}>
            <View pointerEvents="none">
              <TextInput
                style={[styles.input, styles.inputReadonly]}
                placeholder="Pick Complexity"
                value={complexity !== null ? complexity.toString() : ""}
                onChangeText={() => {}}
                editable={false}
              />
            </View>
          </TouchableOpacity>

          {/* Pseudo toggle */}
          <View style={[styles.row, { marginTop: 4 }]}>
            <Text style={styles.labelInline}>Is Pseudo Word?</Text>
            <Switch value={isPseudo} onValueChange={setIsPseudo} />
          </View>

          {/* Attach audio (mocked) */}
          {!isPseudo && (
            <>
              <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9} onPress={pickAudio}>
                <Ionicons name="musical-notes" size={18} color="#6C2BD9" />
                <Text style={styles.secondaryBtnText}>
                  {soundClip ? "Change Sound Clip" : "Attach Sound Clip"}
                </Text>
              </TouchableOpacity>

              {/* Upload progress bar */}
              {soundClip && (
                <View style={styles.uploadCard}>
                  <View style={styles.uploadRow}>
                    <Ionicons name="musical-note" size={18} color="#6C2BD9" />
                    <Text style={styles.uploadName} numberOfLines={1}>
                      {soundClip.name}
                    </Text>
                    {isUploading ? (
                      <Text style={styles.uploadTiny}>Uploading… {uploadProgress}%</Text>
                    ) : (
                      <View style={styles.badgeDone}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                        <Text style={styles.badgeDoneText}>Ready</Text>
                      </View>
                    )}
                  </View>

                  {/* Progress bar visual */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                  </View>

                  <View style={styles.audioActions}>
                    <TouchableOpacity
                      onPress={togglePlay}
                      style={[styles.actionBtn, isUploading && { opacity: 0.6 }]}
                      disabled={isUploading}
                    >
                      <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#111827" />
                      <Text style={styles.actionBtnText}>{isPlaying ? "Pause" : "Preview"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={removeAudio}
                      style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]}
                    >
                      <Ionicons name="trash" size={18} color="#991B1B" />
                      <Text style={[styles.actionBtnText, { color: "#991B1B" }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Save */}
          <TouchableOpacity
            style={[styles.primaryBtn, isUploading && { opacity: 0.6 }]}
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={isUploading}
          >
            <LinearGradient
              colors={["#A78BFA", "#F472B6"] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Ionicons name="save" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Save Word</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Complexity Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pick Complexity</Text>

            <ScrollView style={styles.list}>
              <Text style={styles.sectionTitle}>{"<= Complexity"}</Text>
              {lessOrEqual.map((item) => (
                <TouchableOpacity
                  key={`${item.word}-${item.complexity}`}
                  style={styles.item}
                  onPress={() => setModalInput(item.complexity.toString())}
                >
                  <Text>{item.word}</Text>
                  <Text>({item.complexity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.centerSection}>
              <TextInput
                style={styles.inputModal}
                keyboardType="numeric"
                placeholder="Enter complexity"
                value={modalInput}
                onChangeText={setModalInput}
              />
              <TouchableOpacity style={styles.checkButton} onPress={handleConfirm}>
                <Ionicons name="checkmark" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list}>
              <Text style={styles.sectionTitle}>{"> Complexity"}</Text>
              {greater.map((item) => (
                <TouchableOpacity
                  key={`${item.word}-${item.complexity}-gt`}
                  style={styles.item}
                  onPress={() => setModalInput(item.complexity.toString())}
                >
                  <Text>{item.word}</Text>
                  <Text>({item.complexity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 20, paddingBottom: 40, gap: 14 },

  // Decorative blobs
  blobTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
  },
  blobBottom: {
    position: "absolute",
    bottom: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
  },

  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 22, fontWeight: "800", color: "#111827" },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  emojiText: { fontSize: 26 },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: { fontSize: 13, fontWeight: "800", color: "#374151" },
  labelInline: { fontSize: 14, fontWeight: "800", color: "#374151" },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 15,
  },
  inputReadonly: { color: "#111" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  primaryBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  primaryBtnGradient: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  secondaryBtn: {
    marginTop: 8,
    backgroundColor: "#F3E8FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtnText: { color: "#6C2BD9", fontSize: 14, fontWeight: "800" },

  // Upload/preview UI
  uploadCard: {
    marginTop: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  uploadRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  uploadName: { flex: 1, fontWeight: "700", color: "#111827" },
  uploadTiny: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: "#7C3AED",
  },
  audioActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    alignItems: "center",
  },
  actionBtnText: { fontWeight: "800", color: "#111827" },
  badgeDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B981",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeDoneText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "85%",
    padding: 16,
    borderRadius: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6, color: "#111827" },
  list: { maxHeight: 150, marginVertical: 8 },
  sectionTitle: { fontWeight: "800", marginBottom: 6, color: "#374151" },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  centerSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 12 },
  inputModal: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginRight: 10,
  },
  checkButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalCloseText: { fontWeight: "800", color: "#374151" },
});
