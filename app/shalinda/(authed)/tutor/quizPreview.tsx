import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { Audio, type AVPlaybackSource } from "expo-av";
import { generateSentence } from "@/utils/IT21801204/sentenceGenerator";

type Item = {
  id: string; // word-index key
  word: string;
  sentence: string;
  imageUri?: string | null;
  audioUri?: string | null;
  isRecording?: boolean;
};

export default function QuizPreviewScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const { words } = useLocalSearchParams<{ words?: string }>();

  // Tutor-only guard
  useEffect(() => {
    if (!user) router.replace("/shalinda/login");
    else if (user.role !== "tutor")
      router.replace("/shalinda/(authed)/student/studentHome");
  }, [user]);

  // Decode list from params and prepare items with generated sentences
  const initialItems: Item[] = useMemo(() => {
    try {
      const arr = words ? JSON.parse(decodeURIComponent(words)) : [];
      if (!Array.isArray(arr)) return [];
      return arr.map((w: string, idx: number) => ({
        id: `${w}-${idx}`,
        word: w,
        sentence: generateSentence(w),
        imageUri: null,
        audioUri: null,
        isRecording: false,
      }));
    } catch {
      return [];
    }
  }, [words]);

  const [items, setItems] = useState<Item[]>(initialItems);

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftSentence, setDraftSentence] = useState("");

  // Media/recording refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Permissions — ask once on mount
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await Audio.requestPermissionsAsync();
      // iOS required category for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    })();
  }, []);

  if (!user || user.role !== "tutor") return null;

  // Helpers to update a single item by id
  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  };

  const onPressEdit = (it: Item) => {
    setEditingId(it.id);
    setDraftSentence(it.sentence);
    setEditVisible(true);
  };

  const onSaveEdit = () => {
    if (!editingId) return;
    updateItem(editingId, { sentence: draftSentence });
    setEditVisible(false);
    setEditingId(null);
  };

  const onRegenerate = (it: Item) => {
    updateItem(it.id, { sentence: generateSentence(it.word) });
  };

  const onPickImage = async (it: Item) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.length) {
        updateItem(it.id, { imageUri: res.assets[0].uri });
      }
    } catch (e) {
      Alert.alert("Image error", "Could not pick the image.");
    }
  };

  const stopAndUnloadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
  };

  const playAudio = async (uri?: string | null) => {
    if (!uri) return;
    try {
      await stopAndUnloadSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri } as AVPlaybackSource,
        {
          shouldPlay: true,
        }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      Alert.alert("Playback error", "Could not play the audio.");
    }
  };

  const onToggleRecord = async (it: Item) => {
    try {
      // If already recording -> stop & save
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        updateItem(it.id, { isRecording: false, audioUri: uri ?? null });
        return;
      }

      // Start recording
      const can = await Audio.getPermissionsAsync();
      if (!can.granted) {
        const req = await Audio.requestPermissionsAsync();
        if (!req.granted) {
          Alert.alert(
            "Permission required",
            "Microphone access is needed to record."
          );
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY // good defaults
      );
      await rec.startAsync();
      recordingRef.current = rec;
      updateItem(it.id, { isRecording: true });
    } catch (e) {
      Alert.alert("Recording error", "Could not start/stop recording.");
    }
  };

  const confirmCreate = () => {
    if (!items.length) {
      Alert.alert("No words found", "Go back and add some words first.");
      return;
    }

    // TODO: Hook to backend or Redux here:
    // api.createQuiz({ items }) or dispatch(saveQuizDraft(items))

    // Alert.alert(
    //   "Quiz Created 🎉",
    //   `Words: ${items.map((i) => i.word).join(", ")}`,
    //   [
    //     {
    //       text: "Done",
    //       onPress: () => router.replace("/shalinda/(authed)/tutorHome"),
    //     },
    //   ]
    // );
  };

  const renderRow = ({ item, index }: { item: Item; index: number }) => {
    return (
      <LinearGradient
        colors={["#4e54c8", "#8f94fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <Text style={styles.wordText}>
            {index + 1}. {item.word}
          </Text>

          {/* Actions row */}
          <View style={styles.actionsRow}>
            {/* Edit sentence */}
            <Pressable
              onPress={() => onPressEdit(item)}
              hitSlop={10}
              style={styles.iconBtn}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </Pressable>

            {/* Regenerate */}
            <Pressable
              onPress={() => onRegenerate(item)}
              hitSlop={10}
              style={styles.iconBtn}
            >
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </Pressable>

            {/* Pick image */}
            <Pressable
              onPress={() => onPickImage(item)}
              hitSlop={10}
              style={styles.iconBtn}
            >
              <Ionicons name="image-outline" size={20} color="#fff" />
            </Pressable>

            {/* Record / Stop */}
            <Pressable
              onPress={() => onToggleRecord(item)}
              hitSlop={10}
              style={styles.iconBtn}
            >
              <Ionicons
                name={item.isRecording ? "stop-circle-outline" : "mic-outline"}
                size={20}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>

        {/* Sentence */}
        <Text style={styles.sentenceText}>{item.sentence}</Text>

        {/* Image preview (if any) */}
        {item.imageUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: item.imageUri }} style={styles.image} />
            <TouchableOpacity
              onPress={() => updateItem(item.id, { imageUri: null })}
              style={styles.removeBadge}
            >
              <Ionicons name="close" size={16} color="#111827" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Audio controls */}
        <View style={styles.audioRow}>
          <TouchableOpacity
            onPress={() => playAudio(item.audioUri)}
            style={[
              styles.smallButton,
              !item.audioUri && styles.smallButtonDisabled,
            ]}
            disabled={!item.audioUri}
          >
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.smallButtonText}>Play</Text>
          </TouchableOpacity>

          {item.audioUri ? (
            <TouchableOpacity
              onPress={async () => {
                await stopAndUnloadSound();
                updateItem(item.id, { audioUri: null });
              }}
              style={[styles.smallButton, { backgroundColor: "#DC2626" }]}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
    );
  };

  return (
    <RoleAwareSidebarLayout title="Preview Quiz">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.container}>
            <Text style={styles.heading}>🧩 Quiz Preview</Text>
            <Text style={styles.subheading}>
              Edit sentences, add image & voice clues.
            </Text>

            <View style={styles.countPill}>
              <Ionicons name="list" size={18} color="#111827" />
              <Text style={styles.countText}>
                {items.length} word{items.length === 1 ? "" : "s"}
              </Text>
            </View>

            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
              renderItem={renderRow}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No words passed in.</Text>
              }
            />

            {/* Footer actions */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.btn, styles.secondaryBtn]}
              >
                <Text style={[styles.btnText, { color: "#111827" }]}>
                  ← Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmCreate} style={styles.btn}>
                <Text style={styles.btnText}>Create Quiz ✅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit sentence modal */}
          <Modal
            visible={editVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setEditVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Edit Sentence</Text>
                <TextInput
                  value={draftSentence}
                  onChangeText={setDraftSentence}
                  placeholder="Type your custom sentence…"
                  placeholderTextColor="#9CA3AF"
                  style={styles.modalInput}
                  multiline
                />
                <View style={styles.modalRow}>
                  <TouchableOpacity
                    onPress={() => setEditVisible(false)}
                    style={[styles.btn, styles.secondaryBtn, { flex: 1 }]}
                  >
                    <Text style={[styles.btnText, { color: "#111827" }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onSaveEdit}
                    style={[styles.btn, { flex: 1 }]}
                  >
                    <Text style={styles.btnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
  },
  subheading: {
    marginTop: 6,
    fontSize: 16,
    textAlign: "center",
    color: "#374151",
    opacity: 0.9,
    marginBottom: 16,
  },
  countPill: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E0E7FF",
    marginBottom: 14,
  },
  countText: { fontWeight: "800", color: "#111827" },

  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  wordText: { color: "#fff", fontSize: 18, fontWeight: "800", maxWidth: "65%" },
  sentenceText: { color: "#fff", marginTop: 6, lineHeight: 20 },

  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  imageWrap: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: 160, height: 100, borderRadius: 10 },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  audioRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallButtonDisabled: { opacity: 0.5 },
  smallButtonText: { color: "#fff", fontWeight: "700" },

  footerRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 18,
  },
  btn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 150,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  secondaryBtn: { backgroundColor: "#F3F4F6" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  emptyText: { textAlign: "center", color: "#6b7280", marginTop: 20 },

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
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  modalInput: {
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
  },
  modalRow: { flexDirection: "row", gap: 10 },
});
