import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
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

export default function CreateWordScreen() {
  const [word, setWord] = useState("");
  const [segmented, setSegmented] = useState("");
  const [complexity, setComplexity] = useState<number | null>(null);
  const [isPseudo, setIsPseudo] = useState(false);
  const [soundClip, setSoundClip] = useState<any | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalInput, setModalInput] = useState<string>("");

  // Words fetched from API
  const [words, setWords] = useState<{ word: string; complexity: number }[]>([]);

  const fetchWords = async () => {
      try {
        const response = await axios.get("/api/words/wc");
        setWords(response.data.words || []);
      } catch (error: any) {
        console.error(error.response?.data || error.message);
        Alert.alert("Error", "Failed to load words for complexity picker");
      }
    };
  // Fetch words from API
  useEffect(() => {
    fetchWords();
  }, []);
  
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

  // Save word using Axios
  const handleSave = async () => {
    if (!word || !segmented || complexity === null) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const response = await axios.post(
        "/api/words",
        {
          word,
          wordSegmented: segmented,
          complexity,
          isPseudo,
          // soundClip placeholder
        }
      );

      Alert.alert("Success", `Word "${response.data.word}" saved successfully`);

      // Reset form
      setWord("");
      setSegmented("");
      setComplexity(null);
      setIsPseudo(false);
      setSoundClip(null);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Failed to save word");
    }
  };

  const handleModalPress = () => {
    fetchWords();
    setModalVisible(true);
  }

  return (
    <View style={styles.container}>
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

      {/* Save */}
      <View style={{ marginTop: 30 }}>
        <Button title="Save Word" onPress={handleSave} />
      </View>

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
  container: { flex: 1, padding: 20, backgroundColor: "#fff", gap: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
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
