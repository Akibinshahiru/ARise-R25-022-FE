import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { Config } from "../../constants/config";

type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo: boolean;
  soundClipRef?: string | null;
};

// const ipAddress = process.env.API_BASE_URL;
const ipAddress = Config.DEVELOPMENT_API_URL;

export default function ViewWordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [wordData, setWordData] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [word, setWord] = useState("");
  const [segmented, setSegmented] = useState("");
  const [complexity, setComplexity] = useState<number | null>(null);
  const [isPseudo, setIsPseudo] = useState(false);
  const [soundClip, setSoundClip] = useState<any | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInput, setModalInput] = useState<string>("");
  const [words, setWords] = useState<{ word: string; complexity: number }[]>([]);

  // Parse the word data from params
  useEffect(() => {
    if (params.wordData) {
      try {
        const parsedData = JSON.parse(params.wordData as string) as Word;
        setWordData(parsedData);
        setWord(parsedData.word);
        setSegmented(parsedData.wordSegmented);
        setComplexity(parsedData.complexity);
        setIsPseudo(parsedData.isPseudo);
        setSoundClip(parsedData.soundClipRef || null);
      } catch (error) {
        console.error("Error parsing word data:", error);
        Alert.alert("Error", "Failed to load word data");
      } finally {
        setLoading(false);
      }
    }
  }, [params.wordData]);

  const fetchWords = async () => {
    try {
      const response = await axios.get(`${ipAddress}/api/words/wc`);
      setWords(response.data.words || []);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to load words for complexity picker");
    }
  };

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

  const pickAudio = () => {
    alert("Pick audio not implemented yet");
  };

  // Update word using Axios
  const handleUpdate = async () => {
    if (!wordData) return;
    if (!word || !segmented || complexity === null) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    try {
      setSaving(true);
      const response = await axios.put(`${ipAddress}/api/words/update/${wordData._id}`,
        { word, wordSegmented: segmented, complexity, isPseudo, soundClipRef: soundClip }
      );
      Alert.alert("Success", `Word "${response.data.word}" updated successfully`);
      setWordData(response.data);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to update word");
    } finally {
      setSaving(false);
    }
  };

  const handleModalPress = () => {
    fetchWords();
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!wordData) return;
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${wordData.word}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${ipAddress}/api/words/delete/${wordData._id}`);
              Alert.alert("Success", "Word deleted successfully");
              router.back();
            } catch (error: any) {
              console.error(error.response?.data || error.message);
              Alert.alert("Error", "Failed to delete word");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!wordData) {
    return (
      <View style={styles.center}>
        <Text>Word not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient colors={["#FFE6A7", "#FFB3C1"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blobTop} />
      <LinearGradient colors={["#B5E4FF", "#D7C3FF"] as const} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.blobBottom} />

      {/* Brand/header row */}
      <View style={styles.brandRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#6C2BD9" />
        </TouchableOpacity>
        <Text style={styles.brand}>ARise</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Ionicons name="trash" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={["#7C3AED", "#4F46E5"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Edit Word</Text>
            <Text style={styles.subtitle}>Update spelling, segmentation and level.</Text>
          </View>
          <View style={styles.emojiBadge}><Text style={styles.emojiText}>✏️</Text></View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Word</Text>
          <TextInput style={styles.input} placeholder="Enter Word" value={word} onChangeText={setWord} />

          <Text style={styles.label}>Segmented Word</Text>
          <TextInput style={styles.input} placeholder="e.g., sev-en" value={segmented} onChangeText={setSegmented} />

          <Text style={styles.label}>Complexity</Text>
          <TouchableOpacity onPress={handleModalPress} activeOpacity={0.9}>
            <View pointerEvents="none">
              <TextInput style={[styles.input, styles.inputReadonly]} placeholder="Pick Complexity" value={complexity !== null ? complexity.toString() : ""} editable={false} />
            </View>
          </TouchableOpacity>

          <View style={[styles.row, { marginTop: 4 }]}>
            <Text style={styles.labelInline}>Is Pseudo?</Text>
            <Switch value={isPseudo} onValueChange={setIsPseudo} />
          </View>

          {!isPseudo && (
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9} onPress={pickAudio}>
              <Ionicons name="musical-notes" size={18} color="#6C2BD9" />
              <Text style={styles.secondaryBtnText}>Attach Sound Clip</Text>
            </TouchableOpacity>
          )}

          {soundClip && (
            <View style={styles.soundClipContainer}>
              <Text style={styles.soundClipText}>Sound Clip: {soundClip}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} activeOpacity={0.9} onPress={handleUpdate} disabled={saving}>
            <LinearGradient colors={["#A78BFA", "#F472B6"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnGradient}>
              <Ionicons name="save" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{saving ? "Updating..." : "Update Word"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Complexity Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pick Complexity</Text>
            {/* Top list: <= complexity */}
            <ScrollView style={styles.list}>
              <Text style={styles.sectionTitle}>{"<= Complexity"}</Text>
              {lessOrEqual.map((item) => (
                <TouchableOpacity key={item.word} style={styles.item} onPress={() => setModalInput(item.complexity.toString())}>
                  <Text>{item.word}</Text>
                  <Text>({item.complexity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Center: numeric input + checkmark */}
            <View style={styles.centerSection}>
              <TextInput style={styles.inputModal} keyboardType="numeric" placeholder="Enter complexity" value={modalInput} onChangeText={setModalInput} />
              <TouchableOpacity style={styles.checkButton} onPress={handleConfirm}>
                <Ionicons name="checkmark" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom list: > complexity */}
            <ScrollView style={styles.list}>
              <Text style={styles.sectionTitle}>{"> Complexity"}</Text>
              {greater.map((item) => (
                <TouchableOpacity key={item.word} style={styles.item} onPress={() => setModalInput(item.complexity.toString())}>
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
  container: { padding: 20, paddingBottom: 40 },

  // Decorative blobs
  blobTop: { position: "absolute", top: -80, left: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },
  blobBottom: { position: "absolute", bottom: -70, right: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },

  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14 },
  brand: { fontSize: 18, fontWeight: "800", color: "#111827" },
  iconBtn: { padding: 6 },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  emojiText: { fontSize: 26 },

  formCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, gap: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  label: { fontSize: 13, fontWeight: "800", color: "#374151" },
  labelInline: { fontSize: 14, fontWeight: "800", color: "#374151" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, fontSize: 15 },
  inputReadonly: { color: "#111" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  secondaryBtn: { marginTop: 8, backgroundColor: "#F3E8FF", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", flexDirection: "row", gap: 8 },
  secondaryBtnText: { color: "#6C2BD9", fontSize: 14, fontWeight: "800" },

  primaryBtn: { marginTop: 12, borderRadius: 14, overflow: "hidden" },
  primaryBtnGradient: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  soundClipContainer: { padding: 12, backgroundColor: "#F3F4F6", borderRadius: 12, marginTop: 8 },
  soundClipText: { fontSize: 14, color: "#374151" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "90%", maxHeight: "85%", padding: 16, borderRadius: 16 },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6, color: "#111827" },
  list: { maxHeight: 150, marginVertical: 8 },
  sectionTitle: { fontWeight: "800", marginBottom: 6, color: "#374151" },
  item: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#F3F4F6" },
  centerSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 12 },
  inputModal: { borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", borderRadius: 10, padding: 10, flex: 1, marginRight: 10 },
  checkButton: { backgroundColor: "#7C3AED", borderRadius: 10, padding: 10, justifyContent: "center", alignItems: "center" },
  modalCloseBtn: { marginTop: 8, alignSelf: "flex-end", backgroundColor: "#F3F4F6", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  modalCloseText: { fontWeight: "800", color: "#374151" },
});

