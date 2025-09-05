import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Picker } from "@react-native-picker/picker";

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
      const res = await axios.get<{ words: Word[] }>(
        "http://192.168.43.137:5000/api/words"
      );
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
      data = data.filter((w) =>
        w.word.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (showSelectedOnly) {
      data = data.filter((w) => selectedWords.includes(w._id));
    }

    data.sort((a, b) => {
      if (sortBy === "word") {
        return order === "asc"
          ? a.word.localeCompare(b.word)
          : b.word.localeCompare(a.word);
      } else {
        return order === "asc"
          ? a.complexity - b.complexity
          : b.complexity - a.complexity;
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
      recordEmotions,
    };

    try {
      await axios.post("http://192.168.43.137:5000/api/challenges", payload);
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
          const isSelected = singleSelect
            ? selectedPseudo === item._id
            : selectedWords.includes(item._id);

          return (
            <TouchableOpacity
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() =>
                singleSelect
                  ? selectPseudoWord(item._id)
                  : toggleWordSelection(item._id)
              }
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter plan title"
        value={title}
        onChangeText={setTitle}
      />

      {/* Word Selector */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setWordModalVisible(true)}
      >
        <Text>
          Select Words ({selectedWords.length} selected)
        </Text>
      </TouchableOpacity>

      {/* Pseudo Word Selector */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setPseudoModalVisible(true)}
      >
        <Text>
          {selectedPseudo
            ? `Pseudo Word Selected`
            : "Select a Pseudo Word"}
        </Text>
      </TouchableOpacity>

      {/* Emotions toggle */}
      <Text style={styles.infoText}>
        Enable this to use the camera and capture the child’s emotion
        when the pseudo word is displayed.
      </Text>
      <View style={styles.toggleRow}>
        <Text>Record Emotions:</Text>
        <Switch
          value={recordEmotions}
          onValueChange={setRecordEmotions}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Create Plan</Text>
      </TouchableOpacity>

      {/* Word Modal */}
      <Modal visible={wordModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.search}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />

          {/* Sorting */}
          <View style={styles.sortRow}>
            <Picker
              selectedValue={sortBy}
              onValueChange={(v) => setSortBy(v)}
              style={styles.picker}
            >
              <Picker.Item label="Word" value="word" />
              <Picker.Item label="Complexity" value="complexity" />
            </Picker>
            <Picker
              selectedValue={order}
              onValueChange={(v) => setOrder(v)}
              style={styles.picker}
            >
              <Picker.Item label="Ascending" value="asc" />
              <Picker.Item label="Descending" value="desc" />
            </Picker>
          </View>

          {/* Toggle filter */}
          <View style={styles.toggleRow}>
            <Text>Show Selected Only</Text>
            <Switch
              value={showSelectedOnly}
              onValueChange={setShowSelectedOnly}
            />
          </View>

          {renderWordList(false, false)}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setWordModalVisible(false)}
          >
            <Text style={styles.submitText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Pseudo Word Modal */}
      <Modal visible={pseudoModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.search}
            placeholder="Search pseudo words..."
            value={search}
            onChangeText={setSearch}
          />
          {renderWordList(true, true)}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setPseudoModalVisible(false)}
          >
            <Text style={styles.submitText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  selector: {
    padding: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: { marginVertical: 10, fontSize: 14, color: "#555" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  submitBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalContainer: { flex: 1, padding: 16, backgroundColor: "#fff" },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  picker: { flex: 1, height: 55 },
  item: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  word: { fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  doneBtn: {
    marginTop: 10,
    padding: 14,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignItems: "center",
  },
});
