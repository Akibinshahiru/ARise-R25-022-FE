import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo: boolean;
  soundClipRef?: string | null;
};

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
      const response = await axios.get("http://192.168.43.137:5000/api/words/wc");
      setWords(response.data.words || []);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to load words for complexity picker");
    }
  };

  const inputNum = Number(modalInput);
  const lessOrEqual = words.filter(
    (w) => !isNaN(inputNum) && w.complexity <= inputNum
  );
  const greater = words.filter(
    (w) => !isNaN(inputNum) && w.complexity > inputNum
  );

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
      const response = await axios.put(
        `http://192.168.43.137:5000/api/words/update/${wordData._id}`,
        {
          word,
          wordSegmented: segmented,
          complexity,
          isPseudo,
          soundClipRef: soundClip,
        }
      );

      Alert.alert("Success", `Word "${response.data.word}" updated successfully`);
      
      // Update local state with new data
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
              await axios.delete(`http://192.168.43.137:5000/api/words/delete/${wordData._id}`);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Word</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Word */}
        <TextInput
          style={styles.input}
          placeholder="Enter Word"
          value={word}
          onChangeText={setWord}
        />

        {/* Segmented Word */}
        <TextInput
          style={styles.input}
          placeholder="Segmented Word (e.g., sev-en)"
          value={segmented}
          onChangeText={setSegmented}
        />

        {/* Complexity Picker */}
        <TouchableOpacity onPress={handleModalPress}>
          <TextInput
            style={[styles.input, { color: "#111" }]}
            placeholder="Pick Complexity"
            value={complexity !== null ? complexity.toString() : ""}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Pseudo toggle */}
        <View style={styles.row}>
          <Text>Is Pseudo?</Text>
          <Switch value={isPseudo} onValueChange={setIsPseudo} />
        </View>

        {/* Attach audio */}
        {!isPseudo && <Button title="Attach Sound Clip" onPress={pickAudio} />}

        {/* Sound clip reference (if exists) */}
        {soundClip && (
          <View style={styles.soundClipContainer}>
            <Text style={styles.soundClipText}>Sound Clip: {soundClip}</Text>
          </View>
        )}

        {/* Save */}
        <View style={{ marginTop: 30, marginBottom: 20 }}>
          <Button 
            title={saving ? "Updating..." : "Update Word"} 
            onPress={handleUpdate} 
            disabled={saving}
          />
        </View>
      </ScrollView>

      {/* Complexity Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Top list: ≤ complexity */}
            <ScrollView style={styles.list}>
              <Text style={styles.sectionTitle}>≤ Complexity</Text>
              {lessOrEqual.map((item) => (
                <TouchableOpacity
                  key={item.word}
                  style={styles.item}
                  onPress={() => setModalInput(item.complexity.toString())}
                >
                  <Text>{item.word}</Text>
                  <Text>({item.complexity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Center: numeric input + checkmark */}
            <View style={styles.centerSection}>
              <TextInput
                style={styles.inputModal}
                keyboardType="numeric"
                placeholder="Enter complexity"
                value={modalInput}
                onChangeText={setModalInput}
              />
              <TouchableOpacity
                style={styles.checkButton}
                onPress={handleConfirm}
              >
                <Ionicons name="checkmark" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom list: > complexity */}
            <ScrollView style={styles.list}>
              <Text style={styles.sectionTitle}>{"> Complexity"}</Text>
              {greater.map((item) => (
                <TouchableOpacity
                  key={item.word}
                  style={styles.item}
                  onPress={() => setModalInput(item.complexity.toString())}
                >
                  <Text>{item.word}</Text>
                  <Text>({item.complexity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  soundClipContainer: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
  },
  soundClipText: {
    fontSize: 14,
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    maxHeight: "85%",
    padding: 16,
    borderRadius: 12,
  },
  list: { maxHeight: 150, marginVertical: 8 },
  sectionTitle: { fontWeight: "bold", marginBottom: 6 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  centerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  inputModal: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginRight: 10,
  },
  checkButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});