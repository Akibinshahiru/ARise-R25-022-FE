import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

// Types
type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo: boolean;
  soundClipRef?: string | null;
};

export default function CreatePlanScreen() {
  const [title, setTitle] = useState("");
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected items
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [selectedPseudo, setSelectedPseudo] = useState<string | null>(null);
  const [recordEmotions, setRecordEmotions] = useState(false);
console.log(recordEmotions);

  // Modal controls
  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [pseudoModalVisible, setPseudoModalVisible] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"word" | "complexity">("word");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{ words: Word[] }>(`${ipAddress}/api/words`);
      setWords(res.data.words);
    } catch (err: any) {
      console.error("Error fetching words:", err.message);
      alert("Failed to fetch words.");
    } finally {
      setLoading(false);
    }
  };

  const toggleWordSelection = (id: string) => {
    if (selectedWords.includes(id)) {
      setSelectedWords(selectedWords.filter((w) => w !== id));
    } else {
      setSelectedWords([...selectedWords, id]);
    }
  };

  const selectPseudoWord = (id: string) => {
    setSelectedPseudo(id === selectedPseudo ? null : id);
  };

  const applyFilters = (list: Word[], isPseudoOnly = false) => {
    let data = [...list];

    if (isPseudoOnly) {
      data = data.filter((w) => w.isPseudo);
    }

    if (search.trim()) {
      data = data.filter((w) => w.word.toLowerCase().includes(search.toLowerCase()));
    }

    if (showSelectedOnly) {
      data = data.filter((w) => selectedWords.includes(w._id));
    }

    data.sort((a, b) => {
      if (sortBy === "word") {
        return order === "asc" ? a.word.localeCompare(b.word) : b.word.localeCompare(a.word);
      } else {
        return order === "asc" ? a.complexity - b.complexity : b.complexity - a.complexity;
      }
    });

    return data;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a plan title.");
      return;
    }
    if (selectedWords.length === 0) {
      alert("Please select at least one word.");
      return;
    }
    if (!selectedPseudo) {
      alert("Please select a pseudo word.");
      return;
    }

    const payload = {
      title,
      words: selectedWords,
      assignees: [
        { uid: "user123", username: "alice" },
        { uid: "user456", username: "bob" },
      ],
      createdBy: { uid: "admin001", username: "admin" },
      pseudoWord: selectedPseudo,
      recordEmotion: recordEmotions,
    };

    try {
      console.log(payload);
      
      await axios.post(`${ipAddress}/api/challenges`, payload);
      alert("Plan created successfully!");
      setTitle("");
      setSelectedWords([]);
      setSelectedPseudo(null);
      setRecordEmotions(false);
    } catch (err: any) {
      console.error("Error creating plan:", err.message);
      alert("Failed to create plan.");
    }
  };

  // Reusable modal list
  const renderWordList = (isPseudoOnly = false, singleSelect = false) => {
    const filtered = applyFilters(words, isPseudoOnly);

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isSelected = singleSelect ? selectedPseudo === item._id : selectedWords.includes(item._id);

          return (
            <TouchableOpacity
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => (singleSelect ? selectPseudoWord(item._id) : toggleWordSelection(item._id))}
            >
              <Text style={styles.word}>{item.word}</Text>
              <Text>Segmented: {item.wordSegmented}</Text>
              <Text>Complexity: {item.complexity}</Text>
              <Text>Pseudo: {item.isPseudo ? "Yes" : "No"}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No words to display</Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient colors={["#FFE6A7", "#FFB3C1"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blobTop} />
      <LinearGradient colors={["#B5E4FF", "#D7C3FF"] as const} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.blobBottom} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand + hero */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>ARise</Text>
          <Ionicons name="calendar" size={22} color="#6C2BD9" />
        </View>
        <LinearGradient colors={["#7C3AED", "#4F46E5"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Create Plan</Text>
            <Text style={styles.subtitle}>Pick words and set a fun challenge.</Text>
          </View>
          <View style={styles.emojiBadge}><Text style={styles.emojiText}>🗓️</Text></View>
        </LinearGradient>

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Plan Title</Text>
          <TextInput style={styles.input} placeholder="Enter plan title" value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Words</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setWordModalVisible(true)}>
            <Ionicons name="list" size={18} color="#6C2BD9" />
            <Text style={styles.selectorText}>Select Words ({selectedWords.length} selected)</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Pseudo Word</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setPseudoModalVisible(true)}>
            <Ionicons name="sparkles" size={18} color="#6C2BD9" />
            <Text style={styles.selectorText}>{selectedPseudo ? `Pseudo Word Selected` : "Select a Pseudo Word"}</Text>
          </TouchableOpacity>

          {/* Emotions toggle */}
          <Text style={styles.infoText}>Enable this to use the camera and capture the child's emotion when the pseudo word is displayed.</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.labelInline}>Record Emotions</Text>
            <Switch value={recordEmotions} onValueChange={setRecordEmotions} />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
            <LinearGradient colors={["#A78BFA", "#F472B6"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnGradient}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Create Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Word Modal */}
      <Modal visible={wordModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={setSearch} />

          {/* Sorting */}
          <View style={styles.sortRow}>
            <Picker selectedValue={sortBy} onValueChange={(v) => setSortBy(v)} style={styles.picker}>
              <Picker.Item label="Word" value="word" />
              <Picker.Item label="Complexity" value="complexity" />
            </Picker>
            <Picker selectedValue={order} onValueChange={(v) => setOrder(v)} style={styles.picker}>
              <Picker.Item label="Ascending" value="asc" />
              <Picker.Item label="Descending" value="desc" />
            </Picker>
          </View>

          {/* Toggle filter */}
          <View style={styles.toggleRow}>
            <Text>Show Selected Only</Text>
            <Switch value={showSelectedOnly} onValueChange={setShowSelectedOnly} />
          </View>

          {renderWordList(false, false)}

          <TouchableOpacity style={styles.doneBtn} onPress={() => setWordModalVisible(false)}>
            <Text style={styles.submitText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Pseudo Word Modal */}
      <Modal visible={pseudoModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput style={styles.search} placeholder="Search pseudo words..." value={search} onChangeText={setSearch} />
          {renderWordList(true, true)}

          <TouchableOpacity style={styles.doneBtn} onPress={() => setPseudoModalVisible(false)}>
            <Text style={styles.submitText}>Done</Text>
          </TouchableOpacity>
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

  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 22, fontWeight: "800", color: "#111827" },
  heroCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 18, marginTop: 10, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  emojiText: { fontSize: 26 },

  formCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, gap: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  label: { fontSize: 13, fontWeight: "800", color: "#374151" },
  labelInline: { fontSize: 14, fontWeight: "800", color: "#374151" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, fontSize: 15 },
  selector: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F3E8FF", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12 },
  selectorText: { color: "#6C2BD9", fontWeight: "800" },
  infoText: { marginVertical: 10, fontSize: 13, color: "#6B7280" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },

  primaryBtn: { marginTop: 12, borderRadius: 14, overflow: "hidden" },
  primaryBtnGradient: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Modal + list styling (kept close to original)
  modalContainer: { flex: 1, padding: 16, backgroundColor: "#fff" },
  search: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 12 },
  sortRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  picker: { flex: 1, height: 55 },
  item: { padding: 12, marginVertical: 6, backgroundColor: "#f9f9f9", borderRadius: 8, borderWidth: 1, borderColor: "#eee" },
  itemSelected: { backgroundColor: "#dbeafe", borderColor: "#3b82f6" },
  word: { fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  doneBtn: { marginTop: 10, padding: 14, backgroundColor: "#3b82f6", borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
